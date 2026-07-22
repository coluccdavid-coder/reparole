// =====================================================================
//  TESTS — v6.183 : exercices sur mesure proposés par l'IA + veille.
//  ---------------------------------------------------------------------
//  L'IA rédige des brouillons d'exercices personnalisés (erreurs
//  récurrentes + mots ciblés) ; l'ortho relit CHAQUE item et valide —
//  seul un exercice validé arrive chez le patient, où il tourne dans le
//  moteur existant. Côté admin, la veille scientifique utilise la
//  RECHERCHE WEB réelle (sources exigées, interdiction d'inventer).
//
//  Lancer : node tests/ia-exercises.test.js
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

const DOC  = fs.readFileSync(path.join(ROOT, 'js/ia-edge-function.md'), 'utf8');
const SQL  = fs.readFileSync(path.join(ROOT, 'sql/schema.sql'), 'utf8');
const ORT  = fs.readFileSync(path.join(ROOT, 'dashboard-ortho.html'), 'utf8');
const IDX  = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const DOJS = fs.readFileSync(path.join(ROOT, 'js/dashboard-ortho.js'), 'utf8');
const APP  = fs.readFileSync(path.join(ROOT, 'js/app.js'), 'utf8');
const STJS = fs.readFileSync(path.join(ROOT, 'js/storage.js'), 'utf8');
const ortDoc = new JSDOM(ORT).window.document;
const idxDoc = new JSDOM(IDX).window.document;

