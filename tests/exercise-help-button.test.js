// =====================================================================
//  TESTS — Bouton "❓ Aide" à la demande dans l'exercice (v6.70)
//  ---------------------------------------------------------------------
//  Avant cette version, l'explication d'Ami (Companion.explain()) ne
//  s'affichait qu'une fois, à l'arrivée sur l'exercice. Ces tests
//  vérifient que showExerciseHelp() permet de la revoir à tout moment,
//  pour n'importe quel type d'exercice et n'importe quelle langue
//  (repli sur le français pour le kabyle/sango, comme partout
//  ailleurs), et que le bouton est bien présent dans le DOM.
//
//  Lancer : node tests/exercise-help-button.test.js
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

function loadPatientApp(){
  const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  const dom = new JSDOM(html, { url:'http://localhost/', runScripts:'outside-only', resources:'usable', pretendToBeVisual:true });
  const scripts = [...dom.window.document.querySelectorAll('script[src]')].map(s=>s.getAttribute('src'));
  for(const src of scripts){
    let code = fs.readFileSync(path.join(ROOT, src), 'utf8');
    if(src === 'js/app.js'){
      code += `
        window.__testSetUser = function(overrides){
          user = Object.assign({name:'Test',level:2,sessions:0,correct:0,total:0,streak:1,plan:'free'}, overrides||{});
        };
        window.__testSetUserCode = function(code){ userCode = code; };
      `;
    }
    dom.window.eval(code);
  }
  dom.window.eval("Prefs.load(); __testSetUserCode('T'); __testSetUser({});");
  return dom;
}

console.log('Bouton d\'aide à la demande dans l\'exercice (showExerciseHelp)');

test('le bouton "❓ Aide" existe dans l\'en-tête de l\'exercice, relié à showExerciseHelp()', ()=>{
  const dom = loadPatientApp();
  const btn = dom.window.document.querySelector('#exercise .help-btn');
  assert.ok(btn, 'bouton .help-btn introuvable');
  assert.strictEqual(btn.getAttribute('onclick'), 'showExerciseHelp()');
});

test('appelé après startExercise(\'denomination\'), affiche la bonne explication en français', ()=>{
  const dom = loadPatientApp();
  dom.window.eval("startExercise('denomination')");
  dom.window.eval('showExerciseHelp()');
  const bubbleText = dom.window.document.querySelector('#companion-exercise .companion-bubble').textContent;
  const expected = dom.window.eval("COMPANION_PHRASES.fr.explain.denomination");
  assert.strictEqual(bubbleText, expected);
});

test('fonctionne pour un autre type d\'exercice (dénomination orale) avec sa propre explication', ()=>{
  const dom = loadPatientApp();
  dom.window.eval("startExercise('denomination_orale')");
  dom.window.eval('showExerciseHelp()');
  const bubbleText = dom.window.document.querySelector('#companion-exercise .companion-bubble').textContent;
  const expected = dom.window.eval("COMPANION_PHRASES.fr.explain.denomination_orale");
  assert.strictEqual(bubbleText, expected);
  assert.notStrictEqual(bubbleText, dom.window.eval("COMPANION_PHRASES.fr.explain.denomination"));
});

test('suit le changement de langue (anglais)', ()=>{
  const dom = loadPatientApp();
  dom.window.eval("Prefs.setLang('en')");
  dom.window.eval("startExercise('completion')");
  dom.window.eval('showExerciseHelp()');
  const bubbleText = dom.window.document.querySelector('#companion-exercise .companion-bubble').textContent;
  const expected = dom.window.eval("COMPANION_PHRASES.en.explain.completion");
  assert.strictEqual(bubbleText, expected);
});

test('langue partielle (sango) : repli sur le français, pas de texte vide ni d\'erreur', ()=>{
  // v6.119 : "kab" a désormais sa propre banque COMPANION_PHRASES —
  // "sg" (sango) est la langue partielle qui n'en a toujours pas,
  // utilisée ici pour vérifier le repli sur le français.
  const dom = loadPatientApp();
  dom.window.eval("Prefs.setLang('sg')");
  dom.window.eval("startExercise('denomination')");
  dom.window.eval('showExerciseHelp()');
  const bubbleText = dom.window.document.querySelector('#companion-exercise .companion-bubble').textContent;
  const expectedFallback = dom.window.eval("COMPANION_PHRASES.fr.explain.denomination");
  assert.strictEqual(bubbleText, expectedFallback);
});

test('langue partielle (kabyle, v6.119) : utilise sa propre banque, pas de repli français', ()=>{
  const dom = loadPatientApp();
  dom.window.eval("Prefs.setLang('kab')");
  dom.window.eval("startExercise('denomination')");
  dom.window.eval('showExerciseHelp()');
  const bubbleText = dom.window.document.querySelector('#companion-exercise .companion-bubble').textContent;
  const expectedKab = dom.window.eval("COMPANION_PHRASES.kab.explain.denomination");
  assert.strictEqual(bubbleText, expectedKab);
});

test('appelé sans exercice en cours (current === null) : ne plante pas', ()=>{
  const dom = loadPatientApp();
  assert.doesNotThrow(()=>{ dom.window.eval('showExerciseHelp()'); });
});

console.log('\nÉcrans indépendants (jeu de mémoire, tenue vocale, conversation guidée)');
// Ces trois-là ne passent pas par startExercise()/current — chacun a son
// propre conteneur Ami et son propre bouton d'aide dédié (voir index.html).

[
  { screen:'memory', containerId:'companion-memory', type:'memory' },
  { screen:'phonation', containerId:'companion-phonation', type:'phonation' },
  { screen:'conversation', containerId:'companion-conversation', type:'conversation' }
].forEach(({screen, containerId, type})=>{
  test(`${screen} : bouton d'aide présent, affiche la bonne explication`, ()=>{
    const dom = loadPatientApp();
    const btn = dom.window.document.querySelector(`#${screen} .help-btn`);
    assert.ok(btn, `bouton d'aide introuvable dans #${screen}`);
    dom.window.eval(`Companion.explain('${containerId}','${type}')`);
    const bubbleText = dom.window.document.querySelector(`#${containerId} .companion-bubble`).textContent;
    const expected = dom.window.eval(`COMPANION_PHRASES.fr.explain.${type}`);
    assert.strictEqual(bubbleText, expected);
  });
});

test('la clé de traduction help_btn_label existe dans toutes les langues complètes', ()=>{
  const dom = loadPatientApp();
  const partials = dom.window.PARTIAL_LANGS || ['kab','sg'];
  const langs = Object.keys(dom.window.LANGUAGES).filter(l=>!partials.includes(l));
  langs.forEach(l=>{
    const val = dom.window.I18N_STRINGS[l] && dom.window.I18N_STRINGS[l].help_btn_label;
    assert.ok(val && val.length > 0, `manquant pour la langue "${l}"`);
  });
});

console.log(`\n${passed} test(s) réussi(s), ${failed} échec(s).`);
if(failed > 0) process.exit(1);
