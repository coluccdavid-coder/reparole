// =====================================================================
//  FILET DE SÉCURITÉ — vérification de la sécurité côté espace ortho (v6.24)
//  ---------------------------------------------------------------------
//  Trois choses écrites en v6.24 mais jamais vérifiées à la fin de la
//  session précédente :
//   1. Mot de passe renforcé (OrthoApp._checkPasswordStrength).
//   2. Limite de patients en compte gratuit (ORTHO_FREE_PATIENT_LIMIT).
//   3. Double authentification TOTP complète (enroll / challenge /
//      verify / unenroll), avec un faux client Supabase simulé qui
//      imite l'API MFA documentée (supabase.auth.mfa.*).
//
//  Piège corrigé ici (celui qui avait fait échouer la tentative
//  précédente, dans le test lui-même, pas dans le code livré) :
//  `js/storage.js` expose `window.ReParoleStore`, PAS `window.Store`.
//  `js/dashboard-ortho.js` crée un alias LOCAL `const Store =
//  window.ReParoleStore` qui n'est visible que depuis ce fichier-là,
//  pas depuis l'extérieur (le test). Donc : depuis ce test, on parle
//  toujours à `dom.window.ReParoleStore` directement (jamais
//  `dom.window.Store`, qui n'existe pas) ; le code applicatif, lui,
//  continue de passer par `Store` en interne, ce qui est correct.
//
//  Lancer : node tests/ortho-security.test.js
//  (nécessite jsdom : npm install)
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

// ---------------------------------------------------------------------
// Charge dashboard-ortho.html dans un DOM, avec SUPABASE_URL/ANON_KEY
// substitués en mémoire (le fichier réel sur disque n'est PAS modifié)
// pour forcer CLOUD_ENABLED = true, et un faux client supabase injecté
// avant le chargement de storage.js.
// ---------------------------------------------------------------------
function loadDashboard(fakeSupabaseFactory){
  const html = fs.readFileSync(path.join(ROOT, 'dashboard-ortho.html'), 'utf8');
  // Pas besoin de charger les CSS ni d'un vrai rendu visuel ici (tests de
  // logique uniquement) : on omet `resources`/`pretendToBeVisual` pour
  // éviter du bruit bénin (tentatives réseau pour les <link>, avertissements
  // "not implemented" de jsdom sur scrollTo), sans rapport avec ce qui est testé.
  const dom = new JSDOM(html, { url:'http://localhost/', runScripts:'outside-only' });
  dom.window.scrollTo = () => {};
  dom.window.confirm = () => true; // évite de bloquer sur disableMfa()
  dom.window.supabase = { createClient: fakeSupabaseFactory };

  const scripts = [...dom.window.document.querySelectorAll('script[src]')].map(s=>s.getAttribute('src'));
  const errors = [];
  for(const src of scripts){
    let code = fs.readFileSync(path.join(ROOT, src), 'utf8');
    if(src === 'js/storage.js'){
      code = code
        .replace(/const SUPABASE_URL = "[^"]*";/, 'const SUPABASE_URL = "https://test.supabase.co";')
        .replace(/const SUPABASE_ANON_KEY = "[^"]*";/, 'const SUPABASE_ANON_KEY = "test-anon-key";');
    }
    try{ dom.window.eval(code); }
    catch(e){ errors.push(`Erreur de chargement dans ${src} : ${e.message}`); }
  }
  return { window: dom.window, loadErrors: errors };
}

