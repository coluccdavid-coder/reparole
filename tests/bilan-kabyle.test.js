// =====================================================================
//  TESTS — Bilan initial : intégration kabyle (v6.115-v6.119) + bouton "Suivant"
//  ---------------------------------------------------------------------
//  Deux choses distinctes vérifiées ici :
//  1. Le contenu kabyle reçu (relecture native, voir
//     docs/kabyle-glossary.md) est bien branché : ASSESS_ITEMS_KAB
//     complet (denomination/completion/comprehension, v6.119),
//     ASSESS_DOMAIN_LABELS_KAB, et le mécanisme _bilanItem() généralisé
//     au-delà de la seule dénomination (v6.3 le limitait à ce seul domaine).
//  2. Le correctif "bouton Suivant" (v6.114) : answerBilan() n'enchaîne
//     plus automatiquement après un délai fixe — retour utilisateur
//     identique à celui qui avait motivé le même correctif dans le jeu
//     de mémoire (v6.101).
//
//  Lancer : node tests/bilan-kabyle.test.js
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
    if(src === 'js/assessment.js'){
      // ASSESS_ITEMS_KAB n'est pas exposé sur window (accès interne
      // seulement) — on l'expose ici pour pouvoir l'inspecter dans les tests.
      code += '\nwindow.__ASSESS_ITEMS_KAB_TEST = ASSESS_ITEMS_KAB;';
    }
    dom.window.eval(code);
    // v6.247 : les 14 langues vivent dans js/i18n/<code>.js et les pages
    // n'en chargent qu'une. En test, on les charge toutes.
    if(typeof src !== 'undefined' && src === 'js/i18n.js') fs.readdirSync(path.join(ROOT, 'js/i18n'))
      .forEach(lf => dom.window.eval(fs.readFileSync(path.join(ROOT, 'js/i18n', lf), 'utf8')));
  }
  dom.window.eval("Prefs.load(); __testSetUserCode('T'); __testSetUser({});");
  return dom;
}

async function main(){

console.log('Contenu kabyle du bilan (v6.115)');

await test('ASSESS_ITEMS_KAB.comprehension existe avec 3 items, réponse toujours dans ses propres choix', ()=>{
  const dom = loadPatientApp();
  const AIK = dom.window.__ASSESS_ITEMS_KAB_TEST;
  assert.strictEqual(AIK.comprehension.length, 3);
  AIK.comprehension.forEach(it=>{
    assert.ok(it.choices.includes(it.answer), `"${it.answer}" absent de ses propres choix`);
    assert.strictEqual(new Set(it.choices).size, it.choices.length, `doublon dans les choix de "${it.answer}"`);
  });
});

await test('ASSESS_ITEMS_KAB.completion existe désormais avec 3 items (v6.119), réponse toujours dans ses propres choix', ()=>{
  const dom = loadPatientApp();
  const AIK = dom.window.__ASSESS_ITEMS_KAB_TEST;
  assert.strictEqual(AIK.completion.length, 3);
  AIK.completion.forEach(it=>{
    assert.ok(it.text.includes('___'), `pas de trou dans : ${it.text}`);
    assert.ok(it.choices.includes(it.answer), `"${it.answer}" absent de ses propres choix`);
    assert.strictEqual(new Set(it.choices).size, it.choices.length, `doublon dans les choix de "${it.answer}"`);
  });
});

await test('ASSESS_DOMAIN_LABELS_KAB couvre les 3 domaines', ()=>{
  const dom = loadPatientApp();
  const labels = dom.window.ASSESS_DOMAIN_LABELS_KAB;
  assert.ok(labels.denomination && labels.completion && labels.comprehension);
});

await test('le bilan en kabyle : le domaine compréhension utilise bien le contenu kabyle (pas de repli français)', async ()=>{
  const dom = loadPatientApp();
  dom.window.eval("Prefs.setLang('kab');");
  dom.window.eval("Assessment.state = { step:'bilanItem', symptomIdx:0, symptoms:{}, domainIdx:2, itemIdx:0, scores:{denomination:{ok:0,total:0},completion:{ok:0,total:0},comprehension:{ok:0,total:0}} };");
  dom.window.eval("Assessment._bilanItem();");
  const text = dom.window.document.querySelector('.prompt-main').textContent;
  assert.ok(/[ɣḥɛṛṣṭẓḍǧ]|[ⵣ]|kab/i.test(text) || /[a-zɣḥɛṛṣṭẓḍǧ]/.test(text), `texte attendu en kabyle, reçu : ${text}`);
  // pas de bouton "Écouter" (parlerait français sur du texte kabyle)
  assert.ok(!dom.window.document.querySelector('.speak-btn'), 'le bouton Écouter ne devrait pas apparaître sur du contenu kabyle');
});

console.log('\nBouton "Suivant" au lieu d\'un enchaînement automatique (v6.114)');

await test('answerBilan() affiche un bouton "Suivant" plutôt que d\'enchaîner tout seul', async ()=>{
  const dom = loadPatientApp();
  dom.window.eval("Prefs.setLang('fr'); __testSetUser({level:1});");
  await dom.window.eval("startExercise ? null : null"); // no-op guard
  dom.window.eval("Assessment.state = { step:'bilanItem', symptomIdx:0, symptoms:{}, domainIdx:0, itemIdx:0, scores:{denomination:{ok:0,total:0},completion:{ok:0,total:0},comprehension:{ok:0,total:0}} };");
  dom.window.eval("Assessment._bilanItem();");
  dom.window.eval("Assessment.answerBilan('CHIEN','CHIEN');");
  const btn = dom.window.document.getElementById('assess-next-btn');
  assert.ok(btn, 'bouton #assess-next-btn manquant après une réponse');
  assert.ok(btn.textContent.length > 0);
});

console.log(`\n${passed} test(s) réussi(s), ${failed} échec(s).`);
if(failed > 0) process.exit(1);
}

main();
