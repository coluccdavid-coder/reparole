// =====================================================================
//  TESTS — Le bilan initial n'a plus de trou de traduction (v6.152)
//  ---------------------------------------------------------------------
//  Signalé par l'utilisateur, captures d'écran à l'appui : "Bienvenue",
//  "Avez-vous un bilan ?", "Vos ressentis" s'affichaient en français
//  malgré une interface en darija. VRAI BUG trouvé, plus profond que
//  prévu : ASSESS_STRINGS (l'écran de bilan initial — accueil, dépôt
//  de rapport, résultat) est un objet ENTIÈREMENT SÉPARÉ de
//  I18N_STRINGS, jamais couvert par les vérifications de parité
//  précédentes (v6.145, "538/538"). dz/ma/tn n'y avaient tout
//  simplement aucune entrée, ni SYMPTOM_QUESTIONS_XX/ASSESS_ITEMS_XML
//  associés ; kab avait un socle partiel avec 9 clés connues comme
//  manquantes (documenté depuis longtemps, jamais comblé).
//
//  Lancer : node tests/assessment-i18n-completeness.test.js
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
  const dom = new JSDOM('<!DOCTYPE html><body></body>', { url:'http://localhost/', runScripts:'outside-only' });
  dom.window.eval(fs.readFileSync(path.join(ROOT, 'js/i18n.js'), 'utf8'));
  dom.window.eval(fs.readFileSync(path.join(ROOT, 'js/assessment.js'), 'utf8'));
  return dom;
}

async function main(){

console.log('ASSESS_STRINGS — écran de bilan initial (accueil, dépôt de rapport, résultat)');

await test('v6.152 : VRAI BUG CORRIGÉ — kab/dz/ma/tn ont désormais les 36/36 clés de ASSESS_STRINGS, comme le français', ()=>{
  const dom = loadApp();
  const ASSESS_STRINGS = dom.window.eval('ASSESS_STRINGS');
  const fr = ASSESS_STRINGS.fr;
  ['kab','dz','ma','tn'].forEach(l=>{
    const obj = ASSESS_STRINGS[l];
    assert.ok(obj, `ASSESS_STRINGS.${l} manquant entièrement`);
    const missing = Object.keys(fr).filter(k=>!(k in obj));
    assert.strictEqual(missing.length, 0, `${l} : ${missing.length} clé(s) manquante(s) — ${missing.join(', ')}`);
  });
});

await test('les 2 clés-fonctions (priority_detail, imported_priorities_detail) sont bien des fonctions, pas des chaînes, pour les 4 langues', ()=>{
  const dom = loadApp();
  const ASSESS_STRINGS = dom.window.eval('ASSESS_STRINGS');
  ['kab','dz','ma','tn'].forEach(l=>{
    assert.strictEqual(typeof ASSESS_STRINGS[l].priority_detail, 'function', `${l}.priority_detail`);
    assert.strictEqual(typeof ASSESS_STRINGS[l].imported_priorities_detail, 'function', `${l}.imported_priorities_detail`);
    // vérifie aussi qu'elles s'exécutent sans planter
    assert.ok(ASSESS_STRINGS[l].priority_detail('test').length > 0);
    assert.ok(ASSESS_STRINGS[l].imported_priorities_detail('test').length > 0);
  });
});

console.log('\nSYMPTOM_QUESTIONS — mini-test "Vos ressentis"');

await test('v6.152 : dz/ma/tn ont maintenant SYMPTOM_QUESTIONS_XX (4 questions, comme kab) — n\'existait pas du tout avant', ()=>{
  const dom = loadApp();
  ['DZ','MA','TN'].forEach(l=>{
    const sq = dom.window['SYMPTOM_QUESTIONS_'+l];
    assert.ok(sq, `SYMPTOM_QUESTIONS_${l} manquant`);
    assert.strictEqual(sq.length, 4, `${l} : 4 questions attendues`);
    sq.forEach(q=>{
      assert.ok(q.q && q.q.length > 0, 'question vide');
      assert.strictEqual(q.options.length, 3, 'attendu 3 options de réponse');
    });
  });
});

console.log('\nASSESS_ITEMS — mini-test à choix multiple du bilan');

await test('v6.152 : dz/ma/tn ont maintenant ASSESS_ITEMS_XX (3/3/3, comme les langues complètes)', ()=>{
  const dom = loadApp();
  ['DZ','MA','TN'].forEach(l=>{
    const ai = dom.window['ASSESS_ITEMS_'+l];
    assert.ok(ai, `ASSESS_ITEMS_${l} manquant`);
    ['denomination','completion','comprehension'].forEach(type=>{
      assert.strictEqual(ai[type].length, 3, `${l}.${type}`);
      ai[type].forEach(it=>{
        assert.ok(it.choices.includes(it.answer), `${l}.${type} : "${it.answer}" absent de ses propres choix`);
        assert.strictEqual(new Set(it.choices).size, it.choices.length, `${l}.${type} : doublon dans les choix`);
      });
    });
  });
});

await test('v6.152 : dz/ma/tn ont ASSESS_DOMAIN_LABELS_XX (3 domaines)', ()=>{
  const dom = loadApp();
  ['DZ','MA','TN'].forEach(l=>{
    const adl = dom.window['ASSESS_DOMAIN_LABELS_'+l];
    assert.ok(adl, `ASSESS_DOMAIN_LABELS_${l} manquant`);
    ['denomination','completion','comprehension'].forEach(k=>{
      assert.ok(adl[k] && adl[k].length > 0, `${l}.${k} vide`);
    });
  });
});

console.log(`\n${passed} test(s) réussi(s), ${failed} échec(s).`);
if(failed > 0) process.exit(1);
}

main();
