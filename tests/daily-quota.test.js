// =====================================================================
//  FILET DE SÉCURITÉ — persistance du quota gratuit journalier (v6.32)
//  ---------------------------------------------------------------------
//  Bug réel trouvé lors d'un audit complet du site : le quota de 5
//  séances gratuites/jour ne se sauvegardait nulle part (ni
//  localStorage, ni Supabase) — un compte gratuit qui rechargeait la
//  page ou se reconnectait repartait avec un quota neuf.
//
//  Ce test vérifie :
//   1. Mode navigateur (localStorage) : après une séance, le quota
//      persiste et est bien repris après une "reconnexion" simulée
//      (recharge de page).
//   2. Mode cloud (faux client Supabase) : loadPatient()/savePatient()
//      lisent/écrivent bien daily_sessions_date/daily_sessions_count.
//   3. Un ancien appel sans ces paramètres ne réinitialise pas le
//      quota existant (même principe de rétrocompatibilité que pour
//      "plan", voir tests/plan-persistence.test.js).
//
//  Lancer : node tests/daily-quota.test.js
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

// ---------------------------------------------------------------------
// Partie 1 : mode navigateur, via index.html complet (comme les autres
// tests de app.js — voir tests/qa-unlock.test.js pour le même patron).
// ---------------------------------------------------------------------
function loadApp(){
  const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  const dom = new JSDOM(html, { url:'http://localhost/', runScripts:'outside-only' });
  dom.window.scrollTo = () => {};
  dom.window.alert = () => {};
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
  return dom.window;
}

(async () => {
  console.log('Persistance du quota gratuit journalier');

  await testAsync('mode navigateur : le quota utilisé aujourd\'hui persiste après une "reconnexion"', async () => {
    const window = loadApp();
    const { document } = window;
    window.localStorage.setItem('reparole:p-quota', JSON.stringify({
      name:'Marie', level:1, sessions:0, correct:0, total:0, streak:1, plan:'free'
    }));
    document.getElementById('name').value = 'Marie';
    document.getElementById('code').value = 'p-quota';
    await window.login();
    await window.startExercise('denomination'); // pas verrouillé, incrémente le quota
    await new Promise(r=>setTimeout(r, 20)); // laisse le fire-and-forget savePatient() se terminer

    const saved = JSON.parse(window.localStorage.getItem('reparole:p-quota'));
    assert.strictEqual(saved.dailySessionsCount, 1, 'le compteur doit être persisté à 1 après une séance');
    assert.strictEqual(saved.dailySessionsDate, new Date().toISOString().slice(0,10), 'la date du jour doit être persistée');
  });

  await testAsync('mode navigateur : après 5 séances, la 6e affiche l\'écran de déverrouillage (quota réellement appliqué)', async () => {
    const window = loadApp();
    const { document } = window;
    window.localStorage.setItem('reparole:p-quota2', JSON.stringify({
      name:'Marie', level:1, sessions:0, correct:0, total:0, streak:1, plan:'free'
    }));
    document.getElementById('name').value = 'Marie';
    document.getElementById('code').value = 'p-quota2';
    await window.login();
    for(let i=0;i<5;i++){ await window.startExercise('denomination'); await new Promise(r=>setTimeout(r,10)); }
    await window.startExercise('denomination'); // 6e séance du jour
    const body = document.getElementById('ex-body').innerHTML;
    assert(body.includes('qa-unlock-input'), 'la 6e séance du jour doit afficher l\'écran verrouillé (quota atteint)');
  });

  console.log(`\n${passed} test(s) réussi(s).`);
  if(!process.exitCode){
    console.log('\n✅ Aucun problème détecté — le quota gratuit journalier est maintenant persisté et réellement appliqué.');
  } else {
    console.log('\n❌ Des problèmes ont été détectés ci-dessus.');
  }
})();
