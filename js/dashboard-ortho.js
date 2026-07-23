// =====================================================================
//  TABLEAU DE BORD ORTHOPHONISTE (v6) — authentification réelle
//  ---------------------------------------------------------------------
//  Compte Supabase Auth (email + mot de passe). Toutes les lectures/
//  écritures qui suivent passent par les tables directement, protégées
//  par des règles RLS (voir sql/schema.sql) : un orthophoniste ne voit
//  QUE les patients qu'il a explicitement rattachés.
//
//  Aucune valeur affichée ici n'est un diagnostic : ce sont des mesures
//  d'usage de l'application (taux de réussite, catégories d'erreurs
//  détectées par heuristique) destinées à éclairer, jamais remplacer,
//  le jugement clinique de l'orthophoniste.
//
//  v6.76 : interface traduite dans les 9 langues complètes (comme le
//  reste de l'app) — voir js/i18n.js (clés ortho_*). LEVEL_NAMES et les
//  libellés de catégories d'erreur réutilisent des clés déjà utilisées
//  côté patient (level_1/2/3) plutôt que de les dupliquer.
// =====================================================================
const Store = window.ReParoleStore;
const AI = window.Learner;

// v6.83 : VRAI BUG DE SÉCURITÉ corrigé — le nom du patient et la
// légende de ses photos personnelles (tous deux du texte libre choisi
// par le patient) s'affichaient sans échappement dans le navigateur de
// l'orthophoniste (liste des patients, détail patient). Un patient
// mal intentionné aurait pu y placer du HTML/JS actif, exécuté côté
// orthophoniste à la simple ouverture de la liste ou de sa fiche —
// une vraie faille XSS stockée, trouvée en réponse à une demande
// explicite de revue de sécurité, pas seulement une question de style.
function escapeHTML(s){ return (s||'').toString().replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }

function oT(key, ...params){
  return (window.I18N ? I18N.t(key, ...params) : key);
}
// v6.76 : LEVEL_NAMES devient une fonction (dépend de la langue active),
// gardé sous forme d'objet pour les rares appels qui veulent les 3 noms
// d'un coup (aucun ici en fait, mais garde le même point d'accès).
function levelName(level){ return oT('level_' + level) || level; }

let orthoCode = null;   // = l'identifiant Supabase Auth (auth.uid())
let orthoName = null;
// v6.24 : structure gratuit/pro pour l'espace orthophoniste — pas de
// paiement branché (voir sql/schema.sql). Seuil regroupé ici pour être
// facile à ajuster plus tard.
let orthoPlan = 'free';
const ORTHO_FREE_PATIENT_LIMIT = 3;
let patients = [];
let currentPatient = null;
let currentHistory = [];
let currentErrors = [];
let authMode = 'signin'; // 'signin' | 'signup'

// v6.76 : locale d'affichage des dates, suit la langue active plutôt que
// d'être toujours 'fr-FR' (même principe que js/caregiver.js).
function orthoDateLocale(){
  const lang = (window.Prefs && Prefs.data.lang) || 'fr';
  if(window.LANGUAGES && LANGUAGES[lang] && LANGUAGES[lang].speechLocale) return LANGUAGES[lang].speechLocale;
  return lang === 'fr' ? 'fr-FR' : lang;
}

function show(id){ document.querySelectorAll('.screen').forEach(s=>s.classList.remove('active')); document.getElementById(id).classList.add('active'); window.scrollTo(0,0); }

let orthoPaywallOn = false; // v6.233 : piloté par le réglage admin
(async function loadOrthoPaywall(){
  try{
    if(typeof Store === 'undefined' || !Store.getBillingSettings) return;
    const st = await Store.getBillingSettings();
    if(st && st.paywallOrtho === true){ orthoPaywallOn = true; }
  }catch(e){ /* silencieux : en cas de doute, tout reste ouvert */ }
})();

