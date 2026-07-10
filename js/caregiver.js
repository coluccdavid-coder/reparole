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
  renderCaregiverWordList();
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

// =====================================================================
//  v6.43 — mots personnalisés proposés par l'aidant
//  ---------------------------------------------------------------------
//  Liés au patient précis suivi par ce code aidant, intégrés SANS
//  validation admin (décision assumée — voir sql/schema.sql). Ne
//  concerne QUE ce patient, jamais la base commune de contribuer.html.
// =====================================================================
function escapeHTML(s){ return (s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }

async function addCaregiverWord(){
  const emojiEl = document.getElementById('cg-word-emoji');
  const textEl = document.getElementById('cg-word-text');
  const statusEl = document.getElementById('cg-word-status');
  const word = textEl.value.trim();
  statusEl.textContent = '';

  if(!word){
    statusEl.textContent = 'Écrivez un mot avant d\'ajouter.';
    statusEl.style.color = '#b23b3b';
    return;
  }

  const { error } = await ReParoleStore.addCaregiverWord(caregiverCode, word, emojiEl.value.trim() || null);
  if(error){
    statusEl.textContent = "Ça n'a pas fonctionné, réessayez.";
    statusEl.style.color = '#b23b3b';
    return;
  }

  textEl.value = '';
  emojiEl.value = '';
  statusEl.textContent = '✅ Ajouté aux exercices de ' + (caregiverData ? caregiverData.name : 'votre proche') + '.';
  statusEl.style.color = 'var(--accent-dark)';
  renderCaregiverWordList();
}

async function renderCaregiverWordList(){
  const el = document.getElementById('cg-word-list');
  if(!el || !caregiverCode) return;
  const words = await ReParoleStore.loadCaregiverAddedWords(caregiverCode);
  if(!words.length){ el.innerHTML = ''; return; }
  el.innerHTML = words.map(w => `
    <div style="background:var(--surface-soft);border-radius:10px;padding:8px 14px;display:flex;align-items:center;gap:10px">
      <span style="font-size:1.2rem">${escapeHTML(w.emoji || '💬')}</span>
      <span style="font-size:.92rem">${escapeHTML(w.word)}</span>
    </div>`).join('');
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
  Object.assign(window, { caregiverLogin, caregiverLogout, renderCaregiverDashboard, addCaregiverWord, renderCaregiverWordList });
}
if(typeof module !== 'undefined' && module.exports){
  module.exports = { renderCaregiverDashboard };
}
