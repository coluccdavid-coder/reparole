// =====================================================================
//  TESTS — structure gratuit/pro + double authentification (v6.24)
//  ---------------------------------------------------------------------
//  Contrairement aux autres tests de ce dossier, celui-ci simule un faux
//  client Supabase (window.supabase.createClient) plutôt que d'exiger un
//  vrai projet : ça permet de vérifier la LOGIQUE (verrous, drapeaux,
//  enchaînement des appels) sans dépendre d'identifiants réels. Un test
//  manuel sur un vrai compte reste recommandé avant mise en production
//  (voir SKILL_ReParole_v6.md).
//
//  Lancer : node tests/plan-and-mfa.test.js
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

// ---------------------------------------------------------------------
//  Partie 1 : verrous gratuit/pro côté patient (js/app.js)
//  On charge la vraie app dans un DOM simulé et on appelle les vraies
//  fonctions (lockReason, isPro, etc.) — pas de mock ici, ce sont des
//  fonctions pures, pas d'appel réseau.
// ---------------------------------------------------------------------
function loadPatientApp(){
  const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  const dom = new JSDOM(html, { url:'http://localhost/', runScripts:'outside-only', resources:'usable', pretendToBeVisual:true });
  const scripts = [...dom.window.document.querySelectorAll('script[src]')].map(s=>s.getAttribute('src'));
  for(const src of scripts){
    let code = fs.readFileSync(path.join(ROOT, src), 'utf8');
    // v6.24.1 : `user` est déclaré en `let` dans app.js — invisible depuis
    // un eval() séparé (même piège que `Store`/`ReParoleStore` plus haut).
    // On expose ces deux petites fonctions DANS le même eval() qu'app.js
    // pour pouvoir manipuler le vrai `user` depuis les tests, au lieu de
    // créer par erreur un `window.user` fantôme qui ne trompe que
    // half des vérifications (celles qui ne dépendent pas de `user`).
    if(src === 'js/app.js'){
      code += `
        window.__testSetUser = function(overrides){
          user = Object.assign({name:'Test',level:2,sessions:0,correct:0,total:0,streak:1,plan:'free'}, overrides||{});
        };
        window.__testSetPlan = function(p){ user.plan = p; };
        window.__testSetQuota = function(count, date){ user.dailySessionsCount = count; user.dailySessionsDate = date; };
        window.__testSetPaywallEnabled = function(v){ PAYWALL_ENABLED = v; };
      `;
    }
    dom.window.eval(code);
  }
  dom.window.eval("Prefs.load(); userCode='T';");
  return dom;
}

console.log('Structure gratuit/pro (patient)');
{
  const dom = loadPatientApp();

  // v6.33 : le paywall est désactivé par défaut (décision utilisateur du
  // 7 juillet — tout accessible, mode payant repoussé à plus tard).
  // On le vérifie d'abord tel quel, PUIS on le force à `true` pour les
  // tests suivants : ils vérifient que la logique de verrouillage
  // sous-jacente (langues/types/quota) reste correcte et réactivable
  // d'un coup, même si elle n'est pas utilisée actuellement.
  test('paywall désactivé par défaut : tout est accessible même en gratuit', () => {
    dom.window.eval("__testSetUser({plan:'free'}); Prefs.setLang('es');");
    const r1 = dom.window.eval("lockReason('repetition')");
    const r2 = dom.window.eval("lockReason('conversation')");
    const r3 = dom.window.eval("lockReason('denomination')"); // langue non-fr
    assert.strictEqual(r1, null);
    assert.strictEqual(r2, null);
    assert.strictEqual(r3, null);
    dom.window.eval("Prefs.setLang('fr');");
  });

  dom.window.eval("__testSetPaywallEnabled(true); __testSetUser({plan:'free'});");

  test('(paywall réactivé) compte gratuit + français + exercice texte = accessible', () => {
    const r = dom.window.eval("lockReason('denomination')");
    assert.strictEqual(r, null);
  });
  test('(paywall réactivé) compte gratuit + français + exercice vocal avancé = verrouillé (type)', () => {
    const r = dom.window.eval("lockReason('repetition')");
    assert.strictEqual(r, 'type');
  });
  test('(paywall réactivé) compte gratuit + conversation guidée = verrouillé (type)', () => {
    const r = dom.window.eval("lockReason('conversation')");
    assert.strictEqual(r, 'type');
  });
  test('(paywall réactivé) compte gratuit + langue non-française = verrouillé (lang)', () => {
    dom.window.eval("Prefs.setLang('es');");
    const r = dom.window.eval("lockReason('denomination')");
    assert.strictEqual(r, 'lang');
    dom.window.eval("Prefs.setLang('fr');");
  });
  test('(paywall réactivé) compte pro = jamais verrouillé, même vocal + langue étrangère', () => {
    dom.window.eval("__testSetPlan('pro'); Prefs.setLang('es');");
    const r1 = dom.window.eval("lockReason('repetition')");
    const r2 = dom.window.eval("lockReason('conversation')");
    assert.strictEqual(r1, null);
    assert.strictEqual(r2, null);
    dom.window.eval("__testSetPlan('free'); Prefs.setLang('fr');");
  });
  test('(paywall réactivé) quota journalier : 5 séances gratuites puis verrouillé (quota)', () => {
    dom.window.eval("__testSetQuota(0, new Date().toISOString().slice(0,10));");
    for(let i=0;i<5;i++) dom.window.eval("recordDailySession();");
    const r = dom.window.eval("lockReason('denomination')");
    assert.strictEqual(r, 'quota');
  });
  test('(paywall réactivé) quota : jour différent = compteur remis à zéro', () => {
    dom.window.eval("__testSetQuota(5, '2000-01-01');");
    const used = dom.window.eval("dailySessionsUsedToday()");
    assert.strictEqual(used, 0);
  });

  dom.window.eval("__testSetPaywallEnabled(false);"); // on remet l'état par défaut du projet
}

