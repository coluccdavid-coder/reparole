// =====================================================================
//  TESTS — Carte "Vos photos" : le message de succès ne doit plus
//  mentir en cas d'échec réel de l'envoi (v6.84)
//  ---------------------------------------------------------------------
//  Retour utilisateur (capture d'écran) : le message "✅ Photo
//  ajoutée !" s'affichait, mais la liste montrait ensuite "Aucune
//  photo ajoutée pour l'instant." Cause réelle : Store.addMedia()
//  renvoie null si l'envoi Supabase Storage/RPC échoue (le plus
//  souvent parce que le bucket "patient-media" n'existe pas encore
//  dans le projet Supabase — voir README.md), mais uploadMedia()
//  (js/app.js) ne vérifiait jamais cette valeur de retour avant
//  d'afficher la confirmation.
//
//  Lancer : node tests/photo-upload-failure.test.js
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
    if(src === 'js/storage.js'){
      code = code.replace(/const SUPABASE_URL = "[^"]*";/, 'const SUPABASE_URL = "";')
                  .replace(/const SUPABASE_ANON_KEY = "[^"]*";/, 'const SUPABASE_ANON_KEY = "";');
    }
    if(src === 'js/app.js'){
      code += `
        window.__testSetUser = function(overrides){
          user = Object.assign({name:'Test',level:1,sessions:0,correct:0,total:0,streak:1,plan:'free'}, overrides||{});
        };
        window.__testSetUserCode = function(code){ userCode = code; };
      `;
    }
    dom.window.eval(code);
    // v6.247 : les 14 langues vivent dans js/i18n/<code>.js et les pages
    // n'en chargent qu'une. En test, on les charge toutes.
    if(typeof src !== 'undefined' && src === 'js/i18n.js') fs.readdirSync(path.join(ROOT, 'js/i18n'))
      .forEach(lf => dom.window.eval(fs.readFileSync(path.join(ROOT, 'js/i18n', lf), 'utf8')));
  }
  dom.window.eval("Prefs.load(); __testSetUserCode('T'); __testSetUser({});");
  return dom;
}

function setFile(dom, name){
  const file = new dom.window.File(['contenu de test'], name, { type:'text/plain' });
  const input = dom.window.document.getElementById('media-file');
  Object.defineProperty(input, 'files', { value:[file], configurable:true });
}

async function main(){

console.log('Carte "Vos photos" — le message de succès reflète le vrai résultat (v6.84)');

await test("Store.addMedia() renvoie null (échec simulé) -> message d'erreur, PAS de faux succès", async ()=>{
  const dom = loadPatientApp();
  dom.window.document.getElementById('media-label').value = 'jardin';
  setFile(dom, 'jardin.jpg');
  // simule l'échec réel observé (bucket Storage manquant, etc.)
  dom.window.eval("ReParoleStore.addMedia = async () => null;");
  await dom.window.uploadMedia();
  const status = dom.window.document.getElementById('media-status').textContent;
  assert.ok(!/✅/.test(status), `le message ne doit plus afficher un faux succès, reçu : ${status}`);
  assert.ok(status.length > 0, 'un message d\'erreur est attendu');
});

await test('en cas d\'échec, le mot tapé n\'est pas effacé (pas besoin de tout retaper)', async ()=>{
  const dom = loadPatientApp();
  dom.window.document.getElementById('media-label').value = 'jardin';
  setFile(dom, 'jardin.jpg');
  dom.window.eval("ReParoleStore.addMedia = async () => null;");
  await dom.window.uploadMedia();
  assert.strictEqual(dom.window.document.getElementById('media-label').value, 'jardin');
});

await test('en cas d\'échec, la liste ne se réaffiche pas comme si de rien n\'était (renderMedia non appelé)', async ()=>{
  const dom = loadPatientApp();
  let renderCalled = false;
  dom.window.eval("ReParoleStore.addMedia = async () => null;");
  dom.window.renderMedia = async ()=>{ renderCalled = true; };
  dom.window.document.getElementById('media-label').value = 'jardin';
  setFile(dom, 'jardin.jpg');
  await dom.window.uploadMedia();
  assert.strictEqual(renderCalled, false);
});

await test('Store.addMedia() renvoie un objet (succès réel) -> vraie confirmation, comportement inchangé', async ()=>{
  const dom = loadPatientApp();
  dom.window.document.getElementById('media-label').value = 'jardin';
  setFile(dom, 'jardin.jpg');
  await dom.window.uploadMedia();
  const status = dom.window.document.getElementById('media-status').textContent;
  assert.ok(/✅/.test(status) && status.includes('jardin'), `vraie confirmation attendue, reçu : ${status}`);
  assert.strictEqual(dom.window.document.getElementById('media-label').value, '', 'le champ doit être vidé après un vrai succès');
});

console.log('\nStore.addMedia() elle-même — ne renvoie plus un faux succès en cas d\'échec RPC');

await test('addMedia() : source lit bien null en cas d\'erreur RPC add_media (pas de repli "succès" fantôme)', ()=>{
  const code = fs.readFileSync(path.join(ROOT, 'js/storage.js'), 'utf8');
  const fn = code.slice(code.indexOf('async addMedia('), code.indexOf('async listMedia('));
  assert.ok(/if\(error\)\{[\s\S]*?return null;/.test(fn), 'addMedia() doit renvoyer null si la RPC add_media échoue, pas un objet de repli');
});

console.log(`\n${passed} test(s) réussi(s), ${failed} échec(s).`);
if(failed > 0) process.exit(1);

}

main();
