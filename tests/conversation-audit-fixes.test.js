// =====================================================================
//  TESTS — Trous trouvés lors de l'audit complet (v6.165) :
//  conversation guidée absente de l'extraction voix, et CONV_SCENARIOS_JA
//  manquant entièrement
//  ---------------------------------------------------------------------
//  Demandé explicitement : "fait un audite complet sans rien oublié au
//  passage, traduction, traduction.... tout le reste". Deux trous
//  trouvés en vérifiant systématiquement chaque mécanisme de repli
//  par langue plutôt que de se fier aux vérifications déjà faites :
//
//  1. scripts/extract-voice-content.js ne couvrait pas le bouton
//     "réécouter" de la conversation guidée (speak(step.ai)) — même
//     trou que l'acalculie avant sa correction en v6.164, jamais
//     repéré parce que personne n'avait pensé à vérifier CE mécanisme
//     précis.
//  2. CONV_SCENARIOS_JA n'existait pas du tout — le japonais était la
//     seule langue complète sans conversation guidée, repliant sur le
//     français (heureusement déjà signalé par un bandeau existant,
//     pas un mélange totalement silencieux).
//
//  ⚠️ Le contenu japonais est un brouillon de ma part, comme le reste
//  du contenu multilingue de ReParole — à faire vérifier par un∙e
//  locuteur∙rice natif∙ve avant tout usage clinique réel.
//
//  Lancer : node tests/conversation-audit-fixes.test.js
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
  dom.window.eval(fs.readFileSync(path.join(ROOT, 'js/conversation.js'), 'utf8'));
  return dom;
}

async function main(){

console.log('CONV_SCENARIOS_JA — contenu manquant comblé');

await test('v6.165 : CONV_SCENARIOS_JA existe désormais, avec les 3 mêmes scénarios que les autres langues complètes', ()=>{
  const dom = loadApp();
  const ja = dom.window.CONV_SCENARIOS_JA;
  assert.ok(ja, 'CONV_SCENARIOS_JA devrait exister');
  ['medecin','cafe','telephone'].forEach(key=>{
    assert.ok(ja[key], `scénario "${key}" manquant`);
    assert.strictEqual(ja[key].steps.length, 4, `${key} devrait avoir 4 étapes`);
  });
});

await test('chaque étape japonaise a un texte "ai" non vide et au moins 2 choix', ()=>{
  const dom = loadApp();
  const ja = dom.window.CONV_SCENARIOS_JA;
  Object.entries(ja).forEach(([key, scenario])=>{
    scenario.steps.forEach((step, i)=>{
      assert.ok(step.ai && step.ai.length > 0, `${key} étape ${i} : "ai" vide`);
      assert.ok(step.choices && step.choices.length >= 2, `${key} étape ${i} : moins de 2 choix`);
      assert.ok(/[\u3040-\u30FF\u4E00-\u9FFF]/.test(step.ai), `${key} étape ${i} : "ai" ne semble pas être en japonais`);
    });
  });
});

await test('getConvScenarios(\'ja\') renvoie maintenant du vrai japonais, plus un repli sur le français', ()=>{
  const dom = loadApp();
  const scenarios = dom.window.eval("window['CONV_SCENARIOS_'+'ja'.toUpperCase()] || CONV_SCENARIOS");
  assert.strictEqual(scenarios.medecin.title, '病院で', 'devrait être le titre japonais, pas "Chez le médecin"');
});

console.log('\nExtraction voix — conversation guidée désormais couverte (v6.165)');

await test('scripts/extract-voice-content.js couvre maintenant CONV_SCENARIOS (recherche textuelle du bloc)', ()=>{
  const scriptCode = fs.readFileSync(path.join(ROOT, 'scripts/extract-voice-content.js'), 'utf8');
  assert.ok(/CONV_SCENARIOS/.test(scriptCode), 'le script devrait référencer CONV_SCENARIOS quelque part');
  assert.ok(/step\.ai/.test(scriptCode), 'le script devrait extraire le champ "ai" de chaque étape');
});

await test('le manifeste régénéré contient bien du texte de conversation en français ET en japonais (pas de repli silencieux)', ()=>{
  const manifestPath = path.join(ROOT, 'scripts/voice-manifest.json');
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  assert.ok(manifest.fr.includes("Bonjour ! Qu'est-ce qui vous amène aujourd'hui ?"), 'texte de conversation français attendu dans le manifeste');
  assert.ok(manifest.ja.includes('こんにちは！今日はどうされましたか？'), 'texte de conversation japonais attendu dans le manifeste — pas un repli sur le français');
});

console.log(`\n${passed} test(s) réussi(s), ${failed} échec(s).`);
if(failed > 0) process.exit(1);
}

main();
