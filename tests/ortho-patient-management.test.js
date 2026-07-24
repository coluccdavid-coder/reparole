// =====================================================================
//  TESTS — VRAI BUG get_patient + rattachement/création de patient +
//  bilan enrichi (v6.93)
//  ---------------------------------------------------------------------
//  Retour utilisateur (capture d'écran) : coller un code aidant dans
//  "Rattacher un patient" affichait l'erreur SQL brute "violates
//  foreign key constraint". Cause réelle trouvée : get_patient()
//  utilisait "returns patients" (ligne composite unique), qui renvoie
//  une ligne remplie de NULL — pas aucune ligne — quand rien ne
//  correspond. Ce même bug touchait potentiellement la CONNEXION
//  PATIENT elle-même (js/app.js login()), pas seulement le
//  rattachement côté orthophoniste.
//
//  Vérifie aussi les deux nouvelles fonctionnalités demandées :
//  création directe d'une fiche patient, et bilan PDF enrichi (profil
//  clinique, notes, historique complet, noms d'exercice lisibles).
//
//  Lancer : node tests/ortho-patient-management.test.js
// =====================================================================

const { JSDOM } = require('jsdom');
const fs = require('fs');
const path = require('path');
const assert = require('assert');

const ROOT = path.join(__dirname, '..');
let passed = 0, failed = 0;
async function test(name, fn){
  try{ await fn(); console.log('  ✔', name); passed++; }
  catch(e){ console.log('  ✘', name, '—', e.message); failed++; }
}

