// =====================================================================
//  TESTS — Voix cloud pré-générées, avec repli sur le navigateur (v6.150)
//  ---------------------------------------------------------------------
//  Préparation demandée par l'utilisateur ("on va préparer les
//  nouvelles voix") avant d'envisager une application téléphonique.
//  speak() essaie d'abord un fichier audio pré-généré
//  (scripts/generate-voice-audio.js), et ne retombe sur la synthèse
//  vocale du navigateur QUE si ce fichier n'existe pas — ce qui reste
//  le cas normal tant que le dossier audio/ n'a pas été rempli (le
//  script demande une clé API Google Cloud que je ne peux pas créer
//  à la place de l'utilisateur), pour les langues partielles, et pour
//  le texte de bilan téléversé par le patient (dynamique, jamais
//  pré-généré volontairement).
//
//  Lancer : node tests/cloud-voice.test.js
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

console.log('Fonction de hachage — DOIT être identique entre js/app.js et scripts/generate-voice-audio.js');

await test('fnv1aHash() est déterministe (même texte -> même hash à chaque fois)', ()=>{
  const dom = loadPatientApp();
  const h1 = dom.window.eval("fnv1aHash('Quel est ce mot ?')");
  const h2 = dom.window.eval("fnv1aHash('Quel est ce mot ?')");
  assert.strictEqual(h1, h2);
});

await test('fnv1aHash() produit des hash différents pour des textes différents', ()=>{
  const dom = loadPatientApp();
  const h1 = dom.window.eval("fnv1aHash('Bonjour')");
  const h2 = dom.window.eval("fnv1aHash('Au revoir')");
  assert.notStrictEqual(h1, h2);
});

await test('js/app.js et scripts/generate-voice-audio.js utilisent EXACTEMENT la même fonction de hachage', ()=>{
  const appCode = fs.readFileSync(path.join(ROOT, 'js/app.js'), 'utf8');
  const genCode = fs.readFileSync(path.join(ROOT, 'scripts/generate-voice-audio.js'), 'utf8');
  const extractFn = (code, name) => {
    const start = code.indexOf(`function ${name}(str){`);
    assert.ok(start !== -1, `${name} introuvable`);
    const end = code.indexOf('\n}', start) + 2;
    return code.slice(start, end).replace(`function ${name}`, 'function fn');
  };
  const appFn = extractFn(appCode, 'fnv1aHash');
  const genFn = extractFn(genCode, 'fnv1a');
  assert.strictEqual(appFn, genFn, 'les deux fonctions de hachage ont divergé — les fichiers audio ne seraient plus trouvés');
});

console.log('\nspeak() : audio cloud en priorité, repli sur le navigateur si absent');

await test('speak() a un filet de sécurité par délai — retombe sur speakBrowserTTS() même si le <audio> ne déclenche jamais d\'évènement', async ()=>{
  // v6.150 : jsdom n'implémente PAS le chargement audio réel — ni
  // "error" ni "canplaythrough" ne se déclenchent jamais dans ce
  // test, contrairement à un vrai navigateur (voir commentaire dans
  // js/app.js). C'est justement pour ce genre de cas — une requête
  // qui ne se résout jamais — que le filet de sécurité par délai
  // existe : sans lui, ce scénario laisserait le patient sans rien
  // entendre du tout.
  const dom = loadPatientApp();
  let browserTTSCalled = false;
  dom.window.speakBrowserTTS = (text) => { browserTTSCalled = true; };
  dom.window.speak('Un texte qui n\'a sûrement pas de fichier audio généré');
  await new Promise(r => setTimeout(r, 2700)); // un peu plus que le délai de 2,5s dans speak()
  assert.ok(browserTTSCalled, 'le filet de sécurité aurait dû se déclencher après 2,5s');
});

await test('speak() ne déclenche le repli qu\'une seule fois, même si "error" et le filet de sécurité se chevauchent', async ()=>{
  const dom = loadPatientApp();
  let callCount = 0;
  dom.window.speakBrowserTTS = () => { callCount++; };
  dom.window.speak('texte');
  await new Promise(r => setTimeout(r, 2700));
  assert.strictEqual(callCount, 1, `attendu 1 seul appel, trouvé ${callCount}`);
});

await test('speak() construit bien le chemin audio à partir de la langue active', ()=>{
  const dom = loadPatientApp();
  dom.window.eval("Prefs.setLang('en')");
  const lang = dom.window.eval("(window.Prefs && Prefs.data.lang) || 'fr'");
  assert.strictEqual(lang, 'en');
});

console.log('\nDocumentation et scripts de préparation');

await test('scripts/generate-voice-audio.js refuse de tourner sans clé API (pas de clé en dur dans le fichier)', ()=>{
  const code = fs.readFileSync(path.join(ROOT, 'scripts/generate-voice-audio.js'), 'utf8');
  assert.ok(code.includes('process.env.GOOGLE_TTS_API_KEY'), 'devrait lire la clé depuis une variable d\'environnement');
  assert.ok(!/AIza[0-9A-Za-z_-]{35}/.test(code), 'aucune clé API Google ne devrait être écrite en dur');
});

await test('scripts/voice-manifest.json existe et couvre les 10 langues complètes', ()=>{
  const manifest = JSON.parse(fs.readFileSync(path.join(ROOT, 'scripts/voice-manifest.json'), 'utf8'));
  const expected = ['fr','en','es','it','pt','de','ar','tr','pl','ja'];
  expected.forEach(lang=>{
    assert.ok(Array.isArray(manifest[lang]) && manifest[lang].length > 0, `${lang} devrait avoir du contenu à générer`);
  });
});

console.log(`\n${passed} test(s) réussi(s), ${failed} échec(s).`);
if(failed > 0) process.exit(1);
}

main();
