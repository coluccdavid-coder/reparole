// =====================================================================
//  TESTS — "Lire et comprendre" (v6.143, point 7 de la demande
//  d'amélioration)
//  ---------------------------------------------------------------------
//  Contrairement à "structure de phrase" (v6.133 → complété en v6.138
//  seulement), traductions ET aide vérifiées dès cette version —
//  signalé par l'utilisateur : ces deux points doivent être complets
//  dès l'ajout d'une fonctionnalité, pas rattrapés après coup.
//
//  Lancer : node tests/story-exercise.test.js
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
      code += `window.Store = Store; window.__testGetCurrent = function(){ return current; };`;
    }
    dom.window.eval(code);
  }
  dom.window.eval("Prefs.load();");
  return dom;
}

async function main(){

console.log('Intégrité du contenu (js/exercises-story.js + exercises-story-i18n.js)');

await test('BANK.story existe (fr) avec 6/6/6 items par niveau', ()=>{
  const dom = loadPatientApp();
  const B = dom.window.BANK;
  assert.ok(B.story, 'BANK.story manquant');
  [1,2,3].forEach(lvl=>{
    assert.strictEqual(B.story.items[lvl].length, 6, `niveau ${lvl}`);
  });
});

await test('les 9 langues complètes ont BANK_XX.story avec 6/6/6 items (parité avec le français)', ()=>{
  const dom = loadPatientApp();
  ['EN','ES','IT','PT','DE','AR','TR','PL','JA'].forEach(lang=>{
    const bk = dom.window['BANK_'+lang];
    assert.ok(bk && bk.story, `BANK_${lang}.story manquant`);
    [1,2,3].forEach(lvl=>{
      assert.strictEqual(bk.story.items[lvl].length, 6, `${lang} niveau ${lvl}`);
    });
  });
});

await test('chaque item : texte + question séparés par un saut de ligne, bonne réponse dans ses propres choix, sans doublon', ()=>{
  const dom = loadPatientApp();
  let checked = 0;
  const banks = { FR: dom.window.BANK };
  ['EN','ES','IT','PT','DE','AR','TR','PL','JA'].forEach(l=>{ banks[l] = dom.window['BANK_'+l]; });
  Object.entries(banks).forEach(([label, bk])=>{
    [1,2,3].forEach(lvl=>{
      bk.story.items[lvl].forEach(it=>{
        assert.ok(it.text.includes('\n\n'), `${label} niveau ${lvl} : pas de séparateur texte/question`);
        assert.ok(it.choices.includes(it.answer), `${label} niveau ${lvl} : "${it.answer}" absent de ses propres choix`);
        assert.strictEqual(new Set(it.choices).size, it.choices.length, `${label} niveau ${lvl} : doublon dans les choix`);
        checked++;
      });
    });
  });
  assert.strictEqual(checked, 10 * 18); // 10 langues (fr + 9) x 18 items (6x3)
});

console.log('\nIntégration dans le moteur d\'exercice');

await test('startExercise(\'story\') fonctionne et sépare visuellement le texte de la question', async ()=>{
  const dom = loadPatientApp();
  await dom.window.eval("Store.savePatient('T1', {name:'Test',level:1,sessions:0,correct:0,total:0,streak:1})");
  dom.window.document.getElementById('name').value = 'Test';
  dom.window.document.getElementById('code').value = 'T1';
  await dom.window.eval('login()');
  await dom.window.eval("startExercise('story')");
  const c = dom.window.eval('__testGetCurrent()');
  assert.strictEqual(c.type, 'story');
  assert.ok(c.total > 0);
  const body = dom.window.document.getElementById('ex-body');
  assert.ok(body.innerHTML.includes('prompt-text'), 'le texte du récit devrait être affiché séparément');
});

await test('la tuile "Lire et comprendre" existe sur le tableau de bord', ()=>{
  const dom = loadPatientApp();
  assert.ok(dom.window.document.querySelector('[data-type="story"]'));
});

console.log('\nAide contextuelle (Companion.explain) — vérifiée dès cette version, pas rattrapée après coup');

await test('showExerciseHelp() fonctionne pour "story" (fr)', async ()=>{
  const dom = loadPatientApp();
  await dom.window.eval("Store.savePatient('T2', {name:'Test',level:1,sessions:0,correct:0,total:0,streak:1})");
  dom.window.document.getElementById('name').value = 'Test';
  dom.window.document.getElementById('code').value = 'T2';
  await dom.window.eval('login()');
  await dom.window.eval("startExercise('story')");
  dom.window.eval('showExerciseHelp()');
  const bubble = dom.window.document.querySelector('#companion-exercise .companion-bubble');
  assert.ok(bubble && bubble.textContent.length > 0, 'la bulle d\'aide devrait afficher un texte pour "story"');
});

await test('COMPANION_PHRASES.explain.story existe dans les 10 langues complètes + dz/ma/tn', ()=>{
  const dom = loadPatientApp();
  ['fr','en','es','it','pt','de','ar','tr','pl','ja','dz','ma','tn'].forEach(lang=>{
    const ex = dom.window.COMPANION_PHRASES[lang].explain;
    assert.ok(ex && ex.story && ex.story.length > 0, `COMPANION_PHRASES.${lang}.explain.story manquant ou vide`);
  });
});

console.log(`\n${passed} test(s) réussi(s), ${failed} échec(s).`);
if(failed > 0) process.exit(1);
}

main();
