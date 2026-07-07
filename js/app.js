// =====================================================================
//  APPLICATION PRINCIPALE
// =====================================================================
const BANK = window.BANK;
const Store = window.ReParoleStore;
const AI = window.Learner;   // moteur d'apprentissage (alias pour éviter toute collision)
function levelName(n){ return I18N.t('level_'+n); } // v6.9 : remplace l'ancien objet LEVEL_NAMES codé en dur en français

let user = null;        // dossier du patient connecté
let userCode = null;    // son code de suivi
let current = null;     // exercice en cours

// =====================================================================
//  v6.24 — STRUCTURE GRATUIT / PRO (pas de paiement branché)
//  ---------------------------------------------------------------------
//  Décision explicite de l'utilisateur : la structure doit exister et
//  fonctionner, mais aucun système de paiement n'est activé pour
//  l'instant. Le passage en 'pro' se fait à la main dans Supabase (voir
//  sql/schema.sql) en attendant un vrai système de facturation.
//
//  Ces 3 constantes sont volontairement regroupées ici pour être
//  faciles à ajuster plus tard sans devoir chercher dans tout le code :
// =====================================================================
const FREE_DAILY_SESSION_LIMIT = 5;   // séances/jour, tous exercices confondus
const FREE_LANGS = ['fr'];            // langues accessibles sans compte pro
const PRO_ONLY_TYPES = ['repetition','denomination_orale','fluence','intonation','conversation']; // exercices vocaux avancés + conversation guidée

// v6.33 — INTERRUPTEUR PAYWALL (décision utilisateur du 7 juillet) :
// tout doit être accessible pour l'instant, le mode payant est repoussé
// à plus tard. On NE SUPPRIME PAS la structure gratuit/pro (constantes
// ci-dessus, lockReason, écran de tarification, Stripe...) — elle reste
// intacte et prête à être réactivée d'un coup en repassant ce booléen à
// true, sans avoir à retoucher tout le code.
let PAYWALL_ENABLED = false;

function isPro(){ return !!(user && user.plan==='pro'); }

function dailySessionsUsedToday(){
  if(!user) return 0;
  const today = new Date().toISOString().slice(0,10);
  return (user.dailySessionsDate===today) ? (user.dailySessionsCount||0) : 0;
}

function recordDailySession(){
  if(!user) return;
  const today = new Date().toISOString().slice(0,10);
  if(user.dailySessionsDate !== today){ user.dailySessionsDate = today; user.dailySessionsCount = 0; }
  user.dailySessionsCount = (user.dailySessionsCount||0) + 1;
}

// Renvoie null si l'exercice est accessible, ou la raison du verrou sinon.
function lockReason(type){
  if(!PAYWALL_ENABLED) return null; // v6.33 : paywall désactivé pour l'instant
  if(isPro()) return null;
  const lang = (window.Prefs && Prefs.data.lang) || 'fr';
  if(!FREE_LANGS.includes(lang)) return 'lang';
  if(PRO_ONLY_TYPES.includes(type)) return 'type';
  if(dailySessionsUsedToday() >= FREE_DAILY_SESSION_LIMIT) return 'quota';
  return null;
}

// v6.24.1 — Rôle UX de l'audit "7 rôles" : le patient ne doit pas
// découvrir qu'un exercice est verrouillé seulement après avoir cliqué
// dedans. Cette fonction ajoute un badge "Pro" visible directement sur
// le tableau de bord pour tout exercice réservé au compte pro ou à une
// langue payante — mais PAS pour le quota journalier (transitoire, un
// badge permanent serait trompeur pour ça, voir showUpsell('quota')).
function updateExerciseLocks(){
  document.querySelectorAll('.ex-item[data-type]').forEach(el=>{
    const type = el.getAttribute('data-type');
    const reason = lockReason(type);
    let badge = el.querySelector('.badge-pro');
    if(reason==='type' || reason==='lang'){
      el.classList.add('ex-locked');
      if(!badge){
        badge = document.createElement('span');
        badge.className = 'badge-pro';
        badge.textContent = '🔒 Pro';
        el.querySelector('.t').appendChild(badge);
      }
    } else {
      el.classList.remove('ex-locked');
      if(badge) badge.remove();
    }
  });
  // Conversation guidée : bouton dédié, pas une .ex-item
  const convBtn = document.querySelector('[onclick*="Conversation.menu"]');
  if(convBtn){
    const reason = lockReason('conversation');
    let badge = document.getElementById('conv-pro-badge');
    if(reason==='type' || reason==='lang'){
      if(!badge){
        badge = document.createElement('span');
        badge.id = 'conv-pro-badge';
        badge.className = 'badge-pro';
        badge.textContent = '🔒 Pro';
        convBtn.parentNode.insertBefore(badge, convBtn);
      }
    } else if(badge) badge.remove();
  }
}

