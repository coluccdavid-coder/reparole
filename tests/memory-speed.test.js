// =====================================================================
//  TESTS — Vitesse réglable du jeu de mémoire (v6.74)
//  ---------------------------------------------------------------------
//  Retour utilisateur : proposer un vrai "lent" pour commencer, puis
//  monter en vitesse — auparavant fixe à 900ms quel que soit le niveau.
//  Vérifie : valeur par défaut, calcul du délai par vitesse, persistance
//  via Prefs (même mécanisme que les autres préférences), présence du
//  sélecteur et bon reflet de la préférence enregistrée.
//
//  Lancer : node tests/memory-speed.test.js
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
    dom.window.eval(fs.readFileSync(path.join(ROOT, src), 'utf8'));
  }
  dom.window.eval('Prefs.load();');
  return dom;
}

console.log('Vitesse du jeu de mémoire (v6.74)');

test("valeur par défaut : 'normal'", ()=>{
  const dom = loadPatientApp();
  assert.strictEqual(dom.window.Prefs.data.memorySpeed, 'normal');
});

test('memorySpeedMs() renvoie un délai différent et croissant pour chaque vitesse (lent > normal > rapide)', ()=>{
  const dom = loadPatientApp();
  const slow = dom.window.eval("Prefs.data.memorySpeed='slow'; memorySpeedMs()");
  const normal = dom.window.eval("Prefs.data.memorySpeed='normal'; memorySpeedMs()");
  const fast = dom.window.eval("Prefs.data.memorySpeed='fast'; memorySpeedMs()");
  assert.ok(slow > normal, `lent (${slow}) doit être plus long que normal (${normal})`);
  assert.ok(normal > fast, `normal (${normal}) doit être plus long que rapide (${fast})`);
});

test("valeur inconnue/absente -> repli sur 'normal', pas d'erreur", ()=>{
  const dom = loadPatientApp();
  const ms = dom.window.eval("Prefs.data.memorySpeed='n-importe-quoi'; memorySpeedMs()");
  assert.strictEqual(ms, dom.window.eval("Prefs.data.memorySpeed='normal'; memorySpeedMs()"));
});

test('Memory.setSpeed() enregistre le choix dans Prefs (persiste comme les autres préférences)', ()=>{
  const dom = loadPatientApp();
  dom.window.eval("Memory.setSpeed('slow')");
  assert.strictEqual(dom.window.Prefs.data.memorySpeed, 'slow');
  const saved = JSON.parse(dom.window.localStorage.getItem('reparole:prefs'));
  assert.strictEqual(saved.memorySpeed, 'slow');
});

test('Memory.setSpeed() ignore une valeur invalide (ne casse pas la préférence existante)', ()=>{
  const dom = loadPatientApp();
  dom.window.eval("Memory.setSpeed('fast')");
  dom.window.eval("Memory.setSpeed('supersonique')");
  assert.strictEqual(dom.window.Prefs.data.memorySpeed, 'fast');
});

test('le sélecteur existe dans l\'écran mémoire, avec les 3 options attendues', ()=>{
  const dom = loadPatientApp();
  const select = dom.window.document.getElementById('memory-speed-select');
  assert.ok(select, 'sélecteur introuvable');
  const values = [...select.querySelectorAll('option')].map(o=>o.value);
  assert.deepStrictEqual(values, ['slow','normal','fast']);
  assert.strictEqual(select.getAttribute('onchange'), 'Memory.setSpeed(this.value)');
});

test('Memory.renderSpeedSelect() reflète la préférence déjà enregistrée sur le sélecteur', ()=>{
  const dom = loadPatientApp();
  dom.window.eval("Prefs.data.memorySpeed='fast'");
  dom.window.eval('Memory.renderSpeedSelect()');
  const select = dom.window.document.getElementById('memory-speed-select');
  assert.strictEqual(select.value, 'fast');
});

test('la clé de traduction memory_speed_label existe dans toutes les langues complètes', ()=>{
  const dom = loadPatientApp();
  const partials = dom.window.PARTIAL_LANGS || ['kab'];
  const langs = Object.keys(dom.window.LANGUAGES).filter(l=>!partials.includes(l));
  langs.forEach(l=>{
    ['memory_speed_label','memory_speed_slow','memory_speed_normal','memory_speed_fast'].forEach(key=>{
      const val = dom.window.I18N_STRINGS[l] && dom.window.I18N_STRINGS[l][key];
      assert.ok(val && val.length > 0, `manquant : ${key} pour la langue "${l}"`);
    });
  });
});

console.log(`\n${passed} test(s) réussi(s), ${failed} échec(s).`);
if(failed > 0) process.exit(1);