// ---------------------------------------------------------------------
// Faux client Supabase : assez de l'API auth/mfa/from pour couvrir le
// parcours signUp -> signIn -> défi MFA -> vérif, et enroll/unenroll.
// Un seul "compte" simulé, état gardé en mémoire (factors, mfa activé).
// ---------------------------------------------------------------------
function makeFakeSupabase(){
  let currentUser = null;
  let currentSession = null;
  const orthoRows = {};
  const factors = []; // { id, status: 'unverified'|'verified' }
  let nextFactorId = 1;

  function makeSession(user){ return { user, access_token:'tok-'+user.id }; }

  const client = {
    auth: {
      async signUp({ email, password, options }){
        const id = 'user-1';
        currentUser = { id, email, user_metadata: options?.data || {} };
        currentSession = makeSession(currentUser);
        return { data:{ session: currentSession, user: currentUser }, error:null };
      },
      async signInWithPassword({ email, password }){
        if(!currentUser || currentUser.email !== email) return { data:null, error:{ message:'Identifiants invalides.' } };
        currentSession = makeSession(currentUser);
        return { data:{ session: currentSession }, error:null };
      },
      async getSession(){ return { data:{ session: currentSession } }; },
      async signOut(){ currentSession = null; return { error:null }; },
      mfa: {
        async getAuthenticatorAssuranceLevel(){
          const verified = factors.filter(f=>f.status==='verified');
          return { data:{ currentLevel: verified.length ? 'aal1' : 'aal1', nextLevel: verified.length ? 'aal2' : 'aal1' } };
        },
        async listFactors(){ return { data:{ totp: factors.slice() }, error:null }; },
        async enroll({ factorType }){
          const id = 'factor-' + (nextFactorId++);
          factors.push({ id, status:'unverified' });
          return { data:{ id, totp:{ qr_code:'<svg>fake-qr</svg>', secret:'FAKESECRET234567' } }, error:null };
        },
        async challenge({ factorId }){
          if(!factors.find(f=>f.id===factorId)) return { data:null, error:{ message:'Facteur inconnu.' } };
          return { data:{ id:'challenge-1' }, error:null };
        },
        async verify({ factorId, challengeId, code }){
          const f = factors.find(f=>f.id===factorId);
          if(!f) return { data:null, error:{ message:'Facteur inconnu.' } };
          if(code !== '123456') return { data:null, error:{ message:'Code invalide.' } };
          f.status = 'verified';
          return { data:{ success:true }, error:null };
        },
        async unenroll({ factorId }){
          const idx = factors.findIndex(f=>f.id===factorId);
          if(idx>=0) factors.splice(idx,1);
          return { data:{}, error:null };
        }
      }
    },
    __orthoRows: orthoRows, // accès direct réservé aux tests, pour muter le plan free/pro
    from(table){
      return {
        select(){ return this; },
        eq(){ return this; },
        async maybeSingle(){ return { data: orthoRows[currentUser?.id] || null }; },
        upsert(row){
          orthoRows[row.code] = { ...row, plan:'free' };
          return { select(){ return this; }, async maybeSingle(){ return { data: orthoRows[row.code], error:null }; } };
        }
      };
    }
  };
  return client;
}

