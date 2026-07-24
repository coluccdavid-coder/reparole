// =====================================================================
//  TESTS — 4 enrichissements de l'accueil orthophoniste (v6.169)
//  ---------------------------------------------------------------------
//  Après un retour « l'accueil orthophoniste fait un peu vide », quatre
//  ajouts, plus le correctif SQL qui accompagne la version :
//   1. Vue d'ensemble (synthèse multi-patients en tête).
//   2. État vide accueillant (guide vers les deux façons d'ajouter).
//   3. Mini-frise d'activité sur 14 jours par ligne patient.
//   4. Réorganisation : réglages (2FA + Pro) repliés, patients en tête.
//
//  Côté SQL : nouvelle fonction get_ortho_activity() (sécurisée par
//  auth.uid()), plus deux drop-guards (get_history, log_session) qui
//  rendent sql/schema.sql rejouable sur une base déjà en service.
//
//  Lancer : node tests/ortho-dashboard-enrichments.test.js
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

const SQL = fs.readFileSync(path.join(ROOT, 'sql/schema.sql'), 'utf8');

function loadDashboard(){
  const html = fs.readFileSync(path.join(ROOT, 'dashboard-ortho.html'), 'utf8');
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
  dom.window.eval("Prefs.load();");
  return dom;
}

// Décalage de date façon client (js/dashboard-ortho.js / caregiver.js)
function dayKey(offset){
  const dt = new Date(); dt.setDate(dt.getDate() - offset);
  return dt.toISOString().slice(0,10);
}
function daysAgoISO(n){ return new Date(Date.now() - n*86400000).toISOString(); }

