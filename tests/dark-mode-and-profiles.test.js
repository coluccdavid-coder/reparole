// =====================================================================
//  TESTS — Mode sombre + codes mémorisés (v6.71)
//  ---------------------------------------------------------------------
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
  dom.window.eval('Prefs.load(); renderRememberedProfiles();');
  return dom;
}

function document_setValue(dom, id, value){
  const el = dom.window.document.getElementById(id);
  el.value = value;
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

console.log('\nCodes mémorisés (accès rapide au retour)');

await test('aucun profil mémorisé au départ : conteneur masqué', ()=>{
  const dom = loadPatientApp();
  const container = dom.window.document.getElementById('remembered-profiles');
  assert.strictEqual(container.style.display, 'none');
});

await test('une connexion réussie mémorise le profil pour la prochaine visite', async ()=>{
  const dom = loadPatientApp();
  await dom.window.eval("Store.savePatient('T1', {name:'Marie',level:2,sessions:1,correct:1,total:1,streak:1})");
  document_setValue(dom, 'name', 'Marie');
  document_setValue(dom, 'code', 'T1');
  await dom.window.eval('login()');
  const list = dom.window.eval('loadRememberedProfiles()');
  assert.strictEqual(list.length, 1);
  assert.strictEqual(list[0].code, 'T1');
  assert.strictEqual(list[0].name, 'Marie');
});

await test('quickLogin(code) reconnecte sans ressaisir le code', async ()=>{
  const dom = loadPatientApp();
  await dom.window.eval("Store.savePatient('T2', {name:'Paul',level:2,sessions:1,correct:1,total:1,streak:1})");
  document_setValue(dom, 'name', 'Paul');
  document_setValue(dom, 'code', 'T2');
  await dom.window.eval('login()');
  await dom.window.eval("logout()");
  await dom.window.eval("quickLogin('T2')");
  const activeScreen = dom.window.document.querySelector('.screen.active');
  assert.ok(activeScreen && activeScreen.id === 'dashboard', `attendu 'dashboard', trouvé '${activeScreen && activeScreen.id}'`);
});

await test('une seconde connexion du même code met à jour l\'entrée existante, n\'en crée pas une seconde', async ()=>{
  const dom = loadPatientApp();
  await dom.window.eval("Store.savePatient('T3', {name:'Alex',level:2,sessions:1,correct:1,total:1,streak:1})");
  document_setValue(dom, 'name', 'Alex');
  document_setValue(dom, 'code', 'T3');
  await dom.window.eval('login()');
  await dom.window.eval("logout()");
  document_setValue(dom, 'name', 'Alex');
  document_setValue(dom, 'code', 'T3');
  await dom.window.eval('login()');
  const list = dom.window.eval('loadRememberedProfiles()');
  assert.strictEqual(list.filter(p=>p.code==='T3').length, 1);
});

await test('forgetRememberedProfile retire le profil de la liste', ()=>{
  const dom = loadPatientApp();
  dom.window.eval("saveRememberedProfiles([{code:'T4',name:'Sami'},{code:'T5',name:'Nora'}])");
  dom.window.eval("forgetRememberedProfile('T4')");
  const list = dom.window.eval('loadRememberedProfiles()');
  assert.strictEqual(list.length, 1);
  assert.strictEqual(list[0].code, 'T5');
});

await test('le code n\'est jamais affiché comme texte visible — seul le prénom apparaît à l\'écran', ()=>{
  const dom = loadPatientApp();
  dom.window.eval("saveRememberedProfiles([{code:'T6',name:'Yasmine'}])");
  dom.window.eval('renderRememberedProfiles()');
  const btn = dom.window.document.querySelector('#remembered-profiles .remembered-profile .btn-ghost');
  assert.strictEqual(btn.textContent, 'Yasmine');
});

console.log(`\n${passed} test(s) réussi(s), ${failed} échec(s).`);
if(failed > 0) process.exit(1);

}

main();
