// =====================================================================
//  TESTS — Synthèse vocale : choix de la voix + vrai bug corrigé
//  (le son ne fonctionnait pas dans certaines langues) (v6.92)
//  ---------------------------------------------------------------------
//  Retour utilisateur : le son ne fonctionne pas dans certaines langues
//  (arabe cité en exemple). Deux causes réelles trouvées :
//   1. speechSynthesis.getVoices() renvoie souvent un tableau vide au
//      premier appel (chargement asynchrone, évènement "voiceschanged")
//      — jamais géré jusqu'ici.
//   2. Aucune vérification qu'une voix existe pour la langue choisie —
//      échec silencieux si le système n'en a pas.
//
//  jsdom n'implémente pas speechSynthesis : on le simule entièrement
//  dans chaque test pour contrôler précisément le scénario testé.
//
//  Lancer : node tests/voice-selection.test.js
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

function fakeVoice(name, lang, voiceURI){
  return { name, lang, voiceURI: voiceURI || name, default:false, localService:true };
}

// simule speechSynthesis avec des voix immédiatement disponibles
function mockSpeechSynthesisImmediate(voices){
  return {
    _voices: voices,
    _lastUtterance: null,
    getVoices(){ return this._voices; },
    speak(u){ this._lastUtterance = u; },
    cancel(){},
    onvoiceschanged: null,
  };
}

// simule le piège classique : getVoices() vide au premier appel, peuplé
// seulement après le déclenchement de "voiceschanged"
function mockSpeechSynthesisDelayed(voices){
  const mock = {
    _voices: [],
    _lastUtterance: null,
    getVoices(){ return this._voices; },
    speak(u){ this._lastUtterance = u; },
    cancel(){},
    onvoiceschanged: null,
    _triggerVoicesLoaded(){ this._voices = voices; if(this.onvoiceschanged) this.onvoiceschanged(); },
  };
  return mock;
}

function loadPatientApp(fakeSpeechSynthesis){
  const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  const dom = new JSDOM(html, { url:'http://localhost/', runScripts:'outside-only', resources:'usable', pretendToBeVisual:true });
  if(fakeSpeechSynthesis){
    dom.window.speechSynthesis = fakeSpeechSynthesis;
    dom.window.SpeechSynthesisUtterance = function(text){ this.text = text; this.lang=''; this.rate=1; this.voice=null; };
  }
  const scripts = [...dom.window.document.querySelectorAll('script[src]')].map(s=>s.getAttribute('src'));
  for(const src of scripts){
    let code = fs.readFileSync(path.join(ROOT, src), 'utf8');
    if(src === 'js/app.js'){
      code += `
        window.__testSetUser = function(overrides){
          user = Object.assign({name:'Test',level:2,sessions:0,correct:0,total:0,streak:1,plan:'free'}, overrides||{});
        };
        window.__testSetUserCode = function(code){ userCode = code; };
      `;
    }
    if(src === 'js/storage.js'){
      code = code.replace(/const SUPABASE_URL = "[^"]*";/, 'const SUPABASE_URL = "";')
                  .replace(/const SUPABASE_ANON_KEY = "[^"]*";/, 'const SUPABASE_ANON_KEY = "";');
    }
    dom.window.eval(code);
  }
  dom.window.eval("Prefs.load(); __testSetUserCode('T'); __testSetUser({});");
  return dom;
}

