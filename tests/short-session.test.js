// =====================================================================
//  TESTS — Mode "séance courte" (v6.41)
//  ---------------------------------------------------------------------
//  Vérifie que Prefs.data.shortSession tronque bien la file de
//  questions à 3 items (sans jamais modifier le contenu lui-même,
//  juste combien de questions sont posées d'affilée), et qu'il n'a
//  aucun effet quand il est désactivé.
//
//  Lancer : node tests/short-session.test.js
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
    // `user` et `current` sont des `let` de haut niveau dans app.js —
    // invisibles depuis un eval() séparé (piège déjà documenté dans
    // SKILL_ReParole_v6.md). On les expose DANS le même eval().
    if(src === 'js/app.js'){
      code += `
        window.__testSetUser = function(overrides){
          user = Object.assign({name:'Test',level:2,sessions:0,correct:0,total:0,streak:1,plan:'free'}, overrides||{});
        };
        window.__testSetPaywallEnabled = function(v){ PAYWALL_ENABLED = v; };
        window.__testSetUserCode = function(code){ userCode = code; };
        window.__testGetCurrentTotal = function(){ return current ? current.total : null; };
        window.__testGetCurrentAnswers = function(){ return current ? current.queue.map(q=>q.answer) : null; };
      `;
    }
    dom.window.eval(code);
    // v6.247 : les 14 langues vivent dans js/i18n/<code>.js et les pages
    // n'en chargent qu'une. En test, on les charge toutes.
    if(typeof src !== 'undefined' && src === 'js/i18n.js') fs.readdirSync(path.join(ROOT, 'js/i18n'))
      .forEach(lf => dom.window.eval(fs.readFileSync(path.join(ROOT, 'js/i18n', lf), 'utf8')));
  }
  dom.window.eval("Prefs.load(); __testSetUserCode('T'); __testSetUser({}); __testSetPaywallEnabled(false);");
  return dom;
}

console.log('Mode "séance courte" (Prefs.data.shortSession)');

test('désactivé par défaut : file complète (35 items niveau 2, dénomination)', ()=>{
  const dom = loadPatientApp();
  dom.window.eval("startExercise('denomination')");
  const total = dom.window.eval('__testGetCurrentTotal()');
  assert.strictEqual(total, 35);
});

test('activé : file tronquée à 3 items, quel que soit le type d\'exercice', ()=>{
  const dom = loadPatientApp();
  dom.window.eval("Prefs.toggle('shortSession'); startExercise('denomination')");
  const total = dom.window.eval('__testGetCurrentTotal()');
  assert.strictEqual(total, 3);
});

test('activé : ne casse rien sur un type ayant déjà moins de 3 items (fluence, 2 catégories)', ()=>{
  const dom = loadPatientApp();
  dom.window.eval("Prefs.toggle('shortSession'); startExercise('fluence')");
  const total = dom.window.eval('__testGetCurrentTotal()');
  assert.strictEqual(total, 2); // pas d'erreur, juste min(3, 2) = 2
});

test('activé puis désactivé : repasse à la file complète', ()=>{
  const dom = loadPatientApp();
  dom.window.eval("Prefs.toggle('shortSession'); startExercise('denomination')");
  assert.strictEqual(dom.window.eval('__testGetCurrentTotal()'), 3);
  dom.window.eval("Prefs.toggle('shortSession'); startExercise('denomination')");
  assert.strictEqual(dom.window.eval('__testGetCurrentTotal()'), 35);
});

test('le contenu lui-même n\'est pas modifié — seulement le nombre de questions', ()=>{
  const dom = loadPatientApp();
  dom.window.eval("Prefs.toggle('shortSession'); startExercise('denomination')");
  const firstAnswers = Array.from(dom.window.eval("__testGetCurrentAnswers()"));
  assert.deepStrictEqual(firstAnswers, ['PAPILLON','MONTRE','VIOLON']); // les 3 premiers items de BANK.denomination.items[2] (niveau par défaut du test)
});

console.log(`\n${passed} test(s) réussi(s), ${failed} échec(s).`);
if(failed > 0) process.exitCode = 1;