function showUpsell(reason){
  const messages = {
    lang:  I18N.t('upsell_lang'),
    type:  I18N.t('upsell_type'),
    quota: I18N.t('upsell_quota')
  };
  // v6.24 : on ne touche qu'à #ex-body (comme le fait déjà
  // renderQuestion()/finishExercise() normalement) — surtout PAS toute
  // la .wrap, qui contient les conteneurs stables (ex-header, barre de
  // progression, Ami) réutilisés par le prochain exercice.
  // v6.26 : bouton vers la vraie page de tarification, sauf pour le
  // quota journalier — revenir demain suffit, pas la peine de pousser
  // vers l'achat à ce moment précis (moins de pression commerciale).
  const upgradeBtn = reason==='quota' ? '' :
    `<button class="btn-primary" style="margin-top:14px" onclick="showPricing()">${I18N.t('pricing_see_offers')}</button>`;
  document.getElementById('ex-title').textContent = I18N.t('upsell_title');
  document.getElementById('ex-count').textContent = '';
  document.getElementById('ex-progress').style.width = '0%';
  document.getElementById('ex-feedback').textContent = '';
  document.getElementById('ex-body').innerHTML = `
    <div class="prompt-card" style="text-align:center">
      <div class="prompt-emoji">🔒</div>
      <p style="color:var(--ink-soft);margin-top:10px">${messages[reason]}</p>
      ${upgradeBtn}
      <button class="btn-ghost" style="margin-top:12px;width:100%" onclick="goDashboard()">${I18N.t('back_to_home')}</button>
    </div>`;
  show('exercise');
}

// v6.26 : écran de tarification + démarrage du paiement Stripe
function showPricing(){
  document.getElementById('pricing-error').textContent = '';
  show('pricing');
}

async function startCheckout(planKey){
  const errEl = document.getElementById('pricing-error');
  errEl.textContent = I18N.t('pricing_loading');
  const res = await Store.createCheckoutSession(planKey, userCode, 'patient');
  if(res.error){ errEl.textContent = I18N.t('pricing_error'); return; }
  window.location.href = res.url;
}

/* ---------- Synthèse vocale : lire les consignes à voix haute ---------- */
function speak(text){
  if(!('speechSynthesis' in window)) return;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = (window.I18N && I18N.speechLocale()) || 'fr-FR'; // v6.9 : locale selon la langue active
  u.rate = 0.95;
  window.speechSynthesis.speak(u);
}

let lastGapDays = 0; // v6.11 : nb de jours d'absence détectés à la dernière connexion (0 = aucun)

/* ---------- Connexion ---------- */
async function login(){
  const name = document.getElementById('name').value.trim() || 'Marie';
  const code = document.getElementById('code').value.trim();
  if(!code){ alert("Saisissez votre code de suivi, ou utilisez « Créer un nouveau dossier » si c'est votre première visite."); return; }
  userCode = code;
  const existing = await Store.loadPatient(code);

  if(existing){
    // Patient connu : on recharge dossier + profil d'apprentissage
    user = existing;
    if(name && name!==existing.name){ user.name = name; }

    // v6.11 : le "streak" (jours d'affilée) n'était en fait jamais
    // recalculé — il gardait la valeur fixée à la création du dossier.
    // Corrigé ici à partir de `last_seen` (déjà enregistré par
    // Store.savePatient) : +1 si connecté hier, remise à 1 si plus d'un
    // jour d'écart (sans faire culpabiliser — voir COMPANION_PHRASES
    // 'welcome_back'), inchangé si déjà connecté aujourd'hui.
    lastGapDays = 0;
    if(existing.last_seen){
      const today = new Date(); today.setHours(0,0,0,0);
      const lastSeen = new Date(existing.last_seen); lastSeen.setHours(0,0,0,0);
      const diffDays = Math.round((today - lastSeen) / 86400000);
      if(diffDays===1) user.streak = (user.streak||0) + 1;
      else if(diffDays>1){ lastGapDays = diffDays; user.streak = 1; }
      // diffDays===0 (déjà vu aujourd'hui) ou négatif (horloge décalée) : streak inchangé
    }

    AI.load(await Store.loadProfile(code));
    await Store.savePatient(userCode, user);
    document.getElementById('who-name').textContent = user.name;
    renderDashboard();
    show('dashboard');
  } else {
    document.getElementById('login-error').textContent = I18N.t('login_error');
  }
}

// v6 : parcours dédié pour un nouveau patient — génère un code de suivi
// long et aléatoire (au lieu de laisser saisir n'importe quelle chaîne),
// ce qui rend le code impossible à deviner. Le code est ensuite affiché
// clairement au patient, une seule fois, pour qu'il le note.
async function createNewPatient(){
  const name = document.getElementById('name').value.trim() || 'Marie';
  userCode = Store.generateCode();
  justCreatedCode = userCode;
  // v6.24 : structure gratuit/pro — pas de paiement branché, activation
  // manuelle pour l'instant (voir sql/schema.sql). Tout nouveau dossier
  // démarre en 'free'.
  user = { name, level:2, sessions:0, correct:0, total:0, streak:1, plan:'free' };
  show('assessment');
  Assessment.start(async ({ seed, level })=>{
    user.level = level;
    AI.load(seed);                          // l'IA démarre avec le profil du bilan
    await Store.savePatient(userCode, user);
    await Store.saveProfile(userCode, AI.dump());
    document.getElementById('who-name').textContent = user.name;
    renderDashboard();
    show('dashboard');
  });
}
let justCreatedCode = null; // v6 : sert à afficher le code une seule fois après création
function logout(){ stopRecognition(); window.speechSynthesis?.cancel(); user=null; userCode=null; show('login'); }
function goDashboard(){ stopRecognition(); renderDashboard(); show('dashboard'); }
function show(id){ document.querySelectorAll('.screen').forEach(s=>s.classList.remove('active')); document.getElementById(id).classList.add('active'); window.scrollTo(0,0); }

