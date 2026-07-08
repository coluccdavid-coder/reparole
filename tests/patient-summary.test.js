// =====================================================================
//  TESTS — Résumé imprimable côté patient (v6.36, mon-resume.html)
//  ---------------------------------------------------------------------
//  Test de fumée en DOM simulé (jsdom, même limite que les autres tests
//  de ce dossier : pas un vrai navigateur), en mode navigateur
//  (localStorage), sans compte cloud.
//
//  Lancer : node tests/patient-summary.test.js
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

// Charge mon-resume.html dans un DOM simulé : évalue d'abord les scripts
// externes (storage.js, learner.js, charts.js), PUIS le script inline de
// la page (buildSummary/typeLabel n'existent nulle part ailleurs).
function evalAllScripts(dom){
  const externals = [...dom.window.document.querySelectorAll('script[src]')].map(s=>s.getAttribute('src'));
  externals.forEach(src=>{
    let code = fs.readFileSync(path.join(ROOT, src), 'utf8');
    // v6.45.1 : force le mode navigateur quelles que soient les vraies
    // clés Supabase baked-in dans storage.js — ces tests attendent
    // Store.mode()==='navigateur' (localStorage), pas un vrai réseau.
    if(src === 'js/storage.js'){
      code = code.replace(/const SUPABASE_URL = "[^"]*";/, 'const SUPABASE_URL = "";')
                  .replace(/const SUPABASE_ANON_KEY = "[^"]*";/, 'const SUPABASE_ANON_KEY = "";');
    }
    dom.window.eval(code);
  });
  const inline = [...dom.window.document.querySelectorAll('script:not([src])')].map(s=>s.textContent);
  inline.forEach(code=>{ dom.window.eval(code); });
}

function loadSummaryPage(url){
  const html = fs.readFileSync(path.join(ROOT, 'mon-resume.html'), 'utf8');
  const dom = new JSDOM(html, { url: url || 'http://localhost/mon-resume.html', runScripts:'outside-only', resources:'usable', pretendToBeVisual:true });
  evalAllScripts(dom);
  return dom;
}

function seedLocalPatient(dom, code, record, history){
  dom.window.localStorage.setItem('reparole:'+code, JSON.stringify(record));
  if(history) dom.window.localStorage.setItem('reparole:hist:'+code, JSON.stringify(history));
}

async function main(){

console.log('Résumé imprimable patient (mon-resume.html)');

await test('sans code dans l\'adresse -> message explicite, pas de plantage', async ()=>{
  const dom = loadSummaryPage(); // url sans ?code=
  await dom.window.buildSummary();
  const text = dom.window.document.getElementById('report').textContent;
  assert.ok(text.includes('Aucun code'));
});

await test('code inconnu -> message "dossier introuvable"', async ()=>{
  const dom = loadSummaryPage('http://localhost/mon-resume.html?code=p-inexistant');
  await dom.window.buildSummary();
  const text = dom.window.document.getElementById('report').textContent;
  assert.ok(text.includes('introuvable'));
});

await test('code valide -> résumé rempli (nom, stats, historique, conseil du moment)', async ()=>{
  const dom = loadSummaryPage('http://localhost/mon-resume.html?code=p-test0000001');
  seedLocalPatient(dom, 'p-test0000001',
    { code:'p-test0000001', name:'Karim', level:2, sessions:6, correct:5, total:6, streak:3 },
    [
      { type:'denomination', score:4, total:5, level:2, at:new Date(Date.now()-2*86400000).toISOString() },
      { type:'memoire', score:3, total:4, level:2, at:new Date().toISOString() }
    ]
  );
  await dom.window.buildSummary();
  const html2 = dom.window.document.getElementById('report').innerHTML;
  assert.ok(html2.includes('Karim'));
  assert.ok(html2.includes('83%')); // 5/6 arrondi
  assert.ok(html2.includes('Nommer les images')); // libellé de "denomination"
  assert.ok(html2.includes('Jeu de mémoire'));     // libellé de "memoire"
  // texte "insight" par défaut du moteur adaptatif (repli sans I18N, voir js/learner.js)
  assert.ok(dom.window.document.getElementById('report').textContent.length > 200);
});

await test('typeLabel() : types connus traduits, type inconnu renvoyé tel quel', ()=>{
  const dom = loadSummaryPage();
  assert.strictEqual(dom.window.typeLabel('denomination'), 'Nommer les images');
  assert.strictEqual(dom.window.typeLabel('conversation_medecin'), 'Conversation guidée');
  assert.strictEqual(dom.window.typeLabel('un_type_inconnu'), 'un_type_inconnu');
});

console.log(`\n${passed} test(s) réussi(s), ${failed} échec(s).`);
if(failed > 0) process.exitCode = 1;

}

main();
