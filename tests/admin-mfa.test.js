// =====================================================================
//  TESTS — Double authentification pour l'espace admin (v6.82)
//  ---------------------------------------------------------------------
//  Reprend le même mécanisme déjà testé côté orthophoniste
//  (tests/plan-and-mfa.test.js) — les fonctions ReParoleStore.mfaEnroll/
//  mfaChallenge/mfaVerify/mfaListFactors/mfaUnenroll sont génériques et
//  déjà couvertes là-bas. Ce fichier vérifie spécifiquement ce qui est
//  nouveau : signInAdmin qui déclenche un défi MFA, et
//  completeMfaSignInAdmin qui vérifie la table `admins` (pas
//  `orthophonists`).
//
//  Lancer : node tests/admin-mfa.test.js
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

function loadAdminAppWithFakeSupabase(){
  const html = fs.readFileSync(path.join(ROOT, 'admin.html'), 'utf8');
  const dom = new JSDOM(html, { url:'http://localhost/', runScripts:'outside-only', resources:'usable', pretendToBeVisual:true });

  const fakeSupabaseSrc = `
    window.__mfaEnrolled = false;
    window.__mfaVerifiedThisLogin = false;
    window.__admins = { 'admin-1': { code:'admin-1', name:'Admin Test', email:'admin@test.fr' } };
    window.supabase = {
      createClient(){
        return {
          auth: {
            async signInWithPassword({email,password}){
              const id = email === 'inconnu@test.fr' ? 'user-no-admin' : 'admin-1';
              return { data:{ session:{ user:{ id, email } } }, error:null };
            },
            async getSession(){ return { data:{ session:{ user:{ id:'admin-1', email:'admin@test.fr' } } } }; },
            async signOut(){ return {}; },
            mfa: {
              async enroll({factorType}){ return { data:{ id:'factor-1', totp:{ qr_code:'<svg>QR</svg>', secret:'ABCD1234SECRET' } }, error:null }; },
              async challenge({factorId}){ return { data:{ id:'challenge-1' }, error:null }; },
              async verify({factorId, challengeId, code}){
                if(code==='111111'){ window.__mfaEnrolled = true; window.__mfaVerifiedThisLogin = true; return { data:{}, error:null }; }
                return { data:null, error:{ message:'Code invalide' } };
              },
              async listFactors(){ return { data:{ totp: window.__mfaEnrolled ? [{ id:'factor-1', status:'verified' }] : [] }, error:null }; },
              async unenroll({factorId}){ window.__mfaEnrolled = false; return { data:{}, error:null }; },
              async getAuthenticatorAssuranceLevel(){
                return window.__mfaEnrolled && !window.__mfaVerifiedThisLogin
                  ? { data:{ currentLevel:'aal1', nextLevel:'aal2' } }
                  : { data:{ currentLevel:'aal1', nextLevel:'aal1' } };
              }
            }
          },
          // v6.97 : signInAdmin() appelle désormais logLoginEvent() en
          // arrière-plan (sans attendre) après une connexion réussie —
          // stub minimal ici pour ne pas planter ce test, qui ne teste
          // pas cet historique en particulier (voir
          // tests/login-history-and-errors.test.js pour ça).
          async rpc(name){ return { data:null, error:null }; },
          from(table){
            return {
              select(){ return this; },
              eq(k,v){ this._id=v; return this; },
              async maybeSingle(){ return { data: window.__admins[this._id] || null }; }
            };
          }
        };
      }
    };
  `;
  dom.window.eval(fakeSupabaseSrc);

  let storageCode = fs.readFileSync(path.join(ROOT, 'js/storage.js'), 'utf8');
  storageCode = storageCode.replace('const SUPABASE_URL = "";', 'const SUPABASE_URL = "https://fake.supabase.co";');
  storageCode = storageCode.replace(/const SUPABASE_URL = "[^"]*";/, 'const SUPABASE_URL = "https://fake.supabase.co";');
  storageCode = storageCode.replace(/const SUPABASE_ANON_KEY = "[^"]*";/, 'const SUPABASE_ANON_KEY = "fake-key";');
  dom.window.eval(storageCode);
  dom.window.eval(fs.readFileSync(path.join(ROOT, 'js/admin.js'), 'utf8'));

  return dom;
}

