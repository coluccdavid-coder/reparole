// =====================================================================
//  TESTS — v6.244 : LES VOIX SURVIVENT AUX MISES À JOUR
//  ---------------------------------------------------------------------
//  Contexte : les voix cloud ont été générées et mises en ligne (10
//  langues, ~300 mp3 chacune). Deux défauts sont apparus à ce moment-là,
//  et ce fichier existe pour qu'ils ne reviennent jamais :
//
//  1. sw.js supprimait, à chaque `activate`, TOUT cache dont le nom
//     différait de CACHE_NAME. Comme CACHE_NAME est incrémenté à chaque
//     version (règle du projet), chaque déploiement effaçait les voix
//     déjà téléchargées : le patient les re-téléchargeait intégralement,
//     et réentendait la voix synthétique du navigateur en attendant.
//     → les mp3 vivent désormais dans AUDIO_CACHE, jamais purgé.
//
//  2. speak() tentait un fichier audio même pour les langues qui n'en
//     ont AUCUN (dz, ma, tn, kab) : un 404 à chaque mot prononcé.
//     → CLOUD_VOICE_LANGS filtre en amont.
//
//  Lancer : node tests/audio-cache-v244.test.js
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

const SW = fs.readFileSync(path.join(ROOT, 'sw.js'), 'utf8');

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

console.log('sw.js — le cache des voix est séparé et permanent');

await test('un cache dédié aux voix existe, distinct de CACHE_NAME', ()=>{
  const audio = SW.match(/const AUDIO_CACHE = '([^']+)'/);
  const shell = SW.match(/const CACHE_NAME = '([^']+)'/);
  assert.ok(audio, 'AUDIO_CACHE devrait être déclaré dans sw.js');
  assert.ok(shell, 'CACHE_NAME devrait être déclaré dans sw.js');
  assert.notStrictEqual(audio[1], shell[1], 'les deux caches doivent porter des noms différents');
});

await test('le nom du cache audio ne contient PAS le numéro de version', ()=>{
  const audio = SW.match(/const AUDIO_CACHE = '([^']+)'/)[1];
  assert.ok(!/v6-\d+/.test(audio),
    `AUDIO_CACHE vaut « ${audio} » : s'il suit la version, il sera recréé (donc vidé) à chaque livraison`);
});

await test('activate() épargne explicitement le cache audio', ()=>{
  const activate = SW.slice(SW.indexOf("addEventListener('activate'"), SW.indexOf("addEventListener('fetch'"));
  assert.ok(/name !== CACHE_NAME/.test(activate), 'le cache de version doit être conservé');
  assert.ok(/name !== AUDIO_CACHE/.test(activate),
    'AUDIO_CACHE doit être conservé lui aussi — sinon les voix repartent à chaque mise à jour');
});

await test('les requêtes /audio/ sont servies par le cache permanent, avant la branche générique', ()=>{
  const fetchHandler = SW.slice(SW.indexOf("addEventListener('fetch'"));
  const audioBranch = fetchHandler.indexOf("'/audio/'");
  assert.ok(audioBranch !== -1, 'le gestionnaire fetch devrait reconnaître les requêtes /audio/');
  // La branche générique est le DERNIER event.respondWith() du gestionnaire :
  // la branche « navigation » en contient un autre, plus haut, qui appelle
  // lui aussi caches.match() — d'où lastIndexOf() et pas indexOf().
  const generic = fetchHandler.lastIndexOf('event.respondWith(');
  assert.ok(audioBranch < generic,
    'la branche audio doit passer AVANT la branche générique, sinon les mp3 retournent dans le cache de version');
  assert.ok(/caches\.open\(AUDIO_CACHE\)/.test(fetchHandler), 'la branche audio doit ouvrir AUDIO_CACHE');
});

await test('un 404 n\'est jamais mémorisé (un enregistrement ajouté plus tard doit rester visible)', ()=>{
  const branch = SW.slice(SW.indexOf("'/audio/'"), SW.indexOf("'/audio/'") + 900);
  assert.ok(/status === 200/.test(branch),
    'seules les réponses 200 doivent être mises en cache dans la branche audio');
});

console.log('\nspeak() — aucune requête inutile pour les langues sans voix cloud');

await test('CLOUD_VOICE_LANGS liste exactement les langues de generate-voice-audio.js', ()=>{
  const gen = fs.readFileSync(path.join(ROOT, 'scripts/generate-voice-audio.js'), 'utf8');
  const block = gen.slice(gen.indexOf('const LANGUAGE_CODES'), gen.indexOf('}', gen.indexOf('const LANGUAGE_CODES')));
  const generated = [...block.matchAll(/(\w+)\s*:\s*'/g)].map(m=>m[1]).sort();
  const app = fs.readFileSync(path.join(ROOT, 'js/app.js'), 'utf8');
  const declared = [...app.match(/const CLOUD_VOICE_LANGS = \[([^\]]+)\]/)[1].matchAll(/'([^']+)'/g)].map(m=>m[1]).sort();
  assert.deepStrictEqual(declared, generated,
    'les deux listes ont divergé : l\'app chercherait des fichiers qui n\'existent pas, ou ignorerait des voix existantes');
});

await test('CLOUD_VOICE_LANGS n\'inclut AUCUNE langue partielle (dz, ma, tn, kab)', ()=>{
  const app = fs.readFileSync(path.join(ROOT, 'js/app.js'), 'utf8');
  const declared = [...app.match(/const CLOUD_VOICE_LANGS = \[([^\]]+)\]/)[1].matchAll(/'([^']+)'/g)].map(m=>m[1]);
  ['dz','ma','tn','kab'].forEach(l=>{
    assert.ok(!declared.includes(l), `${l} n'a pas de voix générée : l'y ajouter provoquerait un 404 par mot`);
  });
});

await test('en langue partielle, speak() passe au navigateur IMMÉDIATEMENT (pas d\'attente de 2,5 s)', async ()=>{
  const dom = loadPatientApp();
  let called = false;
  dom.window.speakBrowserTTS = ()=>{ called = true; };
  dom.window.eval("Prefs.setLang('kab')");
  dom.window.speak('awal');
  assert.ok(called, 'la synthèse du navigateur aurait dû être appelée sans attendre le réseau');
});

await test('en langue complète, speak() tente toujours le fichier pré-généré d\'abord', async ()=>{
  const dom = loadPatientApp();
  let called = false;
  dom.window.speakBrowserTTS = ()=>{ called = true; };
  dom.window.eval("Prefs.setLang('fr')");
  dom.window.speak('Quel est ce mot ?');
  assert.ok(!called, 'la voix cloud doit être tentée avant tout repli — le repli ne vient qu\'après échec ou délai');
});

console.log(`\n${passed} test(s) réussi(s), ${failed} échec(s).`);
if(failed > 0) process.exit(1);
}

main();
