// =====================================================================
//  TESTS — v6.173 : mots ciblés par l'orthophoniste.
//  ---------------------------------------------------------------------
//  L'aidant pouvait proposer des mots, pas l'ortho. Comblé en réutilisant
//  la table caregiver_words (colonne source 'caregiver'|'ortho') et le
//  pipeline d'intégration aux exercices déjà en place côté patient.
//  Points de sécurité verrouillés ici :
//   - add_ortho_word / delete_target_word dérivent l'identité de
//     auth.uid() et exigent le rattachement (patient_assignments) ;
//   - la colonne source modifie le rowtype de caregiver_words -> les
//     fonctions `returns setof caregiver_words` ont leur drop préalable ;
//   - pas d'onclick inline avec données interpolées (délégation).
//
//  Lancer : node tests/ortho-target-words.test.js
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

const SQL  = fs.readFileSync(path.join(ROOT, 'sql/schema.sql'), 'utf8');
const HTML = fs.readFileSync(path.join(ROOT, 'dashboard-ortho.html'), 'utf8');
const DOJS = fs.readFileSync(path.join(ROOT, 'js/dashboard-ortho.js'), 'utf8');
const STJS = fs.readFileSync(path.join(ROOT, 'js/storage.js'), 'utf8');
const CGJS = fs.readFileSync(path.join(ROOT, 'js/caregiver.js'), 'utf8');
const doc  = new JSDOM(HTML).window.document;

const i18nWin = new JSDOM('', { runScripts:'outside-only' }).window;
i18nWin.eval(require('./i18n-source').texteComplet());
const S = i18nWin.I18N_STRINGS;

