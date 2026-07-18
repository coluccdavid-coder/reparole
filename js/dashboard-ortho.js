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
    await OrthoApp.refreshVoiceRecordings();

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
    if(orthoPlan !== 'pro'){
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

  // v6.174 : boucle vocale — écoute des productions réelles + verdict.
  // Purge de rétention opportuniste au passage (best effort, pg_cron
  // reste la vraie planification si disponible).
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
    let csv, filename;
    if(kind==='sessions'){
      csv = Store.toCSV(currentHistory, ['type','score','total','level','at']);
      filename = `reparole-seances-${currentPatient.code}.csv`;
    } else {
      csv = Store.toCSV(currentErrors, ['exercise','category','target','given','level','at']);
      filename = `reparole-erreurs-${currentPatient.code}.csv`;
    }
    const blob = new Blob([csv], { type:'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename; document.body.appendChild(a); a.click();
    document.body.removeChild(a); URL.revokeObjectURL(url);
  },

  openReport(){
    if(!currentPatient) return;
    const url = `report.html?code=${encodeURIComponent(currentPatient.code)}&ortho=${encodeURIComponent(orthoCode)}`;
    window.open(url, '_blank');
  }
};

window.OrthoApp = OrthoApp;
document.addEventListener('DOMContentLoaded', OrthoApp.init);
