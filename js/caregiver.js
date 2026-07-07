// =====================================================================
//  ESPACE AIDANT — logique de la page aidant.html (v6.35)
//  ---------------------------------------------------------------------
//  Pas de compte, pas de mot de passe : un seul code (généré par le
//  patient depuis son propre espace) donne accès à une vue limitée en
//  lecture seule — voir ReParoleStore.loadCaregiverData et
//  sql/schema.sql (get_caregiver_data) pour ce qui est exposé, et
//  surtout ce qui NE L'EST PAS (rien de clinique/administratif).
// =====================================================================

let caregiverCode = null;
let caregiverData = null;

async function caregiverLogin(){
  const input = document.getElementById('caregiver-code');
  const errEl = document.getElementById('caregiver-login-error');
  const code = input.value.trim();
  errEl.textContent = '';

  if(!code){
    errEl.textContent = "Saisissez le code transmis par le patient.";
    return;
  }

  const data = await ReParoleStore.loadCaregiverData(code);
  if(!data){
    errEl.textContent = "Code inconnu, ou accès révoqué par le patient. Vérifiez le code, ou demandez-lui d'en générer un nouveau depuis son espace.";
    return;
  }

  caregiverCode = code;
  caregiverData = data;
  renderCaregiverDashboard();
  document.getElementById('caregiver-login').style.display = 'none';
  document.getElementById('caregiver-dashboard').style.display = '';
}

function caregiverLogout(){
  caregiverCode = null;
  caregiverData = null;
  document.getElementById('caregiver-code').value = '';
  document.getElementById('caregiver-login-error').textContent = '';
  document.getElementById('caregiver-dashboard').style.display = 'none';
  document.getElementById('caregiver-login').style.display = '';
}

function renderCaregiverDashboard(){
  const d = caregiverData;
  if(!d) return;

  document.getElementById('caregiver-hello').textContent = 'Suivi de ' + d.name;
  document.getElementById('cg-sessions').textContent = d.sessions || 0;
  document.getElementById('cg-success').textContent = d.total ? Math.round(100 * d.correct / d.total) + '%' : '—';
  document.getElementById('cg-streak').textContent = d.streak || 0;

  const chartEl = document.getElementById('caregiver-chart');
  if(chartEl && typeof Charts !== 'undefined'){
    // recent_sessions arrive du plus récent au plus ancien -> on inverse
    // pour tracer la courbe dans l'ordre chronologique (comme côté patient)
    const hist = (d.recent_sessions || []).slice().reverse();
    chartEl.innerHTML = Charts.successLine(hist);
  }

  const lastSeenEl = document.getElementById('cg-last-seen');
  if(lastSeenEl){
    lastSeenEl.textContent = d.last_seen
      ? 'Dernière séance : ' + new Date(d.last_seen).toLocaleDateString('fr-FR', { day:'numeric', month:'long' })
      : "Pas encore de séance enregistrée.";
  }

  const tipsEl = document.getElementById('cg-tips');
  if(tipsEl && typeof CaregiverTips !== 'undefined'){
    const tips = CaregiverTips.generateCaregiverTips(d);
    tipsEl.innerHTML = tips.map(t => `<li>${t.text}</li>`).join('');
  }
}

if(typeof window !== 'undefined'){
  Object.assign(window, { caregiverLogin, caregiverLogout, renderCaregiverDashboard });
}
if(typeof module !== 'undefined' && module.exports){
  module.exports = { renderCaregiverDashboard };
}
