// =====================================================================
//  TESTS — Généralisation "langue partielle" au-delà du kabyle (v6.59)
//  ---------------------------------------------------------------------
//  Avant cette version, l'exercice de dénomination et la lecture audio
//  ne fonctionnaient qu'avec "kab" codé en dur. Ces tests vérifient que
//  le sango (BANK_SG) bénéficie du même mécanisme sans rien coder de
//  spécifique — et que le kabyle continue de fonctionner comme avant.
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
  }
  dom.window.eval("Prefs.load(); __testSetUserCode('T'); __testSetUser({});");
  return dom;
}

async function main(){

console.log('Dénomination en langue partielle : kabyle et sango, sans code spécifique');

for(const lang of ['kab', 'sg']){
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

await test('sango : les diacritiques (â, ä, ö, ü) se décomposent normalement, contrairement au kabyle', () => {
  const dom = loadPatientApp();
  const slug = dom.window.eval("partialLangAudioSlug('sg', 'NYÂÜ')");
  assert.strictEqual(slug, 'nyau');
});

await test('kabyle : continue d\'utiliser kabAudioSlug (lettres ɣ/ḥ/ɛ... qui ne se décomposent pas via NFD)', () => {
  const dom = loadPatientApp();
  const slug = dom.window.eval("partialLangAudioSlug('kab', 'TAḌEFFUT')");
  assert.strictEqual(slug, 'tadeffut');
});

console.log('\nRégression : doublon silencieux dans LANGUAGES (trouvé le 11 juillet — "sg" déclaré deux fois, la 2e écrasait la 1re sans erreur JS)');

await test('LANGUAGES.sg n\'apparaît qu\'une seule fois dans le code source (pas de doublon silencieux)', () => {
  const fs = require('fs');
  const code = fs.readFileSync(path.join(ROOT, 'js/i18n.js'), 'utf8');
  const occurrences = (code.match(/^\s*sg:\s*\{\s*label:/gm) || []).length;
  assert.strictEqual(occurrences, 1, `LANGUAGES.sg doit être déclaré une seule fois, trouvé ${occurrences} fois — un doublon écrase silencieusement le premier sans erreur JS`);
});

await test('LANGUAGES.sg.label est "Sango", sans diacritiques (demande explicite de l\'utilisateur)', () => {
  const dom = loadPatientApp();
  const label = dom.window.eval("LANGUAGES.sg.label");
  // v6.100 : un drapeau a été ajouté devant chaque libellé de langue —
  // le texte du nom lui-même (après le drapeau) doit rester "Sango",
  // toujours sans diacritiques, ce qui est ce que demandait cette
  // exigence à l'origine.
  // v6.123 : suffixe "(en cours de traduction)" ajouté après le nom —
  // on vérifie maintenant que "Sango" apparaît bien sans diacritiques,
  // pas que c'est l'intégralité du texte restant après le drapeau.
  const nameOnly = label.replace(/^\S+\s/, '').replace(/\s*\(en cours de traduction\)$/, '');
  assert.strictEqual(nameOnly, 'Sango');
});

console.log(`\n${passed} test(s) réussi(s), ${failed} échec(s).`);
if(failed > 0) process.exitCode = 1;

}

main();