(async () => {

  // ---- SQL ----
  await test('sql : custom_exercises — un seul bloc, RLS sans policy, ajout gaté auth.uid + rattachement', () => {
    assert.strictEqual((SQL.match(/create table if not exists custom_exercises/g) || []).length, 1,
      'la table ne doit être définie qu\'UNE fois');
    assert.ok(/alter table custom_exercises enable row level security/.test(SQL));
    const m = SQL.match(/create or replace function add_custom_exercise[\s\S]*?\$\$;/);
    assert.ok(m, 'add_custom_exercise absente');
    assert.ok(/auth\.uid\(\)::text/.test(m[0]) && /patient_assignments/.test(m[0]));
    const d = SQL.match(/create or replace function delete_custom_exercise[\s\S]*?\$\$;/);
    assert.ok(d && /auth\.uid\(\)::text/.test(d[0]), 'suppression gatée absente');
  });

  // ---- Edge function ----
  await test('edge : generate_exercise (ortho) — JSON strict, schéma du moteur (text/choices/answer), présenté comme PROPOSITION', () => {
    assert.ok(/'generate_exercise'/.test(DOC.match(/ORTHO_TASKS = \[[^\]]*\]/)[0]), 'generate_exercise doit être une tâche ortho');
    assert.ok(/schéma text\/choices\/answer est celui du/.test(DOC), 'le schéma doit être celui du moteur existant');
    assert.ok(/JSON strict/.test(DOC));
    assert.ok(/STRICTEMENT égal à l'un des "choices"/.test(DOC), 'answer doit être contraint aux choices');
    assert.ok(/PROPOSITION/.test(DOC) && /décidera/.test(DOC), 'le prompt doit rappeler que l\'ortho décide');
  });

  await test('edge : research_exercises (admin) — RECHERCHE WEB réelle, sources exigées, interdiction d\'inventer', () => {
    assert.ok(/'research_exercises'/.test(DOC.match(/ADMIN_TASKS = \[[^\]]*\]/)[0]), 'research_exercises doit être une tâche admin');
    assert.ok(/web_search_20250305/.test(DOC), 'l\'outil de recherche web doit être branché');
    assert.ok(/dis-le honnêtement plutôt que d'inventer/.test(DOC.replace(/\n/g, ' ')), 'interdiction d\'inventer absente');
    assert.ok(/SOURCE|sources/.test(DOC), 'les sources doivent être exigées');
  });

  // ---- Ortho : validation obligatoire ----
  await test('ortho : la proposition n\'est PAS envoyée automatiquement — add_custom_exercise seulement via acceptExercise', () => {
    const gen = DOJS.match(/async generateExercise\(\)[\s\S]*?\n  \},/) || DOJS.match(/async proposeExercise\(\)[\s\S]*?\n  \},/);
    assert.ok(gen, 'fonction de génération absente');
    assert.ok(!/AddCustomExercise|add_custom_exercise/i.test(gen[0]),
      'la génération ne doit JAMAIS enregistrer — seule la validation le fait');
    assert.ok(/async acceptExercise\(\)/.test(DOJS), 'acceptExercise absente');
    const acc = DOJS.match(/async acceptExercise\(\)[\s\S]*?\n  \},/)[0];
    assert.ok(/AddCustomExercise|addCustomExercise/i.test(acc), 'acceptExercise doit être le seul chemin d\'envoi');
    assert.ok(/\n  rejectExercise\(\)/.test(DOJS), 'rejectExercise (ignorer) absente');
  });

  await test('ortho html : carte présente, brouillon affiché item par item avant validation, liste des envoyés', () => {
    assert.ok(/data-i18n="ortho_ai_exo_card_title"/.test(ORT), 'carte absente');
    assert.ok(ortDoc.getElementById('ai-exo-btn') || /ortho_ai_exo_btn/.test(ORT), 'bouton de génération absent');
    assert.ok(/ortho_ai_exo_accept/.test(ORT) && /ortho_ai_exo_reject/.test(ORT), 'boutons valider/ignorer absents');
    assert.ok(/ortho_ai_exo_active_title/.test(ORT), 'liste des exercices envoyés absente');
  });

  // ---- Patient : moteur existant + robustesse ----
  await test('patient : carte "Exercices de votre orthophoniste" + session lancée dans le MOTEUR existant', () => {
    assert.ok(/custom_exos_title/.test(IDX), 'carte patient absente');
    const run = APP.match(/\n  start\(id\)\{[\s\S]*?renderQuestion\(\);/);
    assert.ok(run, 'CustomExos.start doit aboutir au moteur existant (renderQuestion)');
    assert.ok(/current\s*=\s*\{/.test(run[0]), 'la session doit passer par current={...} comme photos_perso');
  });

  await test('patient : payload malformé rejeté (garde sur payload.items) — un exercice cassé ne plante pas l\'app', () => {
    assert.ok(/!exo \|\| !exo\.payload \|\| !Array\.isArray\(exo\.payload\.items\)/.test(APP),
      'garde de robustesse sur le payload absente');
  });

  // ---- Storage ----
  await test('storage : ajout/lecture/suppression via les bons RPC, generate via iaAssist', () => {
    assert.ok(/rpc\('add_custom_exercise'/.test(STJS));
    assert.ok(/rpc\('get_custom_exercises'/.test(STJS));
    assert.ok(/rpc\('delete_custom_exercise'/.test(STJS));
  });

  // ---- i18n kab réel ----
  await test('i18n : les 12 clés en kabyle ne sont pas des replis français (et sans caractères parasites)', () => {
    const w = new JSDOM('', { runScripts:'outside-only' }).window;
    w.eval(fs.readFileSync(path.join(ROOT, 'js/i18n.js'), 'utf8'));
    const S = w.I18N_STRINGS;
    const KEYS = ['ortho_ai_exo_card_title','ortho_ai_exo_sub','ortho_ai_exo_btn','ortho_ai_exo_generating','ortho_ai_exo_accept','ortho_ai_exo_reject','ortho_ai_exo_saved','ortho_ai_exo_active_title','ortho_ai_exo_empty','custom_exos_title','custom_exos_sub','custom_exo_intro'];
    for(const k of KEYS){
      assert.notStrictEqual(S.kab[k], S.fr[k], `${k} : kab = repli français`);
      assert.ok(!/[\u0400-\u04FF]/.test(S.kab[k]), `${k} : caractères cyrilliques parasites en kab`);
    }
  });

  console.log(`\n${passed} test(s) réussi(s), ${failed} échec(s).`);
  process.exit(failed ? 1 : 0);
})();