// ---------------------------------------------------------------------
//  Partie 2 : double authentification (js/storage.js + dashboard-ortho.js)
//  Ici on simule un faux window.supabase.createClient() imitant l'API
//  MFA documentée par Supabase — on ne teste pas Supabase lui-même
//  (hors de portée), seulement que NOTRE code appelle les bonnes
//  méthodes dans le bon ordre et gère bien les résultats.
// ---------------------------------------------------------------------
function loadOrthoAppWithFakeSupabase(){
  const html = fs.readFileSync(path.join(ROOT, 'dashboard-ortho.html'), 'utf8');
  const dom = new JSDOM(html, { url:'http://localhost/', runScripts:'outside-only', resources:'usable', pretendToBeVisual:true });

  const fakeSupabaseSrc = `
    window.__mfaEnrolled = false;
    window.__mfaVerifiedThisLogin = false;
    window.supabase = {
      createClient(){
        const rows = {};
        return {
          auth: {
            async signUp({email,password,options}){
              rows['user-1'] = { code:'user-1', name:(options&&options.data&&options.data.name)||'Testeur', email, plan:'free' };
              return { data:{ session:{ user:{ id:'user-1', email } } }, error:null };
            },
            async signInWithPassword({email,password}){ return { data:{ session:{ user:{ id:'user-1', email } } }, error:null }; },
            async getSession(){ return { data:{ session:{ user:{ id:'user-1', email:'test@cabinet.fr' } } } }; },
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
          from(table){
            return {
              select(){ return this; },
              eq(k,v){ this._id=v; return this; },
              async maybeSingle(){ return { data: rows[this._id] || null }; },
              upsert(obj){ rows[obj.code] = Object.assign({}, rows[obj.code], obj, { plan:(rows[obj.code]&&rows[obj.code].plan)||'free' }); return this; }
            };
          }
        };
      }
    };
  `;
  dom.window.eval(fakeSupabaseSrc);

  // v6.24 : force des identifiants factices pour activer CLOUD_ENABLED —
  // le vrai SDK dynamique (cdn.jsdelivr) est court-circuité par notre
  // faux window.supabase déjà défini ci-dessus.
  let storageCode = fs.readFileSync(path.join(ROOT, 'js/storage.js'), 'utf8');
  storageCode = storageCode.replace('const SUPABASE_URL = "";', 'const SUPABASE_URL = "https://fake.supabase.co";');
  storageCode = storageCode.replace('const SUPABASE_ANON_KEY = "";', 'const SUPABASE_ANON_KEY = "fake-key";');
  dom.window.eval(storageCode);

  for(const src of ['js/learner.js','js/charts.js','js/dashboard-ortho.js']){
    const code = fs.readFileSync(path.join(ROOT, src), 'utf8');
    dom.window.eval(code);
  }
  // v6.24.1 : leçon apprise en direct avec l'utilisateur — le nom
  // réellement exposé sur `window` est `ReParoleStore`, pas `Store`
  // (`Store` est un alias `const` LOCAL à js/app.js et js/dashboard-ortho.js,
  // invisible depuis l'extérieur de ces fichiers). Toujours vérifier avec
  // `grep -n "window\." fichier.js` avant d'écrire un test.
  return dom;
}