async function main(){

console.log('Piège "voiceschanged" (voix vides au premier appel)');

await test('loadVoices() attend bien l\'évènement voiceschanged si getVoices() renvoie un tableau vide', async ()=>{
  const mock = mockSpeechSynthesisDelayed([fakeVoice('Voix FR test','fr-FR')]);
  const dom = loadPatientApp(mock);
  const promise = dom.window.loadVoices();
  // rien n'est encore chargé
  mock._triggerVoicesLoaded();
  const voices = await promise;
  assert.strictEqual(voices.length, 1);
});

await test('loadVoices() a un filet de sécurité si voiceschanged ne se déclenche jamais', async ()=>{
  const mock = mockSpeechSynthesisDelayed([]); // ne déclenche jamais _triggerVoicesLoaded
  const dom = loadPatientApp(mock);
  const voices = await dom.window.loadVoices();
  assert.deepStrictEqual(voices, []);
});

console.log('\nChoix de voix par langue (voicesForLangPrefix / pickVoiceForSpeech)');

await test('filtre correctement par préfixe de langue (ar-SA, ar-EG -> "ar")', async ()=>{
  const mock = mockSpeechSynthesisImmediate([
    fakeVoice('Voix arabe 1','ar-SA'), fakeVoice('Voix arabe 2','ar-EG'), fakeVoice('Voix anglaise','en-US')
  ]);
  const dom = loadPatientApp(mock);
  await dom.window.loadVoices();
  const ar = dom.window.voicesForLangPrefix('ar');
  assert.strictEqual(ar.length, 2);
});

await test('pickVoiceForSpeech() respecte la voix déjà choisie par la personne si elle existe encore', async ()=>{
  const mock = mockSpeechSynthesisImmediate([
    fakeVoice('Voix A','fr-FR','uri-a'), fakeVoice('Voix B','fr-FR','uri-b')
  ]);
  const dom = loadPatientApp(mock);
  await dom.window.loadVoices();
  dom.window.eval("Prefs.data.voiceURI = 'uri-b';");
  const picked = dom.window.pickVoiceForSpeech();
  assert.strictEqual(picked.voiceURI, 'uri-b');
});

console.log('\nspeak() — le vrai bug : silence sans explication quand aucune voix n\'existe');

await test('aucune voix pour la langue active -> message clair au lieu d\'un silence inexpliqué', async ()=>{
  const mock = mockSpeechSynthesisImmediate([fakeVoice('Voix française','fr-FR')]); // pas de voix arabe
  const dom = loadPatientApp(mock);
  await dom.window.loadVoices();
  dom.window.eval("Prefs.setLang('ar');");
  dom.window.speak('test');
  const status = dom.window.document.getElementById('voice-select-status').textContent;
  assert.ok(status.length > 0, 'un message explicatif est attendu');
});

await test('une voix existe pour la langue -> utilisée sur l\'utterance, pas de message d\'erreur', async ()=>{
  const mock = mockSpeechSynthesisImmediate([fakeVoice('Voix française','fr-FR')]);
  const dom = loadPatientApp(mock);
  await dom.window.loadVoices();
  dom.window.speak('bonjour');
  assert.strictEqual(mock._lastUtterance.voice.lang, 'fr-FR');
  const status = dom.window.document.getElementById('voice-select-status').textContent;
  assert.strictEqual(status, '');
});

console.log('\nSélecteur de voix dans le tableau de bord');

await test('renderVoiceSelector() peuple le menu avec les voix de la langue active', async ()=>{
  const mock = mockSpeechSynthesisImmediate([
    fakeVoice('Voix Homme','fr-FR','v1'), fakeVoice('Voix Femme','fr-FR','v2'), fakeVoice('Autre langue','en-US','v3')
  ]);
  const dom = loadPatientApp(mock);
  await dom.window.renderVoiceSelector();
  const options = [...dom.window.document.querySelectorAll('#voice-select option')];
  assert.strictEqual(options.length, 2);
  assert.ok(options.some(o=>o.textContent==='Voix Homme'));
  assert.ok(options.some(o=>o.textContent==='Voix Femme'));
});

await test('renderVoiceSelector() : aucune voix dispo -> menu masqué, message affiché (pas de plantage)', async ()=>{
  const mock = mockSpeechSynthesisImmediate([]);
  const dom = loadPatientApp(mock);
  await dom.window.renderVoiceSelector();
  const select = dom.window.document.getElementById('voice-select');
  assert.strictEqual(select.style.display, 'none');
  const status = dom.window.document.getElementById('voice-select-status').textContent;
  assert.ok(status.length > 0);
});

await test('setPreferredVoice() enregistre bien le choix dans Prefs', async ()=>{
  const mock = mockSpeechSynthesisImmediate([fakeVoice('Voix test','fr-FR','my-uri')]);
  const dom = loadPatientApp(mock);
  dom.window.setPreferredVoice('my-uri');
  assert.strictEqual(dom.window.Prefs.data.voiceURI, 'my-uri');
  const saved = JSON.parse(dom.window.localStorage.getItem('reparole:prefs'));
  assert.strictEqual(saved.voiceURI, 'my-uri');
});

await test('pas de speechSynthesis du tout sur l\'appareil -> pas de plantage, sélecteur masqué', async ()=>{
  const dom = loadPatientApp(null); // pas de mock = pas de speechSynthesis, comme un vrai navigateur sans support
  await dom.window.renderVoiceSelector();
  const container = dom.window.document.getElementById('voice-selector-container');
  assert.strictEqual(container.style.display, 'none');
});

console.log(`\n${passed} test(s) réussi(s), ${failed} échec(s).`);
if(failed > 0) process.exit(1);

}

main();