async function renderDashboard(){
  document.getElementById('hello').textContent=I18N.t('greeting_hello')+' '+user.name+' 👋';
  document.getElementById('level-name').textContent=levelName(user.level);
  document.getElementById('s-sessions').textContent=user.sessions;
  document.getElementById('s-success').textContent=user.total?Math.round(100*user.correct/user.total)+'%':'—';
  document.getElementById('s-streak').textContent=user.streak;
  document.getElementById('storage-mode').textContent = Store.mode();

  // Ce que l'IA a appris du patient
  const insightEl=document.getElementById('learner-insight');
  const insightText = AI.insight();
  if(insightEl) insightEl.textContent = insightText;

  // v6.11 : Ami pointe vers ce conseil plutôt que de le répéter mot pour
  // mot — l'encadré "Votre assistant a appris" reste la source détaillée
  // (garde-fou : un seul endroit qui explique le raisonnement, pas deux
  // versions qui pourraient un jour diverger). S'il n'y a rien d'appris
  // pour l'instant (texte par défaut), Ami reste sur un accueil classique.
  Companion.mount('companion-dashboard');
  const hasRealInsight = insightText !== I18N.t('insight_default');
  if(lastGapDays>1){
    Companion.say('welcome_back'); // v6.11 : prioritaire — jamais de culpabilisation, juste un accueil chaleureux
  } else {
    Companion.say(hasRealInsight ? 'insight_pointer' : (Math.random()<0.4 ? 'tip' : 'welcome'));
  }
  updateExerciseLocks(); // v6.24.1 : badges "Pro" sur les exercices verrouillés
  const proTeaser = document.getElementById('pro-teaser-card');
  if(proTeaser) proTeaser.style.display = (!PAYWALL_ENABLED || isPro()) ? 'none' : '';

  // v5 : réordonne en tenant compte du profil clinique déclaré par l'orthophoniste (facultatif)
  const types=['denomination','completion','comprehension','repetition','denomination_orale','fluence','intonation'];
  const ordered=AI.recommend(types, user.clinical_profile);
  const top=ordered[0];
  const list=document.getElementById('ex-list');
  if(list){
    document.querySelectorAll('#ex-list .ex-item').forEach(el=>{
      el.querySelector('.reco-tag')?.remove();
      if(el.dataset.type===top){
        const tag=document.createElement('span');
        tag.className='reco-tag'; tag.textContent=I18N.t('recommended');
        el.querySelector('.t').appendChild(tag);
      }
    });
    // place l'exercice recommandé en haut
    ordered.forEach(t=>{ const el=list.querySelector(`.ex-item[data-type="${t}"]`); if(el) list.appendChild(el); });
  }
  renderMedia();

  // v5 : courbe de progression + tendance
  const histEl=document.getElementById('progress-chart');
  if(histEl && typeof Charts!=='undefined'){
    const hist = await Store.history(userCode);
    histEl.innerHTML = Charts.successLine(hist);
    const trend = AI.trend(hist);
    const trendEl=document.getElementById('trend-note');
    if(trendEl){
      const msg = trend.direction==='hausse' ? `📈 En hausse (+${trend.deltaPct} points sur vos dernières séances).`
        : trend.direction==='baisse' ? `📉 En légère baisse (${trend.deltaPct} points) — c'est normal d'avoir des hauts et des bas.`
        : trend.direction==='stable' ? `➡️ Stable sur vos dernières séances.`
        : `Encore quelques séances pour dégager une tendance.`;
      trendEl.textContent = msg;
    }
  }

  // v6 : préférences de rappel
  const remCheck=document.getElementById('reminder-opt-in'), remEmail=document.getElementById('reminder-email');
  if(remCheck){ remCheck.checked = !!user.reminder_opt_in; }
  if(remEmail){ remEmail.value = user.reminder_email || ''; remEmail.style.display = user.reminder_opt_in ? '' : 'none'; }

  // v6.35 : espace aidant (état du code d'invitation en cours, s'il y en a un)
  renderCaregiverSection();

  // v6 : affiche le code de suivi une seule fois, juste après sa création
  const codeBanner = document.getElementById('your-code-banner');
  if(codeBanner){
    if(justCreatedCode){
      document.getElementById('your-code-value').textContent = justCreatedCode;
      codeBanner.style.display='';
    } else {
      codeBanner.style.display='none';
    }
  }
}
function dismissCodeBanner(){
  justCreatedCode = null;
  const el=document.getElementById('your-code-banner');
  if(el) el.style.display='none';
}

