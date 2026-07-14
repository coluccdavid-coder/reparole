// =====================================================================
//  TESTS — Reconnexion silencieuse (v6.129)
//  ---------------------------------------------------------------------
//  Historique : v6.126 mémorisait dans localStorage avec une liste de
//  boutons visible sur l'écran de connexion. v6.127 a tout retiré
//  (l'utilisateur ne voulait rien de permanent), remplacé par
//  sessionStorage seul. Précision finale de l'utilisateur : la
//  mémorisation permanente (localStorage) peut revenir, à condition de
//  ne RIEN afficher sur l'écran d'accueil — juste une reconnexion
//  silencieuse en arrière-plan.
//
//  Comportement final :
//  - sessionStorage (l'onglet en cours) a priorité : couvre le cas
//    d'un rafraîchissement pendant un exercice, même sur un appareil
//    partagé.
//  - Sinon, localStorage : reconnexion automatique SEULEMENT s'il y a
//    EXACTEMENT un profil mémorisé sur cet appareil (sinon, appareil
//    probablement partagé — écran de connexion normal, sans deviner
//    qui se connecte).
//  - Aucun bouton, aucune liste, rien de visible dans les deux cas.
//  - Un logout() explicite efface tout (session ET profil mémorisé) —
//    la déconnexion doit vraiment déconnecter, pas être court-circuitée
//    par la reconnexion automatique au prochain chargement.
//
//  Lancer : node tests/auto-login.test.js
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
  dom.window.eval("Prefs.load();");
  return dom;
}

async function main(){

console.log('Aucune interface visible pour la mémorisation (v6.129)');

await test('aucun conteneur ni bouton "profils mémorisés" dans le HTML', ()=>{
  const dom = loadPatientApp();
  assert.strictEqual(dom.window.document.getElementById('remembered-profiles'), null);
  assert.strictEqual(dom.window.document.querySelector('.remembered-profile'), null);
});

await test('une connexion réussie écrit bien dans localStorage (mémorisation permanente restaurée)', async ()=>{
  const dom = loadPatientApp();
  await dom.window.eval("Store.savePatient('T1', {name:'Marie',level:2,sessions:1,correct:1,total:1,streak:1})");
  dom.window.document.getElementById('name').value = 'Marie';
  dom.window.document.getElementById('code').value = 'T1';
  await dom.window.eval('login()');
  const list = dom.window.eval("loadRememberedProfiles()");
  assert.strictEqual(list.length, 1);
  assert.strictEqual(list[0].code, 'T1');
});

console.log('\nContinuité de session (sessionStorage, priorité la plus haute)');

await test('window.attemptAutoLogin existe (exposé depuis js/app.js)', ()=>{
  const dom = loadPatientApp();
  assert.strictEqual(typeof dom.window.attemptAutoLogin, 'function');
});

await test('rien en session ni en local -> pas de reconnexion automatique', async ()=>{
  const dom = loadPatientApp();
  const result = await dom.window.eval("attemptAutoLogin()");
  assert.strictEqual(result, false);
});

await test('une connexion réussie enregistre aussi le code en sessionStorage', async ()=>{
  const dom = loadPatientApp();
  await dom.window.eval("Store.savePatient('T2', {name:'Paul',level:2,sessions:1,correct:1,total:1,streak:1})");
  dom.window.document.getElementById('name').value = 'Paul';
  dom.window.document.getElementById('code').value = 'T2';
  await dom.window.eval('login()');
  assert.strictEqual(dom.window.sessionStorage.getItem('reparole:active-session'), 'T2');
});

await test('session active en sessionStorage -> reconnexion automatique, atterrit sur le tableau de bord', async ()=>{
  const dom = loadPatientApp();
  await dom.window.eval("Store.savePatient('T3', {name:'Alex',level:2,sessions:1,correct:1,total:1,streak:1})");
  dom.window.sessionStorage.setItem('reparole:active-session', 'T3');
  await dom.window.eval("attemptAutoLogin()");
  const activeScreen = dom.window.document.querySelector('.screen.active');
  assert.ok(activeScreen && activeScreen.id === 'dashboard', `attendu 'dashboard', trouvé '${activeScreen && activeScreen.id}'`);
});

console.log('\nMémorisation permanente (localStorage), utilisée seulement si non ambiguë');

await test('exactement 1 profil mémorisé (localStorage), rien en session -> reconnexion automatique', async ()=>{
  const dom = loadPatientApp();
  await dom.window.eval("Store.savePatient('T4', {name:'Nora',level:2,sessions:1,correct:1,total:1,streak:1})");
  dom.window.eval("saveRememberedProfiles([{code:'T4',name:'Nora',at:new Date().toISOString()}])");
  await dom.window.eval("attemptAutoLogin()");
  const activeScreen = dom.window.document.querySelector('.screen.active');
  assert.ok(activeScreen && activeScreen.id === 'dashboard', `attendu 'dashboard', trouvé '${activeScreen && activeScreen.id}'`);
});

await test('2 profils mémorisés (appareil partagé) -> pas de reconnexion automatique', async ()=>{
  const dom = loadPatientApp();
  dom.window.eval(`
    saveRememberedProfiles([
      {code:'p-aaa', name:'Marie', at:new Date().toISOString()},
      {code:'p-bbb', name:'Paul', at:new Date().toISOString()}
    ]);
  `);
  const result = await dom.window.eval("attemptAutoLogin()");
  assert.strictEqual(result, false);
});

await test('sessionStorage a priorité sur localStorage quand les deux existent', async ()=>{
  const dom = loadPatientApp();
  await dom.window.eval("Store.savePatient('T5', {name:'Sami',level:2,sessions:1,correct:1,total:1,streak:1})");
  dom.window.eval(`
    saveRememberedProfiles([{code:'ANCIEN', name:'Ancien profil', at:new Date().toISOString()}]);
  `);
  dom.window.sessionStorage.setItem('reparole:active-session', 'T5');
  await dom.window.eval("attemptAutoLogin()");
  assert.strictEqual(dom.window.document.getElementById('code').value, 'T5');
});

console.log('\nDéconnexion explicite : efface vraiment tout');

await test('logout() efface la session active ET le profil mémorisé (une vraie déconnexion)', async ()=>{
  const dom = loadPatientApp();
  await dom.window.eval("Store.savePatient('T6', {name:'Yasmine',level:2,sessions:1,correct:1,total:1,streak:1})");
  dom.window.document.getElementById('name').value = 'Yasmine';
  dom.window.document.getElementById('code').value = 'T6';
  await dom.window.eval('login()');
  dom.window.eval('logout()');
  assert.strictEqual(dom.window.sessionStorage.getItem('reparole:active-session'), null);
  const list = dom.window.eval("loadRememberedProfiles()");
  assert.strictEqual(list.some(p=>p.code==='T6'), false);
});

await test('sessionStorage/localStorage indisponibles -> ne plante pas', async ()=>{
  const dom = loadPatientApp();
  dom.window.eval(`
    Object.defineProperty(window, 'sessionStorage', { get(){ throw new Error('blocked'); } });
  `);
  let result;
  await assert.doesNotReject(async ()=>{ result = await dom.window.eval("attemptAutoLogin()"); });
  assert.strictEqual(result, false);
});

console.log(`\n${passed} test(s) réussi(s), ${failed} échec(s).`);
if(failed > 0) process.exit(1);
}

main();
