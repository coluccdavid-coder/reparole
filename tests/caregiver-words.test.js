// =====================================================================
//  TESTS — Mots personnalisés proposés par l'aidant (v6.43)
//  ---------------------------------------------------------------------
//  Trois parties : stockage en mode navigateur, stockage en mode cloud
//  (faux client Supabase), et fusion dans les exercices du patient
//  (mergeCaregiverWords, js/app.js).
//
//  Lancer : node tests/caregiver-words.test.js
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
  return dom;
}

function loadStoreWithFakeSupabase(){
  const dom = new JSDOM('<!doctype html><html><body></body></html>', { url:'http://localhost/', runScripts:'outside-only' });
  const fakeSupabaseSrc = `
    window.__patients = { 'p-real': { code:'p-real', caregiver_code:'a-realcode' } };
    window.__words = []; // {id, code, word, emoji, created_at}
    window.__nextId = 1;
    window.supabase = {
      createClient(){
        return {
          auth: { async getSession(){ return { data:{ session:null } }; } },
          async rpc(name, args){
            if(name === 'add_caregiver_word'){
              const p = Object.values(window.__patients).find(p=>p.caregiver_code===args.p_caregiver_code);
              if(!p) return { data:null, error:{ message:'code aidant invalide' } };
              if(!args.p_word || !args.p_word.trim()) return { data:null, error:{ message:'mot vide' } };
              window.__words.unshift({ id:window.__nextId++, code:p.code, word:args.p_word, emoji:args.p_emoji||null, created_at:new Date().toISOString() });
              return { data:null, error:null };
            }
            if(name === 'get_caregiver_words'){
              return { data: window.__words.filter(w=>w.code===args.p_code), error:null };
            }
            if(name === 'get_caregiver_added_words'){
              const p = Object.values(window.__patients).find(p=>p.caregiver_code===args.p_caregiver_code);
              if(!p) return { data:[], error:null };
              return { data: window.__words.filter(w=>w.code===p.code), error:null };
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

console.log('Stockage — mode navigateur (localStorage)');
{
  const dom = loadStoreLocal();
  const Store = dom.window.ReParoleStore;

  await test('generateCaregiverCode puis addCaregiverWord : round-trip', async ()=>{
    const code = await Store.generateCaregiverCode('p-loc');
    dom.window.localStorage.setItem('reparole:p-loc', JSON.stringify({ code:'p-loc', name:'Loc', caregiver_code:code }));
    const res = await Store.addCaregiverWord(code, 'Voisine', '👩');
    assert.ok(!res.error);
    const words = await Store.loadCaregiverWords('p-loc');
    assert.strictEqual(words.length, 1);
    assert.strictEqual(words[0].word, 'Voisine');
    assert.strictEqual(words[0].emoji, '👩');
  });

  await test('loadCaregiverAddedWords (côté aidant) renvoie la même liste', async ()=>{
    const code = await Store.generateCaregiverCode('p-loc2');
    dom.window.localStorage.setItem('reparole:p-loc2', JSON.stringify({ code:'p-loc2', name:'Loc2', caregiver_code:code }));
    await Store.addCaregiverWord(code, 'Jardin', '🌻');
    const words = await Store.loadCaregiverAddedWords(code);
    assert.strictEqual(words.length, 1);
    assert.strictEqual(words[0].word, 'Jardin');
  });

  await test('mot vide -> erreur, rien enregistré', async ()=>{
    const code = await Store.generateCaregiverCode('p-loc3');
    const res = await Store.addCaregiverWord(code, '   ', null);
    assert.ok(res.error);
  });

  await test('code aidant invalide -> erreur explicite', async ()=>{
    const res = await Store.addCaregiverWord('a-nexistepas', 'Test', null);
    assert.ok(res.error);
  });
}

console.log('\nStockage — mode cloud (faux client Supabase)');
{
  const dom = loadStoreWithFakeSupabase();
  const Store = dom.window.ReParoleStore;

  await test('addCaregiverWord appelle bien le RPC add_caregiver_word', async ()=>{
    const res = await Store.addCaregiverWord('a-realcode', 'Petit-fils Léo', '👦');
    assert.ok(!res.error);
    assert.strictEqual(dom.window.__words.length, 1);
    assert.strictEqual(dom.window.__words[0].code, 'p-real');
  });

  await test('loadCaregiverWords (côté patient) renvoie le mot ajouté', async ()=>{
    const words = await Store.loadCaregiverWords('p-real');
    assert.strictEqual(words.length, 1);
    assert.strictEqual(words[0].word, 'Petit-fils Léo');
  });

  await test('code aidant inconnu -> erreur remontée par le RPC', async ()=>{
    const res = await Store.addCaregiverWord('a-inconnu', 'Test', null);
    assert.ok(res.error);
  });
}

console.log('\nFusion dans les exercices du patient (mergeCaregiverWords, js/app.js)');
{
  function loadPatientApp(){
    const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
    const dom = new JSDOM(html, { url:'http://localhost/', runScripts:'outside-only', resources:'usable', pretendToBeVisual:true });
    const scripts = [...dom.window.document.querySelectorAll('script[src]')].map(s=>s.getAttribute('src'));
    for(const src of scripts){
      let code = fs.readFileSync(path.join(ROOT, src), 'utf8');
      if(src === 'js/app.js'){
        code += `
          window.__testSetUser = function(overrides){
            user = Object.assign({name:'Test',level:2,sessions:0,correct:0,total:0,streak:1,plan:'free'}, overrides||{});
          };
          window.__testSetUserCode = function(code){ userCode = code; };
          window.__testMerge = async function(){ await mergeCaregiverWords(); };
        `;
      }
      // v6.45.1 : force le mode navigateur quelles que soient les vraies
      // clés Supabase baked-in dans storage.js — mergeCaregiverWords()
      // doit lire dans localStorage, pas tenter un vrai appel réseau.
      if(src === 'js/storage.js'){
        code = code.replace(/const SUPABASE_URL = "[^"]*";/, 'const SUPABASE_URL = "";')
                    .replace(/const SUPABASE_ANON_KEY = "[^"]*";/, 'const SUPABASE_ANON_KEY = "";');
      }
      dom.window.eval(code);
    }
    dom.window.eval("Prefs.load(); __testSetUserCode('p-merge'); __testSetUser({});");
    return dom;
  }

  await test('un mot proposé est ajouté à BANK.denomination.items[niveau] avec 2 distracteurs', async ()=>{
    const dom = loadPatientApp();
    dom.window.localStorage.setItem('reparole:caregiver-words:p-merge', JSON.stringify([
      { code:'p-merge', word:'grand-mère', emoji:'👵', created_at:new Date().toISOString() }
    ]));
    await dom.window.eval('__testMerge()');
    const items = dom.window.eval("BANK.denomination.items[2]");
    const added = Array.from(items).find(it => it.answer === 'GRAND-MÈRE');
    assert.ok(added, 'le mot ajouté doit apparaître, en majuscules');
    assert.strictEqual(added.emoji, '👵');
    assert.strictEqual(added.choices.length, 3); // le mot + 2 distracteurs
    assert.ok(added.choices.includes('GRAND-MÈRE'));
  });

  await test('un mot déjà présent dans la banque n\'est pas dupliqué', async ()=>{
    const dom = loadPatientApp();
    // "PAPILLON" existe déjà au niveau 2 (voir js/exercises.js)
    dom.window.localStorage.setItem('reparole:caregiver-words:p-merge', JSON.stringify([
      { code:'p-merge', word:'papillon', emoji:null, created_at:new Date().toISOString() }
    ]));
    const before = dom.window.eval("BANK.denomination.items[2].length");
    await dom.window.eval('__testMerge()');
    const after = dom.window.eval("BANK.denomination.items[2].length");
    assert.strictEqual(after, before, 'aucun item ajouté puisque le mot existait déjà');
  });

  await test('aucun mot proposé -> aucun changement, pas d\'erreur', async ()=>{
    const dom = loadPatientApp();
    const before = dom.window.eval("BANK.denomination.items[2].length");
    await dom.window.eval('__testMerge()');
    const after = dom.window.eval("BANK.denomination.items[2].length");
    assert.strictEqual(after, before);
  });

  await test('emoji par défaut (💬) si l\'aidant n\'en a pas choisi', async ()=>{
    const dom = loadPatientApp();
    dom.window.localStorage.setItem('reparole:caregiver-words:p-merge', JSON.stringify([
      { code:'p-merge', word:'oncle marc', emoji:null, created_at:new Date().toISOString() }
    ]));
    await dom.window.eval('__testMerge()');
    const items = dom.window.eval("BANK.denomination.items[2]");
    const added = Array.from(items).find(it => it.answer === 'ONCLE MARC');
    assert.strictEqual(added.emoji, '💬');
  });
}

console.log(`\n${passed} test(s) réussi(s), ${failed} échec(s).`);
if(failed > 0) process.exitCode = 1;

}

main();
