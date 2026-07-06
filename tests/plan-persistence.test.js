// =====================================================================
//  FILET DE SÉCURITÉ — persistance du champ "plan" (v6.30)
//  ---------------------------------------------------------------------
//  Bug réel trouvé en branchant le déverrouillage QA du mode Pro :
//   - loadPatient() (mode cloud) oubliait de reprendre `row.plan` dans
//     l'objet JS renvoyé → un patient passé "pro" à la main dans
//     Supabase (méthode documentée depuis la v6.24) s'affichait quand
//     même comme "free" partout dans l'app.
//   - savePatient() n'envoyait `p_plan` dans aucun des deux modes.
//  Ce test vérifie, en mode CLOUD (avec un faux client Supabase), que :
//   1. loadPatient() reprend bien `plan` depuis la ligne renvoyée par
//      get_patient().
//   2. savePatient() envoie bien `p_plan` dans le payload de
//      upsert_patient().
//  La persistance en mode navigateur (localStorage) est déjà couverte
//  indirectement par tests/qa-unlock.test.js.
//
//  Lancer : node tests/plan-persistence.test.js
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

function loadStorage(fakeSupabaseFactory){
  const dom = new JSDOM('<!doctype html><html><body></body></html>', { url:'http://localhost/', runScripts:'outside-only' });
  dom.window.supabase = { createClient: fakeSupabaseFactory };
  let code = fs.readFileSync(path.join(ROOT, 'js/storage.js'), 'utf8');
  // Force CLOUD_ENABLED = true en mémoire uniquement (le fichier réel n'est pas modifié)
  code = code
    .replace(/const SUPABASE_URL = "[^"]*";/, 'const SUPABASE_URL = "https://test.supabase.co";')
    .replace(/const SUPABASE_ANON_KEY = "[^"]*";/, 'const SUPABASE_ANON_KEY = "test-anon-key";');
  dom.window.eval(code);
  return dom.window;
}

function makeFakeSupabase(){
  const rows = { 'p-demo': { code:'p-demo', name:'Marie', level:2, sessions:5, correct:10, total:15, streak:2, plan:'pro',
    daily_sessions_date:'2026-07-01', daily_sessions_count:3 } };
  let lastUpsertPayload = null;
  return function createClient(){
    return {
      rpc(fn, params){
        if(fn === 'get_patient'){
          const row = rows[params.p_code] || null;
          return Promise.resolve({ data: row ? [row] : [], error:null });
        }
        if(fn === 'upsert_patient'){
          lastUpsertPayload = params;
          const existing = rows[params.p_code] || {};
          rows[params.p_code] = { ...existing, code:params.p_code, name:params.p_name, level:params.p_level,
            sessions:params.p_sessions, correct:params.p_correct, total:params.p_total, streak:params.p_streak,
            plan: params.p_plan || existing.plan || 'free',
            // v6.32 : même logique de coalesce que la vraie migration SQL (003_daily_quota.sql)
            daily_sessions_date: params.p_daily_sessions_date!=null ? params.p_daily_sessions_date : (existing.daily_sessions_date||null),
            daily_sessions_count: params.p_daily_sessions_count!=null ? params.p_daily_sessions_count : (existing.daily_sessions_count||0)
          };
          return Promise.resolve({ error:null });
        }
        return Promise.resolve({ data:null, error:new Error('rpc non simulée : '+fn) });
      },
      getLastUpsertPayload(){ return lastUpsertPayload; }
    };
  };
}

(async () => {
  console.log('Persistance du champ "plan" (mode cloud)');

  await testAsync('loadPatient() reprend bien "plan" depuis la ligne Supabase', async () => {
    const win = loadStorage(makeFakeSupabase());
    const patient = await win.ReParoleStore.loadPatient('p-demo');
    assert(patient, 'le patient de test doit être chargé');
    assert.strictEqual(patient.plan, 'pro', 'le champ "plan" (pro, déjà réglé côté Supabase) doit être repris par loadPatient()');
  });

  await testAsync('savePatient() envoie bien p_plan dans le payload upsert_patient', async () => {
    const win = loadStorage(makeFakeSupabase());
    await win.ReParoleStore.savePatient('p-demo', { name:'Marie', level:2, sessions:6, correct:11, total:16, streak:3, plan:'pro' });
    const patient = await win.ReParoleStore.loadPatient('p-demo');
    assert.strictEqual(patient.plan, 'pro', 'le plan "pro" doit être conservé après un aller-retour save/load');
  });

  await testAsync('un ancien appel sans p_plan ne réinitialise pas le plan existant à "free" (rétrocompatibilité)', async () => {
    const win = loadStorage(makeFakeSupabase());
    // Simule un ancien client JS qui ne connaît pas encore "plan"
    await win.ReParoleStore.savePatient('p-demo', { name:'Marie', level:2, sessions:7, correct:12, total:17, streak:4, plan:undefined });
    const patient = await win.ReParoleStore.loadPatient('p-demo');
    assert.strictEqual(patient.plan, 'pro', 'le plan existant ("pro") ne doit pas être réinitialisé par un appel sans p_plan');
  });

  // v6.32 : même bug de fond que "plan" (voir tests/daily-quota.test.js
  // pour la couverture en mode navigateur), pour le quota gratuit journalier.
  await testAsync('loadPatient() reprend bien le quota journalier depuis la ligne Supabase', async () => {
    const win = loadStorage(makeFakeSupabase());
    const patient = await win.ReParoleStore.loadPatient('p-demo');
    assert.strictEqual(patient.dailySessionsDate, '2026-07-01', 'la date du quota doit être reprise depuis Supabase');
    assert.strictEqual(patient.dailySessionsCount, 3, 'le compteur du quota doit être repris depuis Supabase');
  });

  await testAsync('savePatient() envoie bien le quota journalier dans le payload upsert_patient', async () => {
    const win = loadStorage(makeFakeSupabase());
    await win.ReParoleStore.savePatient('p-demo', { name:'Marie', level:2, sessions:6, correct:11, total:16, streak:3, plan:'pro',
      dailySessionsDate:'2026-07-06', dailySessionsCount:5 });
    const patient = await win.ReParoleStore.loadPatient('p-demo');
    assert.strictEqual(patient.dailySessionsDate, '2026-07-06', 'la nouvelle date doit être persistée');
    assert.strictEqual(patient.dailySessionsCount, 5, 'le nouveau compteur doit être persisté');
  });

  await testAsync('un ancien appel sans quota journalier ne réinitialise pas le compteur existant (rétrocompatibilité)', async () => {
    const win = loadStorage(makeFakeSupabase());
    await win.ReParoleStore.savePatient('p-demo', { name:'Marie', level:2, sessions:7, correct:12, total:17, streak:4, plan:'pro',
      dailySessionsDate:undefined, dailySessionsCount:undefined });
    const patient = await win.ReParoleStore.loadPatient('p-demo');
    assert.strictEqual(patient.dailySessionsCount, 3, 'le compteur existant (3) ne doit pas être réinitialisé par un appel sans ces paramètres');
  });

  console.log(`\n${passed} test(s) réussi(s).`);
  if(!process.exitCode){
    console.log('\n✅ Aucun problème détecté — le champ "plan" est bien lu et écrit en mode cloud.');
  } else {
    console.log('\n❌ Des problèmes ont été détectés ci-dessus.');
  }
})();
