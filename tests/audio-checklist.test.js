// =====================================================================
//  TESTS — Outil de suivi des enregistrements audio (v6.73)
//  ---------------------------------------------------------------------
//  La logique de audio-checklist.html elle-même — extraite du vrai
//  fichier (pas recopiée à la main, pour ne jamais tester une
//  version qui aurait divergé) : collecte des mots sans doublon
//  pour kab, et calcul du bon chemin de fichier. Ne teste pas
//  fetch()/le réseau (pas de vrai serveur ici — voir
//  audio-checklist.html pour le comportement "non vérifiable"
//  quand fetch échoue, ex. ouverture en file://).
//
//  v6.151 : sango retiré (langue retirée de l'app, demandé par
//  l'utilisateur) — ce fichier ne couvrait plus qu'un vrai bug
//  spécifique à sango (dossier audio/sango/ vs code de langue 'sg'),
//  disparu avec la langue elle-même.
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

console.log('Outil audio-checklist.html — logique de collecte et de chemins');

function loadPatientApp(){
  const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  const dom = new JSDOM(html, { url:'http://localhost/', runScripts:'outside-only', resources:'usable', pretendToBeVisual:true });
  const scripts = [...dom.window.document.querySelectorAll('script[src]')].map(s=>s.getAttribute('src'));
  for(const src of scripts){
    dom.window.eval(fs.readFileSync(path.join(ROOT, src), 'utf8'));
    // v6.247 : les 14 langues vivent dans js/i18n/<code>.js et les pages
    // n'en chargent qu'une. En test, on les charge toutes.
    if(src === 'js/i18n.js') fs.readdirSync(path.join(ROOT, 'js/i18n'))
      .forEach(lf => dom.window.eval(fs.readFileSync(path.join(ROOT, 'js/i18n', lf), 'utf8')));
  }
  return dom;
}

await test("partialLangAudioFolder('kab') reste 'kab' (dossier identique au code de langue)", ()=>{
  const dom = loadPatientApp();
  assert.strictEqual(dom.window.eval("partialLangAudioFolder('kab')"), 'kab');
});

// Extrait le <script> inline (sans src) du vrai fichier, sans exécuter
// l'appel automatique buildChecklist() final (qui ferait de vraies
// requêtes réseau) — pour tester les fonctions elles-mêmes.
function loadChecklistLogic(){
  const html = fs.readFileSync(path.join(ROOT, 'audio-checklist.html'), 'utf8');
  const dom = new JSDOM(html, { url:'http://localhost/', runScripts:'outside-only', resources:'usable' });
  dom.window.eval(fs.readFileSync(path.join(ROOT, 'js/exercises-kab.js'), 'utf8'));
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

await test('AUDIO_LANGS ne contient plus que le kabyle (sango retiré, v6.151)', ()=>{
  const dom = loadChecklistLogic();
  const length = dom.window.eval("AUDIO_LANGS.length");
  assert.strictEqual(length, 1);
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
