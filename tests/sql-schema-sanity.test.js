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

console.log(`\n${passed} test(s) réussi(s), ${failed} échec(s).`);
if(failed > 0) process.exit(1);
}

main();
