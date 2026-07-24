// =====================================================================
//  TESTS — v6.174 : boucle vocale asynchrone (patient → orthophoniste).
//  ---------------------------------------------------------------------
//  LE différenciant produit : le patient enregistre ses productions
//  réelles sur ses mots ciblés, l'ortho écoute et tranche — le jugement
//  humain fait foi, pas un score automatique.
//  Données de santé sensibles => ce fichier verrouille surtout les
//  GARANTIES DE VIE PRIVÉE :
//   - consentement explicite vérifié CÔTÉ SQL (pas seulement l'UI) ;
//   - révocation = suppression immédiate (métadonnées + fichiers) ;
//   - rétention 30 jours filtrée à la lecture + purge ;
//   - accès ortho gaté par auth.uid() + rattachement ;
//   - fichiers sous <code>/voice/ => couverts par la purge de compte.
//
//  Lancer : node tests/voice-loop.test.js
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

const SQL  = fs.readFileSync(path.join(ROOT, 'sql/schema.sql'), 'utf8');
const IDX  = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const ORT  = fs.readFileSync(path.join(ROOT, 'dashboard-ortho.html'), 'utf8');
const APP  = fs.readFileSync(path.join(ROOT, 'js/app.js'), 'utf8');
const DOJS = fs.readFileSync(path.join(ROOT, 'js/dashboard-ortho.js'), 'utf8');
const STJS = fs.readFileSync(path.join(ROOT, 'js/storage.js'), 'utf8');
const idxDoc = new JSDOM(IDX).window.document;
const ortDoc = new JSDOM(ORT).window.document;

const i18nWin = new JSDOM('', { runScripts:'outside-only' }).window;
i18nWin.eval(require('./i18n-source').texteComplet());
const S = i18nWin.I18N_STRINGS;