const OrthoApp = {
  async init(){
    if(Store.mode()!=='cloud'){
      document.getElementById('cloud-warning').style.display='block';
      return;
    }
    OrthoApp._renderClinicalOptions();
    // v6 : session déjà active (revient sur la page) -> pas besoin de se reconnecter
    const session = await Store.getOrthoSession();
    if(session){
      orthoCode = session.code; orthoName = session.name; orthoPlan = session.plan || 'free';
      document.getElementById('ortho-who').textContent = orthoName;
      await OrthoApp.refreshList();
      await OrthoApp.refreshMfaStatus();
      show('ortho-list');
    }
  },

  // v6.76 : régénère la liste déroulante des profils cliniques — appelée
  // au chargement ET à chaque changement de langue (voir js/prefs.js,
  // setLang -> OrthoApp.refreshList ne suffisait pas pour ce select
  // précis puisqu'il n'est peuplé qu'une fois au départ). Extrait dans
  // sa propre fonction pour pouvoir être rappelée sans dupliquer init().
  _renderClinicalOptions(){
    const sel = document.getElementById('d-clinical');
    if(sel && window.CLINICAL_PROFILES){
      const current = sel.value;
      sel.innerHTML = Object.keys(window.CLINICAL_PROFILES)
        .map(key=>`<option value="${key}">${oT('ortho_clinical_' + key)}</option>`).join('');
      if(current) sel.value = current;
    }
  },

  toggleAuthMode(){
    authMode = authMode==='signin' ? 'signup' : 'signin';
    document.getElementById('o-name-field').style.display = authMode==='signup' ? '' : 'none';
    document.getElementById('o-submit').textContent = authMode==='signup' ? oT('ortho_create_account_btn') : oT('btn_login');
    document.getElementById('o-submit').setAttribute('onclick', authMode==='signup' ? 'OrthoApp.signUp()' : 'OrthoApp.signIn()');
    document.getElementById('ortho-toggle-text').textContent = authMode==='signup' ? oT('ortho_already_account') : oT('ortho_no_account_yet');
    document.getElementById('ortho-toggle-link').textContent = authMode==='signup' ? oT('btn_login') : oT('ortho_create_account_link');
    document.getElementById('ortho-auth-error').textContent='';
  },

  async signUp(){
    const name = document.getElementById('o-name').value.trim();
    const email = document.getElementById('o-email').value.trim();
    const password = document.getElementById('o-password').value;
    const errEl = document.getElementById('ortho-auth-error');
    if(!name || !email || !password){ errEl.textContent=oT('ortho_err_fill_all_fields'); return; }
    // v6.24 : mot de passe renforcé — 8 caractères minimum ne suffisait
    // pas pour un compte donnant accès à des données de patients.
    const pwCheck = OrthoApp._checkPasswordStrength(password);
    if(pwCheck){ errEl.textContent = pwCheck; return; }
    const res = await Store.signUpOrtho(email, password, name);
    if(res.error){ errEl.textContent = oT('ortho_err_generic', res.error.message); return; }
    if(res.needsEmailConfirmation){
      errEl.style.color='var(--accent-dark)';
      errEl.textContent = oT('ortho_account_created');
      OrthoApp.toggleAuthMode();
      return;
    }
    await OrthoApp._afterLogin(email, password);
  },

  // v6.24 : au moins 8 caractères, une majuscule, une minuscule, un
  // chiffre. Ce n'est pas exagérément strict (pas de caractère spécial
  // obligatoire) pour rester accessible, mais nettement plus robuste
  // qu'une simple longueur minimale.
  _checkPasswordStrength(password){
    if(password.length<8) return oT('ortho_err_pw_min_length');
    if(!/[a-z]/.test(password)) return oT('ortho_err_pw_lowercase');
    if(!/[A-Z]/.test(password)) return oT('ortho_err_pw_uppercase');
    if(!/[0-9]/.test(password)) return oT('ortho_err_pw_digit');
    return null;
  },

  async signIn(){
    const email = document.getElementById('o-email').value.trim();
    const password = document.getElementById('o-password').value;
    const errEl = document.getElementById('ortho-auth-error');
    if(!email || !password){ errEl.textContent=oT('ortho_err_fill_email_pw'); return; }
    errEl.style.color='var(--error)'; errEl.textContent='';
    const res = await Store.signInOrtho(email, password);
    if(res.error){ errEl.textContent = oT('ortho_err_signin_failed', res.error.message); return; }
    await OrthoApp._handleSignInResult(res);
  },

  // v6.81 : envoie l'email de récupération depuis l'app elle-même
  // (avec le bon lien de redirection vers reset-password.html) plutôt
  // que de dépendre du bouton "Send password recovery" du tableau
  // Supabase, qui redirigeait vers l'accueil faute de page dédiée.
  async forgotPassword(){
    const email = document.getElementById('o-email').value.trim();
    const errEl = document.getElementById('ortho-auth-error');
    if(!email){ errEl.style.color='var(--error)'; errEl.textContent = oT('ortho_forgot_password_enter_email'); return; }
    errEl.style.color = 'var(--accent-dark)';
    errEl.textContent = oT('ortho_forgot_password_sent');
    await Store.resetPasswordForEmail(email);
  },

  // v6.24 : partagé entre signIn() et _afterLogin() — évite de dupliquer
  // la gestion du défi MFA à deux endroits.
  async _handleSignInResult(res){
    if(res.mfaRequired){
      OrthoApp._pendingMfa = { factorId: res.factorId, challengeId: res.challengeId };
      document.getElementById('ortho-mfa-error').textContent = '';
      document.getElementById('mfa-code').value = '';
      show('ortho-mfa-challenge');
      return;
    }
    orthoCode = res.code; orthoName = res.name; orthoPlan = res.plan || 'free';
    document.getElementById('ortho-who').textContent = orthoName;
    await OrthoApp.refreshList();
    await OrthoApp.refreshMfaStatus();
    show('ortho-list');
  },

  // v6.24 : appelé depuis l'écran "Code de sécurité" après une connexion
  // par mot de passe sur un compte protégé par la double authentification.
  async submitMfaCode(){
    const code = document.getElementById('mfa-code').value.trim();
    const errEl = document.getElementById('ortho-mfa-error');
    if(!/^\d{6}$/.test(code)){ errEl.textContent = oT('ortho_err_enter_6_digits'); return; }
    const pending = OrthoApp._pendingMfa;
    if(!pending){ errEl.textContent = oT('ortho_err_session_expired'); show('ortho-login'); return; }
    const res = await Store.completeMfaSignIn(pending.factorId, pending.challengeId, code);
    if(res.error){ errEl.textContent = oT('ortho_err_invalid_code'); return; }
    OrthoApp._pendingMfa = null;
    orthoCode = res.code; orthoName = res.name; orthoPlan = res.plan || 'free';
    document.getElementById('ortho-who').textContent = orthoName;
    await OrthoApp.refreshList();
    await OrthoApp.refreshMfaStatus();
    show('ortho-list');
  },

  cancelMfaChallenge(){
    OrthoApp._pendingMfa = null;
    show('ortho-login');
  },

  async _afterLogin(email, password){
    const res = await Store.signInOrtho(email, password);
    if(res.error) return;
    await OrthoApp._handleSignInResult(res);
  },

  async logout(){ await Store.signOutOrtho(); orthoCode=null; orthoName=null; orthoPlan='free'; patients=[]; show('ortho-login'); },

  // =====================================================================
  //  v6.24 — GESTION DE LA DOUBLE AUTHENTIFICATION (depuis le tableau de bord)
  // =====================================================================

  // Met à jour la carte "Sécurité du compte" selon l'état réel du compte
  // (interroge Supabase à chaque fois plutôt que de supposer un état).
  async refreshMfaStatus(){
    const res = await Store.mfaListFactors();
    const statusEl = document.getElementById('mfa-status');
    const step1 = document.getElementById('mfa-enroll-step1');
    const step2 = document.getElementById('mfa-enroll-step2');
    const disableBtn = document.getElementById('mfa-disable-btn');
    if(!statusEl) return; // écran pas encore affiché
    if(res.error){ statusEl.textContent = oT('ortho_mfa_check_failed'); return; }
    const verified = (res.data.totp || []).filter(f => f.status==='verified');
    if(verified.length){
      statusEl.textContent = oT('ortho_mfa_enabled');
      step1.style.display = 'none';
      step2.style.display = 'none';
      disableBtn.style.display = '';
    } else {
      statusEl.textContent = oT('ortho_mfa_disabled');
      step1.style.display = '';
      step2.style.display = 'none';
      disableBtn.style.display = 'none';
    }
    // v6.169 : les réglages sont repliés par défaut, mais on ouvre le
    // panneau tant que la 2FA n'est pas active — sinon la recommandation
    // de sécurité serait cachée pour un compte qui en a justement besoin.
    const settings = document.getElementById('ortho-settings-details');
    if(settings) settings.open = !verified.length;
  },

  async startMfaEnroll(){
    const msg = document.getElementById('mfa-enroll-msg');
    msg.textContent = '';
    const res = await Store.mfaEnroll();
    if(res.error){ msg.textContent = oT('ortho_err_generic', res.error.message); return; }
    OrthoApp._enrollFactorId = res.data.id;
    document.getElementById('mfa-qr').innerHTML = res.data.totp.qr_code;
    document.getElementById('mfa-secret').textContent = res.data.totp.secret;
    document.getElementById('mfa-enroll-step1').style.display = 'none';
    document.getElementById('mfa-enroll-step2').style.display = '';
  },

  async confirmMfaEnroll(){
    const code = document.getElementById('mfa-confirm-code').value.trim();
    const msg = document.getElementById('mfa-enroll-msg');
    if(!/^\d{6}$/.test(code)){ msg.textContent = oT('ortho_err_enter_6_digits_app'); return; }
    const factorId = OrthoApp._enrollFactorId;
    if(!factorId){ msg.textContent = oT('ortho_err_restart'); return; }
    const chRes = await Store.mfaChallenge(factorId);
    if(chRes.error){ msg.textContent = oT('ortho_err_generic', chRes.error.message); return; }
    const vRes = await Store.mfaVerify(factorId, chRes.data.id, code);
    if(vRes.error){ msg.textContent = oT('ortho_err_invalid_retry'); return; }
    msg.textContent = oT('ortho_mfa_activated');
    document.getElementById('mfa-confirm-code').value = '';
    await OrthoApp.refreshMfaStatus();
  },

  async disableMfa(){
    const msg = document.getElementById('mfa-enroll-msg');
    if(!confirm(oT('ortho_disable_confirm'))) return;
    const res = await Store.mfaListFactors();
    if(res.error){ msg.textContent = oT('ortho_err_generic', res.error.message); return; }
    for(const f of (res.data.totp || [])){
      await Store.mfaUnenroll(f.id);
    }
    msg.textContent = oT('ortho_mfa_deactivated');
    await OrthoApp.refreshMfaStatus();
  },

  // v6.26 : paiement Stripe côté orthophoniste
  async startCheckout(planKey){
    const errEl = document.getElementById('ortho-pricing-error');
    errEl.textContent = oT('ortho_redirecting_payment');
    const res = await Store.createCheckoutSession(planKey, orthoCode, 'ortho');
    if(res.error){ errEl.textContent = oT('ortho_err_payment_generic'); return; }
    window.location.href = res.url;
  },

  async assign(){
    const code = document.getElementById('assign-code').value.trim();
    const msg = document.getElementById('assign-msg');
    if(!code){ return; }
    // v6.93 : VRAI BUG CORRIGÉ — un code aidant (préfixe "a-", voir
    // generateCaregiverCode) collé ici par erreur affichait l'erreur
    // SQL brute "violates foreign key constraint" au lieu d'un message
    // compréhensible. Détecté ici directement, avant même d'interroger
    // le serveur — cas précis observé en usage réel.
    if(/^a-/.test(code)){
      msg.textContent = oT('ortho_err_caregiver_code_pasted');
      msg.style.color = 'var(--error)';
      return;
    }
    // v6.24 : structure gratuit/pro — limite le nombre de patients
    // suivis simultanément en compte gratuit. Pas de paiement branché :
    // le passage en 'pro' se fait à la main dans Supabase pour l'instant
    // (voir sql/schema.sql).
    if(orthoPlan!=='pro' && patients.length>=ORTHO_FREE_PATIENT_LIMIT){
      msg.textContent = oT('ortho_free_limit_reached', ORTHO_FREE_PATIENT_LIMIT);
      return;
    }
    const res = await Store.assignPatient(orthoCode, code);
    if(res.error){
      // v6.93 : ne plus jamais afficher le texte brut d'une erreur
      // serveur (ex. contrainte SQL) — message générique clair à la
      // place, quelle que soit la cause exacte de l'échec.
      msg.textContent = oT('ortho_err_assign_failed');
      msg.style.color = 'var(--error)';
      return;
    }
    msg.style.color = 'var(--accent-dark)';
    msg.textContent = oT('ortho_patient_assigned', res.name);
    document.getElementById('assign-code').value='';
    await OrthoApp.refreshList();
  },

  // v6.93 : réponse à "j'aimerais pouvoir créer une fiche patient" —
  // jusqu'ici, seul le rattachement d'un code déjà créé PAR le patient
  // était possible. Utile en particulier pour un∙e patient∙e qui ne
  // peut pas s'inscrire seul∙e (première prise en main, difficulté à
  // manier un écran) : l'orthophoniste crée le dossier, puis
  // transmet le code généré au patient pour qu'il·elle se connecte
  // directement ensuite. Réutilise exactement le même mécanisme que
  // la création patient côté patient (Store.generateCode() +
  // Store.savePatient()), pour rester cohérent avec un seul et même
  // format de code partout dans l'app.
  async createPatient(){
    const nameEl = document.getElementById('create-patient-name');
    const msg = document.getElementById('create-patient-msg');
    const resultEl = document.getElementById('create-patient-result');
    const name = nameEl.value.trim();
    msg.textContent = '';
    resultEl.style.display = 'none';
    if(!name){ msg.textContent = oT('ortho_create_patient_err_name'); msg.style.color = 'var(--error)'; return; }
    if(orthoPlan!=='pro' && patients.length>=ORTHO_FREE_PATIENT_LIMIT){
      msg.textContent = oT('ortho_free_limit_reached', ORTHO_FREE_PATIENT_LIMIT);
      msg.style.color = 'var(--error)';
      return;
    }
    const code = generateCode();
    await Store.savePatient(code, { name, level:2, sessions:0, correct:0, total:0, streak:1, plan:'free' });
    const res = await Store.assignPatient(orthoCode, code);
    if(res.error){
      msg.textContent = oT('ortho_err_assign_failed');
      msg.style.color = 'var(--error)';
      return;
    }
    nameEl.value = '';
    msg.textContent = '';
    document.getElementById('create-patient-code').textContent = code;
    resultEl.style.display = '';
    await OrthoApp.refreshList();
  },

  async refreshList(){
    OrthoApp._renderClinicalOptions();
    const listEl = document.getElementById('patient-list');
    const teaser = document.getElementById('ortho-pro-teaser-card');
    if(teaser) teaser.style.display = orthoPlan==='pro' ? 'none' : '';
    patients = await Store.listPatients(orthoCode);

    const overviewCard = document.getElementById('ortho-overview');
    const daysSince = p => p.last_seen ? (Date.now()-new Date(p.last_seen).getTime())/86400000 : 9999;
    const successRate = p => p.total ? p.correct/p.total : -1;

    // v6.169 (point 2) : état vide accueillant. Plutôt qu'une seule ligne,
    // on rappelle les deux façons d'ajouter un patient, avec des boutons
    // qui amènent directement au bon champ. La vue d'ensemble est masquée.
    if(!patients.length){
      if(overviewCard) overviewCard.style.display = 'none';
      listEl.innerHTML =
        '<div class="ortho-empty">'+
        `<p class="ortho-empty-title">${oT('ortho_no_patient_yet')}</p>`+
        `<p class="ortho-empty-help">${oT('ortho_no_patient_help')}</p>`+
        '<div class="ortho-empty-actions">'+
        `<button class="btn-primary" onclick="OrthoApp.focusCard('assign-code')">${oT('ortho_assign_title')}</button>`+
        `<button class="btn-ghost" onclick="OrthoApp.focusCard('create-patient-name')">${oT('ortho_create_patient_title')}</button>`+
        '</div></div>';
      return;
    }

    // v6.169 (point 1) : vue d'ensemble — synthèse calculée à partir des
    // seules données déjà renvoyées par listPatients (aucun appel en plus).
    // Réussite moyenne = agrégat sum(correct)/sum(total), plus juste qu'une
    // moyenne de moyennes (un patient à 1 séance ne pèse pas comme un autre
    // à 50). "à recontacter" et "actifs" partagent le seuil de 7 jours déjà
    // utilisé pour la pastille rouge des lignes.
    if(overviewCard){
      const tilesEl = document.getElementById('ortho-overview-tiles');
      const toRecontact = patients.filter(p => daysSince(p) > 7).length;
      const activeWeek = patients.filter(p => daysSince(p) <= 7).length;
      const sumCorrect = patients.reduce((s,p)=> s + (p.correct||0), 0);
      const sumTotal = patients.reduce((s,p)=> s + (p.total||0), 0);
      const avg = sumTotal ? Math.round(100*sumCorrect/sumTotal) + '%' : '—';
      const tile = (num, label, cls) =>
        `<div class="ortho-tile ${cls||''}"><div class="ortho-tile-num">${num}</div>`+
        `<div class="ortho-tile-lab">${label}</div></div>`;
      if(tilesEl){
        tilesEl.innerHTML =
          tile(patients.length, oT('ortho_overview_patients')) +
          tile(toRecontact, oT('ortho_overview_to_recontact'), toRecontact ? 'ortho-tile-warn' : '') +
          tile(activeWeek, oT('ortho_overview_active_week')) +
          tile(avg, oT('ortho_overview_avg_success'));
      }
      overviewCard.style.display = '';
    }

    // v6.169 (point 3) : activité récente de tous les patients en un seul
    // appel (code -> jours actifs). Repli {} si indisponible (mode local,
    // ou fonction SQL pas encore déployée) — la frise s'affiche alors vide.
    const activity = await Store.orthoActivity();

    const sortBy = document.getElementById('sort-patients')?.value || 'inactivity';
    const sorted = [...patients].sort((a,b)=>{
      if(sortBy==='inactivity') return daysSince(b)-daysSince(a);
      if(sortBy==='success_asc') return successRate(a)-successRate(b);
      if(sortBy==='success_desc') return successRate(b)-successRate(a);
      return (a.name||'').localeCompare(b.name||'');
    });

    // v6.195 : bandeau d'inactivité affiché seulement s'il est VRAI
    const staleHint = document.getElementById('ortho-stale-hint');
    if(staleHint) staleHint.style.display = sorted.some(p=>daysSince(p) > 7) ? '' : 'none';

    listEl.innerHTML = sorted.map(p=>{
      const stale = daysSince(p) > 7;
      const lastVisit = p.last_seen ? new Date(p.last_seen).toLocaleDateString(orthoDateLocale()) : '—';
      return `
      <div class="patient-row" onclick="OrthoApp.openPatient('${p.code}')">
        <div>
          <div class="p-name">${stale?'🔴 ':''}${escapeHTML(p.name)}</div>
          <div class="p-meta">${oT('ortho_level_prefix', levelName(p.level))} · ${oT('ortho_sessions_count', p.sessions)} · ${oT('ortho_last_visit', lastVisit)}</div>
          ${OrthoApp._activityStrip(activity[p.code])}
        </div>
        <div class="p-meta">${p.total? oT('ortho_success_pct', Math.round(100*p.correct/p.total)):'—'}</div>
      </div>`;
    }).join('');
  },

  // v6.169 (point 3) : mini-frise des 14 derniers jours calendaires pour
  // une ligne patient — un point plein si au moins une séance ce jour-là.
  // Même logique de clés de dates que l'espace aidant (js/caregiver.js),
  // pour un comportement strictement cohérent. `days` = ["YYYY-MM-DD", ...]
  // ou undefined.
  _activityStrip(days){
    const active = new Set(days || []);
    let dots = '';
    for(let i = 13; i >= 0; i--){
      const dt = new Date(); dt.setDate(dt.getDate() - i);
      const key = dt.toISOString().slice(0,10);
      dots += `<span class="p-day-dot ${active.has(key) ? 'p-day-active' : ''}" title="${key}"></span>`;
    }
    return `<div class="p-activity-strip" aria-label="${oT('ortho_activity_label')}">${dots}</div>`;
  },

  // v6.169 (point 2) : depuis l'état vide, amène directement au bon champ
  // (rattacher / créer) — défilement doux puis focus sur l'input.
  focusCard(id){
    const el = document.getElementById(id);
    if(!el) return;
    if(typeof el.scrollIntoView === 'function') el.scrollIntoView({ behavior:'smooth', block:'center' });
    setTimeout(()=> { try{ el.focus(); }catch(e){} }, 300);
  },

  backToList(){ show('ortho-list'); },

  // v6.76 : rafraîchit le détail patient déjà affiché après un
  // changement de langue (voir js/prefs.js, setLang) — sans recharger
  // depuis le serveur, juste retraduire l'affichage déjà en mémoire.
  refreshDetail(){
    if(!currentPatient) return;
    OrthoApp._renderPatientDetail(currentPatient, currentHistory, currentErrors);
  },

  async openPatient(code){
    const p = await Store.loadPatient(code);
    const statusEl = document.getElementById('patient-list-status');
    if(statusEl) statusEl.textContent = '';
    if(!p){ if(statusEl) statusEl.textContent = oT('ortho_record_not_found'); return; }
    currentPatient = { code, ...p };
    OrthoApp._renderClinicalOptions();

    const clinicalSel = document.getElementById('d-clinical');
    if(clinicalSel) clinicalSel.value = p.clinical_profile || 'none';

    const profile = await Store.loadProfile(code);
    AI.load(profile);

    const hist = await Store.history(code);
    currentHistory = hist;
    currentErrors = await Store.errorHistory(code);

    OrthoApp._renderPatientDetail(currentPatient, hist, currentErrors);

    const media = await Store.listMedia(code);
    document.getElementById('d-media').innerHTML = media.length ? media.map(m=>`
      <div class="media-item"><img src="${escapeHTML(m.url)}" alt="${escapeHTML(m.label)}"><div class="m-label">${escapeHTML(m.label)}</div></div>
    `).join('') : `<p class="media-empty">${oT('ortho_no_photo_yet')}</p>`;

    const reports = await Store.listReports(code);
    document.getElementById('d-reports').textContent = reports.length
      ? oT('ortho_reports_count', reports.length, new Date(reports[0].generated_at).toLocaleDateString(orthoDateLocale()))
      : '';

    await OrthoApp.refreshNotes();
    await OrthoApp.refreshTargetWords();
    const gUnlock = document.getElementById('games-unlock-toggle');
    if(gUnlock) gUnlock.checked = !!currentPatient.games_all_unlocked; // v6.187
    await OrthoApp.refreshVoiceRecordings();
    await OrthoApp.refreshCustomExercises();

    show('ortho-detail');
  },

  // =====================================================================
  //  v6.175 — BROUILLON DE COMPTE-RENDU PAR IA (Pro)
  //  ---------------------------------------------------------------------
  //  L'IA (edge function, voir js/ia-edge-function.md) met en forme les
  //  données de suivi ANONYMISÉES en brouillon éditable. Garde-fous :
  //  aucun diagnostic, l'ortho relit/corrige/signe, plafond 20/jour côté
  //  serveur, clé API jamais dans le navigateur. Réservé au plan Pro
  //  (les appels IA ont un coût réel).
  // =====================================================================
  async generateReportDraft(){
    if(!currentPatient) return;
    const statusEl = document.getElementById('ai-draft-status');
    const zone = document.getElementById('ai-draft-zone');
    const btn = document.getElementById('ai-draft-btn');
    statusEl.style.color = '';
    if(!OrthoApp.iaAllowed()){
      statusEl.textContent = oT('ortho_ai_draft_pro_hint');
      return;
    }
    btn.disabled = true;
    statusEl.textContent = oT('ortho_ai_draft_generating');
    const res = await Store.orthoGenerateReportDraft(currentPatient.code, (window.Prefs && Prefs.data && Prefs.data.lang) || 'fr');
    btn.disabled = false;
    if(res.error){
      statusEl.style.color = 'var(--error)';
      statusEl.textContent = res.error === 'indisponible' ? oT('ortho_ai_draft_unavailable') : oT('ortho_ai_draft_error');
      return;
    }
    statusEl.textContent = '';
    zone.style.display = '';
    document.getElementById('ai-draft-text').value = res.draft;
  },

  async copyReportDraft(){
    const statusEl = document.getElementById('ai-draft-status');
    const text = document.getElementById('ai-draft-text').value;
    try{
      await navigator.clipboard.writeText(text);
      statusEl.style.color = '';
      statusEl.textContent = oT('ortho_ai_draft_copied');
    }catch(e){
      statusEl.textContent = '';
    }
  },

  // v6.186 : BÊTA — l'IA est ouverte sans abonnement pendant les tests
  // (retour : « je peux pas tester » — le développeur lui-même était
  // bloqué par son propre paywall). À passer à false au lancement
  // commercial : le contrôle Pro reprend alors partout, ET le plafond
  // serveur (40/jour) reste actif dans tous les cas.
  // eslint-disable-next-line no-unused-vars
  // v6.233 : l'accès aux fonctions Pro/IA n'est plus figé dans le code.
  // Il suit la case « Orthophonistes : passer au payant » de l'espace
  // admin (table app_settings). Tant qu'elle est décochée, tout est
  // ouvert ; une fois cochée, seuls les comptes « pro » y accèdent.
  iaAllowed(){
    return !orthoPaywallOn || orthoPlan === 'pro';
  },

  // =====================================================================
  //  v6.182 — L'IA PRÉPARE, L'ORTHO DÉCIDE (3 assistances de plus)
  //  ---------------------------------------------------------------------
  //  suggestTargetWords : l'IA propose des mots d'après les erreurs
  //    récurrentes ; CHAQUE mot n'est ciblé que si l'ortho clique dessus.
  //  generatePrepNote : note de préparation de séance, lecture/copie —
  //    jamais stockée automatiquement.
  //  rewriteNote : reformule le brouillon DANS le champ ; l'ajout de la
  //    note reste un geste de l'ortho.
  //  Tout passe par Store.iaAssist (anonymisé, plafonné, jeton de
  //  session). Réservé au plan Pro, contrôle AVANT tout appel.
  // =====================================================================
  async suggestTargetWords(){
    if(!currentPatient) return;
    const statusEl = document.getElementById('ai-words-status');
    const listEl = document.getElementById('ai-words-list');
    const btn = document.getElementById('ai-words-btn');
    statusEl.style.color = '';
    if(!OrthoApp.iaAllowed()){ statusEl.textContent = oT('ortho_ai_draft_pro_hint'); return; }
    btn.disabled = true;
    statusEl.textContent = oT('ortho_ai_words_generating');
    const res = await Store.iaAssist('suggest_words', { patient_code: currentPatient.code, lang: (window.Prefs && Prefs.data && Prefs.data.lang) || 'fr' });
    btn.disabled = false;
    if(res.error || !res.result || !Array.isArray(res.result.suggestions)){
      statusEl.style.color = 'var(--error)';
      statusEl.textContent = res.error === 'indisponible' ? oT('ortho_ai_draft_unavailable') : oT('ortho_ai_draft_error');
      return;
    }
    statusEl.textContent = oT('ortho_ai_words_help');
    listEl.innerHTML = res.result.suggestions.slice(0, 6).map(s => `
      <span style="background:var(--surface-soft);border-radius:10px;padding:6px 10px;display:inline-flex;align-items:center;gap:8px;font-size:.9rem">
        <span>${escapeHTML(s.emoji || '💬')}</span>
        <b>${escapeHTML(s.mot || '')}</b>
        <span class="hint" style="margin:0">${escapeHTML(s.raison || '')}</span>
        <button type="button" class="btn-ghost" style="padding:3px 10px;font-size:.8rem" data-ai-word="${escapeHTML(s.mot || '')}" data-ai-emoji="${escapeHTML(s.emoji || '')}">＋ ${oT('ortho_ai_words_accept')}</button>
      </span>`).join('');
    if(!listEl._aiBound){
      listEl.addEventListener('click', async (e)=>{
        const b = e.target.closest('button[data-ai-word]');
        if(!b || !currentPatient) return;
        b.disabled = true;
        const r = await Store.orthoAddWord(currentPatient.code, b.dataset.aiWord, b.dataset.aiEmoji);
        if(r && r.error){ b.disabled = false; return; }
        b.closest('span').remove(); // validé -> quitte les propositions
        await OrthoApp.refreshTargetWords();
      });
      listEl._aiBound = true;
    }
  },

  async generatePrepNote(){
    if(!currentPatient) return;
    const statusEl = document.getElementById('ai-draft-status');
    const zone = document.getElementById('ai-draft-zone');
    const btn = document.getElementById('ai-prep-btn');
    statusEl.style.color = '';
    if(!OrthoApp.iaAllowed()){ statusEl.textContent = oT('ortho_ai_draft_pro_hint'); return; }
    btn.disabled = true;
    statusEl.textContent = oT('ortho_ai_prep_generating');
    const res = await Store.iaAssist('prep_note', { patient_code: currentPatient.code, lang: (window.Prefs && Prefs.data && Prefs.data.lang) || 'fr' });
    btn.disabled = false;
    if(res.error){
      statusEl.style.color = 'var(--error)';
      statusEl.textContent = res.error === 'indisponible' ? oT('ortho_ai_draft_unavailable') : oT('ortho_ai_draft_error');
      return;
    }
    statusEl.textContent = '';
    zone.style.display = '';
    document.getElementById('ai-draft-text').value = res.result;
  },

  async rewriteNote(){
    const ta = document.getElementById('new-note');
    const statusEl = document.getElementById('ai-rewrite-status');
    const btn = document.getElementById('ai-rewrite-btn');
    statusEl.style.color = '';
    if(!ta.value.trim()){ return; }
    if(!OrthoApp.iaAllowed()){ statusEl.textContent = oT('ortho_ai_draft_pro_hint'); return; }
    btn.disabled = true;
    statusEl.textContent = oT('ortho_ai_rewrite_generating');
    const res = await Store.iaAssist('rewrite_note', { patient_code: currentPatient ? currentPatient.code : null, text: ta.value, lang: (window.Prefs && Prefs.data && Prefs.data.lang) || 'fr' });
    btn.disabled = false;
    if(res.error){
      statusEl.style.color = 'var(--error)';
      statusEl.textContent = res.error === 'indisponible' ? oT('ortho_ai_draft_unavailable') : oT('ortho_ai_draft_error');
      return;
    }
    ta.value = res.result;                       // l'ortho relit, modifie…
    statusEl.textContent = oT('ortho_ai_rewrite_done'); // …et ajoute lui-même
  },

  // =====================================================================
  //  v6.183 — ATELIER D'EXERCICES IA : l'IA crée, l'ortho valide.
  //  generateExercise -> prévisualisation SEULEMENT (rien d'enregistré) ;
  //  acceptExercise -> le clic de validation, seul chemin vers le patient
  //  (addCustomExercise n'existe nulle part ailleurs) ; rejectExercise ->
  //  poubelle. Vérification du JSON avant tout : answer strictement dans
  //  choices — un exercice cassé ne sera jamais proposé.
  // =====================================================================
  _pendingExo: null,

  _validExoPayload(r){
    if(!r || typeof r.titre !== 'string' || !Array.isArray(r.items) || !r.items.length) return null;
    const items = r.items.slice(0, 8).filter(it =>
      it && typeof it.text === 'string' && it.text.trim() &&
      Array.isArray(it.choices) && it.choices.length >= 3 &&
      typeof it.answer === 'string' && it.choices.includes(it.answer)
    ).map(it => ({ text: it.text.trim(), choices: it.choices.slice(0, 4).map(String), answer: it.answer }));
    if(items.length < 3) return null; // trop dégradé pour être proposé
    return { title: r.titre.trim(), raison: typeof r.raison === 'string' ? r.raison : '', items };
  },

  async generateExercise(){
    if(!currentPatient) return;
    const statusEl = document.getElementById('ai-exo-status');
    const btn = document.getElementById('ai-exo-btn');
    const preview = document.getElementById('ai-exo-preview');
    const actions = document.getElementById('ai-exo-actions');
    statusEl.style.color = '';
    if(!OrthoApp.iaAllowed()){ statusEl.textContent = oT('ortho_ai_draft_pro_hint'); return; }
    btn.disabled = true;
    statusEl.textContent = oT('ortho_ai_exo_generating');
    const res = await Store.iaAssist('generate_exercise', { patient_code: currentPatient.code, lang: (window.Prefs && Prefs.data && Prefs.data.lang) || 'fr' });
    btn.disabled = false;
    const exo = res.error ? null : OrthoApp._validExoPayload(res.result);
    if(!exo){
      statusEl.style.color = 'var(--error)';
      statusEl.textContent = res.error === 'indisponible' ? oT('ortho_ai_draft_unavailable') : oT('ortho_ai_draft_error');
      return;
    }
    OrthoApp._pendingExo = exo;
    statusEl.textContent = '';
    preview.style.display = '';
    actions.style.display = '';
    preview.innerHTML = `
      <b>${escapeHTML(exo.title)}</b>
      ${exo.raison ? `<p class="hint" style="margin-top:4px">${escapeHTML(exo.raison)}</p>` : ''}
      <ol style="margin:10px 0 0 18px;display:grid;gap:8px">
        ${exo.items.map(it => `<li style="font-size:.9rem">${escapeHTML(it.text)}<br>
          ${it.choices.map(ch => ch === it.answer
            ? `<b style="color:var(--accent-dark)">✔ ${escapeHTML(ch)}</b>`
            : `<span class="hint" style="margin:0">${escapeHTML(ch)}</span>`).join(' · ')}
        </li>`).join('')}
      </ol>`;
  },

  async acceptExercise(){
    const exo = OrthoApp._pendingExo;
    if(!exo || !currentPatient) return;
    const statusEl = document.getElementById('ai-exo-status');
    const res = await Store.addCustomExercise(currentPatient.code, exo.title, { raison: exo.raison, items: exo.items });
    if(res && res.error){
      statusEl.style.color = 'var(--error)';
      statusEl.textContent = oT('ortho_ai_draft_error');
      return;
    }
    OrthoApp.rejectExercise(); // vide la prévisualisation
    statusEl.style.color = '';
    statusEl.textContent = oT('ortho_ai_exo_saved');
    await OrthoApp.refreshCustomExercises();
  },

  rejectExercise(){
    OrthoApp._pendingExo = null;
    document.getElementById('ai-exo-preview').style.display = 'none';
    document.getElementById('ai-exo-actions').style.display = 'none';
    document.getElementById('ai-exo-preview').innerHTML = '';
  },

  async refreshCustomExercises(){
    const el = document.getElementById('d-custom-exos');
    if(!el || !currentPatient) return;
    const exos = await Store.listCustomExercises(currentPatient.code);
    if(!exos.length){
      el.innerHTML = `<p class="hint" style="margin-top:0">${oT('ortho_ai_exo_empty')}</p>`;
      return;
    }
    el.innerHTML = exos.map(e => `
      <div style="display:flex;align-items:center;gap:10px;background:var(--surface-soft);border-radius:10px;padding:8px 12px">
        <span style="font-size:.9rem">📝 ${escapeHTML(e.title)}</span>
        <span class="hint" style="margin:0">${new Date(e.created_at).toLocaleDateString(orthoDateLocale())}</span>
        <button type="button" data-exo-id="${escapeHTML(String(e.id))}" aria-label="${oT('ortho_target_remove_aria')}" title="${oT('ortho_target_remove_aria')}" style="margin-left:auto;border:none;background:none;cursor:pointer;color:var(--ink-soft);font-size:1rem;padding:2px 4px">✕</button>
      </div>`).join('');
    if(!el._exoBound){
      el.addEventListener('click', async (e)=>{
        const b = e.target.closest('button[data-exo-id]');
        if(!b) return;
        b.disabled = true;
        const r = await Store.deleteCustomExercise(Number(b.dataset.exoId));
        if(r && r.error){ b.disabled = false; return; }
        await OrthoApp.refreshCustomExercises();
      });
      el._exoBound = true;
    }
  },

  // =====================================================================
  //  v6.187 — interrupteur de quête + récit d'évolution + vue cabinet
  // =====================================================================
  async setGamesUnlock(checked){
    if(!currentPatient) return;
    const status = document.getElementById('games-unlock-status');
    const res = await Store.orthoSetGamesUnlock(currentPatient.code, checked);
    if(res && res.error){
      status.style.color = 'var(--error)';
      status.textContent = res.error;
      document.getElementById('games-unlock-toggle').checked = !checked; // revert
      return;
    }
    currentPatient.games_all_unlocked = checked;
    status.style.color = '';
    status.textContent = oT('ortho_games_unlock_saved');
  },

  async generateEvolutionStory(){
    if(!currentPatient) return;
    const statusEl = document.getElementById('ai-draft-status');
    const zone = document.getElementById('ai-draft-zone');
    const btn = document.getElementById('ai-evo-btn');
    statusEl.style.color = '';
    if(!OrthoApp.iaAllowed()){ statusEl.textContent = oT('ortho_ai_draft_pro_hint'); return; }
    btn.disabled = true;
    statusEl.textContent = oT('ortho_ai_evo_generating');
    const days = Number(document.getElementById('evo-days').value) || 30;
    const res = await Store.iaAssist('evolution_story', { patient_code: currentPatient.code, days, lang: (window.Prefs && Prefs.data && Prefs.data.lang) || 'fr' });
    btn.disabled = false;
    if(res.error){
      statusEl.style.color = 'var(--error)';
      statusEl.textContent = res.error === 'indisponible' ? oT('ortho_ai_draft_unavailable') : oT('ortho_ai_draft_error');
      return;
    }
    statusEl.textContent = '';
    zone.style.display = '';
    document.getElementById('ai-draft-text').value = res.result;
  },

  async cabinetDigest(){
    const statusEl = document.getElementById('cabinet-digest-status');
    const out = document.getElementById('cabinet-digest-out');
    const btn = document.getElementById('cabinet-digest-btn');
    statusEl.style.color = '';
    if(!OrthoApp.iaAllowed()){ statusEl.textContent = oT('ortho_ai_draft_pro_hint'); return; }
    btn.disabled = true;
    statusEl.textContent = oT('ortho_cabinet_generating');
    out.textContent = '';
    const res = await Store.iaAssist('cabinet_digest', { lang: (window.Prefs && Prefs.data && Prefs.data.lang) || 'fr' });
    btn.disabled = false;
    if(res.error){
      statusEl.style.color = 'var(--error)';
      statusEl.textContent = res.error === 'indisponible' ? oT('ortho_ai_draft_unavailable') : oT('ortho_ai_draft_error');
      return;
    }
    statusEl.textContent = '';
    out.textContent = res.result;
  },

  // v6.188 : veille scientifique côté ortho (recherche web réelle,
  //  sources exigées — voir la tâche research_exercises de ia-assist).
  async researchWatch(){
    const statusEl = document.getElementById('ortho-watch-status');
    const out = document.getElementById('ortho-watch-out');
    const btn = document.getElementById('ortho-watch-btn');
    statusEl.style.color = '';
    if(!OrthoApp.iaAllowed()){ statusEl.textContent = oT('ortho_ai_draft_pro_hint'); return; }
    btn.disabled = true;
    statusEl.textContent = oT('ortho_watch_generating');
    out.textContent = '';
    const res = await Store.iaAssist('research_exercises', { lang: (window.Prefs && Prefs.data && Prefs.data.lang) || 'fr' });
    btn.disabled = false;
    if(res.error){
      statusEl.style.color = 'var(--error)';
      statusEl.textContent = res.error === 'indisponible' ? oT('ortho_ai_draft_unavailable') : oT('ortho_ai_draft_error');
      return;
    }
    statusEl.textContent = '';
    out.textContent = res.result;
  },

  async refreshVoiceRecordings(){
    const el = document.getElementById('d-voice-recordings');
    if(!el || !currentPatient) return;
    Store.purgeOldVoiceRecordings();
    const recs = await Store.orthoListVoiceRecordings(currentPatient.code);
    if(!recs.length){
      el.innerHTML = `<p class="hint" style="margin-top:0">${oT('ortho_voice_empty')}</p>`;
      return;
    }
    el.innerHTML = recs.map(r => `
      <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;background:var(--surface-soft);border-radius:10px;padding:10px 14px">
        <b style="font-size:.92rem">${escapeHTML(r.word)}</b>
        <span style="font-size:.78rem;color:var(--ink-soft)">${new Date(r.created_at).toLocaleDateString(orthoDateLocale())}</span>
        <audio controls preload="none" src="${escapeHTML(r.url)}" style="height:32px;max-width:220px"></audio>
        ${r.verdict === 'acquired' ? `<span class="badge-pro" style="font-size:.72rem">${oT('voice_verdict_acquired')}</span>`
         : r.verdict === 'retry' ? `<span class="badge-pro" style="font-size:.72rem">${oT('voice_verdict_retry')}</span>`
         : `<span style="display:inline-flex;gap:6px">
              <button type="button" class="btn-ghost" style="padding:4px 10px;font-size:.8rem" data-voice-verdict="acquired" data-voice-id="${escapeHTML(String(r.id))}">${oT('ortho_voice_mark_acquired')}</button>
              <button type="button" class="btn-ghost" style="padding:4px 10px;font-size:.8rem" data-voice-verdict="retry" data-voice-id="${escapeHTML(String(r.id))}">${oT('ortho_voice_mark_retry')}</button>
            </span>`}
      </div>`).join('');
    if(!el._voiceBound){
      el.addEventListener('click', async (e)=>{
        const btn = e.target.closest('button[data-voice-id]');
        if(!btn) return;
        btn.disabled = true;
        const res = await Store.orthoSetVoiceVerdict(Number(btn.dataset.voiceId), btn.dataset.voiceVerdict);
        if(res && res.error){ btn.disabled = false; return; }
        await OrthoApp.refreshVoiceRecordings();
      });
      el._voiceBound = true;
    }
  },

  // =====================================================================
  //  v6.173 — MOTS CIBLÉS PAR L'ORTHOPHONISTE
  //  ---------------------------------------------------------------------
  //  L'aidant pouvait proposer des mots (aidant.html), pas l'ortho — un
  //  manque incohérent puisque c'est l'ortho qui sait quoi travailler en
  //  priorité. Même table caregiver_words (source='ortho'), même
  //  intégration automatique aux exercices de dénomination du patient.
  //  L'ortho voit TOUS les mots du patient (les siens + ceux de
  //  l'aidant, marqués d'un badge) et peut en retirer n'importe lequel :
  //  autorité clinicienne sur le contenu des exercices.
  // =====================================================================
  async refreshTargetWords(){
    const el = document.getElementById('d-target-words');
    if(!el || !currentPatient) return;
    const words = await Store.loadCaregiverWords(currentPatient.code);
    if(!words.length){
      el.innerHTML = `<p class="hint" style="margin-top:0">${oT('ortho_target_empty')}</p>`;
      return;
    }
    el.innerHTML = words.map(w => `
      <span style="background:var(--surface-soft);border-radius:10px;padding:6px 10px;display:inline-flex;align-items:center;gap:8px;font-size:.92rem">
        <span style="font-size:1.1rem">${escapeHTML(w.emoji || '💬')}</span>
        <span>${escapeHTML(w.word)}</span>
        ${w.source === 'caregiver' ? `<span class="badge-pro" style="font-size:.68rem">${oT('ortho_target_by_caregiver')}</span>` : ''}
        <button type="button" data-word-id="${escapeHTML(String(w.id))}" aria-label="${oT('ortho_target_remove_aria')}" title="${oT('ortho_target_remove_aria')}" style="border:none;background:none;cursor:pointer;color:var(--ink-soft);font-size:1rem;padding:2px 4px;line-height:1">✕</button>
      </span>`).join('');
    // délégation : un seul écouteur, pas d'onclick inline avec données
    // interpolées (voir audit v6.171)
    if(!el._targetWordsBound){
      el.addEventListener('click', async (e)=>{
        const btn = e.target.closest('button[data-word-id]');
        if(!btn) return;
        btn.disabled = true;
        const res = await Store.orthoDeleteWord(Number(btn.dataset.wordId));
        if(res && res.error){ btn.disabled = false; return; }
        await OrthoApp.refreshTargetWords();
      });
      el._targetWordsBound = true;
    }
  },

  async addTargetWord(){
    if(!currentPatient) return;
    const wordEl = document.getElementById('target-word-text');
    const emojiEl = document.getElementById('target-word-emoji');
    const statusEl = document.getElementById('target-word-status');
    const word = (wordEl.value || '').trim();
    if(!word) return;
    statusEl.style.color = '';
    const res = await Store.orthoAddWord(currentPatient.code, word, (emojiEl.value || '').trim());
    if(res && res.error){
      statusEl.style.color = 'var(--error)';
      statusEl.textContent = oT('ortho_target_err');
      return;
    }
    wordEl.value = ''; emojiEl.value = '';
    statusEl.textContent = oT('ortho_target_added');
    await OrthoApp.refreshTargetWords();
  },

  // v6.76 : extrait de openPatient() pour pouvoir être rappelé tel quel
  // à un changement de langue (refreshDetail ci-dessus), sans refaire
  // d'appels réseau — utilise les données déjà chargées.
  _renderPatientDetail(p, hist, errors){
    document.getElementById('d-name').textContent = p.name;
    document.getElementById('d-level').textContent = levelName(p.level);
    // v6.132 : niveau par type d'exercice — n'affiche la ligne que s'il
    // y a un vrai détail à montrer (migration appliquée, patient
    // ayant déjà pratiqué au moins un type). Sinon, rien de plus que
    // le niveau global déjà affiché ci-dessus, pour ne pas laisser une
    // ligne vide/trompeuse.
    const breakdownEl = document.getElementById('d-levels-breakdown');
    if(breakdownEl){
      const entries = Object.entries(p.levels || {});
      breakdownEl.textContent = entries.length
        ? entries.map(([type,lvl])=>`${oT('ex_'+type+'_t') || type} : ${levelName(lvl)}`).join(' · ')
        : '';
    }
    document.getElementById('d-sessions').textContent = p.sessions;
    document.getElementById('d-success').textContent = p.total? Math.round(100*p.correct/p.total)+'%':'—';
    document.getElementById('d-streak').textContent = p.streak;

    const dominant = AI.dominantDifficulty();
    const SHORT_LABELS = { semantic:oT('ortho_err_cat_semantic_short'), phonological:oT('ortho_err_cat_phonological_short'), syntax:oT('ortho_err_cat_syntax_short'), omission:oT('ortho_err_cat_omission_short') };
    const LONG_LABELS = { semantic:oT('ortho_err_cat_semantic_long'), phonological:oT('ortho_err_cat_phonological_long'), syntax:oT('ortho_err_cat_syntax_long'), omission:oT('ortho_err_cat_omission_long') };
    document.getElementById('d-dominant').textContent = dominant
      ? oT('ortho_dominant_category', LONG_LABELS[dominant.category] || dominant.label, dominant.count)
      : oT('ortho_not_enough_data');
    const top = AI.topErrors().filter(e=>e.count>0);
    const maxCount = Math.max(1, ...top.map(e=>e.count));
    document.getElementById('d-errors').innerHTML = top.length ? top.map(e=>`
      <div class="error-bar-row">
        <div>${escapeHTML(SHORT_LABELS[e.category] || e.category)}</div>
        <div class="error-bar-track"><div class="error-bar-fill ${escapeHTML(e.category)}" style="width:${Math.round(100*e.count/maxCount)}%"></div></div>
        <div>${e.count}</div>
      </div>`).join('') : `<p class="hint">${oT('ortho_no_error_logged')}</p>`;

    const rows = hist.slice(-15).reverse().map(s=>`
      <div class="history-row">
        <div>${escapeHTML(s.type)}</div>
        <div>${s.score}/${s.total}</div>
        <div>${new Date(s.at).toLocaleDateString(orthoDateLocale())}</div>
      </div>`).join('');
    document.getElementById('d-history').innerHTML = `
      <div class="history-row head"><div>${oT('ortho_exercise_col')}</div><div>${oT('ortho_score_col')}</div><div>${oT('ortho_date_col')}</div></div>
      ${rows || `<p class="hint">${oT('ortho_no_session_logged')}</p>`}`;

    const chartEl = document.getElementById('d-chart');
    if(chartEl && window.Charts) chartEl.innerHTML = Charts.successLine(hist);
    const trend = AI.trend(hist);

    // v6.191 ③ : le récit d'abord — généré localement, zéro appel IA.
    const storyEl = document.getElementById('patient-story');
    if(storyEl && currentPatient){
      const pct = currentPatient.total ? Math.round(100*currentPatient.correct/currentPatient.total) : null;
      const parts = [];
      parts.push(oT('ortho_story_main', { n: currentPatient.sessions||0, p: pct===null?'—':pct+'%', s: currentPatient.streak||0 }));
      if(trend && trend.direction==='hausse') parts.push(oT('ortho_story_up', trend.deltaPct));
      else if(trend && trend.direction==='baisse') parts.push(oT('ortho_story_down', trend.deltaPct));
      else if(trend && trend.direction==='stable') parts.push(oT('ortho_story_flat'));
      if(dominant) parts.push(oT('ortho_story_dominant', LONG_LABELS[dominant.category] || dominant.label));
      const lastAt = hist && hist.length ? hist[hist.length-1].at : null;
      if(lastAt) parts.push(oT('ortho_story_last', new Date(lastAt).toLocaleDateString(orthoDateLocale())));
      storyEl.textContent = '📖 ' + parts.join(' ');
    }

    // =================================================================
    //  v6.197 — LE DOSSIER CLINIQUE EN 5 VOLETS (zéro appel IA : tout
    //  est calculé localement depuis l'historique déjà chargé).
    // =================================================================
    try{
      const esc = (x)=>String(x).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
      const tLabel = (t)=>{ const v = oT('ex_'+t+'_t'); return (v && !String(v).startsWith('ex_')) ? v : t; };
      const dateStr = (at)=>new Date(at).toLocaleDateString(orthoDateLocale());
      const pctOf = (s)=>s.total ? Math.round(100*s.score/s.total) : 0;

      // ① Vue d'ensemble : temps de rééducation + fréquence hebdomadaire
      const timeEl = document.getElementById('d-time-freq');
      if(timeEl){
        const measured = hist.reduce((a,s)=>a+(Number(s.duration_sec)||0), 0);
        // séances sans durée (historique antérieur) : estimation 45 s/item
        const estim = hist.reduce((a,s)=>a+((Number(s.duration_sec)||0) ? 0 : (Number(s.total)||0)*45), 0)
          + Math.max(0, (Number(currentPatient.total)||0) - hist.reduce((a,s)=>a+(Number(s.total)||0),0)) * 45;
        const totalSec = measured + estim;
        const H = Math.floor(totalSec/3600), M = Math.round((totalSec%3600)/60);
        let freqTxt = '';
        if(hist.length >= 2){
          const spanDays = Math.max(1, (new Date(hist[hist.length-1].at) - new Date(hist[0].at)) / (24*3600*1000));
          freqTxt = ' · ' + oT('fiche_freq', String(Math.round(10 * hist.length / (spanDays/7)) / 10));
        }
        timeEl.textContent = '⏱️ ' + oT('fiche_time', { h:H, m:M, est: estim > 0 }) + freqTxt;
      }

      // ② Évolution des capacités : barres de réussite par domaine
      const byType = {};
      hist.forEach(s=>{ (byType[s.type] = byType[s.type] || []).push(s); });
      const domEl = document.getElementById('d-domain-bars');
      if(domEl){
        const rows = Object.entries(byType)
          .map(([t, ss])=>({ t, n:ss.length, p: Math.round(ss.reduce((a,s)=>a+pctOf(s),0)/ss.length) }))
          .sort((a,b)=>b.p-a.p);
        domEl.innerHTML = rows.map(r=>`
          <div style="display:flex;align-items:center;gap:10px;margin:6px 0">
            <div style="flex:0 0 220px;font-size:.88rem">${esc(tLabel(r.t))} <span style="color:var(--ink-soft)">(×${r.n})</span></div>
            <div style="flex:1;background:var(--surface-soft);border-radius:8px;height:14px;overflow:hidden"><div style="width:${r.p}%;height:100%;background:var(--accent)"></div></div>
            <div style="flex:0 0 44px;text-align:end;font-weight:700">${r.p}%</div>
          </div>`).join('') || '';
      }

      // ③ Événements : pauses, records, premières fois — depuis les données
      const evEl = document.getElementById('d-events');
      if(evEl){
        const events = [];
        const seenTypes = new Set();
        let best = null;
        hist.forEach((s, i)=>{
          if(i > 0){
            const gap = Math.round((new Date(s.at) - new Date(hist[i-1].at)) / (24*3600*1000));
            if(gap > 7) events.push({ at:s.at, txt:'⏸️ ' + oT('event_gap', String(gap)) });
          }
          if(!seenTypes.has(s.type)){ seenTypes.add(s.type); events.push({ at:s.at, txt:'🌱 ' + oT('event_first', tLabel(s.type)) }); }
          const p = pctOf(s);
          if(p >= 80 && (!best || p > best.p)){ best = { at:s.at, p }; }
        });
        if(best) events.push({ at:best.at, txt:'🏆 ' + oT('event_record', String(best.p)) });
        events.sort((a,b)=>new Date(b.at)-new Date(a.at));
        evEl.innerHTML = events.slice(0, 8).map(e=>`<div style="margin:6px 0"><span style="color:var(--ink-soft)">${esc(dateStr(e.at))}</span> — ${esc(e.txt)}</div>`).join('')
          || `<p class="hint">${esc(oT('events_empty'))}</p>`;
      }

      // Volets ④ Journal d'Ami et ⑤ Recommandations : générés par l'IA
      //     À LA DEMANDE (boutons dédiés, plafonnés, à valider par
      //     l'ortho — décision du propriétaire v6.197). Le rendu se fait
      //     dans genAmiJournal()/genClinicalReco() ci-dessous, pas ici :
      //     on n'appelle jamais l'IA au simple affichage de la fiche.
    }catch(e){ console.warn('volets cliniques :', e); }
    const trendEl = document.getElementById('d-trend');
    if(trendEl){
      trendEl.textContent = trend.direction==='hausse' ? oT('ortho_trend_up', trend.deltaPct)
        : trend.direction==='baisse' ? oT('ortho_trend_down', trend.deltaPct)
        : trend.direction==='stable' ? oT('ortho_trend_stable')
        : oT('ortho_trend_not_enough');
    }
    // v6.131 : signal de plateau (niveau inchangé sur plusieurs séances),
    // distinct de la tendance de score ci-dessus — voir js/learner.js.
    const plateau = AI.plateauSignal(hist);
    const plateauEl = document.getElementById('d-plateau');
    if(plateauEl){
      if(plateau.onPlateau){
        plateauEl.style.display = '';
        plateauEl.textContent = oT('ortho_plateau_signal', levelName(plateau.level), plateau.sessionsAtLevel);
      } else {
        plateauEl.style.display = 'none';
      }
    }
  },

  async saveClinicalProfile(){
    if(!currentPatient) return;
    const val = document.getElementById('d-clinical').value;
    await Store.updateClinicalProfile(currentPatient.code, val);
  },

  async refreshNotes(){
    if(!currentPatient) return;
    const notes = await Store.listNotes(currentPatient.code);
    const el = document.getElementById('d-notes');
    // v6.142 : trouvé en auditant — échappement partiel (juste "<",
    // ni "&" ni ">" ni '"') alors que le reste de l'app utilise
    // systématiquement escapeHTML() (voir js/app.js, notamment pour
    // ce même contenu côté patient, déjà correctement échappé).
    // Risque réel limité (la note vient d'un compte orthophoniste
    // authentifié), mais incohérent — corrigé par cohérence et
    // défense en profondeur, ces notes pouvant aussi être visibles
    // côté patient (visible_to_patient).
    el.innerHTML = notes.length ? notes.map(n=>`
      <div class="history-row" style="grid-template-columns:1fr auto">
        <div>
          ${n.visible_to_patient ? `<span class="pro-tag" style="background:var(--accent);margin-right:6px">${oT('ortho_note_visible_badge')}</span>` : ''}
          ${escapeHTML(n.content||'')}
        </div>
        <div>${new Date(n.created_at).toLocaleDateString(orthoDateLocale())}</div>
      </div>`).join('') : `<p class="hint">${oT('ortho_no_note_yet')}</p>`;
  },
  async addNote(){
    if(!currentPatient) return;
    const ta = document.getElementById('new-note');
    const visibleCheckbox = document.getElementById('new-note-visible');
    const content = ta.value.trim();
    if(!content) return;
    await Store.addNote(currentPatient.code, orthoCode, content, visibleCheckbox && visibleCheckbox.checked);
    ta.value='';
    if(visibleCheckbox) visibleCheckbox.checked = false;
    await OrthoApp.refreshNotes();
  },

  exportCSV(kind){
    if(!currentPatient) return;
    // v6.230 : colonnes en français, dates lisibles, taux de réussite
    // calculé — le fichier doit être compréhensible sans documentation.
    const dateFR = v => {
      if(!v) return '';
      const d = new Date(v);
      if(isNaN(d)) return String(v);
      const p = n => String(n).padStart(2,'0');
      return `${p(d.getDate())}/${p(d.getMonth()+1)}/${d.getFullYear()} ${p(d.getHours())}:${p(d.getMinutes())}`;
    };
    const CATS = { semantic:'Sémantique (sens proche)', phonological:'Phonologique (son proche)',
                   syntax:'Syntaxe', omission:'Omission (pas de réponse)' };
    let csv, filename;
    if(kind==='sessions'){
      csv = Store.toCSV(currentHistory, ['at','type','score','total','pct','level'], {
        labels:{ at:'Date', type:"Type d'exercice", score:'Réponses justes',
                 total:'Questions posées', pct:'Réussite (%)', level:'Niveau' },
        format:{ at:dateFR,
                 pct:(_v,r)=> r.total ? Math.round((Number(r.score)/Number(r.total))*100) : '' }
      });
      filename = `reparole-seances-${currentPatient.code}.csv`;
    } else {
      csv = Store.toCSV(currentErrors, ['at','exercise','category','target','given','level'], {
        labels:{ at:'Date', exercise:'Exercice', category:"Type d'erreur",
                 target:'Attendu', given:'Réponse donnée', level:'Niveau' },
        format:{ at:dateFR, category:v => CATS[v] || v || '' }
      });
      filename = `reparole-erreurs-${currentPatient.code}.csv`;
    }
    const blob = new Blob([csv], { type:'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename; document.body.appendChild(a); a.click();
    document.body.removeChild(a); URL.revokeObjectURL(url);
  },

  // v6.194 : le brouillon IA s'imprime (→ PDF via le navigateur, comme
  //  le rapport standard). On imprime le contenu ACTUEL du textarea —
  //  donc la version RELUE ET CORRIGÉE par l'orthophoniste, pas la
  //  sortie brute de l'IA. Le disclaimer reste imprimé en pied de page.
  printAIDraft(){
    const text = document.getElementById('ai-draft-text').value;
    if(!text.trim()) return;
    const name = currentPatient ? currentPatient.name : '';
    const w = window.open('', '_blank');
    if(!w) return;
    const esc = s => String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
    w.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>${esc(oT('ortho_ai_draft_print_title'))} — ${esc(name)}</title>
      <style>
        body{font-family:Georgia, 'Times New Roman', serif; color:#1c2b25; max-width:760px; margin:40px auto; padding:0 24px; line-height:1.55}
        h1{font-size:1.25rem; border-bottom:2px solid #2f8a7c; padding-bottom:8px}
        .meta{color:#5a6b63; font-size:.9rem; margin-bottom:24px}
        pre{white-space:pre-wrap; font-family:inherit; font-size:1rem}
        .foot{margin-top:32px; padding-top:12px; border-top:1px solid #c8d6cf; color:#5a6b63; font-size:.85rem; font-style:italic}
        @media print{ body{margin:10mm auto} }
      </style></head><body>
      <h1>${esc(oT('ortho_ai_draft_print_title'))}</h1>
      <div class="meta">${esc(name)} — ${esc(new Date().toLocaleDateString(orthoDateLocale()))}</div>
      <pre>${esc(text)}</pre>
      <div class="foot">${esc(oT('ortho_ai_draft_disclaimer'))}</div>
      </body></html>`);
    w.document.close();
    w.focus();
    setTimeout(()=>{ try{ w.print(); }catch(e){} }, 250);
  },

  // v6.197 : volet 4 — Journal de bord IA (à la demande, à valider)
  async genAmiJournal(){
    if(!currentPatient) return;
    const st = document.getElementById('ami-journal-status');
    const out = document.getElementById('d-ami-journal');
    const btn = document.getElementById('ami-journal-btn');
    const copy = document.getElementById('ami-journal-copy');
    if(!OrthoApp.iaAllowed()){ st.style.color=''; st.textContent = oT('ortho_ai_draft_pro_hint'); return; }
    btn.disabled = true; st.style.color=''; st.textContent = oT('ortho_ai_draft_generating');
    const res = await Store.orthoAmiJournal(currentPatient.code, (window.Prefs && Prefs.data && Prefs.data.lang) || 'fr');
    btn.disabled = false;
    if(res.error){ st.style.color='var(--error)'; st.textContent = res.error === 'indisponible' ? oT('ortho_ai_draft_unavailable') : oT('ortho_ai_draft_error'); return; }
    st.textContent = ''; out.textContent = res.text; if(copy) copy.style.display = '';
  },

  // v6.197 : volet 5 — Pistes d'action IA (à la demande, non-décisionnaires)
  async genClinicalReco(){
    if(!currentPatient) return;
    const st = document.getElementById('reco-status');
    const out = document.getElementById('d-reco');
    const btn = document.getElementById('reco-btn');
    const copy = document.getElementById('reco-copy');
    if(!OrthoApp.iaAllowed()){ st.style.color=''; st.textContent = oT('ortho_ai_draft_pro_hint'); return; }
    btn.disabled = true; st.style.color=''; st.textContent = oT('ortho_ai_draft_generating');
    const res = await Store.orthoClinicalReco(currentPatient.code, (window.Prefs && Prefs.data && Prefs.data.lang) || 'fr');
    btn.disabled = false;
    if(res.error){ st.style.color='var(--error)'; st.textContent = res.error === 'indisponible' ? oT('ortho_ai_draft_unavailable') : oT('ortho_ai_draft_error'); return; }
    st.textContent = ''; out.textContent = res.text; if(copy) copy.style.display = '';
  },

    // v6.194 : copie générique d'une zone de sortie IA (veille, cabinet)
  async copyText(outId, statusId){
    const out = document.getElementById(outId);
    const statusEl = document.getElementById(statusId);
    if(!out || !out.textContent.trim()) return;
    try{
      await navigator.clipboard.writeText(out.textContent);
      if(statusEl){ statusEl.style.color=''; statusEl.textContent = oT('ortho_ai_draft_copied'); }
    }catch(e){ /* presse-papiers indisponible : pas de casse */ }
  },

  openReport(){
    if(!currentPatient) return;
    const url = `report.html?code=${encodeURIComponent(currentPatient.code)}&ortho=${encodeURIComponent(orthoCode)}`;
    window.open(url, '_blank');
  }
};

window.OrthoApp = OrthoApp;
document.addEventListener('DOMContentLoaded', OrthoApp.init);

// =====================================================================
//  v6.207 — Tarifs dynamiques : si l'admin a enregistré des tarifs dans
//  « Paiement & tarifs » (table app_settings), on les affiche à la place
//  des montants par défaut. Jamais bloquant : en cas d'absence/erreur,
//  les montants d'origine restent.
// =====================================================================
(function(){
  function sym(c){ return ({EUR:'€',USD:'$',GBP:'£',CHF:'CHF'})[c] || '€'; }
  function fmt(n,c){
    try{ return n.toLocaleString('fr-FR',{minimumFractionDigits:(n%1?2:0),maximumFractionDigits:2})+' '+sym(c); }
    catch(e){ return n+' '+sym(c); }
  }
  async function applyBillingPrices(){
    try{
      if(typeof ReParoleStore==='undefined' || !ReParoleStore.getBillingSettings) return;
      const st = await ReParoleStore.getBillingSettings();
      if(!st) return;
      const m=document.getElementById('ortho-price-monthly');
      const a=document.getElementById('ortho-price-annual');
      if(m && st.orthoMonthly) m.textContent = fmt(st.orthoMonthly, st.currency);
      if(a && st.orthoAnnual)  a.textContent = fmt(st.orthoAnnual, st.currency);
    }catch(e){ /* silencieux */ }
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded', applyBillingPrices);
  else applyBillingPrices();
})();
