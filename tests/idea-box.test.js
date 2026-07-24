// =====================================================================
//  TESTS — Boîte à idées ("Une idée, une remarque ?") (v6.80)
//  ---------------------------------------------------------------------
//  Widget partagé (js/suggestions.js) réutilisé sur index.html,
//  aidant.html et dashboard-ortho.html, chacun avec sa propre source
//  ('patient'/'caregiver'/'ortho'), plus le tri côté admin.html.
//  Tourne en mode navigateur (clés Supabase vidées) : ReParoleStore.
//  submitSuggestion()/listSuggestions() utilisent alors localStorage,
//  plus simple à tester sans vrai projet Supabase.
//
//  Lancer : node tests/idea-box.test.js
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

function loadPage(file){
  const html = fs.readFileSync(path.join(ROOT, file), 'utf8');
  const dom = new JSDOM(html, { url:'http://localhost/', runScripts:'outside-only', resources:'usable', pretendToBeVisual:true });
  const scripts = [...dom.window.document.querySelectorAll('script[src]')].map(s=>s.getAttribute('src'));
  for(const src of scripts){
    let code = fs.readFileSync(path.join(ROOT, src), 'utf8');
    if(src === 'js/storage.js'){
      code = code.replace(/const SUPABASE_URL = "[^"]*";/, 'const SUPABASE_URL = "";')
                  .replace(/const SUPABASE_ANON_KEY = "[^"]*";/, 'const SUPABASE_ANON_KEY = "";');
    }
    dom.window.eval(code);
    // v6.247 : les 14 langues vivent dans js/i18n/<code>.js et les pages
    // n'en chargent qu'une. En test, on les charge toutes.
    if(typeof src !== 'undefined' && src === 'js/i18n.js') fs.readdirSync(path.join(ROOT, 'js/i18n'))
      .forEach(lf => dom.window.eval(fs.readFileSync(path.join(ROOT, 'js/i18n', lf), 'utf8')));
  }
  dom.window.eval("if(typeof Prefs !== 'undefined') Prefs.load();");
  return dom;
}

