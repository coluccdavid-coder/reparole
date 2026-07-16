// =====================================================================
//  TESTS — "Lire et comprendre" en darija dz/ma/tn (v6.161)
//  ---------------------------------------------------------------------
//  Demandé après une discussion sur les risques réels par exercice :
//  l'utilisateur a validé une approche différenciée — "Lire et
//  comprendre" construit pour dz/ma/tn (confiance raisonnable, même
//  méthode que le reste du contenu darija de ce projet), mais PAS pour
//  le kabyle (confiance plus limitée pour cette langue précise — le
//  berbère, pas un dialecte arabe) et PAS "Structure de phrase" pour
//  aucune des 4 langues (construire des erreurs grammaticales
//  plausibles demande un niveau de maîtrise que je ne peux pas
//  garantir pour ces dialectes).
//
//  ⚠️ BROUILLON — même statut que le reste du contenu dz/ma/tn de
//  ReParole : jamais relu par un∙e locuteur∙rice natif∙ve. À faire
//  vérifier avant tout usage clinique réel.
//
//  Lancer : node tests/story-darija.test.js
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

function loadApp(){
  const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  const dom = new JSDOM(html, { url:'http://localhost/', runScripts:'outside-only', resources:'usable', pretendToBeVisual:true });
  const scripts = [...dom.window.document.querySelectorAll('script[src]')].map(s=>s.getAttribute('src'));
  for(const src of scripts){
    let code = fs.readFileSync(path.join(ROOT, src), 'utf8');
    if(src === 'js/storage.js'){
      code = code.replace(/const SUPABASE_URL = "[^"]*";/, 'const SUPABASE_URL = "";')
                  .replace(/const SUPABASE_ANON_KEY = "[^"]*";/, 'const SUPABASE_ANON_KEY = "";');
    }
    if(src === 'js/app.js'){ code += `\n        window.Store = Store;\n      `; }
    dom.window.eval(code);
  }
  dom.window.eval("Prefs.load();");
  return dom;
}

async function main(){

console.log('Contenu — intégrité');

await test('BANK_DZ/MA/TN.story existent, 6/6/6 items chacun (54 au total)', ()=>{
  const dom = loadApp();
  ['DZ','MA','TN'].forEach(lang=>{
    const bank = dom.window['BANK_'+lang];
    assert.ok(bank.story, `BANK_${lang}.story manquant`);
    [1,2,3].forEach(lvl=>{
      assert.strictEqual(bank.story.items[lvl].length, 6, `${lang} niveau ${lvl}`);
    });
  });
});

await test('BANK_KAB.story n\'existe toujours pas (décision volontaire, pas un oubli)', ()=>{
  const dom = loadApp();
  assert.ok(!dom.window.BANK_KAB.story, 'BANK_KAB.story ne devrait pas exister');
});

await test('chaque item a sa bonne réponse dans ses propres choix, sans doublon (54 items vérifiés)', ()=>{
  const dom = loadApp();
  let checked = 0;
  ['DZ','MA','TN'].forEach(lang=>{
    const bank = dom.window['BANK_'+lang];
    [1,2,3].forEach(lvl=>{
      bank.story.items[lvl].forEach(it=>{
        assert.ok(it.choices.includes(it.answer), `${lang} niveau ${lvl} : "${it.answer}" absent de ses propres choix`);
        assert.strictEqual(new Set(it.choices).size, it.choices.length, `${lang} niveau ${lvl} : doublon`);
        assert.ok(it.text.includes('\n\n'), `${lang} niveau ${lvl} : le texte devrait séparer le récit de la question par une ligne vide`);
        checked++;
      });
    });
  });
  assert.strictEqual(checked, 54); // 3 langues × 3 niveaux × 6 items
});

console.log('\nIntégration dans le tableau de bord et le moteur d\'exercice');

await test('"story" n\'est plus masqué pour dz/ma/tn, reste masqué pour kab', ()=>{
  const dom = loadApp();
  ['dz','ma','tn'].forEach(lang=>{
    dom.window.eval(`Prefs.setLang('${lang}')`);
    const tile = dom.window.document.querySelector('.ex-item[data-type="story"]');
    assert.notStrictEqual(tile.style.display, 'none', `story devrait être visible en ${lang}`);
  });
  dom.window.eval("Prefs.setLang('kab')");
  const tileKab = dom.window.document.querySelector('.ex-item[data-type="story"]');
  assert.strictEqual(tileKab.style.display, 'none', 'story devrait rester masqué en kab');
});

await test('startExercise(\'story\') utilise du vrai contenu darija pour dz/ma/tn, pas un repli sur le français', async ()=>{
  const dom = loadApp();
  await dom.window.eval(`Store.savePatient('STORYDZ', {name:'Test',level:1,sessions:0,correct:0,total:0,streak:1})`);
  dom.window.document.getElementById('name').value = 'Test';
  dom.window.document.getElementById('code').value = 'STORYDZ';
  await dom.window.eval('login()');
  for(const lang of ['dz','ma','tn']){
    dom.window.eval(`Prefs.setLang('${lang}')`);
    await dom.window.eval("startExercise('story')");
    const promptEl = dom.window.document.querySelector('.prompt-text');
    assert.ok(promptEl, `écran d'exercice introuvable pour ${lang}`);
    // vérifie la présence de caractères arabes (dz/ma/tn utilisent tous l'écriture arabe)
    assert.ok(/[\u0600-\u06FF]/.test(promptEl.textContent), `${lang} : le texte devrait être en écriture arabe, pas en français`);
  }
});

console.log(`\n${passed} test(s) réussi(s), ${failed} échec(s).`);
if(failed > 0) process.exit(1);
}

main();
