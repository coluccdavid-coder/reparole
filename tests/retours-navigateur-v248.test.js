// =====================================================================
//  TESTS — v6.248 : RETOURS DU PREMIER VRAI TEST NAVIGATEUR
//  ---------------------------------------------------------------------
//  Le propriétaire a testé reparole.fr en conditions réelles (fr, dz, it)
//  et rapporté : voix robotiques persistantes, libellé « Quel est ce
//  mot ? » inadapté, français qui fuit, emoji enfantins. L'enquête a
//  trouvé quatre causes réelles, chacune verrouillée ici :
//
//  1. speak() : si le mp3 mettait plus de 2,5 s, le repli parlait PUIS
//     la voix cloud se superposait (canplaythrough ne vérifiait pas
//     `settled`). Cas aggravé par Ctrl+Maj+R qui contourne le service
//     worker : chaque écoute redevenait une première écoute réseau.
//  2. extract-voice-content.js chargeait l'app comme une page réelle —
//     donc, depuis le découpage v6.247, uniquement le français : le
//     manifeste capturait des chaînes MI-FRANÇAISES (« Citez le plus
//     possible de… palabras que empiezan por B »).
//  3. « Quel est ce mot ? » -> « Qu'est-ce que c'est ? » (la banque
//     contient des chats et des girafes : « objet » aurait été faux ;
//     formule classique de dénomination, valable pour tout). Changé dans
//     les 10 langues à voix cloud ; kab/dz/ma/tn INTOUCHÉES (règle 4).
//  4. Emoji -> vraies photos img/<codepoints>.webp avec repli emoji
//     (js/exo-images.js), sur TOUS les supports d'exercice, jeu de
//     mémoire compris — celui de la capture d'écran du propriétaire.
//
//  Lancer : node tests/retours-navigateur-v248.test.js
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

const APP = fs.readFileSync(path.join(ROOT, 'js/app.js'), 'utf8');
const MEMO = fs.readFileSync(path.join(ROOT, 'js/memory.js'), 'utf8');
const EXO = fs.readFileSync(path.join(ROOT, 'js/exo-images.js'), 'utf8');
const SW = fs.readFileSync(path.join(ROOT, 'sw.js'), 'utf8');
const MANIFEST = JSON.parse(fs.readFileSync(path.join(ROOT, 'scripts/voice-manifest.json'), 'utf8'));

