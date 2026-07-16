// =====================================================================
//  APPLICATION PRINCIPALE
// =====================================================================
const BANK = window.BANK;
const Store = window.ReParoleStore;
const AI = window.Learner;   // moteur d'apprentissage (alias pour éviter toute collision)
function levelName(n){ return I18N.t('level_'+n); } // v6.9 : remplace l'ancien objet LEVEL_NAMES codé en dur en français

// =====================================================================
//  v6.38 — BASE DE CONNAISSANCES COMMUNAUTAIRE (fusion au démarrage)
//  ---------------------------------------------------------------------
//  Ajoute les contributions déjà validées par un·e administrateur·rice
//  (voir contribuer.html / admin.html / sql/schema.sql) aux banques déjà
//  chargées. Portée volontairement limitée pour l'instant : seul
//  BANK_KAB.denomination existe structurellement (titre, consigne déjà
//  définis) — une contribution "completion"/"comprehension" en kabyle
//  reste validée et conservée en base, mais n'apparaît pas encore dans
//  l'app tant qu'un ajout de code (comme pour le brouillon
//  docs/kabyle-completion-draft.md) n'a pas défini cette structure.
//  No-op silencieux en mode navigateur (pas de base partagée sans
//  compte cloud) — voir Store.loadApprovedContent.
// =====================================================================
async function mergeApprovedContent(){
  if(!window.ReParoleStore || Store.mode()!=='cloud') return;
  if(!window.BANK_KAB || !window.BANK_KAB.denomination) return;
  let items;
  try{ items = await Store.loadApprovedContent('kab', 'denomination'); }
  catch(e){ console.warn('mergeApprovedContent:', e.message); return; }
  for(const it of items){
    if(it.kind !== 'vocabulary') continue; // les phrases restent hors fusion automatique (voir plus haut)
    const lvl = it.level || 1;
    const list = BANK_KAB.denomination.items;
    if(!list[lvl]) list[lvl] = [];
    const p = it.payload;
    if(p && p.emoji && p.answer && Array.isArray(p.choices)) list[lvl].push(p);
  }
}
mergeApprovedContent();

// =====================================================================
//  v6.43 — MOTS PERSONNALISÉS PROPOSÉS PAR L'AIDANT (fusion par patient)
//  ---------------------------------------------------------------------
//  Contrairement à mergeApprovedContent() (base commune, par langue),
//  ceci est propre à CE patient : les mots que son aidant a proposés
//  via aidant.html, intégrés sans validation admin (décision assumée,
//  voir sql/schema.sql). Fusionnés dans la banque de dénomination de
//  la langue actuellement active, au niveau courant du patient — avec
//  des distracteurs tirés du vocabulaire déjà présent à ce niveau (donc
//  déjà vérifié), jamais inventés à la volée.
// =====================================================================
async function mergeCaregiverWords(){
  if(!window.ReParoleStore || !userCode || !user) return;
  let words;
  try{ words = await Store.loadCaregiverWords(userCode); }
  catch(e){ console.warn('mergeCaregiverWords:', e.message); return; }
  if(!words || !words.length) return;

  const lang = (window.Prefs && Prefs.data.lang) || 'fr';
  const targetBank = (lang!=='fr' && window['BANK_'+lang.toUpperCase()]) ? window['BANK_'+lang.toUpperCase()] : window.BANK;
  const lvl = user.level || 2;

  // v6.133 : un mot suggéré par l'aidant n'apparaissait jusqu'ici que
  // dans la dénomination (point 16 de la demande d'amélioration) — il
  // est maintenant aussi proposé en "nommer à voix haute", qui utilise
  // le même mot/émoji sans avoir besoin de distracteurs ni de
  // construire une phrase (contrairement à la complétion, qui
  // demanderait de connaître la nature grammaticale du mot pour rester
  // fiable — pas fait ici pour cette raison).
  if(targetBank && targetBank.denomination && targetBank.denomination.items[lvl]){
    const items = targetBank.denomination.items[lvl];
    words.forEach(w=>{
      const word = (w.word||'').trim().toUpperCase();
      if(!word) return;
      if(items.some(it=>it.answer===word)) return; // déjà présent, on ne duplique pas
      const pool = items.map(it=>it.answer).filter(a=>a!==word);
      const distractors = pool.sort(()=>Math.random()-0.5).slice(0,2);
      if(distractors.length < 2) return; // pas assez de vocabulaire existant pour générer des distracteurs sûrs
      items.push({ emoji: w.emoji || '💬', answer: word, choices: [word, ...distractors].sort(()=>Math.random()-0.5) });
    });
  }
  if(targetBank && targetBank.denomination_orale && targetBank.denomination_orale.items[lvl]){
    const oralItems = targetBank.denomination_orale.items[lvl];
    words.forEach(w=>{
      const word = (w.word||'').trim().toUpperCase();
      if(!word) return;
      if(oralItems.some(it=>it.word===word)) return;
      oralItems.push({ emoji: w.emoji || '💬', word });
    });
  }
}

let user = null;        // dossier du patient connecté
let userCode = null;    // son code de suivi
let current = null;     // exercice en cours
let currentFavorites = []; // v6.72 : mots favoris de l'exercice en cours (cache local, voir startExercise)

// =====================================================================
//  v6.24 — STRUCTURE GRATUIT / PRO (pas de paiement branché)
//  ---------------------------------------------------------------------
//  Décision explicite de l'utilisateur : la structure doit exister et
//  fonctionner, mais aucun système de paiement n'est activé pour
//  l'instant. Le passage en 'pro' se fait à la main dans Supabase (voir
//  sql/schema.sql) en attendant un vrai système de facturation.
//
//  v6.155 : répartition revue avec l'utilisateur, en discutant du prix
//  (10 €/mois retenu). VRAIE INCOHÉRENCE trouvée dans l'ancienne
//  répartition : FREE_LANGS ne couvrait QUE le français — verrouillant
//  tout le travail multilingue (14 langues, la vraie différence de ce
//  projet) derrière le payant, à l'exact inverse de l'objectif
//  "accessible à tous" pour le public visé en priorité (personnes ne
//  parlant pas français, souvent le budget le plus limité). Toutes les
//  langues sont maintenant gratuites — seuls les exercices les plus
//  coûteux à faire tourner (vocaux + conversation) restent payants,
//  aligné sur de vrais coûts plutôt qu'une langue parlée.
//
//  Ces 3 constantes sont volontairement regroupées ici pour être
//  faciles à ajuster plus tard sans devoir chercher dans tout le code :
// =====================================================================
const FREE_DAILY_SESSION_LIMIT = 5;   // séances/jour, tous exercices confondus
const FREE_LANGS = ['fr','en','es','it','pt','de','ar','tr','pl','ja','kab','dz','ma','tn']; // v6.155 : toutes les langues sont gratuites — voir le commentaire ci-dessus
const PRO_ONLY_TYPES = ['repetition','denomination_orale','fluence','intonation','conversation']; // exercices vocaux avancés + conversation guidée
const FREE_QUESTIONS_PER_SESSION = 5; // v6.55 : plafond de questions par session en compte gratuit (indépendant du mode "séance courte", qui reste un choix du patient)

