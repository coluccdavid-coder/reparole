// =====================================================================
//  TESTS — Sécurité : échappement XSS (v6.83)
//  ---------------------------------------------------------------------
//  Trouvés en réponse à une demande explicite de revue de sécurité :
//  plusieurs endroits affichaient du texte libre contrôlé par un
//  patient (ou, pour contribuer.html, par n'importe quel visiteur non
//  connecté) sans l'échapper, dans le navigateur d'un∙e AUTRE personne
//  (orthophoniste, administrateur∙rice). Ces tests injectent une vraie
//  charge XSS dans chaque champ concerné et vérifient qu'elle ressort
//  neutralisée (jamais de <script>/onerror actif dans le HTML rendu).
//
//  Lancer : node tests/security-xss.test.js
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

const XSS = '<img src=x onerror="window.__xssFired=true">';

// Une charge est bien neutralisée si le HTML rendu ne contient plus le
// motif "onerror=" tel quel (donc pas de balise <img> active) — qu'elle
// soit passée en &lt;img... ou en entités, peu importe la forme exacte
// de l'échappement, seul compte qu'aucune balise active n'apparaisse.
function isNeutralized(html){
  return !/<img[^>]*onerror=/.test(html);
}

function loadAdminAppWithFakeSupabase(pendingItems, suggestions, trends){
  const html = fs.readFileSync(path.join(ROOT, 'admin.html'), 'utf8');
  const dom = new JSDOM(html, { url:'http://localhost/', runScripts:'outside-only', resources:'usable', pretendToBeVisual:true });
  const fakeSupabaseSrc = `
    window.__pendingItems = ${JSON.stringify(pendingItems||[])};
    window.__suggestions = ${JSON.stringify(suggestions||[])};
    window.__trends = ${JSON.stringify(trends||{error_categories_30d:{},sessions_by_type_30d:{}})};
    window.supabase = {
      createClient(){
        return {
          auth: { async getSession(){ return { data:{ session:null } }; } },
          async rpc(name){
            if(name==='get_pending_content' || name==='list_pending_content') return { data: window.__pendingItems, error:null };
            if(name==='get_suggestions') return { data: window.__suggestions, error:null };
            if(name==='get_admin_trends') return { data: window.__trends, error:null };
            return { data:null, error:null };
          },
          from(){ return { select(){ return this; }, eq(){ return this; }, order(){ return this; }, async then(){ } }; }
        };
      }
    };
  `;
  dom.window.eval(fakeSupabaseSrc);
  let storageCode = fs.readFileSync(path.join(ROOT, 'js/storage.js'), 'utf8');
  storageCode = storageCode.replace(/const SUPABASE_URL = "[^"]*";/, 'const SUPABASE_URL = "https://fake.supabase.co";');
  storageCode = storageCode.replace(/const SUPABASE_ANON_KEY = "[^"]*";/, 'const SUPABASE_ANON_KEY = "fake-key";');
  dom.window.eval(storageCode);
  // v6.83 : ReParoleStore.listPendingContent/listSuggestions/getAdminTrends
  // passent par des noms de fonction Supabase précis — on les redéfinit
  // directement pour ce test plutôt que de deviner le nom exact de chaque
  // RPC, plus robuste si l'implémentation interne change.
  dom.window.eval(`
    ReParoleStore.listPendingContent = async () => window.__pendingItems;
    ReParoleStore.listSuggestions = async () => window.__suggestions;
    ReParoleStore.getAdminTrends = async () => window.__trends;
  `);
  dom.window.eval(fs.readFileSync(path.join(ROOT, 'js/admin.js'), 'utf8'));
  return dom;
}

