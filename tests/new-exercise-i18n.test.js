// =====================================================================
//  TESTS — Traductions des nouveaux exercices (v6.138)
//  ---------------------------------------------------------------------
//  Signalé par l'utilisateur : le bouton d'aide ne fonctionnait pas
//  pour les 2 exercices ajoutés en v6.133 (association, syntax) — vrai
//  bug (COMPANION_PHRASES.explain n'avait ces clés pour AUCUNE langue,
//  pas même le français), corrigé. Le contenu de "structure de phrase"
//  n'existait d'abord qu'en français, puis traduit à moitié (4/8
//  phrases par niveau) dans un premier passage — complété ici à 8/8
//  (parité avec le français), plus le japonais qui manquait entièrement.
//
//  Lancer : node tests/new-exercise-i18n.test.js
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

async function main(){

console.log('Bouton d\'aide — explain.association / explain.syntax');

const COMPLETE_LANGS = ['fr','en','es','it','pt','de','ar','tr','pl','ja'];

await test('les 10 langues complètes ont explain.association et explain.syntax (non vides)', ()=>{
  const dom = loadPatientApp();
  const P = dom.window.COMPANION_PHRASES;
  COMPLETE_LANGS.forEach(l=>{
    assert.ok(P[l].explain.association && P[l].explain.association.length > 0, `${l}.explain.association manquant ou vide`);
    assert.ok(P[l].explain.syntax && P[l].explain.syntax.length > 0, `${l}.explain.syntax manquant ou vide`);
  });
});

await test('dz/ma/tn ont aussi explain.association et explain.syntax', ()=>{
  const dom = loadPatientApp();
  const P = dom.window.COMPANION_PHRASES;
  ['dz','ma','tn'].forEach(l=>{
    assert.ok(P[l].explain.association && P[l].explain.association.length > 0, `${l}.explain.association manquant`);
    assert.ok(P[l].explain.syntax && P[l].explain.syntax.length > 0, `${l}.explain.syntax manquant`);
  });
});

await test('Companion.pickExplain(\'association\') ne renvoie jamais une chaîne vide pour les langues complètes', ()=>{
  const dom = loadPatientApp();
  COMPLETE_LANGS.forEach(l=>{
    dom.window.eval(`Prefs.data.lang = '${l}';`);
    const msg = dom.window.eval("Companion.pickExplain('association')");
    assert.ok(msg && msg.length > 0, `vide pour ${l}`);
    const msg2 = dom.window.eval("Companion.pickExplain('syntax')");
    assert.ok(msg2 && msg2.length > 0, `vide pour ${l} (syntax)`);
  });
});

console.log('\nLabels d\'interface (ex_association_t/d, ex_syntax_t/d)');

await test('dz/ma/tn ont maintenant les labels des 2 nouveaux exercices (comblé, v6.138)', ()=>{
  const dom = loadPatientApp();
  const S = dom.window.I18N_STRINGS;
  ['dz','ma','tn'].forEach(l=>{
    assert.ok(S[l].ex_association_t, `${l}.ex_association_t manquant`);
    assert.ok(S[l].ex_syntax_t, `${l}.ex_syntax_t manquant`);
  });
});

await test('dz, ma et tn restent synchronisés (même ensemble de clés entre eux)', ()=>{
  const dom = loadPatientApp();
  const S = dom.window.I18N_STRINGS;
  const dzKeys = Object.keys(S.dz).sort();
  const maKeys = Object.keys(S.ma).sort();
  const tnKeys = Object.keys(S.tn).sort();
  assert.deepStrictEqual(dzKeys, maKeys);
  assert.deepStrictEqual(dzKeys, tnKeys);
});

console.log('\nContenu de l\'exercice "structure de phrase" par langue (js/exercises-syntax-i18n.js)');

const CONTENT_LANGS = ['en','es','it','pt','de','ar','tr','pl'];

await test('les 8 langues ont BANK_XX.syntax avec 8 items par niveau (v6.138 : complété, était 4)', ()=>{
  const dom = loadPatientApp();
  CONTENT_LANGS.forEach(l=>{
    const bank = dom.window['BANK_'+l.toUpperCase()];
    assert.ok(bank && bank.syntax, `BANK_${l.toUpperCase()}.syntax manquant`);
    [1,2,3].forEach(lvl=>{
      assert.strictEqual(bank.syntax.items[lvl].length, 8, `${l} niveau ${lvl}`);
    });
  });
});

await test('chaque item : la bonne réponse figure dans ses propres choix, sans doublon', ()=>{
  const dom = loadPatientApp();
  let checked = 0;
  CONTENT_LANGS.forEach(l=>{
    const bank = dom.window['BANK_'+l.toUpperCase()];
    [1,2,3].forEach(lvl=>{
      bank.syntax.items[lvl].forEach(it=>{
        assert.ok(it.choices.includes(it.answer), `${l} niveau ${lvl} : "${it.answer}" absent de ses propres choix`);
        assert.strictEqual(new Set(it.choices).size, it.choices.length, `${l} niveau ${lvl} : doublon dans les choix`);
        checked++;
      });
    });
  });
  assert.strictEqual(checked, 192); // 8 langues x 3 niveaux x 8 items
});

await test('le japonais a aussi BANK_JA.syntax avec 8 items par niveau (v6.138 : manquait entièrement)', ()=>{
  const dom = loadPatientApp();
  const bank = dom.window.BANK_JA;
  assert.ok(bank && bank.syntax, 'BANK_JA.syntax manquant');
  [1,2,3].forEach(lvl=>{
    assert.strictEqual(bank.syntax.items[lvl].length, 8, `ja niveau ${lvl}`);
    bank.syntax.items[lvl].forEach(it=>{
      assert.ok(it.choices.includes(it.answer), `ja niveau ${lvl} : "${it.answer}" absent de ses propres choix`);
      assert.strictEqual(new Set(it.choices).size, it.choices.length, `ja niveau ${lvl} : doublon`);
    });
  });
});

await test('startExercise(\'syntax\') utilise le contenu de la langue active, pas le français', async ()=>{
  const dom = loadPatientApp();
  const codeInject = fs.readFileSync(path.join(ROOT, 'js/app.js'), 'utf8') + `
    window.Store = Store;
    window.__testGetCurrent = function(){ return current; };
  `;
  dom.window.eval(codeInject);
  dom.window.eval("Prefs.data.lang = 'es';");
  await dom.window.eval("Store.savePatient('T1', {name:'Test',level:1,sessions:0,correct:0,total:0,streak:1})");
  dom.window.document.getElementById('name').value = 'Test';
  dom.window.document.getElementById('code').value = 'T1';
  await dom.window.eval('login()');
  await dom.window.eval("startExercise('syntax')");
  const c = dom.window.eval('__testGetCurrent()');
  const spanishSentences = ['El gato duerme.','Como una manzana.','Hoy hace sol.','Ella lee un libro.'];
  assert.ok(spanishSentences.includes(c.queue[0].answer), `attendu une phrase espagnole, trouvé "${c.queue[0].answer}"`);
});

console.log(`\n${passed} test(s) réussi(s), ${failed} échec(s).`);
if(failed > 0) process.exit(1);
}

main();
