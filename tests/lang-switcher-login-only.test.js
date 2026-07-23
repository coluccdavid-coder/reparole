// =====================================================================
//  TESTS — Le choix de langue n'est disponible qu'à l'accueil (v6.148)
//  ---------------------------------------------------------------------
//  Signalé par l'utilisateur : le sélecteur de langue était aussi
//  accessible depuis le tableau de bord (juste au-dessus des bascules
//  d'accessibilité), en plus de l'écran de connexion — deux façons de
//  changer de langue, la seconde jugée superflue une fois connecté·e.
//  Retiré du tableau de bord, conservé uniquement à l'écran de
//  connexion.
//
//  Lancer : node tests/lang-switcher-login-only.test.js
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
    if(src === 'js/storage.js'){
      code = code.replace(/const SUPABASE_URL = "[^"]*";/, 'const SUPABASE_URL = "";')
                  .replace(/const SUPABASE_ANON_KEY = "[^"]*";/, 'const SUPABASE_ANON_KEY = "";');
    }
    dom.window.eval(code);
  }
  dom.window.eval("Prefs.load();");
  return dom;
}

async function main(){

await test('index.html : exactement un seul conteneur data-lang-switcher (écran de connexion)', ()=>{
  const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  const matches = html.match(/data-lang-switcher/g) || [];
  assert.strictEqual(matches.length, 1, `attendu 1 occurrence, trouvé ${matches.length}`);
});

await test('le conteneur restant est bien dans l\'écran de connexion (#login), pas le tableau de bord', ()=>{
  const dom = loadPatientApp();
  const switcher = dom.window.document.querySelector('[data-lang-switcher]');
  assert.ok(switcher, 'aucun sélecteur de langue trouvé');
  const loginScreen = dom.window.document.getElementById('login');
  assert.ok(loginScreen.contains(switcher), 'le sélecteur devrait être dans #login');
  const dashboard = dom.window.document.getElementById('dashboard');
  assert.ok(!dashboard.contains(switcher), 'le sélecteur ne devrait plus être dans #dashboard');
});

await test('renderLangSwitchers() ne crée qu\'un seul <select> de langue dans toute la page', ()=>{
  const dom = loadPatientApp();
  dom.window.eval('Prefs.renderLangSwitchers()');
  // v6.148 : select.lang-select seul ne suffit pas — cette classe CSS est
  // aussi partagée par #voice-select (choix de la voix de lecture, sans
  // rapport). On cible spécifiquement les <select> générés à l'intérieur
  // d'un conteneur [data-lang-switcher].
  const selects = dom.window.document.querySelectorAll('[data-lang-switcher] select');
  assert.strictEqual(selects.length, 1, `attendu 1 sélecteur, trouvé ${selects.length}`);
});

console.log(`\n${passed} test(s) réussi(s), ${failed} échec(s).`);
if(failed > 0) process.exit(1);
}

main();
