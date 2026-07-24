// =====================================================================
//  TESTS — Rattachement patient : vrai bug corrigé (get_patient) +
//  création de fiche patient directement par l'orthophoniste (v6.93)
//  ---------------------------------------------------------------------
//  Capture d'écran utilisateur : coller un code aidant (préfixe "a-")
//  dans "Rattacher un patient" affichait l'erreur SQL brute "violates
//  foreign key constraint" au lieu d'un message clair.
//
//  Cause racine réelle, plus large que prévu : get_patient() était
//  déclarée "returns patients" (une ligne composite unique). En
//  PostgreSQL, une fonction SQL à ligne unique dont le SELECT sous-
//  jacent ne trouve AUCUNE ligne renvoie quand même UNE ligne, avec
//  toutes les colonnes à NULL — jamais "rien". Le code JS qui teste
//  `if(!row) return null` ne voyait donc jamais cette absence, puisque
//  l'objet renvoyé était non-vide (juste rempli de null). Corrigé en
//  "returns setof patients" : un code inexistant renvoie maintenant un
//  vrai tableau vide, correctement détecté par le JS déjà écrit pour ce
//  cas (Array.isArray(data) ? data[0] : data).
//
//  Testé aussi : la nouvelle fonctionnalité "Créer une fiche patient"
//  (réponse directe à la demande utilisateur), qui réutilise exactement
//  ce même mécanisme.
//
//  Lancer : node tests/patient-assignment-fix.test.js
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

