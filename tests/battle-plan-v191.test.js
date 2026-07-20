// =====================================================================
//  TESTS — v6.191 : l'ordre de bataille (② → ④ → ① → ③).
//  ---------------------------------------------------------------------
//  ② Une seule action principale : carte « Aujourd'hui », un bouton,
//     branché sur le MÊME moteur de recommandation que le badge.
//  ④ Personnalisation progressive : nudges (une proposition max par
//     session, refus mémorisé, application au clic seulement) + niveau
//     d'accompagnement d'Ami (normal/discret/silencieux) respecté par
//     Companion.
//  ① Mémoire d'Ami : scriptée, AUCUN LLM, données réelles, jamais
//     d'émotion prétendue, ne casse jamais le tableau de bord.
//  ③ Fiche ortho narrative : récit local (zéro appel IA), chiffres en
//     dessous.
//
//  Lancer : node tests/battle-plan-v191.test.js
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

const APP = fs.readFileSync(path.join(ROOT, 'js/app.js'), 'utf8');
const IDX = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const COMP = fs.readFileSync(path.join(ROOT, 'js/companion.js'), 'utf8');
const PREFS = fs.readFileSync(path.join(ROOT, 'js/prefs.js'), 'utf8');
const ORT = fs.readFileSync(path.join(ROOT, 'dashboard-ortho.html'), 'utf8');
const DOJS = fs.readFileSync(path.join(ROOT, 'js/dashboard-ortho.js'), 'utf8');
const I18N = fs.readFileSync(path.join(ROOT, 'js/i18n.js'), 'utf8');
const idxDoc = new JSDOM(IDX).window.document;