async function main(){

console.log('sql/schema.sql — correctif (drop-guards) + get_ortho_activity()');

await test('drop-guard présent pour get_history (piège "returns setof sessions")', ()=>{
  assert.ok(/drop function if exists get_history\(text\);/.test(SQL), 'drop function if exists get_history(text); attendu avant la recréation');
  // le drop doit précéder la (re)création
  assert.ok(SQL.indexOf('drop function if exists get_history(text);') < SQL.indexOf('create or replace function get_history('), 'le drop doit venir avant le create');
});

await test('drop-guard présent pour l\'ancienne signature à 5 paramètres de log_session', ()=>{
  assert.ok(/drop function if exists log_session\(text, text, int, int, int\);/.test(SQL), 'drop de la surcharge à 5 arguments attendu');
  assert.ok(SQL.indexOf('drop function if exists log_session(text, text, int, int, int);') < SQL.indexOf('create or replace function log_session('), 'le drop doit venir avant le create');
});

await test('get_ortho_activity() existe, renvoie jsonb et est SECURITY DEFINER', ()=>{
  const idx = SQL.indexOf('create or replace function get_ortho_activity()');
  assert.ok(idx !== -1, 'définition de get_ortho_activity() introuvable');
  const def = SQL.slice(idx, idx + 500);
  assert.ok(/returns jsonb/.test(def), 'doit renvoyer jsonb');
  assert.ok(/security definer/.test(def), 'doit être security definer');
});

await test('get_ortho_activity() dérive l\'identité de auth.uid() (pas un paramètre de confiance)', ()=>{
  const idx = SQL.indexOf('create or replace function get_ortho_activity()');
  const def = SQL.slice(idx, idx + 500);
  assert.ok(/auth\.uid\(\)::text/.test(def), 'doit filtrer par auth.uid()::text — sinon un ortho pourrait lire les patients d\'un autre');
  assert.ok(/interval '14 days'/.test(def), 'fenêtre de 14 jours attendue');
  // ne prend AUCUN paramètre : la parenthèse ouvrante est immédiatement fermée
  assert.ok(/function get_ortho_activity\(\)/.test(SQL), 'ne doit prendre aucun paramètre (identité via auth.uid())');
});

console.log('\njs/storage.js — Store.orthoActivity()');

await test('Store.orthoActivity() existe et renvoie {} hors ligne (mode navigateur)', async ()=>{
  const dom = loadDashboard();
  assert.strictEqual(typeof dom.window.ReParoleStore.orthoActivity, 'function');
  const res = await dom.window.ReParoleStore.orthoActivity();
  assert.ok(res && typeof res === 'object' && Object.keys(res).length === 0, 'sans cloud, doit renvoyer un objet vide (pas d\'erreur)');
});

console.log('\njs/i18n.js — clés de traduction');

await test('les 8 nouvelles clés existent dans les langues complètes (fr, en, ja)', ()=>{
  const dom = loadDashboard();
  const S = dom.window.I18N_STRINGS;
  const keys = ['ortho_overview_title','ortho_overview_patients','ortho_overview_to_recontact','ortho_overview_active_week','ortho_overview_avg_success','ortho_no_patient_help','ortho_activity_label','ortho_account_settings'];
  for(const lang of ['fr','en','ja']){
    for(const k of keys){
      assert.ok(S[lang] && typeof S[lang][k] === 'string' && S[lang][k].length, `${k} manquante en ${lang}`);
    }
  }
});

await test('kab : les 8 clés sont bien présentes et traduites (parité UI à 100% exigée depuis v6.145)', ()=>{
  const dom = loadDashboard();
  const S = dom.window.I18N_STRINGS;
  const keys = ['ortho_overview_title','ortho_overview_patients','ortho_overview_to_recontact','ortho_overview_active_week','ortho_overview_avg_success','ortho_no_patient_help','ortho_activity_label','ortho_account_settings'];
  // L'utilisateur a signalé (capture, v6.145) un mélange kabyle/français
  // dans l'interface. I18N_STRINGS doit donc rester à 100% en kabyle —
  // même si le CONTENU d'exercices reste volontairement partiel ailleurs
  // (garde-fou n°8 s'applique au contenu, pas à l'interface de base).
  for(const k of keys){
    assert.ok(S.kab && typeof S.kab[k] === 'string' && S.kab[k].length, `${k} manquante en kab (parité UI à 100% exigée)`);
    assert.notStrictEqual(S.kab[k], S.fr[k], `${k} en kab ne doit pas être un simple repli français`);
  }
});

console.log('\ndashboard-ortho.html — structure réorganisée (point 4)');

await test('carte "Vue d\'ensemble" présente, masquée au départ', ()=>{
  const dom = loadDashboard();
  const ov = dom.window.document.getElementById('ortho-overview');
  assert.ok(ov, '#ortho-overview attendu');
  assert.ok(dom.window.document.getElementById('ortho-overview-tiles'), '#ortho-overview-tiles attendu');
  assert.strictEqual(ov.style.display, 'none', 'la vue d\'ensemble doit être masquée tant qu\'aucun patient');
});

await test('réglages (2FA + Pro) déplacés dans un <details> repliable', ()=>{
  const dom = loadDashboard();
  const details = dom.window.document.getElementById('ortho-settings-details');
  assert.ok(details && details.tagName.toLowerCase() === 'details', '#ortho-settings-details doit être un <details>');
  // la 2FA et l'offre Pro vivent bien à l'intérieur
  assert.ok(details.querySelector('#mfa-status'), 'le statut 2FA doit être dans les réglages');
  assert.ok(details.querySelector('#ortho-pro-teaser-card'), 'l\'offre Pro doit être dans les réglages');
});

await test('les patients passent avant les réglages dans le DOM (point 4)', ()=>{
  const dom = loadDashboard();
  const html = dom.window.document.getElementById('ortho-list').innerHTML;
  const posList = html.indexOf('id="patient-list"');
  const posSettings = html.indexOf('id="ortho-settings-details"');
  assert.ok(posList !== -1 && posSettings !== -1, 'les deux blocs doivent exister');
  assert.ok(posList < posSettings, 'la liste des patients doit précéder les réglages');
});

console.log('\njs/dashboard-ortho.js — comportement (points 1, 2, 3)');

await test('point 3 : _activityStrip() rend 14 pastilles et marque les jours actifs', ()=>{
  const dom = loadDashboard();
  const html = dom.window.OrthoApp._activityStrip([dayKey(0), dayKey(3)]);
  const container = dom.window.document.createElement('div');
  container.innerHTML = html;
  assert.strictEqual(container.querySelectorAll('.p-day-dot').length, 14, '14 pastilles attendues');
  assert.strictEqual(container.querySelectorAll('.p-day-active').length, 2, '2 jours actifs attendus');
});

await test('point 3 : _activityStrip() sans données -> 14 pastilles, aucune active', ()=>{
  const dom = loadDashboard();
  const container = dom.window.document.createElement('div');
  container.innerHTML = dom.window.OrthoApp._activityStrip(undefined);
  assert.strictEqual(container.querySelectorAll('.p-day-dot').length, 14);
  assert.strictEqual(container.querySelectorAll('.p-day-active').length, 0);
});

await test('point 2 : état vide -> message d\'aide + 2 boutons (rattacher / créer)', async ()=>{
  const dom = loadDashboard();
  // sans override, listPatients renvoie [] (mode local) -> état vide
  await dom.window.OrthoApp.refreshList();
  const list = dom.window.document.getElementById('patient-list');
  assert.ok(list.querySelector('.ortho-empty'), 'un état vide accueillant est attendu');
  assert.ok(list.querySelector('.ortho-empty-help'), 'le texte d\'aide est attendu');
  const btns = list.querySelectorAll('.ortho-empty-actions button');
  assert.strictEqual(btns.length, 2, '2 boutons attendus (rattacher, créer)');
  assert.strictEqual(dom.window.document.getElementById('ortho-overview').style.display, 'none', 'la vue d\'ensemble reste masquée à 0 patient');
});

await test('point 2 : focusCard() défile et focus le bon champ, sans erreur', ()=>{
  const dom = loadDashboard();
  // ne doit pas lever d\'exception même si scrollIntoView n\'est pas implémenté dans jsdom
  assert.doesNotThrow(()=> dom.window.OrthoApp.focusCard('assign-code'));
  assert.doesNotThrow(()=> dom.window.OrthoApp.focusCard('inexistant'));
});

await test('point 1 : vue d\'ensemble calcule les bons chiffres (agrégat de réussite)', async ()=>{
  const dom = loadDashboard();
  dom.window.ReParoleStore.listPatients = async () => ([
    { code:'p-a', name:'Alice', level:2, sessions:10, total:100, correct:80, last_seen: daysAgoISO(2) },  // actif
    { code:'p-b', name:'Bob',   level:1, sessions:3,  total:20,  correct:5,  last_seen: daysAgoISO(10) }, // à recontacter
  ]);
  dom.window.ReParoleStore.orthoActivity = async () => ({ 'p-a': [dayKey(0), dayKey(1)] });
  await dom.window.OrthoApp.refreshList();

  const ov = dom.window.document.getElementById('ortho-overview');
  assert.notStrictEqual(ov.style.display, 'none', 'la vue d\'ensemble doit être visible avec ≥1 patient');
  const nums = [...dom.window.document.querySelectorAll('#ortho-overview-tiles .ortho-tile-num')].map(n=>n.textContent);
  // ordre : patients, à recontacter, actifs (7 j), réussite moyenne
  assert.deepStrictEqual(nums, ['2', '1', '1', '71%'], `tuiles inattendues : ${JSON.stringify(nums)}`);
  // la tuile "à recontacter" > 0 est mise en évidence
  assert.ok(dom.window.document.querySelector('#ortho-overview-tiles .ortho-tile-warn'), 'la tuile à recontacter doit être signalée quand > 0');
});

await test('point 3 : chaque ligne patient porte une frise, avec les bons jours actifs', async ()=>{
  const dom = loadDashboard();
  dom.window.ReParoleStore.listPatients = async () => ([
    { code:'p-a', name:'Alice', level:2, sessions:10, total:100, correct:80, last_seen: daysAgoISO(2) },
    { code:'p-b', name:'Bob',   level:1, sessions:3,  total:20,  correct:5,  last_seen: daysAgoISO(10) },
  ]);
  dom.window.ReParoleStore.orthoActivity = async () => ({ 'p-a': [dayKey(0), dayKey(1)] });
  await dom.window.OrthoApp.refreshList();

  const rows = dom.window.document.querySelectorAll('#patient-list .patient-row');
  assert.strictEqual(rows.length, 2, '2 lignes patients attendues');
  rows.forEach(r => assert.strictEqual(r.querySelectorAll('.p-day-dot').length, 14, 'chaque ligne doit avoir une frise de 14 jours'));
  // total des jours actifs sur l\'ensemble = 2 (uniquement Alice)
  assert.strictEqual(dom.window.document.querySelectorAll('#patient-list .p-day-active').length, 2, '2 jours actifs au total (Alice)');
});

console.log(`\n${passed} réussi(s), ${failed} échec(s).`);
if(failed) process.exit(1);
}

main();
