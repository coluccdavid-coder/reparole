// =====================================================================
//  TESTS — Espace aidant (v6.35)
//  ---------------------------------------------------------------------
//  Deux parties :
//   1. Le moteur de conseils (js/caregiver-tips.js) : pure logique,
//      règles explicites — voir garde-fou n°1 (pas d'IA générative).
//   2. Un test de fumée en DOM simulé (jsdom, même limite que les
//      autres tests de ce dossier : pas un vrai navigateur) qui vérifie
//      le parcours complet aidant.html en mode navigateur (sans
//      Supabase) : code invalide -> erreur, code valide -> tableau de
//      bord rempli.
//
//  Lancer : node tests/caregiver.test.js
// =====================================================================

const assert = require('assert');
const { JSDOM } = require('jsdom');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
let passed = 0, failed = 0;
// `test` accepte des fonctions sync OU async (caregiverLogin est async) —
// on attend toujours le résultat avant de passer au test suivant.
async function test(name, fn){
  try{ await fn(); console.log('  ✔', name); passed++; }
  catch(e){ console.log('  ✘', name, '—', e.message); failed++; }
}

// ---------------------------------------------------------------------
//  Partie 1 : CaregiverTips.generateCaregiverTips (règles explicites)
// ---------------------------------------------------------------------
const { generateCaregiverTips, CAREGIVER_TIP_TEXT } = require('../js/caregiver-tips.js');