(async () => {

  // ================= ② UNE ACTION PRINCIPALE =================
  await test('② carte Aujourd\'hui : un seul bouton principal, branché sur le moteur de recommandation existant', () => {
    const card = idxDoc.getElementById('today-card');
    assert.ok(card, 'carte absente');
    assert.strictEqual(card.querySelectorAll('button.btn-primary').length, 1, 'exactement UN bouton principal');
    assert.ok(idxDoc.getElementById('today-btn'), 'bouton absent');
    assert.ok(/window\._todayTop = top;/.test(APP), 'la carte doit reprendre le top du moteur AI.recommend');
    assert.ok(/function startRecommended\(\)\{\s*\n\s*startExercise\(window\._todayTop/.test(APP), 'le bouton doit lancer l\'exercice recommandé');
    assert.ok(/startRecommended,/.test(APP.match(/Object\.assign\(window, \{[^}]+\}/)[0]), 'startRecommended doit être exposé');
  });

  // ================= ④ PERSONNALISATION PROGRESSIVE =================
  await test('④ nudges : une proposition max par session, refus mémorisé (localStorage), application au clic uniquement', () => {
    const n = APP.match(/const Nudges = \{[\s\S]*?\n\};/)[0];
    assert.ok(/if\(this\.shownThisSession\) return;/.test(n), 'une seule proposition par session');
    assert.ok(/reparole_nudges_off/.test(n), 'le refus doit être mémorisé');
    assert.ok(/#nudge-yes'\)\.addEventListener/.test(n) && /rule\.apply\(\);/.test(n), 'application au clic');
    // apply() n'est appelé QUE dans le gestionnaire de clic
    const applyCalls = (n.match(/rule\.apply\(\)/g) || []).length;
    assert.strictEqual(applyCalls, 1, 'apply() ne doit exister que dans le clic — jamais automatique');
    assert.ok(/#nudge-no'\)\.addEventListener/.test(n) && /this\.dismiss\(rule\.id\)/.test(n), 'refus d\'un geste');
    assert.ok(idxDoc.getElementById('nudge-line'), 'zone de proposition absente');
  });

  await test('④ niveau d\'Ami : réglage 3 positions persisté, Companion se tait vraiment en silencieux, discret garde l\'important', () => {
    assert.ok(/amiLevel:'normal'/.test(PREFS) && /setAmiLevel\(v\)/.test(PREFS), 'préférence absente');
    const sel = idxDoc.getElementById('ami-level');
    assert.ok(sel && sel.querySelectorAll('option').length === 3, 'sélecteur 3 positions absent');
    const say = COMP.match(/sayText\(text, important\)\{[\s\S]*?this\.message = text;/)[0];
    assert.ok(/if\(lvl !== 'normal' && !important\) return;/.test(say), 'gating de sayText absent');
    assert.ok(/=== 'silencieux'\) return; \/\/ v6\.191/.test(COMP), 'explain doit se taire en silencieux');
    // la célébration de quête passe même en discret
    assert.ok(/Companion\.sayText\(I18N\.t\('quest_unlocked'\), true\)/.test(APP), 'la célébration doit être marquée importante');
  });

  // ================= ① MÉMOIRE D'AMI =================
  await test('① mémoire d\'Ami : scriptée (aucun appel IA), données réelles, protégée par try/catch', () => {
    const m = APP.match(/la mémoire d'Ami ne doit jamais casser le tableau de bord/);
    assert.ok(m, 'garde-fou absent');
    const block = APP.match(/const lastVisit = localStorage\.getItem\('reparole_last_visit'\)[\s\S]*?reparole_last_visit', new Date\(\)\.toISOString\(\)\);/)[0];
    assert.ok(/ami_mem_back/.test(block) && /ami_mem_streak/.test(block) && /ami_mem_word/.test(block), 'les 3 souvenirs doivent exister');
    assert.ok(/Store\.errorHistory\(userCode\)/.test(block), 'le mot qui résiste vient des données réelles');
    assert.ok(!/iaAssist|fetch\(/.test(block), 'AUCUN appel IA/réseau dans la mémoire d\'Ami');
    assert.ok(/topWord\[1\] >= 3/.test(block), 'seuil : on ne pointe un mot qu\'après 3 erreurs (pas de stigmatisation au premier raté)');
  });

  await test('① éthique : Ami ne prétend jamais éprouver — aucune émotion en première personne dans ses souvenirs', () => {
    // On vérifie les 14 langues : pas de « je suis content/heureux/triste »
    const memKeys = I18N.match(/ami_mem_(back|streak|word):[^\n]+/g) || [];
    assert.ok(memKeys.length >= 42, '3 clés × 14 langues attendues');
    for(const k of memKeys){
      assert.ok(!/je suis (content|heureux|triste|fier)|I am (happy|sad|proud)|estoy (feliz|triste)/i.test(k),
        'émotion en première personne détectée : ' + k.slice(0, 60));
    }
  });

  // ================= ③ FICHE NARRATIVE =================
  await test('③ fiche ortho : le récit d\'abord — généré localement, zéro appel IA, chiffres en dessous', () => {
    assert.ok(/id="patient-story"/.test(ORT), 'zone de récit absente');
    const s = DOJS.match(/le récit d'abord[\s\S]*?storyEl\.textContent = '📖 ' \+ parts\.join\(' '\);/)[0];
    assert.ok(/ortho_story_main/.test(s) && /ortho_story_up/.test(s) && /ortho_story_dominant/.test(s), 'phrases du récit absentes');
    assert.ok(!/iaAssist|fetch\(/.test(s), 'le récit de base ne doit faire AUCUN appel IA');
    assert.ok(/AI\.trend\(hist\)/.test(DOJS), 'la tendance vient du moteur local existant');
    // la zone de récit est dans l'en-tête, avant les cartes de chiffres
    assert.ok(ORT.indexOf('patient-story') < ORT.indexOf('Chiffres clés'), 'le récit doit précéder les chiffres');
  });

  console.log(`\n${passed} test(s) réussi(s), ${failed} échec(s).`);
  process.exit(failed ? 1 : 0);
})();