(async () => {

  // ---- SQL : structure & vie privée ----
  await test('sql : table voice_recordings + RLS sans policy + consentement sur patients (défaut: refus)', () => {
    assert.ok(/create table if not exists voice_recordings/.test(SQL));
    assert.ok(/alter table voice_recordings enable row level security/.test(SQL));
    assert.ok(/alter table patients add column if not exists voice_consent boolean not null default false/.test(SQL),
      'voice_consent doit exister et être FAUX par défaut');
  });

  await test('sql : le dépôt est REFUSÉ côté base sans consentement actif', () => {
    const m = SQL.match(/create or replace function add_voice_recording[\s\S]*?\$\$;/);
    assert.ok(m, 'add_voice_recording absente');
    assert.ok(/voice_consent/.test(m[0]) && /raise exception/.test(m[0]),
      'la vérification du consentement doit être dans la fonction SQL, pas seulement dans l\'UI');
  });

  await test('sql : révoquer le consentement supprime tout, immédiatement (métadonnées + fichiers)', () => {
    const m = SQL.match(/create or replace function set_voice_consent[\s\S]*?\$\$;/);
    assert.ok(m, 'set_voice_consent absente');
    assert.ok(/delete from voice_recordings where code = p_code/.test(m[0]), 'suppression des métadonnées absente');
    assert.ok(/delete from storage\.objects/.test(m[0]) && /\/voice\/%/.test(m[0]), 'suppression des fichiers absente');
  });

  await test('sql : rétention 30 jours — filtrée à la lecture (patient ET ortho) + fonction de purge', () => {
    const reads = SQL.match(/create or replace function get_voice_recordings[\s\S]*?\$\$;/)[0]
                + SQL.match(/create or replace function get_patient_voice_recordings[\s\S]*?\$\$;/)[0];
    assert.strictEqual((reads.match(/interval '30 days'/g) || []).length, 2, 'les DEUX lectures doivent filtrer à 30 jours');
    assert.ok(/create or replace function purge_old_voice_recordings/.test(SQL), 'fonction de purge absente');
  });

  await test('sql : accès ortho gaté par auth.uid() + rattachement (lecture ET verdict), jamais un paramètre', () => {
    const l = SQL.match(/create or replace function get_patient_voice_recordings[\s\S]*?\$\$;/)[0];
    const v = SQL.match(/create or replace function set_voice_verdict[\s\S]*?\$\$;/)[0];
    for(const [name, fn] of [['lecture', l], ['verdict', v]]){
      assert.ok(/auth\.uid\(\)::text/.test(fn), `${name} : auth.uid() absent`);
      assert.ok(/patient_assignments/.test(fn), `${name} : rattachement absent`);
      assert.ok(!/p_ortho_code/.test(fn), `${name} : l'identité ne doit pas venir d'un paramètre`);
    }
    assert.ok(/p_verdict not in \('acquired','retry'\)/.test(v), 'verdicts autorisés non bornés');
  });

  await test('sql : fichiers sous <code>/voice/ — couverts par la purge de suppression de compte existante', () => {
    // la purge de compte supprime name like p_code || '/%' : voice/ est dessous.
    assert.ok(/name like p_code \|\| '\/%'/.test(SQL), 'purge de compte introuvable');
    assert.ok(/'\/voice\/'/.test(STJS.match(/async addVoiceRecording[\s\S]*?\n  \},/)[0]),
      'le chemin d\'upload doit être <code>/voice/…');
  });

  // ---- storage.js ----
  await test('storage : les 6 fonctions de la boucle existent, cloud-only, via les bons RPC', () => {
    for(const [fn, rpc] of [
      ['setVoiceConsent','set_voice_consent'], ['addVoiceRecording','add_voice_recording'],
      ['listVoiceRecordings','get_voice_recordings'], ['orthoListVoiceRecordings','get_patient_voice_recordings'],
      ['orthoSetVoiceVerdict','set_voice_verdict'], ['purgeOldVoiceRecordings','purge_old_voice_recordings'],
    ]){
      assert.ok(new RegExp('async '+fn+'\\(').test(STJS), fn+' absente');
      assert.ok(new RegExp("supa\\.rpc\\('"+rpc+"'").test(STJS), rpc+' non appelé');
    }
  });

  // ---- UI patient ----
  await test('patient : carte présente, masquée par défaut, avec consentement + liste + statut aria-live', () => {
    const card = idxDoc.getElementById('voice-loop-card');
    assert.ok(card, '#voice-loop-card absent');
    assert.ok(/display:none/.test(card.getAttribute('style') || ''), 'la carte doit être masquée par défaut (cloud-only + mots ciblés requis)');
    assert.ok(idxDoc.getElementById('voice-consent-checkbox'), 'case de consentement absente');
    const status = idxDoc.getElementById('voice-status');
    assert.ok(status && status.getAttribute('aria-live') === 'polite', 'statut aria-live absent');
  });

  await test('patient : VoiceLoop — cloud-only, consentement avant liste, MediaRecorder borné à 6 s, délégation', () => {
    const m = APP.match(/const VoiceLoop = \{[\s\S]*?\n\};/);
    assert.ok(m, 'module VoiceLoop absent');
    assert.ok(/Store\.mode\(\) !== 'cloud'/.test(m[0]), 'garde cloud-only absente');
    assert.ok(/MediaRecorder/.test(m[0]) && /6000/.test(m[0]), 'MediaRecorder ou limite 6 s absents');
    assert.ok(/setVoiceConsent/.test(m[0]), 'bascule de consentement absente');
    assert.ok(!/onclick="[^"]*\$\{/.test(m[0]), 'onclick inline interpolé interdit');
    assert.ok(/escapeHTML\(word\)|escapeHTML\(w\.word|escapeHTML\((w\.word)/.test(m[0]) || /escapeHTML/.test(m[0]), 'échappement absent');
    assert.ok(/VoiceLoop\.render\(\)/.test(APP.match(/async function renderDashboard[\s\S]{0,400}/)[0]), 'VoiceLoop.render non branché dans renderDashboard');
  });

  // ---- UI ortho ----
  await test('ortho : section "Enregistrements reçus" + verdicts par délégation + audio échappé', () => {
    assert.ok(ortDoc.getElementById('d-voice-recordings'), '#d-voice-recordings absent');
    const m = DOJS.match(/async refreshVoiceRecordings\(\)[\s\S]*?\n  \},/);
    assert.ok(m, 'refreshVoiceRecordings absente');
    assert.ok(/data-voice-verdict/.test(m[0]) && /addEventListener\('click'/.test(m[0]), 'délégation des verdicts absente');
    assert.ok(/escapeHTML\(r\.url\)/.test(m[0]) && /escapeHTML\(r\.word\)/.test(m[0]), 'échappement url/mot absent');
    assert.ok(/await OrthoApp\.refreshVoiceRecordings\(\);[\s\S]{0,200}?show\('ortho-detail'\)/.test(DOJS), 'non branché dans openPatient');
  });

  // ---- i18n ----
  await test('i18n : les 14 clés existent dans les 14 langues, kabyle réel (pas de repli français)', () => {
    const KEYS = ['voice_card_title','voice_card_sub','voice_consent_label','voice_consent_revoked','voice_record_btn','voice_stop_btn','voice_recording','voice_sending','voice_sent','voice_mic_error','voice_error','voice_verdict_acquired','voice_verdict_retry','ortho_voice_empty'];
    for(const l of Object.keys(S)) for(const k of KEYS){
      assert.ok(typeof S[l][k] === 'string' && S[l][k].length, `${k} manquante en ${l}`);
    }
    for(const k of KEYS){
      assert.notStrictEqual(S.kab[k], S.fr[k], `${k} : kab ne doit pas être un repli français`);
    }
    // le consentement doit mentionner la révocation et la suppression (fr)
    assert.ok(/retirer|révoc/i.test(S.fr.voice_consent_label) && /supprim/i.test(S.fr.voice_consent_label),
      'le libellé fr du consentement doit mentionner révocation + suppression');
  });

  console.log(`\n${passed} test(s) réussi(s), ${failed} échec(s).`);
  process.exit(failed ? 1 : 0);
})();
