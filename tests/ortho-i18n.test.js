// =====================================================================
//  FILET DE SÉCURITÉ — espace orthophoniste multilingue (v6.26)
//  ---------------------------------------------------------------------
//  Demande explicite de l'utilisateur : l'espace ortho ne doit plus
//  être français uniquement, l'app devant être utilisable dans tous
//  les pays à coût abordable (pas forcément un orthophoniste
//  francophone pour un patient donné). Ce test vérifie :
//   1. Les écrans statiques (connexion, défi MFA) suivent la langue.
//   2. Le contenu DYNAMIQUE (généré en JS, comme pour le bug patient de
//      la v6.25) suit aussi la langue — via le même mécanisme
//      onLangChange() que côté patient, adapté ici à ortho-list et
//      ortho-detail.
//
//  Réutilise le principe du faux client Supabase de
//  tests/ortho-security.test.js (dupliqué ici en plus léger : seul le
//  strict nécessaire pour ce test, pas tout le flux MFA déjà couvert
//  ailleurs).
//
//  Lancer : node tests/ortho-i18n.test.js
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

function loadDashboard(fakeSupabaseFactory){
  const html = fs.readFileSync(path.join(ROOT, 'dashboard-ortho.html'), 'utf8');
  const dom = new JSDOM(html, { url:'http://localhost/', runScripts:'outside-only' });
  dom.window.scrollTo = () => {};
  dom.window.confirm = () => true;
  dom.window.alert = () => {};
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
  // Reproduit <script>Prefs.load();</script> (dashboard-ortho.html, après
  // tous les autres) : ce helper ne charge que les balises script[src],
  // jamais le script inline final.
  dom.window.eval('Prefs.load();');
  return { window: dom.window, loadErrors: errors };
}

// Faux client Supabase minimal — juste assez pour signUp/signIn et une
// liste de patients vide (le strict nécessaire pour ce test d'i18n,
// pas tout le flux MFA déjà couvert par tests/ortho-security.test.js).
function makeFakeSupabase(){
  let currentUser = null, currentSession = null;
  const orthoRows = {};
  return {
    auth: {
      async signUp({ email, options }){
        currentUser = { id:'user-1', email, user_metadata: options?.data || {} };
        currentSession = { user: currentUser, access_token:'tok' };
        return { data:{ session: currentSession, user: currentUser }, error:null };
      },
      async signInWithPassword({ email }){
        currentSession = { user: currentUser, access_token:'tok' };
        return { data:{ session: currentSession }, error:null };
      },
      async getSession(){ return { data:{ session: currentSession } }; },
      mfa: {
        async getAuthenticatorAssuranceLevel(){ return { data:{ currentLevel:'aal1', nextLevel:'aal1' } }; },
        async listFactors(){ return { data:{ totp: [] }, error:null }; },
      }
    },
    from(){
      return {
        select(){ return this; }, eq(){ return this; },
        async maybeSingle(){ return { data: orthoRows[currentUser?.id] || null }; },
        upsert(row){
          orthoRows[row.code] = { ...row, plan:'free' };
          return { select(){ return this; }, async maybeSingle(){ return { data: orthoRows[row.code], error:null }; } };
        }
      };
    }
  };
}

(async () => {
  console.log('Écrans statiques (connexion, défi MFA) suivent la langue');
  {
    const { window, loadErrors } = loadDashboard(makeFakeSupabase);
    loadErrors.forEach(e => console.error('  ✘ chargement:', e));
    const { document } = window;

    test('sélecteur de langue présent sur l\'écran de connexion', () => {
      const switcher = document.querySelector('#ortho-login [data-lang-switcher]');
      assert.ok(switcher, 'un conteneur data-lang-switcher doit exister sur l\'écran de connexion ortho');
      const options = switcher.querySelectorAll('option');
      assert.ok(options.length >= 7, `au moins les 7 langues à support complet doivent être proposées, obtenu : ${options.length}`);
    });

    test('connexion en français par défaut', () => {
      assert.strictEqual(document.querySelector('#ortho-login h1').textContent, 'Espace orthophoniste');
    });

    test('passage en anglais : titre traduit', () => {
      window.Prefs.setLang('en');
      assert.strictEqual(document.querySelector('#ortho-login h1').textContent, 'Speech therapist space');
    });

    test('passage en arabe : titre traduit + RTL', () => {
      window.Prefs.setLang('ar');
      assert.strictEqual(document.querySelector('#ortho-login h1').textContent, 'مساحة أخصائي النطق');
      assert.strictEqual(document.documentElement.dir, 'rtl');
    });
  }

  console.log('\nContenu dynamique (liste de patients, statut MFA) suit la langue après connexion');
  {
    const { window, loadErrors } = loadDashboard(makeFakeSupabase);
    loadErrors.forEach(e => console.error('  ✘ chargement:', e));
    const { document, ReParoleStore, OrthoApp } = window;

    await testAsync('connexion + tableau de bord ortho en français', async () => {
      await ReParoleStore.signUpOrtho('ortho@test.fr', 'Abcdefg1', 'Camille');
      document.getElementById('o-email').value = 'ortho@test.fr';
      document.getElementById('o-password').value = 'Abcdefg1';
      await OrthoApp.signIn();
      assert.ok(document.getElementById('ortho-list').classList.contains('active'));
      assert.ok(document.getElementById('patient-list').textContent.includes('Aucun patient rattaché'));
      assert.strictEqual(document.getElementById('mfa-status').textContent, 'Non activée');
    });

    await testAsync('changement de langue DEPUIS le tableau de bord ortho : contenu dynamique retraduit', async () => {
      window.Prefs.setLang('it');
      // refreshList()/refreshMfaStatus() (déclenchées par onLangChange)
      // sont asynchrones — laisse-leur le temps de se terminer.
      await new Promise(res => setTimeout(res, 20));
      assert.ok(document.getElementById('patient-list').textContent.includes('Nessun paziente collegato'), `obtenu : "${document.getElementById('patient-list').textContent}"`);
      assert.strictEqual(document.getElementById('mfa-status').textContent, 'Non attivata');
    });

    await testAsync('changement de langue vers l\'allemand : contenu dynamique retraduit', async () => {
      window.Prefs.setLang('de');
      await new Promise(res => setTimeout(res, 20));
      assert.ok(document.getElementById('patient-list').textContent.includes('Noch kein Patient'), `obtenu : "${document.getElementById('patient-list').textContent}"`);
    });
  }

  console.log(`\n${passed} test(s) réussi(s).`);
  if(process.exitCode){ console.log('\n❌ Des problèmes ont été détectés ci-dessus.'); }
  else{ console.log('\n✅ Aucun problème détecté — l\'espace ortho suit bien le changement de langue, y compris son contenu dynamique.'); }
})();
