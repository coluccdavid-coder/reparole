// =====================================================================
//  TESTS — Nouveaux types d'exercices : association + structure de
//  phrase (v6.133, points 4 et 5 de la demande d'amélioration)
//  ---------------------------------------------------------------------
//  Lancer : node tests/new-exercise-types.test.js
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
  }
  dom.window.eval("Prefs.load();");
  return dom;
}

async function main(){

console.log('Intégrité du contenu (js/exercises-new-types.js)');

await test('BANK.association et BANK.syntax existent avec 8/8/8 items par niveau', ()=>{
  const dom = loadPatientApp();
  const B = dom.window.BANK;
  assert.ok(B.association, 'BANK.association manquant');
  assert.ok(B.syntax, 'BANK.syntax manquant');
  [1,2,3].forEach(lvl=>{
    assert.strictEqual(B.association.items[lvl].length, 8, `association niveau ${lvl}`);
    assert.strictEqual(B.syntax.items[lvl].length, 8, `syntax niveau ${lvl}`);
  });
});

await test('chaque item : la bonne réponse figure dans ses propres choix, sans doublon', ()=>{
  const dom = loadPatientApp();
  const B = dom.window.BANK;
  let checked = 0;
  ['association','syntax'].forEach(type=>{
    [1,2,3].forEach(lvl=>{
      B[type].items[lvl].forEach(it=>{
        assert.ok(it.choices.includes(it.answer), `${type} niveau ${lvl} : "${it.answer}" absent de ses propres choix`);
        assert.strictEqual(new Set(it.choices).size, it.choices.length, `${type} niveau ${lvl} : doublon dans les choix de "${it.answer}"`);
        checked++;
      });
    });
  });
  assert.strictEqual(checked, 48); // 8 x 3 niveaux x 2 types
});

console.log('\nIntégration dans le moteur d\'exercice (js/app.js)');

await test('startExercise(\'association\') fonctionne comme les autres types de choix multiple', async ()=>{
  const dom = loadPatientApp();
  await dom.window.eval("Store.savePatient('T1', {name:'Test',level:1,sessions:0,correct:0,total:0,streak:1})");
  dom.window.document.getElementById('name').value = 'Test';
  dom.window.document.getElementById('code').value = 'T1';
  await dom.window.eval('login()');
  await dom.window.eval("startExercise('association')");
  const c = dom.window.eval('__testGetCurrent()');
  assert.strictEqual(c.type, 'association');
  assert.ok(c.total > 0);
  const choiceButtons = dom.window.document.querySelectorAll('.choice');
  assert.ok(choiceButtons.length >= 2, 'devrait afficher des boutons de choix (émojis)');
});

await test('startExercise(\'syntax\') fonctionne comme les autres types de choix multiple', async ()=>{
  const dom = loadPatientApp();
  await dom.window.eval("Store.savePatient('T2', {name:'Test',level:1,sessions:0,correct:0,total:0,streak:1})");
  dom.window.document.getElementById('name').value = 'Test';
  dom.window.document.getElementById('code').value = 'T2';
  await dom.window.eval('login()');
  await dom.window.eval("startExercise('syntax')");
  const c = dom.window.eval('__testGetCurrent()');
  assert.strictEqual(c.type, 'syntax');
  assert.ok(c.total > 0);
  const bodyText = dom.window.document.getElementById('ex-body').textContent;
  assert.ok(bodyText.length > 0);
});

await test('les 2 nouvelles tuiles existent sur le tableau de bord', ()=>{
  const dom = loadPatientApp();
  assert.ok(dom.window.document.querySelector('[data-type="association"]'));
  assert.ok(dom.window.document.querySelector('[data-type="syntax"]'));
});

console.log('\nTraductions par langue (js/exercises-syntax-i18n.js, v6.138)');

await test('les 9 langues complètes ont BANK_XX.syntax avec 8/8/8 items (parité avec le français)', ()=>{
  const dom = loadPatientApp();
  ['EN','ES','IT','PT','DE','PL','TR','AR','JA'].forEach(lang=>{
    const bk = dom.window['BANK_'+lang];
    assert.ok(bk && bk.syntax, `BANK_${lang}.syntax manquant`);
    [1,2,3].forEach(lvl=>{
      assert.strictEqual(bk.syntax.items[lvl].length, 8, `BANK_${lang}.syntax niveau ${lvl}`);
    });
  });
});

await test('contenu traduit : chaque item a sa bonne réponse dans ses propres choix, sans doublon', ()=>{
  const dom = loadPatientApp();
  let checked = 0;
  ['EN','ES','IT','PT','DE','PL','TR','AR','JA'].forEach(lang=>{
    const bk = dom.window['BANK_'+lang];
    [1,2,3].forEach(lvl=>{
      bk.syntax.items[lvl].forEach(it=>{
        assert.ok(it.choices.includes(it.answer), `${lang} niveau ${lvl} : "${it.answer}" absent de ses propres choix`);
        assert.strictEqual(new Set(it.choices).size, it.choices.length, `${lang} niveau ${lvl} : doublon dans les choix de "${it.answer}"`);
        checked++;
      });
    });
  });
  assert.strictEqual(checked, 9 * 24); // 9 langues x 24 items (8x3)
});

console.log('\nAide contextuelle (Companion.explain) — signalé comme non fonctionnel');

await test('showExerciseHelp() fonctionne pour "association" (fr)', async ()=>{
  const dom = loadPatientApp();
  await dom.window.eval("Store.savePatient('T3', {name:'Test',level:1,sessions:0,correct:0,total:0,streak:1})");
  dom.window.document.getElementById('name').value = 'Test';
  dom.window.document.getElementById('code').value = 'T3';
  await dom.window.eval('login()');
  await dom.window.eval("startExercise('association')");
  dom.window.eval('showExerciseHelp()');
  const bubble = dom.window.document.querySelector('#companion-exercise .companion-bubble');
  assert.ok(bubble && bubble.textContent.length > 0, 'la bulle d\'aide devrait afficher un texte pour "association"');
});

await test('showExerciseHelp() fonctionne pour "syntax" (fr)', async ()=>{
  const dom = loadPatientApp();
  await dom.window.eval("Store.savePatient('T4', {name:'Test',level:1,sessions:0,correct:0,total:0,streak:1})");
  dom.window.document.getElementById('name').value = 'Test';
  dom.window.document.getElementById('code').value = 'T4';
  await dom.window.eval('login()');
  await dom.window.eval("startExercise('syntax')");
  dom.window.eval('showExerciseHelp()');
  const bubble = dom.window.document.querySelector('#companion-exercise .companion-bubble');
  assert.ok(bubble && bubble.textContent.length > 0, 'la bulle d\'aide devrait afficher un texte pour "syntax"');
});

await test('COMPANION_PHRASES : "association" et "syntax" présents dans les 9 langues complètes + dz/ma/tn', ()=>{
  const dom = loadPatientApp();
  ['fr','en','es','it','pt','de','ar','tr','pl','ja','dz','ma','tn'].forEach(lang=>{
    const ex = dom.window.COMPANION_PHRASES[lang].explain;
    assert.ok(ex && ex.association, `COMPANION_PHRASES.${lang}.explain.association manquant`);
    assert.ok(ex && ex.syntax, `COMPANION_PHRASES.${lang}.explain.syntax manquant`);
  });
});

console.log('\nMots sous les émojis (v6.140) — signalé : une abeille peut être ambiguë');

await test('EMOJI_LABEL_KEYS couvre bien tous les émojis utilisés dans BANK.association', ()=>{
  const dom = loadPatientApp();
  const B = dom.window.BANK;
  const map = dom.window.EMOJI_LABEL_KEYS;
  assert.ok(map, 'EMOJI_LABEL_KEYS devrait exister');
  const missing = new Set();
  [1,2,3].forEach(lvl=>{
    B.association.items[lvl].forEach(it=>{
      if(!map[it.text]) missing.add(it.text);
      it.choices.forEach(ch=>{ if(!map[ch]) missing.add(ch); });
    });
  });
  assert.strictEqual(missing.size, 0, `émojis sans étiquette : ${[...missing].join(' ')}`);
});

await test('chaque clé d\'étiquette existe dans les 10 langues complètes (aucune ne retombe silencieusement)', ()=>{
  const dom = loadPatientApp();
  const map = dom.window.EMOJI_LABEL_KEYS;
  const S = dom.window.I18N_STRINGS;
  const langs = ['fr','en','es','it','pt','de','ar','tr','pl','ja'];
  const keys = [...new Set(Object.values(map))];
  assert.ok(keys.length >= 58, `attendu au moins 58 clés d'étiquette, trouvé ${keys.length}`);
  langs.forEach(l=>{
    keys.forEach(k=>{
      assert.ok(S[l][k] && S[l][k].length > 0, `${l}.${k} manquant ou vide`);
    });
  });
});

await test('emojiLabel() renvoie le bon mot dans la langue active, vide pour un émoji inconnu', async ()=>{
  const dom = loadPatientApp();
  await dom.window.eval("Store.savePatient('T5', {name:'Test',level:1,sessions:0,correct:0,total:0,streak:1})");
  dom.window.document.getElementById('name').value = 'Test';
  dom.window.document.getElementById('code').value = 'T5';
  await dom.window.eval('login()');
  assert.strictEqual(dom.window.eval("emojiLabel('🐝')"), 'Abeille');
  assert.strictEqual(dom.window.eval("emojiLabel('🚀')"), ''); // pas utilisé dans association, pas d'étiquette prévue
});

await test('startExercise(\'association\') affiche le mot sous l\'émoji de la consigne et de chaque choix', async ()=>{
  const dom = loadPatientApp();
  await dom.window.eval("Store.savePatient('T6', {name:'Test',level:3,sessions:0,correct:0,total:0,streak:1})");
  dom.window.document.getElementById('name').value = 'Test';
  dom.window.document.getElementById('code').value = 'T6';
  await dom.window.eval('login()');
  await dom.window.eval("startExercise('association')");
  const body = dom.window.document.getElementById('ex-body');
  assert.ok(body.querySelector('.emoji-label'), 'le mot sous la consigne devrait être présent');
  const choiceLabels = body.querySelectorAll('.emoji-choice-label');
  assert.strictEqual(choiceLabels.length, 3, 'les 3 choix devraient chacun avoir leur mot');
  choiceLabels.forEach(el=>{ assert.ok(el.textContent.length > 0, 'le mot ne devrait pas être vide'); });
});

console.log(`\n${passed} test(s) réussi(s), ${failed} échec(s).`);
if(failed > 0) process.exit(1);
}

main();
