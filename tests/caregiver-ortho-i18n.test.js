// =====================================================================
//  TESTS — Traduction complète de l'espace aidant et de l'espace
//  orthophoniste (v6.76)
//  ---------------------------------------------------------------------
//  Vérifie que le changement de langue (I18N.apply / Prefs.setLang)
//  met bien à jour le texte statique ([data-i18n]) ET le contenu généré
//  dynamiquement en JS (conseils du jour, liste de patients, analyse
//  d'erreurs, niveaux) sur les deux pages qui n'étaient traduites nulle
//  part avant cette version.
//
//  Lancer : node tests/caregiver-ortho-i18n.test.js
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

function loadPage(file){
  const html = fs.readFileSync(path.join(ROOT, file), 'utf8');
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
  dom.window.eval('Prefs.load();');
  return dom;
}

async function main(){

console.log("Espace aidant (aidant.html) — traduction complète");

await test('sélecteur de langue présent sur l\'écran de connexion et le tableau de bord', ()=>{
  const dom = loadPage('aidant.html');
  const switchers = dom.window.document.querySelectorAll('[data-lang-switcher]');
  assert.ok(switchers.length >= 2, `attendu au moins 2, trouvé ${switchers.length}`);
});

await test('passage en anglais traduit le titre statique et le bouton de connexion', ()=>{
  const dom = loadPage('aidant.html');
  dom.window.eval("Prefs.setLang('en')");
  assert.strictEqual(dom.window.document.querySelector('#caregiver-login h1').textContent, 'Caregiver space');
  const loginBtn = [...dom.window.document.querySelectorAll('#caregiver-login button')].find(b=>b.getAttribute('onclick')==='caregiverLogin()');
  assert.strictEqual(loginBtn.textContent, 'Access the tracking');
});

await test('les conseils du jour (contenu généré en JS) suivent aussi la langue active', async ()=>{
  const dom = loadPage('aidant.html');
  dom.window.localStorage.setItem('reparole:p-cgi18n0001', JSON.stringify({
    code:'p-cgi18n0001', name:'Marie', level:1, sessions:0, correct:0, total:0, streak:0
  }));
  dom.window.localStorage.setItem('reparole:caregiver-index:a-cgi18n0001', 'p-cgi18n0001');
  dom.window.eval("Prefs.setLang('en')");
  dom.window.document.getElementById('caregiver-code').value = 'a-cgi18n0001';
  await dom.window.caregiverLogin();
  const tips = dom.window.document.getElementById('cg-tips').textContent;
  assert.ok(tips.includes('Sit alongside them the first time'), `texte anglais attendu, reçu : ${tips}`);
  assert.ok(!tips.includes('Installez-vous à côté'), 'ne doit plus afficher le français une fois en anglais');
});

await test('la salutation "Suivi de X" suit aussi la langue (fonction avec interpolation)', async ()=>{
  const dom = loadPage('aidant.html');
  dom.window.localStorage.setItem('reparole:p-cgi18n0002', JSON.stringify({
    code:'p-cgi18n0002', name:'Marie', level:1, sessions:2, correct:1, total:2, streak:1
  }));
  dom.window.localStorage.setItem('reparole:caregiver-index:a-cgi18n0002', 'p-cgi18n0002');
  dom.window.eval("Prefs.setLang('es')");
  dom.window.document.getElementById('caregiver-code').value = 'a-cgi18n0002';
  await dom.window.caregiverLogin();
  assert.strictEqual(dom.window.document.getElementById('caregiver-hello').textContent, 'Seguimiento de Marie');
});

await test('kabyle : l\'espace aidant a maintenant une vraie traduction (plus de repli français, voir v6.115)', ()=>{
  const dom = loadPage('aidant.html');
  dom.window.eval("Prefs.setLang('kab')");
  const title = dom.window.document.querySelector('#caregiver-login h1').textContent;
  assert.strictEqual(title, 'Tallunt n umɛiwen');
});

console.log("\nEspace orthophoniste (dashboard-ortho.html) — traduction complète");

await test('sélecteur de langue présent sur l\'écran de connexion et la liste des patients', ()=>{
  const dom = loadPage('dashboard-ortho.html');
  const switchers = dom.window.document.querySelectorAll('[data-lang-switcher]');
  assert.ok(switchers.length >= 2, `attendu au moins 2, trouvé ${switchers.length}`);
});

await test('passage en allemand traduit le titre de connexion et le bouton', ()=>{
  const dom = loadPage('dashboard-ortho.html');
  dom.window.eval("Prefs.setLang('de')");
  assert.strictEqual(dom.window.document.querySelector('#ortho-login h1').textContent, 'Bereich für Logopäd:innen');
  const btn = dom.window.document.getElementById('o-submit');
  assert.strictEqual(btn.textContent, 'Anmelden');
});

await test('les noms de niveau (levelName) suivent la langue active, réutilisent level_1/2/3', ()=>{
  const dom = loadPage('dashboard-ortho.html');
  dom.window.eval("Prefs.setLang('it')");
  assert.strictEqual(dom.window.eval("levelName(1)"), 'Leggero');
  assert.strictEqual(dom.window.eval("levelName(2)"), 'Intermedio');
  assert.strictEqual(dom.window.eval("levelName(3)"), 'Avanzato');
});

await test('le détail patient (catégories d\'erreur, tendance) se retraduit sans nouvel appel réseau', ()=>{
  const dom = loadPage('dashboard-ortho.html');
  dom.window.eval("Prefs.setLang('en')");
  dom.window.Learner.load({byType:{}, errors:{semantic:5, phonological:2}});
  const fakePatient = { name:'Jean', level:2, sessions:10, correct:7, total:10, streak:3 };
  const fakeHist = [{type:'denomination', score:4, total:5, level:2, at:new Date().toISOString()}];
  dom.window.OrthoApp._renderPatientDetail(fakePatient, fakeHist, []);
  const dominant = dom.window.document.getElementById('d-dominant').textContent;
  assert.ok(dominant.includes('Dominant category detected'), `attendu texte anglais, reçu : ${dominant}`);
  assert.ok(dominant.includes('meaning errors'), `attendu la catégorie traduite, reçu : ${dominant}`);
  const historyHead = dom.window.document.querySelector('#d-history .history-row.head').textContent;
  assert.ok(historyHead.includes('Exercise') && historyHead.includes('Score') && historyHead.includes('Date'));
});

await test('profils cliniques traduits dans le menu déroulant', ()=>{
  const dom = loadPage('dashboard-ortho.html');
  dom.window.eval("Prefs.setLang('en')");
  dom.window.OrthoApp._renderClinicalOptions();
  const options = [...dom.window.document.querySelectorAll('#d-clinical option')].map(o=>o.textContent);
  assert.ok(options.includes('Global aphasia'), `attendu "Global aphasia" parmi ${JSON.stringify(options)}`);
  assert.ok(options.includes('Not specified'));
});

await test('langue non traduite pour cet espace : repli propre sur le français', ()=>{
  // v6.151 : sango (l'exemple utilisé jusqu'ici) a été retiré de l'app.
  // Code de langue synthétique pour continuer à couvrir ce repli.
  const dom = loadPage('dashboard-ortho.html');
  dom.window.eval("Prefs.data.lang = 'xx';");
  const title = dom.window.document.querySelector('#ortho-login h1').textContent;
  assert.strictEqual(title, 'Espace orthophoniste');
});

await test('refreshDetail() ne plante pas quand aucun patient n\'est chargé (garde-fou)', ()=>{
  const dom = loadPage('dashboard-ortho.html');
  assert.doesNotThrow(()=>{ dom.window.OrthoApp.refreshDetail(); });
});


}

main().then(()=>{
  console.log(`\n${passed} test(s) réussi(s), ${failed} échec(s).`);
if(failed > 0) process.exit(1);
});
