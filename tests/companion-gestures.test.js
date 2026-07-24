// =====================================================================
//  TESTS — Ami : nouvelles humeurs + gestes (bras), v6.65
//  ---------------------------------------------------------------------
//  Demande de l'utilisateur : plus d'expressions, et un personnage qui
//  "interagit" (gestes, pas juste un visage qui change). Ces tests
//  verrouillent le nouveau système mood/pose découplé.
//
//  Lancer : node tests/companion-gestures.test.js
// =====================================================================

const assert = require('assert');
const { JSDOM } = require('jsdom');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
let passed = 0, failed = 0;
function test(name, fn){
  try{ fn(); console.log('  ✔', name); passed++; }
  catch(e){ console.log('  ✘', name, '—', e.message); failed++; }
}

function loadCompanion(){
  const dom = new JSDOM('<!DOCTYPE html><div id="companion-dashboard"></div>', { url:'http://localhost/', runScripts:'outside-only', pretendToBeVisual:true });
  const code = fs.readFileSync(path.join(ROOT, 'js/companion.js'), 'utf8');
  dom.window.eval(code);
    // v6.247 : les 14 langues vivent dans js/i18n/<code>.js et les pages
    // n'en chargent qu'une. En test, on les charge toutes.
    if(typeof src !== 'undefined' && src === 'js/i18n.js') fs.readdirSync(path.join(ROOT, 'js/i18n'))
      .forEach(lf => dom.window.eval(fs.readFileSync(path.join(ROOT, 'js/i18n', lf), 'utf8')));
  return dom;
}

console.log('moodFor() / poseFor() — nouveaux contextes (v6.65)');

test('welcome / welcome_back -> humeur "calm", geste "wave"', () => {
  const dom = loadCompanion();
  assert.strictEqual(dom.window.eval("Companion.moodFor('welcome')"), 'calm');
  assert.strictEqual(dom.window.eval("Companion.moodFor('welcome_back')"), 'calm');
  assert.strictEqual(dom.window.eval("Companion.poseFor('welcome')"), 'wave');
});

test('tip -> humeur "thinking", geste "chin"', () => {
  const dom = loadCompanion();
  assert.strictEqual(dom.window.eval("Companion.moodFor('tip')"), 'thinking');
  assert.strictEqual(dom.window.eval("Companion.poseFor('tip')"), 'chin');
});

test('encourage -> humeur "caring" (plus "gentle")', () => {
  const dom = loadCompanion();
  assert.strictEqual(dom.window.eval("Companion.moodFor('encourage')"), 'caring');
});

test('streak -> geste "celebrate" (en plus de l\'humeur "delighted" déjà existante)', () => {
  const dom = loadCompanion();
  assert.strictEqual(dom.window.eval("Companion.moodFor('streak')"), 'delighted');
  assert.strictEqual(dom.window.eval("Companion.poseFor('streak')"), 'celebrate');
});

test('contexte inconnu -> geste "neutral" par défaut (pas d\'erreur)', () => {
  const dom = loadCompanion();
  assert.strictEqual(dom.window.eval("Companion.poseFor('un_contexte_qui_nexiste_pas')"), 'neutral');
});

console.log('\nRendu SVG — les bras apparaissent avec le bon geste');

test('say(\'welcome\') : le SVG rendu contient un bras en position "salut"', () => {
  const dom = loadCompanion();
  dom.window.eval("Companion.mount('companion-dashboard'); Companion.say('welcome')");
  const html = dom.window.document.getElementById('companion-dashboard').innerHTML;
  assert.ok(html.includes('companion-arm-wave'), 'le geste "wave" doit produire un bras avec la classe companion-arm-wave');
});

test('say(\'streak\') : le SVG contient deux bras "wave" (célébration) + les confettis', () => {
  const dom = loadCompanion();
  dom.window.eval("Companion.mount('companion-dashboard'); Companion.say('streak')");
  const html = dom.window.document.getElementById('companion-dashboard').innerHTML;
  const waveCount = (html.match(/companion-arm-wave/g) || []).length;
  assert.strictEqual(waveCount, 2, 'le geste "celebrate" lève les deux bras');
  assert.ok(html.includes('companion-confetti'), 'mood "delighted" doit afficher les confettis');
});

test('say(\'correct\') (mood "happy") : pas de geste spécial, bras au repos', () => {
  const dom = loadCompanion();
  dom.window.eval("Companion.mount('companion-dashboard'); Companion.say('correct')");
  const html = dom.window.document.getElementById('companion-dashboard').innerHTML;
  assert.ok(!html.includes('companion-arm-wave'), 'aucun geste "wave" ne doit apparaître pour une simple bonne réponse');
});

test('explain() : le geste "point" est appliqué (pas seulement l\'humeur "happy")', () => {
  const dom = loadCompanion();
  dom.window.eval("Companion.explain('companion-dashboard', 'denomination')");
  assert.strictEqual(dom.window.eval("Companion.pose"), 'point');
});

console.log('\nExpression "réfléchit" — la correction demandée par l\'utilisateur');

test('mood "thinking" utilise la même bouche calme que "calm" (pas une bouche asymétrique)', () => {
  const dom = loadCompanion();
  const svgThinking = dom.window.eval("Companion.svg('thinking')");
  const svgCalm = dom.window.eval("Companion.svg('calm')");
  const extractMouth = (html) => (html.match(/class="companion-mouth" d="([^"]+)"/) || [])[1];
  assert.strictEqual(extractMouth(svgThinking), extractMouth(svgCalm), 'la bouche de "thinking" doit être identique à "calm" (choix validé par l\'utilisateur, "Essai 1")');
});

console.log(`\n${passed} test(s) réussi(s), ${failed} échec(s).`);
if(failed > 0) process.exitCode = 1;
