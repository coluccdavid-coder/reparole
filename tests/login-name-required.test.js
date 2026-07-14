// =====================================================================
//  TESTS — Le prénom redevient obligatoire pour se connecter (v6.139)
//  ---------------------------------------------------------------------
//  Précision de l'utilisateur après la v6.135 : "pour moi un code est
//  associé à un nom. on devrait pas pouvoir rentrer sans le nom." — le
//  prénom, optionnel depuis la v6.135 (on gardait juste le prénom déjà
//  connu si le champ était vide), redevient obligatoire pour se
//  connecter, pas seulement pour créer un dossier.
//
//  Point d'attention : la reconnexion automatique (v6.126-129) ne doit
//  pas casser avec ce nouveau contrôle — voir rememberActiveSession(),
//  qui stocke maintenant {code, name} plutôt que le seul code, pour
//  qu'attemptAutoLogin() puisse remplir les deux champs.
//
//  Lancer : node tests/login-name-required.test.js
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
      code += `window.Store = Store; window.__testGetUserCode = function(){ return userCode; };`;
    }
    dom.window.eval(code);
  }
  dom.window.eval("Prefs.load();");
  return dom;
}

async function main(){

console.log('login() exige un prénom, pas seulement un code');

await test('code seul, champ prénom vide -> erreur, ne se connecte pas', async ()=>{
  const dom = loadPatientApp();
  await dom.window.eval("Store.savePatient('T1', {name:'Marie',level:2,sessions:0,correct:0,total:0,streak:1})");
  dom.window.document.getElementById('code').value = 'T1';
  dom.window.document.getElementById('name').value = '';
  await dom.window.eval('login()');
  const activeScreen = dom.window.document.querySelector('.screen.active');
  assert.strictEqual(activeScreen && activeScreen.id, 'login', 'devrait rester sur l\'écran de connexion');
  const err = dom.window.document.getElementById('login-error').textContent;
  assert.ok(err.length > 0, 'un message d\'erreur devrait être affiché');
});

await test('code + prénom -> connexion normale', async ()=>{
  const dom = loadPatientApp();
  await dom.window.eval("Store.savePatient('T2', {name:'Marie',level:2,sessions:0,correct:0,total:0,streak:1})");
  dom.window.document.getElementById('code').value = 'T2';
  dom.window.document.getElementById('name').value = 'Marie';
  await dom.window.eval('login()');
  const activeScreen = dom.window.document.querySelector('.screen.active');
  assert.strictEqual(activeScreen && activeScreen.id, 'dashboard');
});

console.log('\nLa reconnexion automatique continue de fonctionner (remplit les 2 champs, pas juste le code)');

await test('attemptAutoLogin() remplit le prénom en plus du code (sessionStorage)', async ()=>{
  const dom = loadPatientApp();
  await dom.window.eval("Store.savePatient('T3', {name:'Alex',level:2,sessions:0,correct:0,total:0,streak:1})");
  dom.window.sessionStorage.setItem('reparole:active-session', JSON.stringify({code:'T3', name:'Alex'}));
  await dom.window.eval('attemptAutoLogin()');
  const activeScreen = dom.window.document.querySelector('.screen.active');
  assert.strictEqual(activeScreen && activeScreen.id, 'dashboard', 'la reconnexion automatique ne doit pas être bloquée par le nouveau contrôle');
});

await test('attemptAutoLogin() remplit le prénom en plus du code (profil mémorisé, localStorage)', async ()=>{
  const dom = loadPatientApp();
  await dom.window.eval("Store.savePatient('T4', {name:'Nora',level:2,sessions:0,correct:0,total:0,streak:1})");
  dom.window.eval("saveRememberedProfiles([{code:'T4', name:'Nora', at:new Date().toISOString()}])");
  await dom.window.eval('attemptAutoLogin()');
  const activeScreen = dom.window.document.querySelector('.screen.active');
  assert.strictEqual(activeScreen && activeScreen.id, 'dashboard');
});

console.log(`\n${passed} test(s) réussi(s), ${failed} échec(s).`);
if(failed > 0) process.exit(1);
}

main();
