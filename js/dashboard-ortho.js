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
// =====================================================================
const Store = window.ReParoleStore;
const AI = window.Learner;
// v6.26 : réutilise les clés déjà traduites côté patient (level_1/2/3)
// plutôt qu'une table figée en français — évite de dupliquer la
// traduction des niveaux à deux endroits différents.
function levelName(n){ return (window.I18N && I18N.t('level_'+n)) || n; }
function dateLocale(){ return (window.I18N && I18N.speechLocale()) || 'fr-FR'; }

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

function show(id){ document.querySelectorAll('.screen').forEach(s=>s.classList.remove('active')); document.getElementById(id).classList.add('active'); window.scrollTo(0,0); }

const OrthoApp = {
  async init(){
    if(Store.mode()!=='cloud'){
      document.getElementById('cloud-warning').style.display='block';
      return;
    }
    const sel = document.getElementById('d-clinical');
    if(sel && window.CLINICAL_PROFILES){
      sel.innerHTML = Object.entries(window.CLINICAL_PROFILES)
        .map(([key,v])=>`<option value="${key}">${(window.I18N && I18N.t('cp_'+key)) || v.label}</option>`).join('');
    }
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

  toggleAuthMode(){
    authMode = authMode==='signin' ? 'signup' : 'signin';
    document.getElementById('o-name-field').style.display = authMode==='signup' ? '' : 'none';
    document.getElementById('o-submit').textContent = authMode==='signup' ? I18N.t('ortho_btn_signup') : I18N.t('ortho_btn_signin');
    document.getElementById('o-submit').setAttribute('onclick', authMode==='signup' ? 'OrthoApp.signUp()' : 'OrthoApp.signIn()');
    document.getElementById('ortho-toggle-text').textContent = authMode==='signup' ? I18N.t('ortho_toggle_has_account') : I18N.t('ortho_toggle_no_account');
    document.getElementById('ortho-toggle-link').textContent = authMode==='signup' ? I18N.t('ortho_btn_signin') : I18N.t('ortho_create_account');
    document.getElementById('ortho-auth-error').textContent='';
  },

  async signUp(){
    const name = document.getElementById('o-name').value.trim();
    const email = document.getElementById('o-email').value.trim();
    const password = document.getElementById('o-password').value;
    const errEl = document.getElementById('ortho-auth-error');
    if(!name || !email || !password){ errEl.textContent=I18N.t('err_fill_all_fields'); return; }
    // v6.24 : mot de passe renforcé — 8 caractères minimum ne suffisait
    // pas pour un compte donnant accès à des données de patients.
    const pwCheck = OrthoApp._checkPasswordStrength(password);
    if(pwCheck){ errEl.textContent = pwCheck; return; }
    const res = await Store.signUpOrtho(email, password, name);
    if(res.error){ errEl.textContent = I18N.t('err_generic_prefix') + res.error.message; return; }
    if(res.needsEmailConfirmation){
      errEl.style.color='var(--accent-dark)';
      errEl.textContent = I18N.t('ortho_account_created_msg');
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
    if(password.length<8) return I18N.t('pw_too_short');
    if(!/[a-z]/.test(password)) return I18N.t('pw_need_lower');
    if(!/[A-Z]/.test(password)) return I18N.t('pw_need_upper');
    if(!/[0-9]/.test(password)) return I18N.t('pw_need_digit');
    return null;
  },

  async signIn(){
    const email = document.getElementById('o-email').value.trim();
    const password = document.getElementById('o-password').value;
    const errEl = document.getElementById('ortho-auth-error');
    if(!email || !password){ errEl.textContent=I18N.t('err_fill_email_password'); return; }
    errEl.style.color='var(--error)'; errEl.textContent='';
    const res = await Store.signInOrtho(email, password);
    if(res.error){ errEl.textContent = I18N.t('err_login_failed_prefix') + res.error.message; return; }
    await OrthoApp._handleSignInResult(res);
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
    if(!/^\d{6}$/.test(code)){ errEl.textContent = I18N.t('err_enter_6_digits'); return; }
    const pending = OrthoApp._pendingMfa;
    if(!pending){ errEl.textContent = I18N.t('err_session_expired'); show('ortho-login'); return; }
    const res = await Store.completeMfaSignIn(pending.factorId, pending.challengeId, code);
    if(res.error){ errEl.textContent = I18N.t('err_code_invalid_expired'); return; }
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
    if(res.error){ statusEl.textContent = I18N.t('err_cannot_verify_offline'); return; }
    const verified = (res.data.totp || []).filter(f => f.status==='verified');
    if(verified.length){
      statusEl.textContent = I18N.t('mfa_status_active');
      step1.style.display = 'none';
      step2.style.display = 'none';
      disableBtn.style.display = '';
    } else {
      statusEl.textContent = I18N.t('mfa_status_inactive');
      step1.style.display = '';
      step2.style.display = 'none';
      disableBtn.style.display = 'none';
    }
  },

  async startMfaEnroll(){
    const msg = document.getElementById('mfa-enroll-msg');
    msg.textContent = '';
    const res = await Store.mfaEnroll();
    if(res.error){ msg.textContent = I18N.t('err_generic_prefix') + res.error.message; return; }
    OrthoApp._enrollFactorId = res.data.id;
    document.getElementById('mfa-qr').innerHTML = res.data.totp.qr_code;
    document.getElementById('mfa-secret').textContent = res.data.totp.secret;
    document.getElementById('mfa-enroll-step1').style.display = 'none';
    document.getElementById('mfa-enroll-step2').style.display = '';
  },

  async confirmMfaEnroll(){
    const code = document.getElementById('mfa-confirm-code').value.trim();
    const msg = document.getElementById('mfa-enroll-msg');
    if(!/^\d{6}$/.test(code)){ msg.textContent = I18N.t('err_enter_6_digits_app'); return; }
    const factorId = OrthoApp._enrollFactorId;
    if(!factorId){ msg.textContent = I18N.t('err_restart_from_start'); return; }
    const chRes = await Store.mfaChallenge(factorId);
    if(chRes.error){ msg.textContent = I18N.t('err_generic_prefix') + chRes.error.message; return; }
    const vRes = await Store.mfaVerify(factorId, chRes.data.id, code);
    if(vRes.error){ msg.textContent = I18N.t('err_code_invalid_retry'); return; }
    msg.textContent = I18N.t('mfa_enabled_msg');
    document.getElementById('mfa-confirm-code').value = '';
    await OrthoApp.refreshMfaStatus();
  },

  async disableMfa(){
    const msg = document.getElementById('mfa-enroll-msg');
    if(!confirm(I18N.t('mfa_disable_confirm'))) return;
    const res = await Store.mfaListFactors();
    if(res.error){ msg.textContent = I18N.t('err_generic_prefix') + res.error.message; return; }
    for(const f of (res.data.totp || [])){
      await Store.mfaUnenroll(f.id);
    }
    msg.textContent = I18N.t('mfa_disabled_msg');
    await OrthoApp.refreshMfaStatus();
  },

  async assign(){
    const code = document.getElementById('assign-code').value.trim();
    const msg = document.getElementById('assign-msg');
    if(!code){ return; }
    // v6.24 : structure gratuit/pro — limite le nombre de patients
    // suivis simultanément en compte gratuit. Pas de paiement branché :
    // le passage en 'pro' se fait à la main dans Supabase pour l'instant
    // (voir sql/schema.sql).
    if(orthoPlan!=='pro' && patients.length>=ORTHO_FREE_PATIENT_LIMIT){
      msg.textContent = I18N.t('ortho_limit_msg', ORTHO_FREE_PATIENT_LIMIT);
      return;
    }
    const res = await Store.assignPatient(orthoCode, code);
    if(res.error){ msg.textContent = res.error.message; return; }
    msg.textContent = I18N.t('ortho_assign_success', res.name);
    document.getElementById('assign-code').value='';
    await OrthoApp.refreshList();
  },

  async refreshList(){
    const listEl = document.getElementById('patient-list');
    patients = await Store.listPatients(orthoCode);
    if(!patients.length){ listEl.innerHTML = `<p class="hint">${I18N.t('ortho_no_patients')}</p>`; return; }

    // v6 : tri pour une vue d'ensemble multi-patients utile
    const sortBy = document.getElementById('sort-patients')?.value || 'inactivity';
    const daysSince = p => p.last_seen ? (Date.now()-new Date(p.last_seen).getTime())/86400000 : 9999;
    const successRate = p => p.total ? p.correct/p.total : -1;
    const sorted = [...patients].sort((a,b)=>{
      if(sortBy==='inactivity') return daysSince(b)-daysSince(a);
      if(sortBy==='success_asc') return successRate(a)-successRate(b);
      if(sortBy==='success_desc') return successRate(b)-successRate(a);
      return (a.name||'').localeCompare(b.name||'');
    });

    listEl.innerHTML = sorted.map(p=>{
      const stale = daysSince(p) > 7;
      return `
      <div class="patient-row" onclick="OrthoApp.openPatient('${p.code}')">
        <div>
          <div class="p-name">${stale?'🔴 ':''}${p.name}</div>
          <div class="p-meta">${I18N.t('ortho_level_word')} ${levelName(p.level)} · ${I18N.t('ortho_sessions_word', p.sessions)} · ${I18N.t('ortho_last_visit', p.last_seen ? new Date(p.last_seen).toLocaleDateString(dateLocale()) : '—')}</div>
        </div>
        <div class="p-meta">${p.total? I18N.t('ortho_success_pct', Math.round(100*p.correct/p.total)):'—'}</div>
      </div>`;
    }).join('');
  },

  backToList(){ show('ortho-list'); },

  async openPatient(code){
    const p = await Store.loadPatient(code);
    if(!p){ alert(I18N.t('ortho_file_not_found')); return; }
    currentPatient = { code, ...p };

    document.getElementById('d-name').textContent = p.name;
    document.getElementById('d-level').textContent = levelName(p.level);
    document.getElementById('d-sessions').textContent = p.sessions;
    document.getElementById('d-success').textContent = p.total? Math.round(100*p.correct/p.total)+'%':'—';
    document.getElementById('d-streak').textContent = p.streak;
    const clinicalSel = document.getElementById('d-clinical');
    if(clinicalSel) clinicalSel.value = p.clinical_profile || 'none';

    const profile = await Store.loadProfile(code);
    AI.load(profile);
    const dominant = AI.dominantDifficulty();
    document.getElementById('d-dominant').textContent = dominant
      ? I18N.t('ortho_dominant_category', dominant.label, dominant.count)
      : I18N.t('ortho_no_trend_data');
    const top = AI.topErrors().filter(e=>e.count>0);
    const maxCount = Math.max(1, ...top.map(e=>e.count));
    const SHORT_LABELS = { semantic:I18N.t('err_cat_semantic'), phonological:I18N.t('err_cat_phonological'), syntax:I18N.t('err_cat_syntax'), omission:I18N.t('err_cat_omission') };
    document.getElementById('d-errors').innerHTML = top.length ? top.map(e=>`
      <div class="error-bar-row">
        <div>${SHORT_LABELS[e.category] || e.category}</div>
        <div class="error-bar-track"><div class="error-bar-fill ${e.category}" style="width:${Math.round(100*e.count/maxCount)}%"></div></div>
        <div>${e.count}</div>
      </div>`).join('') : `<p class="hint">${I18N.t('ortho_no_errors_logged')}</p>`;

    const hist = await Store.history(code);
    currentHistory = hist;
    const rows = hist.slice(-15).reverse().map(s=>`
      <div class="history-row">
        <div>${s.type}</div>
        <div>${s.score}/${s.total}</div>
        <div>${new Date(s.at).toLocaleDateString(dateLocale())}</div>
      </div>`).join('');
    document.getElementById('d-history').innerHTML = `
      <div class="history-row head"><div>${I18N.t('table_exercise')}</div><div>${I18N.t('table_score')}</div><div>${I18N.t('table_date')}</div></div>
      ${rows || `<p class="hint">${I18N.t('ortho_no_sessions_logged')}</p>`}`;

    const chartEl = document.getElementById('d-chart');
    if(chartEl && window.Charts) chartEl.innerHTML = Charts.successLine(hist);
    const trend = AI.trend(hist);
    const trendEl = document.getElementById('d-trend');
    if(trendEl){
      trendEl.textContent = trend.direction==='hausse' ? I18N.t('trend_up', trend.deltaPct)
        : trend.direction==='baisse' ? I18N.t('trend_down', trend.deltaPct)
        : trend.direction==='stable' ? I18N.t('trend_stable')
        : I18N.t('ortho_no_trend_data');
    }

    const media = await Store.listMedia(code);
    document.getElementById('d-media').innerHTML = media.length ? media.map(m=>`
      <div class="media-item"><img src="${m.url}" alt="${m.label}"><div class="m-label">${m.label}</div></div>
    `).join('') : `<p class="media-empty">${I18N.t('ortho_no_patient_photo')}</p>`;

    const reports = await Store.listReports(code);
    document.getElementById('d-reports').textContent = reports.length
      ? I18N.t('ortho_reports_generated', reports.length, new Date(reports[0].generated_at).toLocaleDateString(dateLocale()))
      : '';

    currentErrors = await Store.errorHistory(code);
    await OrthoApp.refreshNotes();

    show('ortho-detail');
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
    el.innerHTML = notes.length ? notes.map(n=>`
      <div class="history-row" style="grid-template-columns:1fr auto">
        <div>${(n.content||'').replace(/</g,'&lt;')}</div>
        <div>${new Date(n.created_at).toLocaleDateString(dateLocale())}</div>
      </div>`).join('') : `<p class="hint">${I18N.t('ortho_no_notes')}</p>`;
  },
  async addNote(){
    if(!currentPatient) return;
    const ta = document.getElementById('new-note');
    const content = ta.value.trim();
    if(!content) return;
    await Store.addNote(currentPatient.code, orthoCode, content);
    ta.value='';
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

// v6.26 : même piège que côté patient (v6.25) — Prefs.apply() ne
// retouche que le DOM marqué data-i18n. Tout ce que ce fichier écrit
// directement en JS (accueil, statut MFA, liste de patients, détail
// patient...) doit être re-rendu explicitement après un changement de
// langue, sinon ça reste figé dans l'ancienne langue jusqu'à la
// prochaine navigation. Voir js/app.js pour le même mécanisme côté
// patient.
function onLangChange(){
  const activeScreen = document.querySelector('.screen.active');
  if(!activeScreen) return;
  if(activeScreen.id==='ortho-list'){ OrthoApp.refreshList(); OrthoApp.refreshMfaStatus(); }
  else if(activeScreen.id==='ortho-detail' && currentPatient){ OrthoApp.openPatient(currentPatient.code); }
}

window.OrthoApp = OrthoApp;
window.onLangChange = onLangChange;
document.addEventListener('DOMContentLoaded', OrthoApp.init);
