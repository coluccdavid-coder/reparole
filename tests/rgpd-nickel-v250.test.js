// =====================================================================
//  TESTS — v6.250 : RGPD « NICKEL DE PARTOUT »
//  ---------------------------------------------------------------------
//  Demandé par le propriétaire. L'audit de la chaîne complète a trouvé
//  et corrigé :
//
//  1. Le droit à l'effacement était INCOMPLET : delete_patient_account
//     laissait le code patient EN CLAIR dans login_events, et son
//     hachage dans patient_connections. « Supprimer mon compte » qui ne
//     supprime pas tout est un mensonge fait au patient.
//  2. client_errors n'avait AUCUNE purge (les user_agent — donnée
//     personnelle — s'accumulaient sans limite).
//  3. L'export « complet » ne l'était pas : favoris et métadonnées des
//     enregistrements de voix manquaient.
//  4. Les pages légales décrivaient l'état d'hier : « durée à définir »
//     alors que des purges existent, et une section Google Fonts
//     décrivant un transfert d'IP supprimé en v6.249.
//
//  Lancer : node tests/rgpd-nickel-v250.test.js
// =====================================================================

const fs = require('fs');
const path = require('path');
const assert = require('assert');

const ROOT = path.join(__dirname, '..');
let passed = 0, failed = 0;
async function test(name, fn){
  try{ await fn(); console.log('  ✔', name); passed++; }
  catch(e){ console.log('  ✘', name, '—', e.message); failed++; }
}

const SCHEMA = fs.readFileSync(path.join(ROOT, 'sql/schema.sql'), 'utf8');
const SETTINGS = fs.readFileSync(path.join(ROOT, 'sql/app-settings.sql'), 'utf8');
const STORAGE = fs.readFileSync(path.join(ROOT, 'js/storage.js'), 'utf8');
const APP = fs.readFileSync(path.join(ROOT, 'js/app.js'), 'utf8');
const ADMIN_JS = fs.readFileSync(path.join(ROOT, 'js/admin.js'), 'utf8');
const ADMIN_HTML = fs.readFileSync(path.join(ROOT, 'admin.html'), 'utf8');
const CONFID = fs.readFileSync(path.join(ROOT, 'confidentialite.html'), 'utf8');
const COOKIES = fs.readFileSync(path.join(ROOT, 'politique-cookies.html'), 'utf8');

function fonctionSQL(nom){
  const i = SCHEMA.indexOf(`create or replace function ${nom}`);
  assert.ok(i !== -1, `${nom} introuvable dans schema.sql`);
  return SCHEMA.slice(i, SCHEMA.indexOf('$$;', i));
}

