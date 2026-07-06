// =====================================================================
//  FILET DE SÉCURITÉ — résumé imprimable côté patient (v6.27)
//  ---------------------------------------------------------------------
//  patient-report.html est nouveau : une version multilingue, simplifiée
//  (pas d'analyse d'erreurs par catégorie — réservée à report.html côté
//  orthophoniste), du rapport, à imprimer/apporter au premier vrai
//  rendez-vous. Ce test vérifie :
//   1. Le rapport s'affiche correctement en français par défaut.
//   2. Il se retraduit bien si la langue change DEPUIS cette page
//      (même piège que le bug v6.25 côté tableau de bord — ce fichier a
//      son propre onLangChange(), à ne pas casser par erreur plus tard).
//   3. L'arabe s'affiche bien en RTL, y compris le bouton d'impression.
//   4. Les cas d'erreur (code manquant, dossier introuvable) affichent
//      un message plutôt qu'un plantage.
//
//  Lancer : node tests/patient-report.test.js
// =====================================================================

const { JSDOM } = require('jsdom');
const assert = require('assert');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
let passed = 0;
function test(name, fn){
  try{ fn(); console.log('  ✔', name); passed++; }
  catch(e){ console.error('  ✘', name, '\n    ', e.message); process.exitCode = 1; }
}
async function testAsync(name, fn){
  try{ await fn(); console.log('  ✔', name); passed++; }
  catch(e){ console.error('  ✘', name, '\n    ', e.message); process.exitCode = 1; }
}

function loadReportPage(query){
  const html = fs.readFileSync(path.join(ROOT, 'patient-report.html'), 'utf8');
  const dom = new JSDOM(html, { url:'http://localhost/patient-report.html'+(query||''), runScripts:'outside-only' });
  dom.window.scrollTo = () => {};
  const scripts = [...dom.window.document.querySelectorAll('script[src]')].map(s=>s.getAttribute('src'));
  const errors = [];
  for(const src of scripts){
    let code = fs.readFileSync(path.join(ROOT, src), 'utf8');
    // Force le mode navigateur (localStorage), pas le vrai cloud Supabase —
    // ce test porte sur l'affichage/l'i18n, pas sur l'intégration cloud
    // (déjà couverte ailleurs par tests/ortho-security.test.js).
    if(src === 'js/storage.js'){
      code = code
        .replace(/const SUPABASE_URL = "[^"]*";/, 'const SUPABASE_URL = "";')
        .replace(/const SUPABASE_ANON_KEY = "[^"]*";/, 'const SUPABASE_ANON_KEY = "";');
    }
    try{ dom.window.eval(code); }
    catch(e){ errors.push(`Erreur de chargement dans ${src} : ${e.message}`); }
  }
  if(errors.length) throw new Error(errors.join('\n'));
  const inline = [...dom.window.document.querySelectorAll('script:not([src])')];
  for(const s of inline) dom.window.eval(s.textContent);
  return dom;
}

function seedPatient(dom, code){
  dom.window.localStorage.setItem('reparole:'+code, JSON.stringify({
    name:'Marie', level:2, sessions:12, correct:34, total:40, streak:3
  }));
  const hist = [];
  for(let i=0;i<8;i++){
    hist.push({ at:new Date(Date.now()-i*86400000).toISOString(), type:'denomination', score:7, total:10, level:2 });
  }
  dom.window.localStorage.setItem('reparole:hist:'+code, JSON.stringify(hist));
}

(async () => {
  console.log('Résumé imprimable côté patient (patient-report.html)');

  await testAsync('rapport en français par défaut, sans code manquant/patient introuvable', async () => {
    const dom = loadReportPage('?code=demo');
    seedPatient(dom, 'demo');
    await dom.window.buildReport();
    const html = dom.window.document.getElementById('report').innerHTML;
    assert(html.includes('Mon résumé'), 'titre FR absent');
    assert(html.includes('Marie'), 'nom du patient absent');
    assert(html.includes('12'), 'nombre de séances absent');
    assert(!html.includes('undefined'), 'texte "undefined" qui a fuité dans le rendu');
  });

  await testAsync('changement de langue DEPUIS cette page retraduit le contenu (comme onLangChange ailleurs)', async () => {
    const dom = loadReportPage('?code=demo');
    seedPatient(dom, 'demo');
    await dom.window.buildReport();
    dom.window.Prefs.setLang('en'); // déclenche apply() -> onLangChange() -> buildReport()
    await new Promise(r=>setTimeout(r, 20));
    const html = dom.window.document.getElementById('report').innerHTML;
    assert(html.includes('My summary'), 'titre EN absent après changement de langue');
    assert(!html.includes('undefined'), 'texte "undefined" qui a fuité dans le rendu EN');
  });

  await testAsync('arabe : RTL appliqué + bouton d\'impression traduit', async () => {
    const dom = loadReportPage('?code=demo');
    seedPatient(dom, 'demo');
    await dom.window.buildReport();
    dom.window.Prefs.setLang('ar');
    await new Promise(r=>setTimeout(r, 20));
    const html = dom.window.document.getElementById('report').innerHTML;
    assert(html.includes('ملخصي'), 'titre AR absent');
    assert(dom.window.document.documentElement.dir === 'rtl', 'dir="rtl" non appliqué');
    const printBtn = dom.window.document.getElementById('print-btn');
    assert(printBtn.textContent.includes('طباعة'), 'bouton d\'impression non traduit en arabe');
  });

  await testAsync('code manquant dans l\'URL : message clair, pas de plantage', async () => {
    const dom = loadReportPage(''); // pas de ?code=
    await dom.window.buildReport();
    const html = dom.window.document.getElementById('report').innerHTML;
    assert(html.includes('manquant'), 'message de code manquant absent : '+html);
  });

  await testAsync('code inconnu : message clair, pas de plantage', async () => {
    const dom = loadReportPage('?code=inconnu');
    await dom.window.buildReport();
    const html = dom.window.document.getElementById('report').innerHTML;
    assert(html.includes('introuvable'), 'message de dossier introuvable absent : '+html);
  });

  console.log(`\n${passed} test(s) réussi(s).`);
  if(!process.exitCode){
    console.log('\n✅ Aucun problème détecté — le résumé imprimable côté patient fonctionne et suit la langue.');
  } else {
    console.log('\n❌ Des problèmes ont été détectés ci-dessus.');
  }
})();
