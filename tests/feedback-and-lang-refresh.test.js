// =====================================================================
//  TESTS — v6.49 : confirmation visuelle (bilan) + rafraîchissement
//  du tableau de bord au changement de langue
//  ---------------------------------------------------------------------
//  Deux bugs remontés par l'utilisateur avec captures d'écran :
//   1. Les questions de ressenti (bilan initial) faisaient avancer à
//      la question suivante instantanément, sans aucune confirmation
//      visuelle que le clic avait été pris en compte.
//   2. Changer de langue via le menu déroulant ne rafraîchissait que
//      les textes statiques [data-i18n] — tout ce qui est généré en
//      JS (salutation, niveau adapté, journal...) restait figé dans
//      l'ancienne langue.
//
//  Lancer : node tests/feedback-and-lang-refresh.test.js
// =====================================================================

const assert = require('assert');
const { JSDOM } = require('jsdom');
const fs = require('fs');
const path = require('path');

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
          user = Object.assign({name:'Test',level:2,sessions:3,correct:2,total:3,streak:1,plan:'free'}, overrides||{});
        };
        window.__testSetUserCode = function(code){ userCode = code; };
        window.__testShowDashboard = function(){ show('dashboard'); };
      `;
    }
    if(src === 'js/storage.js'){
      // v6.45.1 : force le mode navigateur quelles que soient les vraies
      // clés Supabase baked-in dans storage.js.
      code = code.replace(/const SUPABASE_URL = "[^"]*";/, 'const SUPABASE_URL = "";')
                  .replace(/const SUPABASE_ANON_KEY = "[^"]*";/, 'const SUPABASE_ANON_KEY = "";');
    }
    dom.window.eval(code);
    // v6.247 : les 14 langues vivent dans js/i18n/<code>.js et les pages
    // n'en chargent qu'une. En test, on les charge toutes.
    if(typeof src !== 'undefined' && src === 'js/i18n.js') fs.readdirSync(path.join(ROOT, 'js/i18n'))
      .forEach(lf => dom.window.eval(fs.readFileSync(path.join(ROOT, 'js/i18n', lf), 'utf8')));
  }
  dom.window.eval("Prefs.load(); __testSetUserCode('p-test'); __testSetUser({});");
  return dom;
}

async function main(){

console.log('Bilan initial : confirmation visuelle avant de passer à la question suivante');

await test('répondre ajoute .selected et désactive les boutons avant de regénérer l\'écran', ()=>{
  const dom = loadPatientApp();
  dom.window.eval("Assessment.start(()=>{}); Assessment.state.step='symptoms'; Assessment.state.symptomIdx=0; Assessment._render();");
  const firstChoice = dom.window.document.querySelector('.choices .choice');
  assert.ok(firstChoice, 'un bouton de choix doit être affiché');
  dom.window.eval("Assessment.answerSymptom('mots', 2, document.querySelector('.choices .choice'))");
  // juste après l'appel (avant le setTimeout qui regénère l'écran) :
  // les boutons doivent déjà être désactivés et le choix mis en évidence.
  const choicesAfterClick = [...dom.window.document.querySelectorAll('.choices .choice')];
  assert.ok(choicesAfterClick.every(b => b.disabled), 'tous les boutons doivent être désactivés juste après la réponse');
  assert.ok(choicesAfterClick.some(b => b.classList.contains('selected')), 'le bouton choisi doit porter la classe .selected');
});

await test('après le délai, l\'écran est regénéré pour la question suivante', async ()=>{
  const dom = loadPatientApp();
  dom.window.eval("Assessment.start(()=>{}); Assessment.state.step='symptoms'; Assessment.state.symptomIdx=0; Assessment._render();");
  dom.window.eval("Assessment.answerSymptom('mots', 2, document.querySelector('.choices .choice'))");
  await new Promise(r => setTimeout(r, 600)); // au-delà du délai de 450ms
  // après le délai, l'écran a été regénéré : les boutons de la question
  // suivante sont de nouveau cliquables (plus désactivés/sélectionnés).
  const choicesAfterDelay = [...dom.window.document.querySelectorAll('.choices .choice')];
  assert.ok(choicesAfterDelay.every(b => !b.disabled), 'les boutons de la question suivante doivent être réactivés');
  assert.ok(choicesAfterDelay.every(b => !b.classList.contains('selected')), 'aucun ancien état "selected" ne doit persister');
});

console.log('\nChangement de langue : rafraîchissement du contenu généré en JS');

await test('la salutation ("Bonjour"/"Hello"/"Hallo"...) se met à jour après un changement de langue, sans recharger la page', async ()=>{
  const dom = loadPatientApp();
  dom.window.eval("__testShowDashboard()");
  await dom.window.eval('renderDashboard()');
  const before = dom.window.document.getElementById('hello').textContent;
  assert.ok(before.includes('Bonjour') || before.includes('Bienvenue') || before.length > 0);

  dom.window.eval("Prefs.setLang('de')");
  // renderDashboard() est async (mergeCaregiverWords/mergeCaregiverWords
  // en tête) — laisser le temps à la micro-tâche de se résoudre.
  await new Promise(r => setTimeout(r, 50));

  const after = dom.window.document.getElementById('hello').textContent;
  assert.ok(after.includes('Hallo'), `attendu "Hallo" en allemand, obtenu : "${after}"`);
  assert.notStrictEqual(before, after, 'le texte doit changer après le changement de langue');
});

await test('la langue kabyle (partielle) ne fait pas planter le rafraîchissement du tableau de bord', async ()=>{
  const dom = loadPatientApp();
  dom.window.eval("__testShowDashboard()");
  await dom.window.eval('renderDashboard()');
  assert.doesNotThrow(()=>{ dom.window.eval("Prefs.setLang('kab')"); });
});

console.log(`\n${passed} test(s) réussi(s), ${failed} échec(s).`);
if(failed > 0) process.exitCode = 1;

}

main();
