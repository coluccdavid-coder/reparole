// =====================================================================
//  TESTS — v6.187 : mots croisés illustrés + quête-découverte + IA v2
//  (récit d'évolution, vue cabinet).
//  ---------------------------------------------------------------------
//  Invariants verrouillés :
//  - Croisés : indice = IMAGE (jamais de définition textuelle), généré
//    depuis la banque de la langue (mots ciblés prioritaires), RTL géré
//    à l'affichage seulement, repli honnête si la banque ne croise pas,
//    gratuit, même answer_feedback (donc AI.record), pas de chrono.
//  - Quête : célébration jamais barrière — seuils dérivés de
//    user.sessions (patients existants tout débloqué), lien « voir tous »,
//    interrupteur ortho (SQL gaté rattachement), jeux SEULEMENT.
//  - IA v2 : evolution_story + cabinet_digest dans ORTHO_TASKS, cabinet
//    sans patient_code mais rôle vérifié, anonymat par lettres.
//
//  Lancer : node tests/quest-crosswords.test.js
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

const APP  = fs.readFileSync(path.join(ROOT, 'js/app.js'), 'utf8');
const IDX  = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const DOC  = fs.readFileSync(path.join(ROOT, 'js/ia-edge-function.md'), 'utf8');
const SQL  = fs.readFileSync(path.join(ROOT, 'sql/schema.sql'), 'utf8');
const ORT  = fs.readFileSync(path.join(ROOT, 'dashboard-ortho.html'), 'utf8');
const DOJS = fs.readFileSync(path.join(ROOT, 'js/dashboard-ortho.js'), 'utf8');
const STJS = fs.readFileSync(path.join(ROOT, 'js/storage.js'), 'utf8');
const idxDoc = new JSDOM(IDX).window.document;