async function main(){

console.log('js/admin.js — contributions publiques (contribuer.html, sans connexion)');

await test('mot proposé (payload.answer) avec charge XSS -> neutralisée', async ()=>{
  const dom = loadAdminAppWithFakeSupabase([{
    id:1, kind:'vocabulary', language:'kab', domain:'denomination', level:1, created_at:new Date().toISOString(),
    payload:{ emoji:'🐱', answer: XSS, choices:['a','b'] }, sources:'test', status:'pending'
  }]);
  await dom.window.AdminPanel.renderQueue();
  assert.ok(isNeutralized(dom.window.document.getElementById('admin-queue').innerHTML));
});

await test('nom/contact/note du contributeur avec charge XSS -> neutralisés', async ()=>{
  const dom = loadAdminAppWithFakeSupabase([{
    id:2, kind:'exercise', language:'kab', domain:'denomination', level:1, created_at:new Date().toISOString(),
    payload:{ content:'ok' }, contributor_name:XSS, contributor_contact:XSS, contributor_note:XSS, status:'pending'
  }]);
  await dom.window.AdminPanel.renderQueue();
  assert.ok(isNeutralized(dom.window.document.getElementById('admin-queue').innerHTML));
});

await test('traduction proposée (translation_fr) avec charge XSS -> neutralisée', async ()=>{
  const dom = loadAdminAppWithFakeSupabase([{
    id:3, kind:'sentence', language:'kab', domain:'completion', level:1, created_at:new Date().toISOString(),
    payload:{ text:'___', answer:'x', choices:[], translation_fr:XSS }, status:'pending'
  }]);
  await dom.window.AdminPanel.renderQueue();
  assert.ok(isNeutralized(dom.window.document.getElementById('admin-queue').innerHTML));
});

console.log('\njs/admin.js — boîte à idées (déjà correcte, vérifiée pour non-régression)');

await test('message et contact d\'une suggestion avec charge XSS -> neutralisés', async ()=>{
  const dom = loadAdminAppWithFakeSupabase([], [{
    id:1, source:'patient', message:XSS, contact:XSS, status:'new', created_at:new Date().toISOString()
  }]);
  await dom.window.AdminPanel.renderSuggestions();
  assert.ok(isNeutralized(dom.window.document.getElementById('admin-suggestions').innerHTML));
});

console.log('\njs/admin.js — tendances agrégées (catégorie/type non contraints en base)');

await test('catégorie d\'erreur inconnue avec charge XSS dans le libellé -> neutralisée', async ()=>{
  const dom = loadAdminAppWithFakeSupabase([], [], { error_categories_30d:{ [XSS]:3 }, sessions_by_type_30d:{} });
  await dom.window.AdminPanel.renderTrends();
  assert.ok(isNeutralized(dom.window.document.getElementById('admin-trends').innerHTML));
});

await test('type de séance avec charge XSS -> neutralisé', async ()=>{
  const dom = loadAdminAppWithFakeSupabase([], [], { error_categories_30d:{}, sessions_by_type_30d:{ [XSS]:5 } });
  await dom.window.AdminPanel.renderTrends();
  assert.ok(isNeutralized(dom.window.document.getElementById('admin-trends').innerHTML));
});

console.log('\njs/dashboard-ortho.js — nom du patient et légendes de photos');

await test('escapeHTML() neutralise une charge XSS', ()=>{
  const dom = new JSDOM(fs.readFileSync(path.join(ROOT, 'dashboard-ortho.html'), 'utf8'), { url:'http://localhost/', runScripts:'outside-only', resources:'usable' });
  dom.window.eval(fs.readFileSync(path.join(ROOT, 'js/dashboard-ortho.js'), 'utf8').split('const Store')[0] + fs.readFileSync(path.join(ROOT, 'js/dashboard-ortho.js'), 'utf8').match(/function escapeHTML[\s\S]*?\n\}/)[0]);
  const out = dom.window.escapeHTML(XSS);
  assert.ok(!out.includes('onerror='.slice(0,7) + 'window'), 'la charge ne doit plus apparaître telle quelle');
  assert.ok(out.includes('&lt;img'));
});

console.log('\nRapports imprimables (mon-resume.html, report.html) — nom du patient');

await test('mon-resume.html : escapeHTML() est bien défini et neutralise une charge XSS', ()=>{
  const html = fs.readFileSync(path.join(ROOT, 'mon-resume.html'), 'utf8');
  assert.ok(html.includes('escapeHTML(patient.name)'), 'patient.name doit passer par escapeHTML()');
});

await test('report.html : escapeHTML() ajouté et utilisé pour le nom du patient', ()=>{
  const html = fs.readFileSync(path.join(ROOT, 'report.html'), 'utf8');
  assert.ok(html.includes('function escapeHTML'), 'escapeHTML() manquant');
  assert.ok(html.includes('escapeHTML(patient.name)'), 'patient.name doit passer par escapeHTML()');
});

console.log(`\n${passed} test(s) réussi(s), ${failed} échec(s).`);
if(failed > 0) process.exit(1);

}

main();