// v5 : indicateur d'état de sauvegarde (file d'attente hors-ligne, voir storage.js)
if(typeof Store !== 'undefined' && Store.onSaveStatusChange){
  Store.onSaveStatusChange((pending)=>{
    const el=document.getElementById('save-status');
    if(!el) return;
    el.textContent = pending>0
      ? `⏳ ${pending} enregistrement(s) en attente de connexion — rien n'est perdu, ça se synchronisera automatiquement.`
      : '';
  });
}

// v5 : préférences de rappel (opt-in patient, aucun email n'est envoyé par ce prototype seul — voir js/reminders-edge-function.md)
async function toggleReminder(){
  const on = document.getElementById('reminder-opt-in').checked;
  const emailEl = document.getElementById('reminder-email');
  emailEl.style.display = on ? '' : 'none';
  user.reminder_opt_in = on;
  await Store.setReminderPrefs(userCode, on, emailEl.value.trim());
}
async function saveReminderEmail(){
  const on = document.getElementById('reminder-opt-in').checked;
  const email = document.getElementById('reminder-email').value.trim();
  user.reminder_email = email;
  await Store.setReminderPrefs(userCode, on, email);
}

// =====================================================================
//  v6.35 — ESPACE AIDANT
//  ---------------------------------------------------------------------
//  Le patient génère lui-même le code que son proche utilisera sur
//  aidant.html. Régénérer révoque automatiquement l'ancien code (un
//  seul aidant à la fois — décision utilisateur du 7 juillet, à
//  étendre plus tard si plusieurs aidants sont nécessaires).
// =====================================================================
async function generateCaregiverAccess(){
  const code = await Store.generateCaregiverCode(userCode);
  if(!code){ alert("Impossible de créer l'accès aidant pour l'instant. Réessayez dans un instant."); return; }
  user.caregiver_code = code;
  renderCaregiverSection();
}
async function revokeCaregiverAccess(){
  if(!confirm("Révoquer l'accès aidant ? La personne qui a ce code ne pourra plus voir votre suivi tant que vous n'aurez pas recréé un accès.")) return;
  await Store.revokeCaregiverCode(userCode);
  user.caregiver_code = null;
  renderCaregiverSection();
}
function renderCaregiverSection(){
  const noneEl = document.getElementById('caregiver-none');
  const activeEl = document.getElementById('caregiver-active');
  if(!noneEl || !activeEl || !user) return;
  if(user.caregiver_code){
    noneEl.style.display = 'none';
    activeEl.style.display = '';
    const codeEl = document.getElementById('caregiver-code-display');
    if(codeEl) codeEl.textContent = user.caregiver_code;
  } else {
    noneEl.style.display = '';
    activeEl.style.display = 'none';
  }
}

// v6.36 : résumé imprimable côté patient (mon-resume.html) — ouvert dans
// un nouvel onglet avec le code de suivi déjà connu, pas besoin de le
// re-saisir.
function openMySummary(){
  if(!userCode) return;
  window.open('mon-resume.html?code=' + encodeURIComponent(userCode), '_blank');
}

/* ---------- v4 : photos personnelles ---------- */
async function renderMedia(){
  const grid=document.getElementById('media-grid');
  if(!grid) return;
  const media = await Store.listMedia(userCode);
  const photoItem=document.querySelector('.ex-item[data-type="photos_perso"]');
  if(photoItem) photoItem.style.display = media.length ? '' : 'none';
  grid.innerHTML = media.length ? media.map(m=>`
    <div class="media-item">
      <img src="${m.url}" alt="${m.label}">
      <div class="m-label">${m.label}</div>
      <button class="btn-ghost" style="padding:4px 10px;font-size:.72rem;margin-top:4px" onclick="deleteMedia('${m.id}')">Supprimer</button>
    </div>`).join('') : `<p class="media-empty">Ajoutez une photo de votre quotidien pour l'utiliser dans un exercice.</p>`;
}
async function uploadMedia(){
  const labelEl=document.getElementById('media-label'), fileEl=document.getElementById('media-file');
  const label=labelEl.value.trim(), file=fileEl.files[0];
  if(!label || !file){ alert('Choisissez une photo et donnez-lui un nom (le mot à travailler).'); return; }
  // v5 : redimensionne côté client avant envoi (limite la taille, surtout utile en mode navigateur/localStorage)
  const resized = await resizeImageFile(file, 900).catch(()=>file);
  await Store.addMedia(userCode, label, resized);
  labelEl.value=''; fileEl.value='';
  renderMedia();
}
// v5 : redimensionne une image côté client via <canvas>, renvoie un File JPEG compressé
function resizeImageFile(file, maxDim){
  return new Promise((resolve, reject)=>{
    if(!file.type.startsWith('image/')){ resolve(file); return; }
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = ()=>{
      URL.revokeObjectURL(url);
      let { width, height } = img;
      if(width>maxDim || height>maxDim){
        const scale = maxDim/Math.max(width,height);
        width = Math.round(width*scale); height = Math.round(height*scale);
      }
      const canvas=document.createElement('canvas'); canvas.width=width; canvas.height=height;
      canvas.getContext('2d').drawImage(img,0,0,width,height);
      canvas.toBlob(blob=>{
        if(!blob){ resolve(file); return; }
        resolve(new File([blob], (file.name||'photo').replace(/\.[^.]+$/,'')+'.jpg', { type:'image/jpeg' }));
      }, 'image/jpeg', 0.82);
    };
    img.onerror = ()=>{ URL.revokeObjectURL(url); reject(new Error('Image illisible')); };
    img.src = url;
  });
}
async function deleteMedia(id){
  await Store.deleteMedia(userCode, /^\d+$/.test(id)?Number(id):id);
  renderMedia();
}

