// =====================================================================
//  TESTS — scripts/extract-voice-content.js couvre bien tous les types
//  d'exercice à contenu textuel simple (v6.164)
//  ---------------------------------------------------------------------
//  VRAI BUG CORRIGÉ, signalé par l'utilisateur ("j'entends une série de
//  code" sur "Estimer un prix" en japonais) : SIMPLE_TYPES dans le
//  script d'extraction des voix était figée depuis sa création (v6.150)
//  et n'avait jamais été mise à jour avec les 5 types d'acalculie
//  ajoutés depuis (v6.156+) — leur contenu n'a donc jamais été envoyé
//  à Google, malgré deux générations de voix déjà faites par
//  l'utilisateur. Ce test verrouille la couverture pour empêcher un
//  nouveau type d'exercice de se retrouver dans la même situation à
//  l'avenir sans qu'on s'en aperçoive.
//
//  Lancer : node tests/voice-extraction-coverage.test.js
// =====================================================================

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const { JSDOM } = require('jsdom');

const ROOT = path.join(__dirname, '..');
let passed = 0, failed = 0;
async function test(name, fn){
  try{ await fn(); console.log('  ✔', name); passed++; }
  catch(e){ console.log('  ✘', name, '—', e.message); failed++; }
}

async function main(){

const scriptCode = fs.readFileSync(path.join(ROOT, 'scripts/extract-voice-content.js'), 'utf8');
const m = scriptCode.match(/const SIMPLE_TYPES = \[([^\]]+)\]/);
const SIMPLE_TYPES = m ? m[1].split(',').map(s => s.trim().replace(/'/g, '')) : [];

// types à texte simple (choix multiple, pas de logique spéciale de
// consigne) qui DOIVENT être couverts par l'extraction de voix —
// à l'exclusion des types gérés séparément dans le script
// (repetition/intonation/fluence) ou volontairement exclus
// (photos_perso : dynamique par patient ; memory : pas de voix).
const EXPECTED_COVERED = [
  'denomination','completion','comprehension','association','syntax','story',
  'heure','monnaie','calcul_quotidien','comparaison_nombres','prix',
];

await test('v6.164 : SIMPLE_TYPES couvre bien les 5 types d\'acalculie (heure/monnaie/calcul_quotidien/comparaison_nombres/prix)', ()=>{
  ['heure','monnaie','calcul_quotidien','comparaison_nombres','prix'].forEach(type=>{
    assert.ok(SIMPLE_TYPES.includes(type), `${type} manquant de SIMPLE_TYPES — son contenu ne sera jamais envoyé à Google pour la génération de voix`);
  });
});

await test('SIMPLE_TYPES couvre bien tous les types de contenu textuel simple attendus, aucun oubli', ()=>{
  EXPECTED_COVERED.forEach(type=>{
    assert.ok(SIMPLE_TYPES.includes(type), `${type} manquant de SIMPLE_TYPES`);
  });
});

await test('chaque type de BANK (base française) avec un contenu textuel simple est bien dans SIMPLE_TYPES, sauf exclusions documentées', ()=>{
  const dom = new JSDOM('<!DOCTYPE html><body></body>', { url:'http://localhost/', runScripts:'outside-only' });
  ['js/i18n.js','js/exercises.js','js/exercises-new-types.js','js/exercises-acalculie.js','js/exercises-story.js'].forEach(f=>{
    dom.window.eval(fs.readFileSync(path.join(ROOT, f), 'utf8'));
  });
  const bank = dom.window.BANK;
  // types volontairement gérés ailleurs dans le script ou exclus
  const HANDLED_ELSEWHERE = ['repetition','intonation','fluence','denomination_orale','rhyme','photos_perso','memory','conversation'];
  Object.keys(bank).forEach(type=>{
    if(HANDLED_ELSEWHERE.includes(type)) return;
    assert.ok(SIMPLE_TYPES.includes(type), `"${type}" existe dans BANK mais n'est ni dans SIMPLE_TYPES ni dans la liste des exclusions documentées — son contenu parlé risque de ne jamais être pré-généré`);
  });
});

console.log(`\n${passed} test(s) réussi(s), ${failed} échec(s).`);
if(failed > 0) process.exit(1);
}

main();
