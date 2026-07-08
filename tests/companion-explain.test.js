// =====================================================================
//  TESTS — Ami explique l'exercice en arrivant (v6.34)
//  ---------------------------------------------------------------------
//  Vérifie, via une simulation DOM (jsdom, pas un vrai navigateur — même
//  limite que les autres tests de ce dossier) :
//   1. Complétude : les 7 langues "interface complète" (fr/en/es/it/pt/
//      de/ar) ont bien une explication pour chacun des 11 types
//      d'exercice — sinon un patient dans cette langue verrait un texte
//      vide au lieu d'une phrase.
//   2. Companion.explain() affiche la bonne phrase dans le bon
//      conteneur, et respecte le repli sur le français si la langue
//      active n'a pas (encore) de banque `explain`.
//   3. L'animation d'arrivée (classe CSS + délai de la bulle) est bien
//      appliquée par défaut, et bien DÉSACTIVÉE en mode "réduire les
//      animations" / lecture facilitée — même garde-fou d'accessibilité
//      que le reste du compagnon.
//
//  Lancer : node tests/companion-explain.test.js
// =====================================================================

const { JSDOM } = require('jsdom');
const fs = require('fs');
const path = require('path');
const assert = require('assert');

const ROOT = path.join(__dirname, '..');
let passed = 0, failed = 0;
function test(name, fn){
  try{ fn(); console.log('  ✔', name); passed++; }
  catch(e){ console.log('  ✘', name, '—', e.message); failed++; }
}

const FULL_LANGS = ['fr','en','es','it','pt','de','ar','tr','pl']; // langues "interface complète" (kab exclu, comme pour I18N)
const EXPECTED_TYPES = ['denomination','completion','comprehension','repetition','denomination_orale','fluence','intonation','photos_perso','memory','phonation','conversation'];

function loadApp(){
  const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  const dom = new JSDOM(html, { url:'http://localhost/', runScripts:'outside-only', resources:'usable', pretendToBeVisual:true });
  const scripts = [...dom.window.document.querySelectorAll('script[src]')].map(s=>s.getAttribute('src'));
  for(const src of scripts){
    const code = fs.readFileSync(path.join(ROOT, src), 'utf8');
    dom.window.eval(code);
  }
  dom.window.eval("Prefs.load();");
  return dom;
}

console.log("Ami : explication à l'arrivée sur un exercice");

console.log('\nComplétude des explications (7 langues x 11 types)');
{
  const dom = loadApp();
  for(const lang of FULL_LANGS){
    for(const type of EXPECTED_TYPES){
      test(`${lang} — explain.${type} défini et non vide`, () => {
        const val = dom.window.eval(`COMPANION_PHRASES['${lang}'] && COMPANION_PHRASES['${lang}'].explain && COMPANION_PHRASES['${lang}'].explain['${type}']`);
        assert.ok(typeof val === 'string' && val.trim().length > 0);
      });
    }
  }
}

console.log('\nComportement de Companion.explain()');
{
  const dom = loadApp();

  test('affiche la bonne phrase (français) dans le bon conteneur', () => {
    dom.window.eval("Companion.explain('companion-exercise', 'denomination');");
    const bubbleText = dom.window.document.querySelector('#companion-exercise .companion-bubble').textContent;
    const expected = dom.window.eval("COMPANION_PHRASES.fr.explain.denomination");
    assert.strictEqual(bubbleText, expected);
  });

  test("repli sur le français si la langue active n'a pas de banque explain", () => {
    dom.window.eval("Prefs.setLang('kab'); Companion.explain('companion-exercise', 'denomination');");
    const bubbleText = dom.window.document.querySelector('#companion-exercise .companion-bubble').textContent;
    const expectedFr = dom.window.eval("COMPANION_PHRASES.fr.explain.denomination");
    assert.strictEqual(bubbleText, expectedFr);
    dom.window.eval("Prefs.setLang('fr');");
  });

  test('utilise la bonne langue quand une banque explain existe (espagnol)', () => {
    dom.window.eval("Prefs.setLang('es'); Companion.explain('companion-exercise', 'phonation');");
    const bubbleText = dom.window.document.querySelector('#companion-exercise .companion-bubble').textContent;
    const expectedEs = dom.window.eval("COMPANION_PHRASES.es.explain.phonation");
    assert.strictEqual(bubbleText, expectedEs);
    dom.window.eval("Prefs.setLang('fr');");
  });

  test("chaque écran d'exercice a bien un conteneur pour Ami (dashboard, exercice, mémoire, phonation, conversation)", () => {
    for(const id of ['companion-dashboard','companion-exercise','companion-memory','companion-phonation','companion-conversation']){
      assert.ok(dom.window.document.getElementById(id), `conteneur manquant : #${id}`);
    }
  });
}

console.log("\nAnimation d'arrivée et accessibilité");
{
  const dom = loadApp();

  test("par défaut : entrée marquée + bulle retardée", () => {
    dom.window.eval("Companion.explain('companion-exercise', 'memory');");
    const wrapper = dom.window.document.querySelector('#companion-exercise .companion-enter-explain');
    const bubble = dom.window.document.querySelector('#companion-exercise .companion-bubble-delayed');
    assert.ok(wrapper, "l'entrée doit utiliser companion-enter-explain, pas la simple companion-enter");
    assert.ok(bubble, "la bulle doit porter companion-bubble-delayed pour apparaître après l'arrivée");
  });

  test('mode lecture facilitée : pas de marche ni de délai, tout apparaît directement', () => {
    dom.window.eval("Prefs.data.dyslexia = true; Companion.explain('companion-exercise', 'memory');");
    const wrapper = dom.window.document.querySelector('#companion-exercise .companion-enter-explain');
    const bubble = dom.window.document.querySelector('#companion-exercise .companion-bubble-delayed');
    assert.strictEqual(wrapper, null, "pas d'animation de marche en mode lecture facilitée");
    assert.strictEqual(bubble, null, "pas de délai de bulle en mode lecture facilitée");
    const bubbleText = dom.window.document.querySelector('#companion-exercise .companion-bubble').textContent;
    assert.ok(bubbleText.length > 0, "le message doit tout de même être affiché, juste sans animation");
    dom.window.eval("Prefs.data.dyslexia = false;");
  });
}

console.log(`\n${passed} test(s) réussi(s), ${failed} échec(s).`);
process.exit(failed ? 1 : 0);