/* ---------- Reconnaissance vocale ---------- */
const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
let recognition = null;
function voiceSupported(){ return !!SR; }
function stopRecognition(){ if(recognition){ try{recognition.stop();}catch(e){} recognition=null; } }
function normalize(s){ return (s||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z\s]/g,'').trim(); }
function levenshtein(a,b){ const m=a.length,n=b.length,d=Array.from({length:m+1},(_,i)=>[i,...Array(n).fill(0)]); for(let j=0;j<=n;j++)d[0][j]=j; for(let i=1;i<=m;i++)for(let j=1;j<=n;j++)d[i][j]=Math.min(d[i-1][j]+1,d[i][j-1]+1,d[i-1][j-1]+(a[i-1]===b[j-1]?0:1)); return d[m][n]; }
function isCloseEnough(said,target){ const s=normalize(said),t=normalize(target); if(!s)return false; if(s.includes(t)||t.includes(s))return true; return levenshtein(s,t)<=Math.max(1,Math.floor(t.length*0.34)); }

/* ---------- Moteur d'exercice ---------- */
async function startExercise(type){
  // v6.24 : structure gratuit/pro — vérifié avant toute autre logique
  const reason = lockReason(type);
  if(reason){ showUpsell(reason); return; }
  recordDailySession();

  // v4 : exercice dynamique construit à partir des photos personnelles du patient
  if(type==='photos_perso'){
    const media = await Store.listMedia(userCode);
    if(!media.length){ alert("Ajoutez d'abord une photo dans « Vos photos » sur le tableau de bord."); return; }
    const set = media.map(m=>({word:m.label, url:m.url}));
    current={type,queue:set,index:0,total:set.length,correctInRow:0,wrongInRow:0,sessionCorrect:0,voice:true,fluency:false};
    document.getElementById('ex-title').textContent=I18N.t('ex_photos_t');
    document.getElementById('ai-message').textContent=I18N.t('photos_exercise_intro');
    Companion.explain('companion-exercise', type);
    show('exercise');
    renderQuestion();
    return;
  }
  // v6.9 : généralisé pour n'importe quelle langue (avant : uniquement le
  // kabyle était géré comme cas spécial). Principe :
  //  - Si la langue active dispose d'une vraie synthèse/reconnaissance
  //    vocale (voir LANGUAGES[lang].speechLocale dans js/i18n.js) ET d'une
  //    banque de contenu (window.BANK_EN, futur BANK_AR, etc.), on l'utilise
  //    intégralement — y compris pour les exercices vocaux (cas de l'anglais).
  //  - Sinon, si la langue n'a pas de voix (cas du kabyle aujourd'hui) et
  //    que l'exercice est un exercice vocal, on force le français avec un
  //    message explicite plutôt que de simuler un support qui n'existe pas.
  //  - Si un type d'exercice n'a simplement pas encore de contenu traduit,
  //    même chose : repli sur le français, annoncé clairement.
  const lang = (window.Prefs && Prefs.data.lang) || 'fr';
  const isVoiceType = !!BANK[type].voice;
  const hasSpeechSupport = !!(window.LANGUAGES && LANGUAGES[lang] && LANGUAGES[lang].speechLocale);
  const langBank = (lang!=='fr' && window['BANK_'+lang.toUpperCase()]) ? window['BANK_'+lang.toUpperCase()] : null;
  const langLevels = (langBank && langBank[type]) ? Object.keys(langBank[type].items).map(Number) : [];
  const langAvailable = langLevels.length>0;

  let bank, levelForBank, forcedFrenchVoice=false;
  if(lang!=='fr' && isVoiceType && !hasSpeechSupport){
    bank = BANK; levelForBank = user.level; forcedFrenchVoice = true;
  } else if(lang!=='fr' && langAvailable){
    bank = langBank;
    const atOrBelow = langLevels.filter(k=>k<=user.level).sort((a,b)=>b-a);
    levelForBank = atOrBelow.length ? atOrBelow[0] : Math.min(...langLevels);
  } else {
    bank = BANK; levelForBank = user.level;
  }

  const set=bank[type].items[levelForBank];
  current={type,queue:[...set],index:0,total:set.length,correctInRow:0,wrongInRow:0,sessionCorrect:0,voice:!!BANK[type].voice,fluency:!!BANK[type].fluency};
  document.getElementById('ex-title').textContent=bank[type].title;
  document.getElementById('ai-message').textContent = forcedFrenchVoice
    ? I18N.t('voice_note_forced_fr')
    : (lang!=='fr' && !langAvailable)
    ? I18N.t('content_not_translated_yet')
    : I18N.t('starting_level_msg', levelName(user.level));
  Companion.explain('companion-exercise', type);
  show('exercise');
  renderQuestion();
}

