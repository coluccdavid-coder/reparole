// =====================================================================
//  TESTS — v6.175 : brouillon de compte-rendu par IA (Pro).
//  ---------------------------------------------------------------------
//  Première brique IA de ReParole, avec des garde-fous stricts, tous
//  verrouillés ici :
//   - la clé API du fournisseur IA n'apparaît JAMAIS côté client ;
//   - l'edge function ANONYMISE (ni nom ni code patient vers l'IA),
//     authentifie par jeton de session, re-vérifie le rattachement,
//     plafonne les appels ;
//   - le prompt interdit tout diagnostic ; l'ortho relit et signe ;
//   - fonctionnalité Pro (coût réel par appel) ;
//   - échec propre si la fonction n'est pas déployée.
//
//  Lancer : node tests/ai-report-draft.test.js
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

const DOC  = fs.readFileSync(path.join(ROOT, 'js/ia-edge-function.md'), 'utf8');
const SQL  = fs.readFileSync(path.join(ROOT, 'sql/schema.sql'), 'utf8');
const HTML = fs.readFileSync(path.join(ROOT, 'dashboard-ortho.html'), 'utf8');
const DOJS = fs.readFileSync(path.join(ROOT, 'js/dashboard-ortho.js'), 'utf8');
const STJS = fs.readFileSync(path.join(ROOT, 'js/storage.js'), 'utf8');
const ortDoc = new JSDOM(HTML).window.document;

const i18nWin = new JSDOM('', { runScripts:'outside-only' }).window;
i18nWin.eval(fs.readFileSync(path.join(ROOT, 'js/i18n.js'), 'utf8'));
const S = i18nWin.I18N_STRINGS;

