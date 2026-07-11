// =====================================================================
//  TESTS — Mot de passe oublié / reset-password.html (v6.81)
//  ---------------------------------------------------------------------
//  VRAI BUG trouvé en usage réel : un email de récupération de mot de
//  passe redirigeait vers l'accueil de l'app, sans nulle part où
//  saisir le nouveau mot de passe — reset-password.html n'existait
//  pas. Ajouté : la page elle-même, ReParoleStore.resetPasswordForEmail
//  / updatePassword (js/storage.js), et un lien "Mot de passe oublié ?"
//  sur admin.html et dashboard-ortho.html.
//
//  Simule un faux client Supabase (comme tests/plan-and-mfa.test.js)
//  pour tester notre logique sans dépendre d'un vrai projet.
//
//  Lancer : node tests/password-reset.test.js
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

const FAKE_SUPABASE_SRC = `
  window.__lastResetEmail = null;
  window.__lastResetOptions = null;
  window.__lastNewPassword = null;
  window.__updateUserShouldFail = false;
  window.supabase = {
    createClient(){
      return {
        auth: {
          async resetPasswordForEmail(email, options){
            window.__lastResetEmail = email;
            window.__lastResetOptions = options;
            return { error: null };
          },
          async updateUser({ password }){
            window.__lastNewPassword = password;
            if(window.__updateUserShouldFail) return { error:{ message:'Session expirée' } };
            return { error: null };
          },
          onAuthStateChange(cb){ window.__authStateCb = cb; return { data:{ subscription:{ unsubscribe(){} } } }; },
          async getSession(){ return { data:{ session:null } }; },
          async signInWithPassword(){ return { data:{ session:{ user:{ id:'ortho-1' } } }, error:null }; },
          async signOut(){ return {}; }
        },
        from(){ return { select(){ return this; }, eq(){ return this; }, single(){ return { data:null, error:null }; } }; }
      };
    }
  };
`;

function loadResetPage(){
  const html = fs.readFileSync(path.join(ROOT, 'reset-password.html'), 'utf8');
  const dom = new JSDOM(html, { url:'http://localhost/', runScripts:'outside-only', resources:'usable', pretendToBeVisual:true });
  dom.window.eval(FAKE_SUPABASE_SRC);
  const scripts = [...dom.window.document.querySelectorAll('script[src]')].map(s=>s.getAttribute('src'));
  const inlineMatch = html.match(/<script>([\s\S]*?)<\/script>\s*<\/body>/);
  // v6.81 : storage.js et le script inline de la page partagent `supa`
  // (un `let` de haut niveau) — comme deux vraies balises <script> dans
  // un navigateur, mais ça exige un seul et même eval() ici, sinon
  // `supa` reste invisible du second script (même piège documenté
  // ailleurs pour `Store`/`user`/`current`).
  let combined = '';
  for(const src of scripts){ combined += fs.readFileSync(path.join(ROOT, src), 'utf8') + '\n'; }
  combined += inlineMatch[1];
  dom.window.eval(combined);
  return dom;
}

async function main(){

console.log('reset-password.html — structure');

await test('les 4 états (checking/invalid/form/success) existent', ()=>{
  const html = fs.readFileSync(path.join(ROOT, 'reset-password.html'), 'utf8');
  ['rp-checking','rp-invalid','rp-form','rp-success'].forEach(id=>{
    assert.ok(html.includes(`id="${id}"`), `#${id} manquant`);
  });
});

console.log('\nValidation du mot de passe (RPPage._checkPasswordStrength)');

await test('mot de passe trop court -> erreur', ()=>{
  const dom = loadResetPage();
  const err = dom.window.RPPage._checkPasswordStrength('Ab1');
  assert.ok(err && /8 caractères/.test(err));
});

await test('mot de passe sans majuscule -> erreur', ()=>{
  const dom = loadResetPage();
  const err = dom.window.RPPage._checkPasswordStrength('abcdefg1');
  assert.ok(err && /majuscule/.test(err));
});

await test('mot de passe valide -> pas d\'erreur', ()=>{
  const dom = loadResetPage();
  const err = dom.window.RPPage._checkPasswordStrength('Abcdefg1');
  assert.strictEqual(err, null);
});

console.log('\nSoumission du formulaire');

await test('mots de passe qui ne correspondent pas -> message d\'erreur, pas d\'appel à updateUser', async ()=>{
  const dom = loadResetPage();
  dom.window.document.getElementById('rp-password').value = 'Abcdefg1';
  dom.window.document.getElementById('rp-password-confirm').value = 'Autrechose1';
  await dom.window.RPPage.submit();
  assert.ok(/correspondent pas/.test(dom.window.document.getElementById('rp-error').textContent));
  assert.strictEqual(dom.window.__lastNewPassword, null);
});

await test('mot de passe valide et confirmé -> updateUser appelé, écran de succès affiché', async ()=>{
  const dom = loadResetPage();
  dom.window.document.getElementById('rp-password').value = 'Abcdefg1';
  dom.window.document.getElementById('rp-password-confirm').value = 'Abcdefg1';
  await dom.window.RPPage.submit();
  assert.strictEqual(dom.window.__lastNewPassword, 'Abcdefg1');
  assert.notStrictEqual(dom.window.document.getElementById('rp-success').style.display, 'none');
});

await test('erreur Supabase (ex. session expirée) -> message affiché, pas de faux succès', async ()=>{
  const dom = loadResetPage();
  dom.window.eval('window.__updateUserShouldFail = true;');
  dom.window.document.getElementById('rp-password').value = 'Abcdefg1';
  dom.window.document.getElementById('rp-password-confirm').value = 'Abcdefg1';
  await dom.window.RPPage.submit();
  assert.ok(/Session expirée/.test(dom.window.document.getElementById('rp-error').textContent));
  assert.strictEqual(dom.window.document.getElementById('rp-success').style.display, 'none');
});

console.log('\nDéclenchement de l\'email (ReParoleStore.resetPasswordForEmail)');

await test('le lien de redirection pointe bien vers reset-password.html', async ()=>{
  const dom = loadResetPage();
  await dom.window.ReParoleStore.resetPasswordForEmail('test@cabinet.fr');
  assert.strictEqual(dom.window.__lastResetEmail, 'test@cabinet.fr');
  assert.ok(dom.window.__lastResetOptions.redirectTo.endsWith('reset-password.html'), dom.window.__lastResetOptions.redirectTo);
});

console.log('\nLien "Mot de passe oublié ?" sur les écrans de connexion');

await test('admin.html : lien présent, appelle AdminPanel.forgotPassword()', ()=>{
  const html = fs.readFileSync(path.join(ROOT, 'admin.html'), 'utf8');
  assert.ok(html.includes('onclick="AdminPanel.forgotPassword();return false"'));
});

await test('dashboard-ortho.html : lien présent (traduit), appelle OrthoApp.forgotPassword()', ()=>{
  const html = fs.readFileSync(path.join(ROOT, 'dashboard-ortho.html'), 'utf8');
  assert.ok(html.includes('onclick="OrthoApp.forgotPassword();return false"'));
  assert.ok(html.includes('data-i18n="ortho_forgot_password_link"'));
});

console.log(`\n${passed} test(s) réussi(s), ${failed} échec(s).`);
if(failed > 0) process.exit(1);

}

main();
