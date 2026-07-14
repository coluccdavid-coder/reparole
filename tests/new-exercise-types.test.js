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

console.log(`\n${passed} test(s) réussi(s), ${failed} échec(s).`);
if(failed > 0) process.exit(1);
}

main();
