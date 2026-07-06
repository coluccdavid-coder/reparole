// =====================================================================
//  FILET DE SÉCURITÉ — niveau manquant/invalide auto-réparé (v6.31)
//  ---------------------------------------------------------------------
//  Bug réel remonté par capture d'écran : "Niveau adapté : level_null"
//  affiché sur le tableau de bord d'un patient de test. Cause : un
//  dossier avec `level` manquant/invalide (null, undefined, hors de
//  1/2/3 — probablement un dossier de test créé/modifié directement
//  dans Supabase plutôt que via le vrai parcours de bilan) faisait
//  afficher la clé de traduction brute au lieu d'un nom de niveau,
//  partout où levelName() est utilisé (tableau de bord patient, espace
//  ortho, bilan PDF, résumé imprimable, espace aidant).
//
//  Corrigé en deux temps :
//   1. Filet défensif à l'affichage (levelName() et équivalents) : un
//      niveau hors de {1,2,3} retombe sur 2 (Intermédiaire).
//   2. Réparation du dossier lui-même à la connexion (login(), js/app.js)
//      — pas seulement masqué à l'écran : `user.level` est corrigé puis
//      re-sauvegardé, pour que le bug ne réapparaisse pas à la prochaine
//      connexion.
//
//  Lancer : node tests/level-repair.test.js
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
  return dom.window;
}

(async () => {
  console.log('Niveau manquant/invalide auto-réparé (login())');

  await testAsync('un dossier avec level=null affiche un vrai nom de niveau, pas "level_null"', async () => {
    const window = loadApp();
    const { document } = window;
    window.localStorage.setItem('reparole:p-toto', JSON.stringify({
      name:'toto', level:null, sessions:0, correct:0, total:0, streak:1, plan:'free'
    }));
    document.getElementById('name').value = 'toto';
    document.getElementById('code').value = 'p-toto';
    await window.login();
    const shown = document.getElementById('level-name').textContent;
    assert(!shown.includes('level_'), `le niveau affiché ne doit jamais être la clé brute, obtenu : "${shown}"`);
    assert.strictEqual(shown, 'Intermédiaire', `niveau par défaut (2) attendu pour un dossier avec level=null, obtenu : "${shown}"`);
  });

  await testAsync('le dossier est réparé en mémoire (le niveau affiché passe à Intermédiaire, pas juste masqué à l\'affichage)', async () => {
    const window = loadApp();
    const { document } = window;
    window.localStorage.setItem('reparole:p-toto2', JSON.stringify({
      name:'toto', level:undefined, sessions:0, correct:0, total:0, streak:1, plan:'free'
    }));
    document.getElementById('name').value = 'toto';
    document.getElementById('code').value = 'p-toto2';
    await window.login();
    assert.strictEqual(document.getElementById('level-name').textContent, 'Intermédiaire', 'le niveau affiché doit être réparé à Intermédiaire (2)');
  });

  await testAsync('la réparation est bien persistée (relecture depuis le stockage)', async () => {
    const window = loadApp();
    const { document } = window;
    window.localStorage.setItem('reparole:p-toto3', JSON.stringify({
      name:'toto', level:99, sessions:0, correct:0, total:0, streak:1, plan:'free' // valeur hors de {1,2,3}
    }));
    document.getElementById('name').value = 'toto';
    document.getElementById('code').value = 'p-toto3';
    await window.login();
    const saved = JSON.parse(window.localStorage.getItem('reparole:p-toto3'));
    assert.strictEqual(saved.level, 2, 'le niveau réparé doit être persisté dans le dossier, pas seulement en mémoire');
  });

  await testAsync('un niveau valide (1, 2 ou 3) n\'est jamais modifié', async () => {
    const window = loadApp();
    const { document } = window;
    window.localStorage.setItem('reparole:p-valide', JSON.stringify({
      name:'Marie', level:3, sessions:2, correct:5, total:6, streak:1, plan:'free'
    }));
    document.getElementById('name').value = 'Marie';
    document.getElementById('code').value = 'p-valide';
    await window.login();
    assert.strictEqual(document.getElementById('level-name').textContent, 'Avancé', 'un niveau valide (3) ne doit jamais être modifié par la réparation');
    const saved = JSON.parse(window.localStorage.getItem('reparole:p-valide'));
    assert.strictEqual(saved.level, 3, 'le niveau valide doit rester inchangé dans le dossier persisté');
  });

  console.log(`\n${passed} test(s) réussi(s).`);
  if(!process.exitCode){
    console.log('\n✅ Aucun problème détecté — un niveau manquant/invalide est maintenant réparé, pas juste masqué.');
  } else {
    console.log('\n❌ Des problèmes ont été détectés ci-dessus.');
  }
})();
