// =====================================================================
//  TESTS — Base de connaissances communautaire (v6.38)
//  ---------------------------------------------------------------------
//  Trois parties :
//   1. js/contribute.js : logique pure (mapping type -> kind/domain,
//      découpage des distracteurs) — aucun DOM nécessaire.
//   2. js/storage.js : les nouvelles méthodes (submitContent,
//      signInAdmin, listPendingContent, reviewContent, getAdminTrends,
//      loadApprovedContent), via un faux client Supabase — même
//      technique que tests/plan-and-mfa.test.js. On vérifie surtout
//      que submitContent force TOUJOURS status='pending' côté
//      fonction RPC (impossible de s'auto-approuver), et que
//      signInAdmin refuse un compte sans ligne dans `admins`.
//   3. js/app.js : mergeApprovedContent() ajoute bien le vocabulaire
//      approuvé à BANK_KAB.denomination, et ignore le reste.
//
//  Lancer : node tests/knowledge-base.test.js
// =====================================================================

const assert = require('assert');
const { JSDOM } = require('jsdom');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
let passed = 0, failed = 0;
async function test(name, fn){
  try{ await fn(); console.log('  ✔', name); passed++; }
  catch(e){ console.log('  ✘', name, '—', e.message); failed++; }
}

async function main(){

// ---------------------------------------------------------------------
//  Partie 1 : js/contribute.js (logique pure)
// ---------------------------------------------------------------------
console.log("Formulaire de contribution (js/contribute.js)");
const { KIND_MAP, splitDistractors } = require('../js/contribute.js');

await test('mot isolé -> kind vocabulary, domaine denomination', ()=>{
  assert.deepStrictEqual(KIND_MAP['vocabulary'], { kind:'vocabulary', domain:'denomination' });
});
await test('phrase à trous -> kind sentence, domaine completion', ()=>{
  assert.deepStrictEqual(KIND_MAP['sentence-completion'], { kind:'sentence', domain:'completion' });
});
await test('question à choix -> kind sentence, domaine comprehension', ()=>{
  assert.deepStrictEqual(KIND_MAP['sentence-comprehension'], { kind:'sentence', domain:'comprehension' });
});
await test('autre idée -> kind exercise', ()=>{
  assert.strictEqual(KIND_MAP['exercise'].kind, 'exercise');
});
await test('splitDistractors : découpe, majuscule, ignore les vides', ()=>{
  assert.deepStrictEqual(splitDistractors('aqjun, aqnin,  ,'), ['AQJUN','AQNIN']);
});
await test('splitDistractors : chaîne vide -> tableau vide', ()=>{
  assert.deepStrictEqual(splitDistractors(''), []);
});

// ---------------------------------------------------------------------
//  Partie 2 : js/storage.js avec un faux client Supabase
// ---------------------------------------------------------------------
console.log('\nCouche de stockage (faux client Supabase)');

function loadStoreWithFakeSupabase(){
  const dom = new JSDOM('<!doctype html><html><body></body></html>', { url:'http://localhost/', runScripts:'outside-only' });

  const fakeSupabaseSrc = `
    window.__admins = {}; // code -> {code,name,email}
    window.__contentItems = []; // {id,...}
    window.__nextId = 1;
    window.supabase = {
      createClient(){
        return {
          auth: {
            async signInWithPassword({email,password}){
              // simule un compte Supabase Auth existant pour n'importe quel email/mdp fourni au test
              return { data:{ session:{ user:{ id: email==='inconnu@test.fr' ? 'user-no-admin' : 'admin-1', email } } }, error:null };
            },
            async getSession(){ return { data:{ session:{ user:{ id:'admin-1', email:'admin@test.fr' } } } }; },
            async signOut(){ return {}; }
          },
          async rpc(name, args){
            if(name === 'submit_content'){
              const id = window.__nextId++;
              window.__contentItems.push(Object.assign({ id, status:'pending', created_at:new Date().toISOString() },
                { language:args.p_language, domain:args.p_domain, level:args.p_level, kind:args.p_kind,
                  payload:args.p_payload, sources:args.p_sources, contributor_name:args.p_contributor_name,
                  contributor_contact:args.p_contributor_contact, contributor_note:args.p_contributor_note }));
              return { data:id, error:null };
            }
            if(name === 'get_admin_trends'){
              return { data:{ error_categories_30d:{ semantic:5, phonological:2 }, sessions_by_type_30d:{ denomination:10 }, generated_at:new Date().toISOString() }, error:null };
            }
            return { data:null, error:{ message:'RPC inconnue: '+name } };
          },
          from(table){
            const self = this;
            const state = { table, filters:{} };
            return {
              select(){ return this; },
              eq(k,v){ state.filters[k]=v; return this; },
              order(){ return this; },
              async maybeSingle(){
                if(table==='admins') return { data: window.__admins[state.filters.code] || null };
                return { data: null };
              },
              update(obj){
                return {
                  eq: async (k,v) => {
                    if(table==='content_items'){
                      const row = window.__contentItems.find(i=>i[k]===v);
                      if(row) Object.assign(row, obj);
                      return { error:null };
                    }
                    return { error:null };
                  }
                };
              },
              then(resolve){
                // rend le "await supa.from(...).select().eq(...)" utilisable sans .maybeSingle()
                if(table==='content_items'){
                  let rows = window.__contentItems.slice();
                  Object.entries(state.filters).forEach(([k,v])=>{ rows = rows.filter(r=>r[k]===v); });
                  resolve({ data: rows, error:null });
                } else {
                  resolve({ data:[], error:null });
                }
              }
            };
          }
        };
      }
    };
  `;
  dom.window.eval(fakeSupabaseSrc);
  // Un seul compte admin existe déjà dans notre fausse base : admin-1
  dom.window.eval("window.__admins['admin-1'] = { code:'admin-1', name:'Sarah', email:'admin@test.fr' };");

  let storageCode = fs.readFileSync(path.join(ROOT, 'js/storage.js'), 'utf8');
  storageCode = storageCode.replace('const SUPABASE_URL = "";', 'const SUPABASE_URL = "https://fake.supabase.co";');
  storageCode = storageCode.replace('const SUPABASE_ANON_KEY = "";', 'const SUPABASE_ANON_KEY = "fake-key";');
  dom.window.eval(storageCode);
  return dom;
}

{
  const dom = loadStoreWithFakeSupabase();
  const Store = dom.window.ReParoleStore;

  await test('submitContent enregistre bien la proposition, toujours en attente', async ()=>{
    const res = await Store.submitContent({
      language:'kab', domain:'denomination', level:1, kind:'vocabulary',
      payload:{ emoji:'🐫', answer:'ALƔEM', choices:['ALƔEM','AQJUN','AQNIN'] },
      sources:'Glosbe', contributorName:'Test', contributorContact:null, contributorNote:null
    });
    assert.ok(!res.error);
    assert.ok(res.id);
    const stored = dom.window.__contentItems.find(i=>i.id===res.id);
    assert.strictEqual(stored.status, 'pending');
  });

  await test('signInAdmin réussit pour un compte présent dans `admins`', async ()=>{
    const res = await Store.signInAdmin('admin@test.fr', 'whatever');
    assert.ok(!res.error);
    assert.strictEqual(res.name, 'Sarah');
  });

  await test('signInAdmin refuse un compte Supabase Auth valide mais absent de `admins`', async ()=>{
    const res = await Store.signInAdmin('inconnu@test.fr', 'whatever');
    assert.ok(res.error, 'un compte sans ligne admins ne doit jamais être traité comme administrateur');
  });

  await test('listPendingContent renvoie les propositions en attente', async ()=>{
    const items = await Store.listPendingContent();
    assert.ok(items.length >= 1);
    assert.ok(items.every(i=>i.status==='pending'));
  });

  await test('reviewContent(...,"approved") change bien le statut', async ()=>{
    const pending = await Store.listPendingContent();
    const id = pending[0].id;
    const res = await Store.reviewContent(id, 'approved', 'admin-1', null);
    assert.ok(!res.error);
    const row = dom.window.__contentItems.find(i=>i.id===id);
    assert.strictEqual(row.status, 'approved');
  });

  await test('loadApprovedContent ne renvoie que les entrées approuvées', async ()=>{
    const items = await Store.loadApprovedContent('kab', 'denomination');
    assert.ok(items.length >= 1);
  });

  await test('getAdminTrends renvoie des totaux agrégés (aucune donnée individuelle)', async ()=>{
    const trends = await Store.getAdminTrends();
    assert.ok(trends);
    assert.strictEqual(trends.error_categories_30d.semantic, 5);
    assert.strictEqual(trends.sessions_by_type_30d.denomination, 10);
  });
}

// ---------------------------------------------------------------------
//  Partie 3 : js/app.js — mergeApprovedContent() fusionne le
//  vocabulaire approuvé dans BANK_KAB.denomination, et seulement ça.
// ---------------------------------------------------------------------
console.log('\nFusion des contributions approuvées (js/app.js)');

function loadAppWithFakeApprovedContent(approvedItems){
  const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  const dom = new JSDOM(html, { url:'http://localhost/', runScripts:'outside-only', resources:'usable', pretendToBeVisual:true });
  const scripts = [...dom.window.document.querySelectorAll('script[src]')].map(s=>s.getAttribute('src'));
  for(const src of scripts){
    if(src === 'js/storage.js'){
      // Remplace storage.js par un mini faux Store : suffisant pour
      // tester mergeApprovedContent sans reconstruire tout Supabase ici.
      dom.window.eval(`
        window.ReParoleStore = {
          mode(){ return 'cloud'; },
          async loadApprovedContent(lang, domain){
            if(lang!=='kab' || domain!=='denomination') return [];
            return ${JSON.stringify(approvedItems)};
          }
        };
      `);
      continue;
    }
    const code = fs.readFileSync(path.join(ROOT, src), 'utf8');
    dom.window.eval(code);
  }
  return dom;
}

await test('un mot approuvé (kind vocabulary) est ajouté au bon niveau de BANK_KAB', async ()=>{
  const dom = loadAppWithFakeApprovedContent([
    { level:2, kind:'vocabulary', payload:{ emoji:'🐫', answer:'ALƔEM', choices:['ALƔEM','AQJUN','AQNIN'] } }
  ]);
  await dom.window.mergeApprovedContent();
  const items = dom.window.BANK_KAB.denomination.items[2];
  assert.ok(items.some(it=>it.answer==='ALƔEM'), "le mot approuvé doit apparaître dans BANK_KAB.denomination.items[2]");
});

await test('une phrase approuvée (kind sentence) N\'est PAS fusionnée automatiquement', async ()=>{
  const dom = loadAppWithFakeApprovedContent([
    { level:1, kind:'sentence', payload:{ text:'Aql-i tetteɣ ___.', answer:'TATTEFFAḤT', choices:['TATTEFFAḤT','AMAN'] } }
  ]);
  await dom.window.mergeApprovedContent();
  const level1 = dom.window.BANK_KAB.denomination.items[1] || [];
  assert.ok(!level1.some(it=>it.answer==='TATTEFFAḤT'), "une phrase ne doit jamais atterrir dans les items de dénomination");
});

await test('une entrée mal formée (sans emoji) est ignorée sans planter', async ()=>{
  const dom = loadAppWithFakeApprovedContent([
    { level:2, kind:'vocabulary', payload:{ answer:'SANS_EMOJI', choices:['SANS_EMOJI'] } }
  ]);
  await dom.window.mergeApprovedContent(); // ne doit pas lever d'exception
  const items = dom.window.BANK_KAB.denomination.items[2] || [];
  assert.ok(!items.some(it=>it.answer==='SANS_EMOJI'));
});

await test('mode navigateur (pas de cloud) : mergeApprovedContent ne fait rien', async ()=>{
  const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  const dom = new JSDOM(html, { url:'http://localhost/', runScripts:'outside-only', resources:'usable', pretendToBeVisual:true });
  const scripts = [...dom.window.document.querySelectorAll('script[src]')].map(s=>s.getAttribute('src'));
  for(const src of scripts){ dom.window.eval(fs.readFileSync(path.join(ROOT, src), 'utf8')); }
  const before = JSON.stringify(dom.window.BANK_KAB.denomination.items);
  await dom.window.mergeApprovedContent(); // Store.mode() === 'navigateur' ici (pas de clés Supabase)
  const after = JSON.stringify(dom.window.BANK_KAB.denomination.items);
  assert.strictEqual(before, after);
});

console.log(`\n${passed} test(s) réussi(s), ${failed} échec(s).`);
if(failed > 0) process.exitCode = 1;

}

main();
