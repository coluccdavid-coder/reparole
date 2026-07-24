// =====================================================================
//  TESTS — Généralisation "langue partielle" au-delà du kabyle (v6.59)
//  ---------------------------------------------------------------------
//  Avant cette version, l'exercice de dénomination et la lecture audio
//  ne fonctionnaient qu'avec "kab" codé en dur. Ces tests vérifient que
//  la darija algérienne (BANK_DZ, qui a aussi un champ "consigne" —
//  voir js/exercises-dz.js) bénéficie du même mécanisme sans rien
//  coder de spécifique — et que le kabyle continue de fonctionner
//  comme avant.
//
//  v6.151 : sango (l'exemple utilisé jusqu'ici en plus du kabyle) a
//  été retiré de l'app, demandé par l'utilisateur — remplacé par dz,
//  qui utilise réellement ce même mécanisme (contrairement à ma/tn,
//  qui utilisent le choix multiple standard sans audio pré-enregistré).
//
//  Lancer : node tests/partial-lang-generalization.test.js
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
    // v6.247 : les 14 langues vivent dans js/i18n/<code>.js et les pages
    // n'en chargent qu'une. En test, on les charge toutes.
    if(typeof src !== 'undefined' && src === 'js/i18n.js') fs.readdirSync(path.join(ROOT, 'js/i18n'))
      .forEach(lf => dom.window.eval(fs.readFileSync(path.join(ROOT, 'js/i18n', lf), 'utf8')));
  }
  dom.window.eval("Prefs.load(); __testSetUserCode('T'); __testSetUser({});");
  return dom;
}

async function main(){

console.log('Dénomination en langue partielle : kabyle et darija algérienne, sans code spécifique');

for(const lang of ['kab', 'dz']){
  await test(`${lang} : startExercise('denomination') utilise la bonne banque et son propre consigne`, async ()=>{
    const dom = loadPatientApp();
    dom.window.eval(`Prefs.setLang('${lang}');`);
    await dom.window.eval("startExercise('denomination')");
    const promptText = dom.window.document.querySelector('.prompt-text').textContent;
    const expectedConsigne = dom.window.eval(`window['BANK_${lang.toUpperCase()}'].denomination.consigne`);
    assert.strictEqual(promptText, expectedConsigne, `la consigne affichée doit venir de BANK_${lang.toUpperCase()}, pas du français`);
  });

  await test(`${lang} : le bouton d'écoute appelle playPartialLangWordUI('${lang}', ...)`, async ()=>{
    const dom = loadPatientApp();
    dom.window.eval(`Prefs.setLang('${lang}');`);
    await dom.window.eval("startExercise('denomination')");
    const btn = dom.window.document.querySelector('.speak-btn');
    assert.ok(btn, 'le bouton "écouter" doit être présent');
    assert.ok(btn.getAttribute('onclick').includes(`playPartialLangWordUI('${lang}'`), `attendu un appel à playPartialLangWordUI('${lang}', ...), obtenu : ${btn.getAttribute('onclick')}`);
  });
}

await test('français : ne déclenche jamais le mécanisme "langue partielle" (pas de régression)', async ()=>{
  const dom = loadPatientApp();
  dom.window.eval("Prefs.setLang('fr');");
  await dom.window.eval("startExercise('denomination')");
  const btn = dom.window.document.querySelector('.speak-btn');
  assert.ok(btn.getAttribute('onclick').startsWith('speak('), 'le français doit utiliser la synthèse vocale normale (speak()), pas playPartialLangWordUI');
});

console.log('\nDécoupage des noms de fichiers audio (partialLangAudioSlug)');

await test('langue partielle générique (hors kabyle) : les diacritiques (â, ä, ö, ü) se décomposent normalement', () => {
  // v6.151 : sango (l'exemple utilisé jusqu'ici) a été retiré de
  // l'app — le mécanisme testé ici (partialLangAudioSlug) reste
  // générique pour "toute langue autre que kab", peu importe laquelle,
  // donc dz sert d'exemple ici même si son contenu réel est en
  // écriture arabe (le test porte sur la fonction, pas sur du vrai
  // contenu dz).
  const dom = loadPatientApp();
  const slug = dom.window.eval("partialLangAudioSlug('dz', 'NYÂÜ')");
  assert.strictEqual(slug, 'nyau');
});

await test('kabyle : continue d\'utiliser kabAudioSlug (lettres ɣ/ḥ/ɛ... qui ne se décomposent pas via NFD)', () => {
  const dom = loadPatientApp();
  const slug = dom.window.eval("partialLangAudioSlug('kab', 'TAḌEFFUT')");
  assert.strictEqual(slug, 'tadeffut');
});

console.log(`\n${passed} test(s) réussi(s), ${failed} échec(s).`);
if(failed > 0) process.exitCode = 1;

}

main();
