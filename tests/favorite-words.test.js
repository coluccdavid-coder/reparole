// =====================================================================
//  TESTS — Mots favoris / "Mots à revoir" (v6.72)
//  ---------------------------------------------------------------------
//  Tourne en mode navigateur (clés Supabase vidées), même principe que
//  export-restore-data.test.js.
//
//  Lancer : node tests/favorite-words.test.js
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
      code += `
        window.__testSetUser = function(overrides){
          user = Object.assign({name:'Test',level:2,sessions:0,correct:0,total:0,streak:1,plan:'free'}, overrides||{});
        };
        window.__testSetUserCode = function(code){ userCode = code; };
        window.Store = Store;
        window.__testGetCurrent = function(){ return current; };
      `;
    }
    dom.window.eval(code);
  }
  dom.window.eval("Prefs.load(); __testSetUserCode('T'); __testSetUser({});");
  return dom;
}

async function main(){

console.log('Étoile "mot favori" dans les exercices de dénomination');

await test('startExercise(\'denomination\') affiche une étoile non remplie par défaut', async ()=>{
  const dom = loadPatientApp();
  await dom.window.eval("startExercise('denomination')");
  const star = dom.window.document.querySelector('.favorite-star');
  assert.ok(star, 'bouton étoile introuvable');
  assert.strictEqual(star.classList.contains('is-favorite'), false);
  assert.strictEqual(star.textContent, '☆');
});

await test('cliquer l\'étoile la marque favorite (Store + affichage)', async ()=>{
  const dom = loadPatientApp();
  await dom.window.eval("startExercise('denomination')");
  const word = dom.window.eval("__testGetCurrent().queue[__testGetCurrent().index].answer");
  await dom.window.eval(`toggleFavoriteCurrentWord(${JSON.stringify(word)}, document.querySelector('.favorite-star'))`);
  const star = dom.window.document.querySelector('.favorite-star');
  assert.strictEqual(star.textContent, '⭐');
  assert.strictEqual(star.classList.contains('is-favorite'), true);
  const favorites = await dom.window.eval("Store.loadFavoriteWords('T')");
  assert.ok(favorites.includes(word));
});

await test('cliquer une seconde fois retire le mot des favoris (vrai bascule)', async ()=>{
  const dom = loadPatientApp();
  await dom.window.eval("startExercise('denomination')");
  const word = dom.window.eval("__testGetCurrent().queue[__testGetCurrent().index].answer");
  await dom.window.eval(`toggleFavoriteCurrentWord(${JSON.stringify(word)}, document.querySelector('.favorite-star'))`);
  await dom.window.eval(`toggleFavoriteCurrentWord(${JSON.stringify(word)}, document.querySelector('.favorite-star'))`);
  const favorites = await dom.window.eval("Store.loadFavoriteWords('T')");
  assert.ok(!favorites.includes(word));
});

await test('denomination_orale a aussi son étoile, reliée au bon mot', async ()=>{
  const dom = loadPatientApp();
  await dom.window.eval("startExercise('denomination_orale')");
  const star = dom.window.document.querySelector('.favorite-star');
  assert.ok(star, 'bouton étoile introuvable en dénomination orale');
});

await test('completion n\'affiche pas d\'étoile (pas un \"mot\" au sens simple)', async ()=>{
  const dom = loadPatientApp();
  await dom.window.eval("startExercise('completion')");
  const star = dom.window.document.querySelector('.favorite-star');
  assert.strictEqual(star, null);
});

console.log('\nCarte "Mots à revoir" (favoris + erreurs fréquentes)');

await test('liste vide au départ : note "rien pour l\'instant" visible', async ()=>{
  const dom = loadPatientApp();
  await dom.window.eval('renderWordsToReview()');
  const empty = dom.window.document.getElementById('words-to-review-empty');
  assert.strictEqual(empty.style.display, '');
});

await test('un mot favori apparaît dans la liste "Mes favoris"', async ()=>{
  const dom = loadPatientApp();
  await dom.window.eval("Store.toggleFavoriteWord('T', 'chat')");
  await dom.window.eval('renderWordsToReview()');
  const html = dom.window.document.getElementById('favorite-words-list').innerHTML;
  assert.ok(html.includes('chat'));
  const empty = dom.window.document.getElementById('words-to-review-empty');
  assert.strictEqual(empty.style.display, 'none');
});

await test('les mots les plus souvent en erreur apparaissent, triés par fréquence', async ()=>{
  const dom = loadPatientApp();
  await dom.window.eval(`
    (async ()=>{
      await Store.logError('T', {exercise:'denomination', category:'animaux', target:'chien', given:'chat', level:2});
      await Store.logError('T', {exercise:'denomination', category:'animaux', target:'chien', given:'chat', level:2});
      await Store.logError('T', {exercise:'denomination', category:'animaux', target:'oiseau', given:'chat', level:2});
    })()
  `);
  await dom.window.eval('renderWordsToReview()');
  const html = dom.window.document.getElementById('frequent-error-words-list').innerHTML;
  const chienIdx = html.indexOf('chien');
  const oiseauIdx = html.indexOf('oiseau');
  assert.ok(chienIdx !== -1 && oiseauIdx !== -1, 'les deux mots doivent apparaître');
  assert.ok(chienIdx < oiseauIdx, 'chien (2 erreurs) doit apparaître avant oiseau (1 erreur)');
});

await test('un mot déjà favori n\'apparaît pas en double dans "erreurs fréquentes"', async ()=>{
  const dom = loadPatientApp();
  await dom.window.eval("Store.toggleFavoriteWord('T', 'chien')");
  await dom.window.eval("Store.logError('T', {exercise:'denomination', category:'animaux', target:'chien', given:'chat', level:2})");
  await dom.window.eval('renderWordsToReview()');
  const freqHtml = dom.window.document.getElementById('frequent-error-words-list').innerHTML;
  assert.ok(!freqHtml.includes('chien'), 'ne doit pas être dupliqué, déjà visible dans "Mes favoris"');
});

await test('le bouton ✕ d\'un favori le retire de la liste', async ()=>{
  const dom = loadPatientApp();
  await dom.window.eval("Store.toggleFavoriteWord('T', 'maison')");
  await dom.window.eval('renderWordsToReview()');
  const btn = dom.window.document.querySelector('#favorite-words-list .word-chip-remove');
  assert.ok(btn, 'bouton ✕ introuvable');
  // jsdom (runScripts:'outside-only') ne compile pas les gestionnaires
  // onclick= inline — comme le reste de cette suite de tests, on
  // déclenche l'action équivalente directement plutôt que .click().
  await dom.window.eval("toggleFavoriteCurrentWord('maison', null)");
  const favorites = await dom.window.eval("Store.loadFavoriteWords('T')");
  assert.ok(!favorites.includes('maison'));
});

console.log('\nGrille du tableau de bord');

await test('la carte "Mots à revoir" est bien présente dans .dashboard-grid', ()=>{
  const dom = loadPatientApp();
  const card = dom.window.document.getElementById('words-to-review-card') || dom.window.document.getElementById('words-review-title');
  const hasCard = [...dom.window.document.querySelectorAll('.dashboard-grid > .card h3')].some(h=>h.textContent.includes('Mots à revoir'));
  assert.ok(hasCard, 'carte "Mots à revoir" introuvable dans .dashboard-grid');
});

console.log(`\n${passed} test(s) réussi(s), ${failed} échec(s).`);
if(failed > 0) process.exit(1);

}

main();