function loadOrthoAppWithFakeSupabase(initialPlan, initialPatientCount){
  const html = fs.readFileSync(path.join(ROOT, 'dashboard-ortho.html'), 'utf8');
  const dom = new JSDOM(html, { url:'http://localhost/', runScripts:'outside-only', resources:'usable', pretendToBeVisual:true });

  const fakeSupabaseSrc = `
    // v6.93 : simule fidèlement le comportement CORRIGÉ de get_patient
    // ("returns setof patients") — un tableau vide si rien ne
    // correspond, jamais une fausse ligne pleine de null.
    window.__patients = { 'real-code-1': { code:'real-code-1', name:'Marie', level:2, sessions:3, correct:8, total:10, streak:2, plan:'free' } };
    window.__assignments = [];
    window.supabase = {
      createClient(){
        return {
          auth: {
            async getSession(){ return { data:{ session:{ user:{ id:'ortho-1', email:'ortho@test.fr' } } } }; },
            async signOut(){ return {}; },
            mfa: {
              async getAuthenticatorAssuranceLevel(){ return { data:{ currentLevel:'aal1', nextLevel:'aal1' } }; },
              async listFactors(){ return { data:{ totp:[] }, error:null }; }
            }
          },
          async rpc(name, params){
            if(name === 'get_patient'){
              const row = window.__patients[params.p_code];
              return { data: row ? [row] : [], error: null }; // setof -> toujours un tableau
            }
            if(name === 'upsert_patient'){
              // v6.93 : c'est la vraie fonction utilisée par Store.savePatient()
              // (pas from('patients').upsert(), corrigé ici après un premier
              // échec de ce test causé par un mock imprécis).
              window.__patients[params.p_code] = Object.assign(
                { plan:'free' },
                window.__patients[params.p_code],
                { code:params.p_code, name:params.p_name, level:params.p_level,
                  sessions:params.p_sessions, correct:params.p_correct, total:params.p_total, streak:params.p_streak }
              );
              return { data: null, error: null };
            }
            return { data: null, error: null };
          },
          from(table){
            function makeBuilder(pendingUpsert){
              return {
                eq(){ return this; },
                upsert(obj, opts){ return makeBuilder(obj); },
                select(){ return this; },
                async maybeSingle(){
                  if(!pendingUpsert) return { data: null };
                  if(table === 'orthophonists'){
                    // v6.93 : la vérification de session au chargement de la
                    // page (getOrthoSession -> _ensureOrthoRow) enchaîne
                    // upsert().select().maybeSingle() — chaînable ici pour
                    // ne pas planter ce test, même si ce n'est pas ce qui
                    // est testé.
                    return { data: Object.assign({ code:'ortho-1', name:'Testeur', plan:'free' }, pendingUpsert) };
                  }
                  return { data: pendingUpsert };
                },
                // v6.93 : upsert() est aussi parfois attendu directement,
                // sans .select().maybeSingle() derrière (patient_assignments,
                // patients ci-dessous) — .then() le rend "thenable" pour ce
                // cas-là aussi, comme le vrai client Supabase. Défensif :
                // ce même constructeur sert aussi à des requêtes .select()
                // (ex. listPatients()) qui n'ont jamais appelé .upsert() —
                // dans ce cas, pendingUpsert reste null, on renvoie un
                // résultat vide plutôt que de planter (pas ce qui est
                // testé ici, juste évite un crash en arrière-plan).
                then(resolve){
                  if(!pendingUpsert){ resolve({ data: [], error: null }); return; }
                  if(table === 'patient_assignments'){
                    if(!window.__patients[pendingUpsert.patient_code]){
                      resolve({ error: { message: 'insert or update on table "patient_assignments" violates foreign key constraint "patient_assignments_patient_code_fkey"' } });
                      return;
                    }
                    window.__assignments.push(pendingUpsert);
                    resolve({ error: null });
                    return;
                  }
                  if(table === 'patients'){
                    window.__patients[pendingUpsert.code] = Object.assign({ plan:'free' }, pendingUpsert);
                    resolve({ error: null });
                    return;
                  }
                  resolve({ error: null });
                }
              };
            }
            return makeBuilder(null);
          }
        };
      }
    };
  `;
  dom.window.eval(fakeSupabaseSrc);

  let storageCode = fs.readFileSync(path.join(ROOT, 'js/storage.js'), 'utf8');
  storageCode = storageCode.replace(/const SUPABASE_URL = "[^"]*";/, 'const SUPABASE_URL = "https://fake.supabase.co";');
  storageCode = storageCode.replace(/const SUPABASE_ANON_KEY = "[^"]*";/, 'const SUPABASE_ANON_KEY = "fake-key";');
  dom.window.eval(storageCode);
  // v6.93 : generateCode() est utilisé par createPatient() ; on force une
  // valeur prévisible plutôt que le vrai aléatoire, pour un test stable.
  dom.window.eval("generateCode = function(){ return 'code-genere-123'; };");

  for(const src of ['js/i18n.js','js/prefs.js','js/learner.js','js/charts.js']){
    dom.window.eval(fs.readFileSync(path.join(ROOT, src), 'utf8'));
    // v6.247 : les 14 langues vivent dans js/i18n/<code>.js et les pages
    // n'en chargent qu'une. En test, on les charge toutes.
    if(src === 'js/i18n.js') fs.readdirSync(path.join(ROOT, 'js/i18n'))
      .forEach(lf => dom.window.eval(fs.readFileSync(path.join(ROOT, 'js/i18n', lf), 'utf8')));
  }
  // v6.93 : orthoCode/orthoPlan/patients sont déclarées avec `let` DANS
  // js/dashboard-ortho.js — invisible depuis un eval() séparé (même
  // piège que Store/user documenté ailleurs dans ce projet). On les
  // initialise en les ajoutant à la fin du MÊME code évalué, pas dans
  // un eval() séparé après coup — sinon ça crée un window.orthoPlan
  // fantôme qui ne trompe que les assertions qui ne vérifient pas sa
  // vraie valeur (repéré ici après un premier échec de test silencieux).
  let orthoJsSource = fs.readFileSync(path.join(ROOT, 'js/dashboard-ortho.js'), 'utf8');
  const plan = initialPlan || 'pro';
  const count = initialPatientCount || 0;
  const fakePatientsArray = JSON.stringify(Array.from({length: count}, (_,i)=>({code:'p'+i})));
  orthoJsSource += `\nPrefs.load(); orthoCode = 'ortho-1'; orthoPlan = '${plan}'; patients = ${fakePatientsArray};`;
  dom.window.eval(orthoJsSource);
  return dom;
}

