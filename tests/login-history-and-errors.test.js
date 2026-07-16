// =====================================================================
//  TESTS — Historique des connexions + suivi des erreurs techniques
//  (v6.97)
//  ---------------------------------------------------------------------
//  Réponse à deux demandes précisées explicitement par l'utilisateur :
//  1. "Voir qui s'est connecté (admin/orthophonistes) et quand"
//  2. "Vraies erreurs techniques du site (bugs, plantages), pas les
//     erreurs des patients dans leurs exercices"
//
//  Lancer : node tests/login-history-and-errors.test.js
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

function loadStorageWithFakeSupabase(){
  const dom = new JSDOM('<!DOCTYPE html><body></body>', { url:'http://localhost/', runScripts:'outside-only' });
  const fakeSrc = `
    window.__loginEvents = [];
    window.__clientErrors = [];
    window.supabase = {
      createClient(){
        return {
          async rpc(name, params){
            if(name === 'log_login_event'){
              window.__loginEvents.push({ account_type:params.p_account_type, name:params.p_name, created_at:new Date().toISOString() });
              return { data:null, error:null };
            }
            if(name === 'get_login_history'){
              return { data: [...window.__loginEvents].reverse(), error:null };
            }
            if(name === 'log_client_error'){
              window.__clientErrors.push({ message:params.p_message, page:params.p_page, stack:params.p_stack, created_at:new Date().toISOString() });
              return { data:null, error:null };
            }
            if(name === 'get_recent_client_errors'){
              return { data: [...window.__clientErrors].reverse(), error:null };
            }
            return { data:null, error:null };
          }
        };
      }
    };
  `;
  dom.window.eval(fakeSrc);
  let code = fs.readFileSync(path.join(ROOT, 'js/storage.js'), 'utf8');
  code = code.replace(/const SUPABASE_URL = "[^"]*";/, 'const SUPABASE_URL = "https://fake.supabase.co";');
  code = code.replace(/const SUPABASE_ANON_KEY = "[^"]*";/, 'const SUPABASE_ANON_KEY = "fake-key";');
  dom.window.eval(code);
  return dom;
}

async function main(){

console.log('sql/schema.sql — tables et fonctions dédiées');

const sql = fs.readFileSync(path.join(ROOT, 'sql/schema.sql'), 'utf8');

await test('login_events : table, RLS admin-only, et fonctions log/get', ()=>{
  assert.ok(/create table if not exists login_events/.test(sql));
  assert.ok(/create or replace function log_login_event/.test(sql));
  assert.ok(/create or replace function get_login_history/.test(sql));
  assert.ok(/if auth\.uid\(\) is null then/.test(sql), 'log_login_event doit exiger une session authentifiée');
});

await test('client_errors : table, RLS admin-only, et fonctions log/get', ()=>{
  assert.ok(/create table if not exists client_errors/.test(sql));
  assert.ok(/create or replace function log_client_error/.test(sql));
  assert.ok(/create or replace function get_recent_client_errors/.test(sql));
  assert.ok(/left\(trim\(p_message\), 500\)/.test(sql), 'les champs doivent être tronqués (anti-abus)');
});

console.log('\njs/error-tracking.js — capture des erreurs côté client');

await test('écoute bien error et unhandledrejection, jamais bloquant', ()=>{
  const code = fs.readFileSync(path.join(ROOT, 'js/error-tracking.js'), 'utf8');
  assert.ok(/addEventListener\('error'/.test(code));
  assert.ok(/addEventListener\('unhandledrejection'/.test(code));
  assert.ok(/catch\(e\)/.test(code), 'ne doit jamais lui-même faire planter la page');
});

await test('chargé sur les 7 pages qui utilisent déjà storage.js', ()=>{
  for(const page of ['admin.html','aidant.html','contribuer.html','dashboard-ortho.html','index.html','mon-resume.html','report.html']){
    const html = fs.readFileSync(path.join(ROOT, page), 'utf8');
    assert.ok(/<script src="js\/error-tracking\.js">/.test(html), `${page} ne charge pas error-tracking.js`);
  }
});

console.log('\nReParoleStore — comportement (mode cloud simulé)');

await test('logLoginEvent() puis getLoginHistory() : l\'évènement enregistré ressort bien', async ()=>{
  const dom = loadStorageWithFakeSupabase();
  await dom.window.ReParoleStore.logLoginEvent('admin', 'David');
  const history = await dom.window.ReParoleStore.getLoginHistory();
  assert.strictEqual(history.length, 1);
  assert.strictEqual(history[0].account_type, 'admin');
  assert.strictEqual(history[0].name, 'David');
});

await test('logLoginEvent() distingue bien admin et ortho', async ()=>{
  const dom = loadStorageWithFakeSupabase();
  await dom.window.ReParoleStore.logLoginEvent('admin', 'David');
  await dom.window.ReParoleStore.logLoginEvent('ortho', 'Camille Dupont');
  const history = await dom.window.ReParoleStore.getLoginHistory();
  assert.strictEqual(history.length, 2);
  assert.ok(history.some(h=>h.account_type==='admin' && h.name==='David'));
  assert.ok(history.some(h=>h.account_type==='ortho' && h.name==='Camille Dupont'));
});

await test('logClientError() puis getRecentClientErrors() : l\'erreur ressort avec son contenu', async ()=>{
  const dom = loadStorageWithFakeSupabase();
  await dom.window.ReParoleStore.logClientError('TypeError: x is not a function', '/index.html', 'at foo (app.js:42)', 'Mozilla/5.0');
  const errors = await dom.window.ReParoleStore.getRecentClientErrors();
  assert.strictEqual(errors.length, 1);
  assert.strictEqual(errors[0].message, 'TypeError: x is not a function');
  assert.strictEqual(errors[0].page, '/index.html');
});

await test('logClientError() ne lève jamais d\'exception, même avec des valeurs vides', async ()=>{
  const dom = loadStorageWithFakeSupabase();
  await assert.doesNotReject(dom.window.ReParoleStore.logClientError(null, null, null, null));
});

console.log('\njs/admin.js — rendu des deux nouvelles cartes');

await test('admin.html : les deux cartes existent avec les bons conteneurs', ()=>{
  const html = fs.readFileSync(path.join(ROOT, 'admin.html'), 'utf8');
  assert.ok(html.includes('id="admin-login-history"'));
  assert.ok(html.includes('id="admin-client-errors"'));
});

await test('AdminPanel.renderLoginHistory()/renderClientErrors() sont bien appelées après connexion', ()=>{
  const code = fs.readFileSync(path.join(ROOT, 'js/admin.js'), 'utf8');
  const start = code.indexOf('_afterLogin(res){'); // la définition, pas un site d'appel
  const fn = code.slice(start, start + 900);
  assert.ok(/AdminPanel\.renderLoginHistory\(\)/.test(fn));
  assert.ok(/AdminPanel\.renderClientErrors\(\)/.test(fn));
});

console.log(`\n${passed} test(s) réussi(s), ${failed} échec(s).`);
if(failed > 0) process.exit(1);

}

main();