(async () => {

  // ---- SQL ----
  await test('sql : colonne source ajoutée à caregiver_words, restreinte à caregiver|ortho', () => {
    assert.ok(/alter table caregiver_words add column if not exists source text not null default 'caregiver'/.test(SQL));
    assert.ok(/check \(source in \('caregiver','ortho'\)\)/.test(SQL));
  });

  await test('sql : les deux fonctions setof caregiver_words ont leur drop préalable (classe v6.169)', () => {
    assert.ok(/drop function if exists get_caregiver_words\(text\);\s*\ncreate or replace function get_caregiver_words/.test(SQL));
    assert.ok(/drop function if exists get_caregiver_added_words\(text\);\s*\ncreate or replace function get_caregiver_added_words/.test(SQL));
  });

  await test('sql : add_ortho_word — identité via auth.uid() + rattachement exigé + source=ortho', () => {
    const m = SQL.match(/create or replace function add_ortho_word[\s\S]*?\$\$;/);
    assert.ok(m, 'add_ortho_word absente');
    assert.ok(/auth\.uid\(\)::text/.test(m[0]), 'identité auth.uid() absente');
    assert.ok(/patient_assignments/.test(m[0]), 'vérification du rattachement absente');
    assert.ok(/'ortho'/.test(m[0]), "source 'ortho' absente à l'insertion");
    assert.ok(!/p_ortho_code/.test(m[0]), "l'identité ne doit JAMAIS venir d'un paramètre");
  });

  await test('sql : delete_target_word — suppression bornée aux patients rattachés à l\'ortho connecté', () => {
    const m = SQL.match(/create or replace function delete_target_word[\s\S]*?\$\$;/);
    assert.ok(m, 'delete_target_word absente');
    assert.ok(/auth\.uid\(\)::text/.test(m[0]));
    assert.ok(/patient_assignments/.test(m[0]));
  });

  // ---- storage.js ----
  await test('storage : orthoAddWord / orthoDeleteWord existent, cloud-only, via les bons RPC', () => {
    assert.ok(/async orthoAddWord\(patientCode, word, emoji\)/.test(STJS));
    assert.ok(/supa\.rpc\('add_ortho_word'/.test(STJS));
    assert.ok(/async orthoDeleteWord\(id\)/.test(STJS));
    assert.ok(/supa\.rpc\('delete_target_word'/.test(STJS));
  });

  // ---- UI fiche patient ----
  await test('html : carte "Mots ciblés" présente dans la fiche patient avec champ + bouton + statut aria-live', () => {
    assert.ok(doc.getElementById('d-target-words'), '#d-target-words absent');
    assert.ok(doc.getElementById('target-word-text'), '#target-word-text absent');
    assert.ok(doc.getElementById('target-word-add-btn'), '#target-word-add-btn absent');
    const status = doc.getElementById('target-word-status');
    assert.ok(status && status.getAttribute('aria-live') === 'polite', 'statut aria-live manquant');
    const input = doc.getElementById('target-word-text');
    assert.strictEqual(input.getAttribute('data-enter-submit'), 'target-word-add-btn', 'validation à la touche Entrée manquante');
  });

  await test('js ortho : rendu par délégation (pas d\'onclick inline interpolé) + échappement + badge aidant', () => {
    const m = DOJS.match(/async refreshTargetWords\(\)[\s\S]*?\n  \},/);
    assert.ok(m, 'refreshTargetWords absente');
    assert.ok(!/onclick="[^"]*\$\{/.test(m[0]), 'onclick inline avec interpolation interdit (audit v6.171)');
    assert.ok(/data-word-id/.test(m[0]) && /addEventListener\('click'/.test(m[0]), 'délégation data-word-id absente');
    assert.ok(/escapeHTML\(w\.word\)/.test(m[0]), 'le mot doit être échappé');
    assert.ok(/ortho_target_by_caregiver/.test(m[0]), 'badge des mots venant de l\'aidant absent');
  });

  await test('js ortho : addTargetWord branché + refreshTargetWords appelé à l\'ouverture de la fiche', () => {
    assert.ok(/async addTargetWord\(\)/.test(DOJS));
    assert.ok(/await OrthoApp\.refreshTargetWords\(\);[\s\S]{0,600}?show\('ortho-detail'\)/.test(DOJS),
      'refreshTargetWords doit être appelé dans openPatient avant show(ortho-detail)');
  });

  // ---- Côté aidant ----
  await test('js aidant : badge "ciblé par l\'orthophoniste" sur les mots source=ortho, échappé', () => {
    assert.ok(/w\.source === 'ortho'/.test(CGJS), 'distinction de source absente');
    assert.ok(/cg_word_by_ortho/.test(CGJS), 'clé cg_word_by_ortho non utilisée');
  });

  // ---- Pipeline patient inchangé ----
  await test('patient : le pipeline d\'intégration aux exercices reste le même (get_caregiver_words)', () => {
    assert.ok(/supa\.rpc\('get_caregiver_words'/.test(STJS),
      'les mots (aidant + ortho) doivent continuer d\'arriver par get_caregiver_words');
  });

  // ---- i18n : 10 clés × 14 langues, kabyle réel ----
  await test('i18n : les 10 clés existent dans les 14 langues, et le kabyle n\'est pas du français copié', () => {
    const KEYS = ['ortho_target_words_title','ortho_target_words_sub','ortho_target_word_placeholder','ortho_target_add_btn','ortho_target_added','ortho_target_empty','ortho_target_remove_aria','ortho_target_by_caregiver','cg_word_by_ortho','ortho_target_err'];
    const langs = Object.keys(S);
    assert.strictEqual(langs.length, 14);
    for(const l of langs) for(const k of KEYS){
      assert.ok(typeof S[l][k] === 'string' && S[l][k].length, `${k} manquante en ${l}`);
    }
    for(const k of KEYS){
      assert.notStrictEqual(S.kab[k], S.fr[k], `${k} en kab ne doit pas être un repli français`);
    }
  });

  console.log(`\n${passed} test(s) réussi(s), ${failed} échec(s).`);
  process.exit(failed ? 1 : 0);
})();
