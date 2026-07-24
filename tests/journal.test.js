// =====================================================================
//  TESTS — Journal de ressenti libre (v6.41)
//  ---------------------------------------------------------------------
//  Trois parties : stockage en mode navigateur (localStorage), stockage
//  en mode cloud (faux client Supabase, même technique que
//  tests/plan-and-mfa.test.js), et affichage dans mon-resume.html.
//
//  Lancer : node tests/journal.test.js
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

function loadStoreLocal(){
  const dom = new JSDOM('<!doctype html><html><body></body></html>', { url:'http://localhost/', runScripts:'outside-only' });
  let code = fs.readFileSync(path.join(ROOT, 'js/storage.js'), 'utf8');
  // v6.45.1 : force le mode navigateur quelles que soient les vraies
  // clés Supabase baked-in dans storage.js.
  code = code.replace(/const SUPABASE_URL = "[^"]*";/, 'const SUPABASE_URL = "";')
              .replace(/const SUPABASE_ANON_KEY = "[^"]*";/, 'const SUPABASE_ANON_KEY = "";');
  dom.window.eval(code);
    // v6.247 : les 14 langues vivent dans js/i18n/<code>.js et les pages
    // n'en chargent qu'une. En test, on les charge toutes.
    if(typeof src !== 'undefined' && src === 'js/i18n.js') fs.readdirSync(path.join(ROOT, 'js/i18n'))
      .forEach(lf => dom.window.eval(fs.readFileSync(path.join(ROOT, 'js/i18n', lf), 'utf8')));
  return dom;
}

function loadStoreWithFakeSupabase(){
  const dom = new JSDOM('<!doctype html><html><body></body></html>', { url:'http://localhost/', runScripts:'outside-only' });
  const fakeSupabaseSrc = `
    window.__journal = []; // {id, code, text, created_at}
    window.__nextId = 1;
    window.supabase = {
      createClient(){
        return {
          auth: { async getSession(){ return { data:{ session:null } }; } },
          async rpc(name, args){
            if(name === 'add_journal_entry'){
              if(!args.p_text || !args.p_text.trim()) return { data:null, error:{ message:'texte vide' } };
              window.__journal.unshift({ id:window.__nextId++, code:args.p_code, text:args.p_text, created_at:new Date().toISOString() });
              return { data:null, error:null };
            }
            if(name === 'get_journal_entries'){
              return { data: window.__journal.filter(e=>e.code===args.p_code), error:null };
            }
            return { data:null, error:{ message:'RPC inconnue: '+name } };
          }
        };
      }
    };
  `;
  dom.window.eval(fakeSupabaseSrc);
  let storageCode = fs.readFileSync(path.join(ROOT, 'js/storage.js'), 'utf8');
  storageCode = storageCode.replace('const SUPABASE_URL = "";', 'const SUPABASE_URL = "https://fake.supabase.co";');
  storageCode = storageCode.replace('const SUPABASE_ANON_KEY = "";', 'const SUPABASE_ANON_KEY = "fake-key";');
  dom.window.eval(storageCode);
  return dom;
}

