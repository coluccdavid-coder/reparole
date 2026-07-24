// =====================================================================
//  TESTS — Export / restauration de mes données (v6.69)
//  ---------------------------------------------------------------------
//  Tourne en mode navigateur (clés Supabase vidées, comme
//  partial-lang-generalization.test.js) : plus simple à tester sans
//  dépendre d'un vrai projet Supabase, et exerce la même couche Store
//  que le mode cloud (voir js/storage.js).
//
//  Lancer : node tests/export-restore-data.test.js
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
        window.Store = Store; // const Store est invisible hors de cet eval() sinon
      `;
    }
    if(src === 'js/storage.js'){
      // mode navigateur (localStorage), même principe que
      // partial-lang-generalization.test.js
      code = code.replace(/const SUPABASE_URL = "[^"]*";/, 'const SUPABASE_URL = "";')
                  .replace(/const SUPABASE_ANON_KEY = "[^"]*";/, 'const SUPABASE_ANON_KEY = "";');
    }
    dom.window.eval(code);
    // v6.247 : les 14 langues vivent dans js/i18n/<code>.js et les pages
    // n'en chargent qu'une. En test, on les charge toutes.
    if(typeof src !== 'undefined' && src === 'js/i18n.js') fs.readdirSync(path.join(ROOT, 'js/i18n'))
      .forEach(lf => dom.window.eval(fs.readFileSync(path.join(ROOT, 'js/i18n', lf), 'utf8')));
  }
  dom.window.eval("Prefs.load(); __testSetUserCode('T'); __testSetUser({});");
  // jsdom n'implémente pas URL.createObjectURL/revokeObjectURL, ni
  // Blob.prototype.text() — on remplace les deux par des stubs qui
  // capturent ce qu'un vrai navigateur aurait empaqueté dans le
  // fichier téléchargé.
  dom.window.__lastBlobParts = null;
  dom.window.Blob = function(parts, opts){
    dom.window.__lastBlobParts = parts;
    return { type: opts && opts.type, __parts: parts };
  };
  dom.window.URL.createObjectURL = ()=> 'blob:fake';
  dom.window.URL.revokeObjectURL = ()=>{};
  return dom;
}

async function main(){

console.log('Export de mes données (exportMyData)');

await test('génère un fichier JSON contenant le code, le profil et un tableau d\'historique/journal/erreurs', async ()=>{
  const dom = loadPatientApp();
  await dom.window.eval("Store.savePatient('T', {name:'Marie',level:2,sessions:5,correct:8,total:10,streak:3})");
  await dom.window.eval("Store.addJournalEntry('T', 'Bonne séance aujourd\\'hui')");
  await dom.window.eval("exportMyData()");
  const parts = dom.window.__lastBlobParts;
  assert.ok(parts, 'aucun Blob capturé — exportMyData() n\'a pas appelé new Blob(...)');
  const bundle = JSON.parse(parts[0]);
  assert.strictEqual(bundle.reparole_export_version, 1);
  assert.strictEqual(bundle.code, 'T');
  assert.ok(bundle.patient && bundle.patient.name === 'Marie');
  assert.ok(Array.isArray(bundle.journal) && bundle.journal.some(j=>j.text.includes('Bonne séance')));
  assert.ok(Array.isArray(bundle.history));
  assert.ok(Array.isArray(bundle.errors));
});

console.log('\nRestauration de ma progression (restoreMyData)');

await test('restaure le profil agrégé en gardant le MAX entre l\'existant et le fichier (jamais un recul)', async ()=>{
  const dom = loadPatientApp();
  await dom.window.eval("Store.savePatient('T', {name:'Marie',level:2,sessions:5,correct:8,total:10,streak:3})");
  const bundle = { reparole_export_version:1, code:'T', patient:{ name:'Marie', level:1, sessions:20, correct:2, total:3, streak:1 }, journal:[], history:[], errors:[] };
  const fakeFile = { text: async ()=> JSON.stringify(bundle) };
  await dom.window.restoreMyData(fakeFile);
  const patient = await dom.window.eval("Store.loadPatient('T')");
  assert.strictEqual(patient.sessions, 20, 'sessions doit prendre le plus grand des deux (20 > 5)');
  assert.strictEqual(patient.correct, 8, 'correct doit rester le plus grand des deux (8 > 2), pas reculer');
  assert.strictEqual(patient.streak, 3, 'streak ne doit pas reculer non plus');
});

await test('réimporte les entrées de journal absentes', async ()=>{
  const dom = loadPatientApp();
  const bundle = { reparole_export_version:1, code:'T', patient:null, journal:[{text:'Content de mes progrès', created_at:'2026-01-01T00:00:00.000Z'}], history:[], errors:[] };
  const fakeFile = { text: async ()=> JSON.stringify(bundle) };
  await dom.window.restoreMyData(fakeFile);
  const entries = await dom.window.eval("Store.loadJournalEntries('T')");
  assert.ok(entries.some(e=>e.text==='Content de mes progrès'));
});

await test('réimporter le même fichier deux fois ne duplique pas l\'entrée de journal', async ()=>{
  const dom = loadPatientApp();
  const bundle = { reparole_export_version:1, code:'T', patient:null, journal:[{text:'Une pensée du jour', created_at:'2026-01-01T00:00:00.000Z'}], history:[], errors:[] };
  const fakeFile = { text: async ()=> JSON.stringify(bundle) };
  await dom.window.restoreMyData(fakeFile);
  await dom.window.restoreMyData(fakeFile);
  const entries = await dom.window.eval("Store.loadJournalEntries('T')");
  const matches = entries.filter(e=>e.text==='Une pensée du jour');
  assert.strictEqual(matches.length, 1, `attendu 1 occurrence, trouvé ${matches.length}`);
});

await test('fichier avec une version inconnue -> message d\'erreur clair, aucune écriture', async ()=>{
  const dom = loadPatientApp();
  const before = await dom.window.eval("Store.loadPatient('T')");
  const fakeFile = { text: async ()=> JSON.stringify({ reparole_export_version:99, code:'T' }) };
  await dom.window.restoreMyData(fakeFile);
  const statusText = dom.window.document.getElementById('restore-status').textContent;
  assert.ok(statusText.includes('valide')===false || statusText.length>0);
  assert.ok(/ne ressemble pas/.test(statusText), 'message d\'erreur attendu pour une version non reconnue');
  const after = await dom.window.eval("Store.loadPatient('T')");
  assert.deepStrictEqual(before, after, 'aucune donnée ne doit être modifiée pour un fichier invalide');
});

await test('fichier JSON illisible -> message d\'erreur clair, pas de plantage', async ()=>{
  const dom = loadPatientApp();
  const fakeFile = { text: async ()=> 'ceci n\'est pas du JSON' };
  await dom.window.restoreMyData(fakeFile);
  const statusText = dom.window.document.getElementById('restore-status').textContent;
  assert.ok(/illisible/.test(statusText));
});

await test('les boutons export/restauration existent sur le tableau de bord', ()=>{
  const dom = loadPatientApp();
  const exportBtn = dom.window.document.querySelector('[onclick="exportMyData()"]');
  const restoreInput = dom.window.document.getElementById('restore-file-input');
  assert.ok(exportBtn, 'bouton export introuvable');
  assert.ok(restoreInput, 'input de restauration introuvable');
});

console.log(`\n${passed} test(s) réussi(s), ${failed} échec(s).`);
if(failed > 0) process.exit(1);

}

main();
