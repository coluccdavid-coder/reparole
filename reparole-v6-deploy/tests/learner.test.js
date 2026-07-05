// =====================================================================
//  Tests du moteur adaptatif (js/learner.js)
//  Exécution : node tests/learner.test.js
//  Pas de framework externe (l'app n'a pas de dépendances npm) : de
//  simples assertions, un peu comme un test unitaire "à la main".
// =====================================================================
const assert = require('assert');
const { Learner, classifyError, lengthTag, fieldTag } = require('../js/learner.js');

let passed = 0;
function test(name, fn){
  try{ fn(); console.log('  ✔', name); passed++; }
  catch(e){ console.error('  ✘', name, '\n    ', e.message); process.exitCode = 1; }
}

console.log('lengthTag / fieldTag');
test('mot court', ()=> assert.strictEqual(lengthTag('CHAT'), 'mot_court'));
test('mot long', ()=> assert.strictEqual(lengthTag('ANTICONSTITUTIONNEL'), 'mot_long'));
test('champ lexical animaux', ()=> assert.strictEqual(fieldTag('chat'), 'animaux'));
test('champ lexical inconnu', ()=> assert.strictEqual(fieldTag('xyz'), 'autre'));

console.log('classifyError');
test('réponse vide -> omission', ()=> assert.strictEqual(classifyError('denomination','CHAT',''), 'omission'));
test('mot proche phonétiquement -> phonological', ()=> assert.strictEqual(classifyError('denomination','CHAT','CHAS'), 'phonological'));
test('même champ lexical -> semantic', ()=> assert.strictEqual(classifyError('denomination','CHAT','CHIEN'), 'semantic'));
test('completion sans lien -> syntax', ()=> assert.strictEqual(classifyError('completion','LAIT','TABLE'), 'syntax'));

console.log('Learner.record + priority');
test('type jamais vu = priorité haute (100)', ()=>{
  Learner.load(null);
  assert.strictEqual(Learner.priority('denomination'), 100);
});
test('échecs répétés augmentent la priorité', ()=>{
  Learner.load(null);
  for(let i=0;i<5;i++) Learner.record('denomination','CHAT', false);
  const p = Learner.priority('denomination');
  assert.ok(p > 50, `priorité attendue > 50, obtenu ${p}`);
});
test('réussites répétées baissent la priorité', ()=>{
  Learner.load(null);
  for(let i=0;i<10;i++) Learner.record('denomination','CHAT', true);
  const p = Learner.priority('denomination');
  assert.ok(p < 40, `priorité attendue < 40, obtenu ${p}`);
});

console.log('Répétition espacée (v5)');
test('la boîte monte après une réussite', ()=>{
  Learner.load(null);
  Learner.record('denomination','CHAT', true);
  const tag = Learner.profile.byTag['animaux'];
  assert.strictEqual(tag.box, 2);
});
test('la boîte retombe à 1 après un échec', ()=>{
  Learner.load(null);
  Learner.record('denomination','CHAT', true);
  Learner.record('denomination','CHIEN', false);
  const tag = Learner.profile.byTag['animaux'];
  assert.strictEqual(tag.box, 1);
});

console.log('Analyse des erreurs (v4) et fatigue / tendance (v5)');
test('recordError + topErrors + dominantDifficulty', ()=>{
  Learner.load(null);
  Learner.recordError('denomination','CHAT','');       // omission
  Learner.recordError('denomination','CHAT','');       // omission
  Learner.recordError('denomination','CHAT','CHIEN');  // semantic
  const dom = Learner.dominantDifficulty();
  assert.strictEqual(dom.category, 'omission');
  assert.strictEqual(dom.count, 2);
});
test('fatigueSignal monte avec les échecs consécutifs', ()=>{
  assert.strictEqual(Learner.fatigueSignal(0).level, 'none');
  assert.strictEqual(Learner.fatigueSignal(2).level, 'medium');
  assert.strictEqual(Learner.fatigueSignal(3).level, 'high');
});
test('trend détecte une hausse', ()=>{
  const history = [
    {score:2,total:8,at:'2026-01-01'},{score:2,total:8,at:'2026-01-02'},
    {score:3,total:8,at:'2026-01-03'},{score:2,total:8,at:'2026-01-04'},
    {score:3,total:8,at:'2026-01-05'},
    {score:7,total:8,at:'2026-01-06'},{score:8,total:8,at:'2026-01-07'},
    {score:7,total:8,at:'2026-01-08'},{score:8,total:8,at:'2026-01-09'},
    {score:8,total:8,at:'2026-01-10'}
  ];
  const t = Learner.trend(history);
  assert.strictEqual(t.direction, 'hausse');
});
test('trend "insuffisant" si peu de séances', ()=>{
  const t = Learner.trend([{score:1,total:2,at:'2026-01-01'}]);
  assert.strictEqual(t.direction, 'insuffisant');
});

console.log(`\n${passed} test(s) réussi(s).`);
