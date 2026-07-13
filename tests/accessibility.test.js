// =====================================================================
//  TESTS — Accessibilité : régions live, focus visible, noms
//  accessibles, suppression des alert() natifs (v6.79)
//  ---------------------------------------------------------------------
//  Audit fait avant ces correctifs : les messages de statut dynamiques
//  (erreurs, confirmations) n'étaient annoncés à aucun lecteur d'écran
//  (seuls 2 sur toute l'app l'étaient), plusieurs champs de formulaire
//  n'avaient aucun nom accessible, le focus clavier reposait sur un
//  simple changement de couleur de bordure (souvent trop discret), et
//  6 alert()/confirm() natifs traînaient encore.
//
//  Lancer : node tests/accessibility.test.js
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
          user = Object.assign({name:'Test',level:1,sessions:0,correct:0,total:0,streak:1,plan:'free'}, overrides||{});
        };
        window.__testSetUserCode = function(code){ userCode = code; };
      `;
    }
    dom.window.eval(code);
  }
  dom.window.eval("Prefs.load(); __testSetUserCode('T'); __testSetUser({});");
  return dom;
}

function loadPage(file){
  const html = fs.readFileSync(path.join(ROOT, file), 'utf8');
  const dom = new JSDOM(html, { url:'http://localhost/', runScripts:'outside-only', resources:'usable', pretendToBeVisual:true });
  const scripts = [...dom.window.document.querySelectorAll('script[src]')].map(s=>s.getAttribute('src'));
  for(const src of scripts){
    let code = fs.readFileSync(path.join(ROOT, src), 'utf8');
    if(src === 'js/storage.js'){
      code = code.replace(/const SUPABASE_URL = "[^"]*";/, 'const SUPABASE_URL = "";')
                  .replace(/const SUPABASE_ANON_KEY = "[^"]*";/, 'const SUPABASE_ANON_KEY = "";');
    }
    dom.window.eval(code);
  }
  return dom;
}

async function main(){

console.log("Régions live (role=status aria-live) sur les messages dynamiques");

const LIVE_TARGETS = {
  'index.html': ['journal-status','login-error','manage-subscription-error','media-status','pricing-error','save-status','restore-status','caregiver-access-status'],
  'aidant.html': ['caregiver-login-error','cg-word-status'],
  'dashboard-ortho.html': ['assign-msg','mfa-enroll-msg','mfa-status','ortho-auth-error','ortho-mfa-error','ortho-pricing-error','patient-list-status'],
  'contribuer.html': ['contribute-status'],
  'admin.html': ['admin-queue-status'],
};

for(const [page, ids] of Object.entries(LIVE_TARGETS)){
  await test(`${page} : tous les messages de statut ont role="status" aria-live="polite"`, ()=>{
    const html = fs.readFileSync(path.join(ROOT, page), 'utf8');
    ids.forEach(id=>{
      const re = new RegExp(`id="${id}"[^>]*role="status"[^>]*aria-live="polite"`);
      assert.ok(re.test(html), `manquant ou mal formé pour #${id}`);
    });
  });
}

console.log('\nNoms accessibles sur les champs de formulaire');

await test("index.html : champs auparavant sans nom accessible en ont maintenant un (aria-label traduit)", ()=>{
  const dom = loadPatientApp();
  ['journal-text','media-label','media-file','reminder-email'].forEach(id=>{
    const el = dom.window.document.getElementById(id);
    assert.ok(el, `#${id} introuvable`);
    assert.ok(el.getAttribute('aria-label') && el.getAttribute('aria-label').length > 0, `#${id} n'a pas de aria-label après I18N.apply()`);
  });
});

await test("aidant.html : cg-word-emoji et cg-word-text ont un nom accessible", ()=>{
  const dom = loadPage('aidant.html');
  const scripts = [...dom.window.document.querySelectorAll('script[src]')].map(s=>s.getAttribute('src'));
  // recharge avec prefs/i18n pour déclencher data-i18n-aria-label
  const dom2 = loadPage('aidant.html');
  for(const src of scripts){
    dom2.window.eval(fs.readFileSync(path.join(ROOT, src), 'utf8'));
  }
  dom2.window.eval('Prefs.load();');
  ['cg-word-emoji','cg-word-text'].forEach(id=>{
    const el = dom2.window.document.getElementById(id);
    assert.ok(el.getAttribute('aria-label'), `#${id} n'a pas de aria-label`);
  });
});

await test("dashboard-ortho.html : mfa-confirm-code, d-clinical, new-note, assign-code ont un nom accessible", ()=>{
  const dom = loadPage('dashboard-ortho.html');
  const scripts = [...dom.window.document.querySelectorAll('script[src]')].map(s=>s.getAttribute('src'));
  for(const src of scripts){
    let code = fs.readFileSync(path.join(ROOT, src), 'utf8');
    if(src === 'js/storage.js'){
      code = code.replace(/const SUPABASE_URL = "[^"]*";/, 'const SUPABASE_URL = "";')
                  .replace(/const SUPABASE_ANON_KEY = "[^"]*";/, 'const SUPABASE_ANON_KEY = "";');
    }
    dom.window.eval(code);
  }
  dom.window.eval('Prefs.load();');
  ['mfa-confirm-code','d-clinical','new-note','assign-code'].forEach(id=>{
    const el = dom.window.document.getElementById(id);
    assert.ok(el.getAttribute('aria-label'), `#${id} n'a pas de aria-label`);
  });
});

console.log('\nFocus clavier visible');

await test('.field input:focus a maintenant un box-shadow en plus du changement de bordure', ()=>{
  const css = fs.readFileSync(path.join(ROOT, 'css/style.css'), 'utf8');
  const m = css.match(/\.field input:focus[^{]*\{([^}]*)\}/);
  assert.ok(m, 'règle .field input:focus introuvable');
  assert.ok(/box-shadow/.test(m[1]), 'box-shadow manquant sur le focus des champs');
});

console.log("\nAucun alert()/confirm() natif restant côté patient");

await test("plus aucun alert() dans js/app.js, js/dashboard-ortho.js, js/admin.js", ()=>{
  ['js/app.js','js/dashboard-ortho.js','js/admin.js'].forEach(f=>{
    const code = fs.readFileSync(path.join(ROOT, f), 'utf8');
    const realCalls = code.split('\n').filter(l => /\balert\(/.test(l) && !l.trim().startsWith('//'));
    assert.strictEqual(realCalls.length, 0, `alert() restant dans ${f} : ${JSON.stringify(realCalls)}`);
  });
});

await test('login() sans code affiche le message en ligne (login-error), plus de blocage alert()', ()=>{
  const dom = loadPatientApp();
  dom.window.document.getElementById('code').value = '';
  return dom.window.login().then(()=>{
    const msg = dom.window.document.getElementById('login-error').textContent;
    assert.ok(msg.length > 0);
  });
});

console.log(`\n${passed} test(s) réussi(s), ${failed} échec(s).`);
if(failed > 0) process.exit(1);

}

main();
