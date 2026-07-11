// =====================================================================
//  TESTS — Conformité légale (v6.56) : pied de page, consentement CGV/
//  rétractation avant paiement, gestion d'abonnement
//  ---------------------------------------------------------------------
//  Lancer : node tests/legal-compliance.test.js
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

function loadPage(file){
  const html = fs.readFileSync(path.join(ROOT, file), 'utf8');
  const dom = new JSDOM(html, { url:'http://localhost/', runScripts:'outside-only', resources:'usable', pretendToBeVisual:true });
  const scripts = [...dom.window.document.querySelectorAll('script[src]')].map(s=>s.getAttribute('src'));
  for(const src of scripts){
    let code = fs.readFileSync(path.join(ROOT, src), 'utf8');
    if(src === 'js/storage.js'){
      // v6.45.1 : force le mode navigateur quelles que soient les vraies
      // clés Supabase baked-in dans storage.js.
      code = code.replace(/const SUPABASE_URL = "[^"]*";/, 'const SUPABASE_URL = "";')
                  .replace(/const SUPABASE_ANON_KEY = "[^"]*";/, 'const SUPABASE_ANON_KEY = "";');
    }
    dom.window.eval(code);
  }
  return dom;
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
    dom.window.eval(code);
  }
  dom.window.eval("Prefs.load(); __testSetUserCode('T'); __testSetUser({});");
  return dom;
}

async function main(){

console.log('Pied de page commun (mentions légales / CGV / CGU)');

const pagesWithFooter = ['index.html', 'aidant.html', 'mon-resume.html', 'contribuer.html', 'dashboard-ortho.html'];
for(const page of pagesWithFooter){
  await test(`${page} : charge js/footer.js et affiche les 3 liens légaux`, async ()=>{
    const dom = loadPage(page);
    const footer = dom.window.document.querySelector('.site-footer');
    assert.ok(footer, `${page} doit avoir un pied de page`);
    const hrefs = [...footer.querySelectorAll('a')].map(a=>a.getAttribute('href'));
    assert.ok(hrefs.includes('mentions-legales.html'), 'lien vers les mentions légales manquant');
    assert.ok(hrefs.includes('cgv.html'), 'lien vers les CGV manquant');
    assert.ok(hrefs.includes('cgu.html'), 'lien vers les CGU manquant');
  });
}

await test('admin.html : pas de pied de page (outil interne, pas un espace client)', ()=>{
  const dom = loadPage('admin.html');
  assert.strictEqual(dom.window.document.querySelector('.site-footer'), null);
});

await test('report.html : pas de pied de page (destiné à l\'impression)', ()=>{
  const dom = loadPage('report.html');
  assert.strictEqual(dom.window.document.querySelector('.site-footer'), null);
});

console.log('\nConsentement obligatoire avant paiement (CGV + renonciation au délai de rétractation)');

await test('aucune case cochée : startCheckout() bloque avec un message d\'erreur explicite', async ()=>{
  const dom = loadPatientApp();
  await dom.window.eval("startCheckout('patient_monthly')");
  const err = dom.window.document.getElementById('pricing-error').textContent;
  assert.ok(err.length > 0, 'un message d\'erreur doit s\'afficher');
});

await test('seulement CGV cochée : bloque toujours (il manque la renonciation)', async ()=>{
  const dom = loadPatientApp();
  dom.window.document.getElementById('pricing-accept-cgv').checked = true;
  await dom.window.eval("startCheckout('patient_monthly')");
  const err = dom.window.document.getElementById('pricing-error').textContent;
  assert.ok(err.length > 0, 'un message d\'erreur doit s\'afficher tant que la renonciation n\'est pas cochée');
});

await test('les deux cases cochées : startCheckout() peut continuer (pas bloqué par le consentement)', async ()=>{
  const dom = loadPatientApp();
  dom.window.document.getElementById('pricing-accept-cgv').checked = true;
  dom.window.document.getElementById('pricing-waive-withdrawal').checked = true;
  // mode navigateur (pas de cloud) -> Store.createCheckoutSession renvoie une erreur
  // explicite, mais celle-ci vient APRÈS la validation des cases : le test
  // vérifie que le message affiché est bien celui de Store, pas celui du
  // consentement manquant.
  await dom.window.eval("startCheckout('patient_monthly')");
  const err = dom.window.document.getElementById('pricing-error').textContent;
  assert.ok(!err.includes('CGV') && !err.includes('rétractation'), `ne doit plus bloquer sur le consentement, obtenu : "${err}"`);
});

console.log('\nGestion de l\'abonnement (Customer Portal Stripe)');

await test('manageSubscription() sans stripe_customer_id : erreur claire, pas de plantage', async ()=>{
  const dom = loadPatientApp();
  dom.window.eval("__testSetUser({plan:'pro'});"); // pro mais sans stripe_customer_id (ne devrait jamais arriver en pratique, cas défensif)
  await dom.window.eval("manageSubscription()");
  const err = dom.window.document.getElementById('manage-subscription-error').textContent;
  assert.ok(err.length > 0, 'un message d\'erreur doit s\'afficher plutôt que de planter');
});

console.log(`\n${passed} test(s) réussi(s), ${failed} échec(s).`);
if(failed > 0) process.exitCode = 1;

}

main();