// v6.33 — INTERRUPTEUR PAYWALL (décision utilisateur du 7 juillet) :
// tout devait être accessible en attendant que Stripe soit configuré.
// v6.54 : Stripe configuré, repassé à `true` pour tester le parcours
// de paiement réel (mode test Stripe).
// v6.58 : repassé à `false` sur demande explicite de l'utilisateur
// ("débranche le mode payant pour l'instant") — décision volontaire,
// pas un retour en arrière technique. Toute la structure gratuit/pro
// (Stripe, CGV/CGU, Customer Portal...) reste intacte et prête à être
// réactivée d'un coup en repassant ce booléen à `true`.
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
// v6.146 : signalé par l'utilisateur ("possibilité de pas faire
// apparaître les nouveaux exercices que l'on peut pas traduire en
// arabe ?") — contrairement aux exercices classiques (un mot isolé,
// facile à traduire) ou "Associer les images" (des émojis,
// universels), "Structure de phrase" et "Lire et comprendre"
// reposent sur de vraies phrases françaises : sans traduction pour la
// langue active, le contenu retombait en français avec juste un
// bandeau d'avertissement — exactement le mélange de langues déjà
// signalé plusieurs fois. Plutôt que d'afficher la tuile et gérer le
// repli après coup, elle est maintenant masquée entièrement si aucun
// contenu traduit n'existe pour la langue en cours.
// v6.149 : "rhyme" (Rimes) rejoint la liste — capture d'écran à
// l'appui, l'utilisateur a confirmé que le résultat visible (du
// français dans une interface en darija) compte plus que la raison
// technique. Contrairement à v6.146 où je pensais distinguer "manque
// de traduction" (syntax/story) et "limite universelle intraduisible"
// (rhyme, aucune langue n'a de rimes traduites, pas même les 9
// langues complètes) — dans les deux cas le patient voit la même
// chose : du français là où il ne l'attend pas. hasTranslatedContent()
// gère déjà ce cas uniformément (aucune langue n'a BANK_XX.rhyme),
// donc "rhyme" est masqué pour toutes les langues non françaises,
// pas seulement les 4 partielles.
const FRENCH_ONLY_EXERCISE_TYPES = ['syntax', 'story', 'rhyme', 'heure', 'monnaie', 'calcul_quotidien', 'comparaison_nombres', 'prix']; // v6.159 : les 5 exercices d'acalculie RESTENT dans cette liste — malentendu corrigé en testant : le nom est trompeur, cette liste ne veut pas dire "toujours français uniquement" mais "vérifier dynamiquement via hasTranslatedContent() si la langue active a du contenu". Les retirer désactive la vérification entièrement (affichage inconditionnel) plutôt que de laisser hasTranslatedContent() les afficher pour les 9 langues qui ont maintenant une vraie traduction et les masquer pour dz/ma/tn/kab qui n'en ont pas.
function hasTranslatedContent(type){
  const lang = (window.Prefs && Prefs.data.lang) || 'fr';
  if(lang === 'fr') return true;
  const langBank = window['BANK_'+lang.toUpperCase()];
  return !!(langBank && langBank[type]);
}
function updateExerciseLocks(){
  document.querySelectorAll('.ex-item[data-type]').forEach(el=>{
    const type = el.getAttribute('data-type');
    if(FRENCH_ONLY_EXERCISE_TYPES.includes(type)){
      el.style.display = hasTranslatedContent(type) ? '' : 'none';
    }
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
  // v6.56 : consentement légal obligatoire avant tout paiement — deux
  // cases distinctes, cochées activement par le patient (voir
  // cgv.html article 5 : sans cette action explicite, le délai de
  // rétractation de 14 jours s'applique de plein droit).
  const acceptCgv = document.getElementById('pricing-accept-cgv');
  const waiveWithdrawal = document.getElementById('pricing-waive-withdrawal');
  if(acceptCgv && !acceptCgv.checked){ errEl.textContent = I18N.t('pricing_must_accept_cgv'); return; }
  if(waiveWithdrawal && !waiveWithdrawal.checked){ errEl.textContent = I18N.t('pricing_must_waive_withdrawal'); return; }
  errEl.textContent = I18N.t('pricing_loading');
  const res = await Store.createCheckoutSession(planKey, userCode, 'patient');
  if(res.error){ errEl.textContent = I18N.t('pricing_error'); return; }
  window.location.href = res.url;
}

// v6.56 : résiliation "en 3 clics" — redirige vers le Customer Portal
// Stripe (factures, moyen de paiement, résiliation), géré nativement
// par Stripe plutôt que reconstruit dans l'app.
async function manageSubscription(){
  const errEl = document.getElementById('manage-subscription-error');
  // v6.56 : il faut l'identifiant CLIENT STRIPE (stripe_customer_id,
  // enregistré sur la ligne patient par stripe-webhook au moment du
  // paiement), pas le code de suivi de l'app — Stripe ne connaît pas
  // ce dernier. Un compte pro légitime l'a toujours (impossible de
  // devenir pro sans passer par un paiement Stripe qui le renseigne),
  // mais on reste défensif si jamais ce n'est pas le cas.
  if(!user || !user.stripe_customer_id){
    errEl.textContent = I18N.t('pricing_error');
    return;
  }
  errEl.textContent = I18N.t('pricing_loading');
  const returnUrl = window.location.origin + window.location.pathname;
  const res = await Store.createPortalSession(user.stripe_customer_id, returnUrl);
  if(res.error){ errEl.textContent = I18N.t('pricing_error'); return; }
  window.location.href = res.url;
}

/* ---------- Synthèse vocale : lire les consignes à voix haute ---------- */
// =====================================================================
//  v6.92 — VRAI BUG CORRIGÉ : le son ne fonctionnait pas dans certaines
//  langues (signalé pour l'arabe, très probablement d'autres aussi)
//  ---------------------------------------------------------------------
//  Deux causes réelles trouvées, aucune des deux gérée jusqu'ici :
//
//  1. speechSynthesis.getVoices() renvoie souvent un tableau VIDE au
//     tout premier appel — la vraie liste se charge en arrière-plan et
//     n'est prête qu'après l'évènement "voiceschanged". Sans gérer ça,
//     un premier clic sur "écouter" juste après le chargement de la
//     page pouvait échouer silencieusement, pour n'importe quelle
//     langue, pas seulement l'arabe.
//  2. Aucune vérification qu'une voix existe réellement pour la langue
//     choisie. Contrairement au français/anglais (quasi toujours
//     disponibles), une voix arabe (ou dans d'autres langues) n'est
//     pas installée sur tous les appareils/navigateurs — Web Speech
//     API dépend entièrement des voix fournies par le système
//     d'exploitation, ce que l'app ne contrôle pas. Avant ce correctif :
//     aucun son, aucune erreur visible, impossible de savoir pourquoi.
//     Désormais : message clair si aucune voix n'est disponible, au
//     lieu d'un silence trompeur (même principe que l'audio kabyle/
//     sango, voir playPartialLangWordUI).
//
//  Sert aussi de base au choix de voix (homme/femme/autre) demandé —
//  voir renderVoiceSelector() plus bas : Web Speech API n'expose pas
//  officiellement le genre d'une voix (aucune propriété fiable
//  cross-navigateur pour ça), donc pas de tri homme/femme automatique
//  garanti — mais la personne peut choisir librement parmi toutes les
//  voix que son appareil propose pour la langue active, et leurs noms
//  indiquent généralement le genre (ex. "Microsoft David" / "Microsoft
//  Zira" sur Windows, "Google UK English Male/Female" sur Chrome).
// =====================================================================
let _voicesCache = [];
let _voicesReady = false;
function loadVoices(){
  if(!('speechSynthesis' in window)) return Promise.resolve([]);
  return new Promise(resolve=>{
    const existing = window.speechSynthesis.getVoices();
    if(existing.length){ _voicesCache = existing; _voicesReady = true; resolve(existing); return; }
    let resolved = false;
    window.speechSynthesis.onvoiceschanged = ()=>{
      if(resolved) return;
      const v = window.speechSynthesis.getVoices();
      if(v.length){ resolved = true; _voicesCache = v; _voicesReady = true; resolve(v); }
    };
    // filet de sécurité : certains navigateurs ne déclenchent jamais
    // l'évènement si la liste reste réellement vide (aucune voix du tout).
    setTimeout(()=>{
      if(resolved) return;
      resolved = true; _voicesCache = window.speechSynthesis.getVoices(); _voicesReady = true;
      resolve(_voicesCache);
    }, 1000);
  });
}
function currentLangVoicePrefix(){
  const locale = (window.I18N && I18N.speechLocale()) || 'fr-FR';
  return locale.split('-')[0].toLowerCase(); // 'ar-SA' -> 'ar'
}
function voicesForLangPrefix(prefix){
  return _voicesCache.filter(v => v.lang && v.lang.toLowerCase().startsWith(prefix));
}
function pickVoiceForSpeech(){
  const candidates = voicesForLangPrefix(currentLangVoicePrefix());
  if(!candidates.length) return null;
  const savedURI = window.Prefs && Prefs.data.voiceURI;
  if(savedURI){
    const match = candidates.find(v => v.voiceURI === savedURI);
    if(match) return match;
  }
  return candidates[0];
}
// v6.150 : même fonction de hachage (FNV-1a, 32 bits) que
// scripts/generate-voice-audio.js — DOIT rester identique dans les
// deux fichiers, c'est ce qui permet de retrouver le bon fichier
// audio pour un texte donné sans avoir besoin d'un index séparé à
// tenir à jour à chaque ajout de contenu.
function fnv1aHash(str){
  let hash = 0x811c9dc5;
  for(let i=0;i<str.length;i++){
    hash ^= str.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(36);
}
let _cloudAudio = null; // instance <audio> réutilisée, pour pouvoir l'interrompre proprement au prochain speak()

function speakBrowserTTS(text){
  if(!('speechSynthesis' in window)) return;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = (window.I18N && I18N.speechLocale()) || 'fr-FR'; // v6.9 : locale selon la langue active
  u.rate = 0.95;
  const voice = pickVoiceForSpeech();
  const statusEl = document.getElementById('voice-select-status');
  if(voice){
    u.voice = voice;
    if(statusEl) statusEl.textContent = '';
  } else if(_voicesReady){
    // Voix chargées, vraiment aucune ne correspond à cette langue —
    // message honnête plutôt qu'un silence inexpliqué.
    if(statusEl){ statusEl.textContent = I18N.t('voice_none_available'); statusEl.style.color = 'var(--error)'; }
  }
  window.speechSynthesis.speak(u);
}

// v6.150 : essaie d'abord un fichier audio pré-généré (voix cloud de
// bien meilleure qualité que les voix système, voir
// scripts/generate-voice-audio.js), et ne repasse sur la synthèse
// vocale du navigateur QUE si ce fichier n'existe pas — ce qui reste
// le cas normal pour : le texte de bilan téléversé par le patient
// (dynamique par nature, jamais pré-généré volontairement), les
// langues partielles (dz/ma/tn/kab/sg, pas encore de voix cloud
// prévues), et tant que le dossier audio/ n'a pas été rempli.
// Comportement inchangé pour tout le reste de l'app : un seul point
// d'entrée (speak()), personne d'autre à modifier.
function speak(text){
  if(_cloudAudio){ _cloudAudio.pause(); _cloudAudio = null; }
  const lang = (window.Prefs && Prefs.data.lang) || 'fr';
  const path = `audio/${lang}/${fnv1aHash(text)}.mp3`;
  const audio = new Audio(path);
  _cloudAudio = audio;
  let settled = false; // v6.150 : évite un double repli si error + le filet de sécurité se déclenchent tous les deux
  const fallback = ()=>{ if(!settled){ settled = true; speakBrowserTTS(text); } };
  audio.addEventListener('canplaythrough', ()=>{ settled = true; audio.play().catch(fallback); }, { once:true });
  audio.addEventListener('error', fallback, { once:true });
  // Filet de sécurité : une requête réseau qui traîne (connexion
  // lente, serveur qui ne répond pas) ne doit jamais laisser le
  // patient sans rien entendre — après 2,5s sans résolution dans un
  // sens ou l'autre, on retombe sur la synthèse du navigateur.
  setTimeout(fallback, 2500);
}

/* ---------- v6.92 : choix de la voix (parmi celles dispo pour la langue active) ---------- */
async function renderVoiceSelector(){
  const container = document.getElementById('voice-selector-container');
  if(!container) return;
  if(!('speechSynthesis' in window)){ container.style.display = 'none'; return; }
  container.style.display = '';
  await loadVoices();
  const select = document.getElementById('voice-select');
  const statusEl = document.getElementById('voice-select-status');
  const candidates = voicesForLangPrefix(currentLangVoicePrefix());
  if(statusEl){ statusEl.textContent = ''; statusEl.style.color = ''; }
  if(!candidates.length){
    if(select) select.style.display = 'none';
    if(statusEl){ statusEl.textContent = I18N.t('voice_none_available'); statusEl.style.color = 'var(--error)'; }
    return;
  }
  if(select){
    select.style.display = '';
    const savedURI = window.Prefs && Prefs.data.voiceURI;
    select.innerHTML = candidates.map(v =>
      `<option value="${v.voiceURI.replace(/"/g,'&quot;')}"${v.voiceURI===savedURI?' selected':''}>${escapeHTML(v.name)}</option>`
    ).join('');
  }
}
function setPreferredVoice(voiceURI){
  if(window.Prefs){ Prefs.data.voiceURI = voiceURI; Prefs.save(); }
}

let lastGapDays = 0; // v6.11 : nb de jours d'absence détectés à la dernière connexion (0 = aucun)
let _frequentErrorWords = new Set(); // v6.131 : mots en difficulté récente, rechargé à chaque début de séance
let _reducedSessionRequested = false; // v6.131 : "Je n'ai pas la force aujourd'hui" — se consomme après une seule séance

// v6.131 : bouton dashboard "Je n'ai pas la force aujourd'hui" (point 14) —
// démarre directement une séance de dénomination réduite (2 questions
// faciles) plutôt que de laisser la personne abandonner un jour difficile,
// ou pire, ne pas ouvrir l'app du tout. Dénomination choisie comme type
// par défaut : c'est le premier exercice proposé, le plus universellement
// disponible (BANK.denomination.items[1] existe toujours).
function startReducedSession(){
  _reducedSessionRequested = true;
  startExercise('denomination');
}

// =====================================================================
//  v6.129 — RECONNEXION SILENCIEUSE (v6.71 restaurée, sans interface)
//  ---------------------------------------------------------------------
//  Historique : la v6.71 mémorisait les profils dans localStorage avec
//  une liste de boutons visible sur l'écran de connexion. Retiré en
//  v6.127 sur un premier retour de l'utilisateur, remplacé par
//  sessionStorage seul (continuité pendant un onglet ouvert). Précision
//  ensuite : la mémorisation permanente peut rester, à condition de ne
//  RIEN afficher sur l'écran d'accueil — uniquement une reconnexion
//  silencieuse en arrière-plan.
//
//  Deux mécanismes, combinés dans attemptAutoLogin() :
//   1. sessionStorage (l'onglet en cours) — priorité : couvre le cas
//      d'un appareil partagé où on ne veut PAS reconnecter
//      automatiquement n'importe qui, mais où la personne EN TRAIN
//      d'utiliser l'app ne doit pas perdre sa place en rafraîchissant.
//   2. localStorage (permanent, jusqu'à déconnexion) — utilisé
//      seulement s'il n'y a EXACTEMENT qu'un profil mémorisé sur cet
//      appareil (sinon, appareil probablement partagé : on ne devine
//      pas qui se connecte, écran de connexion normal).
//  Dans les deux cas : aucune liste, aucun bouton, rien de visible.
// =====================================================================
const ACTIVE_SESSION_KEY = 'reparole:active-session';
// v6.139 : stocke {code, name} plutôt qu'un simple code — nécessaire
// depuis que login() exige un prénom (voir plus bas) : la reconnexion
// automatique doit pouvoir remplir les deux champs, pas seulement le
// code, sans quoi elle échouerait systématiquement sur ce nouveau
// contrôle.
function rememberActiveSession(code, name){
  try{ sessionStorage.setItem(ACTIVE_SESSION_KEY, JSON.stringify({ code, name:name||'' })); }catch(e){}
}
function forgetActiveSession(){
  try{ sessionStorage.removeItem(ACTIVE_SESSION_KEY); }catch(e){}
}

const REMEMBERED_PROFILES_KEY = 'reparole:remembered-profiles';
function loadRememberedProfiles(){
  try{ return JSON.parse(localStorage.getItem(REMEMBERED_PROFILES_KEY)||'[]'); }
  catch(e){ return []; }
}
function saveRememberedProfiles(list){
  try{ localStorage.setItem(REMEMBERED_PROFILES_KEY, JSON.stringify(list)); }catch(e){}
}
// Ajoute/déplace le profil actuel en tête de liste — appelé juste après
// une connexion réussie. Limité à 6 pour repérer un appareil partagé
// (au-delà de 1 profil, on ne reconnecte plus automatiquement).
// Volontairement AUCUN rendu visuel associé — voir commentaire plus haut.
function rememberCurrentProfile(){
  if(!userCode || !user) return;
  const list = loadRememberedProfiles().filter(p=>p.code!==userCode);
  list.unshift({ code:userCode, name:user.name||'', at:new Date().toISOString() });
  saveRememberedProfiles(list.slice(0,6));
}
function forgetRememberedProfile(code){
  saveRememberedProfiles(loadRememberedProfiles().filter(p=>p.code!==code));
}

async function attemptAutoLogin(){
  let code = null, name = null;
  try{
    const raw = sessionStorage.getItem(ACTIVE_SESSION_KEY);
    if(raw){ const parsed = JSON.parse(raw); code = parsed.code; name = parsed.name; }
  }catch(e){}
  if(!code){
    const remembered = loadRememberedProfiles();
    if(remembered.length === 1 && remembered[0] && remembered[0].code){
      code = remembered[0].code;
      name = remembered[0].name;
    }
  }
  try{
    if(code){
      const codeEl = document.getElementById('code');
      const nameEl = document.getElementById('name');
      if(codeEl) codeEl.value = code;
      if(nameEl && name) nameEl.value = name;
      await login();
      return true;
    }
    return false;
  } finally {
    // v6.136 : que la reconnexion ait réussi, échoué, ou qu'il n'y en
    // ait pas eu, l'indicateur de chargement (voir index.html) ne
    // doit jamais rester affiché indéfiniment.
    document.documentElement.classList.remove('auto-login-pending');
  }
}
/* ---------- Connexion ---------- */
// v6.130 : retour de test utilisateur réel (3 adultes + 1 enfant) —
// seul reproche relevé : devoir copier-coller le code de suivi (long,
// aléatoire) est une manipulation tactile pénible sur mobile pour ce
// public. Bouton "Coller" à côté du champ : un seul geste plutôt que
// sélectionner-copier-revenir-coller. Le champ code est aussi passé de
// type="password" (masqué) à du texte visible en police à chasse fixe,
// pour pouvoir vérifier visuellement ce qu'on vient de coller — le
// code n'est pas un secret cryptographique (voir js/storage.js), le
// masquer n'apportait pas de sécurité réelle, seulement de la friction.
async function pasteCode(){
  const codeEl = document.getElementById('code');
  if(!codeEl) return;
  try{
    const text = await navigator.clipboard.readText();
    if(text) codeEl.value = text.trim();
  }catch(e){
    // Permission refusée, presse-papiers vide, ou API non disponible
    // (ex. contexte non sécurisé) — on laisse simplement la personne
    // coller à la main, pas d'erreur bloquante pour un geste de confort.
    codeEl.focus();
  }
}

async function login(){
  // v6.135 : VRAI BUG CORRIGÉ, signalé par l'utilisateur — laisser le
  // champ prénom vide connectait quand même (normal, le code seul est
  // l'identifiant réel), MAIS le repli sur 'Marie' ci-dessous (retiré)
  // pouvait alors écraser silencieusement le vrai prénom déjà
  // enregistré, puisque 'Marie' n'est jamais une chaîne vide et
  // déclenchait donc la mise à jour ci-dessous. Un champ vide doit
  // simplement ne rien changer au prénom déjà connu.
  //
  // v6.139 : précision de l'utilisateur après la v6.135 — un code doit
  // toujours être associé à un prénom, y compris pour se reconnecter,
  // pas seulement pour créer un dossier. Le prénom est donc redevenu
  // obligatoire ici aussi. Ça ne casse pas la reconnexion automatique
  // (v6.126-129) : attemptAutoLogin() remplit maintenant les deux
  // champs (code ET prénom), jamais un seul.
  const name = document.getElementById('name').value.trim();
  const code = document.getElementById('code').value.trim();
  if(!code){ document.getElementById('login-error').textContent = I18N.t('login_no_code'); return; }
  if(!name){ document.getElementById('login-error').textContent = I18N.t('login_name_required'); return; }
  userCode = code;
  const existing = await Store.loadPatient(code);

  if(existing){
    // v6.141 : VRAI BUG CORRIGÉ, signalé par l'utilisateur — un
    // prénom quelconque était accepté avec le bon code, et écrasait
    // même silencieusement le vrai prénom déjà enregistré (voir
    // l'ancienne ligne juste en dessous, retirée : "if(name &&
    // name!==existing.name){ user.name = name; }"). "Un code = un
    // prénom" : le prénom saisi doit maintenant correspondre à celui
    // du dossier, sans quoi la connexion est refusée — comparaison
    // insensible à la casse/aux espaces pour rester tolérant aux
    // petites variations de saisie (comme le mot de confirmation de
    // la suppression de compte, voir deleteMyAccount()), mais pas à
    // un prénom différent. Ne bloque pas si le dossier n'a
    // exceptionnellement aucun prénom enregistré (ancien
    // enregistrement corrompu, par exemple) : ce cas ne doit pas
    // enfermer quelqu'un hors de son propre dossier.
    if(existing.name && name.toLowerCase() !== existing.name.trim().toLowerCase()){
      document.getElementById('login-error').textContent = I18N.t('login_name_mismatch');
      return;
    }
    // Patient connu : on recharge dossier + profil d'apprentissage
    user = existing;

    // v6.132 : niveau par type d'exercice — migration silencieuse pour
    // les dossiers existants (aucun user.levels enregistré avant cette
    // version) : chaque type démarre au niveau scalaire déjà connu,
    // plutôt que de repartir de zéro. Un type déjà présent dans
    // user.levels (relecture d'un dossier déjà migré) n'est jamais
    // écrasé ici.
    user.levels = user.levels || {};
    user.levelAttempts = user.levelAttempts || {};
    Object.keys(BANK).forEach(type=>{
      if(user.levels[type] == null) user.levels[type] = user.level || 2;
      if(user.levelAttempts[type] == null) user.levelAttempts[type] = 0;
    });

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
    rememberActiveSession(userCode, user.name);
    rememberCurrentProfile();
    Store.logConnection(userCode); // v6.128 : compteur admin, aucun nom stocké — voir sql/schema.sql
    await renderDashboard();
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
  // v6.135 : même bug que login() — 'Marie' n'était que le texte
  // d'exemple du champ (field_name_ph), jamais censé être utilisé
  // comme vrai prénom silencieusement. Pour un NOUVEAU dossier, un
  // prénom réel est demandé explicitement plutôt que d'attribuer par
  // défaut le prénom d'exemple à un∙e inconnu∙e.
  const name = document.getElementById('name').value.trim();
  if(!name){ document.getElementById('login-error').textContent = I18N.t('new_patient_name_required'); return; }
  userCode = Store.generateCode();
  justCreatedCode = userCode;
  // v6.24 : structure gratuit/pro — pas de paiement branché, activation
  // manuelle pour l'instant (voir sql/schema.sql). Tout nouveau dossier
  // démarre en 'free'.
  user = { name, level:2, sessions:0, correct:0, total:0, streak:1, plan:'free' };
  show('assessment');
  Assessment.start(async ({ seed, level })=>{
    user.level = level;
    // v6.132 : niveau par type d'exercice — tous les types démarrent au
    // niveau déterminé par le bilan initial, comme le niveau scalaire.
    user.levels = {};
    user.levelAttempts = {};
    Object.keys(BANK).forEach(type=>{ user.levels[type] = level; user.levelAttempts[type] = 0; });
    AI.load(seed);                          // l'IA démarre avec le profil du bilan
    await Store.savePatient(userCode, user);
    await Store.saveLevels(userCode, user.levels, user.levelAttempts);
    await Store.saveProfile(userCode, AI.dump());
    document.getElementById('who-name').textContent = user.name;
    rememberActiveSession(userCode, user.name);
    rememberCurrentProfile();
    Store.logConnection(userCode); // v6.128 : compteur admin, aucun nom stocké — voir sql/schema.sql
    await renderDashboard();
    show('dashboard');
  });
}
let justCreatedCode = null; // v6 : sert à afficher le code une seule fois après création
function logout(){ stopRecognition(); window.speechSynthesis?.cancel(); const code=userCode; user=null; userCode=null; forgetActiveSession(); if(code) forgetRememberedProfile(code); show('login'); }
async function goDashboard(){ stopRecognition(); await renderDashboard(); show('dashboard'); }
function show(id){ document.querySelectorAll('.screen').forEach(s=>s.classList.remove('active')); document.getElementById(id).classList.add('active'); window.scrollTo(0,0); }

async function renderDashboard(){
  await mergeCaregiverWords();
  renderWordsToReview();
  if(typeof renderVoiceSelector==='function') renderVoiceSelector();
  await renderVisibleNotes();
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
  // v6.56 : carte "Gérer mon abonnement" — visible seulement pour un
  // compte pro avec le paywall actif (sinon rien à gérer/résilier).
  const manageCard = document.getElementById('manage-subscription-card');
  if(manageCard) manageCard.style.display = (PAYWALL_ENABLED && isPro()) ? '' : 'none';

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
      const msg = trend.direction==='hausse' ? I18N.t('trend_up', trend.deltaPct)
        : trend.direction==='baisse' ? I18N.t('trend_down', trend.deltaPct)
        : trend.direction==='stable' ? I18N.t('trend_stable')
        : I18N.t('trend_not_enough');
      trendEl.textContent = msg;
    }
  }

  // v6 : préférences de rappel
  const remCheck=document.getElementById('reminder-opt-in'), remEmail=document.getElementById('reminder-email');
  if(remCheck){ remCheck.checked = !!user.reminder_opt_in; }
  if(remEmail){ remEmail.value = user.reminder_email || ''; remEmail.style.display = user.reminder_opt_in ? '' : 'none'; }

  // v6.35 : espace aidant (état du code d'invitation en cours, s'il y en a un)
  renderCaregiverSection();

  // v6.41 : journal de ressenti libre
  renderJournal();

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
  const statusEl = document.getElementById('caregiver-access-status');
  if(statusEl) statusEl.textContent = '';
  const code = await Store.generateCaregiverCode(userCode);
  if(!code){ if(statusEl) statusEl.textContent = I18N.t('caregiver_create_error'); return; }
  user.caregiver_code = code;
  renderCaregiverSection();
}
async function revokeCaregiverAccess(){
  // v6.137 : même correctif que deleteMyAccount() — window.confirm()
  // n'est pas fiable en mode PWA installée sur plusieurs navigateurs
  // mobiles, remplacé par un second clic explicite dans la page.
  const btnEl = document.getElementById('caregiver-revoke-btn');
  const statusEl = document.getElementById('caregiver-revoke-status');
  if(btnEl && btnEl.dataset.confirmStep !== 'armed'){
    btnEl.dataset.confirmStep = 'armed';
    btnEl.textContent = I18N.t('caregiver_revoke_confirm_second_click');
    if(statusEl) statusEl.textContent = I18N.t('caregiver_revoke_confirm');
    setTimeout(()=>{
      if(btnEl.dataset.confirmStep === 'armed'){
        btnEl.dataset.confirmStep = '';
        btnEl.textContent = I18N.t('caregiver_revoke_btn');
        if(statusEl) statusEl.textContent = '';
      }
    }, 8000);
    return;
  }
  if(btnEl){ btnEl.dataset.confirmStep = ''; btnEl.textContent = I18N.t('caregiver_revoke_btn'); }
  if(statusEl) statusEl.textContent = '';
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

// v6.41 : résumé imprimable côté patient (mon-resume.html) — ouvert dans
// un nouvel onglet avec le code de suivi déjà connu, pas besoin de le
// re-saisir.
function openMySummary(){
  if(!userCode) return;
  window.open('mon-resume.html?code=' + encodeURIComponent(userCode), '_blank');
}

// v6.72 : carte "Mots à revoir" — combine les favoris choisis par le
// patient (étoile pendant l'exercice) et les mots qui reviennent le
// plus souvent dans errorHistory (simple dénombrement, jamais un score
// ni un diagnostic — garde-fou n°5/6). Purement informatif : aucune
// action automatique n'en découle, le patient reste libre d'en faire ce
// qu'il veut (ou de le montrer à son∙sa orthophoniste).
// =====================================================================
//  v6.95 — CONSEILS DE L'ORTHOPHONISTE VISIBLES CÔTÉ PATIENT
//  ---------------------------------------------------------------------
//  Réponse à "j'aurai aimé... pouvoir donner des conseils" : jusqu'ici,
//  aucune note de l'orthophoniste n'était jamais visible par le
//  patient. Lecture seule, jamais de discussion à deux dans ce
//  cadre-ci — voir garde-fou n°1 (pas de LLM qui "parle" au patient) :
//  ce sont de vrais messages écrits par un∙e vrai∙e professionnel∙le,
//  pas du contenu généré.
// =====================================================================
async function renderVisibleNotes(){
  const card = document.getElementById('visible-notes-card');
  const list = document.getElementById('visible-notes-list');
  if(!card || !list || !userCode) return;
  const notes = await Store.loadPatientVisibleNotes(userCode);
  if(!notes.length){ card.style.display = 'none'; return; }
  card.style.display = '';
  list.innerHTML = notes.map(n => `
    <div style="background:var(--accent-soft);border-radius:10px;padding:12px 14px">
      <p style="margin:0;white-space:pre-wrap">${escapeHTML(n.content)}</p>
      <p style="margin:6px 0 0;font-size:.78rem;color:var(--ink-soft)">${new Date(n.created_at).toLocaleDateString()}</p>
    </div>`).join('');
}

async function renderWordsToReview(){
  const favSection = document.getElementById('favorite-words-list');
  const freqSection = document.getElementById('frequent-error-words-list');
  const emptyNote = document.getElementById('words-to-review-empty');
  if(!favSection || !userCode) return;

  const [favorites, errors] = await Promise.all([
    Store.loadFavoriteWords(userCode),
    Store.errorHistory(userCode)
  ]);

  const counts = {};
  errors.forEach(e=>{
    const w = e.target;
    if(!w) return;
    counts[w] = (counts[w]||0) + 1;
  });
  const frequent = Object.entries(counts)
    .sort((a,b)=>b[1]-a[1])
    .slice(0, 8)
    .map(([word])=>word)
    .filter(w=>!favorites.includes(w)); // pas de doublon visuel si déjà en favori

  favSection.innerHTML = favorites.map(w=>`
    <span class="word-chip">${escapeHTML(w)}<button type="button" class="word-chip-remove" aria-label="${escapeHTML(I18N.t('favorite_word_label'))}" onclick="toggleFavoriteCurrentWord(${JSON.stringify(w).replace(/"/g,'&quot;')}, null).then(renderWordsToReview)">✕</button></span>
  `).join('');
  if(freqSection){
    freqSection.innerHTML = frequent.map(w=>`<span class="word-chip word-chip-muted">${escapeHTML(w)}</span>`).join('');
  }
  if(emptyNote) emptyNote.style.display = (favorites.length===0 && frequent.length===0) ? '' : 'none';
}

// v6.70 : bouton "❓ Aide" dans l'écran d'exercice — jusqu'ici,
// l'explication d'Ami (Companion.explain(), voir js/companion.js)
// n'apparaissait qu'une fois, à l'ouverture de l'exercice. Si le
// patient l'a fermée trop vite ou revient dessus après une pause, rien
// ne permettait de la revoir sans recommencer l'exercice. Réutilise
// telles quelles les traductions déjà existantes de Companion.explain()
// (9 langues complètes ; kabyle/sango affichent le français, comme
// partout ailleurs pour ces langues partielles — voir garde-fou n°3/4,
// aucune traduction inventée ici) : aucun nouveau contenu à traduire,
// juste un moyen d'y revenir à la demande, pour tous les types
// d'exercice existants.
function showExerciseHelp(){
  if(!current || !current.type) return;
  Companion.explain('companion-exercise', current.type);
}

// =====================================================================
//  v6.69 — EXPORT / RESTAURATION DE MES DONNÉES
//  ---------------------------------------------------------------------
//  Deux besoins couverts par le même mécanisme, volontairement construit
//  sur la couche Store (js/storage.js) plutôt que sur localStorage
//  directement : ça marche à l'identique en mode cloud et en mode
//  navigateur, sans dupliquer la logique.
//   1. Portabilité (RGPD) : le patient peut télécharger ses propres
//      données dans un fichier qu'il garde ou apporte à un∙e vrai∙e
//      orthophoniste — indépendamment du mode de sauvegarde utilisé.
//   2. Changement d'appareil en mode navigateur (sans compte cloud) :
//      sans ça, changer de téléphone = perdre tout l'historique, ce
//      qui n'est pas le cas en mode cloud (le code de suivi suffit).
//  Ne contient jamais que les propres données du patient connecté —
//  jamais de données d'un autre patient, jamais de données médicales
//  au-delà de ce que l'app suit déjà (garde-fou n°6).
// =====================================================================
async function exportMyData(){
  if(!userCode) return;
  const [patient, profile, history, journal, errors, caregiverWords] = await Promise.all([
    Store.loadPatient(userCode),
    Store.loadProfile(userCode),
    Store.history(userCode),
    Store.loadJournalEntries(userCode),
    Store.errorHistory(userCode),
    Store.loadCaregiverWords(userCode)
  ]);
  const bundle = {
    reparole_export_version: 1,
    exported_at: new Date().toISOString(),
    code: userCode,
    patient, profile, history, journal, errors, caregiverWords
  };
  const blob = new Blob([JSON.stringify(bundle, null, 2)], { type:'application/json;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = `reparole-mes-donnees-${userCode}.json`;
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// v6.69 : réimporte un fichier exporté par exportMyData() dans le compte
// actuellement connecté. Passe par les mêmes fonctions Store que
// l'utilisation normale (savePatient, addJournalEntry) — jamais
// d'écriture directe dans localStorage — pour rester valable en mode
// cloud comme en mode navigateur.
//
// Volontairement limité au profil agrégé (séances/score/streak/niveau)
// et au journal : ni logSession ni logError n'acceptent de date fournie
// par le client (la BDD/le localStorage y appose toujours "maintenant"),
// donc rejouer l'historique séance par séance daterait silencieusement
// chaque ancienne séance à aujourd'hui et fausserait les courbes de
// progression — contraire au garde-fou n°5 (pas de score truqué). Ce
// serait possible en ajoutant un paramètre de date optionnel aux
// fonctions RPC log_session/log_error (sql/schema.sql), mais ça
// nécessite une migration à appliquer manuellement côté Supabase — hors
// de portée de cette version, notée pour plus tard si le besoin se
// confirme.
async function restoreMyData(file){
  const statusEl = document.getElementById('restore-status');
  if(!file || !userCode) return;
  if(statusEl) statusEl.textContent = '⏳ Restauration en cours…';
  try{
    const text = await file.text();
    const bundle = JSON.parse(text);
    if(!bundle || bundle.reparole_export_version !== 1){
      if(statusEl) statusEl.textContent = "⚠️ Ce fichier ne ressemble pas à une sauvegarde ReParole valide.";
      return;
    }

    if(bundle.patient){
      const current = await Store.loadPatient(userCode) || {};
      await Store.savePatient(userCode, {
        name: current.name || bundle.patient.name,
        level: Math.max(current.level||1, bundle.patient.level||1),
        sessions: Math.max(current.sessions||0, bundle.patient.sessions||0),
        correct: Math.max(current.correct||0, bundle.patient.correct||0),
        total: Math.max(current.total||0, bundle.patient.total||0),
        streak: Math.max(current.streak||0, bundle.patient.streak||0)
      });
    }
    if(bundle.profile) await Store.saveProfile(userCode, bundle.profile);

    // Le journal est du texte libre sans incidence sur un graphique de
    // progression — le réimporter avec la date du jour est sans risque.
    // Dédoublonné par contenu exact (pas par date, jamais fiable ici).
    const existingTexts = new Set((await Store.loadJournalEntries(userCode)).map(j=>j.text));
    for(const entry of (bundle.journal||[])){
      if(entry.text && !existingTexts.has(entry.text)) await Store.addJournalEntry(userCode, entry.text);
    }

    if(statusEl) statusEl.textContent = "✅ Progression et journal restaurés (les séances et erreurs détaillées ne sont pas rejouées, pour ne pas fausser vos courbes avec la date du jour). Rechargez la page pour voir vos données à jour.";
  }catch(e){
    if(statusEl) statusEl.textContent = "⚠️ Fichier illisible — vérifiez qu'il s'agit bien d'un export ReParole (.json).";
  }
}

// =====================================================================
//  v6.87 — DROIT À L'EFFACEMENT (RGPD/LGPD)
//  ---------------------------------------------------------------------
//  VRAI MANQUE corrigé : RGPD.md mentionnait déjà ce droit ("droit
//  d'effacement"), mais rien ne permettait de l'exercer — trouvé en
//  répondant à une question sur la mise en conformité LGPD (Brésil),
//  mais le manque touchait tout aussi bien la France. Confirmation en
//  deux temps volontaire (mot à taper + confirm() natif) vu le
//  caractère irréversible — cohérent avec disableMfa() côté
//  orthophoniste, qui utilise déjà ce même confirm() pour une action
//  destructive.
async function deleteMyAccount(){
  const statusEl = document.getElementById('account-delete-status');
  const confirmEl = document.getElementById('account-delete-confirm');
  const btnEl = document.getElementById('account-delete-btn');
  if(!userCode || !statusEl || !confirmEl || !btnEl) return;
  statusEl.textContent = '';
  const expected = I18N.t('account_delete_confirm_word');
  if((confirmEl.value||'').trim().toUpperCase() !== expected.toUpperCase()){
    statusEl.textContent = I18N.t('account_delete_err_mismatch', expected);
    statusEl.style.color = 'var(--error)';
    return;
  }
  // v6.137 : VRAI BUG CORRIGÉ, signalé par l'utilisateur ("le bouton
  // suppression ne fonctionne pas") — window.confirm() est connu pour
  // être peu fiable en mode PWA installée/standalone sur plusieurs
  // navigateurs mobiles (peut ne rien afficher du tout, ou renvoyer
  // silencieusement une valeur inattendue) : le bouton pouvait donc
  // sembler "ne rien faire" au clic, sans aucune erreur visible. Le
  // mot à taper étant déjà une confirmation volontaire à deux temps
  // (voir commentaire v6.87 plus bas), remplacé par un second clic
  // explicite DANS la page plutôt qu'une boîte de dialogue native.
  if(btnEl.dataset.confirmStep !== 'armed'){
    btnEl.dataset.confirmStep = 'armed';
    btnEl.textContent = I18N.t('account_delete_confirm_second_click');
    statusEl.textContent = I18N.t('account_delete_confirm_dialog');
    statusEl.style.color = 'var(--error)';
    setTimeout(()=>{
      if(btnEl.dataset.confirmStep === 'armed'){
        btnEl.dataset.confirmStep = '';
        btnEl.textContent = I18N.t('account_delete_btn');
        statusEl.textContent = '';
      }
    }, 8000);
    return;
  }
  btnEl.dataset.confirmStep = '';
  btnEl.disabled = true;

  const { error } = await Store.deleteAccount(userCode);
  btnEl.disabled = false;
  btnEl.textContent = I18N.t('account_delete_btn');
  if(error){
    statusEl.textContent = I18N.t('account_delete_error');
    statusEl.style.color = 'var(--error)';
    return;
  }
  statusEl.textContent = I18N.t('account_delete_success');
  statusEl.style.color = 'var(--accent-dark)';
  // v6.87 : le compte n'existe plus — inutile (et trompeur) de le
  // laisser dans la liste "codes mémorisés" (v6.71) pour un accès
  // rapide qui ne mènerait plus qu'à un compte introuvable.
  forgetActiveSession();
  forgetRememberedProfile(userCode);
  setTimeout(()=>{ logout(); }, 1500);
}

// =====================================================================
//  v6.41 — JOURNAL DE RESSENTI LIBRE
//  ---------------------------------------------------------------------
//  Texte libre, jamais analysé automatiquement (voir sql/schema.sql).
// =====================================================================
async function saveJournalEntry(){
  const textEl = document.getElementById('journal-text');
  const statusEl = document.getElementById('journal-status');
  const text = textEl.value.trim();
  statusEl.textContent = '';
  if(!text){ statusEl.textContent = I18N.t('journal_empty_error'); statusEl.style.color = '#b23b3b'; return; }
  const { error } = await Store.addJournalEntry(userCode, text);
  if(error){ statusEl.textContent = I18N.t('journal_save_error'); statusEl.style.color = '#b23b3b'; return; }
  textEl.value = '';
  statusEl.textContent = I18N.t('journal_added_ok');
  statusEl.style.color = 'var(--accent-dark)';
  renderJournal();
}
function escapeHTML(s){ return (s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
async function renderJournal(){
  const el = document.getElementById('journal-entries');
  if(!el || !userCode) return;
  const entries = await Store.loadJournalEntries(userCode);
  if(!entries.length){ el.innerHTML = ''; return; }
  el.innerHTML = entries.slice(0, 10).map(e => `
    <div style="background:var(--surface-soft);border-radius:10px;padding:10px 14px">
      <div style="font-size:.75rem;color:var(--ink-soft);margin-bottom:4px">${new Date(e.created_at).toLocaleDateString('fr-FR', { day:'numeric', month:'long', year:'numeric' })}</div>
      <div style="font-size:.92rem;white-space:pre-wrap">${escapeHTML(e.text)}</div>
    </div>`).join('');
}

/* ---------- v4 : photos personnelles ---------- */
async function renderMedia(){
  const grid=document.getElementById('media-grid');
  if(!grid) return;
  const media = await Store.listMedia(userCode);
  const photoItem=document.querySelector('.ex-item[data-type="photos_perso"]');
  if(photoItem) photoItem.style.display = media.length ? '' : 'none';
  // v6.78 : le titre "Vos photos ajoutées" n'a de sens que s'il y a
  // vraiment quelque chose en dessous — évite un intitulé suivi
  // immédiatement du message "aucune photo" (redondant).
  const listTitle = document.getElementById('media-list-title');
  if(listTitle) listTitle.style.display = media.length ? '' : 'none';
  grid.innerHTML = media.length ? media.map(m=>`
    <div class="media-item">
      <img src="${escapeHTML(m.url)}" alt="${escapeHTML(m.label)}">
      <div class="m-label">${escapeHTML(m.label)}</div>
      <button class="btn-ghost" style="padding:4px 10px;font-size:.72rem;margin-top:4px" onclick="deleteMedia('${m.id}')">Supprimer</button>
    </div>`).join('') : `<p class="media-empty">${I18N.t('photos_empty')}</p>`;
}
async function uploadMedia(){
  const labelEl=document.getElementById('media-label'), fileEl=document.getElementById('media-file');
  const statusEl=document.getElementById('media-status');
  const label=labelEl.value.trim(), file=fileEl.files[0];
  if(statusEl) statusEl.textContent = '';
  // v6.78 : BUG RÉEL corrigé — cette validation utilisait alert(), une
  // fenêtre native jamais traduite et incohérente avec le reste de
  // l'app (qui affiche toujours ses erreurs en ligne, jamais en
  // pop-up). Retour utilisateur : confusion sur "et ensuite ?" après
  // avoir ajouté une photo — l'occasion de revoir tout le
  // retour donné par ce formulaire, pas seulement les erreurs.
  if(!label || !file){
    if(statusEl){ statusEl.textContent = I18N.t('photos_err_missing'); statusEl.style.color = 'var(--error)'; }
    return;
  }
  // v5 : redimensionne côté client avant envoi (limite la taille, surtout utile en mode navigateur/localStorage)
  const resized = await resizeImageFile(file, 900).catch(()=>file);
  const result = await Store.addMedia(userCode, label, resized);
  // v6.84 : BUG RÉEL corrigé — le message "✅ Photo ajoutée" s'affichait
  // même quand l'envoi avait réellement échoué côté serveur (le plus
  // souvent : le bucket Supabase Storage "patient-media" n'existe pas
  // encore — voir README.md, "Comment mettre en place
  // l'authentification", étape 4). Store.addMedia() renvoie null dans
  // ce cas précis, jamais vérifié jusqu'ici : la confirmation partait
  // sans savoir si l'écriture avait vraiment eu lieu.
  if(!result){
    if(statusEl){ statusEl.textContent = I18N.t('photos_err_upload_failed'); statusEl.style.color = 'var(--error)'; }
    return;
  }
  if(statusEl){ statusEl.textContent = I18N.t('photos_added_status', label); statusEl.style.color = 'var(--accent-dark)'; }
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
// v6.39 : élargi de [^a-z] à \p{L}\p{N} (Unicode) — l'ancienne version
// ne gardait QUE les lettres latines a-z, donc un mot entièrement en
// alphabet cyrillique ou grec (russe, grec — deux des langues prévues
// ensuite) se retrouvait réduit à une chaîne VIDE, pas juste dégradé.
// Testé pour ne rien changer aux langues latines déjà en ligne (les
// accents restent repliés via NFD juste avant).
const NORMALIZE_SUBSTITUTIONS = { 'ı':'i', 'İ':'i', 'ł':'l', 'Ł':'l', 'ß':'ss', 'đ':'d', 'Đ':'d', 'ø':'o', 'Ø':'o' };
function normalize(s){
  let out = (s||'');
  for(const [from,to] of Object.entries(NORMALIZE_SUBSTITUTIONS)) out = out.split(from).join(to);
  return out.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^\p{L}\p{N}\s]/gu,'').trim();
}
function levenshtein(a,b){ const m=a.length,n=b.length,d=Array.from({length:m+1},(_,i)=>[i,...Array(n).fill(0)]); for(let j=0;j<=n;j++)d[0][j]=j; for(let i=1;i<=m;i++)for(let j=1;j<=n;j++)d[i][j]=Math.min(d[i-1][j]+1,d[i][j-1]+1,d[i-1][j-1]+(a[i-1]===b[j-1]?0:1)); return d[m][n]; }
function isCloseEnough(said,target){ const s=normalize(said),t=normalize(target); if(!s)return false; if(s.includes(t)||t.includes(s))return true; return levenshtein(s,t)<=Math.max(1,Math.floor(t.length*0.34)); }

/* ---------- Moteur d'exercice ---------- */
// v6.132 : niveau propre à un type d'exercice — repli sur user.level
// si ce type n'a pas encore de valeur (migration pas encore passée,
// ou nouveau type d'exercice jamais pratiqué).
function typeLevel(type){
  return (user && user.levels && user.levels[type] != null) ? user.levels[type] : ((user && user.level) || 2);
}
function typeAttempts(type){
  return (user && user.levelAttempts && user.levelAttempts[type]) || 0;
}

async function startExercise(type){
  // v6.24 : structure gratuit/pro — vérifié avant toute autre logique
  const reason = lockReason(type);
  if(reason){ showUpsell(reason); return; }
  recordDailySession();

  // v4 : exercice dynamique construit à partir des photos personnelles du patient
  if(type==='photos_perso'){
    const media = await Store.listMedia(userCode);
    if(!media.length){
      // v6.79 : BUG RÉEL corrigé — alert() natif, jamais traduit et
      // incohérent avec le reste de l'app. Ce cas est déjà rare (la
      // tuile "Nommer vos photos" n'est visible que s'il y a déjà au
      // moins une photo — voir renderMedia()), mais reste possible en
      // cas de suppression entre l'affichage et le clic. Message
      // affiché directement sur la carte "Vos photos" du tableau de
      // bord plutôt que dans l'écran d'exercice (qui n'a pas encore
      // été ouvert à ce stade), avec un défilement vers elle.
      const statusEl = document.getElementById('media-status');
      if(statusEl){
        statusEl.textContent = I18N.t('photos_start_needs_photo');
        statusEl.style.color = 'var(--error)';
        statusEl.scrollIntoView({ behavior:'smooth', block:'center' });
      }
      return;
    }
    // v6.55 : même plafond de questions par session que les autres
    // exercices pour un compte gratuit (voir plus bas pour le détail).
    const photoCap = (PAYWALL_ENABLED && !isPro()) ? Math.min(media.length, FREE_QUESTIONS_PER_SESSION) : media.length;
    const set = media.slice(0, photoCap).map(m=>({word:m.label, url:m.url}));
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

  // v6.132 : niveau propre à ce type d'exercice plutôt que le niveau
  // global unique — voir typeLevel() plus haut.
  const currentTypeLevel = typeLevel(type);

  let bank, levelForBank, forcedFrenchVoice=false;
  if(lang!=='fr' && isVoiceType && !hasSpeechSupport){
    bank = BANK; levelForBank = currentTypeLevel; forcedFrenchVoice = true;
  } else if(lang!=='fr' && langAvailable){
    bank = langBank;
    const atOrBelow = langLevels.filter(k=>k<=currentTypeLevel).sort((a,b)=>b-a);
    levelForBank = atOrBelow.length ? atOrBelow[0] : Math.min(...langLevels);
  } else {
    bank = BANK; levelForBank = currentTypeLevel;
  }

  const set=bank[type].items[levelForBank];
  // v6.41 : mode "séance courte" (Prefs.data.shortSession) — pour les
  // jours de fatigue, sans jamais changer le contenu lui-même, juste
  // le nombre de questions posées d'affilée.
  // v6.55 : plafond de questions par session pour les comptes gratuits
  // (FREE_QUESTIONS_PER_SESSION) — une limite du plan, indépendante du
  // choix "séance courte" du patient. Les deux se combinent via le
  // minimum : un compte gratuit en "séance courte" reste à 3, un
  // compte gratuit sans ce réglage passe de la file complète à 5.
  let cap = set.length;
  if(window.Prefs && Prefs.data.shortSession) cap = Math.min(cap, 3);
  if(PAYWALL_ENABLED && !isPro()) cap = Math.min(cap, FREE_QUESTIONS_PER_SESSION);
  // v6.131 : "Je n'ai pas la force aujourd'hui" (point 14) — contrairement
  // à "séance courte" (un réglage permanent), ceci n'affecte qu'UNE seule
  // séance : 2 questions du niveau le plus facile, peu importe le niveau
  // habituel, puis retour automatique au fonctionnement normal ensuite.
  let effectiveSet = set;
  if(_reducedSessionRequested){
    cap = Math.min(2, set.length);
    effectiveSet = bank[type].items[1] && bank[type].items[1].length ? bank[type].items[1] : set;
    _reducedSessionRequested = false;
  }
  const queueSource = effectiveSet.slice(0, cap);
  current={type,queue:[...queueSource],index:0,total:queueSource.length,correctInRow:0,wrongInRow:0,sessionCorrect:0,voice:!!BANK[type].voice,fluency:!!BANK[type].fluency};
  document.getElementById('ex-title').textContent=bank[type].title;
  document.getElementById('ai-message').textContent = forcedFrenchVoice
    ? I18N.t('voice_note_forced_fr')
    : (lang!=='fr' && !langAvailable)
    ? I18N.t('content_not_translated_yet')
    : I18N.t('starting_level_msg', levelName(user.level));
  Companion.explain('companion-exercise', type);
  show('exercise');
  // v6.72 : chargé après que `current` soit posé, pour que le code qui
  // appelle startExercise() sans l'attendre (voir tests) trouve quand
  // même `current` déjà rempli de façon synchrone, comme avant. Sert au
  // bouton étoile (dénomination/dénomination orale) dans renderQuestion().
  currentFavorites = await Store.loadFavoriteWords(userCode);
  // v6.131 : liste des mots récemment "en difficulté" (2+ erreurs
  // passées) — sert à repérer en cours de séance un mot qui posait
  // souvent problème et qu'on vient de retrouver (point 10). Comme
  // currentFavorites juste au-dessus : chargé après que `current` soit
  // déjà posé, silencieux en cas d'échec (jamais bloquant).
  try{
    const errors = await Store.errorHistory(userCode);
    const counts = {};
    errors.forEach(e=>{ if(e.target) counts[e.target] = (counts[e.target]||0) + 1; });
    _frequentErrorWords = new Set(Object.entries(counts).filter(([,n])=>n>=2).map(([w])=>w));
  }catch(e){ _frequentErrorWords = new Set(); }
  // v6.131 : échauffement (point 13) — un mot déjà maîtrisé (marqué en
  // favori par le patient lui-même, donc une vraie donnée, pas un mot
  // deviné) affiché avant les vraies questions, pour démarrer la séance
  // en confiance. Ne s'affiche que si le réglage est actif ET qu'un
  // favori existe déjà — sinon, on ne fabrique rien, on passe direct à
  // la première question comme avant.
  if(window.Prefs && Prefs.data.warmUp && currentFavorites.length){
    const warmWord = currentFavorites[Math.floor(Math.random()*currentFavorites.length)];
    document.getElementById('ex-body').innerHTML = `
      <div class="prompt-card" style="text-align:center">
        <div class="prompt-emoji">🌱</div>
        <p style="color:var(--ink-soft)">${I18N.t('warmup_intro')}</p>
        <div class="prompt-main" style="font-size:1.6rem;margin:14px 0">${escapeHTML(warmWord)}</div>
        <button class="btn-primary" onclick="renderQuestion()">${I18N.t('warmup_continue_btn')}</button>
      </div>`;
    return;
  }
  renderQuestion();
}

// v6.72 : bouton étoile "mot favori" — voir Store.toggleFavoriteWord.
// Limité aux exercices où "le mot" a un sens clair et stable
// (dénomination / dénomination orale), pas aux exercices dont la
// réponse est une phrase ou un choix contextuel.
function favoriteStarHTML(word){
  if(!word) return '';
  const isFav = currentFavorites.includes(word);
  const label = I18N.t('favorite_word_label');
  return `<button type="button" class="favorite-star${isFav?' is-favorite':''}" aria-label="${label}" title="${label}" onclick="toggleFavoriteCurrentWord(${JSON.stringify(word).replace(/"/g,'&quot;')}, this)">${isFav?'⭐':'☆'}</button>`;
}
function toggleFavoriteCurrentWord(word, btnEl){
  return Store.toggleFavoriteWord(userCode, word).then(res=>{
    if(!res || res.error) return; // échec silencieux (ex. migration pas encore appliquée), cohérent avec js/storage.js
    const isFav = !!res.isFavorite;
    currentFavorites = isFav
      ? (currentFavorites.includes(word) ? currentFavorites : [...currentFavorites, word])
      : currentFavorites.filter(w=>w!==word);
    if(btnEl){
      btnEl.textContent = isFav ? '⭐' : '☆';
      btnEl.classList.toggle('is-favorite', isFav);
    }
  });
}

// v6.140 : mot correspondant à un émoji de l'exercice "Associer les
// images", dans la langue active — voir EMOJI_LABEL_KEYS
// (js/exercises-new-types.js). Chaîne vide si l'émoji n'a pas de clé
// connue, plutôt que d'afficher une clé technique par erreur.
function emojiLabel(emoji){
  const key = window.EMOJI_LABEL_KEYS && window.EMOJI_LABEL_KEYS[emoji];
  return key ? I18N.t(key) : '';
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

  // v6.1 : l'exercice de dénomination peut tourner dans une langue
  // partielle (voir exercises-kab.js, exercises-sango.js).
  // v6.59 : généralisé de "kab" en dur à n'importe quelle langue dont
  // la banque a son propre champ `consigne` (signe distinctif d'une
  // banque "langue partielle" — les langues complètes comme BANK_TR
  // n'en ont pas, elles utilisent I18N.t('denom_prompt')).
  const lang = (window.Prefs && Prefs.data.lang) || 'fr';
  const langBank = window['BANK_'+lang.toUpperCase()];
  const isKabDenom = c.type==='denomination' && !!(langBank && langBank.denomination && langBank.denomination.consigne);

  let promptHTML='', consigne='', listenBtnHTML='';
  if(c.type==='denomination'){
    consigne = isKabDenom ? langBank.denomination.consigne : I18N.t('denom_prompt');
    promptHTML=`<div class="prompt-emoji">${q.emoji}</div><div class="prompt-text">${consigne}</div>`;
    if(isKabDenom){
      // v6.1 : pas de synthèse vocale française sur un mot en langue
      // partielle — on tente un vrai enregistrement (voir audio/<langue>/),
      // et on l'annonce clairement sinon. v6.59 : généralisé au-delà du kabyle.
      listenBtnHTML = `<button class="speak-btn" onclick="playPartialLangWordUI('${lang}','${q.answer.replace(/'/g,"\\'")}')">🔊 ${I18N.t('listen_word')}</button><div id="kab-audio-note" class="hint" style="margin-top:6px"></div>`;
    }
  }
  else if(c.type==='completion'){ promptHTML=`<div class="prompt-text">${I18N.t('completion_label')}</div><div class="prompt-main">${q.text.replace('___','<span class=blank>____</span>')}</div>`; consigne=I18N.t('completion_label')+' '+q.text.replace('___','...'); }
  else if(c.type==='association'){
    // v6.133 : point 4 — même mécanisme visuel que la dénomination
    // (grand émoji + choix), mais la question porte sur ce qui va
    // ensemble plutôt que sur un nom.
    // v6.140 : signalé par l'utilisateur — un émoji seul (une abeille,
    // par exemple) peut être ambiguë selon le rendu de la police. Le
    // mot correspondant s'affiche maintenant sous l'image, dans la
    // langue active — l'émoji reste la donnée principale, le mot est
    // un complément de clarté, pas un remplacement (voir
    // emojiLabel() plus haut, et EMOJI_LABEL_KEYS dans
    // js/exercises-new-types.js).
    // v6.145 : signalé par l'utilisateur ("la phrase 'que va avec
    // ceci' pas top") — remplace le "ceci" vague par le nom de
    // l'objet lui-même (déjà disponible via emojiLabel(), utilisé
    // pour l'étiquette sous l'image depuis la v6.140), pour une vraie
    // phrase plutôt qu'une formule générique.
    consigne = I18N.t('association_prompt', emojiLabel(q.text));
    promptHTML=`<div class="prompt-emoji">${q.text}</div><div class="emoji-label">${emojiLabel(q.text)}</div><div class="prompt-text">${consigne}</div>`;
  }
  else if(c.type==='story'){
    // v6.143 : point 7 — le texte contient "\n\n" entre le court récit
    // et la question elle-même (voir js/exercises-story.js) : rendu
    // séparément pour rester lisible, plutôt qu'un bloc de texte
    // continu.
    const parts = q.text.split('\n\n');
    const storyText = parts[0], questionText = parts[1] || '';
    promptHTML=`<div class="prompt-text" style="font-size:1.15rem;line-height:1.6;text-align:left">${escapeHTML(storyText)}</div><div class="prompt-main" style="font-size:1.3rem;margin-top:14px">${escapeHTML(questionText)}</div>`;
    consigne = storyText + ' ' + questionText;
  }
  else { promptHTML=`<div class="prompt-main" style="font-size:1.5rem">${q.text}</div>`; consigne=q.text; }

  const shuffled=[...q.choices].sort(()=>Math.random()-0.5);
  // v6.139 : signalé par l'utilisateur — les choix d'"association"
  // sont des émojis (des images), pas des mots à lire : ils méritent
  // une taille plus grande que le texte des autres exercices, où la
  // taille de lecture standard reste appropriée.
  const choiceClass = c.type==='association' ? 'choice emoji-choice' : 'choice';
  const choicesHTML=shuffled.map(ch=>{
    // v6.140 : le mot sous chaque émoji-choix, même principe que pour
    // la consigne ci-dessus.
    const labelHTML = c.type==='association' ? `<span class="emoji-choice-label">${emojiLabel(ch)}</span>` : '';
    return `<button class="${choiceClass}" onclick="checkChoice(this,'${ch.replace(/'/g,"\\'")}','${q.answer.replace(/'/g,"\\'")}')">${ch}${labelHTML}</button>`;
  }).join('');
  c._given = null; // v4 : mémorise ce que le patient a répondu, pour l'analyse d'erreurs
  const consigneBtn = isKabDenom ? listenBtnHTML : `<button class="speak-btn" onclick="speak(${JSON.stringify(consigne).replace(/"/g,'&quot;')})">🔊 ${I18N.t('listen_instructions')}</button>`;
  const starBtn = c.type==='denomination' ? favoriteStarHTML(q.answer) : '';
  body.innerHTML=`<div class="prompt-card">${starBtn}${promptHTML}
      ${consigneBtn}
    </div><div class="choices">${choicesHTML}</div>`;
}

// v6.1 : joue un enregistrement réel s'il existe, prévient sinon
// (jamais de silence trompeur). v6.59 : généralisé au-delà du kabyle —
// réutilise kabAudioSlug() pour le kabyle (lettres spécifiques ɣ/ḥ/ɛ...
// qui ne se décomposent pas via NFD, voir js/exercises-kab.js), et un
// découpage générique (NFD) pour toute autre langue partielle comme le
// sango, dont les diacritiques (â, ä, ö, ü...) se décomposent normalement.
function partialLangAudioSlug(lang, word){
  if(lang==='kab' && typeof kabAudioSlug==='function') return kabAudioSlug(word);
  return (word||'').toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g,'')
    .replace(/[^a-z0-9]+/g,'-').replace(/(^-|-$)/g,'');
}
// v6.73 : mécanisme conçu pour gérer un dossier audio dont le nom
// diffère du code de langue (ex. c'était `audio/sango/` pour le code
// 'sg') — actuellement vide (v6.151 : sango retiré de l'app, demandé
// par l'utilisateur), mais laissé en place au cas où une future
// langue partielle aurait le même besoin.
const PARTIAL_LANG_AUDIO_FOLDER = {};
function partialLangAudioFolder(lang){ return PARTIAL_LANG_AUDIO_FOLDER[lang] || lang; }
function playPartialLangWordUI(lang, word){
  const note=document.getElementById('kab-audio-note');
  if(note) note.textContent='';
  const slug = partialLangAudioSlug(lang, word);
  const folder = partialLangAudioFolder(lang);
  const audio = new Audio(`audio/${folder}/${slug}.mp3`);
  const onMissing = ()=>{ if(note) note.textContent=`🔇 Pas encore d'enregistrement pour ce mot — voir audio/${folder}/README.md pour en ajouter un.`; };
  audio.play().catch(onMissing);
  audio.onerror = onMissing;
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
  const starBtn = c.type==='denomination_orale' ? favoriteStarHTML(q.word) : '';
  document.getElementById('ex-body').innerHTML=`
    <div class="prompt-card">${starBtn}${visual}${listenBtn}
      <button class="mic-btn" id="mic" aria-label="${I18N.t('mic_aria_voice')}" ${voiceSupported()?'':'disabled'} onclick="toggleListen('${q.word.replace(/'/g,"\\'")}')">🎤</button>
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
      <button class="mic-btn" id="mic" aria-label="${I18N.t('mic_aria_fluency')}" ${voiceSupported()?'':'disabled'} onclick="toggleFluency()">🎤</button>
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
  const c=current,n=c._fluencyFound.length, goal={1:4,2:5,3:6}[typeLevel('fluence')], ok=n>=goal;
  AI.record('fluence', c._fluencyTarget.cat, ok); // apprentissage par catégorie
  if(ok){c.sessionCorrect++;c.correctInRow++;c.wrongInRow=0;}
  else {
    c.wrongInRow++;c.correctInRow=0;
    // v4 : peu/pas de mots trouvés -> se rapproche d'une difficulté d'accès au mot (sémantique)
    const category = n===0 ? AI.recordError('fluence', c._fluencyTarget.cat, '') : AI.recordError('fluence', c._fluencyTarget.cat, 'partiel');
    Store.logError(userCode, { exercise:'fluence', category, target:c._fluencyTarget.cat, given:n+' mot(s)', level:typeLevel('fluence') });
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
// v6.131 : retour sonore optionnel — utile en cas de fatigue visuelle ou
// de trouble de l'attention, pour suivre le résultat sans devoir fixer
// l'écran en permanence. Deux tons courts et distincts (pas un buzzer
// d'erreur agressif), générés directement (Web Audio), donc aucun
// fichier audio à charger ni à traduire. Ne joue rien si la préférence
// est désactivée (par défaut) ou si l'API n'est pas disponible.
let _feedbackAudioCtx = null;
function playFeedbackSound(ok){
  if(!window.Prefs || !Prefs.data.soundFeedback) return;
  try{
    _feedbackAudioCtx = _feedbackAudioCtx || new (window.AudioContext || window.webkitAudioContext)();
    const ctx = _feedbackAudioCtx;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain); gain.connect(ctx.destination);
    osc.type = 'sine';
    const now = ctx.currentTime;
    if(ok){
      // deux notes courtes, ascendantes — un signal positif, pas un jingle
      osc.frequency.setValueAtTime(587.33, now);        // ré
      osc.frequency.setValueAtTime(783.99, now + 0.09);  // sol
    } else {
      // une seule note, neutre et grave — un simple accusé, pas un "buzz" d'échec
      osc.frequency.setValueAtTime(293.66, now);         // ré grave
    }
    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
    osc.start(now);
    osc.stop(now + 0.22);
  }catch(e){ /* API indisponible ou bloquée — pas de retour sonore, pas grave */ }
}
async function answer_feedback(ok, given){
  stopRecognition();
  playFeedbackSound(ok);
  const fb=document.getElementById('ex-feedback'),c=current;
  // APPRENTISSAGE : on enregistre la réponse (type + cible) dans le profil
  AI.record(c.type, c._target, ok);
  if(ok){
    c.sessionCorrect++; c.correctInRow++; c.wrongInRow=0;
    fb.textContent=I18N.rand('correct_feedback');
    fb.className='feedback good';
    // v6.131 : reconnaissance fine du progrès — un mot qui posait
    // souvent problème (2+ erreurs passées) et qui vient d'être
    // retrouvé mérite un message plus précis qu'un encouragement
    // générique. Ne se déclenche qu'une fois par mot par séance
    // (retiré du set après le premier succès).
    if(c._target && _frequentErrorWords.has(c._target)){
      _frequentErrorWords.delete(c._target);
      Companion.sayText(I18N.t('progress_word_recovered', c._target));
    } else {
      Companion.say(c.correctInRow>=3 ? 'streak' : 'correct');
    }
  }
  else{
    c.wrongInRow++; c.correctInRow=0; fb.textContent=I18N.t('wrong_feedback'); fb.className='feedback bad';
    Companion.say('encourage');
    // v4 : ANALYSE DES ERREURS — catégorise et journalise (piste pour l'orthophoniste)
    const givenAnswer = (given!==undefined) ? given : c._given;
    const category = AI.recordError(c.type, c._target, givenAnswer);
    Store.logError(userCode, { exercise:c.type, category, target:c._target, given:givenAnswer||'', level:typeLevel(c.type) });
  }
  adaptDifficulty(); setTimeout(nextQuestion, ok?900:1500);
}
// =====================================================================
//  v6.132 — ADAPTATION DE LA DIFFICULTÉ (points 1-2-3 de la demande)
//  ---------------------------------------------------------------------
//  Point 2 (niveau par type) : déjà porté par typeLevel(c.type) au lieu
//  de user.level — chaque type d'exercice a sa propre trajectoire.
//
//  Point 1 (ajuster par type d'erreur) : avant de baisser le niveau
//  après 2 échecs d'affilée, on regarde la catégorie d'erreur
//  dominante du patient (AI.dominantDifficulty()). Si elle vaut
//  "omission" (pas de réponse du tout, pas une vraie mauvaise
//  réponse), c'est souvent un signal de fatigue/distraction plutôt
//  qu'un vrai décalage de difficulté — on attend un 3e échec avant de
//  baisser, au lieu de 2. Les autres catégories (sens, sonorité,
//  structure) gardent le seuil habituel : ce sont de vraies erreurs de
//  contenu, le signal est fiable dès 2.
//
//  Point 3 (volume de pratique) : en plus de la précision immédiate,
//  un type d'exercice pratiqué en profondeur (30+ réponses cumulées)
//  ET stable depuis un moment (pas d'échec dans les 5 dernières
//  réponses) reçoit une poussée douce vers le niveau supérieur, même
//  sans 2 bonnes réponses d'affilée récentes — pour valoriser la
//  régularité, pas seulement la performance du moment. Ne se déclenche
//  jamais si un signal de fatigue est actif : le garde-fou existant
//  reste prioritaire dans tous les cas.
// =====================================================================
function adaptDifficulty(){
  const c=current,ai=document.getElementById('ai-message');
  user.levels = user.levels || {};
  user.levelAttempts = user.levelAttempts || {};
  user.levelAttempts[c.type] = (user.levelAttempts[c.type]||0) + 1;
  let lvl = typeLevel(c.type);

  // v5 : signal de fatigue (série d'échecs) — prioritaire sur tout le reste
  const fatigue = AI.fatigueSignal(c.wrongInRow);
  if(fatigue.level==='high'){
    if(lvl>1){ lvl--; user.levels[c.type]=lvl; user.level=lvl; c.wrongInRow=0; Store.saveLevels(userCode, user.levels, user.levelAttempts); }
    ai.textContent = fatigue.message;
    return;
  }

  // Point 1 : seuil de baisse plus tolérant si l'erreur dominante du
  // patient est une omission (pas de réponse) plutôt qu'une vraie
  // mauvaise réponse.
  const dominant = AI.dominantDifficulty();
  const downThreshold = (dominant && dominant.category==='omission') ? 3 : 2;

  if(c.correctInRow>=2 && lvl<3){
    lvl++; user.levels[c.type]=lvl; user.level=lvl; c.correctInRow=0;
    ai.textContent=I18N.t('level_up_msg', levelName(lvl));
  }
  else if(c.wrongInRow>=downThreshold && lvl>1){
    lvl--; user.levels[c.type]=lvl; user.level=lvl; c.wrongInRow=0;
    ai.textContent=I18N.t('level_down_msg', levelName(lvl));
  }
  // Point 3 : poussée douce par volume de pratique, seulement si stable
  // (pas d'échec dans la série en cours) et jamais au niveau maximum.
  else if(lvl<3 && c.wrongInRow===0 && typeAttempts(c.type)>=30 && typeAttempts(c.type)%30===0){
    lvl++; user.levels[c.type]=lvl; user.level=lvl;
    ai.textContent=I18N.t('level_up_volume_msg', levelName(lvl));
  }
  else{
    ai.textContent=I18N.t('level_steady_msg', levelName(lvl));
  }
  Store.saveLevels(userCode, user.levels, user.levelAttempts);
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
Object.assign(window, {login,pasteCode,startReducedSession,createNewPatient,dismissCodeBanner,logout,goDashboard,startExercise,checkChoice,answer_feedback,toggleListen,toggleFluency,finishFluencyItem,speak,uploadMedia,deleteMedia,toggleReminder,saveReminderEmail,playPartialLangWordUI,showPricing,startCheckout,manageSubscription,generateCaregiverAccess,revokeCaregiverAccess,renderCaregiverSection,openMySummary,saveJournalEntry,renderJournal,exportMyData,restoreMyData,showExerciseHelp,toggleFavoriteCurrentWord,renderWordsToReview,deleteMyAccount,renderVoiceSelector,setPreferredVoice,attemptAutoLogin,rememberActiveSession,forgetActiveSession});