async function main(){

console.log('Moteur de conseils (règles, pas de LLM)');

await test('aucune séance -> conseil "no_sessions" + rappel fixe, rien d\'autre', ()=>{
  const tips = generateCaregiverTips({ sessions:0, streak:0, error_tally:{} });
  const ids = tips.map(t=>t.id);
  assert.deepStrictEqual(ids, ['no_sessions', 'always_refer']);
});

await test('le rappel "always_refer" est toujours présent, en dernier', ()=>{
  const cases = [
    { sessions:0 },
    { sessions:5, streak:1, last_seen:new Date().toISOString(), error_tally:{} },
    { sessions:12, streak:8, last_seen:new Date().toISOString(), error_tally:{ semantic:5 } }
  ];
  cases.forEach(c=>{
    const ids = generateCaregiverTips(c).map(t=>t.id);
    assert.strictEqual(ids[ids.length-1], 'always_refer');
  });
});

await test('inactivité (>=3 jours) déclenche le conseil correspondant', ()=>{
  const fourDaysAgo = new Date(Date.now() - 4*86400000).toISOString();
  const tips = generateCaregiverTips({ sessions:3, streak:1, last_seen:fourDaysAgo, error_tally:{} });
  assert.ok(tips.some(t=>t.id==='inactivity'));
});

await test('pas d\'inactivité si vu hier', ()=>{
  const yesterday = new Date(Date.now() - 1*86400000).toISOString();
  const tips = generateCaregiverTips({ sessions:3, streak:1, last_seen:yesterday, error_tally:{} });
  assert.ok(!tips.some(t=>t.id==='inactivity'));
});

await test('streak >= 5 déclenche le conseil d\'encouragement', ()=>{
  const today = new Date().toISOString();
  const tips = generateCaregiverTips({ sessions:10, streak:5, last_seen:today, error_tally:{} });
  assert.ok(tips.some(t=>t.id==='streak_good'));
});

await test('streak < 5 ne déclenche PAS le conseil d\'encouragement', ()=>{
  const today = new Date().toISOString();
  const tips = generateCaregiverTips({ sessions:10, streak:4, last_seen:today, error_tally:{} });
  assert.ok(!tips.some(t=>t.id==='streak_good'));
});

await test('catégorie d\'erreur dominante -> conseil ciblé (>=3 erreurs requises)', ()=>{
  const today = new Date().toISOString();
  const tips = generateCaregiverTips({ sessions:10, streak:1, last_seen:today, error_tally:{ phonological:5, semantic:2 } });
  assert.ok(tips.some(t=>t.id==='cat_phonological'));
  assert.ok(!tips.some(t=>t.id==='cat_semantic'));
});

await test('moins de 3 erreurs récentes -> pas de conseil catégorie (trop peu de signal)', ()=>{
  const today = new Date().toISOString();
  const tips = generateCaregiverTips({ sessions:10, streak:1, last_seen:today, error_tally:{ phonological:2 } });
  assert.ok(!tips.some(t=>t.id==='cat_phonological'));
});

await test('égalité entre catégories tranchée de façon déterministe (alphabétique)', ()=>{
  const today = new Date().toISOString();
  const a = generateCaregiverTips({ sessions:10, streak:1, last_seen:today, error_tally:{ syntax:3, omission:3 } });
  const b = generateCaregiverTips({ sessions:10, streak:1, last_seen:today, error_tally:{ syntax:3, omission:3 } });
  assert.deepStrictEqual(a.map(t=>t.id), b.map(t=>t.id)); // reproductible
  assert.ok(a.some(t=>t.id==='cat_omission')); // 'omission' < 'syntax'
});

await test('aucun signal particulier -> conseil générique "general_ok"', ()=>{
  const today = new Date().toISOString();
  const tips = generateCaregiverTips({ sessions:10, streak:1, last_seen:today, error_tally:{} });
  assert.ok(tips.some(t=>t.id==='general_ok'));
});

await test('jamais plus de 2 conseils dynamiques + 1 rappel fixe (3 maximum)', ()=>{
  const fourDaysAgo = new Date(Date.now() - 4*86400000).toISOString();
  const tips = generateCaregiverTips({ sessions:10, streak:9, last_seen:fourDaysAgo, error_tally:{ semantic:9 } });
  assert.ok(tips.length <= 3, `attendu <= 3 conseils, obtenu ${tips.length}`);
});

await test('toutes les entrées CAREGIVER_TIP_TEXT sont des chaînes non vides', ()=>{
  Object.values(CAREGIVER_TIP_TEXT).forEach(text=>{
    assert.ok(typeof text === 'string' && text.trim().length > 0);
  });
});

// ---------------------------------------------------------------------
//  Partie 2 : parcours aidant.html en mode navigateur (localStorage),
//  sans Supabase — jsdom, script par script, comme les autres tests.
// ---------------------------------------------------------------------
console.log('\nParcours aidant.html (mode navigateur, sans compte cloud)');

function loadAidantPage(){
  const html = fs.readFileSync(path.join(ROOT, 'aidant.html'), 'utf8');
  const dom = new JSDOM(html, { url:'http://localhost/', runScripts:'outside-only', resources:'usable', pretendToBeVisual:true });
  // storage.js utilise window.crypto.getRandomValues — jsdom le fournit nativement.
  const scripts = [...dom.window.document.querySelectorAll('script[src]')].map(s=>s.getAttribute('src'));
  for(const src of scripts){
    let code = fs.readFileSync(path.join(ROOT, src), 'utf8');
    // v6.45.1 : ce test veut le mode navigateur quelles que soient les
    // vraies clés Supabase baked-in dans storage.js — voir le même
    // correctif dans tests/knowledge-base.test.js pour le détail.
    if(src === 'js/storage.js'){
      code = code.replace(/const SUPABASE_URL = "[^"]*";/, 'const SUPABASE_URL = "";')
                  .replace(/const SUPABASE_ANON_KEY = "[^"]*";/, 'const SUPABASE_ANON_KEY = "";');
    }
    dom.window.eval(code);
  }
  return dom;
}

function seedLocalPatient(dom, patientCode, caregiverCode, record){
  dom.window.localStorage.setItem('reparole:'+patientCode, JSON.stringify(record));
  if(caregiverCode) dom.window.localStorage.setItem('reparole:caregiver-index:'+caregiverCode, patientCode);
}

await test('code aidant inconnu -> message d\'erreur, tableau de bord non affiché', async ()=>{
  const dom = loadAidantPage();
  dom.window.document.getElementById('caregiver-code').value = 'a-inexistant000';
  await dom.window.caregiverLogin();
  const err = dom.window.document.getElementById('caregiver-login-error').textContent;
  assert.ok(err.length > 0);
  assert.strictEqual(dom.window.document.getElementById('caregiver-dashboard').style.display, 'none');
});

await test('code aidant valide -> tableau de bord rempli (nom, stats, conseils)', async ()=>{
  const dom = loadAidantPage();
  seedLocalPatient(dom, 'p-test1234567', 'a-valide12345', {
    code:'p-test1234567', name:'Marie', level:2, sessions:12, correct:9, total:12, streak:6,
    last_seen:new Date().toISOString()
  });
  dom.window.document.getElementById('caregiver-code').value = 'a-valide12345';
  await dom.window.caregiverLogin();

  assert.strictEqual(dom.window.document.getElementById('caregiver-dashboard').style.display, '');
  assert.ok(dom.window.document.getElementById('caregiver-hello').textContent.includes('Marie'));
  assert.strictEqual(dom.window.document.getElementById('cg-sessions').textContent, '12');
  assert.strictEqual(dom.window.document.getElementById('cg-success').textContent, '75%');
  assert.strictEqual(dom.window.document.getElementById('cg-streak').textContent, '6');
  // streak >= 5 -> le conseil d'encouragement doit apparaître dans la liste
  assert.ok(dom.window.document.getElementById('cg-tips').innerHTML.length > 0);
});

await test('caregiverLogout() revient à l\'écran de connexion', async ()=>{
  const dom = loadAidantPage();
  seedLocalPatient(dom, 'p-test1234567', 'a-valide12345', {
    code:'p-test1234567', name:'Marie', level:2, sessions:1, correct:1, total:1, streak:1
  });
  dom.window.document.getElementById('caregiver-code').value = 'a-valide12345';
  await dom.window.caregiverLogin();
  dom.window.caregiverLogout();
  assert.strictEqual(dom.window.document.getElementById('caregiver-login').style.display, '');
  assert.strictEqual(dom.window.document.getElementById('caregiver-dashboard').style.display, 'none');
});

console.log(`\n${passed} test(s) réussi(s), ${failed} échec(s).`);
if(failed > 0) process.exitCode = 1;

}

main();
