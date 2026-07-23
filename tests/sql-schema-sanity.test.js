// =====================================================================
//  TESTS — sql/schema.sql : cohérence de quelques points sensibles (v6.154)
//  ---------------------------------------------------------------------
//  Vérifications textuelles simples sur le fichier SQL — pas d'exécution
//  réelle contre une base (pas de serveur Postgres dans cet
//  environnement), mais suffisant pour verrouiller un vrai bug déjà
//  rencontré une fois : pas de raison de le revoir une seconde fois
//  sans test qui le signale.
//
//  v6.154 : VRAI BUG CORRIGÉ, confirmé par la console du navigateur de
//  l'utilisateur — "function digest(text, unknown) does not exist",
//  alors que l'extension pgcrypto était bien activée dans Supabase.
//  Cause réelle : Supabase installe pgcrypto dans le schéma
//  "extensions", jamais "public" — et log_patient_connection()
//  restreignait sa recherche à "public" uniquement. Le compteur de
//  connexions admin restait à zéro sans qu'aucune erreur ne soit
//  visible nulle part (avant le correctif v6.153 qui a ajouté le
//  console.warn ayant permis de trouver ce message).
//
//  Lancer : node tests/sql-schema-sanity.test.js
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

async function main(){

const sql = fs.readFileSync(path.join(ROOT, 'sql/schema.sql'), 'utf8');

await test('v6.154 : log_patient_connection() cherche digest() dans "extensions" en plus de "public" (Supabase y installe pgcrypto par défaut)', ()=>{
  const fnStart = sql.indexOf('create or replace function log_patient_connection');
  assert.ok(fnStart !== -1, 'fonction log_patient_connection introuvable');
  const fnEnd = sql.indexOf('$$;', fnStart) + 3;
  const fnBody = sql.slice(fnStart, fnEnd);
  assert.ok(fnBody.includes('digest('), 'la fonction devrait utiliser digest() de pgcrypto');
  assert.ok(/search_path\s*=\s*public\s*,\s*extensions/.test(fnBody), 'search_path devrait inclure "extensions", pas seulement "public" — sinon digest() reste invisible même si pgcrypto est activée');
});

await test('l\'extension pgcrypto est bien déclarée dans le fichier (create extension if not exists)', ()=>{
  assert.ok(/create extension if not exists pgcrypto/.test(sql));
});

await test('get_patient() reste précédée d\'un DROP FUNCTION explicite (v6.135 — "returns setof" ne peut pas être remplacé après un ALTER TABLE sans ça)', ()=>{
  assert.ok(sql.includes('drop function if exists get_patient(text);'));
});

await test('v6.166 : VRAI BUG CORRIGÉ — get_caregiver_data() déballe bien v_patient.levels->\'levels\' (pas la structure combinée {levels,attempts} brute, signalée par l\'utilisateur : "level_[object Object]" affiché dans l\'espace aidant)', ()=>{
  const fnStart = sql.indexOf('create or replace function get_caregiver_data');
  assert.ok(fnStart !== -1, 'fonction get_caregiver_data introuvable');
  const fnEnd = sql.indexOf('$$;', fnStart) + 3;
  const fnBody = sql.slice(fnStart, fnEnd);
  assert.ok(/'levels',\s*coalesce\(v_patient\.levels->'levels'/.test(fnBody), 'get_caregiver_data devrait déballer v_patient.levels->\'levels\', pas renvoyer v_patient.levels brut (qui contient aussi la clé "attempts")');
});

await test('v6.169 (classe de bug verrouillée) : toute fonction "returns setof <table>" est précédée d\'un DROP dès que la table subit un ALTER ... ADD COLUMN', ()=>{
  // Le piège (rencontré en v6.135 avec get_patient, puis en v6.168 avec
  // get_history) : "returns setof <table>" fige le type ligne au moment
  // de la création. Ajouter plus tard une colonne à cette table rend
  // "create or replace function ..." impossible sur une base existante
  // (ERROR 42P13) — sauf DROP explicite avant. Ce test généralise la
  // règle pour ne plus jamais avoir à la redécouvrir à la main.
  const altered = new Set();
  for(const m of sql.matchAll(/alter table (\w+) add column/g)) altered.add(m[1]);
  assert.ok(altered.size > 0, 'au moins une table modifiée par ALTER ... ADD COLUMN attendue (ex. sessions, patients)');

  const problems = [];
  const re = /create or replace function (\w+)\s*\([^)]*\)\s*returns setof (\w+)/g;
  let m;
  while((m = re.exec(sql))){
    const fn = m[1], table = m[2];
    if(!altered.has(table)) continue; // table non altérée : pas de risque
    const dropStr = `drop function if exists ${fn}(`;
    const dropPos = sql.lastIndexOf(dropStr, m.index);
    if(dropPos === -1){
      problems.push(`${fn}() renvoie "setof ${table}" (table modifiée par ALTER) mais aucun "${dropStr}...)" ne la précède — schema.sql ne serait pas rejouable sur une base existante`);
    }
  }
  assert.strictEqual(problems.length, 0, problems.join(' | '));
});

console.log(`\n${passed} test(s) réussi(s), ${failed} échec(s).`);
if(failed > 0) process.exit(1);
}

main();