async function main(){

console.log('Droit à l\'effacement — rien ne survit à la suppression du compte');

await test('delete_patient_account efface login_events (le code y était EN CLAIR)', ()=>{
  const fn = fonctionSQL('delete_patient_account');
  assert.ok(/delete from login_events where code = p_code/.test(fn),
    'le code patient resterait en clair dans l\'historique de connexion après « suppression »');
});

await test('delete_patient_account efface patient_connections (via le MÊME hachage que l\'insertion)', ()=>{
  const fn = fonctionSQL('delete_patient_account');
  assert.ok(/delete from patient_connections/.test(fn), 'les statistiques de connexion survivraient');
  assert.ok(/encode\(digest\(p_code, 'sha256'\), 'hex'\)/.test(fn),
    'le hachage de suppression doit être STRICTEMENT celui de log_patient_connection, sinon rien n\'est trouvé');
  // et l'insertion utilise bien ce même hachage
  const ins = fonctionSQL('log_patient_connection');
  assert.ok(/encode\(digest\(p_code, 'sha256'\), 'hex'\)/.test(ins), 'l\'insertion a changé de hachage — les deux doivent bouger ensemble');
});

await test('chaque table du schéma portant le code patient est couverte : cascade OU suppression explicite', ()=>{
  const tables = [...SCHEMA.matchAll(/create table(?: if not exists)? +([a-z_]+) *\(([^;]*?)\n\);/gs)];
  const fn = fonctionSQL('delete_patient_account');
  // `orthophonists` et `admins` ont une colonne `code` qui est LEUR propre
  // identifiant (compte pro / droit admin), pas celui d'un patient : leur
  // survie à la suppression d'un compte patient est normale.
  const codesPropres = ['orthophonists', 'admins'];
  const orphelines = [];
  for(const [, nom, corps] of tables){
    if(nom === 'patients' || codesPropres.includes(nom)) continue;
    const porteLeCode = /\bcode\s+text/.test(corps);
    const cascade = corps.includes('references patients(code) on delete cascade');
    const explicite = new RegExp(`delete from ${nom}\\b`).test(fn);
    if(porteLeCode && !cascade && !explicite) orphelines.push(nom);
  }
  assert.strictEqual(orphelines.length, 0,
    `données patient survivant à la suppression : ${orphelines.join(', ')}`);
});

await test('la fonction reste rejouable (drop function avant create — leçon 42P13)', ()=>{
  assert.ok(/drop function if exists delete_patient_account\(text\);/.test(SCHEMA));
});

console.log('\nPurge des erreurs techniques — les user_agent ne s\'accumulent plus sans limite');

await test('admin_purge_client_errors existe : gatée admin, durées bornées 7/14/30, rejouable', ()=>{
  const i = SETTINGS.indexOf('create or replace function admin_purge_client_errors');
  assert.ok(i !== -1, 'fonction absente de app-settings.sql');
  const fn = SETTINGS.slice(i, SETTINGS.indexOf('$$;', i));
  assert.ok(/from admins a where a\.code = auth\.uid\(\)::text/.test(fn), 'la garde admin manque');
  assert.ok(/p_days not in \(7, 14, 30\)/.test(fn), 'les durées doivent être bornées');
  assert.ok(SETTINGS.includes('drop function if exists admin_purge_client_errors(integer);'), 'drop manquant (rejouabilité)');
});

await test('la chaîne complète est branchée : bouton admin -> AdminPanel -> Store -> RPC', ()=>{
  assert.ok(/purge-errors-btn/.test(ADMIN_HTML) && /AdminPanel\.purgeClientErrors\(\)/.test(ADMIN_HTML), 'bouton absent d\'admin.html');
  assert.ok(/async purgeClientErrors\(\)/.test(ADMIN_JS), 'gestionnaire absent d\'admin.js');
  assert.ok(/btn\.dataset\.confirm/.test(ADMIN_JS.slice(ADMIN_JS.indexOf('async purgeClientErrors'))),
    'le double clic de confirmation (jamais de confirm() natif) doit être conservé');
  assert.ok(/rpc\('admin_purge_client_errors', \{ p_days: days \}\)/.test(STORAGE), 'pont RPC absent de storage.js');
});

console.log('\nExport — réellement complet');

await test('l\'export inclut les favoris et les métadonnées des enregistrements de voix', ()=>{
  const bloc = APP.slice(APP.indexOf('async function exportMyData'), APP.indexOf('async function exportMyData') + 1600);
  assert.ok(/loadFavoriteWords/.test(bloc), 'favoris absents de l\'export');
  assert.ok(/listVoiceRecordings/.test(bloc), 'enregistrements de voix absents de l\'export');
  assert.ok(/favorites, voiceRecordings/.test(bloc), 'les deux champs doivent être dans le bundle exporté');
});

console.log('\nPages légales — elles décrivent le code d\'AUJOURD\'HUI');

await test('confidentialite.html : plus aucun champ « à définir » sur les durées, et les durées réelles y sont', ()=>{
  assert.ok(!/Durée à définir/.test(CONFID), 'placeholder de durée encore présent');
  assert.ok(/30 jours/.test(CONFID), 'la purge des voix à 30 jours doit être annoncée');
  assert.ok(/Mode navigateur/.test(CONFID), 'le mode sans collecte serveur doit être présenté (droit d\'opposition le plus fort)');
});

await test('confidentialite.html : la portée exacte des deux boutons de droits est décrite', ()=>{
  assert.ok(/favoris/.test(CONFID), 'l\'export doit annoncer les favoris');
  assert.ok(/historique\s+technique de connexion/.test(CONFID.replace(/\n\s*/g,' ')) || /historique technique de connexion/.test(CONFID),
    'la suppression doit annoncer qu\'elle couvre AUSSI les traces techniques (vrai depuis v6.250)');
});

await test('politique-cookies.html : ne décrit plus le chargement Google Fonts supprimé en v6.249', ()=>{
  assert.ok(!/chargées depuis les serveurs\s+de Google Fonts/.test(COOKIES.replace(/\n\s*/g,' ')) &&
            !/chargées depuis les serveurs de Google Fonts/.test(COOKIES),
    'la page décrit encore un transfert d\'IP qui n\'existe plus');
  assert.ok(/hébergées\s+<b>directement sur ce site<\/b>/.test(COOKIES.replace(/\n\s*/g,' ')) || /directement sur ce site/.test(COOKIES),
    'la page doit annoncer l\'auto-hébergement');
});

await test('docs/RGPD.md : les deux lacunes corrigées sont marquées faites, les vraies restent', ()=>{
  const doc = fs.readFileSync(path.join(ROOT, 'docs/RGPD.md'), 'utf8');
  assert.ok(/~~`confidentialite\.html` à mettre à jour~~/.test(doc));
  assert.ok(/~~`client_errors` sans purge~~/.test(doc));
  assert.ok(/HDS/.test(doc) && /Sauvegardes Supabase/.test(doc), 'les bloquants réels (HDS, sauvegardes) doivent rester listés');
});

console.log(`\n${passed} test(s) réussi(s), ${failed} échec(s).`);
if(failed > 0) process.exit(1);
}

main();
