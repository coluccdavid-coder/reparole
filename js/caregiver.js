// =====================================================================
//  ESPACE AIDANT — logique de la page aidant.html (v6.35)
//  ---------------------------------------------------------------------
//  Pas de compte, pas de mot de passe : un seul code (généré par le
//  patient depuis son propre espace) donne accès à une vue limitée en
//  lecture seule — voir ReParoleStore.loadCaregiverData et
//  sql/schema.sql (get_caregiver_data) pour ce qui est exposé, et
//  surtout ce qui NE L'EST PAS (rien de clinique/administratif).
//
//  v6.76 : interface traduite dans les 9 langues complètes (comme le
//  reste de l'app) — voir js/i18n.js (clés cg_*). I18N.t() replie
//  automatiquement sur le français si une clé manque pour une langue
//  donnée, donc aucun risque de texte vide.
// =====================================================================

let caregiverCode = null;
let caregiverData = null;

function cgT(key, ...params){
  return (window.I18N ? I18N.t(key, ...params) : key);
}

async function caregiverLogin(){
  const input = document.getElementById('caregiver-code');
  const errEl = document.getElementById('caregiver-login-error');
  const code = input.value.trim();
  errEl.textContent = '';

  if(!code){
    errEl.textContent = cgT('cg_err_enter_code');
    return;
  }

  const data = await ReParoleStore.loadCaregiverData(code);
  if(!data){
    errEl.textContent = cgT('cg_err_unknown_code');
    return;
  }

  caregiverCode = code;
  caregiverData = data;
  renderCaregiverDashboard();
  renderCaregiverWordList();
  // v6.61 : BUG RÉEL trouvé ici — manipuler .style.display directement
  // ne fonctionnait pas pour caregiver-dashboard, qui n'a jamais la
  // classe "active" que la règle CSS .screen.active{display:block}
  // attend. Vider le style inline (display:'') retombe alors sur la
  // règle .screen{display:none} du fichier CSS, qui l'emporte puisque
  // "active" est absent -> le tableau de bord restait invisible après
  // une connexion "réussie", sans la moindre erreur JS (juste un
  // problème d'affichage CSS silencieux). Corrigé en basculant les
  // classes, comme le fait show() partout ailleurs dans l'app.
  document.getElementById('caregiver-login').classList.remove('active');
  document.getElementById('caregiver-dashboard').classList.add('active');
}

function caregiverLogout(){
  caregiverCode = null;
  caregiverData = null;
  document.getElementById('caregiver-code').value = '';
  document.getElementById('caregiver-login-error').textContent = '';
  document.getElementById('caregiver-dashboard').classList.remove('active');
  document.getElementById('caregiver-login').classList.add('active');
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
    statusEl.textContent = cgT('cg_word_empty');
    statusEl.style.color = '#b23b3b';
    return;
  }

  const { error } = await ReParoleStore.addCaregiverWord(caregiverCode, word, emojiEl.value.trim() || null);
  if(error){
    statusEl.textContent = cgT('cg_word_error');
    statusEl.style.color = '#b23b3b';
    return;
  }

  textEl.value = '';
  emojiEl.value = '';
  statusEl.textContent = cgT('cg_word_added', caregiverData ? caregiverData.name : cgT('cg_your_relative'));
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

// v6.76 : la locale d'affichage de la date (toLocaleDateString) suit
// désormais la langue active plutôt que d'être toujours 'fr-FR' —
// LANGUAGES[lang].speechLocale existe déjà pour la voix, mais peut être
// null pour des langues sans reconnaissance/synthèse vocale alors que
// l'affichage de date, lui, doit suivre la langue d'interface. Repli
// simple sur le code de langue lui-même s'il n'y a pas de speechLocale
// (ex. 'de' -> 'de', fonctionne très bien avec toLocaleDateString).
function cgDateLocale(){
  const lang = (window.Prefs && Prefs.data.lang) || 'fr';
  if(window.LANGUAGES && LANGUAGES[lang] && LANGUAGES[lang].speechLocale) return LANGUAGES[lang].speechLocale;
  return lang === 'fr' ? 'fr-FR' : lang;
}

