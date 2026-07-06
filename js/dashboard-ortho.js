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
const LEVEL_NAMES = {1:'Doux',2:'Intermédiaire',3:'Avancé'};

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
        .map(([key,v])=>`<option value="${key}">${v.label}</option>`).join('');
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
    document.getElementById('o-submit').textContent = authMode==='signup' ? 'Créer mon compte' : 'Se connecter';
    document.getElementById('o-submit').setAttribute('onclick', authMode==='signup' ? 'OrthoApp.signUp()' : 'OrthoApp.signIn()');
    document.getElementById('ortho-toggle-text').textContent = authMode==='signup' ? 'Déjà un compte ?' : 'Pas encore de compte ?';
    document.getElementById('ortho-toggle-link').textContent = authMode==='signup' ? 'Se connecter' : 'Créer un compte';
    document.getElementById('ortho-auth-error').textContent='';
  },

  async signUp(){
    const name = document.getElementById('o-name').value.trim();
    const email = document.getElementById('o-email').value.trim();
    const password = document.getElementById('o-password').value;
    const errEl = document.getElementById('ortho-auth-error');
    if(!name || !email || !password){ errEl.textContent='Merci de remplir tous les champs.'; return; }
    // v6.24 : mot de passe renforcé — 8 caractères minimum ne suffisait
    // pas pour un compte donnant accès à des données de patients.
    const pwCheck = OrthoApp._checkPasswordStrength(password);
    if(pwCheck){ errEl.textContent = pwCheck; return; }
    const res = await Store.signUpOrtho(email, password, name);
    if(res.error){ errEl.textContent = 'Erreur : ' + res.error.message; return; }
    if(res.needsEmailConfirmation){
      errEl.style.color='var(--accent-dark)';
      errEl.textContent = 'Compte créé ! Vérifiez votre email pour confirmer votre adresse, puis connectez-vous.';
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
    if(password.length<8) return 'Le mot de passe doit faire au moins 8 caractères.';
    if(!/[a-z]/.test(password)) return 'Le mot de passe doit contenir au moins une minuscule.';
    if(!/[A-Z]/.test(password)) return 'Le mot de passe doit contenir au moins une majuscule.';
    if(!/[0-9]/.test(password)) return 'Le mot de passe doit contenir au moins un chiffre.';
    return null;
  },

  async signIn(){
    const email = document.getElementById('o-email').value.trim();
    const password = document.getElementById('o-password').value;
    const errEl = document.getElementById('ortho-auth-error');
    if(!email || !password){ errEl.textContent='Merci de saisir votre email et votre mot de passe.'; return; }
    errEl.style.color='var(--error)'; errEl.textContent='';
    const res = await Store.signInOrtho(email, password);
    if(res.error){ errEl.textContent = 'Connexion impossible : ' + res.error.message; return; }
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
    if(!/^\d{6}$/.test(code)){ errEl.textContent = 'Entrez les 6 chiffres du code.'; return; }
    const pending = OrthoApp._pendingMfa;
    if(!pending){ errEl.textContent = 'Session expirée, reconnectez-vous.'; show('ortho-login'); return; }
    const res = await Store.completeMfaSignIn(pending.factorId, pending.challengeId, code);
    if(res.error){ errEl.textContent = 'Code invalide ou expiré. Réessayez.'; return; }
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
    if(res.error){ statusEl.textContent = 'Impossible de vérifier (hors-ligne ?)'; return; }
    const verified = (res.data.totp || []).filter(f => f.status==='verified');
    if(verified.length){
      statusEl.textContent = 'Activée ✅';
      step1.style.display = 'none';
      step2.style.display = 'none';
      disableBtn.style.display = '';
    } else {
      statusEl.textContent = 'Non activée';
      step1.style.display = '';
      step2.style.display = 'none';
      disableBtn.style.display = 'none';
    }
  },

  async startMfaEnroll(){
    const msg = document.getElementById('mfa-enroll-msg');
    msg.textContent = '';
    const res = await Store.mfaEnroll();
    if(res.error){ msg.textContent = 'Erreur : ' + res.error.message; return; }
    OrthoApp._enrollFactorId = res.data.id;
    document.getElementById('mfa-qr').innerHTML = res.data.totp.qr_code;
    document.getElementById('mfa-secret').textContent = res.data.totp.secret;
    document.getElementById('mfa-enroll-step1').style.display = 'none';
    document.getElementById('mfa-enroll-step2').style.display = '';
  },

  async confirmMfaEnroll(){
    const code = document.getElementById('mfa-confirm-code').value.trim();
    const msg = document.getElementById('mfa-enroll-msg');
    if(!/^\d{6}$/.test(code)){ msg.textContent = 'Entrez les 6 chiffres du code affiché par votre application.'; return; }
    const factorId = OrthoApp._enrollFactorId;
    if(!factorId){ msg.textContent = 'Recommencez depuis le début.'; return; }
    const chRes = await Store.mfaChallenge(factorId);
    if(chRes.error){ msg.textContent = 'Erreur : ' + chRes.error.message; return; }
    const vRes = await Store.mfaVerify(factorId, chRes.data.id, code);
    if(vRes.error){ msg.textContent = 'Code invalide, réessayez.'; return; }
    msg.textContent = '✅ Double authentification activée.';
    document.getElementById('mfa-confirm-code').value = '';
    await OrthoApp.refreshMfaStatus();
  },

  async disableMfa(){
    const msg = document.getElementById('mfa-enroll-msg');
    if(!confirm('Désactiver la double authentification ? Votre compte sera protégé uniquement par le mot de passe.')) return;
    const res = await Store.mfaListFactors();
    if(res.error){ msg.textContent = 'Erreur : ' + res.error.message; return; }
    for(const f of (res.data.totp || [])){
      await Store.mfaUnenroll(f.id);
    }
    msg.textContent = 'Double authentification désactivée.';
    await OrthoApp.refreshMfaStatus();
  },

  // v6.26 : paiement Stripe côté orthophoniste
  async startCheckout(planKey){
    const errEl = document.getElementById('ortho-pricing-error');
    errEl.textContent = 'Redirection vers le paiement…';
    const res = await Store.createCheckoutSession(planKey, orthoCode, 'ortho');
    if(res.error){ errEl.textContent = 'Une erreur est survenue. Réessayez, ou contactez-nous si ça persiste.'; return; }
    window.location.href = res.url;
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
      msg.textContent = `Limite du compte gratuit atteinte (${ORTHO_FREE_PATIENT_LIMIT} patients). Passez au compte Pro pour suivre plus de patients.`;
      return;
    }
    const res = await Store.assignPatient(orthoCode, code);
    if(res.error){ msg.textContent = res.error.message; return; }
    msg.textContent = `Patient rattaché ✅ (${res.name})`;
    document.getElementById('assign-code').value='';
    await OrthoApp.refreshList();
  },

  async refreshList(){
    const listEl = document.getElementById('patient-list');
    const teaser = document.getElementById('ortho-pro-teaser-card');
    if(teaser) teaser.style.display = orthoPlan==='pro' ? 'none' : '';
    patients = await Store.listPatients(orthoCode);
    if(!patients.length){ listEl.innerHTML = `<p class="hint">Aucun patient rattaché pour l'instant.</p>`; return; }

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
          <div class="p-meta">Niveau ${LEVEL_NAMES[p.level]||p.level} · ${p.sessions} séance(s) · dernière visite ${p.last_seen ? new Date(p.last_seen).toLocaleDateString('fr-FR') : '—'}</div>
        </div>
        <div class="p-meta">${p.total? Math.round(100*p.correct/p.total)+'% réussite':'—'}</div>
      </div>`;
    }).join('');
  },

  backToList(){ show('ortho-list'); },

  async openPatient(code){
    const p = await Store.loadPatient(code);
    if(!p){ alert('Dossier introuvable.'); return; }
    currentPatient = { code, ...p };

    document.getElementById('d-name').textContent = p.name;
    document.getElementById('d-level').textContent = LEVEL_NAMES[p.level]||p.level;
    document.getElementById('d-sessions').textContent = p.sessions;
    document.getElementById('d-success').textContent = p.total? Math.round(100*p.correct/p.total)+'%':'—';
    document.getElementById('d-streak').textContent = p.streak;
    const clinicalSel = document.getElementById('d-clinical');
    if(clinicalSel) clinicalSel.value = p.clinical_profile || 'none';

    const profile = await Store.loadProfile(code);
    AI.load(profile);
    const dominant = AI.dominantDifficulty();
    document.getElementById('d-dominant').textContent = dominant
      ? `Catégorie dominante détectée : ${dominant.label} (${dominant.count} occurrence(s)).`
      : "Pas encore assez de données pour dégager une tendance.";
    const top = AI.topErrors().filter(e=>e.count>0);
    const maxCount = Math.max(1, ...top.map(e=>e.count));
    const SHORT_LABELS = { semantic:'Sens', phonological:'Sonorité', syntax:'Structure de phrase', omission:'Absence de réponse' };
    document.getElementById('d-errors').innerHTML = top.length ? top.map(e=>`
      <div class="error-bar-row">
        <div>${SHORT_LABELS[e.category] || e.category}</div>
        <div class="error-bar-track"><div class="error-bar-fill ${e.category}" style="width:${Math.round(100*e.count/maxCount)}%"></div></div>
        <div>${e.count}</div>
      </div>`).join('') : `<p class="hint">Aucune erreur journalisée pour l'instant.</p>`;

    const hist = await Store.history(code);
    currentHistory = hist;
    const rows = hist.slice(-15).reverse().map(s=>`
      <div class="history-row">
        <div>${s.type}</div>
        <div>${s.score}/${s.total}</div>
        <div>${new Date(s.at).toLocaleDateString('fr-FR')}</div>
      </div>`).join('');
    document.getElementById('d-history').innerHTML = `
      <div class="history-row head"><div>Exercice</div><div>Score</div><div>Date</div></div>
      ${rows || '<p class="hint">Aucune séance enregistrée.</p>'}`;

    const chartEl = document.getElementById('d-chart');
    if(chartEl && window.Charts) chartEl.innerHTML = Charts.successLine(hist);
    const trend = AI.trend(hist);
    const trendEl = document.getElementById('d-trend');
    if(trendEl){
      trendEl.textContent = trend.direction==='hausse' ? `📈 Tendance à la hausse (+${trend.deltaPct} points).`
        : trend.direction==='baisse' ? `📉 Tendance à la baisse (${trend.deltaPct} points).`
        : trend.direction==='stable' ? `➡️ Stable sur les dernières séances.`
        : `Pas encore assez de séances pour dégager une tendance.`;
    }

    const media = await Store.listMedia(code);
    document.getElementById('d-media').innerHTML = media.length ? media.map(m=>`
      <div class="media-item"><img src="${m.url}" alt="${m.label}"><div class="m-label">${m.label}</div></div>
    `).join('') : `<p class="media-empty">Le patient n'a pas encore ajouté de photo personnelle.</p>`;

    const reports = await Store.listReports(code);
    document.getElementById('d-reports').textContent = reports.length
      ? `${reports.length} rapport(s) déjà généré(s), dernier le ${new Date(reports[0].generated_at).toLocaleDateString('fr-FR')}.`
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
        <div>${new Date(n.created_at).toLocaleDateString('fr-FR')}</div>
      </div>`).join('') : `<p class="hint">Aucune note pour l'instant.</p>`;
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

window.OrthoApp = OrthoApp;
document.addEventListener('DOMContentLoaded', OrthoApp.init);
