// =====================================================================
//  TESTS — v6.192 : LA DOCUMENTATION EST UN VERROU, PAS UNE INTENTION.
//  ---------------------------------------------------------------------
//  Principe demandé par le propriétaire du projet : « pour la prochaine
//  version, il faut que tout soit documenté ». Ce test le rend
//  PERMANENT : la doc doit exister, être substantielle, et rester
//  SYNCHRONISÉE avec le code — version courante, tables SQL, types
//  d'exercices, tâches IA, langues. Toute version qui oublie la doc
//  fait échouer la suite.
//
//  Lancer : node tests/documentation.test.js
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

const read = f => fs.readFileSync(path.join(ROOT, f), 'utf8');
const DOCS = ['docs/INDEX.md','docs/ARCHITECTURE.md','docs/FONCTIONNALITES.md','docs/IA.md','docs/DEPLOIEMENT.md','docs/DONNEES.md','docs/DEVELOPPEMENT.md'];

(async () => {

  await test('les 7 documents existent et sont substantiels (>1500 caractères chacun)', () => {
    for(const f of DOCS){
      assert.ok(fs.existsSync(path.join(ROOT, f)), f + ' manquant');
      assert.ok(read(f).length > 1500, f + ' trop maigre');
    }
  });

  await test('SYNCHRO version : docs/INDEX.md documente exactement le CACHE_NAME courant de sw.js', () => {
    const cache = read('sw.js').match(/const CACHE_NAME = '([^']+)'/)[1];
    assert.ok(read('docs/INDEX.md').includes('`' + cache + '`'),
      `INDEX.md doit contenir \`${cache}\` — mettre à jour la ligne « Version documentée » fait partie de CHAQUE version`);
  });

  await test('SYNCHRO données : chaque table de schema.sql est documentée dans DONNEES.md', () => {
    const tables = [...read('sql/schema.sql').matchAll(/create table if not exists ([a-z_]+)/g)].map(m => m[1]);
    assert.ok(tables.length >= 20, 'extraction des tables suspecte');
    const doc = read('docs/DONNEES.md');
    for(const t of new Set(tables)){
      assert.ok(doc.includes('`' + t + '`'), 'table non documentée : ' + t);
    }
  });

  await test('SYNCHRO exercices : chaque tuile data-type de index.html est documentée dans FONCTIONNALITES.md', () => {
    const types = [...read('index.html').matchAll(/data-type="([a-z_]+)"/g)].map(m => m[1]);
    assert.ok(new Set(types).size >= 20, 'extraction des types suspecte');
    const doc = read('docs/FONCTIONNALITES.md');
    for(const t of new Set(types)){
      assert.ok(doc.includes('`' + t + '`'), 'exercice non documenté : ' + t);
    }
  });

  await test('SYNCHRO IA : chaque tâche des listes ORTHO_TASKS/ADMIN_TASKS est documentée dans IA.md', () => {
    const edge = read('js/ia-edge-function.md');
    const lists = edge.match(/ORTHO_TASKS = \[[^\]]+\]/)[0] + edge.match(/ADMIN_TASKS = \[[^\]]+\]/)[0];
    const tasks = [...lists.matchAll(/'([a-z_]+)'/g)].map(m => m[1]);
    const doc = read('docs/IA.md');
    for(const t of new Set(tasks)){
      assert.ok(doc.includes('`' + t + '`'), 'tâche IA non documentée : ' + t);
    }
  });

  await test('SYNCHRO langues : les 14 codes de langue de i18n.js sont listés dans FONCTIONNALITES.md', () => {
    const langs = [...read('js/i18n.js').matchAll(/^  ([a-z]{2,3}): \{$/gm)].map(m => m[1]);
    assert.ok(new Set(langs).size === 14, '14 langues attendues, trouvé ' + new Set(langs).size);
    const doc = read('docs/FONCTIONNALITES.md');
    for(const l of new Set(langs)){
      assert.ok(new RegExp('`' + l + '`').test(doc), 'langue non documentée : ' + l);
    }
  });

  await test('DEPLOIEMENT.md contient les gestes vitaux : deploy, secrets, SQL rejouable, protection du dossier audio/', () => {
    const d = read('docs/DEPLOIEMENT.md');
    assert.ok(/supabase functions deploy ia-assist/.test(d), 'commande de deploy absente');
    assert.ok(/supabase secrets set ANTHROPIC_API_KEY/.test(d), 'pose de la clé absente');
    assert.ok(/schema\.sql/.test(d) && /rejouable/i.test(d), 'procédure SQL absente');
    assert.ok(/audio\//.test(d) && /JAMAIS/i.test(d), 'la protection du dossier audio/ doit être écrite noir sur blanc');
    assert.ok(/extract-voice-content\.js/.test(d), 'pipeline voix absent');
  });

  await test('INDEX.md référence tous les documents du dossier (aucun orphelin)', () => {
    const idx = read('docs/INDEX.md');
    for(const f of DOCS.slice(1)){
      assert.ok(idx.includes(path.basename(f)), 'document non référencé dans le portail : ' + f);
    }
  });

  console.log(`\n${passed} test(s) réussi(s), ${failed} échec(s).`);
  process.exit(failed ? 1 : 0);
})();
