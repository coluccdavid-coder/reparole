// =====================================================================
//  FILET DE SÉCURITÉ — bilan PDF professionnel (v6.29)
//  ---------------------------------------------------------------------
//  report.html (réservé à l'orthophoniste) a été retravaillé pour se lire
//  comme un vrai bilan clinique plutôt qu'un export d'appli : bandeau
//  discret, bloc identité patient/praticien, profil clinique déclaré
//  affiché s'il existe, ligne de signature. Ce test vérifie :
//   1. Le titre et le bandeau professionnels sont bien présents.
//   2. Le nom de l'orthophoniste (?orthoName=) s'affiche s'il est fourni,
//      et un repli discret s'affiche s'il est absent (lien généré par
//      une ancienne version) — jamais de plantage.
//   3. Le profil clinique déclaré s'affiche quand il est renseigné, et
//      reste absent quand il vaut "none" ou n'est pas renseigné.
//   4. La ligne de signature est présente (document imprimable/archivable).
//   5. Les cas déjà couverts avant (code manquant/inconnu) fonctionnent
//      toujours après ce remaniement.
//
//  Lancer : node tests/report-professional.test.js
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

function loadReport(query){
  const html = fs.readFileSync(path.join(ROOT, 'report.html'), 'utf8');
  const dom = new JSDOM(html, { url:'http://localhost/report.html'+(query||''), runScripts:'outside-only' });
  dom.window.scrollTo = () => {};
  const scripts = [...dom.window.document.querySelectorAll('script[src]')].map(s=>s.getAttribute('src'));
  const errors = [];
  for(const src of scripts){
    let code = fs.readFileSync(path.join(ROOT, src), 'utf8');
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

function seedPatient(dom, code, extra){
  dom.window.localStorage.setItem('reparole:'+code, JSON.stringify({
    name:'Marie', level:2, sessions:12, correct:34, total:40, streak:3, ...extra
  }));
  const hist = [];
  for(let i=0;i<8;i++){
    hist.push({ at:new Date(Date.now()-i*86400000).toISOString(), type:'denomination', score:7, total:10, level:2 });
  }
  dom.window.localStorage.setItem('reparole:hist:'+code, JSON.stringify(hist));
}

(async () => {
  console.log('Bilan PDF professionnel (report.html)');

  await testAsync('titre clinique + bandeau ReParole présents', async () => {
    const dom = loadReport('?code=demo&ortho=orthoX&orthoName=Dr.%20Test');
    seedPatient(dom, 'demo');
    await dom.window.buildReport();
    const html = dom.window.document.getElementById('report').innerHTML;
    assert(html.includes('Bilan de suivi orthophonique'), 'titre "Bilan de suivi orthophonique" absent');
    assert(html.includes('ReParole'), 'bandeau ReParole absent');
  });

  await testAsync('nom de l\'orthophoniste affiché quand fourni', async () => {
    const dom = loadReport('?code=demo&ortho=orthoX&orthoName=Dr.%20Camille%20Test');
    seedPatient(dom, 'demo');
    await dom.window.buildReport();
    const html = dom.window.document.getElementById('report').innerHTML;
    assert(html.includes('Dr. Camille Test'), 'nom de l\'orthophoniste absent du bilan');
    assert(html.includes('Réalisé par'), 'libellé "Réalisé par" absent');
  });

  await testAsync('repli discret si orthoName absent (lien généré par une ancienne version) — pas de plantage', async () => {
    const dom = loadReport('?code=demo&ortho=orthoX');
    seedPatient(dom, 'demo');
    await dom.window.buildReport();
    const html = dom.window.document.getElementById('report').innerHTML;
    assert(html.includes('Non renseigné'), 'repli "Non renseigné" absent quand orthoName manque');
  });

  await testAsync('profil clinique déclaré affiché quand renseigné', async () => {
    const dom = loadReport('?code=demo&ortho=orthoX');
    seedPatient(dom, 'demo', { clinical_profile:'broca' });
    await dom.window.buildReport();
    const html = dom.window.document.getElementById('report').innerHTML;
    assert(html.includes('Type Broca'), 'libellé du profil clinique "Type Broca" absent');
  });

  await testAsync('profil clinique absent du document si non renseigné ("none")', async () => {
    const dom = loadReport('?code=demo&ortho=orthoX');
    seedPatient(dom, 'demo', { clinical_profile:'none' });
    await dom.window.buildReport();
    const html = dom.window.document.getElementById('report').innerHTML;
    assert(!html.includes('report-clinical-box'), 'la boîte de profil clinique ne devrait pas apparaître pour "none"');
  });

  await testAsync('ligne de signature présente (document archivable)', async () => {
    const dom = loadReport('?code=demo&ortho=orthoX');
    seedPatient(dom, 'demo');
    await dom.window.buildReport();
    const html = dom.window.document.getElementById('report').innerHTML;
    assert(html.includes('Signature et cachet'), 'ligne de signature absente');
  });

  await testAsync('code manquant : message clair (régression déjà couverte avant ce remaniement)', async () => {
    const dom = loadReport('?ortho=orthoX');
    const html = dom.window.document.getElementById('report').innerHTML;
    assert(html.includes('manquant'), 'message de code manquant absent');
  });

  await testAsync('code inconnu : message clair (régression déjà couverte avant ce remaniement)', async () => {
    const dom = loadReport('?code=inconnu&ortho=orthoX');
    await dom.window.buildReport();
    const html = dom.window.document.getElementById('report').innerHTML;
    assert(html.includes('introuvable'), 'message de dossier introuvable absent');
  });

  console.log(`\n${passed} test(s) réussi(s).`);
  if(!process.exitCode){
    console.log('\n✅ Aucun problème détecté — le bilan PDF professionnel fonctionne comme attendu.');
  } else {
    console.log('\n❌ Des problèmes ont été détectés ci-dessus.');
  }
})();