(async () => {
  console.log('Mot de passe renforcé (OrthoApp._checkPasswordStrength)');
  {
    const { window, loadErrors } = loadDashboard(makeFakeSupabase);
    loadErrors.forEach(e => console.error('  ✘ chargement:', e));
    const { OrthoApp } = window;
    test('trop court -> refusé', () => assert.ok(OrthoApp._checkPasswordStrength('Ab1')));
    test('pas de majuscule -> refusé', () => assert.ok(OrthoApp._checkPasswordStrength('abcdefg1')));
    test('pas de minuscule -> refusé', () => assert.ok(OrthoApp._checkPasswordStrength('ABCDEFG1')));
    test('pas de chiffre -> refusé', () => assert.ok(OrthoApp._checkPasswordStrength('Abcdefgh')));
    test('mot de passe valide -> accepté', () => assert.strictEqual(OrthoApp._checkPasswordStrength('Abcdefg1'), null));
  }

  console.log('\nLimite de patients côté compte gratuit (assign())');
  {
    let fakeClient;
    const { window, loadErrors } = loadDashboard(() => (fakeClient = makeFakeSupabase()));
    loadErrors.forEach(e => console.error('  ✘ chargement:', e));
    const { document, ReParoleStore } = window;
    assert.ok(ReParoleStore, 'window.ReParoleStore doit exister (pas window.Store)');

    // Compte + connexion, pour obtenir un orthoCode réel.
    await ReParoleStore.signUpOrtho('ortho@test.fr', 'Abcdefg1', 'Camille');
    document.getElementById('o-email').value = 'ortho@test.fr';
    document.getElementById('o-password').value = 'Abcdefg1';
    await window.OrthoApp.signIn();

    // Simule N patients déjà rattachés en remplaçant listPatients par
    // une doublure, puis en appelant le VRAI refreshList() : la variable
    // `patients` (let, portée au script dashboard-ortho.js) n'est
    // modifiable de façon fiable que par du code défini dans cette même
    // portée — d'où l'appel à refreshList() plutôt qu'un eval() externe,
    // qui créerait une variable globale distincte sans jamais toucher à
    // celle fermée par assign()/refreshList (piège de portée, même
    // famille que celui déjà documenté dans le README pour `window.X`).
    let assignCalls = 0;
    ReParoleStore.assignPatient = async () => { assignCalls++; return { name:'Test' }; };
    ReParoleStore.listPatients = async (n) => new Array(n).fill({ name:'Test', code:'p-x', sessions:0 });

    ReParoleStore.listPatients = async () => new Array(3).fill({ name:'Test', code:'p-x', sessions:0 });
    await window.OrthoApp.refreshList();
    document.getElementById('assign-code').value = 'p-abc123';
    await window.OrthoApp.assign();
    test('limite atteinte (3/3, gratuit) -> rattachement refusé', () => assert.strictEqual(assignCalls, 0));
    test('message de limite affiché', () => assert.ok(document.getElementById('assign-msg').textContent.includes('Limite du compte gratuit')));

    // Passage en 'pro' : on mute directement la ligne côté faux serveur
    // (comme le ferait la commande SQL manuelle documentée dans
    // sql/schema.sql), puis on se reconnecte pour que orthoPlan reflète
    // ce changement — pas de mutation directe de la variable `orthoPlan`
    // depuis ici, qui vivrait dans une portée d'eval() différente et ne
    // toucherait donc rien de réel (même piège que pour `patients`).
    fakeClient.__orthoRows['user-1'].plan = 'pro';
    document.getElementById('o-email').value = 'ortho@test.fr';
    document.getElementById('o-password').value = 'Abcdefg1';
    await window.OrthoApp.signIn();
    document.getElementById('assign-code').value = 'p-abc123';
    await window.OrthoApp.assign();
    test('compte pro -> pas de limite, rattachement tenté', () => assert.strictEqual(assignCalls, 1));

    fakeClient.__orthoRows['user-1'].plan = 'free';
    await window.OrthoApp.signIn();
    ReParoleStore.listPatients = async () => new Array(2).fill({ name:'Test', code:'p-x', sessions:0 });
    await window.OrthoApp.refreshList();
    document.getElementById('assign-code').value = 'p-abc123';
    await window.OrthoApp.assign();
    test('sous la limite (2/3, gratuit) -> rattachement tenté', () => assert.strictEqual(assignCalls, 2));
  }

  console.log('\nDouble authentification TOTP (bout en bout, faux client Supabase)');
  {
    const { window, loadErrors } = loadDashboard(makeFakeSupabase);
    loadErrors.forEach(e => console.error('  ✘ chargement:', e));
    const { document, ReParoleStore, OrthoApp } = window;

    await testAsync('création de compte + connexion sans MFA (pas encore activée)', async () => {
      const su = await ReParoleStore.signUpOrtho('ortho2@test.fr', 'Abcdefg1', 'Sam');
      assert.ok(!su.error);
      const si = await ReParoleStore.signInOrtho('ortho2@test.fr', 'Abcdefg1');
      assert.ok(!si.error && !si.mfaRequired, 'aucun défi MFA attendu avant activation');
    });

    await testAsync('activation de la double authentification via OrthoApp', async () => {
      await OrthoApp.startMfaEnroll();
      assert.ok(OrthoApp._enrollFactorId, 'un factorId doit être mémorisé après enroll()');
      document.getElementById('mfa-confirm-code').value = '000000';
      await OrthoApp.confirmMfaEnroll();
      assert.ok(!document.getElementById('mfa-enroll-msg').textContent.includes('✅'), 'un mauvais code ne doit pas activer la MFA');
      document.getElementById('mfa-confirm-code').value = '123456';
      await OrthoApp.confirmMfaEnroll();
      assert.ok(document.getElementById('mfa-enroll-msg').textContent.includes('✅'), 'un bon code doit activer la MFA');
    });

    await testAsync('reconnexion -> défi MFA exigé, puis résolu', async () => {
      const si = await ReParoleStore.signInOrtho('ortho2@test.fr', 'Abcdefg1');
      assert.ok(si.mfaRequired, 'un défi MFA doit être exigé une fois activée');
      assert.ok(si.factorId && si.challengeId, 'factorId et challengeId doivent être renvoyés');
      const bad = await ReParoleStore.completeMfaSignIn(si.factorId, si.challengeId, '000000');
      assert.ok(bad.error, 'un mauvais code à la connexion doit être refusé');
      const ok = await ReParoleStore.completeMfaSignIn(si.factorId, si.challengeId, '123456');
      assert.ok(!ok.error && ok.code, 'un bon code doit terminer la connexion');
    });

    await testAsync('désactivation de la MFA via OrthoApp.disableMfa()', async () => {
      await OrthoApp.disableMfa();
      const status = await ReParoleStore.mfaListFactors();
      assert.strictEqual((status.data.totp||[]).length, 0, 'plus aucun facteur après désactivation');
      const si = await ReParoleStore.signInOrtho('ortho2@test.fr', 'Abcdefg1');
      assert.ok(!si.mfaRequired, 'plus de défi MFA une fois désactivée');
    });
  }

  console.log(`\n${passed} test(s) réussi(s).`);
  if(process.exitCode){ console.log('\n❌ Des problèmes ont été détectés ci-dessus.'); }
  else{ console.log('\n✅ Aucun problème détecté — mot de passe, limite de patients et double authentification se comportent comme attendu.'); }
})();
