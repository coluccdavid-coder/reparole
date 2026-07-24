// =====================================================================
//  TESTS — v6.248 : IMAGES D'EXERCICE (fin des emoji flottants)
//  ---------------------------------------------------------------------
//  Demandé par le propriétaire : un public d'adultes après un AVC mérite
//  mieux qu'une tortue emoji flottante. La résolution est en cascade :
//  vraie photo (img/<codepoints>.webp puis .jpg) sinon emoji présenté
//  dans une carte sobre. Invariants verrouillés ici :
//
//  - l'emoji reste la CLÉ partagée des 14 langues (une photo sert tout) ;
//  - jamais de rafale de 404 (mémo de session, leçon v6.244) ;
//  - les photos vont dans le cache PERMANENT (survivent aux versions) ;
//  - les 5 sites de rendu de mots passent par le module ;
//  - la procédure de déploiement protège img/ comme audio/ ;
//  - docs/IMAGES.md liste exactement les emoji des banques réelles.
//
//  Lancer : node tests/images-exercices-v248.test.js
// =====================================================================

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const vm = require('vm');

const ROOT = path.join(__dirname, '..');
let passed = 0, failed = 0;
async function test(name, fn){
  try{ await fn(); console.log('  ✔', name); passed++; }
  catch(e){ console.log('  ✘', name, '—', e.message); failed++; }
}

const MOD = fs.readFileSync(path.join(ROOT, 'js/exo-images.js'), 'utf8');
const APP = fs.readFileSync(path.join(ROOT, 'js/app.js'), 'utf8');
const SW  = fs.readFileSync(path.join(ROOT, 'sw.js'), 'utf8');

function chargeModule(){
  const sandbox = { window:{}, Set, console, String, Array };
  vm.createContext(sandbox);
  vm.runInContext(MOD + ';globalThis.__E = ExoImages;', sandbox);
  return sandbox.__E;
}

