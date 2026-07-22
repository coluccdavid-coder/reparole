// =====================================================================
//  TESTS — Mode sombre (v6.71)
//  ---------------------------------------------------------------------
//  v6.127 : la section "codes mémorisés" (localStorage, accès rapide au
//  retour) a été retirée sur demande explicite de l'utilisateur — il ne
//  voulait aucun profil mémorisé de façon permanente. Remplacée par une
//  continuité de session scopée à l'onglet (sessionStorage), testée
//  séparément dans tests/auto-login.test.js. Ce fichier ne couvre donc
//  plus que le mode sombre — nom de fichier conservé pour ne pas casser
//  la référence dans package.json.
//
//  Lancer : node tests/dark-mode-and-profiles.test.js
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
    if(src === 'js/app.js'){
      code += `\nwindow.Store = Store;\n`;
    }
    dom.window.eval(code);
  }
  dom.window.eval('Prefs.load();');
  return dom;
}

async function main(){

console.log('Mode sombre (Prefs.data.darkMode)');

await test('désactivé par défaut : pas de classe dark-mode sur <body>', ()=>{
  const dom = loadPatientApp();
  assert.strictEqual(dom.window.document.body.classList.contains('dark-mode'), false);
});

await test('Prefs.toggle(\'darkMode\') active/désactive la classe body', ()=>{
  const dom = loadPatientApp();
  dom.window.eval("Prefs.toggle('darkMode')");
  assert.strictEqual(dom.window.document.body.classList.contains('dark-mode'), true);
  dom.window.eval("Prefs.toggle('darkMode')");
  assert.strictEqual(dom.window.document.body.classList.contains('dark-mode'), false);
});

await test('le bouton existe aux deux emplacements avec le bon data-pref', ()=>{
  const dom = loadPatientApp();
  const btns = [...dom.window.document.querySelectorAll('[data-pref="darkMode"]')];
  assert.strictEqual(btns.length, 2);
});

console.log(`\n${passed} test(s) réussi(s), ${failed} échec(s).`);
if(failed > 0) process.exit(1);

}

main();