function renderCaregiverDashboard(){
  const d = caregiverData;
  if(!d) return;

  document.getElementById('caregiver-hello').textContent = cgT('cg_hello', d.name);
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
      ? cgT('cg_last_session', new Date(d.last_seen).toLocaleDateString(cgDateLocale(), { day:'numeric', month:'long' }))
      : cgT('cg_no_session_yet');
  }

  // v6.133 : détail du niveau par type d'exercice, pas seulement un
  // score global (point 15) — n'affiche rien si aucune donnée n'est
  // encore disponible (migration pas encore appliquée, ou patient
  // n'ayant pas encore pratiqué).
  const levelsEl = document.getElementById('cg-levels-breakdown');
  if(levelsEl){
    const entries = Object.entries(d.levels || {});
    levelsEl.textContent = entries.length
      ? cgT('cg_levels_breakdown_prefix') + ' ' + entries.map(([type,lvl])=>`${cgT('ex_'+type+'_t') || type} : ${cgT('level_'+lvl) || lvl}`).join(' · ')
      : '';
  }

  // v6.168 : "mots à revoir" côté aidant, demandé explicitement — en
  // lecture seule (complémentaire de l'ajout de mot, qui existait déjà).
  const wordsEl = document.getElementById('cg-frequent-words');
  if(wordsEl){
    const words = d.frequent_words || [];
    wordsEl.innerHTML = words.length
      ? words.map(w => `<span class="word-chip word-chip-muted">${escapeHTML(w.target)}</span>`).join('')
      : `<p class="hint">${escapeHTML(cgT('cg_no_frequent_words'))}</p>`;
  }

  // v6.168 : frise des 14 derniers jours calendaires — un point plein
  // si au moins une séance ce jour-là, vide sinon. Volontairement
  // simple (pas de tooltip, pas de détail par exercice) : le but est
  // un repère visuel rapide ("ça fait 4 jours"), pas un tableau de
  // bord détaillé de plus.
  const stripEl = document.getElementById('cg-activity-strip');
  if(stripEl){
    const activeDays = new Set(d.active_days || []);
    const days = [];
    for(let i = 13; i >= 0; i--){
      const dt = new Date(); dt.setDate(dt.getDate() - i);
      const key = dt.toISOString().slice(0,10);
      days.push({ key, active: activeDays.has(key) });
    }
    stripEl.innerHTML = days.map(dy =>
      `<span class="cg-day-dot ${dy.active ? 'cg-day-active' : ''}" title="${dy.key}"></span>`
    ).join('');
  }

  // v6.168 : badge de langue actuelle — n'apparaît que si le patient
  // ne travaille pas en français, pour ne pas surcharger l'écran dans
  // le cas le plus courant. Utile pour un aidant qui ne parle pas la
  // même langue que le patient, pour comprendre pourquoi certains mots
  // reviennent dans une langue qu'il/elle ne reconnaît pas forcément.
  const langEl = document.getElementById('cg-current-lang');
  if(langEl){
    const lang = d.current_lang || 'fr';
    if(lang !== 'fr' && window.LANGUAGES && LANGUAGES[lang]){
      langEl.style.display = '';
      langEl.textContent = cgT('cg_current_lang_prefix') + ' ' + LANGUAGES[lang].label;
    } else {
      langEl.style.display = 'none';
    }
  }

  const tipsEl = document.getElementById('cg-tips');
  if(tipsEl && typeof CaregiverTips !== 'undefined'){
    const tips = CaregiverTips.generateCaregiverTips(d);
    // v6.76 : le texte français de CaregiverTips sert de repère d'ID
    // (voir cg_tip_<id> dans js/i18n.js) et de repli si la traduction
    // manque — jamais affiché brut si une langue est active.
    tipsEl.innerHTML = tips.map(t => `<li>${escapeHTML(cgT('cg_tip_' + t.id))}</li>`).join('');
  }
}

if(typeof window !== 'undefined'){
  Object.assign(window, { caregiverLogin, caregiverLogout, renderCaregiverDashboard, addCaregiverWord, renderCaregiverWordList });
}
if(typeof module !== 'undefined' && module.exports){
  module.exports = { renderCaregiverDashboard };
}