async function main(){

console.log('Nommage — les codepoints, clé stable entre les 14 langues');

await test('🐱 -> 1f431, ☀️ -> 2600 (FE0F retiré), 🐢 -> 1f422', ()=>{
  const E = chargeModule();
  assert.strictEqual(E.codepoints('🐱'), '1f431');
  assert.strictEqual(E.codepoints('☀️'), '2600', 'le sélecteur de variante doit être retiré');
  assert.strictEqual(E.codepoints('🐢'), '1f422');
});

await test('les séquences composées (ZWJ) produisent un nom joint par des tirets', ()=>{
  const E = chargeModule();
  assert.strictEqual(E.codepoints('🧑‍🍳'), '1f9d1-200d-1f373');
});

console.log('\nRésolution — photo d\'abord, emoji digne sinon, jamais de rafale');

await test('le HTML tente img/<cp>.webp et garde l\'emoji en secours visible', ()=>{
  const E = chargeModule();
  const h = E.html('🐢');
  assert.ok(h.includes('img/1f422.webp'), 'la photo doit être tentée en premier');
  assert.ok(h.includes('prompt-emoji'), 'l\'emoji de secours doit être présent');
  assert.ok(h.includes('display:none'), 'l\'image doit rester cachée tant qu\'elle n\'a pas chargé (pas d\'icône cassée)');
  assert.ok(h.includes('prompt-media'), 'le tout vit dans la carte sobre');
});

await test('webp absent -> une (1) tentative jpg, puis emoji définitif pour la session', ()=>{
  const E = chargeModule();
  const img = { dataset:{ cp:'1f422', etape:'webp' }, src:'', remove(){ this._removed = true; } };
  E._echec(img);
  assert.strictEqual(img.src, 'img/1f422.jpg', 'le repli jpg doit être tenté une fois');
  E._echec(img);
  assert.ok(img._removed, 'après le jpg, l\'image doit disparaître au profit de l\'emoji');
  assert.ok(E._absents.has('1f422'), 'l\'absence doit être mémorisée');
  assert.ok(!E.html('🐢').includes('<img'), 'plus AUCUNE requête pour cet emoji durant la session');
});

await test('un emoji vide ou inconnu rend la carte avec ❓, sans requête', ()=>{
  const E = chargeModule();
  const h = E.html('');
  assert.ok(!h.includes('<img'), 'aucune requête pour un emoji vide');
  assert.ok(h.includes('❓'));
});

console.log('\nIntégration — les sites de rendu et le cache');

await test('les 5 sites de mots (dénomination ×2, croisés, anagramme, écriture) passent par ExoImages', ()=>{
  const n = (APP.match(/ExoImages\.html\(/g) || []).length;
  assert.ok(n >= 5, `${n} appels trouvés dans app.js, 5 attendus au minimum`);
  const ASSESS = fs.readFileSync(path.join(ROOT, 'js/assessment.js'), 'utf8');
  assert.ok(/ExoImages\.html\(/.test(ASSESS), 'le bilan (assessment.js) doit suivre le même chemin');
});

await test('les emoji DÉCORATIFS (🌱, 🌟, 🔒…) ne passent PAS par le module (aucune photo à chercher)', ()=>{
  assert.ok(/prompt-emoji">🌱/.test(APP), 'les décorations d\'interface restent de simples emoji');
});

await test('index.html charge js/exo-images.js AVANT app.js, et sw.js le pré-cache', ()=>{
  const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  const a = html.indexOf('<script src="js/exo-images.js">'), b = html.indexOf('<script src="js/app.js">');
  assert.ok(a !== -1 && b !== -1 && a < b, 'ordre de chargement incorrect');
  assert.ok(SW.includes("'./js/exo-images.js'"), 'module absent d\'APP_SHELL');
});

await test('les photos vont dans le cache PERMANENT (branche /img/ à côté de /audio/)', ()=>{
  assert.ok(/pathname\.includes\('\/audio\/'\) \|\| url\.pathname\.includes\('\/img\/'\)/.test(SW),
    'la branche permanente doit couvrir /img/ — sinon les photos repartent à chaque version');
});

console.log('\nProcédure et documentation');

await test('la procédure de déploiement protège img/ comme audio/', ()=>{
  const h = fs.readFileSync(path.join(ROOT, 'HEBERGEMENT.md'), 'utf8');
  assert.ok(/sauf les dossiers `audio\/` ET `img\/`/.test(h),
    'HEBERGEMENT.md doit dire de préserver les DEUX dossiers');
});

await test('docs/IMAGES.md existe, est référencé dans le portail, et son tableau colle aux banques réelles', ()=>{
  const doc = fs.readFileSync(path.join(ROOT, 'docs/IMAGES.md'), 'utf8');
  assert.ok(fs.readFileSync(path.join(ROOT, 'docs/INDEX.md'), 'utf8').includes('IMAGES.md'), 'non référencé dans INDEX.md');
  // recompte les emoji distincts des banques et compare au tableau
  const emojis = new Set();
  fs.readdirSync(path.join(ROOT, 'js')).filter(f => /^exercises.*\.js$/.test(f)).forEach(f=>{
    const src = fs.readFileSync(path.join(ROOT, 'js', f), 'utf8');
    for(const m of src.matchAll(/emoji:'([^']+)'\s*,\s*answer:'/g)) emojis.add(m[1]);
  });
  const lignes = (doc.match(/^\| .+ \| `[0-9a-f-]+\.webp` \|/gm) || []).length;
  assert.strictEqual(lignes, emojis.size,
    `tableau désynchronisé : ${lignes} lignes pour ${emojis.size} emoji — relancer node scripts/liste-images.js`);
});

await test('le style .prompt-media existe, sobre et sans propriété physique (RTL ok)', ()=>{
  const css = fs.readFileSync(path.join(ROOT, 'css/style.css'), 'utf8');
  assert.ok(/\.prompt-media\{/.test(css), 'classe absente');
  const bloc = css.slice(css.indexOf('.prompt-media{'), css.indexOf('.prompt-media{') + 900);
  assert.ok(!/margin-left|text-align: *left|padding-right/.test(bloc), 'propriété physique interdite depuis v6.245');
});

console.log(`\n${passed} test(s) réussi(s), ${failed} échec(s).`);
if(failed > 0) process.exit(1);
}

main();