console.log('\nDouble authentification (TOTP, via faux client Supabase)');
(async () => {
  const dom = loadOrthoAppWithFakeSupabase();
  const Store = dom.window.ReParoleStore;

  await test_async('création de compte ortho (sans MFA)', async () => {
    const res = await Store.signUpOrtho('test@cabinet.fr', 'Motdepasse1', 'Testeur');
    assert.ok(!res.error, 'signUp ne doit pas renvoyer d\'erreur');
  });

  let enrollData;
  await test_async('inscription MFA : renvoie un QR code et une clé secrète', async () => {
    const res = await Store.mfaEnroll();
    assert.ok(!res.error);
    assert.ok(res.data.totp.qr_code, 'QR code attendu');
    assert.ok(res.data.totp.secret, 'clé secrète attendue');
    enrollData = res.data;
  });

  let challengeData;
  await test_async('création du défi de vérification', async () => {
    const res = await Store.mfaChallenge(enrollData.id);
    assert.ok(!res.error);
    challengeData = res.data;
  });

  await test_async('code erroné rejeté', async () => {
    const res = await Store.mfaVerify(enrollData.id, challengeData.id, '000000');
    assert.ok(res.error, 'un code erroné doit être rejeté');
  });

  await test_async('bon code accepté (active la double authentification)', async () => {
    const res = await Store.mfaVerify(enrollData.id, challengeData.id, '111111');
    assert.ok(!res.error);
  });

  await test_async('nouvelle connexion : exige le code (aal2)', async () => {
    dom.window.eval('window.__mfaVerifiedThisLogin = false;'); // simule une session fraîche
    const res = await Store.signInOrtho('test@cabinet.fr', 'Motdepasse1');
    assert.strictEqual(res.mfaRequired, true, 'la connexion doit exiger un défi MFA');
    assert.ok(res.factorId && res.challengeId);
    dom.window.__lastSignIn = res;
  });

  await test_async('connexion complétée avec le bon code', async () => {
    const pending = dom.window.__lastSignIn;
    const res = await Store.completeMfaSignIn(pending.factorId, pending.challengeId, '111111');
    assert.ok(!res.error);
    assert.strictEqual(res.code, 'user-1');
  });

  await test_async('désactivation : plus aucun facteur après unenroll', async () => {
    const before = await Store.mfaListFactors();
    for(const f of before.data.totp) await Store.mfaUnenroll(f.id);
    const after = await Store.mfaListFactors();
    assert.strictEqual(after.data.totp.length, 0);
  });

  await test_async('mot de passe faible rejeté par _checkPasswordStrength', async () => {
    const weak = dom.window.eval("OrthoApp._checkPasswordStrength('abc')");
    const noUpper = dom.window.eval("OrthoApp._checkPasswordStrength('motdepasse1')");
    const noDigit = dom.window.eval("OrthoApp._checkPasswordStrength('Motdepasse')");
    const good = dom.window.eval("OrthoApp._checkPasswordStrength('Motdepasse1')");
    assert.ok(weak); assert.ok(noUpper); assert.ok(noDigit);
    assert.strictEqual(good, null, 'un mot de passe conforme ne doit renvoyer aucune erreur');
  });

  // v6.26 : createCheckoutSession() — on simule `fetch` (pas de vrai
  // Stripe/Edge Function) pour vérifier que NOTRE code envoie la bonne
  // requête et gère bien la réponse, succès comme échec.
  await test_async('createCheckoutSession envoie planKey/accountCode/accountType et renvoie l\'URL', async () => {
    let capturedBody = null;
    dom.window.fetch = async (url, opts) => {
      capturedBody = JSON.parse(opts.body);
      return { ok:true, json: async () => ({ url:'https://checkout.stripe.com/fake-session' }) };
    };
    const res = await Store.createCheckoutSession('patient_monthly', 'p-test123', 'patient');
    assert.strictEqual(res.url, 'https://checkout.stripe.com/fake-session');
    assert.strictEqual(capturedBody.planKey, 'patient_monthly');
    assert.strictEqual(capturedBody.accountCode, 'p-test123');
    assert.strictEqual(capturedBody.accountType, 'patient');
  });

  await test_async('createCheckoutSession renvoie une erreur si le serveur répond une erreur', async () => {
    dom.window.fetch = async () => ({ ok:false, json: async () => ({ error:'Offre inconnue' }) });
    const res = await Store.createCheckoutSession('planqui-nexiste-pas', 'p-test123', 'patient');
    assert.ok(res.error, 'une réponse en erreur du serveur doit remonter comme res.error');
  });

  console.log(`\n${passed} test(s) réussi(s), ${failed} échec(s).`);
  process.exit(failed ? 1 : 0);
})();

async function test_async(name, fn){
  try{ await fn(); console.log('  ✔', name); passed++; }
  catch(e){ console.log('  ✘', name, '—', e.message); failed++; }
}
