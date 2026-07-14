// =====================================================================
//  TESTS — Correctifs v6.135-136 (retour utilisateur)
//  ---------------------------------------------------------------------
//  1. Connexion sans prénom : ne devait plus écraser silencieusement
//     le vrai prénom déjà enregistré avec l'exemple de placeholder
//     "Marie" (v6.135).
//  2. Nouveau dossier sans prénom : doit maintenant être refusé
//     explicitement plutôt que de créer un dossier au nom de "Marie"
//     par défaut (v6.135).
//  3. Pas de flash de l'écran de connexion avant la reconnexion
//     automatique — classe html.auto-login-pending posée/retirée au
//     bon moment (v6.136).
//
//  Lancer : node tests/login-name-and-flash.test.js
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

function extractInlineScripts(html){
  const scripts = [];
  const re = /<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/g;
  let m;
  while((m = re.exec(html))){
    const body = m[1].trim();
    if(body) scripts.push(body);
  }
  return scripts;
}

function loadPatientApp(){
  const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  const dom = new JSDOM(html, { url:'http://localhost/', runScripts:'outside-only', resources:'usable', pretendToBeVisual:true });
  const srcScripts = [...dom.window.document.querySelectorAll('script[src]')].map(s=>s.getAttribute('src'));
  for(const src of srcScripts){
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
  // charge aussi les scripts inline, comme index.html le ferait réellement
  const inlineScripts = extractInlineScripts(html);
  for(const code of inlineScripts){
    try{ dom.window.eval(code); }catch(e){ /* certains dépendent d'API absentes de jsdom (serviceWorker) */ }
  }
  dom.window.eval("Prefs.load();");
  return dom;
}

async function main(){

console.log('Connexion sans prénom — v6.135 (optionnel) puis v6.139 (redevenu obligatoire)');

await test('laisser le prénom vide refuse maintenant la connexion (v6.139 : redevenu obligatoire, précision de l\'utilisateur après la v6.135)', async ()=>{
  const dom = loadPatientApp();
  await dom.window.eval("Store.savePatient('T1', {name:'Paul',level:2,sessions:1,correct:1,total:1,streak:1})");
  dom.window.document.getElementById('name').value = ''; // vide, volontairement
  dom.window.document.getElementById('code').value = 'T1';
  await dom.window.eval('login()');
  const activeScreen = dom.window.document.querySelector('.screen.active');
  assert.strictEqual(activeScreen && activeScreen.id, 'login', 'devrait rester sur l\'écran de connexion, pas se connecter avec un prénom vide');
  const err = dom.window.document.getElementById('login-error').textContent;
  assert.ok(err.length > 0, 'un message d\'erreur devrait être affiché');
});

await test('remplir le prénom continue de mettre à jour le profil normalement', async ()=>{
  const dom = loadPatientApp();
  await dom.window.eval("Store.savePatient('T2', {name:'Paul',level:2,sessions:1,correct:1,total:1,streak:1})");
  dom.window.document.getElementById('name').value = 'Paulette';
  dom.window.document.getElementById('code').value = 'T2';
  await dom.window.eval('login()');
  const helloText = dom.window.document.getElementById('who-name').textContent;
  assert.strictEqual(helloText, 'Paulette');
});

console.log('\nNouveau dossier sans prénom (v6.135)');

await test('créer un dossier sans prénom est refusé, message clair affiché', ()=>{
  const dom = loadPatientApp();
  dom.window.document.getElementById('name').value = '';
  dom.window.eval('createNewPatient()');
  const err = dom.window.document.getElementById('login-error').textContent;
  assert.ok(err.length > 0, 'un message d\'erreur devrait être affiché');
  const activeScreen = dom.window.document.querySelector('.screen.active');
  assert.strictEqual(activeScreen.id, 'login', 'ne devrait pas être passé à l\'écran de bilan');
});

console.log('\nPas de flash de l\'écran de connexion (v6.136)');

await test('aucune session/profil mémorisé -> pas de classe auto-login-pending', ()=>{
  const dom = loadPatientApp();
  assert.strictEqual(dom.window.document.documentElement.classList.contains('auto-login-pending'), false);
});

await test('une session active -> la classe auto-login-pending est posée avant même app.js', ()=>{
  const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  const dom = new JSDOM(html, { url:'http://localhost/', runScripts:'outside-only', resources:'usable', pretendToBeVisual:true });
  dom.window.sessionStorage.setItem('reparole:active-session', 'T3');
  // exécute uniquement les scripts inline qui précèdent le chargement
  // de js/app.js dans le document, pour vérifier que la classe est
  // posée sans dépendre d'aucune fonction de js/app.js.
  const inlineScripts = extractInlineScripts(html);
  dom.window.eval(inlineScripts[0]); // le tout premier script inline du fichier
  assert.strictEqual(dom.window.document.documentElement.classList.contains('auto-login-pending'), true);
});

await test('attemptAutoLogin() retire toujours la classe à la fin, succès ou non', async ()=>{
  const dom = loadPatientApp();
  await dom.window.eval("Store.savePatient('T4', {name:'Test',level:2,sessions:1,correct:1,total:1,streak:1})");
  dom.window.sessionStorage.setItem('reparole:active-session', JSON.stringify({code:'T4', name:'Test'}));
  dom.window.document.documentElement.classList.add('auto-login-pending');
  await dom.window.eval('attemptAutoLogin()');
  assert.strictEqual(dom.window.document.documentElement.classList.contains('auto-login-pending'), false);
});

await test('attemptAutoLogin() retire la classe même en cas d\'échec (code introuvable)', async ()=>{
  const dom = loadPatientApp();
  dom.window.sessionStorage.setItem('reparole:active-session', JSON.stringify({code:'INEXISTANT', name:'Test'}));
  dom.window.document.documentElement.classList.add('auto-login-pending');
  await dom.window.eval('attemptAutoLogin()');
  assert.strictEqual(dom.window.document.documentElement.classList.contains('auto-login-pending'), false);
});

console.log(`\n${passed} test(s) réussi(s), ${failed} échec(s).`);
if(failed > 0) process.exit(1);
}

main();
