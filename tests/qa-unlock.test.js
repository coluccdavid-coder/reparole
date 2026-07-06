// =====================================================================
//  FILET DE SÉCURITÉ — déverrouillage QA du mode Pro (v6.30)
//  ---------------------------------------------------------------------
//  Demande explicite de l'utilisateur : pouvoir continuer à tester les
//  fonctionnalités Pro sans devoir éditer Supabase/localStorage à la
//  main à chaque fois (voir le commentaire v6.24 dans js/app.js). PAS un
//  système de paiement — volontairement pas de faux formulaire de carte
//  bancaire (voir la discussion avec l'utilisateur) : juste un code de
//  test, clairement étiqueté comme tel dans l'interface.
//
//  ⚠️ Ce mécanisme n'est PAS une sécurité (le code est visible dans le
//  JS servi au navigateur) — il faudra le retirer ou le remplacer par un
//  vrai contrôle serveur avant de brancher un vrai système de paiement.
//
//  Ce test vérifie :
//   1. Un code invalide affiche une erreur et NE débloque PAS le Pro.
//   2. Le bon code débloque le Pro (patient.plan devient 'pro', persisté
//      via Store.savePatient) et affiche un message de succès.
//   3. Une fois débloqué, un exercice normalement réservé au Pro devient
//      accessible (isPro() / lockReason() reflètent bien le changement).
//
//  Lancer : node tests/qa-unlock.test.js
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

function loadApp(){
  const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  const dom = new JSDOM(html, { url:'http://localhost/', runScripts:'outside-only' });
  dom.window.scrollTo = () => {};
  dom.window.alert = (msg) => { dom.window.__lastAlert = msg; };
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
  dom.window.eval('Prefs.load();');
  return { window: dom.window, loadErrors: errors };
}

(async () => {
  console.log('Déverrouillage QA du mode Pro (js/app.js)');
  const { window, loadErrors } = loadApp();
  loadErrors.forEach(e => console.error('  ✘ chargement:', e));
  const { document } = window;

  window.localStorage.setItem('reparole:p-qa-test', JSON.stringify({
    name:'Marie', level:1, sessions:0, correct:0, total:0, streak:1, plan:'free'
  }));
  document.getElementById('name').value = 'Marie';
  document.getElementById('code').value = 'p-qa-test';
  await window.login();

  await testAsync('un exercice réservé au Pro affiche l\'écran de déverrouillage', async () => {
    await window.startExercise('repetition'); // dans PRO_ONLY_TYPES
    const body = document.getElementById('ex-body').innerHTML;
    assert(body.includes('qa-unlock-input'), 'le champ de code QA doit être présent sur l\'écran verrouillé');
    assert(!window.isPro(), 'le patient ne doit pas être Pro à ce stade');
  });

  await testAsync('code invalide : erreur affichée, toujours pas Pro', async () => {
    document.getElementById('qa-unlock-input').value = 'un-mauvais-code';
    await window.unlockProForTesting();
    assert(document.getElementById('qa-unlock-msg').textContent.length > 0, 'un message d\'erreur doit s\'afficher');
    assert(!window.isPro(), 'un code invalide ne doit jamais débloquer le Pro');
  });

  await testAsync('bon code : Pro débloqué, persisté, message de succès affiché', async () => {
    document.getElementById('qa-unlock-input').value = 'REPAROLE-QA-PRO';
    await window.unlockProForTesting();
    assert(window.isPro(), 'le patient doit être Pro après le bon code');
    assert(document.getElementById('qa-unlock-msg').textContent.length > 0, 'un message de succès doit s\'afficher');
    const saved = JSON.parse(window.localStorage.getItem('reparole:p-qa-test'));
    assert.strictEqual(saved.plan, 'pro', 'le plan "pro" doit être persisté dans le dossier patient');
  });

  await testAsync('une fois Pro, l\'exercice précédemment verrouillé devient accessible', async () => {
    const reason = window.lockReason('repetition');
    assert.strictEqual(reason, null, 'lockReason() doit renvoyer null pour un compte Pro');
  });

  console.log(`\n${passed} test(s) réussi(s).`);
  if(!process.exitCode){
    console.log('\n✅ Aucun problème détecté — le déverrouillage QA fonctionne (et reste un outil de test, pas un paiement).');
  } else {
    console.log('\n❌ Des problèmes ont été détectés ci-dessus.');
  }
})();
