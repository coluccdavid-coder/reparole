// =====================================================================
//  TESTS — Outil de suivi des enregistrements audio (v6.73)
//  ---------------------------------------------------------------------
//  Deux choses vérifiées :
//   1. Le vrai bug corrigé au passage dans js/app.js : le dossier du
//      sango est audio/sango/, pas audio/sg/ (le code de langue).
//   2. La logique de audio-checklist.html elle-même — extraite du vrai
//      fichier (pas recopiée à la main, pour ne jamais tester une
//      version qui aurait divergé) : collecte des mots sans doublon
//      pour kab/sg, et calcul du bon chemin de fichier pour chacun.
//      Ne teste pas fetch()/le réseau (pas de vrai serveur ici — see
//      audio-checklist.html pour le comportement "non vérifiable"
//      quand fetch échoue, ex. ouverture en file://).
//
//  Lancer : node tests/audio-checklist.test.js
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

async function main(){

console.log('Vrai bug corrigé : dossier audio du sango (js/app.js)');

function loadPatientApp(){
  const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  const dom = new JSDOM(html, { url:'http://localhost/', runScripts:'outside-only', resources:'usable', pretendToBeVisual:true });
  const scripts = [...dom.window.document.querySelectorAll('script[src]')].map(s=>s.getAttribute('src'));
  for(const src of scripts){
    dom.window.eval(fs.readFileSync(path.join(ROOT, src), 'utf8'));
  }
  return dom;
}

await test("partialLangAudioFolder('sg') vaut 'sango', pas 'sg'", ()=>{
  const dom = loadPatientApp();
  assert.strictEqual(dom.window.eval("partialLangAudioFolder('sg')"), 'sango');
});

await test("partialLangAudioFolder('kab') reste 'kab' (dossier identique au code de langue)", ()=>{
  const dom = loadPatientApp();
  assert.strictEqual(dom.window.eval("partialLangAudioFolder('kab')"), 'kab');
});

console.log('\nOutil audio-checklist.html — logique de collecte et de chemins');

// Extrait le <script> inline (sans src) du vrai fichier, sans exécuter
// l'appel automatique buildChecklist() final (qui ferait de vraies
// requêtes réseau) — pour tester les fonctions elles-mêmes.
function loadChecklistLogic(){
  const html = fs.readFileSync(path.join(ROOT, 'audio-checklist.html'), 'utf8');
  const dom = new JSDOM(html, { url:'http://localhost/', runScripts:'outside-only', resources:'usable' });
  dom.window.eval(fs.readFileSync(path.join(ROOT, 'js/exercises-kab.js'), 'utf8'));
  dom.window.eval(fs.readFileSync(path.join(ROOT, 'js/exercises-sango.js'), 'utf8'));
  const inlineScriptMatch = html.match(/<script>([\s\S]*?)<\/script>\s*<\/body>/);
  assert.ok(inlineScriptMatch, 'script inline introuvable dans audio-checklist.html — le fichier a peut-être changé de structure');
  const inlineCode = inlineScriptMatch[1].replace(/\nbuildChecklist\(\);\s*$/, '\n// (appel auto retiré pour le test)');
  dom.window.eval(inlineCode);
  return dom;
}

await test('collectWords() récupère tous les mots de BANK_KAB.denomination, tous niveaux, sans doublon', ()=>{
  const dom = loadChecklistLogic();
  const words = dom.window.eval('collectWords(window.BANK_KAB)');
  const expectedCount = dom.window.eval(`
    (() => {
      const seen = new Set();
      Object.values(BANK_KAB.denomination.items).forEach(level => level.forEach(it => seen.add(it.answer)));
      return seen.size;
    })()
  `);
  assert.strictEqual(words.length, expectedCount);
  assert.strictEqual(new Set(words).size, words.length, 'ne doit contenir aucun doublon');
});

await test('collectWords() fonctionne pareil pour BANK_SG', ()=>{
  const dom = loadChecklistLogic();
  const words = dom.window.eval('collectWords(window.BANK_SG)');
  assert.ok(words.length > 0);
  assert.ok(words.includes('NYÂÜ'), 'attendu au moins le premier mot connu du niveau 1');
});

await test('collectWords() renvoie un tableau vide si la banque est absente, sans planter', ()=>{
  const dom = loadChecklistLogic();
  assert.doesNotThrow(()=>{
    const len = dom.window.eval('collectWords(undefined).length');
    assert.strictEqual(len, 0);
  });
});

await test('le chemin attendu pour un mot kabyle utilise kabAudioSlug() et le dossier audio/kab/', ()=>{
  const dom = loadChecklistLogic();
  const slug = dom.window.eval("AUDIO_LANGS[0].slug('TAḌEFFUT')");
  assert.strictEqual(slug, dom.window.eval("kabAudioSlug('TAḌEFFUT')"));
  assert.strictEqual(dom.window.eval("AUDIO_LANGS[0].folder"), 'kab');
});

await test('le chemin attendu pour un mot sango utilise le découpage générique et le dossier audio/sango/ (pas audio/sg/)', ()=>{
  const dom = loadChecklistLogic();
  const slug = dom.window.eval("AUDIO_LANGS[1].slug('NYÂÜ')");
  assert.strictEqual(slug, 'nyau');
  assert.strictEqual(dom.window.eval("AUDIO_LANGS[1].folder"), 'sango');
});

await test('fileExists() ne plante pas quand fetch échoue (ex. hors serveur HTTP) — renvoie null, pas une exception', async ()=>{
  const dom = loadChecklistLogic();
  const result = await dom.window.eval("fileExists('audio/kab/inexistant.mp3')");
  assert.ok(result === null || result === false, `attendu null ou false, reçu ${result}`);
});


}

main().then(()=>{
  console.log(`\n${passed} test(s) réussi(s), ${failed} échec(s).`);
if(failed > 0) process.exit(1);
});