async function main(){

console.log('sql/schema.sql — la vraie cause corrigée');

await test('get_patient() renvoie bien "setof patients" (pas une ligne composite unique)', ()=>{
  const sql = fs.readFileSync(path.join(ROOT, 'sql/schema.sql'), 'utf8');
  const m = sql.match(/create or replace function get_patient\(p_code text\)\nreturns ([a-z ]+) language/);
  assert.ok(m, 'fonction get_patient introuvable');
  assert.strictEqual(m[1].trim(), 'setof patients', `attendu "setof patients", trouvé "${m[1].trim()}"`);
});

console.log('\n"Rattacher un patient" — plus jamais d\'erreur SQL brute affichée');

await test('coller un code aidant (préfixe "a-") est rejeté immédiatement, sans appel réseau', async ()=>{
  const dom = loadOrthoAppWithFakeSupabase();
  dom.window.document.getElementById('assign-code').value = 'a-xyz123456789';
  await dom.window.OrthoApp.assign();
  const msg = dom.window.document.getElementById('assign-msg').textContent;
  assert.ok(msg.length > 0);
  assert.strictEqual(dom.window.__assignments.length, 0, 'aucune tentative de rattachement ne doit avoir été faite');
});

await test('code patient inexistant -> message clair, jamais le texte SQL brut', async ()=>{
  const dom = loadOrthoAppWithFakeSupabase();
  dom.window.document.getElementById('assign-code').value = 'code-qui-nexiste-pas';
  await dom.window.OrthoApp.assign();
  const msg = dom.window.document.getElementById('assign-msg').textContent;
  assert.ok(msg.length > 0);
  assert.ok(!/violates foreign key|constraint|SQL/i.test(msg), `le message ne doit jamais contenir de texte SQL brut, reçu : ${msg}`);
});

await test('code patient réel -> rattachement réussi', async ()=>{
  const dom = loadOrthoAppWithFakeSupabase();
  dom.window.document.getElementById('assign-code').value = 'real-code-1';
  await dom.window.OrthoApp.assign();
  const msg = dom.window.document.getElementById('assign-msg').textContent;
  assert.ok(/Marie/.test(msg), `le nom du patient est attendu dans la confirmation, reçu : ${msg}`);
  assert.strictEqual(dom.window.__assignments.length, 1);
});

console.log('\nCréer une fiche patient (nouvelle fonctionnalité, réponse directe à la demande)');

await test('nom vide -> erreur, aucune fiche créée', async ()=>{
  const dom = loadOrthoAppWithFakeSupabase();
  dom.window.document.getElementById('create-patient-name').value = '  ';
  await dom.window.OrthoApp.createPatient();
  const msg = dom.window.document.getElementById('create-patient-msg').textContent;
  assert.ok(msg.length > 0);
  assert.strictEqual(dom.window.document.getElementById('create-patient-result').style.display, 'none');
});

await test('nom renseigné -> fiche créée, code généré affiché, rattachement automatique', async ()=>{
  const dom = loadOrthoAppWithFakeSupabase();
  dom.window.document.getElementById('create-patient-name').value = 'Jean';
  await dom.window.OrthoApp.createPatient();
  const resultEl = dom.window.document.getElementById('create-patient-result');
  assert.notStrictEqual(resultEl.style.display, 'none');
  assert.strictEqual(dom.window.document.getElementById('create-patient-code').textContent, 'code-genere-123');
  assert.ok(dom.window.__patients['code-genere-123'], 'la fiche patient doit exister côté serveur');
  assert.strictEqual(dom.window.__patients['code-genere-123'].name, 'Jean');
  assert.strictEqual(dom.window.__assignments.filter(a=>a.patient_code==='code-genere-123').length, 1, 'doit être automatiquement rattaché');
});

await test('limite du compte gratuit respectée pour la création aussi, pas seulement le rattachement', async ()=>{
  const dom = loadOrthoAppWithFakeSupabase('free', 3); // déjà à la limite (ORTHO_FREE_PATIENT_LIMIT)
  dom.window.document.getElementById('create-patient-name').value = 'Nouveau';
  await dom.window.OrthoApp.createPatient();
  const msg = dom.window.document.getElementById('create-patient-msg').textContent;
  assert.ok(msg.length > 0);
  assert.strictEqual(dom.window.document.getElementById('create-patient-result').style.display, 'none');
});

console.log(`\n${passed} test(s) réussi(s), ${failed} échec(s).`);
if(failed > 0) process.exit(1);

}

main();