function renderQuestion(){
  const c=current,q=c.queue[c.index];
  // mémorise la "cible" (mot/réponse) pour le moteur d'apprentissage
  c._target = q.answer || q.word || null;
  document.getElementById('ex-count').textContent=(c.index+1)+' / '+c.total;
  document.getElementById('ex-progress').style.width=(100*c.index/c.total)+'%';
  const fb=document.getElementById('ex-feedback'); fb.textContent=''; fb.className='feedback';
  const body=document.getElementById('ex-body');
  if(c.fluency){ renderFluency(q); return; }
  if(c.voice){ renderVoice(q); return; }

  // v6.1 : l'exercice de dénomination peut tourner en kabyle (voir exercises-kab.js)
  const lang = (window.Prefs && Prefs.data.lang) || 'fr';
  const isKabDenom = lang==='kab' && c.type==='denomination' && window.BANK_KAB;

  let promptHTML='', consigne='', listenBtnHTML='';
  if(c.type==='denomination'){
    consigne = isKabDenom ? BANK_KAB.denomination.consigne : I18N.t('denom_prompt');
    promptHTML=`<div class="prompt-emoji">${q.emoji}</div><div class="prompt-text">${consigne}</div>`;
    if(isKabDenom){
      // v6.1 : pas de synthèse vocale française sur un mot kabyle — on tente un
      // vrai enregistrement (voir audio/kab/), et on l'annonce clairement sinon.
      listenBtnHTML = `<button class="speak-btn" onclick="playKabWordUI('${q.answer.replace(/'/g,"\\'")}')">🔊 ${I18N.t('listen_word')}</button><div id="kab-audio-note" class="hint" style="margin-top:6px"></div>`;
    }
  }
  else if(c.type==='completion'){ promptHTML=`<div class="prompt-text">${I18N.t('completion_label')}</div><div class="prompt-main">${q.text.replace('___','<span class=blank>____</span>')}</div>`; consigne=I18N.t('completion_label')+' '+q.text.replace('___','...'); }
  else { promptHTML=`<div class="prompt-main" style="font-size:1.5rem">${q.text}</div>`; consigne=q.text; }

  const shuffled=[...q.choices].sort(()=>Math.random()-0.5);
  const choicesHTML=shuffled.map(ch=>`<button class="choice" onclick="checkChoice(this,'${ch.replace(/'/g,"\\'")}','${q.answer.replace(/'/g,"\\'")}')">${ch}</button>`).join('');
  c._given = null; // v4 : mémorise ce que le patient a répondu, pour l'analyse d'erreurs
  const consigneBtn = isKabDenom ? listenBtnHTML : `<button class="speak-btn" onclick="speak(${JSON.stringify(consigne).replace(/"/g,'&quot;')})">🔊 ${I18N.t('listen_instructions')}</button>`;
  body.innerHTML=`<div class="prompt-card">${promptHTML}
      ${consigneBtn}
    </div><div class="choices">${choicesHTML}</div>`;
}

// v6.1 : joue un enregistrement kabyle réel s'il existe, prévient sinon (jamais de silence trompeur)
function playKabWordUI(word){
  const note=document.getElementById('kab-audio-note');
  if(note) note.textContent='';
  playKabWord(word, ()=>{ if(note) note.textContent="🔇 Pas encore d'enregistrement pour ce mot — voir audio/kab/README.md pour en ajouter un."; });
}

function renderVoice(q){
  const c=current;
  // v6.6 : repère visuel de l'intonation (voir fiche "Répétition de phrases")
  const cueArrow = { question:'↗', descriptive:'→', exclamative:'↘↗' };
  const visual = c.type==='photos_perso'
    ? `<img class="prompt-photo" src="${q.url}" alt=""><div class="prompt-text">${I18N.t('photos_prompt')}</div>`
    : c.type==='denomination_orale'
    ? `<div class="prompt-emoji">${q.emoji}</div><div class="prompt-text">${I18N.t('denom_orale_prompt')}</div>`
    : c.type==='intonation'
    ? `<div class="prompt-text">${I18N.t('intonation_prompt')}</div><div style="font-size:1.8rem;color:var(--accent);margin-bottom:6px">${cueArrow[q.cue]||''}</div><div class="prompt-main" style="font-size:1.9rem">${q.word}</div>`
    : `<div class="prompt-text">${I18N.t('repetition_prompt')}</div><div class="prompt-main" style="font-size:2.6rem">${q.word}</div>`;
  const warn = voiceSupported()?'' : `<div class="voice-warn">${I18N.t('voice_unsupported')}</div>`;
  const listenBtn = c.type==='denomination_orale' ? '' : `<button class="speak-btn" onclick="speak('${q.word}')">🔊 ${I18N.t('listen_word')}</button>`;
  document.getElementById('ex-body').innerHTML=`
    <div class="prompt-card">${visual}${listenBtn}
      <button class="mic-btn" id="mic" aria-label="${I18N.t('mic_aria_voice')}" onclick="toggleListen('${q.word.replace(/'/g,"\\'")}')">🎤</button>
      <p style="margin-top:14px;color:var(--ink-soft);font-size:.85rem">${I18N.t('mic_instruction')}</p>
      <div class="heard" id="heard"></div>${warn}
      <div style="display:flex;gap:10px;margin-top:20px;flex-wrap:wrap">
        <button class="btn-primary" style="flex:1" onclick="answer_feedback(true)">${I18N.t('said_correctly')}</button>
        <button class="btn-ghost" style="flex:1" onclick="answer_feedback(false,'')">${I18N.t('didnt_try')}</button>
      </div>
    </div>`;
}

