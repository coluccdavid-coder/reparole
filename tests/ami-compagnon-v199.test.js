// =====================================================================
//  TESTS — v6.199 : Ami, d'assistant à COMPAGNON (+ 2 chartes).
//  ---------------------------------------------------------------------
//  Incréments : présence permanente (respiration), préparation
//  d'exercice, détection de fatigue COMPORTEMENTALE (sans capteur),
//  résumé de fin. RÈGLE D'OR VERROUILLÉE : Ami CONSTATE, ne RESSENT
//  jamais — aucune émotion 1re personne dans ses nouvelles phrases.
//  Lancer : node tests/ami-compagnon-v199.test.js
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
const APP = fs.readFileSync(path.join(ROOT, 'js/app.js'), 'utf8');
const CSS = fs.readFileSync(path.join(ROOT, 'css/style.css'), 'utf8');
const I18N = require('./i18n-source').texteComplet();

(async () => {

  await test('présence permanente : Ami respire (animation), et l\'identité violette lui est réservée', () => {
    assert.ok(/@keyframes ami-breathe/.test(CSS) && /\.companion-widget svg\{ animation:ami-breathe/.test(CSS), 'respiration absente');
    assert.ok(/--ami:/.test(CSS) && /\.companion-bubble\{ border-color:var\(--ami\)/.test(CSS), 'couleur d\'Ami absente ou non appliquée');
    assert.ok(/prefers-reduced-motion: reduce\)\{\s*\.companion-widget svg\{ animation:none/.test(CSS), 'la respiration doit respecter reduced-motion');
  });

  await test('préparation d\'exercice : Ami annonce quoi + durée AVANT de commencer (charte ERGONOMIE §8.2)', () => {
    assert.ok(/ami_prepare/.test(APP), 'appel de préparation absent');
    const k = I18N.match(/ami_prepare:\(o\)=>[^\n]+/)[0];
    assert.ok(/o\.ex/.test(k) && /o\.min/.test(k), 'la préparation doit citer l\'exercice ET la durée');
  });

  await test('fatigue : détectée par le COMPORTEMENT seul (erreurs successives + temps de réponse), une pause PROPOSÉE une fois', () => {
    assert.ok(/window\.__qStartMs = Date\.now\(\)/.test(APP), 'le chrono de réponse par question doit être posé');
    assert.ok(/__lastAnswerMs/.test(APP) && /__prevAnswerMs/.test(APP), 'la tendance du temps de réponse doit être mesurée');
    const block = APP.match(/FATIGUE[\s\S]*?ami_fatigue'\), true\)/)[0];
    assert.ok(/c\.wrongInRow >= 3/.test(block), 'seuil d\'erreurs successives absent');
    assert.ok(/_fatigueOffered/.test(block), 'la pause ne doit être proposée qu\'une fois');
    // on interdit tout APPEL à un capteur (le mot "capteur" figure
    // légitimement dans le commentaire rassurant, on ne le compte pas)
    const codeOnly = block.split('\n').filter(l=>!l.trim().startsWith('//')).join('\n');
    assert.ok(!/getUserMedia|MediaDevices|Camera|Sensor|DeviceMotion/i.test(codeOnly), 'AUCUN capteur : la fatigue est purement comportementale');
  });

  await test('résumé de fin : ce qui a été travaillé + résultat + une suite (charte ERGONOMIE §8.4)', () => {
    assert.ok(/function sessionRecap\(c, pct\)/.test(APP), 'la fonction de récap absente');
    const fn = APP.match(/function sessionRecap[\s\S]*?\n\}/)[0];
    assert.ok(/session_recap/.test(fn) && /recap_next_(up|same|soft)/.test(fn), 'le récap doit dire le travail ET la suite');
  });

  await test('RÈGLE D\'OR : les nouvelles phrases d\'Ami CONSTATENT, ne RESSENTENT jamais (aucune émotion 1re personne)', () => {
    const keys = I18N.match(/(ami_prepare|ami_fatigue|session_recap|recap_next_up|recap_next_same|recap_next_soft):[^\n]+/g) || [];
    assert.ok(keys.length >= 84, '6 clés × 14 langues attendues'); // 84
    for(const k of keys){
      assert.ok(!/je suis (content|heureux|triste|fier|fière)|I am (happy|sad|proud|glad)|estoy (feliz|orgullos|triste)|sono (felice|fiero|orgoglioso)|ich bin (froh|stolz|traurig)/i.test(k),
        'émotion 1re personne détectée : ' + k.slice(0, 50));
    }
  });

  await test('les 2 chartes existent, sont substantielles et référencées dans le portail docs', () => {
    for(const f of ['docs/DESIGN.md','docs/ERGONOMIE.md']){
      assert.ok(fs.existsSync(path.join(ROOT, f)), f + ' manquant');
      assert.ok(fs.readFileSync(path.join(ROOT, f),'utf8').length > 1500, f + ' trop maigre');
    }
    const idx = fs.readFileSync(path.join(ROOT, 'docs/INDEX.md'), 'utf8');
    assert.ok(/DESIGN\.md/.test(idx) && /ERGONOMIE\.md/.test(idx), 'chartes non référencées dans INDEX.md');
  });

  console.log(`\n${passed} test(s) réussi(s), ${failed} échec(s).`);
  process.exit(failed ? 1 : 0);
})();
