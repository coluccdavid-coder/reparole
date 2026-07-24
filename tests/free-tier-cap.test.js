// =====================================================================
//  TESTS — Plafond de questions par session en compte gratuit (v6.55)
//  ---------------------------------------------------------------------
//  FREE_QUESTIONS_PER_SESSION (js/app.js) : un compte gratuit ne voit
//  que 5 questions par session, quel que soit le type d'exercice —
//  indépendant du mode "séance courte" (choix du patient, 3 questions,
//  pour les jours de fatigue). Les deux se combinent via le minimum.
//
//  Lancer : node tests/free-tier-cap.test.js
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
        window.__testGetCurrentTotal = function(){ return current ? current.total : null; };
        window.__testSetPaywallEnabled = function(v){ PAYWALL_ENABLED = v; };
      `;
    }
    if(src === 'js/storage.js'){
      // v6.45.1 : force le mode navigateur quelles que soient les vraies
      // clés Supabase baked-in dans storage.js.
      code = code.replace(/const SUPABASE_URL = "[^"]*";/, 'const SUPABASE_URL = "";')
                  .replace(/const SUPABASE_ANON_KEY = "[^"]*";/, 'const SUPABASE_ANON_KEY = "";');
    }
    dom.window.eval(code);
    // v6.247 : les 14 langues vivent dans js/i18n/<code>.js et les pages
    // n'en chargent qu'une. En test, on les charge toutes.
    if(typeof src !== 'undefined' && src === 'js/i18n.js') fs.readdirSync(path.join(ROOT, 'js/i18n'))
      .forEach(lf => dom.window.eval(fs.readFileSync(path.join(ROOT, 'js/i18n', lf), 'utf8')));
  }
  return dom;
}

async function main(){

console.log('Plafond de questions par session (compte gratuit, v6.55)');

await test('compte gratuit, paywall actif : file plafonnée à 5 questions (35 disponibles)', async ()=>{
  const dom = loadPatientApp();
  dom.window.eval("Prefs.load(); __testSetUserCode('T'); __testSetUser({plan:'free'}); __testSetPaywallEnabled(true);");
  await dom.window.eval("startExercise('denomination')");
  const total = dom.window.eval('__testGetCurrentTotal()');
  assert.strictEqual(total, 5);
});

await test('compte pro, paywall actif : file complète, pas de plafond', async ()=>{
  const dom = loadPatientApp();
  dom.window.eval("Prefs.load(); __testSetUserCode('T'); __testSetUser({plan:'pro'}); __testSetPaywallEnabled(true);");
  await dom.window.eval("startExercise('denomination')");
  const total = dom.window.eval('__testGetCurrentTotal()');
  assert.strictEqual(total, 35);
});

await test('compte gratuit + mode "séance courte" : le plus petit des deux plafonds s\'applique (3, pas 5)', async ()=>{
  const dom = loadPatientApp();
  dom.window.eval("Prefs.load(); __testSetUserCode('T'); __testSetUser({plan:'free'}); Prefs.toggle('shortSession');");
  await dom.window.eval("startExercise('denomination')");
  const total = dom.window.eval('__testGetCurrentTotal()');
  assert.strictEqual(total, 3);
});

await test('paywall désactivé : pas de plafond même en compte gratuit', async ()=>{
  const dom = loadPatientApp();
  dom.window.eval("Prefs.load(); __testSetUserCode('T'); __testSetUser({plan:'free'}); __testSetPaywallEnabled(false);");
  await dom.window.eval("startExercise('denomination')");
  const total = dom.window.eval('__testGetCurrentTotal()');
  assert.strictEqual(total, 35);
});

await test('un type ayant déjà moins de 5 items n\'est pas affecté (fluence, 2 catégories)', async ()=>{
  const dom = loadPatientApp();
  dom.window.eval("Prefs.load(); __testSetUserCode('T'); __testSetUser({plan:'pro'});"); // pro pour contourner le verrou de type (fluence = PRO_ONLY_TYPES)
  await dom.window.eval("startExercise('fluence')");
  const total = dom.window.eval('__testGetCurrentTotal()');
  assert.strictEqual(total, 2);
});

console.log(`\n${passed} test(s) réussi(s), ${failed} échec(s).`);
if(failed > 0) process.exitCode = 1;

}

main();