function renderFluency(q){
  current._fluencyFound=[]; current._fluencyTarget=q;
  const warn = voiceSupported()?'' : `<div class="voice-warn">${I18N.t('voice_unsupported')}</div>`;
  document.getElementById('ex-body').innerHTML=`
    <div class="prompt-card">
      <div class="prompt-text">${I18N.t('fluency_prompt')}</div>
      <div class="prompt-main">${q.cat}</div>
      <button class="speak-btn" onclick="speak('${(I18N.t('fluency_prompt')+' '+q.cat).replace(/'/g,"\\'")}')">🔊 ${I18N.t('listen_instructions')}</button>
      <p style="color:var(--ink-soft);font-size:.9rem;margin-top:10px">${I18N.t('fluency_instruction')}</p>
      <button class="mic-btn" id="mic" aria-label="${I18N.t('mic_aria_fluency')}" onclick="toggleFluency()">🎤</button>
      <div class="word-chips" id="chips"></div>
      <div class="heard" id="heard"></div>${warn}
      <button class="btn-primary" style="margin-top:20px" onclick="finishFluencyItem()">${I18N.t('finish_category')}</button>
    </div>`;
}

function toggleListen(target){
  if(!voiceSupported())return;
  const mic=document.getElementById('mic'),heard=document.getElementById('heard');
  if(recognition){ stopRecognition(); mic.classList.remove('listening'); return; }
  recognition=new SR(); recognition.lang=(window.I18N && I18N.speechLocale()) || 'fr-FR'; recognition.interimResults=false; recognition.maxAlternatives=3;
  mic.classList.add('listening'); heard.innerHTML=I18N.t('listening_now');
  recognition.onresult=(e)=>{ const alts=[...e.results[0]].map(r=>r.transcript); const said=alts[0]; const ok=alts.some(a=>isCloseEnough(a,target)); heard.innerHTML=`${I18N.t('heard_label')} <b>« ${said} »</b>`; mic.classList.remove('listening'); stopRecognition(); setTimeout(()=>answer_feedback(ok, said),400); };
  recognition.onerror=(e)=>{ heard.innerHTML=`<span style="color:var(--error)">${I18N.t('mic_unavailable')} (${e.error}). ${I18N.t('validate_manually')}</span>`; mic.classList.remove('listening'); stopRecognition(); };
  recognition.onend=()=>{ mic.classList.remove('listening'); };
  recognition.start();
}

function toggleFluency(){
  if(!voiceSupported())return;
  const mic=document.getElementById('mic'),heard=document.getElementById('heard');
  if(recognition){ stopRecognition(); mic.classList.remove('listening'); heard.textContent=''; return; }
  recognition=new SR(); recognition.lang=(window.I18N && I18N.speechLocale()) || 'fr-FR'; recognition.interimResults=true; recognition.continuous=true;
  mic.classList.add('listening'); heard.innerHTML=I18N.t('listening_words');
  recognition.onresult=(e)=>{ for(let i=e.resultIndex;i<e.results.length;i++){ if(e.results[i].isFinal){ normalize(e.results[i][0].transcript).split(/\s+/).forEach(w=>registerFluencyWord(w)); } } };
  recognition.onerror=(e)=>{ heard.innerHTML=`<span style="color:var(--error)">${I18N.t('mic_unavailable')} (${e.error}).</span>`; mic.classList.remove('listening'); stopRecognition(); };
  recognition.start();
}
function registerFluencyWord(w){
  if(!w)return; const c=current,t=c._fluencyTarget;
  const matched=t.accept.find(a=>isCloseEnough(w,a));
  if(matched && !c._fluencyFound.includes(matched)){
    c._fluencyFound.push(matched);
    const chip=document.createElement('span'); chip.className='chip'; chip.textContent=matched; document.getElementById('chips').appendChild(chip);
    document.getElementById('ai-message').textContent=I18N.t('words_found', c._fluencyFound.length);
  }
}
function finishFluencyItem(){
  stopRecognition();
  const c=current,n=c._fluencyFound.length, goal={1:4,2:5,3:6}[user.level], ok=n>=goal;
  AI.record('fluence', c._fluencyTarget.cat, ok); // apprentissage par catégorie
  if(ok){c.sessionCorrect++;c.correctInRow++;c.wrongInRow=0;}
  else {
    c.wrongInRow++;c.correctInRow=0;
    // v4 : peu/pas de mots trouvés -> se rapproche d'une difficulté d'accès au mot (sémantique)
    const category = n===0 ? AI.recordError('fluence', c._fluencyTarget.cat, '') : AI.recordError('fluence', c._fluencyTarget.cat, 'partiel');
    Store.logError(userCode, { exercise:'fluence', category, target:c._fluencyTarget.cat, given:n+' mot(s)', level:user.level });
  }
  const fb=document.getElementById('ex-feedback');
  fb.textContent= ok?I18N.t('fluency_success', n):I18N.t('fluency_more', n);
  fb.className='feedback '+(ok?'good':'bad');
  adaptDifficulty(); setTimeout(nextQuestion,1400);
}