async function main(){

console.log('speak() — plus jamais deux voix superposées');

await test('canplaythrough se tait si le repli a déjà parlé', ()=>{
  const bloc = APP.slice(APP.indexOf("addEventListener('canplaythrough'"), APP.indexOf("addEventListener('error'"));
  assert.ok(/if\s*\(\s*settled\s*\)\s*return/.test(bloc),
    'sans cette garde, la voix cloud arrivée après 2,5 s joue PAR-DESSUS la voix du navigateur');
});

await test('le minuteur du filet est annulé quand la voix cloud prend la main', ()=>{
  // speakBrowserTTS est définie AVANT speak(), et « renderVoiceSelector »
  // apparaît d'abord dans un commentaire : borner sur sa DÉFINITION.
  const bloc = APP.slice(APP.indexOf('function speak(text)'), APP.indexOf('async function renderVoiceSelector'));
  assert.ok(/clearTimeout\(minuteur\)/.test(bloc), 'le filet de 2,5 s doit être désarmé une fois la voix cloud lancée');
});

console.log('\nLibellé de dénomination — « Qu\'est-ce que c\'est ? »');

await test('les 10 langues à voix cloud portent la nouvelle formule', ()=>{
  const attendu = {
    fr:"Qu'est-ce que c'est ?", en:'What is this?', es:'¿Qué es esto?',
    it:"Che cos'è?", pt:'O que é isto?', de:'Was ist das?',
    ar:'ما هذا؟', tr:'Bu nedir?', pl:'Co to jest?', ja:'これは何ですか？'
  };
  for(const [lang, valeur] of Object.entries(attendu)){
    const src = fs.readFileSync(path.join(ROOT, 'js/i18n', lang + '.js'), 'utf8');
    const m = src.match(/denom_prompt:("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*')/);
    assert.ok(m, `denom_prompt introuvable en ${lang}`);
    const brut = m[1].slice(1, -1).replace(/\\"/g, '"').replace(/\\'/g, "'");
    assert.strictEqual(brut, valeur, `${lang} : « ${brut} »`);
  }
});

await test('kab, dz, ma et tn sont INTOUCHÉES (on n\'invente jamais une traduction)', ()=>{
  // Un changement dans ces 4 langues exigerait un locuteur natif. Le test
  // vérifie qu'aucune n'a reçu la formule d'une autre langue par copie.
  for(const lang of ['kab','dz','ma','tn']){
    const src = fs.readFileSync(path.join(ROOT, 'js/i18n', lang + '.js'), 'utf8');
    const m = src.match(/denom_prompt:("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*')/);
    assert.ok(m, `denom_prompt introuvable en ${lang}`);
    assert.ok(!/Qu'est-ce que c'est|What is this/.test(m[1]),
      `${lang} semble avoir reçu une formule copiée d'une autre langue`);
  }
});

console.log('\nManifeste des voix — monolingue par langue, à jour');

await test('le script d\'extraction charge les 14 langues (cassé par le découpage v6.247)', ()=>{
  const src = fs.readFileSync(path.join(ROOT, 'scripts/extract-voice-content.js'), 'utf8');
  assert.ok(/js\/i18n['"]?\)/.test(src) && /readdirSync/.test(src),
    'sans le chargement du dossier js/i18n/, le manifeste capture des chaînes mi-françaises');
});

await test('aucune chaîne française dans les manifestes non français', ()=>{
  const marqueurs = /Citez le plus possible|Quel est|Complétez :/;
  for(const lang of Object.keys(MANIFEST)){
    if(lang === 'fr') continue;
    const intrus = MANIFEST[lang].filter(t => marqueurs.test(t));
    assert.strictEqual(intrus.length, 0, `${lang} : ${JSON.stringify(intrus.slice(0,2))}`);
  }
});

await test('le manifeste contient les nouveaux libellés (à générer : voir docs/DEPLOIEMENT.md)', ()=>{
  assert.ok(MANIFEST.fr.includes("Qu'est-ce que c'est ?"), 'fr');
  assert.ok(MANIFEST.it.includes("Che cos'è?"), 'it');
  assert.ok(MANIFEST.es.includes('¿Qué es esto?'), 'es');
});

console.log('\nPhotos d\'exercice — l\'emoji devient un repli, plus le principal');

await test('ExoImages : codepoints stables, sélecteur de variante FE0F retiré', ()=>{
  const sb = { window:{} }; vm.createContext(sb);
  vm.runInContext(EXO, sb);
  assert.strictEqual(sb.window.ExoImages.codepoints('🐱'), '1f431');
  assert.strictEqual(sb.window.ExoImages.codepoints('☀️'), '2600', 'FE0F doit être retiré');
  assert.strictEqual(sb.window.ExoImages.codepoints('🧑‍🍳'), '1f9d1-200d-1f373', 'les séquences ZWJ doivent être conservées');
});

await test('ExoImages : l\'emoji est visible D\'ABORD, jamais d\'icône d\'image cassée', ()=>{
  const sb = { window:{} }; vm.createContext(sb);
  vm.runInContext(EXO, sb);
  const html = sb.window.ExoImages.html('🐱');
  assert.ok(/display:none/.test(html), 'l\'<img> doit être invisible tant que la photo n\'est pas arrivée');
  assert.ok(/prompt-emoji/.test(html), 'l\'emoji de secours doit être présent dès le premier rendu');
  assert.ok(/onerror/.test(html) && /onload/.test(html), 'la bascule photo/emoji doit être gérée');
});

await test('un fichier absent n\'est demandé qu\'une fois par session (webp puis jpg, puis mémorisé)', ()=>{
  assert.ok(/_absents/.test(EXO) && /dataset\.etape/.test(EXO),
    'sans mémoire des absents, chaque exercice relancerait les mêmes 404 — leçon de la v6.244');
});

await test('tous les supports d\'exercice passent par ExoImages (aucun prompt-emoji brut avec une donnée)', ()=>{
  // Les emoji DÉCORATIFS (🌟, 🌱, 🔒 en dur) restent des emoji — ce sont
  // des icônes d'interface, pas des supports d'apprentissage.
  const coupables = [];
  for(const f of ['js/app.js','js/memory.js']){
    fs.readFileSync(path.join(ROOT, f), 'utf8').split('\n').forEach((l, i)=>{
      if(/prompt-emoji.*\$\{(q\.emoji|q\.text|w\.emoji|sym)\b/.test(l)) coupables.push(`${f}:${i+1}`);
    });
  }
  assert.strictEqual(coupables.length, 0, `emoji de données rendus sans ExoImages : ${coupables.join(', ')}`);
});

await test('le jeu de mémoire (capture du propriétaire) est converti : séquence, boutons, rappel', ()=>{
  assert.strictEqual((MEMO.match(/ExoImages\.html/g)||[]).length, 3,
    'trois rendus attendus : la séquence montrée, les boutons de réponse, la ligne de rappel');
});

await test('sw.js : les photos vont dans le cache permanent, un 404 n\'est jamais mémorisé', ()=>{
  assert.ok(/pathname\.includes\('\/img\/'\)/.test(SW), 'la branche img/ est absente du service worker');
  const branche = SW.slice(SW.indexOf("'/img/'") - 400, SW.indexOf("'/img/'") + 900);
  assert.ok(/AUDIO_CACHE/.test(branche) && /status === 200/.test(branche));
});

await test('img/ est exclu du zip de livraison et protégé dans la procédure d\'hébergement', ()=>{
  assert.ok(/-x "img\/\*"/.test(fs.readFileSync(path.join(ROOT, 'scripts/build-deploy-zip.sh'), 'utf8')));
  assert.ok(/sauf les dossiers `audio\/` ET `img\/`/i.test(fs.readFileSync(path.join(ROOT, 'HEBERGEMENT.md'), 'utf8')),
    'la consigne « supprimez tout sauf… » doit protéger img/ comme audio/');
});

await test('docs/IMAGES.md existe et liste les fichiers attendus', ()=>{
  const doc = fs.readFileSync(path.join(ROOT, 'docs/IMAGES.md'), 'utf8');
  assert.ok((doc.match(/\.webp/g)||[]).length >= 100, 'la liste des photos attendues semble incomplète');
  assert.ok(/1f431\.webp/.test(doc), 'l\'exemple canonique (🐱 -> 1f431.webp) devrait y figurer');
});

await test('index.html charge js/exo-images.js AVANT js/app.js', ()=>{
  const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  const exo = html.indexOf('<script src="js/exo-images.js">'), app = html.indexOf('<script src="js/app.js">');
  assert.ok(exo !== -1, 'exo-images.js n\'est pas chargé');
  assert.ok(exo < app, 'exo-images.js doit être chargé avant app.js qui l\'utilise');
});

console.log(`\n${passed} test(s) réussi(s), ${failed} échec(s).`);
if(failed > 0) process.exit(1);
}

main();