async function main(){

console.log('Boîte à idées — présence du widget sur les trois espaces');

const WIDGET_PAGES = [
  { file:'index.html', source:'patient' },
  { file:'aidant.html', source:'caregiver' },
  { file:'dashboard-ortho.html', source:'ortho' },
];

for(const { file, source } of WIDGET_PAGES){
  await test(`${file} : widget présent, source correcte ('${source}')`, ()=>{
    const html = fs.readFileSync(path.join(ROOT, file), 'utf8');
    assert.ok(html.includes('data-i18n="suggestion_box_title"'), 'titre du widget manquant');
    assert.ok(html.includes(`onclick="SuggestionBox.submit('${source}')"`), `bouton d'envoi avec la bonne source ('${source}') manquant`);
    assert.ok(html.includes('id="suggestion-message"') && html.includes('id="suggestion-status"'));
  });
}

console.log('\nEnvoi (mode navigateur, localStorage)');

await test("message vide -> message d'erreur, rien n'est enregistré", async ()=>{
  const dom = loadPage('index.html');
  await dom.window.SuggestionBox.submit('patient');
  const statusText = dom.window.document.getElementById('suggestion-status').textContent;
  assert.ok(statusText.length > 0);
  const stored = JSON.parse(dom.window.localStorage.getItem('reparole:suggestions-local') || '[]');
  assert.strictEqual(stored.length, 0);
});

await test('message valide -> confirmation affichée, enregistré en local avec la bonne source', async ()=>{
  const dom = loadPage('index.html');
  dom.window.document.getElementById('suggestion-message').value = 'Il faudrait un mode contraste élevé.';
  await dom.window.SuggestionBox.submit('patient');
  const statusText = dom.window.document.getElementById('suggestion-status').textContent;
  assert.ok(/Merci|Thanks|thank/i.test(statusText), `confirmation attendue, reçu : ${statusText}`);
  const stored = JSON.parse(dom.window.localStorage.getItem('reparole:suggestions-local') || '[]');
  assert.strictEqual(stored.length, 1);
  assert.strictEqual(stored[0].source, 'patient');
  assert.strictEqual(stored[0].message, 'Il faudrait un mode contraste élevé.');
  assert.strictEqual(stored[0].status, 'new');
});

await test('le champ message est vidé après un envoi réussi, pas le contact', async ()=>{
  const dom = loadPage('index.html');
  dom.window.document.getElementById('suggestion-message').value = 'Une idée';
  dom.window.document.getElementById('suggestion-contact').value = 'moi@exemple.fr';
  await dom.window.SuggestionBox.submit('patient');
  assert.strictEqual(dom.window.document.getElementById('suggestion-message').value, '');
});

await test('contact facultatif : peut être omis sans bloquer l\'envoi', async ()=>{
  const dom = loadPage('aidant.html');
  dom.window.document.getElementById('suggestion-message').value = 'Idée sans contact';
  await dom.window.SuggestionBox.submit('caregiver');
  const stored = JSON.parse(dom.window.localStorage.getItem('reparole:suggestions-local') || '[]');
  assert.strictEqual(stored[0].contact, null);
});

console.log('\nCôté admin — tri et changement de statut');

await test("AdminPanel.renderSuggestions() : filtre 'new' par défaut n'affiche pas les archivées", async ()=>{
  const dom = loadPage('admin.html');
  dom.window.localStorage.setItem('reparole:suggestions-local', JSON.stringify([
    { id:1, source:'patient', message:'Nouvelle idée', contact:null, status:'new', created_at:new Date().toISOString() },
    { id:2, source:'ortho', message:'Idée déjà archivée', contact:null, status:'archived', created_at:new Date().toISOString() },
  ]));
  await dom.window.AdminPanel.renderSuggestions();
  const html = dom.window.document.getElementById('admin-suggestions').innerHTML;
  assert.ok(html.includes('Nouvelle idée'));
  assert.ok(!html.includes('Idée déjà archivée'));
});

await test("setSuggestionFilter('all') affiche tout, y compris les archivées", async ()=>{
  const dom = loadPage('admin.html');
  dom.window.localStorage.setItem('reparole:suggestions-local', JSON.stringify([
    { id:1, source:'patient', message:'Nouvelle idée', contact:null, status:'new', created_at:new Date().toISOString() },
    { id:2, source:'ortho', message:'Idée déjà archivée', contact:null, status:'archived', created_at:new Date().toISOString() },
  ]));
  await dom.window.AdminPanel.setSuggestionFilter('all');
  const html = dom.window.document.getElementById('admin-suggestions').innerHTML;
  assert.ok(html.includes('Nouvelle idée') && html.includes('Idée déjà archivée'));
});

await test("updateSuggestion(id,'archived') change bien le statut en local", async ()=>{
  const dom = loadPage('admin.html');
  dom.window.localStorage.setItem('reparole:suggestions-local', JSON.stringify([
    { id:1, source:'patient', message:'À archiver', contact:null, status:'new', created_at:new Date().toISOString() },
  ]));
  await dom.window.AdminPanel.updateSuggestion(1, 'archived');
  const stored = JSON.parse(dom.window.localStorage.getItem('reparole:suggestions-local'));
  assert.strictEqual(stored[0].status, 'archived');
});

await test('aucune suggestion : message "rien pour l\'instant", pas de plantage', async ()=>{
  const dom = loadPage('admin.html');
  dom.window.localStorage.setItem('reparole:suggestions-local', '[]');
  await dom.window.AdminPanel.renderSuggestions();
  const html = dom.window.document.getElementById('admin-suggestions').innerHTML;
  assert.ok(html.includes('Rien ici'));
});

console.log(`\n${passed} test(s) réussi(s), ${failed} échec(s).`);
if(failed > 0) process.exit(1);

}

main();
