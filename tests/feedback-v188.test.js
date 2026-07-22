// =====================================================================
//  TESTS — v6.188 : retours sur captures (toto).
//  ---------------------------------------------------------------------
//  1. Images des banques : plus JAMAIS deux emojis visuellement jumeaux
//     pour deux réponses différentes (🏖️ PLAGE vs ⛱️ PARASOL rendaient
//     quasi pareil à l'écran) — PLAGE passe à 🏝️ partout où les deux
//     coexistent, et l'audit de doublons stricts devient permanent.
//  2. Journal : une humeur d'il y a dix jours ne s'affiche plus comme si
//     c'était aujourd'hui (libellé relatif + invitation douce).
//  3. Espace aidant : détails (dont le code d'accès) masqués par défaut.
//  4. Veille scientifique ouverte à l'ortho (elle n'était qu'en admin).
//
//  Lancer : node tests/feedback-v188.test.js
// =====================================================================

const fs = require('fs');
const path = require('path');
const glob = require('fs');
const assert = require('assert');
const { JSDOM } = require('jsdom');

const ROOT = path.join(__dirname, '..');
let passed = 0, failed = 0;
async function test(name, fn){
  try{ await fn(); console.log('  ✔', name); passed++; }
  catch(e){ console.log('  ✘', name, '—', e.message); failed++; }
}

const APP = fs.readFileSync(path.join(ROOT, 'js/app.js'), 'utf8');
const IDX = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const DOC = fs.readFileSync(path.join(ROOT, 'js/ia-edge-function.md'), 'utf8');
const ORT = fs.readFileSync(path.join(ROOT, 'dashboard-ortho.html'), 'utf8');
const DOJS = fs.readFileSync(path.join(ROOT, 'js/dashboard-ortho.js'), 'utf8');
const idxDoc = new JSDOM(IDX).window.document;

(async () => {

  await test('banques : aucun emoji (normalisé) ne pointe vers deux réponses différentes ; 🏖️/⛱️ ne coexistent plus', () => {
    const files = fs.readdirSync(path.join(ROOT, 'js')).filter(f => /^exercises.*\.js$/.test(f));
    assert.ok(files.length >= 1);
    for(const f of files){
      const txt = fs.readFileSync(path.join(ROOT, 'js', f), 'utf8');
      const pairs = [...txt.matchAll(/emoji\s*:\s*['"]([^'"]+)['"]\s*,\s*answer\s*:\s*['"]([^'"]+)['"]/g)];
      const byEmoji = new Map();
      for(const [, e, a] of pairs){
        const key = [...e].filter(ch => ch !== '\ufe0f').join('');
        if(!byEmoji.has(key)) byEmoji.set(key, new Set());
        byEmoji.get(key).add(a);
      }
      for(const [e, answers] of byEmoji){
        assert.ok(answers.size === 1, `${f} : emoji ${e} -> ${[...answers].join(', ')}`);
      }
      // les jumeaux visuels plage/parasol ne doivent plus coexister
      assert.ok(!(txt.includes('🏖') && txt.includes('⛱')), `${f} : 🏖️ et ⛱️ coexistent encore (jumeaux visuels)`);
    }
  });

  await test('journal : libellé relatif + invitation douce quand la dernière note a plus de 2 jours', () => {
    const r = APP.match(/async function renderJournal\(\)\{[\s\S]*?\n\}/)[0];
    assert.ok(/ageDays > 2/.test(r) && /journal_stale_nudge/.test(r), 'invitation douce absente');
    assert.ok(/journal_days_ago/.test(r), 'libellé relatif absent');
    assert.ok(/\$\{rel\(e\)\}/.test(r), 'les entrées doivent afficher la date relative');
  });

  await test('espace aidant : détails masqués par défaut, bouton aria-expanded, code jamais affiché d\'office', () => {
    const body = idxDoc.getElementById('caregiver-card-body');
    assert.ok(body, 'conteneur masquable absent');
    assert.ok(/display:none/.test(body.getAttribute('style') || ''), 'les détails doivent être masqués par défaut');
    const btn = idxDoc.getElementById('caregiver-card-toggle');
    assert.ok(btn && btn.getAttribute('aria-expanded') === 'false' && btn.getAttribute('aria-controls') === 'caregiver-card-body');
    // le code d'accès vit DANS le conteneur masqué
    assert.ok(body.querySelector('#caregiver-code-display'), 'le code doit être dans la zone masquée');
    assert.ok(/function toggleCaregiverCard\(\)/.test(APP) && /caregiver_card_hide/.test(APP), 'bascule absente');
  });

  await test('veille ortho : research_exercises accessible ortho ET admin, sans patient_code, carte + gating avant appel', () => {
    assert.ok(/'research_exercises'/.test(DOC.match(/ORTHO_TASKS = \[[^\]]*\]/)[0]), 'la veille doit être une tâche ortho');
    assert.ok(/'research_exercises'/.test(DOC.match(/ADMIN_TASKS = \[[^\]]*\]/)[0]), 'la veille doit rester une tâche admin');
    assert.ok(/NO_PATIENT_TASKS = \['cabinet_digest', 'research_exercises'\]/.test(DOC), 'exception patient_code absente');
    assert.ok(/id="ortho-watch-btn"/.test(ORT), 'carte veille ortho absente');
    const fn = DOJS.match(/async researchWatch\(\)\{[\s\S]*?\n  \},/)[0];
    assert.ok(fn.indexOf('!OrthoApp.iaAllowed()') < fn.indexOf('iaAssist'), 'contrôle avant appel');
    assert.ok(/'research_exercises'/.test(fn), 'mauvaise tâche appelée');
  });

  console.log(`\n${passed} test(s) réussi(s), ${failed} échec(s).`);
  process.exit(failed ? 1 : 0);
})();
