// =====================================================================
//  TESTS — Mode "cibles agrandies" / accessibilité motrice (v6.68)
//  ---------------------------------------------------------------------
//  Vérifie que Prefs.data.bigTargets se comporte comme les autres
//  préférences d'accessibilité (dyslexie, séance courte) : off par
//  défaut, bascule via Prefs.toggle('bigTargets'), persiste après un
//  rechargement, applique la classe body.big-targets, et que le bouton
//  correspondant existe bien dans les deux emplacements de l'app
//  patient (écran de connexion + tableau de bord).
//
//  Lancer : node tests/motor-accessibility.test.js
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
    const code = fs.readFileSync(path.join(ROOT, src), 'utf8');
    dom.window.eval(code);
  }
  dom.window.eval('Prefs.load();');
  return dom;
}

console.log('Mode "cibles agrandies" (Prefs.data.bigTargets, v6.68)');

test('désactivé par défaut : pas de classe big-targets sur <body>', ()=>{
  const dom = loadPatientApp();
  assert.strictEqual(dom.window.Prefs.data.bigTargets, false);
  assert.strictEqual(dom.window.document.body.classList.contains('big-targets'), false);
});

test('Prefs.toggle(\'bigTargets\') active la préférence et la classe body', ()=>{
  const dom = loadPatientApp();
  dom.window.eval("Prefs.toggle('bigTargets')");
  assert.strictEqual(dom.window.Prefs.data.bigTargets, true);
  assert.strictEqual(dom.window.document.body.classList.contains('big-targets'), true);
});

test('un second appel désactive de nouveau (vrai bascule, pas juste "toujours activer")', ()=>{
  const dom = loadPatientApp();
  dom.window.eval("Prefs.toggle('bigTargets')");
  dom.window.eval("Prefs.toggle('bigTargets')");
  assert.strictEqual(dom.window.Prefs.data.bigTargets, false);
  assert.strictEqual(dom.window.document.body.classList.contains('big-targets'), false);
});

test('la préférence persiste après un rechargement complet (nouvelle instance de la page)', ()=>{
  const dom1 = loadPatientApp();
  dom1.window.eval("Prefs.toggle('bigTargets')");
  const saved = dom1.window.localStorage.getItem('reparole:prefs');

  const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  const dom2 = new JSDOM(html, { url:'http://localhost/', runScripts:'outside-only', resources:'usable', pretendToBeVisual:true });
  dom2.window.localStorage.setItem('reparole:prefs', saved);
  const scripts = [...dom2.window.document.querySelectorAll('script[src]')].map(s=>s.getAttribute('src'));
  for(const src of scripts){
    dom2.window.eval(fs.readFileSync(path.join(ROOT, src), 'utf8'));
  }
  dom2.window.eval('Prefs.load();');
  assert.strictEqual(dom2.window.Prefs.data.bigTargets, true);
  assert.strictEqual(dom2.window.document.body.classList.contains('big-targets'), true);
});

test('ne désactive pas les autres préférences (dyslexie) au passage', ()=>{
  const dom = loadPatientApp();
  dom.window.eval("Prefs.toggle('dyslexia'); Prefs.toggle('bigTargets');");
  assert.strictEqual(dom.window.Prefs.data.dyslexia, true);
  assert.strictEqual(dom.window.document.body.classList.contains('dys'), true);
  assert.strictEqual(dom.window.document.body.classList.contains('big-targets'), true);
});

test('le bouton existe aux deux emplacements (connexion + tableau de bord), avec le bon data-pref', ()=>{
  const dom = loadPatientApp();
  const btns = [...dom.window.document.querySelectorAll('[data-pref="bigTargets"]')];
  assert.strictEqual(btns.length, 2, `attendu 2 boutons, trouvé ${btns.length}`);
  btns.forEach(btn=>{
    assert.strictEqual(btn.getAttribute('onclick'), "Prefs.toggle('bigTargets')");
  });
});

test('le bouton reflète l\'état actif (classe "on") une fois activé', ()=>{
  const dom = loadPatientApp();
  dom.window.eval("Prefs.toggle('bigTargets')");
  const btns = [...dom.window.document.querySelectorAll('[data-pref="bigTargets"]')];
  btns.forEach(btn=>{
    assert.strictEqual(btn.classList.contains('on'), true);
  });
});

test('la clé de traduction access_toggle_big_targets existe dans toutes les langues complètes', ()=>{
  const dom = loadPatientApp();
  const partials = dom.window.PARTIAL_LANGS || ['kab'];
  const langs = Object.keys(dom.window.LANGUAGES).filter(l=>!partials.includes(l));
  langs.forEach(l=>{
    const val = dom.window.I18N_STRINGS[l] && dom.window.I18N_STRINGS[l].access_toggle_big_targets;
    assert.ok(val && val.length > 0, `manquant pour la langue "${l}"`);
  });
});

console.log(`\n${passed} test(s) réussi(s), ${failed} échec(s).`);
if(failed > 0) process.exit(1);
