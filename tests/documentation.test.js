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

  await test('SYNCHRO journal : README.md contient une entrée pour la version courante', () => {
    // v6.245 : la check-list de sortie (docs/DEPLOIEMENT.md §5) exige une
    // entrée « ## v6.X » dans README.md à chaque version. Rien ne le
    // vérifiait, et le journal avait fini par s'arrêter à v6.201 alors que
    // le code était à v6.243 — 42 versions sans trace écrite. Ce test
    // ferme la porte, comme celui du dessus le fait pour docs/INDEX.md.
    const cache = read('sw.js').match(/const CACHE_NAME = '([^']+)'/)[1];  // ex. reparole-v6-245
    const version = cache.replace(/^reparole-v(\d+)-(\d+)$/, 'v$1.$2');    // ex. v6.245
    assert.notStrictEqual(version, cache, `CACHE_NAME « ${cache} » ne suit pas la forme attendue reparole-v6-XXX`);
    const journal = read('README.md');
    const entree = new RegExp(`^## ${version.replace('.', '\\.')}\\b`, 'm');
    assert.ok(entree.test(journal),
      `aucune entrée « ## ${version} » dans README.md — décrire ce que fait la version fait partie de la version`);
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

  await test('SYNCHRO langues : les 14 codes de langue sont listés dans FONCTIONNALITES.md', () => {
    // v6.247 : les blocs de traduction ne vivent plus dans i18n.js mais
    // dans js/i18n/<code>.js. La source de vérité des codes devient la
    // table LANGUAGES (toujours dans i18n.js) — et on vérifie au passage
    // que chaque code déclaré a bien son fichier de langue, et qu'aucun
    // fichier orphelin ne traîne sans code déclaré.
    const i18n = read('js/i18n.js');
    const bloc = i18n.slice(i18n.indexOf('const LANGUAGES'), i18n.indexOf('};', i18n.indexOf('const LANGUAGES')));
    const langs = [...bloc.matchAll(/^\s{2}([a-z]{2,3})\s*:\s*\{/gm)].map(m => m[1]);
    assert.ok(new Set(langs).size === 14, '14 langues attendues, trouvé ' + new Set(langs).size);
    const fichiers = fs.readdirSync(path.join(ROOT, 'js/i18n')).filter(f => f.endsWith('.js')).map(f => f.replace('.js',''));
    for(const l of langs) assert.ok(fichiers.includes(l), `js/i18n/${l}.js manquant pour la langue déclarée ${l}`);
    for(const f of fichiers) assert.ok(langs.includes(f), `js/i18n/${f}.js orphelin — aucune langue ${f} déclarée`);
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
