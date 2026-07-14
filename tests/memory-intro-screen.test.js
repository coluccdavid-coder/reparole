// =====================================================================
//  TESTS — Écran de démarrage du jeu de mémoire (v6.77)
//  ---------------------------------------------------------------------
//  Vrai bug trouvé par un retour utilisateur (capture d'écran) : la
//  première manche démarrait immédiatement à l'arrivée sur l'écran, sans
//  laisser le temps de choisir la vitesse pourtant affichée juste
//  au-dessus. Vérifie que Memory.start() affiche désormais un écran
//  d'introduction (bouton "Commencer") avant toute séquence, et que la
//  vitesse choisie à ce moment-là est bien celle utilisée pour la
//  première manche.
//
//  Lancer : node tests/memory-intro-screen.test.js
// =====================================================================

const { JSDOM } = require('jsdom');
const fs = require('fs');
const path = require('path');
const assert = require('assert');

const ROOT = path.join(__dirname, '..');
let passed = 0, failed = 0;
function test(name, fn){
  try{ fn(); console.log('  ✔', name); passed++; }
  catch(e){ console.log('  ✘', name, '—', e.message); failed++; }
}

function loadPatientApp(){
  const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  const dom = new JSDOM(html, { url:'http://localhost/', runScripts:'outside-only', resources:'usable', pretendToBeVisual:true });
  const scripts = [...dom.window.document.querySelectorAll('script[src]')].map(s=>s.getAttribute('src'));
  for(const src of scripts){
    let code = fs.readFileSync(path.join(ROOT, src), 'utf8');
    if(src === 'js/app.js'){
      code += `\nwindow.__testSetUser = function(overrides){ user = Object.assign({name:'Test',level:1,sessions:0,correct:0,total:0,streak:1,plan:'free'}, overrides||{}); window.user = user; };`;
    }
    dom.window.eval(code);
  }
  dom.window.eval("Prefs.load(); __testSetUser({});");
  return dom;
}

console.log('Écran de démarrage du jeu de mémoire (v6.77)');

test("Memory.start() affiche un écran d'introduction avec un bouton, pas directement la séquence", ()=>{
  const dom = loadPatientApp();
  dom.window.Memory.start();
  const body = dom.window.document.getElementById('memory-body').innerHTML;
  assert.ok(/Memory\._playRound\(\)/.test(body), 'bouton de démarrage introuvable');
  assert.ok(!body.includes('memory-stage'), 'la zone de séquence ne doit pas encore exister avant le clic sur Commencer');
});

test('la manche ne commence (state.showing) qu\'après avoir cliqué sur "Commencer"', ()=>{
  const dom = loadPatientApp();
  dom.window.Memory.start();
  assert.strictEqual(dom.window.Memory.state.sequence.length, 0, 'aucune séquence ne doit être tirée avant le clic');
  dom.window.Memory._playRound();
  assert.ok(dom.window.Memory.state.sequence.length > 0, 'la séquence doit être tirée après le clic sur Commencer');
});

test('le sélecteur de vitesse reste utilisable pendant l\'écran d\'introduction (non écrasé par le rendu)', ()=>{
  const dom = loadPatientApp();
  dom.window.Memory.start();
  const select = dom.window.document.getElementById('memory-speed-select');
  assert.ok(select, 'le sélecteur de vitesse doit toujours exister (il est hors de #memory-body, dans index.html)');
});

test('la vitesse choisie avant de cliquer "Commencer" est bien celle utilisée pour la 1ère manche', ()=>{
  const dom = loadPatientApp();
  dom.window.Memory.start();
  dom.window.Memory.setSpeed('slow');
  const calls = [];
  const originalSetTimeout = dom.window.setTimeout;
  dom.window.setTimeout = (fn, ms)=>{ calls.push(ms); return originalSetTimeout(fn, 0); };
  dom.window.Memory._playRound();
  dom.window.setTimeout = originalSetTimeout;
  assert.ok(calls.includes(1800), `attendu un délai de 1800ms (vitesse lente) parmi ${JSON.stringify(calls)}`);
});

test('les manches suivantes (2 à 5) ne re-demandent pas de clic "Commencer"', ()=>{
  const dom = loadPatientApp();
  dom.window.Memory.start();
  dom.window.Memory._playRound(); // manche 1 lancée manuellement
  dom.window.Memory.state.round = 1; // simule la fin de la manche 1
  dom.window.Memory._playRound(); // doit se lancer directement, pas d'écran d'intro
  const body = dom.window.document.getElementById('memory-body').innerHTML;
  assert.ok(body.includes('memory-stage'), 'la manche 2 doit démarrer directement, sans repasser par l\'écran d\'introduction');
});

console.log(`\n${passed} test(s) réussi(s), ${failed} échec(s).`);
if(failed > 0) process.exit(1);
