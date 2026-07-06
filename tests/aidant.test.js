// =====================================================================
//  FILET DE SÉCURITÉ — parcours aidant (v6.28)
//  ---------------------------------------------------------------------
//  aidant.html est un troisième parcours (à côté du patient et de
//  l'orthophoniste) : un proche entre le code de suivi du patient et
//  voit ses statistiques + des conseils, en LECTURE SEULE. Ce test
//  vérifie :
//   1. Un code manquant ou inconnu affiche un message clair (pas de
//      plantage), sans changer d'écran.
//   2. Un code valide affiche bien les statistiques du patient.
//   3. Les conseils (aidant_tips) s'affichent EN ENTIER (I18N.list()),
//      pas un seul tiré au hasard comme le ferait I18N.rand()/t().
//   4. Le changement de langue DEPUIS cette page retraduit tout le
//      contenu dynamique (même piège que le bug v6.25 déjà documenté).
//   5. Le bouton "voir un autre code" réinitialise proprement.
//
//  Lancer : node tests/aidant.test.js
// =====================================================================

const { JSDOM } = require('jsdom');
const assert = require('assert');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
let passed = 0;
function test(name, fn){
  try{ fn(); console.log('  ✔', name); passed++; }
  catch(e){ console.error('  ✘', name, '\n    ', e.message); process.exitCode = 1; }
}
async function testAsync(name, fn){
  try{ await fn(); console.log('  ✔', name); passed++; }
  catch(e){ console.error('  ✘', name, '\n    ', e.message); process.exitCode = 1; }
}

function loadAidant(){
  const html = fs.readFileSync(path.join(ROOT, 'aidant.html'), 'utf8');
  const dom = new JSDOM(html, { url:'http://localhost/aidant.html', runScripts:'outside-only' });
  dom.window.scrollTo = () => {};
  const scripts = [...dom.window.document.querySelectorAll('script[src]')].map(s=>s.getAttribute('src'));
  const errors = [];
  for(const src of scripts){
    let code = fs.readFileSync(path.join(ROOT, src), 'utf8');
    if(src === 'js/storage.js'){
      code = code
        .replace(/const SUPABASE_URL = "[^"]*";/, 'const SUPABASE_URL = "";')
        .replace(/const SUPABASE_ANON_KEY = "[^"]*";/, 'const SUPABASE_ANON_KEY = "";');
    }
    try{ dom.window.eval(code); }
    catch(e){ errors.push(`Erreur de chargement dans ${src} : ${e.message}`); }
  }
  if(errors.length) throw new Error(errors.join('\n'));
  const inline = [...dom.window.document.querySelectorAll('script:not([src])')];
  for(const s of inline) dom.window.eval(s.textContent);
  return dom;
}

function seedPatient(dom, code){
  dom.window.localStorage.setItem('reparole:'+code, JSON.stringify({
    name:'Marie', level:2, sessions:12, correct:34, total:40, streak:3
  }));
  const hist = [];
  for(let i=0;i<8;i++){
    hist.push({ at:new Date(Date.now()-i*86400000).toISOString(), type:'denomination', score:7, total:10, level:2 });
  }
  dom.window.localStorage.setItem('reparole:hist:'+code, JSON.stringify(hist));
}

(async () => {
  console.log('Parcours aidant (aidant.html)');

  await testAsync('code manquant : message clair, reste sur l\'écran d\'accès', async () => {
    const dom = loadAidant();
    dom.window.document.getElementById('aidant-code').value = '';
    await dom.window.AidantApp.view();
    assert(dom.window.document.getElementById('aidant-error').textContent.length > 0, 'aucun message d\'erreur affiché');
    assert(dom.window.document.getElementById('access').classList.contains('active'), 'ne devrait pas changer d\'écran');
  });

  await testAsync('code inconnu : message clair, reste sur l\'écran d\'accès', async () => {
    const dom = loadAidant();
    dom.window.document.getElementById('aidant-code').value = 'inconnu';
    await dom.window.AidantApp.view();
    assert(dom.window.document.getElementById('aidant-error').textContent.length > 0, 'aucun message d\'erreur affiché');
    assert(dom.window.document.getElementById('access').classList.contains('active'), 'ne devrait pas changer d\'écran');
  });

  await testAsync('code valide : statistiques du patient affichées, écran de vue actif', async () => {
    const dom = loadAidant();
    seedPatient(dom, 'demo');
    dom.window.document.getElementById('aidant-code').value = 'demo';
    await dom.window.AidantApp.view();
    assert(dom.window.document.getElementById('view').classList.contains('active'), 'écran de vue non activé');
    assert.strictEqual(dom.window.document.getElementById('a-sessions').textContent, '12', 'nombre de séances incorrect');
    assert(dom.window.document.getElementById('a-success').textContent.includes('85'), 'taux de réussite incorrect (34/40 = 85%)');
  });

  await testAsync('les conseils (aidant_tips) s\'affichent tous, pas un seul au hasard', async () => {
    const dom = loadAidant();
    seedPatient(dom, 'demo');
    dom.window.document.getElementById('aidant-code').value = 'demo';
    await dom.window.AidantApp.view();
    const items = dom.window.document.querySelectorAll('#a-tips li');
    const expectedCount = dom.window.I18N.list('aidant_tips').length;
    assert(expectedCount >= 3, 'la banque de conseils semble anormalement courte');
    assert.strictEqual(items.length, expectedCount, `attendu ${expectedCount} conseils affichés, trouvé ${items.length}`);
  });

  await testAsync('changement de langue DEPUIS cette page retraduit stats + conseils', async () => {
    const dom = loadAidant();
    seedPatient(dom, 'demo');
    dom.window.document.getElementById('aidant-code').value = 'demo';
    await dom.window.AidantApp.view();
    dom.window.Prefs.setLang('en');
    await new Promise(r=>setTimeout(r, 20));
    assert.strictEqual(dom.window.document.getElementById('a-level').textContent, 'Intermediate', 'niveau non retraduit en anglais');
    const tipsHtml = dom.window.document.getElementById('a-tips').innerHTML;
    assert(tipsHtml.includes('Give them time to answer'), 'conseils non retraduits en anglais');
  });

  await testAsync('"voir un autre code" réinitialise proprement', async () => {
    const dom = loadAidant();
    seedPatient(dom, 'demo');
    dom.window.document.getElementById('aidant-code').value = 'demo';
    await dom.window.AidantApp.view();
    dom.window.AidantApp.reset();
    assert(dom.window.document.getElementById('access').classList.contains('active'), 'ne revient pas à l\'écran d\'accès');
    assert.strictEqual(dom.window.document.getElementById('aidant-code').value, '', 'le champ code n\'a pas été vidé');
  });

  console.log(`\n${passed} test(s) réussi(s).`);
  if(!process.exitCode){
    console.log('\n✅ Aucun problème détecté — le parcours aidant fonctionne, en lecture seule et multilingue.');
  } else {
    console.log('\n❌ Des problèmes ont été détectés ci-dessus.');
  }
})();
