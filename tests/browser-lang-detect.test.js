// =====================================================================
//  TESTS — Détection de la langue du navigateur pour kabyle/sango (v6.67)
//  ---------------------------------------------------------------------
//  À la toute première visite (aucune préférence encore enregistrée),
//  Prefs.load() propose directement le kabyle ou le sango si le
//  navigateur/appareil est configuré dans l'une de ces langues, plutôt
//  que de toujours partir du français. Volontairement limité aux
//  langues partielles (PARTIAL_LANGS) : les autres langues déjà
//  proposées (anglais, espagnol...) ne posent pas de problème de
//  découvrabilité dans le sélecteur manuel, donc on ne les bascule pas
//  automatiquement — voir le commentaire dans js/prefs.js.
//
//  Lancer : node tests/browser-lang-detect.test.js
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

// languages: tableau simulant navigator.languages avant le tout premier
// Prefs.load(). savedPrefs: si fourni, simule une préférence déjà
// enregistrée (le navigateur ne doit alors plus jamais être consulté).
function loadPatientApp({ languages, savedPrefs } = {}){
  const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  const dom = new JSDOM(html, { url:'http://localhost/', runScripts:'outside-only', resources:'usable', pretendToBeVisual:true });
  if(languages){
    Object.defineProperty(dom.window.navigator, 'languages', { value: languages, configurable:true });
    Object.defineProperty(dom.window.navigator, 'language', { value: languages[0], configurable:true });
  }
  if(savedPrefs){
    dom.window.localStorage.setItem('reparole:prefs', JSON.stringify(savedPrefs));
  }
  const scripts = [...dom.window.document.querySelectorAll('script[src]')].map(s=>s.getAttribute('src'));
  for(const src of scripts){
    const code = fs.readFileSync(path.join(ROOT, src), 'utf8');
    dom.window.eval(code);
  }
  dom.window.eval('Prefs.load();');
  return dom;
}

console.log('Détection de la langue du navigateur (kabyle/sango uniquement, v6.67)');

test('navigateur en kabyle (kab-DZ) + première visite -> lang détectée = kab', ()=>{
  const dom = loadPatientApp({ languages:['kab-DZ', 'fr-FR'] });
  assert.strictEqual(dom.window.Prefs.data.lang, 'kab');
});

test('navigateur en sango (sg-CF) + première visite -> lang détectée = sg', ()=>{
  const dom = loadPatientApp({ languages:['sg-CF'] });
  assert.strictEqual(dom.window.Prefs.data.lang, 'sg');
});

test('la détection persiste (sauvegardée) : un second Prefs.load() la retrouve sans re-consulter le navigateur', ()=>{
  const dom = loadPatientApp({ languages:['kab'] });
  assert.strictEqual(dom.window.Prefs.data.lang, 'kab');
  // navigateur "change" ensuite (autre onglet, autre appareil...) : ne doit
  // plus rien changer puisqu'une préférence est désormais enregistrée.
  Object.defineProperty(dom.window.navigator, 'languages', { value:['en-US'], configurable:true });
  dom.window.eval('Prefs.load();');
  assert.strictEqual(dom.window.Prefs.data.lang, 'kab');
});

test('navigateur en anglais (en-US) + première visite -> reste en français (pas de bascule auto hors kab/sg)', ()=>{
  const dom = loadPatientApp({ languages:['en-US', 'en'] });
  assert.strictEqual(dom.window.Prefs.data.lang, 'fr');
});

test('préférence déjà enregistrée (ex. anglais choisi manuellement) -> jamais écrasée par le navigateur, même s\'il est en kab', ()=>{
  const dom = loadPatientApp({ languages:['kab'], savedPrefs:{ dyslexia:false, dysFont:false, lang:'en', shortSession:false } });
  assert.strictEqual(dom.window.Prefs.data.lang, 'en');
});

test('aucune langue reconnue (ex. "xx-XX") -> reste en français, pas d\'erreur', ()=>{
  const dom = loadPatientApp({ languages:['xx-XX'] });
  assert.strictEqual(dom.window.Prefs.data.lang, 'fr');
});

console.log(`\n${passed} test(s) réussi(s), ${failed} échec(s).`);
if(failed > 0) process.exit(1);