(async () => {

  // ---- Edge function (le document déployable) ----
  await test('edge : authentification par jeton de session + re-vérification du rattachement', () => {
    assert.ok(/auth\.getUser\(\)/.test(DOC), 'getUser (jeton de session) absent');
    assert.ok(/patient_assignments/.test(DOC) && /403/.test(DOC), 'vérification du rattachement absente');
  });

  await test('edge : ANONYMISATION — ni nom ni code patient ne partent vers l\'IA', () => {
    // le résumé envoyé ne sélectionne jamais patients.name, et le prompt
    // impose « le patient » sans nom
    assert.ok(!/select\('.*name/.test(DOC), 'patients.name ne doit jamais être sélectionné');
    assert.ok(/aucun nom ne t'est fourni/i.test(DOC), 'le prompt doit rappeler qu\'aucun nom n\'est fourni');
    const summary = DOC.match(/const summary = \{[\s\S]*?\};/)[0];
    assert.ok(!/patient_code|\bcode\b\s*:/.test(summary), 'le code patient ne doit pas être dans le résumé envoyé');
  });

  await test('edge : le prompt interdit diagnostic/interprétation et impose la mention de relecture', () => {
    assert.ok(/AUCUN diagnostic/i.test(DOC), 'interdiction de diagnostic absente du prompt');
    assert.ok(/relu,?\s*\n?\s*corrigé et validé par l'orthophoniste/i.test(DOC.replace(/\n/g,' ')) || /relu/.test(DOC), 'mention de relecture absente');
  });

  await test('edge : plafond journalier via ia_usage + clé API en secret serveur uniquement', () => {
    assert.ok(/DAILY_CAP = 40/.test(DOC) && /ia_usage/.test(DOC), 'plafond ia_usage absent');
    assert.ok(/Deno\.env\.get\('ANTHROPIC_API_KEY'\)/.test(DOC), 'clé lue depuis les secrets serveur');
    assert.ok(/SERVICE_ROLE_KEY.*jamais côté client/.test(DOC), 'rappel service-role absent');
  });

  await test('client : AUCUNE clé IA côté client (js/, html)', () => {
    for(const f of ['js/storage.js','js/dashboard-ortho.js','dashboard-ortho.html','index.html']){
      const c = fs.readFileSync(path.join(ROOT, f), 'utf8');
      assert.ok(!/sk-ant-|ANTHROPIC_API_KEY|MISTRAL_API_KEY/.test(c), `référence de clé IA interdite dans ${f}`);
    }
  });

  // ---- SQL ----
  await test('sql : table ia_usage + index + RLS sans policy (aucun accès client direct)', () => {
    assert.ok(/create table if not exists ia_usage/.test(SQL));
    assert.ok(/create index if not exists ia_usage_ortho_at_idx/.test(SQL));
    assert.ok(/alter table ia_usage enable row level security/.test(SQL));
    assert.ok(!/create policy [^;]*on ia_usage/.test(SQL), 'ia_usage ne doit avoir aucune policy');
  });

  // ---- storage.js ----
  await test('storage : orthoGenerateReportDraft — jeton de session (pas la clé anon) + échec propre si non déployée', () => {
    const m = STJS.match(/async iaAssist[\s\S]*?\n  \},/);
    assert.ok(m, 'iaAssist absente');
    assert.ok(/auth\.getSession\(\)/.test(m[0]) && /access_token/.test(m[0]), 'le jeton de session doit être utilisé');
    assert.ok(!/'Bearer '\+SUPABASE_ANON_KEY/.test(m[0]), 'la clé anon ne suffit pas : identité requise');
    assert.ok(/404/.test(m[0]) && /'indisponible'/.test(m[0]), 'le cas "fonction non déployée" doit échouer proprement');
  });

  // ---- UI ortho ----
  await test('html : bouton + zone éditable + avertissement + statut aria-live', () => {
    assert.ok(ortDoc.getElementById('ai-draft-btn'), '#ai-draft-btn absent');
    const zone = ortDoc.getElementById('ai-draft-zone');
    assert.ok(zone && /display:none/.test(zone.getAttribute('style')||''), 'zone masquée par défaut');
    const ta = ortDoc.getElementById('ai-draft-text');
    assert.ok(ta && ta.tagName === 'TEXTAREA', 'le brouillon doit être un textarea ÉDITABLE');
    assert.ok(/data-i18n="ortho_ai_draft_disclaimer"/.test(HTML), 'avertissement (relecture/signataire) absent');
    const status = ortDoc.getElementById('ai-draft-status');
    assert.ok(status && status.getAttribute('aria-live') === 'polite', 'statut aria-live absent');
  });

  await test('js ortho : gating Pro avant tout appel + gestion des erreurs distincte (indisponible vs échec)', () => {
    const m = DOJS.match(/async generateReportDraft\(\)[\s\S]*?\n  \},/);
    assert.ok(m, 'generateReportDraft absente');
    const idxPlan = m[0].indexOf("orthoPlan !== 'pro'");
    const idxCall = m[0].indexOf('orthoGenerateReportDraft');
    assert.ok(idxPlan > -1 && idxCall > -1 && idxPlan < idxCall, 'le contrôle Pro doit précéder l\'appel');
    assert.ok(/ortho_ai_draft_unavailable/.test(m[0]) && /ortho_ai_draft_error/.test(m[0]), 'les deux messages d\'erreur doivent exister');
  });

  // ---- i18n ----
  await test('i18n : les 9 clés existent dans les 14 langues, kabyle réel, l\'avertissement fr mentionne relecture + pas de diagnostic', () => {
    const KEYS = ['ortho_ai_draft_btn','ortho_ai_draft_pro_hint','ortho_ai_draft_generating','ortho_ai_draft_disclaimer','ortho_ai_draft_placeholder','ortho_ai_draft_error','ortho_ai_draft_unavailable','ortho_ai_draft_copy','ortho_ai_draft_copied'];
    for(const l of Object.keys(S)) for(const k of KEYS){
      assert.ok(typeof S[l][k] === 'string' && S[l][k].length, `${k} manquante en ${l}`);
    }
    for(const k of KEYS){
      assert.notStrictEqual(S.kab[k], S.fr[k], `${k} : kab ne doit pas être un repli français`);
    }
    assert.ok(/relire/.test(S.fr.ortho_ai_draft_disclaimer) && /diagnostic/.test(S.fr.ortho_ai_draft_disclaimer),
      'l\'avertissement fr doit mentionner la relecture et l\'absence de diagnostic');
  });

  console.log(`\n${passed} test(s) réussi(s), ${failed} échec(s).`);
  process.exit(failed ? 1 : 0);
})();
