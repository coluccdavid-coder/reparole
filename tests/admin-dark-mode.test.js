// =====================================================================
//  TESTS — Mode sombre sur l'espace admin (v6.96)
//  ---------------------------------------------------------------------
//  admin.html ne chargeait jamais js/prefs.js jusqu'ici (seule page de
//  l'app sans mode sombre). Vérifie que Prefs fonctionne correctement
//  sans js/i18n.js chargé (admin.html reste volontairement non
//  multilingue) — apply()/renderLangSwitchers() sont déjà écrits de
//  façon défensive pour ce cas, ce test verrouille que ça continue de
//  fonctionner si prefs.js évolue plus tard.
//
//  Lancer : node tests/admin-dark-mode.test.js
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

function loadAdminPage(){
  const html = fs.readFileSync(path.join(ROOT, 'admin.html'), 'utf8');
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
  return dom;
}

async function main(){

console.log('Mode sombre — admin.html');

await test('js/prefs.js est bien chargé par admin.html', ()=>{
  const html = fs.readFileSync(path.join(ROOT, 'admin.html'), 'utf8');
  assert.ok(/<script src="js\/prefs\.js">/.test(html));
});

await test('le bouton "Mode sombre" existe dans la barre du tableau de bord admin', ()=>{
  const html = fs.readFileSync(path.join(ROOT, 'admin.html'), 'utf8');
  assert.ok(/data-pref="darkMode"[^>]*onclick="Prefs\.toggle\('darkMode'\)"/.test(html));
});

await test('Prefs.load() ne plante pas sur admin.html, même sans js/i18n.js chargé', ()=>{
  const dom = loadAdminPage();
  assert.ok(!dom.window.LANGUAGES, 'admin.html reste volontairement non multilingue (pas de i18n.js)');
  // ne doit pas lever d'exception
  dom.window.eval('Prefs.load();');
});

await test('Prefs.toggle(\'darkMode\') applique bien la classe sur <body>', ()=>{
  const dom = loadAdminPage();
  dom.window.eval('Prefs.load();');
  assert.strictEqual(dom.window.document.body.classList.contains('dark-mode'), false);
  dom.window.eval("Prefs.toggle('darkMode');");
  assert.strictEqual(dom.window.document.body.classList.contains('dark-mode'), true);
});

await test('le choix est mémorisé (localStorage) d\'une visite à l\'autre', ()=>{
  const dom = loadAdminPage();
  dom.window.eval("Prefs.load(); Prefs.toggle('darkMode');");
  const saved = JSON.parse(dom.window.localStorage.getItem('reparole:prefs'));
  assert.strictEqual(saved.darkMode, true);
});

console.log(`\n${passed} test(s) réussi(s), ${failed} échec(s).`);
if(failed > 0) process.exit(1);

}

main();
