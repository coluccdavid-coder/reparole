// =====================================================================
//  TESTS — Droit à l'effacement : suppression de compte (v6.87, v6.137)
//  ---------------------------------------------------------------------
//  VRAI MANQUE corrigé : RGPD.md mentionnait déjà ce droit, mais rien
//  ne permettait de l'exercer. Vérifie la confirmation en deux temps
//  (mot à taper + second clic explicite), le nettoyage réel des
//  données en mode navigateur, et le comportement de
//  ReParoleStore.deleteAccount en mode cloud (RPC appelée avec le bon
//  code).
//
//  v6.137 : VRAI BUG CORRIGÉ, signalé par l'utilisateur ("le bouton
//  suppression ne fonctionne pas") — window.confirm() n'est pas fiable
//  en mode PWA installée/standalone sur plusieurs navigateurs mobiles,
//  pouvant faire sembler le bouton "ne rien faire". Remplacé par un
//  second clic explicite dans la page (pas de boîte de dialogue
//  native) — ces tests appellent donc deleteMyAccount() deux fois de
//  suite pour simuler les deux clics, au lieu de mocker confirm().
//
//  Lancer : node tests/account-deletion.test.js
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

async function main(){

console.log('Suppression de compte — écran et validation');

await test('la section existe avec les bons éléments', ()=>{
  const dom = loadPatientApp();
  assert.ok(dom.window.document.getElementById('account-delete-confirm'));
  assert.ok(dom.window.document.getElementById('account-delete-btn'));
  assert.ok(dom.window.document.getElementById('account-delete-status'));
});

await test('mot de confirmation incorrect -> message d\'erreur, rien n\'est supprimé', async ()=>{
  const dom = loadPatientApp();
  dom.window.localStorage.setItem('reparole:T', JSON.stringify({ code:'T', name:'Marie' }));
  dom.window.document.getElementById('account-delete-confirm').value = 'pas le bon mot';
  await dom.window.deleteMyAccount();
  const status = dom.window.document.getElementById('account-delete-status').textContent;
  assert.ok(status.length > 0 && !/✅/.test(status));
  assert.ok(dom.window.localStorage.getItem('reparole:T') !== null, 'les données ne doivent pas être touchées');
});

await test('mot correct mais un seul clic -> rien n\'est supprimé, le bouton passe en état "armé"', async ()=>{
  const dom = loadPatientApp();
  dom.window.localStorage.setItem('reparole:T', JSON.stringify({ code:'T', name:'Marie' }));
  dom.window.document.getElementById('account-delete-confirm').value = 'SUPPRIMER';
  await dom.window.deleteMyAccount();
  assert.ok(dom.window.localStorage.getItem('reparole:T') !== null, 'les données ne doivent pas être touchées après un seul clic');
  assert.strictEqual(dom.window.document.getElementById('account-delete-btn').dataset.confirmStep, 'armed');
});

await test('mot correct (insensible à la casse) + 2 clics -> suppression réelle en mode navigateur', async ()=>{
  const dom = loadPatientApp();
  dom.window.localStorage.setItem('reparole:T', JSON.stringify({ code:'T', name:'Marie' }));
  dom.window.localStorage.setItem('reparole:hist:T', JSON.stringify([{type:'denomination'}]));
  dom.window.localStorage.setItem('reparole:journal:T', JSON.stringify([{text:'ok'}]));
  dom.window.localStorage.setItem('reparole:favorites:T', JSON.stringify(['jardin']));
  dom.window.localStorage.setItem('reparole:media:T', JSON.stringify([{label:'photo'}]));
  dom.window.document.getElementById('account-delete-confirm').value = 'supprimer';
  await dom.window.deleteMyAccount(); // 1er clic : arme la confirmation
  await dom.window.deleteMyAccount(); // 2e clic : confirme réellement
  const status = dom.window.document.getElementById('account-delete-status').textContent;
  assert.ok(/✅/.test(status), `succès attendu, reçu : ${status}`);
  ['reparole:T','reparole:hist:T','reparole:journal:T','reparole:favorites:T','reparole:media:T'].forEach(k=>{
    assert.strictEqual(dom.window.localStorage.getItem(k), null, `${k} doit avoir été supprimé`);
  });
});

await test('nettoie aussi l\'index du code aidant lié, s\'il existe', async ()=>{
  const dom = loadPatientApp();
  dom.window.localStorage.setItem('reparole:T', JSON.stringify({ code:'T', name:'Marie', caregiver_code:'a-xyz123' }));
  dom.window.localStorage.setItem('reparole:caregiver-index:a-xyz123', 'T');
  dom.window.document.getElementById('account-delete-confirm').value = 'SUPPRIMER';
  await dom.window.deleteMyAccount();
  await dom.window.deleteMyAccount();
  assert.strictEqual(dom.window.localStorage.getItem('reparole:caregiver-index:a-xyz123'), null);
});

await test('retire la session active (sessionStorage) ET le profil mémorisé (localStorage, restauré en v6.129)', async ()=>{
  const dom = loadPatientApp();
  dom.window.localStorage.setItem('reparole:T', JSON.stringify({ code:'T', name:'Marie' }));
  dom.window.sessionStorage.setItem('reparole:active-session', 'T');
  dom.window.eval("saveRememberedProfiles([{code:'T', name:'Marie', at:new Date().toISOString()}])");
  dom.window.document.getElementById('account-delete-confirm').value = 'SUPPRIMER';
  await dom.window.deleteMyAccount();
  await dom.window.deleteMyAccount();
  assert.strictEqual(dom.window.sessionStorage.getItem('reparole:active-session'), null);
  const remembered = dom.window.eval("loadRememberedProfiles()");
  assert.ok(!remembered.some(p=>p.code==='T'));
});

await test('l\'état "armé" retombe tout seul si on ne clique pas une 2e fois (pas de confirmation qui traîne indéfiniment)', async ()=>{
  const dom = loadPatientApp();
  dom.window.localStorage.setItem('reparole:T', JSON.stringify({ code:'T', name:'Marie' }));
  dom.window.document.getElementById('account-delete-confirm').value = 'SUPPRIMER';
  await dom.window.deleteMyAccount();
  assert.strictEqual(dom.window.document.getElementById('account-delete-btn').dataset.confirmStep, 'armed');
  // simule l'expiration du délai plutôt que d'attendre 8 secondes réelles
  dom.window.document.getElementById('account-delete-btn').dataset.confirmStep = '';
  await dom.window.deleteMyAccount(); // ce "2e clic" tardif doit donc ré-armer, pas supprimer directement
  assert.ok(dom.window.localStorage.getItem('reparole:T') !== null, 'ne doit pas supprimer après expiration de la fenêtre de confirmation');
});

console.log('\nReParoleStore.deleteAccount()');

await test('mode navigateur : renvoie {error:null} après nettoyage', async ()=>{
  const dom = loadPatientApp();
  dom.window.localStorage.setItem('reparole:T2', JSON.stringify({ code:'T2', name:'Jean' }));
  const res = await dom.window.ReParoleStore.deleteAccount('T2');
  assert.strictEqual(res.error, null);
  assert.strictEqual(dom.window.localStorage.getItem('reparole:T2'), null);
});

console.log('\nsql/schema.sql — fonction de suppression');

await test('delete_patient_account() existe et supprime la ligne patients (le cascade fait le reste)', ()=>{
  const sql = fs.readFileSync(path.join(ROOT, 'sql/schema.sql'), 'utf8');
  assert.ok(/create or replace function delete_patient_account/.test(sql));
  assert.ok(/delete from patients where code = p_code/.test(sql));
  assert.ok(/delete from storage\.objects where bucket_id = 'patient-media'/.test(sql), 'doit aussi nettoyer les photos du bucket Storage');
});

await test('toutes les tables liées à patients ont bien "on delete cascade" (le nettoyage en dépend entièrement)', ()=>{
  const sql = fs.readFileSync(path.join(ROOT, 'sql/schema.sql'), 'utf8');
  const linkedTables = ['sessions','journal_entries','patient_assignments','patient_media','error_events','reports','notes','caregiver_words','favorite_words'];
  linkedTables.forEach(t=>{
    const tableDef = sql.slice(sql.indexOf(`create table if not exists ${t} (`), sql.indexOf(`create table if not exists ${t} (`) + 600);
    assert.ok(/references patients\(code\) on delete cascade/.test(tableDef), `${t} devrait référencer patients(code) on delete cascade`);
  });
});

console.log(`\n${passed} test(s) réussi(s), ${failed} échec(s).`);
if(failed > 0) process.exit(1);

}

main();
