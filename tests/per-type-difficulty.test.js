// =====================================================================
//  TESTS — Niveau de difficulté par type d'exercice (v6.132)
//  ---------------------------------------------------------------------
//  Points 1-2-3 de la demande d'amélioration, faits ensemble car ils
//  touchent la même architecture (voir README pour le détail complet
//  du pourquoi c'est un chantier à part) :
//  1. Ajuster le seuil de baisse selon la catégorie d'erreur dominante
//     (plus tolérant si "omission" — pas de réponse — plutôt qu'une
//     vraie mauvaise réponse).
//  2. Un niveau propre à chaque type d'exercice (user.levels), plus un
//     seul niveau global partagé.
//  3. Poussée douce du niveau par volume de pratique cumulée (30+
//     réponses stables), pas seulement par précision immédiate.
//
//  Lancer : node tests/per-type-difficulty.test.js
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
        window.Store = Store;
        window.__testGetUser = function(){ return user; };
        window.__testGetCurrent = function(){ return current; };
        window.__testAdaptDifficulty = function(){ adaptDifficulty(); };
        window.__testCreatePatientAtLevel = function(level){
          user = { name:'Nora', level:2, sessions:0, correct:0, total:0, streak:1, plan:'free' };
          user.level = level;
          user.levels = {};
          user.levelAttempts = {};
          Object.keys(BANK).forEach(type=>{ user.levels[type] = level; user.levelAttempts[type] = 0; });
        };
      `;
    }
    dom.window.eval(code);
    // v6.247 : les 14 langues vivent dans js/i18n/<code>.js et les pages
    // n'en chargent qu'une. En test, on les charge toutes.
    if(typeof src !== 'undefined' && src === 'js/i18n.js') fs.readdirSync(path.join(ROOT, 'js/i18n'))
      .forEach(lf => dom.window.eval(fs.readFileSync(path.join(ROOT, 'js/i18n', lf), 'utf8')));
  }
  dom.window.eval("Prefs.load();");
  return dom;
}

async function main(){

console.log('Point 2 : migration et indépendance par type');

await test('un dossier existant (sans user.levels) est migré au login : chaque type démarre au niveau scalaire', async ()=>{
  const dom = loadPatientApp();
  await dom.window.eval("Store.savePatient('T1', {name:'Marie',level:3,sessions:1,correct:1,total:1,streak:1})");
  dom.window.document.getElementById('name').value = 'Marie';
  dom.window.document.getElementById('code').value = 'T1';
  await dom.window.eval('login()');
  const user = dom.window.eval('__testGetUser()');
  assert.strictEqual(user.levels.denomination, 3);
  assert.strictEqual(user.levels.completion, 3);
});

await test('faire progresser un type ne change pas le niveau d\'un autre type', async ()=>{
  const dom = loadPatientApp();
  await dom.window.eval("Store.savePatient('T2', {name:'Paul',level:2,sessions:1,correct:1,total:1,streak:1,levels:{denomination:2,completion:2}})");
  dom.window.document.getElementById('name').value = 'Paul';
  dom.window.document.getElementById('code').value = 'T2';
  await dom.window.eval('login()');
  await dom.window.eval("startExercise('denomination')");
  dom.window.eval(`
    const c = __testGetCurrent();
    c.correctInRow = 2;
    __testAdaptDifficulty();
  `);
  const user = dom.window.eval('__testGetUser()');
  assert.strictEqual(user.levels.denomination, 3, 'dénomination devrait monter');
  assert.strictEqual(user.levels.completion, 2, 'complétion ne devrait pas bouger');
});

await test('un nouveau dossier initialise user.levels pour tous les types au niveau du bilan', async ()=>{
  const dom = loadPatientApp();
  await dom.window.eval("__testCreatePatientAtLevel(1)");
  const user = dom.window.eval('__testGetUser()');
  assert.strictEqual(user.levels.denomination, 1);
  assert.strictEqual(user.levels.comprehension, 1);
});

console.log('\nPoint 1 : seuil de baisse selon la catégorie d\'erreur dominante');

await test('erreur dominante "omission" -> pas de baisse après 2 échecs, seulement après 3', async ()=>{
  const dom = loadPatientApp();
  await dom.window.eval("Store.savePatient('T3', {name:'Test',level:2,sessions:1,correct:1,total:1,streak:1,levels:{denomination:2}})");
  dom.window.document.getElementById('name').value = 'Test';
  dom.window.document.getElementById('code').value = 'T3';
  await dom.window.eval('login()');
  await dom.window.eval("startExercise('denomination')");
  dom.window.eval(`
    Learner.dominantDifficulty = () => ({ category:'omission', count:5, label:'Omission' });
    const c = __testGetCurrent();
    c.wrongInRow = 2;
    __testAdaptDifficulty();
  `);
  let user = dom.window.eval('__testGetUser()');
  assert.strictEqual(user.levels.denomination, 2, 'ne devrait pas encore baisser à 2 échecs pour une omission dominante');

  dom.window.eval(`
    const c = __testGetCurrent();
    c.wrongInRow = 3;
    __testAdaptDifficulty();
  `);
  user = dom.window.eval('__testGetUser()');
  assert.strictEqual(user.levels.denomination, 1, 'devrait baisser à 3 échecs');
});

await test('erreur dominante réelle (phonological) -> baisse dès 2 échecs, comme avant', async ()=>{
  const dom = loadPatientApp();
  await dom.window.eval("Store.savePatient('T4', {name:'Test',level:2,sessions:1,correct:1,total:1,streak:1,levels:{denomination:2}})");
  dom.window.document.getElementById('name').value = 'Test';
  dom.window.document.getElementById('code').value = 'T4';
  await dom.window.eval('login()');
  await dom.window.eval("startExercise('denomination')");
  dom.window.eval(`
    Learner.dominantDifficulty = () => ({ category:'phonological', count:5, label:'Sonorité' });
    const c = __testGetCurrent();
    c.wrongInRow = 2;
    __testAdaptDifficulty();
  `);
  const user = dom.window.eval('__testGetUser()');
  assert.strictEqual(user.levels.denomination, 1, 'devrait baisser dès 2 échecs pour une vraie erreur de contenu');
});

console.log('\nPoint 3 : poussée douce par volume de pratique');

await test('30 réponses stables (sans échec en cours) au même niveau -> poussée vers le haut', async ()=>{
  const dom = loadPatientApp();
  await dom.window.eval("Store.savePatient('T5', {name:'Test',level:1,sessions:1,correct:1,total:1,streak:1})");
  await dom.window.eval("Store.saveLevels('T5', {denomination:1}, {denomination:29})");
  dom.window.document.getElementById('name').value = 'Test';
  dom.window.document.getElementById('code').value = 'T5';
  await dom.window.eval('login()');
  await dom.window.eval("startExercise('denomination')");
  dom.window.eval(`
    const c = __testGetCurrent();
    c.correctInRow = 0; c.wrongInRow = 0;
    __testAdaptDifficulty();
  `);
  const user = dom.window.eval('__testGetUser()');
  assert.strictEqual(user.levels.denomination, 2, 'la 30e réponse stable devrait pousser le niveau');
});

await test('un signal de fatigue actif empêche toute poussée par volume', async ()=>{
  const dom = loadPatientApp();
  await dom.window.eval("Store.savePatient('T6', {name:'Test',level:1,sessions:1,correct:1,total:1,streak:1})");
  await dom.window.eval("Store.saveLevels('T6', {denomination:1}, {denomination:29})");
  dom.window.document.getElementById('name').value = 'Test';
  dom.window.document.getElementById('code').value = 'T6';
  await dom.window.eval('login()');
  await dom.window.eval("startExercise('denomination')");
  dom.window.eval(`
    const c = __testGetCurrent();
    c.wrongInRow = 3; // déclenche fatigueSignal('high')
    __testAdaptDifficulty();
  `);
  const user = dom.window.eval('__testGetUser()');
  assert.ok(user.levels.denomination <= 1, 'la fatigue devrait primer, pas de poussée par volume');
});

console.log(`\n${passed} test(s) réussi(s), ${failed} échec(s).`);
if(failed > 0) process.exit(1);
}

main();
