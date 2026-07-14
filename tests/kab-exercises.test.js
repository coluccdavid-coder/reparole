// =====================================================================
//  TESTS — Contenu d'exercices en kabyle étendu (v6.104)
//  ---------------------------------------------------------------------
//  Fichier Kabyle_Complet.xlsx fourni par l'utilisateur, traduit/relu
//  par une personne kabylophone d'après l'utilisateur. Vérifie
//  l'intégrité de la banque fusionnée (vocabulaire déjà sourcé v6.1-
//  v6.37 + nouveau contenu v6.104, sans doublon), la présence des trois
//  types d'exercice désormais complets (dénomination, complétion,
//  compréhension — auparavant seule la dénomination existait), et que
//  le mécanisme audio pré-enregistré reste actif (le kabyle n'a
//  toujours pas de speechLocale).
//
//  Lancer : node tests/kab-exercises.test.js
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

console.log('Intégrité de BANK_KAB étendu (js/exercises-kab.js, v6.104)');

await test('window.BANK_KAB a désormais les 3 types d\'exercice (dénomination + complétion + compréhension)', ()=>{
  const dom = loadPatientApp();
  const B = dom.window.BANK_KAB;
  ['denomination','completion','comprehension'].forEach(k=>assert.ok(B[k], `${k} manquant`));
});

await test('dénomination : le vocabulaire de base (v6.1-v6.37) est toujours présent, rien n\'a régressé', ()=>{
  const dom = loadPatientApp();
  const den = dom.window.BANK_KAB.denomination.items;
  const original = {
    1:['AMCIC','TAḌEFFUT','AXXAM','TAFUKT','TAKEṚṚUST','ASLEM','TAJEǦǦIGT','AƔRUM'],
    2:['TABBURT','TILIẔRI','AZEGGAƔ','TAFUNAST','ITRI','ADLIS','AGMAR','ADFEL'],
    3:['AMELLAL','TIZIZWIT','AZGER','AƔYUL','IZEM','AZEMMUR'],
  };
  for(const lvl of [1,2,3]){
    const answers = den[lvl].map(it=>it.answer);
    original[lvl].forEach(w=>assert.ok(answers.includes(w), `${w} (niveau ${lvl}) a disparu`));
  }
});

await test('dénomination : aucun doublon de mot au sein d\'un même niveau (fusion propre)', ()=>{
  const dom = loadPatientApp();
  const den = dom.window.BANK_KAB.denomination.items;
  [1,2,3].forEach(lvl=>{
    const answers = den[lvl].map(it=>it.answer);
    assert.strictEqual(new Set(answers).size, answers.length, `doublon au niveau ${lvl}`);
  });
});

await test('complétion et compréhension : 8/8/8 et 6/6/6 par niveau', ()=>{
  const dom = loadPatientApp();
  const comp = dom.window.BANK_KAB.completion.items;
  const compre = dom.window.BANK_KAB.comprehension.items;
  [1,2,3].forEach(l=>assert.strictEqual(comp[l].length, 8, `complétion niveau ${l}`));
  [1,2,3].forEach(l=>assert.strictEqual(compre[l].length, 6, `compréhension niveau ${l}`));
});

await test('chaque item : la bonne réponse figure bien dans ses propres choix, sans doublon', ()=>{
  const dom = loadPatientApp();
  const B = dom.window.BANK_KAB;
  let checked = 0;
  for(const kind of ['denomination','completion','comprehension']){
    for(const lvl of [1,2,3]){
      for(const it of B[kind].items[lvl]){
        assert.ok(it.choices.includes(it.answer), `${kind} niveau ${lvl} : "${it.answer}" absent de ses propres choix`);
        assert.strictEqual(new Set(it.choices).size, it.choices.length, `${kind} niveau ${lvl} : doublon dans les choix de "${it.answer}"`);
        checked++;
      }
    }
  }
  assert.ok(checked > 100, `nombre d'items suspicieusement bas : ${checked}`);
});

await test('complétion : chaque phrase contient bien un "___" (le trou)', ()=>{
  const dom = loadPatientApp();
  const comp = dom.window.BANK_KAB.completion.items;
  [1,2,3].forEach(lvl=>{
    comp[lvl].forEach(it=>assert.ok(it.text.includes('___'), `pas de trou dans : ${it.text}`));
  });
});

console.log('\nComportement dans l\'exercice (mécanisme générique v6.1/v6.59)');

await test('dénomination en kabyle : utilise toujours le mécanisme audio pré-enregistré, pas la synthèse vocale', async ()=>{
  const dom = loadPatientApp();
  dom.window.eval("Prefs.setLang('kab');");
  await dom.window.eval("startExercise('denomination')");
  const btn = dom.window.document.querySelector('.speak-btn');
  assert.ok(btn, 'bouton d\'écoute manquant');
  assert.ok(btn.getAttribute('onclick').includes('playPartialLangWordUI'), 'devrait utiliser playPartialLangWordUI, pas speak()');
});

await test('compréhension en kabyle : accessible et affiche bien du texte en kabyle (plus de repli français)', async ()=>{
  const dom = loadPatientApp();
  dom.window.eval("Prefs.setLang('kab'); __testSetUser({level:1});");
  await dom.window.eval("startExercise('comprehension')");
  const text = dom.window.document.querySelector('.prompt-main').textContent;
  assert.ok(text && text.length > 0, 'texte de compréhension manquant');
  assert.ok(!/^[A-Za-zÀ-ÿ\s?]+$/.test(text) || /[ɣḥɛṛṣṭẓḍǧ]/i.test(text), `devrait être du kabyle, pas un repli français : ${text}`);
});

console.log(`\n${passed} test(s) réussi(s), ${failed} échec(s).`);
if(failed > 0) process.exit(1);
}

main();