async function main(){

console.log('sql/schema.sql — VRAI BUG corrigé : get_patient()');

await test('get_patient() utilise "returns setof patients" (pas "returns patients")', ()=>{
  const sql = fs.readFileSync(path.join(ROOT, 'sql/schema.sql'), 'utf8');
  // v6.142 : VRAI BUG DE TEST CORRIGÉ, trouvé en auditant — cherchait
  // juste "function get_patient(" (indexOf, première occurrence), qui
  // matchait en fait un commentaire mentionnant ce nom de fonction en
  // prose (v6.135, "réexécuter ensuite \"create or replace function
  // get_patient(...)\" est refusé..."), AVANT la vraie définition. Ce
  // test échouait donc depuis la v6.135 sans que personne ne le sache
  // : le fichier n'était pas non plus enregistré dans package.json
  // (corrigé aussi, voir plus bas). Cherche maintenant explicitement
  // la vraie instruction SQL, pas juste le nom de la fonction.
  const idx = sql.indexOf('create or replace function get_patient(p_code text)');
  assert.ok(idx !== -1, 'la définition de get_patient() est introuvable');
  const fnDef = sql.slice(idx, idx + 300);
  assert.ok(/returns setof patients/.test(fnDef), 'doit renvoyer "setof patients" pour éviter la ligne de NULL fantôme sur un code inexistant');
  assert.ok(!/returns patients language/.test(fnDef), 'ne doit plus utiliser "returns patients" (ligne composite unique, bugguée)');
});

console.log('\ndashboard-ortho.html / js/dashboard-ortho.js — messages d\'erreur');

await test('OrthoApp.assign() détecte un code aidant collé par erreur (préfixe "a-"), sans appeler le serveur', async ()=>{
  const html = fs.readFileSync(path.join(ROOT, 'dashboard-ortho.html'), 'utf8');
  const dom = new JSDOM(html, { url:'http://localhost/', runScripts:'outside-only', resources:'usable', pretendToBeVisual:true });
  const scripts = [...dom.window.document.querySelectorAll('script[src]')].map(s=>s.getAttribute('src'));
  for(const src of scripts){
    let code = fs.readFileSync(path.join(ROOT, src), 'utf8');
    if(src === 'js/storage.js'){
      code = code.replace(/const SUPABASE_URL = "[^"]*";/, 'const SUPABASE_URL = "";')
                  .replace(/const SUPABASE_ANON_KEY = "[^"]*";/, 'const SUPABASE_ANON_KEY = "";');
    }
    dom.window.eval(code);
    // v6.247 : les 14 langues vivent dans js/i18n/<code>.js et les pages
    // n'en chargent qu'une. En test, on les charge toutes.
    if(typeof src !== 'undefined' && src === 'js/i18n.js') fs.readdirSync(path.join(ROOT, 'js/i18n'))
      .forEach(lf => dom.window.eval(fs.readFileSync(path.join(ROOT, 'js/i18n', lf), 'utf8')));
  }
  dom.window.eval("Prefs.load();");
  dom.window.eval("window.orthoCode = 'ortho-1'; window.patients = []; window.orthoPlan = 'pro';");
  let assignPatientCalled = false;
  dom.window.eval("ReParoleStore.assignPatient = async () => { window.__called = true; return {}; };");
  dom.window.document.getElementById('assign-code').value = 'a-d100f8c1c78b';
  await dom.window.OrthoApp.assign();
  const msg = dom.window.document.getElementById('assign-msg').textContent;
  assert.ok(msg.length > 0 && !/violates|constraint|foreign key/i.test(msg), `message clair attendu (pas d'erreur SQL brute), reçu : ${msg}`);
  assert.strictEqual(dom.window.__called, undefined, 'ne doit pas appeler le serveur pour un code visiblement aidant');
});

await test('OrthoApp.assign() : erreur serveur quelconque -> message générique, jamais le texte brut', async ()=>{
  const html = fs.readFileSync(path.join(ROOT, 'dashboard-ortho.html'), 'utf8');
  const dom = new JSDOM(html, { url:'http://localhost/', runScripts:'outside-only', resources:'usable', pretendToBeVisual:true });
  const scripts = [...dom.window.document.querySelectorAll('script[src]')].map(s=>s.getAttribute('src'));
  for(const src of scripts){
    let code = fs.readFileSync(path.join(ROOT, src), 'utf8');
    if(src === 'js/storage.js'){
      code = code.replace(/const SUPABASE_URL = "[^"]*";/, 'const SUPABASE_URL = "";')
                  .replace(/const SUPABASE_ANON_KEY = "[^"]*";/, 'const SUPABASE_ANON_KEY = "";');
    }
    dom.window.eval(code);
    // v6.247 : les 14 langues vivent dans js/i18n/<code>.js et les pages
    // n'en chargent qu'une. En test, on les charge toutes.
    if(typeof src !== 'undefined' && src === 'js/i18n.js') fs.readdirSync(path.join(ROOT, 'js/i18n'))
      .forEach(lf => dom.window.eval(fs.readFileSync(path.join(ROOT, 'js/i18n', lf), 'utf8')));
  }
  dom.window.eval("Prefs.load();");
  dom.window.eval("window.orthoCode = 'ortho-1'; window.patients = []; window.orthoPlan = 'pro';");
  dom.window.eval("ReParoleStore.assignPatient = async () => ({ error:{ message:'insert or update on table \"patient_assignments\" violates foreign key constraint' } });");
  dom.window.eval("window.OrthoApp.refreshList = async () => {};");
  dom.window.document.getElementById('assign-code').value = 'p-unknowncode123';
  await dom.window.OrthoApp.assign();
  const msg = dom.window.document.getElementById('assign-msg').textContent;
  assert.ok(!/violates|constraint|foreign key/i.test(msg), `l'erreur SQL brute ne doit plus jamais s'afficher, reçu : ${msg}`);
});

console.log('\nNouveau : créer une fiche patient directement');

function loadOrthoWithFakeStore(){
  const html = fs.readFileSync(path.join(ROOT, 'dashboard-ortho.html'), 'utf8');
  const dom = new JSDOM(html, { url:'http://localhost/', runScripts:'outside-only', resources:'usable', pretendToBeVisual:true });
  const scripts = [...dom.window.document.querySelectorAll('script[src]')].map(s=>s.getAttribute('src'));
  for(const src of scripts){
    let code = fs.readFileSync(path.join(ROOT, src), 'utf8');
    if(src === 'js/storage.js'){
      code = code.replace(/const SUPABASE_URL = "[^"]*";/, 'const SUPABASE_URL = "";')
                  .replace(/const SUPABASE_ANON_KEY = "[^"]*";/, 'const SUPABASE_ANON_KEY = "";');
    }
    // v6.93 : orthoCode/patients/orthoPlan sont des `let` de haut niveau
    // dans js/dashboard-ortho.js — pas des propriétés de window, donc
    // "window.orthoPlan = ..." après coup ne les affecte pas (même
    // piège que déjà documenté ailleurs pour Store/user/current). On
    // ajoute donc des fonctions de test DANS ce même eval() pour
    // pouvoir les modifier depuis les vraies liaisons lexicales.
    if(src === 'js/dashboard-ortho.js'){
      code += `
        window.__testSetOrthoCode = (c)=>{ orthoCode = c; };
        window.__testSetPatients = (p)=>{ patients = p; };
        window.__testSetOrthoPlan = (p)=>{ orthoPlan = p; };
      `;
    }
    dom.window.eval(code);
    // v6.247 : les 14 langues vivent dans js/i18n/<code>.js et les pages
    // n'en chargent qu'une. En test, on les charge toutes.
    if(typeof src !== 'undefined' && src === 'js/i18n.js') fs.readdirSync(path.join(ROOT, 'js/i18n'))
      .forEach(lf => dom.window.eval(fs.readFileSync(path.join(ROOT, 'js/i18n', lf), 'utf8')));
  }
  dom.window.eval("Prefs.load(); __testSetOrthoCode('ortho-1'); __testSetPatients([]); __testSetOrthoPlan('pro');");
  return dom;
}

await test('nom vide -> message d\'erreur, aucune fiche créée', async ()=>{
  const dom = loadOrthoWithFakeStore();
  let saveCalled = false;
  dom.window.eval("ReParoleStore.savePatient = async () => { window.__saved = true; };");
  await dom.window.OrthoApp.createPatient();
  const msg = dom.window.document.getElementById('create-patient-msg').textContent;
  assert.ok(msg.length > 0);
  assert.strictEqual(dom.window.__saved, undefined);
});

await test('nom renseigné -> génère un code, crée la fiche, l\'attache, et l\'affiche pour transmission', async ()=>{
  const dom = loadOrthoWithFakeStore();
  dom.window.eval(`
    window.__savedArgs = null;
    ReParoleStore.savePatient = async (code, p) => { window.__savedArgs = {code, p}; };
    ReParoleStore.assignPatient = async (orthoCode, code) => ({});
    window.OrthoApp.refreshList = async () => {};
  `);
  dom.window.document.getElementById('create-patient-name').value = 'Marie';
  await dom.window.OrthoApp.createPatient();
  assert.ok(dom.window.__savedArgs, 'savePatient doit être appelé');
  assert.strictEqual(dom.window.__savedArgs.p.name, 'Marie');
  assert.ok(dom.window.__savedArgs.code.startsWith('p-'), 'doit utiliser le même format de code que la création côté patient');
  const resultEl = dom.window.document.getElementById('create-patient-result');
  assert.notStrictEqual(resultEl.style.display, 'none', 'le code généré doit être affiché pour transmission au patient');
  assert.strictEqual(dom.window.document.getElementById('create-patient-code').textContent, dom.window.__savedArgs.code);
});

await test('respecte la limite gratuite de patients, comme pour le rattachement', async ()=>{
  const dom = loadOrthoWithFakeStore();
  // v6.142 : VRAI BUG DE TEST CORRIGÉ, trouvé en auditant — utilisait
  // "window.orthoPlan = ..." / "window.patients = ..." directement,
  // qui ne touchent PAS les vraies variables lexicales lues par
  // createPatient() (voir le commentaire dans loadOrthoWithFakeStore()
  // ci-dessus, qui documentait déjà ce piège et fournissait les bons
  // helpers — __testSetOrthoPlan/__testSetPatients — sans que ce test
  // précis les utilise). Résultat concret : la vraie variable
  // "patients" restait à sa valeur par défaut ([], longueur 0), donc
  // la limite (patients.length>=3) ne se déclenchait jamais et
  // createPatient() appelait bien savePatient() — le test échouait
  // donc pour de bon, mais jamais repéré : ce fichier entier n'était
  // pas non plus enregistré dans package.json (corrigé aussi).
  // Corrigé pour utiliser les bons helpers.
  dom.window.eval("__testSetOrthoPlan('free'); __testSetPatients([1,2,3]);"); // déjà à la limite (ORTHO_FREE_PATIENT_LIMIT = 3)
  dom.window.eval("ReParoleStore.savePatient = async () => { window.__saved = true; };");
  dom.window.document.getElementById('create-patient-name').value = 'Jean';
  await dom.window.OrthoApp.createPatient();
  assert.strictEqual(dom.window.__saved, undefined, 'ne doit pas créer de fiche au-delà de la limite gratuite');
});

console.log('\nBilan PDF enrichi (report.html)');

await test('report.html contient bien les nouvelles sections (profil clinique, notes, historique complet)', ()=>{
  const html = fs.readFileSync(path.join(ROOT, 'report.html'), 'utf8');
  assert.ok(html.includes('Profil clinique déclaré'));
  assert.ok(html.includes('Notes cliniques'));
  assert.ok(html.includes('Historique complet des séances'), 'ne doit plus se limiter aux 20 dernières séances');
  assert.ok(!html.includes('hist.slice(-20)'), 'la limite artificielle à 20 séances doit avoir disparu');
  assert.ok(html.includes('EX_TYPE_NAMES'), 'les types d\'exercice doivent être affichés de façon lisible');
});

await test('report.html : le type d\'exercice passe bien par escapeHTML() (même risque XSS que déjà corrigé ailleurs en v6.83)', ()=>{
  const html = fs.readFileSync(path.join(ROOT, 'report.html'), 'utf8');
  assert.ok(/escapeHTML\(EX_TYPE_NAMES\[s\.type\]\|\|s\.type\)/.test(html), 's.type doit être échappé, comme le reste du contenu utilisateur de cette page');
});

console.log(`\n${passed} test(s) réussi(s), ${failed} échec(s).`);
if(failed > 0) process.exit(1);

}

main();
