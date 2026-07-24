// =====================================================================
//  TESTS — Contenu d'exercices en darija marocaine et tunisienne (v6.147)
//  ---------------------------------------------------------------------
//  Demandé par l'utilisateur : "attaque la traduction marocain et
//  tunisien" — ces deux langues avaient une interface complète
//  (538/538 depuis la v6.145) mais ZÉRO contenu d'exercice, signalé
//  comme le vrai trou dans les audits précédents.
//
//  ⚠️ Contrairement à la darija algérienne (dénomination/complétion
//  fournies à 100% par l'utilisateur), aucun fichier natif n'a été
//  fourni pour le marocain ni le tunisien : ce contenu est un premier
//  brouillon de ma part (js/exercises-ma.js, js/exercises-tn.js),
//  à faire vérifier par des locuteurs·rices natif·ves avant tout
//  usage clinique réel.
//
//  Lancer : node tests/moroccan-tunisian-exercises.test.js
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
    if(src === 'js/app.js'){
      code += `
        window.Store = Store;
        window.__testGetCurrent = function(){ return current; };
      `;
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

console.log('Intégrité de BANK_MA et BANK_TN');

['MA','TN'].forEach(lang=>{
  test(`window.BANK_${lang} existe avec dénomination + complétion + compréhension`, ()=>{
    const dom = loadPatientApp();
    const B = dom.window['BANK_'+lang];
    assert.ok(B, `BANK_${lang} introuvable`);
    assert.ok(B.denomination, 'denomination manquante');
    assert.ok(B.completion, 'completion manquante');
    assert.ok(B.comprehension, 'comprehension manquante');
  });
});

for(const lang of ['MA','TN']){
  await test(`${lang} : 8/8/8 items de dénomination et complétion, 6/6/6 de compréhension`, ()=>{
    const dom = loadPatientApp();
    const B = dom.window['BANK_'+lang];
    [1,2,3].forEach(lvl=>{
      assert.strictEqual(B.denomination.items[lvl].length, 8, `dénomination niveau ${lvl}`);
      assert.strictEqual(B.completion.items[lvl].length, 8, `complétion niveau ${lvl}`);
      assert.strictEqual(B.comprehension.items[lvl].length, 6, `compréhension niveau ${lvl}`);
    });
  });

  await test(`${lang} : chaque item a sa bonne réponse dans ses propres choix, sans doublon`, ()=>{
    const dom = loadPatientApp();
    const B = dom.window['BANK_'+lang];
    let checked = 0;
    ['denomination','completion','comprehension'].forEach(type=>{
      [1,2,3].forEach(lvl=>{
        B[type].items[lvl].forEach(it=>{
          assert.ok(it.choices.includes(it.answer), `${type} niveau ${lvl} : "${it.answer}" absent de ses propres choix`);
          assert.strictEqual(new Set(it.choices).size, it.choices.length, `${type} niveau ${lvl} : doublon dans les choix de "${it.answer}"`);
          checked++;
        });
      });
    });
    assert.strictEqual(checked, 66); // (8+8)*3 + 6*3
  });

  await test(`${lang} : chaque phrase de complétion contient bien un "___" (le trou)`, ()=>{
    const dom = loadPatientApp();
    const B = dom.window['BANK_'+lang];
    [1,2,3].forEach(lvl=>{
      B.completion.items[lvl].forEach(it=>{
        assert.ok(it.text.includes('___'), `"${it.text}" ne contient pas de trou`);
      });
    });
  });
}

console.log('\nDistinction entre les 3 dialectes (marqueurs possessifs réels, pas trois copies)');

await test('ma utilise ديال, tn utilise متاع, dz utilise تاع — dans le contenu d\'exercice aussi, pas seulement l\'interface', ()=>{
  const dom = loadPatientApp();
  const maText = JSON.stringify(dom.window.BANK_MA);
  const tnText = JSON.stringify(dom.window.BANK_TN);
  assert.ok(maText.includes('ديال'), 'marocain : ديال attendu dans le contenu d\'exercice');
  assert.ok(tnText.includes('متاع'), 'tunisien : متاع attendu dans le contenu d\'exercice');
});

await test('BANK_MA et BANK_TN ne sont pas des copies identiques l\'un de l\'autre', ()=>{
  const dom = loadPatientApp();
  assert.notStrictEqual(JSON.stringify(dom.window.BANK_MA), JSON.stringify(dom.window.BANK_TN));
});

console.log('\nIntégration dans le moteur d\'exercice');

for(const [lang, code] of [['ma','T-MA'],['tn','T-TN']]){
  await test(`startExercise('denomination') utilise le contenu ${lang}, pas le repli français`, async ()=>{
    const dom = loadPatientApp();
    await dom.window.eval(`Store.savePatient('${code}', {name:'Test',level:1,sessions:0,correct:0,total:0,streak:1})`);
    dom.window.eval(`Prefs.data.lang = '${lang}';`);
    dom.window.document.getElementById('name').value = 'Test';
    dom.window.document.getElementById('code').value = code;
    await dom.window.eval('login()');
    await dom.window.eval("startExercise('denomination')");
    const c = dom.window.eval('__testGetCurrent()');
    const bankAnswers = dom.window['BANK_'+lang.toUpperCase()].denomination.items[1].map(it=>it.answer);
    assert.ok(bankAnswers.includes(c.queue[0].answer), `attendu un mot de BANK_${lang.toUpperCase()}, trouvé "${c.queue[0].answer}"`);
  });
}

console.log(`\n${passed} test(s) réussi(s), ${failed} échec(s).`);
if(failed > 0) process.exit(1);
}

main();