async function main(){

console.log('Journal — mode navigateur (localStorage)');
{
  const dom = loadStoreLocal();
  const Store = dom.window.ReParoleStore;

  await test('addJournalEntry puis loadJournalEntries : round-trip', async ()=>{
    const res = await Store.addJournalEntry('p-test', 'Aujourd\'hui, séance un peu fatigante mais ça va.');
    assert.ok(!res.error);
    const entries = await Store.loadJournalEntries('p-test');
    assert.strictEqual(entries.length, 1);
    assert.strictEqual(entries[0].text, 'Aujourd\'hui, séance un peu fatigante mais ça va.');
  });

  await test('les nouvelles entrées arrivent en tête (plus récent en premier)', async ()=>{
    await Store.addJournalEntry('p-test', 'Deuxième entrée.');
    const entries = await Store.loadJournalEntries('p-test');
    assert.strictEqual(entries.length, 2);
    assert.strictEqual(entries[0].text, 'Deuxième entrée.');
  });

  await test('texte vide -> erreur, rien enregistré', async ()=>{
    const res = await Store.addJournalEntry('p-test', '   ');
    assert.ok(res.error);
    const entries = await Store.loadJournalEntries('p-test');
    assert.strictEqual(entries.length, 2); // toujours 2, pas 3
  });

  await test('les entrées d\'un autre patient restent séparées', async ()=>{
    await Store.addJournalEntry('p-autre', 'Entrée pour un autre dossier.');
    const entriesA = await Store.loadJournalEntries('p-test');
    const entriesB = await Store.loadJournalEntries('p-autre');
    assert.strictEqual(entriesA.length, 2);
    assert.strictEqual(entriesB.length, 1);
  });
}

console.log('\nJournal — mode cloud (faux client Supabase)');
{
  const dom = loadStoreWithFakeSupabase();
  const Store = dom.window.ReParoleStore;

  await test('addJournalEntry appelle bien le RPC add_journal_entry', async ()=>{
    const res = await Store.addJournalEntry('p-cloud', 'Ressenti du jour.');
    assert.ok(!res.error);
    assert.strictEqual(dom.window.__journal.length, 1);
    assert.strictEqual(dom.window.__journal[0].text, 'Ressenti du jour.');
  });

  await test('loadJournalEntries renvoie les entrées du bon patient', async ()=>{
    const entries = await Store.loadJournalEntries('p-cloud');
    assert.strictEqual(entries.length, 1);
    assert.strictEqual(entries[0].text, 'Ressenti du jour.');
  });

  await test('texte vide -> erreur remontée par le RPC', async ()=>{
    const res = await Store.addJournalEntry('p-cloud', '');
    assert.ok(res.error);
  });
}

console.log('\nAffichage dans le résumé imprimable (mon-resume.html)');
{
  function loadSummaryPage(code, seedEntries){
    const html = fs.readFileSync(path.join(ROOT, 'mon-resume.html'), 'utf8');
    const dom = new JSDOM(html, { url:'http://localhost/mon-resume.html?code='+code, runScripts:'outside-only', resources:'usable', pretendToBeVisual:true });
    [...dom.window.document.querySelectorAll('script[src]')].map(s=>s.getAttribute('src')).forEach(src=>{
      let scriptCode = fs.readFileSync(path.join(ROOT, src), 'utf8');
      // v6.45.1 : force le mode navigateur quelles que soient les vraies
      // clés Supabase baked-in dans storage.js.
      if(src === 'js/storage.js'){
        scriptCode = scriptCode.replace(/const SUPABASE_URL = "[^"]*";/, 'const SUPABASE_URL = "";')
                                .replace(/const SUPABASE_ANON_KEY = "[^"]*";/, 'const SUPABASE_ANON_KEY = "";');
      }
      dom.window.eval(scriptCode);
    });
    [...dom.window.document.querySelectorAll('script:not([src])')].map(s=>s.textContent).forEach(code=>{
      dom.window.eval(code);
    // v6.247 : les 14 langues vivent dans js/i18n/<code>.js et les pages
    // n'en chargent qu'une. En test, on les charge toutes.
    if(typeof src !== 'undefined' && src === 'js/i18n.js') fs.readdirSync(path.join(ROOT, 'js/i18n'))
      .forEach(lf => dom.window.eval(fs.readFileSync(path.join(ROOT, 'js/i18n', lf), 'utf8')));
    });
    dom.window.localStorage.setItem('reparole:'+code, JSON.stringify({ code, name:'Test', level:2, sessions:1, correct:1, total:1, streak:1 }));
    if(seedEntries) dom.window.localStorage.setItem('reparole:journal:'+code, JSON.stringify(seedEntries));
    return dom;
  }

  await test('aucune entrée -> pas de section "Mon journal"', async ()=>{
    const dom = loadSummaryPage('p-nojournal');
    await dom.window.buildSummary();
    const html = dom.window.document.getElementById('report').innerHTML;
    assert.ok(!html.includes('Mon journal'));
  });

  await test('avec des entrées -> section "Mon journal" affichée, texte échappé', async ()=>{
    const dom = loadSummaryPage('p-withjournal', [
      { code:'p-withjournal', text:'Une <script>alerte</script> test', created_at:new Date().toISOString() }
    ]);
    await dom.window.buildSummary();
    const html = dom.window.document.getElementById('report').innerHTML;
    assert.ok(html.includes('Mon journal'));
    assert.ok(!html.includes('<script>alerte</script>'), 'le texte doit être échappé, pas interprété comme du HTML');
    assert.ok(html.includes('&lt;script&gt;'));
  });
}

console.log(`\n${passed} test(s) réussi(s), ${failed} échec(s).`);
if(failed > 0) process.exitCode = 1;

}

main();
