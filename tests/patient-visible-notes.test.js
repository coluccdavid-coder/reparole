// =====================================================================
//  TESTS — Conseils de l'orthophoniste visibles côté patient (v6.95)
//  ---------------------------------------------------------------------
//  Réponse à "j'aurai aimé... pouvoir donner des conseils" : jusqu'ici,
//  aucune note de l'orthophoniste n'était jamais visible par le
//  patient. Vérifie le drapeau par note (privée par défaut), le
//  rendu de la carte "Conseils de votre orthophoniste" côté patient
//  (visible seulement s'il y a du contenu, échappement HTML), et le
//  badge/case à cocher côté orthophoniste.
//
//  Lancer : node tests/patient-visible-notes.test.js
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
      `;
    }
    if(src === 'js/storage.js'){
      code = code.replace(/const SUPABASE_URL = "[^"]*";/, 'const SUPABASE_URL = "";')
                  .replace(/const SUPABASE_ANON_KEY = "[^"]*";/, 'const SUPABASE_ANON_KEY = "";');
    }
    dom.window.eval(code);
  }
  dom.window.eval("Prefs.load(); __testSetUserCode('T'); __testSetUser({});");
  return dom;
}

async function main(){

console.log('sql/schema.sql — colonne et fonction dédiée');

await test('la colonne visible_to_patient et get_patient_visible_notes() existent', ()=>{
  const sql = fs.readFileSync(path.join(ROOT, 'sql/schema.sql'), 'utf8');
  assert.ok(/alter table notes add column if not exists visible_to_patient/.test(sql));
  assert.ok(/create or replace function get_patient_visible_notes/.test(sql));
  assert.ok(/where code = p_code and visible_to_patient = true/.test(sql), 'ne doit jamais renvoyer les notes privées');
});

console.log('\nReParoleStore — comportement par défaut privé, mode navigateur');

await test('une note ajoutée sans préciser le drapeau reste privée par défaut', async ()=>{
  const dom = loadPatientApp();
  await dom.window.ReParoleStore.addNote('T', 'ortho-1', 'Note privée par défaut');
  const visible = await dom.window.ReParoleStore.loadPatientVisibleNotes('T');
  assert.strictEqual(visible.length, 0, 'aucune note ne doit apparaître côté patient sans le drapeau explicite');
  const all = await dom.window.ReParoleStore.listNotes('T');
  assert.strictEqual(all.length, 1, 'la note doit quand même exister côté orthophoniste');
});

await test('une note marquée visible apparaît bien côté patient, avec son contenu exact', async ()=>{
  const dom = loadPatientApp();
  await dom.window.ReParoleStore.addNote('T', 'ortho-1', 'Continuez les exercices de dénomination cette semaine.', true);
  const visible = await dom.window.ReParoleStore.loadPatientVisibleNotes('T');
  assert.strictEqual(visible.length, 1);
  assert.strictEqual(visible[0].content, 'Continuez les exercices de dénomination cette semaine.');
});

await test('mélange de notes privées et visibles : seules les visibles remontent côté patient', async ()=>{
  const dom = loadPatientApp();
  await dom.window.ReParoleStore.addNote('T', 'ortho-1', 'Privée 1', false);
  await dom.window.ReParoleStore.addNote('T', 'ortho-1', 'Visible 1', true);
  await dom.window.ReParoleStore.addNote('T', 'ortho-1', 'Privée 2', false);
  const visible = await dom.window.ReParoleStore.loadPatientVisibleNotes('T');
  const all = await dom.window.ReParoleStore.listNotes('T');
  assert.strictEqual(visible.length, 1);
  assert.strictEqual(all.length, 3);
});

console.log('\nAffichage côté patient (index.html)');

await test('aucune note visible -> la carte reste masquée', async ()=>{
  const dom = loadPatientApp();
  await dom.window.renderVisibleNotes();
  const card = dom.window.document.getElementById('visible-notes-card');
  assert.strictEqual(card.style.display, 'none');
});

await test('une note visible -> la carte apparaît avec le bon contenu, échappé', async ()=>{
  const dom = loadPatientApp();
  await dom.window.ReParoleStore.addNote('T', 'ortho-1', 'Bravo pour vos progrès <script>alert(1)</script>', true);
  await dom.window.renderVisibleNotes();
  const card = dom.window.document.getElementById('visible-notes-card');
  assert.notStrictEqual(card.style.display, 'none');
  const html = dom.window.document.getElementById('visible-notes-list').innerHTML;
  assert.ok(html.includes('Bravo pour vos progrès'));
  assert.ok(!/<script>alert/.test(html), 'le contenu de la note doit être échappé (XSS)');
});

console.log('\nCôté orthophoniste (dashboard-ortho.html)');

await test('la case "visible par le patient" existe dans le formulaire de note', ()=>{
  const html = fs.readFileSync(path.join(ROOT, 'dashboard-ortho.html'), 'utf8');
  assert.ok(html.includes('id="new-note-visible"'));
  assert.ok(html.includes('data-i18n="ortho_note_visible_checkbox"'));
});

await test('addNote() côté ortho lit bien l\'état de la case et le transmet', async ()=>{
  // Vérifie au niveau du code source que le flux existe (le comportement
  // Store.addNote() lui-même est déjà couvert ci-dessus) — évite de
  // reconstruire tout un faux Supabase juste pour ce fil.
  const code = fs.readFileSync(path.join(ROOT, 'js/dashboard-ortho.js'), 'utf8');
  const fn = code.slice(code.indexOf('async addNote()'), code.indexOf('async addNote()') + 400);
  assert.ok(/new-note-visible/.test(fn), 'addNote() doit lire la case à cocher');
  assert.ok(/Store\.addNote\(currentPatient\.code, orthoCode, content, visibleCheckbox/.test(fn));
});

console.log(`\n${passed} test(s) réussi(s), ${failed} échec(s).`);
if(failed > 0) process.exit(1);

}

main();