(async () => {

  // ================= MOTS CROISÉS =================
  await test('croisés : tuile présente, type gratuit, indice = image (aucune définition textuelle dans le rendu)', () => {
    assert.ok(idxDoc.querySelector('.ex-item[data-type="croises"]'), 'tuile absente');
    assert.ok(!/croises/.test(APP.match(/const PRO_ONLY_TYPES = \[[^\]]*\]/)[0]), 'les croisés doivent rester gratuits');
    const r = APP.match(/function renderCroises[\s\S]*?\n\}/)[0];
    assert.ok(/prompt-emoji/.test(r), "l'indice doit être l'emoji du mot");
    assert.ok(!/definition|clue-text/i.test(r), 'jamais de définition textuelle (double obstacle aphasique)');
  });

  await test('croisés : générateur — lettre commune, conflits vérifiés, normalisation, repli null si rien ne croise', () => {
    const g = APP.match(/function buildCrossword[\s\S]*?\n  return null;\n\}/);
    assert.ok(g, 'générateur absent');
    assert.ok(/aL\[ai\]===bL\[bi\]/.test(g[0]), 'recherche de lettre commune absente');
    assert.ok(/cells\[k\] && cells\[k\]\.letter!==L\[i\]\) return false/.test(g[0]), 'contrôle de conflit de cases absent');
    assert.ok(/norm\[\(r-minR\)\+','\+\(c-minC\)\]/.test(g[0]), 'normalisation des coordonnées absente');
    assert.ok(/if\(!puzzle\)\{/.test(APP) && /croises_unavailable/.test(APP), 'repli honnête absent');
  });

  await test('croisés : mots ciblés prioritaires + RTL géré à l\'affichage seulement (coordonnées internes LTR)', () => {
    const b = APP.match(/if\(type==='croises'\)\{[\s\S]*?renderQuestion\(\);\n    return;\n  \}/)[0];
    assert.ok(/loadCaregiverWords/.test(b) && /targeted\.has/.test(b), 'priorité aux mots ciblés absente');
    assert.ok(/isRTL=\['ar','dz','ma','tn'\]/.test(b), 'détection RTL absente');
    const r = APP.match(/function renderCroises[\s\S]*?\n\}/)[0];
    assert.ok(/c\.isRTL \? \(c\.gridSize\.cols-1-col\) : col/.test(r), "l'inversion RTL doit se faire à l'affichage");
    assert.ok(/direction:ltr/.test(r), 'la grille CSS doit rester en coordonnées stables');
  });

  await test('croisés : les lettres résolues persistent et aident le mot suivant ; conclusion par answer_feedback ; pas de chrono', () => {
    const r = APP.match(/function renderCroises[\s\S]*?\n\}/)[0];
    assert.ok(/c\.grid\[pos\.r\+','\+pos\.c\]\.filled=\[\.\.\.w\.word\]\[i\]/.test(r), 'les lettres doivent se graver dans la grille');
    assert.ok(/answer_feedback\(ok, c\._built\)/.test(r), 'conclusion par answer_feedback absente');
    assert.ok(/c\._target=w\.word/.test(r), 'cible du moteur absente');
    assert.ok(!/setInterval|count.?down/i.test(r), 'pas de chronomètre');
    const erase = r.match(/#croises-erase'\)\.addEventListener\('click',\(\)=>\{[\s\S]*?\}\);/)[0];
    assert.ok(!/answer_feedback/.test(erase), 'effacer sans pénalité');
  });

  // ================= QUÊTE =================
  await test('quête : seuils dérivés de user.sessions (1/2/3), patients existants et interrupteur ortho = tout débloqué', () => {
    assert.ok(/QUEST_CHAIN = \[ \{type:'anagramme', need:1\}, \{type:'verif', need:2\}, \{type:'croises', need:3\} \]/.test(APP), 'chaîne fixe absente');
    const q = APP.match(/function questStep\(\)\{[\s\S]*?\n\}/)[0];
    assert.ok(/user\.games_all_unlocked\) return 99/.test(q), 'soupape ortho absente');
    assert.ok(/Number\(user\.sessions\)/.test(q), 'seuils dérivés des séances absents');
  });

  await test('quête : jamais barrière — lien « voir tous les jeux », jeux seulement (aucun exercice thérapeutique masqué), célébration une fois', () => {
    const a = APP.match(/function applyQuest\(\)\{[\s\S]*?\n\}/)[0];
    assert.ok(/quest_show_all/.test(a) && /_questShowAll=true/.test(a), 'le lien de contournement doit exister');
    // seuls les types de QUEST_CHAIN sont touchés (requête ciblée par data-type)
    assert.ok(/querySelector\(`\.ex-item\[data-type="\$\{step\.type\}"\]`\)/.test(a), 'la quête ne doit toucher que ses propres tuiles');
    assert.ok(!/denomination|comprehension|completion/.test(a), 'aucun exercice thérapeutique dans la quête');
    assert.ok(/localStorage\.getItem\('reparole_quest_step'/.test(a) && /quest-sparkle/.test(a), 'célébration locale absente');
    assert.ok(/applyQuest\(\); \/\/ v6\.187/.test(APP), 'la quête doit être branchée au tableau de bord');
  });

  await test('quête sql : games_all_unlocked + set_games_unlock gatée par le rattachement ; client ortho branché', () => {
    assert.ok(/alter table patients add column if not exists games_all_unlocked boolean not null default false/.test(SQL));
    const fn = SQL.match(/create or replace function set_games_unlock[\s\S]*?\$\$;/)[0];
    assert.ok(/patient_assignments/.test(fn) && /auth\.uid\(\)::text/.test(fn), 'gating du rattachement absent');
    assert.ok(/rpc\('set_games_unlock'/.test(STJS), 'storage absent');
    assert.ok(/id="games-unlock-toggle"/.test(ORT) && /setGamesUnlock/.test(DOJS), 'interrupteur ortho absent');
    const s = DOJS.match(/async setGamesUnlock\(checked\)\{[\s\S]*?\n  \},/)[0];
    assert.ok(/checked = !checked; \/\/ revert/.test(s), 'un échec doit annuler la case (pas de faux état)');
  });

  // ================= IA v2 =================
  await test('ia v2 : evolution_story + cabinet_digest dans ORTHO_TASKS ; cabinet sans patient_code mais rôle vérifié', () => {
    const list = DOC.match(/ORTHO_TASKS = \[[^\]]*\]/)[0];
    assert.ok(/'evolution_story'/.test(list) && /'cabinet_digest'/.test(list));
    assert.ok(/NO_PATIENT_TASKS = \['cabinet_digest', 'research_exercises'\]/.test(DOC), 'exception patient_code absente');
    assert.ok(/eq\('ortho_code', accountCode\)\.limit\(30\)/.test(DOC), 'le cabinet doit agréger les patients rattachés au compte');
  });

  await test('ia v2 : anonymat du cabinet par lettres (A, B, C…) — aucun nom sélectionné', () => {
    const c = DOC.match(/if \(task === 'cabinet_digest'\) \{[\s\S]*?userMsg = 'Patients/)[0];
    assert.ok(/String\.fromCharCode\(65/.test(c), 'les patients doivent devenir des lettres');
    assert.ok(!/select\('[^']*\bname\b/.test(c), 'aucun nom ne doit être sélectionné');
    assert.ok(/Aucun nom n'existe/.test(DOC), 'le prompt doit interdire les noms');
  });

  await test('ia v2 : UI ortho — récit (période 7/30/90 vers la zone éditable) + vue cabinet (lecture seule), gating iaAllowed avant appel', () => {
    assert.ok(/id="ai-evo-btn"/.test(ORT) && /id="evo-days"/.test(ORT) && /id="cabinet-digest-btn"/.test(ORT), 'boutons/période absents');
    for(const name of ['generateEvolutionStory','cabinetDigest']){
      const fn = DOJS.match(new RegExp('async '+name+'\\(\\)\\{[\\s\\S]*?\\n  \\},'))[0];
      assert.ok(fn.indexOf('!OrthoApp.iaAllowed()') < fn.indexOf('iaAssist'), name+' : contrôle avant appel');
    }
    assert.ok(/'evolution_story', \{ patient_code: currentPatient\.code, days/.test(DOJS), 'la période doit partir avec la demande');
  });

  console.log(`\n${passed} test(s) réussi(s), ${failed} échec(s).`);
  process.exit(failed ? 1 : 0);
})();