async function main(){

console.log('Double authentification admin (via faux client Supabase)');

const dom = loadAdminAppWithFakeSupabase();
const Store = dom.window.ReParoleStore;

let enrollData;
await test('inscription MFA : renvoie un QR code et une clé secrète', async ()=>{
  const res = await Store.mfaEnroll();
  assert.ok(!res.error);
  assert.ok(res.data.totp.qr_code && res.data.totp.secret);
  enrollData = res.data;
});

let challengeData;
await test('création du défi de vérification', async ()=>{
  const res = await Store.mfaChallenge(enrollData.id);
  assert.ok(!res.error);
  challengeData = res.data;
});

await test('code erroné rejeté', async ()=>{
  const res = await Store.mfaVerify(enrollData.id, challengeData.id, '000000');
  assert.ok(res.error);
});

await test('bon code accepté (active la double authentification)', async ()=>{
  const res = await Store.mfaVerify(enrollData.id, challengeData.id, '111111');
  assert.ok(!res.error);
});

await test('nouvelle connexion admin : exige le code (aal2), renvoie mfaRequired', async ()=>{
  dom.window.eval('window.__mfaVerifiedThisLogin = false;');
  const res = await Store.signInAdmin('admin@test.fr', 'peu-importe');
  assert.strictEqual(res.mfaRequired, true);
  assert.ok(res.factorId && res.challengeId);
  dom.window.__lastSignIn = res;
});

await test('connexion admin complétée avec le bon code -> vérifie bien la table admins', async ()=>{
  const pending = dom.window.__lastSignIn;
  const res = await Store.completeMfaSignInAdmin(pending.factorId, pending.challengeId, '111111');
  assert.ok(!res.error);
  assert.strictEqual(res.code, 'admin-1');
  assert.strictEqual(res.name, 'Admin Test');
});

await test('connexion admin complétée avec un mauvais code -> erreur', async ()=>{
  const res = await Store.completeMfaSignInAdmin('factor-1', 'challenge-1', '000000');
  assert.ok(res.error);
});

await test('un compte Supabase Auth valide mais absent de `admins` : refusé même après MFA', async ()=>{
  dom.window.eval("window.__admins['user-no-admin'] = undefined;");
  const res = await Store.completeMfaSignInAdmin('factor-1', 'challenge-1', '111111');
  // le compte n'est pas dans `admins` -> refusé, quel que soit le MFA
  const check = await dom.window.eval("supabase.createClient().from('admins').select('*').eq('code','user-no-admin').maybeSingle()");
  assert.strictEqual(check.data, null);
});

await test('désactivation : plus aucun facteur après unenroll', async ()=>{
  const before = await Store.mfaListFactors();
  for(const f of before.data.totp) await Store.mfaUnenroll(f.id);
  const after = await Store.mfaListFactors();
  assert.strictEqual(after.data.totp.length, 0);
});

console.log('\nInterface (admin.html / js/admin.js)');

await test('l\'écran de défi MFA existe avec les bons éléments', ()=>{
  const html = fs.readFileSync(path.join(ROOT, 'admin.html'), 'utf8');
  assert.ok(html.includes('id="admin-mfa-challenge"'));
  assert.ok(html.includes('id="admin-mfa-code"'));
  assert.ok(html.includes('onclick="AdminPanel.submitMfaCode()"'));
});

await test('la carte "Sécurité du compte" existe sur le tableau de bord admin', ()=>{
  const html = fs.readFileSync(path.join(ROOT, 'admin.html'), 'utf8');
  assert.ok(html.includes('id="admin-mfa-status"'));
  assert.ok(html.includes('onclick="AdminPanel.startMfaEnroll()"'));
  assert.ok(html.includes('onclick="AdminPanel.confirmMfaEnroll()"'));
  assert.ok(html.includes('onclick="AdminPanel.disableMfa()"'));
});

await test('login() bascule vers l\'écran de défi MFA si mfaRequired, sans terminer la connexion', async ()=>{
  const dom2 = loadAdminAppWithFakeSupabase();
  await dom2.window.ReParoleStore.mfaEnroll();
  await dom2.window.ReParoleStore.mfaVerify('factor-1', 'challenge-1', '111111');
  dom2.window.eval('window.__mfaVerifiedThisLogin = false;');
  dom2.window.document.getElementById('a-email').value = 'admin@test.fr';
  dom2.window.document.getElementById('a-password').value = 'peu-importe';
  await dom2.window.AdminPanel.login();
  assert.strictEqual(dom2.window.document.getElementById('admin-mfa-challenge').classList.contains('active'), true);
  assert.strictEqual(dom2.window.document.getElementById('admin-dashboard').classList.contains('active'), false);
});

console.log(`\n${passed} test(s) réussi(s), ${failed} échec(s).`);
if(failed > 0) process.exit(1);

}

main();
