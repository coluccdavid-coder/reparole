// =====================================================================
//  FILET DE SÉCURITÉ — bulle d'aide au survol / appui long (v6.33)
//  ---------------------------------------------------------------------
//  Demande explicite de l'utilisateur : une bulle d'aide expliquant les
//  icônes/boutons peu clairs, au survol (souris) ou à l'appui long
//  (tactile), sans déclencher l'action du bouton par erreur.
//
//  Ce test vérifie :
//   1. Survol prolongé (350ms) -> bulle affichée avec le bon texte.
//   2. La souris qui quitte avant le délai -> bulle jamais affichée.
//   3. Focus clavier -> bulle affichée immédiatement ; blur -> masquée.
//   4. Appui tactile bref (< 500ms) -> bulle JAMAIS affichée, l'action
//      du bouton n'est PAS bloquée (comportement normal préservé).
//   5. Appui tactile maintenu (>= 500ms) -> bulle affichée ET l'action
//      du bouton est annulée pour cet appui (preventDefault appelé).
//   6. Échap masque une bulle ouverte.
//
//  Lancer : node tests/help-tooltip.test.js
// =====================================================================

const { JSDOM } = require('jsdom');
const assert = require('assert');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
let passed = 0;
function test(name, fn){
  try{ fn(); console.log('  ✔', name); passed++; }
  catch(e){ console.error('  ✘', name, '\n    ', e.message); process.exitCode = 1; }
}
async function testAsync(name, fn){
  try{ await fn(); console.log('  ✔', name); passed++; }
  catch(e){ console.error('  ✘', name, '\n    ', e.message); process.exitCode = 1; }
}

function loadHarness(){
  const dom = new JSDOM(`<!doctype html><html><body>
    <button id="btn" data-help="help_voice_badge" tabindex="0">VOIX</button>
  </body></html>`, { url:'http://localhost/', runScripts:'outside-only', pretendToBeVisual:true });
  const { window } = dom;
  window.eval(fs.readFileSync(path.join(ROOT, 'js/i18n.js'), 'utf8'));
  window.eval(fs.readFileSync(path.join(ROOT, 'js/help-tooltip.js'), 'utf8'));
  return window;
}

// Renvoie `true` si l'événement n'a PAS été annulé (preventDefault non appelé) — comme dispatchEvent() nativement.
function fire(win, el, type, opts){
  const ev = new win.Event(type, { bubbles:true, cancelable:true });
  // Event() (générique) ignore les propriétés inconnues passées dans son
  // dictionnaire d'init (ex: `key` pour un keydown) — on les pose donc
  // directement sur l'instance après coup.
  Object.assign(ev, opts||{});
  return el.dispatchEvent(ev);
}

(async () => {
  console.log('Bulle d\'aide au survol / appui long (js/help-tooltip.js)');

  await testAsync('survol prolongé (350ms) affiche la bulle avec le bon texte', async () => {
    const window = loadHarness();
    const btn = window.document.getElementById('btn');
    fire(window, btn, 'mouseenter');
    await new Promise(r=>setTimeout(r, 420));
    const tip = window.document.querySelector('.help-tooltip');
    assert(tip, 'la bulle doit exister dans le DOM');
    assert.strictEqual(tip.style.display, 'block', 'la bulle doit être visible après 350ms de survol');
    assert(tip.textContent.length > 0, 'la bulle doit contenir du texte');
  });

  await testAsync('la souris qui quitte avant le délai : bulle jamais affichée', async () => {
    const window = loadHarness();
    const btn = window.document.getElementById('btn');
    fire(window, btn, 'mouseenter');
    await new Promise(r=>setTimeout(r, 100));
    fire(window, btn, 'mouseleave');
    await new Promise(r=>setTimeout(r, 350));
    const tip = window.document.querySelector('.help-tooltip');
    assert(!tip || tip.style.display !== 'block', 'la bulle ne doit pas s\'afficher si la souris repart avant le délai');
  });

  await testAsync('focus clavier affiche la bulle immédiatement, blur la masque', async () => {
    const window = loadHarness();
    const btn = window.document.getElementById('btn');
    fire(window, btn, 'focusin');
    const tip = window.document.querySelector('.help-tooltip');
    assert(tip && tip.style.display === 'block', 'la bulle doit apparaître immédiatement au focus (accessibilité clavier)');
    fire(window, btn, 'focusout');
    assert.strictEqual(tip.style.display, 'none', 'la bulle doit disparaître au blur');
  });

  await testAsync('appui tactile bref (< 500ms) : bulle jamais affichée, action du bouton non bloquée', async () => {
    const window = loadHarness();
    const btn = window.document.getElementById('btn');
    fire(window, btn, 'touchstart');
    await new Promise(r=>setTimeout(r, 150));
    const defaultNotPrevented = fire(window, btn, 'touchend'); // true si preventDefault() n'a PAS été appelé
    assert(defaultNotPrevented, 'un tap normal ne doit jamais bloquer l\'action du bouton');
    const tip = window.document.querySelector('.help-tooltip');
    assert(!tip || tip.style.display !== 'block', 'la bulle ne doit pas s\'afficher pour un tap normal');
  });

  await testAsync('appui tactile maintenu (>= 500ms) : bulle affichée ET action bloquée pour cet appui', async () => {
    const window = loadHarness();
    const btn = window.document.getElementById('btn');
    fire(window, btn, 'touchstart');
    await new Promise(r=>setTimeout(r, 550));
    const tip = window.document.querySelector('.help-tooltip');
    assert(tip && tip.style.display === 'block', 'la bulle doit s\'afficher après un appui maintenu 500ms+');
    const defaultNotPrevented = fire(window, btn, 'touchend');
    assert(!defaultNotPrevented, 'l\'action du bouton doit être bloquée (preventDefault) après un appui long réussi');
  });

  await testAsync('Échap masque une bulle ouverte', async () => {
    const window = loadHarness();
    const btn = window.document.getElementById('btn');
    fire(window, btn, 'focusin');
    const tip = window.document.querySelector('.help-tooltip');
    assert.strictEqual(tip.style.display, 'block', 'pré-requis : la bulle doit être ouverte avant de tester Échap');
    fire(window, window.document, 'keydown', { key:'Escape' });
    assert.strictEqual(tip.style.display, 'none', 'Échap doit masquer la bulle ouverte');
  });

  console.log(`\n${passed} test(s) réussi(s).`);
  if(!process.exitCode){
    console.log('\n✅ Aucun problème détecté — la bulle d\'aide fonctionne au survol, au clavier et au tactile.');
  } else {
    console.log('\n❌ Des problèmes ont été détectés ci-dessus.');
  }
})();
