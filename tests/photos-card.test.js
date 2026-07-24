// =====================================================================
//  TESTS — Carte "Vos photos" : ordre, retour utilisateur, "comment ça
//  marche" (v6.78)
//  ---------------------------------------------------------------------
//  Retour utilisateur (capture d'écran) : le texte de la carte donnait
//  l'impression d'être dupliqué (description + message "vide" du
//  #media-grid, empilés avant même le formulaire), et rien n'expliquait
//  ce qui se passe après avoir ajouté une photo. Vérifie le nouvel
//  ordre (description -> "comment ça marche" -> formulaire -> retour ->
//  liste des photos), le message de confirmation après ajout, et le
//  remplacement de l'ancien alert() par un message en ligne.
//
//  Tourne en mode navigateur (clés Supabase vidées) : Store.addMedia()
//  utilise alors FileReader plutôt que l'upload Supabase, plus simple à
//  tester sans vrai projet. Fichiers de test volontairement non-image
//  (type 'text/plain') pour éviter le décodage d'image réel via
//  <canvas>/Image, non fiable dans jsdom — resizeImageFile() renvoie le
//  fichier tel quel dans ce cas (voir js/app.js), donc le comportement
//  testé ici (validation, statut, ordre d'affichage) reste réaliste.
//
//  Lancer : node tests/photos-card.test.js
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

console.log('Carte "Vos photos" — ordre et retour utilisateur (v6.78)');

await test('ordre des blocs : description, puis "comment ça marche", puis le formulaire, avant la liste', ()=>{
  const dom = loadPatientApp();
  const card = [...dom.window.document.querySelectorAll('.card')].find(c=>c.querySelector('#media-grid'));
  assert.ok(card, 'carte "Vos photos" introuvable');
  const html = card.innerHTML;
  const descIdx = html.indexOf('photos_desc') === -1 ? html.indexOf('Ajoutez une photo de votre quotidien') : -1;
  const howIdx = html.indexOf('id="media-label"'); // repère : juste après le bloc "comment ça marche"
  const formIdx = html.indexOf('upload-photo-form');
  const gridIdx = html.indexOf('id="media-grid"');
  assert.ok(formIdx < gridIdx, 'le formulaire doit apparaître avant la liste des photos (pas après)');
  assert.ok(howIdx > -1 && howIdx < gridIdx);
});

await test('le message "aucune photo" (#media-grid vide) apparaît sous le formulaire, pas au-dessus', ()=>{
  const dom = loadPatientApp();
  const card = [...dom.window.document.querySelectorAll('.card')].find(c=>c.querySelector('#media-grid'));
  const html = card.innerHTML;
  const formIdx = html.indexOf('upload-photo-form');
  const gridIdx = html.indexOf('id="media-grid"');
  assert.ok(gridIdx > formIdx, 'le conteneur de la liste (et donc son état vide) doit venir après le formulaire');
});

await test('bloc "Comment ça marche ?" présent (repliable, <details>/<summary>)', ()=>{
  const dom = loadPatientApp();
  const details = dom.window.document.querySelector('.card details summary[data-i18n="photos_how_it_works_title"]');
  assert.ok(details, 'bloc "Comment ça marche ?" introuvable');
});

await test("validation : formulaire incomplet -> message en ligne (plus d'alert())", async ()=>{
  const dom = loadPatientApp();
  await dom.window.uploadMedia();
  const status = dom.window.document.getElementById('media-status').textContent;
  assert.ok(status.length > 0, 'un message de statut est attendu');
  assert.ok(status.includes('Choisissez une photo'), `message attendu, reçu : ${status}`);
});

await test('ajout réussi : message de confirmation avec le mot ajouté', async ()=>{
  const dom = loadPatientApp();
  dom.window.document.getElementById('media-label').value = 'jardin';
  setFile(dom, 'jardin.jpg');
  await dom.window.uploadMedia();
  const status = dom.window.document.getElementById('media-status').textContent;
  assert.ok(status.includes('jardin'), `le mot ajouté doit apparaître dans la confirmation, reçu : ${status}`);
  assert.ok(status.includes('Nommer vos photos'), 'la confirmation doit indiquer où retrouver la photo');
});

await test('ajout réussi : le titre "Vos photos ajoutées" et la photo apparaissent dans la liste', async ()=>{
  const dom = loadPatientApp();
  dom.window.document.getElementById('media-label').value = 'chat';
  setFile(dom, 'chat.jpg');
  await dom.window.uploadMedia();
  const listTitle = dom.window.document.getElementById('media-list-title');
  assert.strictEqual(listTitle.style.display, '', 'le titre doit redevenir visible une fois une photo ajoutée');
  const grid = dom.window.document.getElementById('media-grid').innerHTML;
  assert.ok(grid.includes('chat'));
});

await test('L\'exercice "Nommer vos photos" devient visible après le premier ajout', async ()=>{
  const dom = loadPatientApp();
  const exItem = dom.window.document.querySelector('.ex-item[data-type="photos_perso"]');
  assert.strictEqual(exItem.style.display, 'none', "masqué tant qu'aucune photo n'est ajoutée");
  dom.window.document.getElementById('media-label').value = 'jardin';
  setFile(dom, 'jardin.jpg');
  await dom.window.uploadMedia();
  assert.strictEqual(exItem.style.display, '', 'doit devenir visible après le premier ajout');
});

await test('sans photo ajoutée : le titre "Vos photos ajoutées" reste masqué (pas de redondance avec le message vide)', async ()=>{
  const dom = loadPatientApp();
  await dom.window.renderMedia();
  const listTitle = dom.window.document.getElementById('media-list-title');
  assert.strictEqual(listTitle.style.display, 'none');
});

console.log(`\n${passed} test(s) réussi(s), ${failed} échec(s).`);
if(failed > 0) process.exit(1);

}

main();
