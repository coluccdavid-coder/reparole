// =====================================================================
//  TESTS — "Entrée" valide le formulaire (v6.99)
//  ---------------------------------------------------------------------
//  Réponse à "j'aimerais que l'option ENTRÉE fonctionne quand on
//  renseigne des éléments". Aucun <form> n'est utilisé nulle part dans
//  l'app — mécanisme générique construit une seule fois
//  (js/enter-submit.js) : data-enter-submit="id-du-bouton" sur un
//  <input>, un seul listener délégué sur document.
//
//  Vérifie le mécanisme lui-même (via une petite page de test isolée)
//  et un échantillon représentatif des champs câblés sur chaque page —
//  pas l'exhaustivité totale (trop de champs), mais assez pour détecter
//  une régression si le mécanisme central casse.
//
//  Lancer : node tests/enter-key-submit.test.js
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

console.log('Mécanisme central (js/enter-submit.js)');

function makeIsolatedDom(){
  const html = `<!DOCTYPE html><body>
    <input id="my-input" type="text" data-enter-submit="my-btn">
    <input id="no-target-input" type="text">
    <input id="disabled-target-input" type="text" data-enter-submit="disabled-btn">
    <button id="my-btn">Go</button>
    <button id="disabled-btn" disabled>Go</button>
  </body>`;
  const dom = new JSDOM(html, { url:'http://localhost/', runScripts:'outside-only' });
  dom.window.eval(fs.readFileSync(path.join(ROOT, 'js/enter-submit.js'), 'utf8'));
  return dom;
}

test('appuyer sur Entrée dans un champ marqué déclenche bien le clic du bouton ciblé', ()=>{
  const dom = makeIsolatedDom();
  let clicked = false;
  dom.window.document.getElementById('my-btn').addEventListener('click', ()=>{ clicked = true; });
  const input = dom.window.document.getElementById('my-input');
  input.dispatchEvent(new dom.window.KeyboardEvent('keydown', { key:'Enter', bubbles:true }));
  assert.strictEqual(clicked, true);
});

test('une autre touche que Entrée ne déclenche rien', ()=>{
  const dom = makeIsolatedDom();
  let clicked = false;
  dom.window.document.getElementById('my-btn').addEventListener('click', ()=>{ clicked = true; });
  const input = dom.window.document.getElementById('my-input');
  input.dispatchEvent(new dom.window.KeyboardEvent('keydown', { key:'a', bubbles:true }));
  assert.strictEqual(clicked, false);
});

test('un champ sans data-enter-submit ne déclenche rien (pas de plantage)', ()=>{
  const dom = makeIsolatedDom();
  const input = dom.window.document.getElementById('no-target-input');
  assert.doesNotThrow(()=>{
    input.dispatchEvent(new dom.window.KeyboardEvent('keydown', { key:'Enter', bubbles:true }));
  });
});

test('un bouton cible désactivé n\'est pas cliqué', ()=>{
  const dom = makeIsolatedDom();
  let clicked = false;
  dom.window.document.getElementById('disabled-btn').addEventListener('click', ()=>{ clicked = true; });
  const input = dom.window.document.getElementById('disabled-target-input');
  input.dispatchEvent(new dom.window.KeyboardEvent('keydown', { key:'Enter', bubbles:true }));
  assert.strictEqual(clicked, false);
});

console.log('\nÉchantillon des champs câblés (une page par espace)');

function pairsWired(html, pairs){
  for(const [inputId, btnId] of pairs){
    const inputMatch = new RegExp(`id="${inputId}"[^>]*data-enter-submit="${btnId}"`);
    assert.ok(inputMatch.test(html), `#${inputId} devrait cibler #${btnId}`);
    const btnMatch = new RegExp(`id="${btnId}"`);
    assert.ok(btnMatch.test(html), `le bouton #${btnId} doit exister`);
  }
}

test('index.html : connexion patient, ajout photo, suppression compte', ()=>{
  const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  assert.ok(/<script src="js\/enter-submit\.js">/.test(html));
  pairsWired(html, [
    ['name', 'login-btn'], ['code', 'login-btn'],
    ['media-label', 'add-photo-btn'],
    ['account-delete-confirm', 'account-delete-btn'],
  ]);
});

test('aidant.html : connexion aidant, ajout de mot', ()=>{
  const html = fs.readFileSync(path.join(ROOT, 'aidant.html'), 'utf8');
  assert.ok(/<script src="js\/enter-submit\.js">/.test(html));
  pairsWired(html, [
    ['caregiver-code', 'caregiver-login-btn'],
    ['cg-word-text', 'cg-add-word-btn'],
  ]);
});

test('dashboard-ortho.html : connexion, MFA, rattachement, création de fiche', ()=>{
  const html = fs.readFileSync(path.join(ROOT, 'dashboard-ortho.html'), 'utf8');
  assert.ok(/<script src="js\/enter-submit\.js">/.test(html));
  pairsWired(html, [
    ['o-email', 'o-submit'], ['o-password', 'o-submit'],
    ['mfa-code', 'mfa-validate-btn'],
    ['assign-code', 'assign-btn'],
    ['create-patient-name', 'create-patient-btn'],
  ]);
});

test('admin.html : connexion et MFA', ()=>{
  const html = fs.readFileSync(path.join(ROOT, 'admin.html'), 'utf8');
  assert.ok(/<script src="js\/enter-submit\.js">/.test(html));
  pairsWired(html, [
    ['a-email', 'admin-login-btn'], ['a-password', 'admin-login-btn'],
    ['admin-mfa-code', 'admin-mfa-validate-btn'],
  ]);
});

test('reset-password.html : nouveau mot de passe', ()=>{
  const html = fs.readFileSync(path.join(ROOT, 'reset-password.html'), 'utf8');
  assert.ok(/<script src="js\/enter-submit\.js">/.test(html));
  pairsWired(html, [
    ['rp-password', 'rp-submit-btn'], ['rp-password-confirm', 'rp-submit-btn'],
  ]);
});

test('les champs multi-lignes (textarea) ne sont jamais câblés — Entrée doit rester un retour à la ligne', ()=>{
  const index = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  assert.ok(!/id="journal-text"[^>]*data-enter-submit/.test(index), 'le journal reste multi-ligne');
  assert.ok(!/id="suggestion-message"[^>]*data-enter-submit/.test(index), 'la boîte à idées reste multi-ligne');
  const ortho = fs.readFileSync(path.join(ROOT, 'dashboard-ortho.html'), 'utf8');
  assert.ok(!/id="new-note"[^>]*data-enter-submit/.test(ortho), 'les notes cliniques restent multi-lignes');
});

console.log(`\n${passed} test(s) réussi(s), ${failed} échec(s).`);
if(failed > 0) process.exitCode = 1;
