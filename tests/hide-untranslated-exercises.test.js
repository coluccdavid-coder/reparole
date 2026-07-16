// =====================================================================
//  TESTS — Masquage des exercices sans traduction (v6.146, étendu v6.149)
//  ---------------------------------------------------------------------
//  Signalé par l'utilisateur : "possibilité de pas faire apparaître
//  les nouveaux exercices que l'on peut pas traduire en arabe ?" —
//  "Structure de phrase" et "Lire et comprendre" reposent sur de
//  vraies phrases, sans traduction pour dz/ma/tn/kab/sg elles
//  retombaient en français avec juste un bandeau d'avertissement,
//  aggravant le mélange de langues déjà signalé plusieurs fois.
//
//  v6.149 : "Rimes" a rejoint la liste — capture d'écran à l'appui,
//  l'utilisateur a confirmé que ça ne devrait pas non plus apparaître
//  en darija. Décision initiale (v6.146) inversée : peu importe que
//  la cause soit un manque de traduction (syntax/story) ou une limite
//  universelle intraduisible (rhyme, aucune langue n'a de rimes
//  traduites) — le résultat visible pour le patient est le même, du
//  français là où il ne l'attend pas.
//
//  Lancer : node tests/hide-untranslated-exercises.test.js
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
  }
  dom.window.eval("Prefs.load();");
  return dom;
}

function isHidden(dom, type){
  const el = dom.window.document.querySelector(`[data-type="${type}"]`);
  return el && el.style.display === 'none';
}

async function main(){

console.log('Français (langue de référence) — jamais masqué');

await test('en français, "syntax" et "story" restent visibles', ()=>{
  const dom = loadPatientApp();
  assert.strictEqual(isHidden(dom, 'syntax'), false);
  assert.strictEqual(isHidden(dom, 'story'), false);
});

console.log('\nLangues complètes (contenu traduit) — restent visibles');

await test('en anglais (contenu traduit existe), "syntax" et "story" restent visibles', ()=>{
  const dom = loadPatientApp();
  dom.window.eval("Prefs.setLang('en')");
  assert.strictEqual(isHidden(dom, 'syntax'), false);
  assert.strictEqual(isHidden(dom, 'story'), false);
});

console.log('\nLangues partielles (pas de contenu traduit) — masqués');

for(const lang of ['dz','ma','tn','kab']){
  await test(`en ${lang} (pas de traduction), "syntax" et "story" sont masqués`, ()=>{
    const dom = loadPatientApp();
    dom.window.eval(`Prefs.setLang('${lang}')`);
    assert.strictEqual(isHidden(dom, 'syntax'), true, `syntax devrait être masqué en ${lang}`);
    assert.strictEqual(isHidden(dom, 'story'), true, `story devrait être masqué en ${lang}`);
  });
}

console.log('\n"Rimes" — décision inversée en v6.149 (voir plus bas)');

await test('v6.149 : VRAI CHANGEMENT — "rhyme" est maintenant aussi masqué en langue non française, capture d\'écran à l\'appui de l\'utilisateur', ()=>{
  const dom = loadPatientApp();
  dom.window.eval("Prefs.setLang('kab')");
  assert.strictEqual(isHidden(dom, 'rhyme'), true, '"rhyme" devrait être masqué en kabyle depuis la v6.149');
});

await test('"rhyme" est aussi masqué dans les langues complètes (en anglais, par ex.) — aucune langue n\'a de contenu traduit pour cet exercice', ()=>{
  const dom = loadPatientApp();
  dom.window.eval("Prefs.setLang('en')");
  assert.strictEqual(isHidden(dom, 'rhyme'), true, '"rhyme" devrait être masqué en anglais aussi (aucune langue n\'a BANK_XX.rhyme)');
});

await test('"rhyme" reste visible en français (la langue de référence, jamais masquée)', ()=>{
  const dom = loadPatientApp();
  assert.strictEqual(isHidden(dom, 'rhyme'), false);
});

console.log('\nRebasculer sur une langue traduite réaffiche la tuile');

await test('passer de kab à en réaffiche "syntax" et "story"', ()=>{
  const dom = loadPatientApp();
  dom.window.eval("Prefs.setLang('kab')");
  assert.strictEqual(isHidden(dom, 'syntax'), true);
  dom.window.eval("Prefs.setLang('en')");
  assert.strictEqual(isHidden(dom, 'syntax'), false);
});

console.log(`\n${passed} test(s) réussi(s), ${failed} échec(s).`);
if(failed > 0) process.exit(1);
}

main();
