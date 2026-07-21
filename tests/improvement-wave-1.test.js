// =====================================================================
//  TESTS — Vague 1 des améliorations demandées (v6.131)
//  ---------------------------------------------------------------------
//  Couvre les 6 points implémentés sans nouveau contenu d'exercice :
//  9. Signal de plateau (Learner.plateauSignal)
//  10. Reconnaissance fine du progrès (mot difficile retrouvé)
//  11. Mode "usage à une main" (préférence + classe body)
//  12. Retour sonore optionnel (préférence, ne plante jamais)
//  13. Échauffement (préférence + écran avant la 1ère question)
//  14. "Je n'ai pas la force aujourd'hui" (séance réduite, un seul usage)
//
//  Lancer : node tests/improvement-wave-1.test.js
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
        window.__testSetUser = function(overrides){
          user = Object.assign({name:'Test',level:2,sessions:0,correct:0,total:0,streak:1,plan:'free'}, overrides||{});
        };
        window.__testSetPaywallEnabled = function(v){ PAYWALL_ENABLED = v; };
        window.__testSetUserCode = function(code){ userCode = code; };
        window.__testGetCurrent = function(){ return current; };
        window.Store = Store;
      `;
    }
    dom.window.eval(code);
  }
  dom.window.eval("Prefs.load(); __testSetUserCode('T'); __testSetUser({}); __testSetPaywallEnabled(false);");
  return dom;
}

async function main(){

console.log('9. Signal de plateau (Learner.plateauSignal)');

await test('moins de 5 séances -> pas de plateau détecté', ()=>{
  const dom = loadPatientApp();
  const r = dom.window.eval("Learner.plateauSignal([{level:2},{level:2}])");
  assert.strictEqual(r.onPlateau, false);
});

await test('5 séances au même niveau -> plateau détecté', ()=>{
  const dom = loadPatientApp();
  const hist = [{level:2},{level:2},{level:2},{level:2},{level:2}];
  const r = dom.window.eval(`Learner.plateauSignal(${JSON.stringify(hist)})`);
  assert.strictEqual(r.onPlateau, true);
  assert.strictEqual(r.level, 2);
  assert.strictEqual(r.sessionsAtLevel, 5);
});

await test('niveau qui varie sur les 5 dernières -> pas de plateau', ()=>{
  const dom = loadPatientApp();
  const hist = [{level:1},{level:2},{level:2},{level:3},{level:2}];
  const r = dom.window.eval(`Learner.plateauSignal(${JSON.stringify(hist)})`);
  assert.strictEqual(r.onPlateau, false);
});

console.log('\n10. Reconnaissance fine du progrès');

await test('progress_word_recovered existe et inclut le mot fourni', ()=>{
  const dom = loadPatientApp();
  const msg = dom.window.eval("I18N.t('progress_word_recovered', 'chat')");
  assert.ok(msg.includes('chat'));
});

await test('Companion.sayText affiche un message personnalisé (pas puisé dans une banque)', ()=>{
  const dom = loadPatientApp();
  dom.window.eval("Companion.mounts = ['fake-mount']; document.body.innerHTML += '<div id=\"fake-mount\"></div>';");
  dom.window.eval("Companion.sayText('Message de test unique 12345')");
  assert.strictEqual(dom.window.eval('Companion.message'), 'Message de test unique 12345');
});

console.log('\n11. Mode "usage à une main"');

await test('préférence oneHanded existe, désactivée par défaut', ()=>{
  const dom = loadPatientApp();
  assert.strictEqual(dom.window.eval('Prefs.data.oneHanded'), false);
  assert.strictEqual(dom.window.document.body.classList.contains('one-handed'), false);
});

await test('Prefs.toggle(\'oneHanded\') active la classe body', ()=>{
  const dom = loadPatientApp();
  dom.window.eval("Prefs.toggle('oneHanded')");
  assert.strictEqual(dom.window.document.body.classList.contains('one-handed'), true);
});

console.log('\n12. Retour sonore optionnel');

await test('désactivé par défaut, playFeedbackSound ne plante jamais (API absente en jsdom)', ()=>{
  const dom = loadPatientApp();
  assert.strictEqual(dom.window.eval('Prefs.data.soundFeedback'), false);
  assert.doesNotThrow(()=>{ dom.window.eval('playFeedbackSound(true)'); dom.window.eval('playFeedbackSound(false)'); });
});

await test('activé : ne plante toujours pas même sans AudioContext disponible', ()=>{
  const dom = loadPatientApp();
  dom.window.eval("Prefs.toggle('soundFeedback')");
  assert.doesNotThrow(()=>{ dom.window.eval('playFeedbackSound(true)'); });
});

console.log('\n13. Échauffement');

await test('désactivé par défaut -> pas d\'écran d\'échauffement, va direct à la question', async ()=>{
  const dom = loadPatientApp();
  await dom.window.eval("Store.savePatient('T', {name:'Test',level:2,sessions:0,correct:0,total:0,streak:1})");
  await dom.window.eval("startExercise('denomination')");
  const c = dom.window.eval('__testGetCurrent()');
  assert.ok(c && c.total > 0);
});

await test('activé sans mot favori -> pas d\'écran d\'échauffement (rien à fabriquer)', async ()=>{
  const dom = loadPatientApp();
  dom.window.eval("Prefs.toggle('warmUp')");
  await dom.window.eval("Store.savePatient('T', {name:'Test',level:2,sessions:0,correct:0,total:0,streak:1})");
  await dom.window.eval("startExercise('denomination')");
  const c = dom.window.eval('__testGetCurrent()');
  assert.ok(c && c.total > 0);
});

await test('activé avec un mot favori -> écran d\'échauffement affiché avec ce mot', async ()=>{
  const dom = loadPatientApp();
  dom.window.eval("Prefs.toggle('warmUp')");
  await dom.window.eval("Store.savePatient('T', {name:'Test',level:2,sessions:0,correct:0,total:0,streak:1})");
  await dom.window.eval("Store.toggleFavoriteWord('T', 'CHAT')");
  await dom.window.eval("startExercise('denomination')");
  const body = dom.window.document.getElementById('ex-body').innerHTML;
  assert.ok(body.includes('CHAT'), 'le mot favori devrait apparaître dans l\'écran d\'échauffement');
});

console.log('\n14. "Je n\'ai pas la force aujourd\'hui"');

await test('startReducedSession limite à 2 questions du niveau le plus facile', async ()=>{
  const dom = loadPatientApp();
  await dom.window.eval("Store.savePatient('T', {name:'Test',level:3,sessions:0,correct:0,total:0,streak:1})");
  await dom.window.eval("startReducedSession()");
  const c = dom.window.eval('__testGetCurrent()');
  assert.ok(c.total <= 2, `attendu au plus 2 questions, trouvé ${c.total}`);
});

await test('ne s\'applique qu\'une seule fois : la séance suivante redevient normale', async ()=>{
  const dom = loadPatientApp();
  await dom.window.eval("Store.savePatient('T', {name:'Test',level:2,sessions:0,correct:0,total:0,streak:1})");
  await dom.window.eval("startReducedSession()");
  await dom.window.eval("startExercise('denomination')");
  const c = dom.window.eval('__testGetCurrent()');
  assert.ok(c.total > 2, `la 2e séance devrait être normale, trouvé ${c.total} questions`);
});

console.log(`\n${passed} test(s) réussi(s), ${failed} échec(s).`);
if(failed > 0) process.exit(1);
}

main();