function checkChoice(btn,chosen,answer){
  document.querySelectorAll('.choice').forEach(b=>b.disabled=true);
  const ok=chosen===answer;
  current._given = chosen; // v4 : mémorise la réponse donnée, même si fausse
  if(ok)btn.classList.add('correct'); else{ btn.classList.add('wrong'); document.querySelectorAll('.choice').forEach(b=>{if(b.textContent===answer)b.classList.add('correct');}); }
  answer_feedback(ok);
}
async function answer_feedback(ok, given){
  stopRecognition();
  const fb=document.getElementById('ex-feedback'),c=current;
  // APPRENTISSAGE : on enregistre la réponse (type + cible) dans le profil
  AI.record(c.type, c._target, ok);
  if(ok){
    c.sessionCorrect++; c.correctInRow++; c.wrongInRow=0;
    fb.textContent=I18N.rand('correct_feedback');
    fb.className='feedback good';
    Companion.say(c.correctInRow>=3 ? 'streak' : 'correct');
  }
  else{
    c.wrongInRow++; c.correctInRow=0; fb.textContent=I18N.t('wrong_feedback'); fb.className='feedback bad';
    Companion.say('encourage');
    // v4 : ANALYSE DES ERREURS — catégorise et journalise (piste pour l'orthophoniste)
    const givenAnswer = (given!==undefined) ? given : c._given;
    const category = AI.recordError(c.type, c._target, givenAnswer);
    Store.logError(userCode, { exercise:c.type, category, target:c._target, given:givenAnswer||'', level:user.level });
  }
  adaptDifficulty(); setTimeout(nextQuestion, ok?900:1500);
}
function adaptDifficulty(){
  const c=current,ai=document.getElementById('ai-message');
  // v5 : signal de fatigue (série d'échecs) — prioritaire sur le message habituel
  const fatigue = AI.fatigueSignal(c.wrongInRow);
  if(fatigue.level==='high'){
    if(user.level>1){ user.level--; c.wrongInRow=0; }
    ai.textContent = fatigue.message;
    return;
  }
  if(c.correctInRow>=2 && user.level<3){ user.level++; c.correctInRow=0; ai.textContent=I18N.t('level_up_msg', levelName(user.level)); }
  else if(c.wrongInRow>=2 && user.level>1){ user.level--; c.wrongInRow=0; ai.textContent=I18N.t('level_down_msg', levelName(user.level)); }
  else ai.textContent=I18N.t('level_steady_msg', levelName(user.level));
}
function nextQuestion(){ const c=current; c.index++; if(c.index>=c.total){ finishExercise(); return; } renderQuestion(); }

async function finishExercise(){
  const c=current;
  user.sessions++; user.correct+=c.sessionCorrect; user.total+=c.total;
  // PERSISTANCE : dossier + journal + profil d'apprentissage
  await Store.savePatient(userCode, user);
  await Store.logSession(userCode, { type:c.type, score:c.sessionCorrect, total:c.total, level:user.level });
  await Store.saveProfile(userCode, AI.dump());

  document.getElementById('ex-progress').style.width='100%';
  const pct=Math.round(100*c.sessionCorrect/c.total);
  Companion.say(pct>=70 ? 'sessionEnd_high' : pct>=40 ? 'sessionEnd_mid' : 'sessionEnd_low');
  document.getElementById('ex-body').innerHTML=`
    <div class="prompt-card">
      <div class="prompt-emoji">${pct>=70?'🌟':'🌱'}</div>
      <div class="prompt-main">${I18N.t('session_done')}</div>
      <div class="prompt-text">${I18N.t('session_result', c.sessionCorrect, c.total)}</div>
      <div class="level-badge" style="margin:18px auto 0">${I18N.t('level_reached')} ${levelName(user.level)}</div>
      <div class="ai-note" style="text-align:left;margin-top:18px"><span>🤖</span><div><b>${I18N.t('assistant_learned')}</b>${AI.insight()}</div></div>
      <p style="margin-top:14px;color:var(--ink-soft);font-size:.82rem">${I18N.t('progress_saved', Store.mode())}</p>
      <button class="btn-primary" style="margin-top:18px" onclick="goDashboard()">${I18N.t('back_to_home')}</button>
    </div>`;
  document.getElementById('ex-feedback').textContent='';
  document.getElementById('ai-message').textContent= pct>=70?I18N.t('session_good_msg'):I18N.t('session_soft_msg');
}

// Exposer les fonctions appelées depuis le HTML
Object.assign(window, {login,createNewPatient,dismissCodeBanner,logout,goDashboard,startExercise,checkChoice,answer_feedback,toggleListen,toggleFluency,finishFluencyItem,speak,uploadMedia,deleteMedia,toggleReminder,saveReminderEmail,playKabWordUI,showPricing,startCheckout,generateCaregiverAccess,revokeCaregiverAccess,renderCaregiverSection,openMySummary});
