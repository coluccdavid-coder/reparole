// =====================================================================
//  TESTS — normalize() : lettres qui ne se décomposent pas via NFD
//  ---------------------------------------------------------------------
//  Bug trouvé en préparant l'ajout du turc (v6.39) : ı/İ (turc), ł
//  (polonais), ß (allemand) n'ont pas de décomposition Unicode
//  "lettre + accent" — l'ancien normalize() les supprimait purement et
//  simplement au lieu de les convertir, cassant la reconnaissance
//  vocale pour tout mot qui les contient. Voir js/app.js.
//
//  Lancer : node tests/text-normalize.test.js
// =====================================================================

const assert = require('assert');
const fs = require('fs');
const path = require('path');

let passed = 0, failed = 0;
function test(name, fn){
  try{ fn(); console.log('  ✔', name); passed++; }
  catch(e){ console.log('  ✘', name, '—', e.message); failed++; }
}

// On extrait la fonction normalize() (+ sa table de substitutions)
// directement depuis js/app.js plutôt que de la dupliquer ici, pour ne
// jamais tester une copie qui pourrait diverger du vrai code.
const appSrc = fs.readFileSync(path.join(__dirname, '..', 'js/app.js'), 'utf8');
const match = appSrc.match(/const NORMALIZE_SUBSTITUTIONS[\s\S]*?\nfunction normalize\(s\)\{[\s\S]*?\n\}/);
assert.ok(match, 'normalize() introuvable dans js/app.js — le fichier a peut-être changé de forme');
eval(match[0]); // définit NORMALIZE_SUBSTITUTIONS et normalize() dans ce scope

console.log('normalize() : lettres sans décomposition NFD');

test('turc : ı (dotless i) minuscule est préservé, pas supprimé', ()=>{
  assert.strictEqual(normalize('ışık'), 'isik');
});
test('turc : İ (dotted I) majuscule se lit correctement', ()=>{
  assert.strictEqual(normalize('İstanbul'), 'istanbul');
});
test('turc : Ç/Ş se replient sur c/s comme les autres accents', ()=>{
  assert.strictEqual(normalize('Çalış'), 'calis');
});
test('polonais : ł est préservé (pas supprimé)', ()=>{
  assert.strictEqual(normalize('łódź'), 'lodz');
});
test('allemand : ß devient "ss" (déjà en ligne, corrigé au passage)', ()=>{
  assert.strictEqual(normalize('Größe'), 'grosse');
});
test('accents classiques (français) : toujours corrects après le correctif', ()=>{
  assert.strictEqual(normalize('naïve café'), 'naive cafe');
});
test('isCloseEnough (via normalize) reconnaît un mot turc mal transcrit d\'un seul caractère', ()=>{
  // reproduit la logique d'app.js sans dépendre du DOM
  function levenshtein(a,b){ const m=a.length,n=b.length,d=Array.from({length:m+1},(_,i)=>[i,...Array(n).fill(0)]); for(let j=0;j<=n;j++)d[0][j]=j; for(let i=1;i<=m;i++)for(let j=1;j<=n;j++)d[i][j]=Math.min(d[i-1][j]+1,d[i][j-1]+1,d[i-1][j-1]+(a[i-1]===b[j-1]?0:1)); return d[m][n]; }
  function isCloseEnough(said,target){ const s=normalize(said),t=normalize(target); if(!s)return false; if(s.includes(t)||t.includes(s))return true; return levenshtein(s,t)<=Math.max(1,Math.floor(t.length*0.34)); }
  assert.ok(isCloseEnough('ışik', 'ışık')); // légère variation de transcription, doit rester reconnu
});

test('russe (cyrillique) : n\'est plus vidé — préparation langue future (v6.39, pas encore livrée)', ()=>{
  assert.strictEqual(normalize('Привет мир'), 'привет мир');
  assert.ok(normalize('Привет').length > 0, 'un mot cyrillique ne doit jamais devenir une chaîne vide');
});
test('grec : n\'est plus vidé — préparation langue future (v6.39, pas encore livrée)', ()=>{
  assert.strictEqual(normalize('Καλημέρα'), 'καλημερα');
  assert.ok(normalize('Καλημέρα').length > 0, 'un mot grec ne doit jamais devenir une chaîne vide');
});

console.log(`\n${passed} test(s) réussi(s), ${failed} échec(s).`);
if(failed > 0) process.exitCode = 1;
