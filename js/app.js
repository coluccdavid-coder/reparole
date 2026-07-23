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
// =====================================================================
//  v6.187 — QUÊTE-DÉCOUVERTE DES JEUX (célébration, jamais barrière)
//  ---------------------------------------------------------------------
//  Les tuiles de JEU (et seulement elles — jamais les exercices
//  thérapeutiques) se révèlent progressivement, pour transformer le mur
//  de tuiles en chemin. Seuils MINUSCULES, dérivés de user.sessions :
//  rien à stocker, et un patient existant (3 séances ou plus) voit tout
//  d'office. Trois soupapes : le lien « voir tous les jeux » (jamais de
//  vrai mur), l'interrupteur de l'ortho (patients.games_all_unlocked —
//  l'autorité clinicienne prime sur le système), et la célébration
//  locale (localStorage) qui ne se joue qu'une fois par appareil.
// =====================================================================
// v6.191 ② : le bouton unique de la carte « Aujourd'hui »
function startRecommended(){
  startExercise(window._todayTop || 'denomination');
}

// =====================================================================
//  v6.191 ④ — PERSONNALISATION PROGRESSIVE (« nudges »)
//  ---------------------------------------------------------------------
//  L'app PROPOSE au bon moment au lieu d'attendre qu'on fouille les
//  réglages. Règles simples sur données réelles, UNE proposition par
//  session au maximum, refus mémorisé (jamais ré-imposée), application
//  uniquement au clic — jamais automatique.
// =====================================================================
const Nudges = {
  rules: [
    { id:'dark-evening',
      when:()=>{ const h=new Date().getHours(); return (h>=20 || h<7) && !Prefs.data.darkMode; },
      msgKey:'nudge_dark',
      apply:()=>{ Prefs.toggle('darkMode'); } },
    { id:'ami-discret',
      when:()=> (Number(user && user.sessions)||0) >= 15 && (Prefs.data.amiLevel||'normal')==='normal',
      msgKey:'nudge_ami',
      apply:()=>{ Prefs.setAmiLevel('discret'); const s=document.getElementById('ami-level'); if(s) s.value='discret'; } },
  ],
  shownThisSession:false,
  dismissed(){ try{ return JSON.parse(localStorage.getItem('reparole_nudges_off')||'[]'); }catch(e){ return []; } },
  dismiss(id){ try{ const d=this.dismissed(); if(!d.includes(id)) d.push(id); localStorage.setItem('reparole_nudges_off', JSON.stringify(d)); }catch(e){} },
  render(){
    const el=document.getElementById('nudge-line');
    if(!el) return;
    if(this.shownThisSession) return;
    const done=this.dismissed();
    const rule=this.rules.find(r=>!done.includes(r.id) && r.when());
    if(!rule){ el.style.display='none'; return; }
    this.shownThisSession=true;
    el.style.display='';
    el.innerHTML=`💡 ${escapeHTML(I18N.t(rule.msgKey))}
      <button type="button" class="btn-ghost" id="nudge-yes" style="margin-inline-start:8px">${escapeHTML(I18N.t('nudge_try'))}</button>
      <button type="button" class="btn-ghost" id="nudge-no">${escapeHTML(I18N.t('nudge_no'))}</button>`;
    el.querySelector('#nudge-yes').addEventListener('click',()=>{ rule.apply(); this.dismiss(rule.id); el.style.display='none'; });
    el.querySelector('#nudge-no').addEventListener('click',()=>{ this.dismiss(rule.id); el.style.display='none'; });
  }
};

const QUEST_CHAIN = [ {type:'anagramme', need:1}, {type:'verif', need:2}, {type:'croises', need:3} ];
function questStep(){
  if(!user) return 99;
  if(user.games_all_unlocked) return 99;         // soupape ortho
  return Number(user.sessions) || 0;             // patients existants : >=3 = tout
}
function applyQuest(){
  const line=document.getElementById('quest-line');
  if(!line) return;
  const s=window._questShowAll ? 99 : questStep();
  let nextNeed=null;
  QUEST_CHAIN.forEach(step=>{
    const tile=document.querySelector(`.ex-item[data-type="${step.type}"]`);
    if(!tile) return;
    const hidden = s < step.need;
    tile.style.display = hidden ? 'none' : '';
    if(hidden && nextNeed===null) nextNeed=step;
  });
  if(nextNeed===null){
    line.style.display='none';
  }else{
    line.style.display='';
    line.innerHTML=`🎁 ${escapeHTML(I18N.t('quest_next_'+nextNeed.need))} <a href="#" id="quest-show-all" style="margin-inline-start:10px">${escapeHTML(I18N.t('quest_show_all'))}</a>`;
    const a=document.getElementById('quest-show-all');
    if(a) a.addEventListener('click',(e)=>{ e.preventDefault(); window._questShowAll=true; applyQuest(); });
  }
  // Célébration : un jeu vient d'apparaître depuis la dernière visite
  try{
    const seen=Number(localStorage.getItem('reparole_quest_step')||'0');
    if(s>seen && s<99){
      const justUnlocked=QUEST_CHAIN.filter(st=>st.need<=s && st.need>seen);
      justUnlocked.forEach(st=>{
        const tile=document.querySelector(`.ex-item[data-type="${st.type}"]`);
        if(tile) tile.classList.add('quest-sparkle');
      });
      if(justUnlocked.length && window.Companion) Companion.sayText(I18N.t('quest_unlocked'), true);
    }
    if(s<99) localStorage.setItem('reparole_quest_step', String(s));
  }catch(e){ /* stockage local indisponible : pas de célébration, pas de casse */ }
}

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

// v6.235 : le mur payant patient s'active selon le réglage admin
// « Gratuit pendant la phase de test » (table app_settings, clé billing).
// Par défaut, ou si le réglage est absent, PAYWALL_ENABLED reste false →
// tout gratuit (comportement bêta). Jamais bloquant ; en contexte de test
// (pas de cloud), la fonction ne fait rien. Quand l'admin décoche « gratuit
// pendant le test », le mur (teaser Pro, plafonds gratuits, gestion
// d'abonnement — déjà codés) s'active tout seul, sans redéploiement.
async function applyBillingPaywall(){
  try{
    if(typeof CLOUD_ENABLED === 'undefined' || !CLOUD_ENABLED) return;
    if(typeof Store === 'undefined' || typeof Store.getBillingSettings !== 'function') return;
    const st = await Store.getBillingSettings();
    // v6.235 : la case « Patients : passer au payant » pilote seule le mur
    // côté patient. Si elle n'existe pas encore (réglages enregistrés avant
    // cette version), on retombe sur l'ancien comportement (freeBeta).
    const murPatient = st && (st.paywallPatients === true ||
      (st.paywallPatients == null && st.freeBeta === false));
    if(murPatient){
      PAYWALL_ENABLED = true;
      if(user && typeof renderDashboard === 'function'){ try{ await renderDashboard(); }catch(e){} }
    }
  }catch(e){ /* silencieux : en cas de doute, on reste gratuit */ }
}

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
  // v6.235 : jusqu'ici on prenait la PREMIÈRE voix de la liste, souvent la
  // plus robotique (eSpeak/compacte). On classe désormais les voix par
  // qualité perçue : les moteurs neuronaux (Google, Microsoft Natural,
  // Siri/Premium/Enhanced) d'abord, les voix compactes en dernier. C'est
  // gratuit, instantané, et change beaucoup le confort d'écoute.
  const score = (v) => {
    const n = ((v.name || '') + ' ' + (v.voiceURI || '')).toLowerCase();
    let s = 0;
    if(/natural|neural|wavenet|journey|studio/.test(n)) s += 60;
    if(/google/.test(n)) s += 40;
    if(/premium|enhanced|siri/.test(n)) s += 35;
    if(/microsoft/.test(n)) s += 15;
    if(!v.localService) s += 20;          // voix serveur = souvent meilleures
    if(/compact|espeak|festival|pico|robot/.test(n)) s -= 60;
    if(/novelty|whisper|bells|bad news|zarvox|albert/.test(n)) s -= 80;
    if(v.default) s += 5;
    return s;
  };
  return candidates.slice().sort((a, b) => score(b) - score(a))[0];
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
  u.rate = 0.94; u.pitch = 1.02;  // v6.235 : débit/hauteur plus naturels
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
  applyBillingPaywall(); // v6.235 : branche le mur payant sur le réglage admin (fire-and-forget)
  // v6.235 : arrivée depuis la vitrine (accueil.html, « Je commence »)
  // — on guide directement vers le champ prénom de création, prêt à
  // taper. Sans effet dans tous les autres cas.
  try{
    if(/[?&]nouveau=1/.test(location.search)){
      const nn = document.getElementById('new-name');
      if(nn){ nn.scrollIntoView({block:'center'}); nn.focus(); }
    }
  }catch(e){}
  // v6.235 : liens profonds depuis la vitrine (accueil.html) — un seul
  // geste pour entrer : #nouveau focalise directement le champ prénom de
  // création, #connexion celui de la connexion. Jamais bloquant.
  try{
    if(location.hash === '#nouveau'){
      const el = document.getElementById('new-name');
      if(el){ setTimeout(()=>{ try{ el.focus(); el.scrollIntoView({block:'center'}); }catch(e){} }, 150); }
    } else if(location.hash === '#connexion'){
      const el = document.getElementById('name');
      if(el){ setTimeout(()=>{ try{ el.focus(); }catch(e){} }, 150); }
    }
  }catch(e){}
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
  // v6.235 : la création a son PROPRE champ prénom (#new-name), dans le
  // flux « Je commence » à droite — distinct du champ de connexion à
  // gauche (#name), qui reste réservé à la reconnexion (2e facteur).
  // On lit #new-name en priorité, avec repli sur #name (compatibilité
  // tests/anciens flux). L'erreur s'affiche à droite (#new-error), là où
  // se trouve désormais le champ, plutôt que sous « Se connecter ».
  const newNameEl = document.getElementById('new-name');
  const loginNameEl = document.getElementById('name');
  const name = ((newNameEl && newNameEl.value.trim()) || (loginNameEl && loginNameEl.value.trim()) || '');
  const createErrEl = document.getElementById('new-error') || document.getElementById('login-error');
  if(!name){ createErrEl.textContent = I18N.t('new_patient_name_required'); return; }
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
  VoiceLoop.render(); // v6.174 : boucle vocale (async, ne bloque pas le rendu)
  CustomExos.render(); // v6.183 : exercices sur mesure validés par l'ortho
  applyQuest(); // v6.187 : quête-découverte des jeux (célébration, jamais barrière)
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

  // ===================================================================
  //  v6.191 ② — carte « Aujourd'hui » : UNE action principale.
  //  Le bouton reprend l'exercice recommandé par le moteur existant
  //  (AI.recommend) — même source de vérité que le badge « Recommandé ».
  // ===================================================================
  window._todayTop = top;
  const recoEl = document.getElementById('today-reco');
  if(recoEl && list){
    const tile = list.querySelector(`.ex-item[data-type="${top}"] .t span`);
    recoEl.textContent = tile ? `${I18N.t('recommended')} : ${tile.textContent}` : '';
  }

  // ===================================================================
  //  v6.191 ① — la mémoire d'Ami (scriptée, AUCUN LLM) : Ami mentionne
  //  des faits réels — retour après une absence, série en cours, mot qui
  //  résiste. Chaleur constante et attention réelle, sans jamais
  //  prétendre éprouver quoi que ce soit (ligne éthique du projet).
  //  Une seule phrase, choisie par priorité ; sinon Ami garde son mot
  //  d'accueil habituel. Respecte le niveau d'accompagnement (④).
  // ===================================================================
  try{
    const lastVisit = localStorage.getItem('reparole_last_visit');
    const gapDays = lastVisit ? Math.floor((Date.now() - new Date(lastVisit).getTime()) / (24*3600*1000)) : 0;
    let memLine = null;
    if(gapDays >= 3){
      memLine = I18N.t('ami_mem_back', String(gapDays));
    }else if((Number(user && user.streak) || 0) >= 3){
      memLine = I18N.t('ami_mem_streak', String(user.streak));
    }else{
      const errs = await Store.errorHistory(userCode);
      const counts = {};
      (errs||[]).forEach(e=>{ if(e.target) counts[e.target]=(counts[e.target]||0)+1; });
      const topWord = Object.entries(counts).sort((a,b)=>b[1]-a[1])[0];
      if(topWord && topWord[1] >= 3) memLine = I18N.t('ami_mem_word', topWord[0]);
    }
    if(memLine && window.Companion) Companion.sayText(memLine);
    localStorage.setItem('reparole_last_visit', new Date().toISOString());
  }catch(e){ /* la mémoire d'Ami ne doit jamais casser le tableau de bord */ }

  // v6.191 ④ : personnalisation progressive — une proposition au plus
  Nudges.render();
  const amiSel = document.getElementById('ami-level');
  if(amiSel) amiSel.value = (Prefs.data.amiLevel || 'normal');
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
// v6.235 : copier la clé personnelle en un geste (réduit le risque de la perdre).
// Réutilise les libellés existants ortho_ai_draft_copy / ortho_ai_draft_copied
// (déjà traduits dans toutes les langues) — aucune nouvelle chaîne à traduire.
function copyMyKey(){
  const val = justCreatedCode || ((document.getElementById('your-code-value')||{}).textContent||'').trim();
  if(!val) return;
  const btn = document.getElementById('copy-key-btn');
  const done = ()=>{ if(btn){ btn.textContent = I18N.t('ortho_ai_draft_copied'); setTimeout(()=>{ btn.textContent = I18N.t('ortho_ai_draft_copy'); }, 1800); } };
  if(navigator.clipboard && navigator.clipboard.writeText){
    navigator.clipboard.writeText(val).then(done).catch(()=>_fallbackCopy(val, done));
  } else { _fallbackCopy(val, done); }
}
function _fallbackCopy(text, cb){
  try{
    const ta=document.createElement('textarea'); ta.value=text;
    ta.style.position='fixed'; ta.style.opacity='0'; document.body.appendChild(ta);
    ta.focus(); ta.select(); document.execCommand('copy'); document.body.removeChild(ta);
    cb&&cb();
  }catch(e){}
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
// v6.188 : l'espace aidant se révèle à la demande — le code d'accès ne
// reste pas affiché en permanence (discrétion si quelqu'un regarde
// l'écran). État non persisté : masqué à chaque chargement.
function toggleCaregiverCard(){
  const body = document.getElementById('caregiver-card-body');
  const btn = document.getElementById('caregiver-card-toggle');
  if(!body || !btn) return;
  const hidden = body.style.display === 'none';
  body.style.display = hidden ? '' : 'none';
  btn.setAttribute('aria-expanded', hidden ? 'true' : 'false');
  const key = hidden ? 'caregiver_card_hide' : 'caregiver_card_show';
  btn.innerHTML = (hidden ? '🙈 ' : '👁️ ') + `<span data-i18n="${key}">${escapeHTML(I18N.t(key))}</span>`;
}

function escapeHTML(s){ return (s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
async function renderJournal(){
  const el = document.getElementById('journal-entries');
  if(!el || !userCode) return;
  const entries = await Store.loadJournalEntries(userCode);
  if(!entries.length){ el.innerHTML = ''; return; }
  // v6.188 : « Je vais moyen depuis le 10 juillet » — une humeur d'il y a
  // dix jours ne doit pas rester affichée comme si c'était aujourd'hui.
  // Si la dernière entrée date de plus de 2 jours : invitation douce à
  // en écrire une nouvelle, et les anciennes entrées s'affichent en
  // libellé relatif (« il y a N jours ») pour situer sans peser.
  const dayMs = 24*3600*1000;
  const ageDays = Math.floor((Date.now() - new Date(entries[0].created_at).getTime()) / dayMs);
  const nudge = ageDays > 2 ? `<p class="hint" style="margin:0 0 8px">🌱 ${escapeHTML(I18N.t('journal_stale_nudge'))}</p>` : '';
  const rel = (e)=>{
    const d = Math.floor((Date.now() - new Date(e.created_at).getTime()) / dayMs);
    const abs = new Date(e.created_at).toLocaleDateString('fr-FR', { day:'numeric', month:'long', year:'numeric' });
    return d <= 0 ? abs : `${abs} · ${I18N.t('journal_days_ago', String(d))}`;
  };
  el.innerHTML = nudge + entries.slice(0, 10).map(e => `
    <div style="background:var(--surface-soft);border-radius:10px;padding:10px 14px">
      <div style="font-size:.75rem;color:var(--ink-soft);margin-bottom:4px">${rel(e)}</div>
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
  // v6.197 : point de départ unique du chronomètre de séance (durée
  // réelle envoyée en base — le dossier clinique affiche enfin un temps
  // de rééducation mesuré, plus seulement estimé).
  window.__exStartMs = Date.now();
  // v6.24 : structure gratuit/pro — vérifié avant toute autre logique
  const reason = lockReason(type);
  if(reason){ showUpsell(reason); return; }
  recordDailySession();

  // v6.199 — PRÉPARATION (charte ERGONOMIE §8.2) : Ami annonce ce qu'on
  // va travailler et la durée approximative AVANT de commencer. Fait
  // factuel, pas d'affect : « préparer » diminue l'anxiété. La durée est
  // estimée depuis le nombre de questions de la séance (courte ou non).
  try{
    const label = I18N.t('ex_'+type+'_t');
    const shortSess = !!(window.Prefs && Prefs.data.shortSession);
    const qCount = shortSess ? 3 : ((PAYWALL_ENABLED && !isPro()) ? FREE_QUESTIONS_PER_SESSION : 8);
    const mins = Math.max(2, Math.round(qCount * 0.5)); // ~30 s/question, plancher 2 min
    if(label && !String(label).startsWith('ex_') && window.Companion){
      Companion.sayText(I18N.t('ami_prepare', { ex: label, min: mins }));
    }
  }catch(e){ /* la préparation ne doit jamais bloquer le démarrage */ }

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

  // ===================================================================
  //  v6.184 — JEUX ADAPTATIFS (« Le mot en morceaux », « Ça va
  //  ensemble ? »).
  //  Choix d'architecture assumé pour tenir « dans toutes les langues » :
  //  la MÉCANIQUE est du code, le CONTENU vient des banques déjà
  //  traduites et relues des 14 langues (kabyle et darijas comprises) +
  //  les mots ciblés par l'ortho/l'aidant (déjà fusionnés dans la banque
  //  de dénomination). L'ADAPTATION vient du moteur d'apprentissage
  //  existant : niveau par type (longueur des mots, subtilité des
  //  pièges) et AI.record à chaque réponse. Aucun LLM face au patient —
  //  c'est ce qui rend le multilingue honnête (garde-fou n°8). La
  //  répétition ludique est exactement ce que recommandent les
  //  ressources de rééducation (neuroplasticité par répétition).
  // ===================================================================
  if(type==='anagramme' || type==='verif'){
    const lang=(window.Prefs && Prefs.data.lang) || 'fr';
    const langBank=(lang!=='fr' && window['BANK_'+lang.toUpperCase()]) ? window['BANK_'+lang.toUpperCase()] : null;
    const denomination=(langBank && langBank.denomination) ? langBank.denomination : BANK.denomination;
    const lvl=typeLevel(type);
    // tous les items jusqu'au niveau courant du JEU (progression propre)
    let pool=[];
    Object.keys(denomination.items).forEach(l=>{ if(Number(l)<=lvl) pool=pool.concat(denomination.items[l]); });
    // anagramme : mots d'un seul tenant, longueur croissant avec le niveau
    const maxLen = lvl<=1 ? 5 : (lvl===2 ? 7 : 10);
    // v6.185 : les emojis abstraits (bulle de parole, flèches, symboles)
    // sont exclus des jeux — une image doit être un OBJET reconnaissable,
    // sinon même le piège devient illisible (retour utilisateur sur 💬).
    const ABSTRACT_GAME_EMOJIS = new Set(['💬','🗨️','💭','❓','❔','❗','➡️','⬅️','🔁','🔊','🔇','✅','❌','⭐','✨','💤','💡','🔔']);
    pool = pool.filter(it=>it && it.emoji && !ABSTRACT_GAME_EMOJIS.has(it.emoji));
    const single = pool.filter(it=>it && it.answer && !/\s|-/.test(it.answer) && [...it.answer].length>=3 && [...it.answer].length<=maxLen);
    const source = (type==='anagramme' ? single : pool.filter(it=>it && it.answer));
    if(source.length<4){ return; } // banque partielle trop maigre : tuile masquée en amont, ceinture ici
    const picked=[...source].sort(()=>Math.random()-0.5).slice(0, Math.min(6, (PAYWALL_ENABLED && !isPro()) ? FREE_QUESTIONS_PER_SESSION : 6));
    let set;
    if(type==='anagramme'){
      set=picked.map(it=>({emoji:it.emoji, answer:it.answer}));
    }else{
      // vérification mot-image : moitié qui correspond, moitié piégée avec
      // le mot d'un AUTRE item du même niveau (piège plausible).
      set=picked.map((it,i)=>{
        const ok = i%2===0;
        let word=it.answer;
        if(!ok){
          const other=source[(source.indexOf(it)+1+Math.floor(Math.random()*(source.length-1)))%source.length];
          word=(other && other.answer!==it.answer) ? other.answer : source[(source.indexOf(it)+1)%source.length].answer;
        }
        return {emoji:it.emoji, word, answer:it.answer, ok};
      }).sort(()=>Math.random()-0.5);
    }
    current={type,queue:set,index:0,total:set.length,correctInRow:0,wrongInRow:0,sessionCorrect:0,voice:false,fluency:false};
    document.getElementById('ex-title').textContent=I18N.t(type==='anagramme'?'ex_anagramme_t':'ex_verif_t');
    document.getElementById('ai-message').textContent=I18N.t(type==='anagramme'?'anagram_hint':'verif_hint');
    Companion.explain('companion-exercise', type);
    show('exercise');
    renderQuestion();
    return;
  }

  // ===================================================================
  //  v6.187 — MOTS CROISÉS ILLUSTRÉS (« La grille en images »).
  //  PAS de définitions textuelles (double obstacle aphasique) : l'indice
  //  est l'EMOJI du mot. Mini-grilles de 2-3 mots qui se croisent,
  //  générées algorithmiquement depuis la banque de la langue active
  //  (mots ciblés en PRIORITÉ), saisie par banque de lettres, sans
  //  chronomètre. RTL (ar/dz/ma/tn) : les mots horizontaux se lisent de
  //  droite à gauche — les coordonnées internes restent LTR, seul
  //  l'affichage inverse les colonnes (standard des mots croisés arabes,
  //  lettres isolées dans les cases). Gratuit, comme les autres jeux.
  // ===================================================================
  if(type==='croises'){
    const lang=(window.Prefs && Prefs.data.lang) || 'fr';
    const isRTL=['ar','dz','ma','tn'].includes(lang);
    const langBank=(lang!=='fr' && window['BANK_'+lang.toUpperCase()]) ? window['BANK_'+lang.toUpperCase()] : null;
    const denomination=(langBank && langBank.denomination) ? langBank.denomination : BANK.denomination;
    const lvl=typeLevel(type);
    let pool=[];
    Object.keys(denomination.items).forEach(l=>{ if(Number(l)<=lvl) pool=pool.concat(denomination.items[l]); });
    const ABSTRACT_GAME_EMOJIS_X = new Set(['💬','🗨️','💭','❓','❔','❗','➡️','⬅️','🔁','🔊','🔇','✅','❌','⭐','✨','💤','💡','🔔']);
    const maxLen = lvl<=1 ? 6 : 8;
    let candidates = pool.filter(it=>it && it.emoji && !ABSTRACT_GAME_EMOJIS_X.has(it.emoji) && it.answer && !/\s|-/.test(it.answer) && [...it.answer].length>=3 && [...it.answer].length<=maxLen);
    // mots ciblés (ortho/aidant) en tête de liste : la grille travaille
    // en priorité ce qui compte cliniquement.
    let targeted=new Set();
    try{
      const tw = await Store.loadCaregiverWords(userCode);
      (tw||[]).forEach(w=>targeted.add((w.word||'').toUpperCase()));
    }catch(e){ /* hors cloud : pas de mots ciblés, la grille vit sans */ }
    candidates.sort((a,b)=>(targeted.has(b.answer)?1:0)-(targeted.has(a.answer)?1:0) || Math.random()-0.5);
    const puzzle = buildCrossword(candidates, lvl<=1 ? 2 : 3);
    if(!puzzle){
      // banque trop maigre pour croiser (ex. : kana sans lettre commune) —
      // message honnête plutôt qu'un écran cassé.
      recordDailySession();
      document.getElementById('ex-title').textContent=I18N.t('ex_croises_t');
      document.getElementById('ex-count').textContent='';
      document.getElementById('ex-progress').style.width='0%';
      document.getElementById('ai-message').textContent=I18N.t('croises_unavailable');
      document.getElementById('ex-body').innerHTML='';
      show('exercise');
      return;
    }
    current={type,queue:puzzle.words,grid:puzzle.cells,gridSize:puzzle.size,isRTL,index:0,total:puzzle.words.length,correctInRow:0,wrongInRow:0,sessionCorrect:0,voice:false,fluency:false};
    document.getElementById('ex-title').textContent=I18N.t('ex_croises_t');
    document.getElementById('ai-message').textContent=I18N.t('croises_hint');
    Companion.explain('companion-exercise', type);
    show('exercise');
    renderQuestion();
    return;
  }

  // ===================================================================
  //  v6.195 — 🧠 « La liste à retenir » (mémoire de travail)
  //  ---------------------------------------------------------------------
  //  Premier chantier issu de la VEILLE IA elle-même (piste n°1 :
  //  entraînement des fonctions exécutives — mémoire de travail, rappel
  //  de listes). Mécanique en code, contenu des banques existantes
  //  (aucune traduction nouvelle : 14 langues d'office, mots déjà
  //  voicés). Deux phases SANS chronomètre (auto-rythmé, adapté à
  //  l'aphasie) : mémoriser une liste de 2-4 images (selon le niveau du
  //  jeu), puis les retrouver parmi des distracteurs. L'ordre n'est PAS
  //  demandé (v1 : le rappel libre suffit — le rappel sériel serait une
  //  marche trop haute). Gratuit. Hors quête (chaîne v1 fixe — décision
  //  notée) : la tuile est visible directement.
  // ===================================================================
  if(type==='memoire_liste'){
    const lang=(window.Prefs && Prefs.data.lang) || 'fr';
    const langBank=(lang!=='fr' && window['BANK_'+lang.toUpperCase()]) ? window['BANK_'+lang.toUpperCase()] : null;
    const denomination=(langBank && langBank.denomination) ? langBank.denomination : BANK.denomination;
    const lvl=typeLevel(type);
    let pool=[];
    Object.keys(denomination.items).forEach(l=>{ if(Number(l)<=lvl) pool=pool.concat(denomination.items[l]); });
    const ABSTRACT_GAME_EMOJIS_M = new Set(['💬','🗨️','💭','❓','❔','❗','➡️','⬅️','🔁','🔊','🔇','✅','❌','⭐','✨','💤','💡','🔔']);
    pool = pool.filter(it=>it && it.emoji && it.answer && !ABSTRACT_GAME_EMOJIS_M.has(it.emoji));
    // dédoublonner par emoji (deux items au même emoji rendraient la
    // sélection ambiguë — l'audit v6.188 garantit déjà l'unicité par
    // banque, ceinture ici pour les pools multi-niveaux)
    const seen = new Set();
    pool = pool.filter(it=>{ if(seen.has(it.emoji)) return false; seen.add(it.emoji); return true; });
    const k = lvl<=1 ? 2 : (lvl===2 ? 3 : 4);            // taille de la liste
    const nOptions = k + 3;                               // + distracteurs
    if(pool.length < nOptions + 2){ return; }             // banque trop maigre
    const roundsWanted = Math.min(5, (PAYWALL_ENABLED && !isPro()) ? FREE_QUESTIONS_PER_SESSION : 5);
    const set=[];
    for(let r=0; r<roundsWanted; r++){
      const shuffled=[...pool].sort(()=>Math.random()-0.5);
      const targets=shuffled.slice(0, k);
      const options=[...shuffled.slice(0, nOptions)].sort(()=>Math.random()-0.5);
      set.push({ targets, options, k });
    }
    current={type,queue:set,index:0,total:set.length,correctInRow:0,wrongInRow:0,sessionCorrect:0,voice:false,fluency:false};
    document.getElementById('ex-title').textContent=I18N.t('ex_memoire_liste_t');
    document.getElementById('ai-message').textContent=I18N.t('memoire_hint');
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
  window.__qStartMs = Date.now(); // v6.199 : départ du chrono de réponse (fatigue §6)
  // mémorise la "cible" (mot/réponse) pour le moteur d'apprentissage
  c._target = q.answer || q.word || null;
  document.getElementById('ex-count').textContent=(c.index+1)+' / '+c.total;
  document.getElementById('ex-progress').style.width=(100*c.index/c.total)+'%';
  const fb=document.getElementById('ex-feedback'); fb.textContent=''; fb.className='feedback';
  const body=document.getElementById('ex-body');
  if(c.fluency){ renderFluency(q); return; }
  if(c.voice){ renderVoice(q); return; }
  // v6.184 : jeux adaptatifs — mécanique dédiée, scoring et apprentissage
  // via le même answer_feedback que tout le reste (AI.record compris).
  if(c.type==='anagramme'){ renderAnagramme(q, body); return; }
  if(c.type==='verif'){ renderVerif(q, body); return; }
  if(c.type==='croises'){ renderCroises(body); return; }
  if(c.type==='memoire_liste'){ renderMemoireListe(q, body); return; }

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
  else if(c.type==='heure'){
    // v6.162 : VRAI BUG CORRIGÉ, signalé par l'utilisateur ("il me
    // sort un tas de code incompréhensible" au clic sur "Écouter la
    // consigne"). q.text contient le SVG de l'horloge dessinée
    // (v6.158) — nécessaire pour l'affichage, mais la branche
    // générique ci-dessous utilisait aussi q.text comme "consigne"
    // (texte lu à voix haute), ce qui faisait lire le code SVG brut
    // mot pour mot. La consigne utilise maintenant un texte dédié
    // (heure_prompt), l'affichage garde le SVG normalement.
    promptHTML=`<div class="prompt-main" style="font-size:1.5rem">${q.text}</div>`;
    consigne = I18N.t('heure_prompt');
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
  // v6.196 — LIGNE ÉTHIQUE DE LA RECONNAISSANCE VOCALE (verrouillée par
  // test) : la parole aphasique met les moteurs de reconnaissance en
  // difficulté — une machine qui compte « faux » à quelqu'un qui a bien
  // prononcé est une faute thérapeutique. Donc : la reconnaissance peut
  // FÉLICITER (mot reconnu → réussite), elle ne peut plus SANCTIONNER.
  // Non reconnu → message neutre, réessai libre, validation manuelle —
  // seuls le patient (auto-évaluation) ou l'orthophoniste (boucle des
  // verdicts vocaux) peuvent constater un échec.
  recognition.onresult=(e)=>{ const alts=[...e.results[0]].map(r=>r.transcript); const said=alts[0]; const ok=alts.some(a=>isCloseEnough(a,target)); mic.classList.remove('listening'); stopRecognition();
    if(ok){ heard.innerHTML=`${I18N.t('heard_label')} <b>« ${said} »</b> 👏`; setTimeout(()=>answer_feedback(true, said),400); }
    else { heard.innerHTML=`${I18N.t('reco_not_sure')}`; }
  };
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
// =====================================================================
//  v6.187 — GÉNÉRATEUR DE MOTS CROISÉS ILLUSTRÉS
//  ---------------------------------------------------------------------
//  Mini-grille de 2-3 mots : un mot horizontal, un vertical qui le
//  croise sur une lettre commune, et si possible un second horizontal
//  croisant le vertical. Coordonnées internes toujours LTR (l'affichage
//  RTL n'inverse que les colonnes, dans renderCroises). Retourne null si
//  la banque ne permet aucun croisement (ex. : kana japonais rare) —
//  l'appelant affiche alors un message honnête.
// =====================================================================
function buildCrossword(candidates, wanted){
  for(let attempt=0; attempt<40; attempt++){
    const A = candidates[attempt % candidates.length];
    if(!A) break;
    const aL=[...A.answer];
    // B : vertical, partage une lettre avec A
    let placed=null;
    for(const B of candidates){
      if(B===A || B.answer===A.answer) continue;
      const bL=[...B.answer];
      outer:
      for(let ai=0; ai<aL.length; ai++){
        for(let bi=0; bi<bL.length; bi++){
          if(aL[ai]===bL[bi]){ placed={B, ai, bi}; break outer; }
        }
      }
      if(placed) break;
    }
    if(!placed) continue;
    // Pose : A horizontal en (0,0..), B vertical colonne ai, lignes -bi..
    const cells={}; const words=[];
    const put=(word, emoji, dir, r0, c0)=>{
      const L=[...word]; const coords=[];
      for(let i=0;i<L.length;i++){
        const r=dir==='h'?r0:r0+i, c=dir==='h'?c0+i:c0;
        const k=r+','+c;
        if(cells[k] && cells[k].letter!==L[i]) return false; // conflit
        coords.push({r,c,letter:L[i]});
      }
      coords.forEach(({r,c,letter})=>{ const k=r+','+c; cells[k]={letter, filled:null}; });
      words.push({word, emoji, dir, cells:coords.map(({r,c})=>({r,c}))});
      return true;
    };
    put(A.answer, A.emoji, 'h', 0, 0);
    if(!put(placed.B.answer, placed.B.emoji, 'v', -placed.bi, placed.ai)) continue;
    // C (optionnel) : horizontal, croise B sur une autre ligne que 0
    if(wanted>=3){
      const bL2=[...placed.B.answer];
      for(const C of candidates){
        if(C===A || C===placed.B || C.answer===A.answer || C.answer===placed.B.answer) continue;
        const cL=[...C.answer]; let done=false;
        for(let bj=0; bj<bL2.length && !done; bj++){
          const rowC=-placed.bi+bj;
          if(rowC===0) continue; // ligne de A
          for(let ci=0; ci<cL.length && !done; ci++){
            if(cL[ci]===bL2[bj] && put(C.answer, C.emoji, 'h', rowC, placed.ai-ci)) done=true;
          }
        }
        if(done) break;
      }
    }
    // Normalisation : décale tout vers (0,0)
    let minR=0,minC=0,maxR=0,maxC=0;
    Object.keys(cells).forEach(k=>{ const [r,c]=k.split(',').map(Number); minR=Math.min(minR,r); minC=Math.min(minC,c); maxR=Math.max(maxR,r); maxC=Math.max(maxC,c); });
    const norm={}; Object.keys(cells).forEach(k=>{ const [r,c]=k.split(',').map(Number); norm[(r-minR)+','+(c-minC)]=cells[k]; });
    words.forEach(w=>w.cells.forEach(cc=>{ cc.r-=minR; cc.c-=minC; }));
    return { cells:norm, words, size:{rows:maxR-minR+1, cols:maxC-minC+1} };
  }
  return null;
}

//  Rendu : la grille entière reste visible d'un mot à l'autre (les
//  lettres résolues persistent et AIDENT le mot suivant — c'est tout
//  l'intérêt cognitif du croisement). Le mot actif est surligné, son
//  indice est l'emoji, la saisie passe par une banque de lettres
//  mélangées (comme « Le mot en morceaux »), Effacer sans pénalité.
function renderCroises(body){
  const c=current, w=c.queue[c.index];
  c._target=w.word;
  c._built='';
  const CELL=52;
  const dispC=(col)=> c.isRTL ? (c.gridSize.cols-1-col) : col;
  const activeSet=new Set(w.cells.map(({r,c:cc})=>r+','+cc));
  let gridHTML='';
  Object.keys(c.grid).forEach(k=>{
    const [r,col]=k.split(',').map(Number);
    const cell=c.grid[k];
    const isActive=activeSet.has(k);
    gridHTML+=`<div data-cell="${k}" style="grid-row:${r+1};grid-column:${dispC(col)+1};width:${CELL}px;height:${CELL}px;display:flex;align-items:center;justify-content:center;font-size:1.35rem;font-weight:700;border:2px solid ${isActive?'var(--accent)':'var(--line)'};border-radius:10px;background:${cell.filled?'var(--surface-soft)':'var(--surface)'};${isActive?'box-shadow:0 0 0 3px rgba(127,214,191,.25);':''}">${cell.filled?escapeHTML(cell.filled):''}</div>`;
  });
  const letters=shuffleLetters(w.word);
  body.innerHTML=`
    <div class="prompt-card">
      <div class="prompt-emoji" style="font-size:3rem">${w.emoji||'❓'}</div>
      <div style="display:inline-grid;gap:6px;margin-top:10px;direction:ltr">${gridHTML}</div>
    </div>
    <div id="croises-letters" style="display:flex;flex-wrap:wrap;gap:10px;justify-content:center;margin-top:16px">
      ${letters.map((l,i)=>`<button type="button" class="btn-ghost" data-letter-i="${i}" data-letter="${escapeHTML(l)}" style="min-width:56px;min-height:56px;font-size:1.4rem;font-weight:700">${escapeHTML(l)}</button>`).join('')}
    </div>
    <div style="text-align:center"><button type="button" class="btn-ghost" id="croises-erase" style="margin-top:14px">↺ ${I18N.t('game_erase')}</button></div>`;
  const lettersEl=body.querySelector('#croises-letters');
  const fillCells=()=>{
    const L=[...c._built];
    w.cells.forEach((pos,i)=>{
      const el=body.querySelector(`[data-cell="${pos.r+','+pos.c}"]`);
      const solved=c.grid[pos.r+','+pos.c].filled;
      if(el) el.textContent = L[i] || solved || '';
    });
  };
  fillCells(); // affiche les lettres déjà résolues par les croisements
  lettersEl.addEventListener('click',(e)=>{
    const b=e.target.closest('button[data-letter]');
    if(!b || b.disabled) return;
    b.disabled=true; b.style.opacity='.35';
    c._built+=b.dataset.letter;
    fillCells();
    if([...c._built].length===[...w.word].length){
      const ok=(c._built===w.word);
      // le mot (juste ou pas) se grave dans la grille avec les BONNES
      // lettres : les croisements restent utilisables pour la suite.
      w.cells.forEach((pos,i)=>{ c.grid[pos.r+','+pos.c].filled=[...w.word][i]; });
      answer_feedback(ok, c._built);
    }
  });
  body.querySelector('#croises-erase').addEventListener('click',()=>{
    c._built='';
    fillCells();
    lettersEl.querySelectorAll('button').forEach(b=>{ b.disabled=false; b.style.opacity='1'; });
  });
}

//  v6.195 — rendu de « La liste à retenir » : phase mémorisation
//  (auto-rythmée, bouton « J'ai mémorisé »), puis phase de rappel libre
//  (retrouver les k images parmi k+3, valider quand k sélections).
function renderMemoireListe(q, body){
  const c=current;
  c._target=q.targets.map(t=>t.answer).join(', ');
  const showPick=()=>{
    const sel=new Set();
    body.innerHTML=`
      <div class="prompt-card">
        <div class="prompt-main" style="font-size:1.05rem">${escapeHTML(I18N.t('memoire_pick', String(q.k)))}</div>
      </div>
      <div style="display:flex;flex-wrap:wrap;gap:12px;justify-content:center;margin-top:16px">
        ${q.options.map((o,i)=>`<button type="button" class="btn-ghost" data-mem-i="${i}" style="font-size:2.2rem;min-width:76px;min-height:76px;border-radius:14px">${o.emoji}</button>`).join('')}
      </div>
      <div style="text-align:center;margin-top:16px">
        <button type="button" class="btn-primary" id="mem-validate" disabled style="opacity:.5">${escapeHTML(I18N.t('memoire_validate'))}</button>
      </div>`;
    const validate=body.querySelector('#mem-validate');
    body.querySelectorAll('button[data-mem-i]').forEach(b=>{
      b.addEventListener('click',()=>{
        const i=b.dataset.memI;
        if(sel.has(i)){ sel.delete(i); b.style.background=''; b.style.borderColor=''; }
        else if(sel.size<q.k){ sel.add(i); b.style.background='var(--surface-soft)'; b.style.borderColor='var(--accent)'; }
        const ready = sel.size===q.k;
        validate.disabled=!ready;
        validate.style.opacity=ready?'1':'.5';
      });
    });
    validate.addEventListener('click',()=>{
      const chosen=new Set([...sel].map(i=>q.options[Number(i)].answer));
      const wanted=new Set(q.targets.map(t=>t.answer));
      const ok = chosen.size===wanted.size && [...wanted].every(w=>chosen.has(w));
      answer_feedback(ok, [...chosen].join(', '));
    });
  };
  // phase 1 : mémoriser — images + mots, SANS chronomètre
  body.innerHTML=`
    <div class="prompt-card">
      <div style="display:flex;flex-wrap:wrap;gap:18px;justify-content:center">
        ${q.targets.map(t=>`<div style="text-align:center"><div style="font-size:2.6rem">${t.emoji}</div><div style="font-weight:700;margin-top:4px">${escapeHTML(t.answer)}</div></div>`).join('')}
      </div>
    </div>
    <div style="text-align:center;margin-top:18px">
      <button type="button" class="btn-primary" id="mem-done">${escapeHTML(I18N.t('memoire_done_btn'))}</button>
    </div>`;
  body.querySelector('#mem-done').addEventListener('click', showPick);
}

// =====================================================================
//  v6.184 — RENDUS DES JEUX ADAPTATIFS
//  ---------------------------------------------------------------------
//  « Le mot en morceaux » : l'image est le modèle, les lettres du mot
//  sont mélangées, le patient les touche dans l'ordre. Un appui = une
//  lettre ; « Effacer » repart de zéro (jamais de pénalité pour
//  effacer). Le mot complet déclenche answer_feedback -> même feedback,
//  même apprentissage (AI.record), même fin de séance que le reste.
//  RTL (ar/dz/ma/tn) : les tuiles sont mélangées de toute façon, et la
//  zone de reconstruction suit la direction du document.
// =====================================================================
function shuffleLetters(word){
  const letters=[...word];
  if(letters.length<2) return letters;
  let out=[...letters];
  for(let tries=0; tries<10; tries++){
    out=[...letters].sort(()=>Math.random()-0.5);
    if(out.join('')!==word) break; // éviter de présenter le mot déjà dans l'ordre
  }
  return out;
}

function renderAnagramme(q, body){
  const c=current;
  c._target=q.answer;
  c._built='';
  const letters=shuffleLetters(q.answer);
  body.innerHTML=`
    <div class="prompt-card">
      <div class="prompt-emoji" style="font-size:3.4rem">${q.emoji||'❓'}</div>
      <div id="anagram-built" style="min-height:52px;font-size:1.6rem;letter-spacing:.18em;font-weight:700;margin:12px 0;border-bottom:2px dashed var(--line);display:inline-block;padding:4px 18px">&nbsp;</div>
    </div>
    <div id="anagram-letters" style="display:flex;flex-wrap:wrap;gap:10px;justify-content:center;margin-top:16px">
      ${letters.map((l,i)=>`<button type="button" class="btn-ghost" data-letter-i="${i}" data-letter="${escapeHTML(l)}" style="min-width:56px;min-height:56px;font-size:1.4rem;font-weight:700">${escapeHTML(l)}</button>`).join('')}
    </div>
    <div style="text-align:center"><button type="button" class="btn-ghost" id="anagram-erase" style="margin-top:14px">↺ ${I18N.t('game_erase')}</button></div>`;
  const built=body.querySelector('#anagram-built');
  const lettersEl=body.querySelector('#anagram-letters');
  lettersEl.addEventListener('click',(e)=>{
    const b=e.target.closest('button[data-letter]');
    if(!b || b.disabled) return;
    b.disabled=true; b.style.opacity='.35';
    c._built+=b.dataset.letter;
    built.textContent=c._built;
    if([...c._built].length===[...q.answer].length){
      const ok=(c._built===q.answer);
      answer_feedback(ok, c._built);
    }
  });
  body.querySelector('#anagram-erase').addEventListener('click',()=>{
    c._built='';
    built.innerHTML='&nbsp;';
    lettersEl.querySelectorAll('button').forEach(b=>{ b.disabled=false; b.style.opacity='1'; });
  });
}

//  « Ça va ensemble ? » : vérification mot-image (tâche clinique
//  classique de word-picture verification) — l'image et un mot,
//  correspondent-ils ? Deux grandes cibles Oui/Non, sans chronomètre
//  (la fatigue post-AVC est réelle : la « vitesse » vient de la série,
//  pas d'un compte à rebours anxiogène).
function renderVerif(q, body){
  const c=current;
  c._target=q.answer;
  body.innerHTML=`
    <div class="prompt-card">
      <div class="prompt-emoji" style="font-size:3.4rem">${q.emoji||'❓'}</div>
      <div class="prompt-main" style="margin-top:10px">${escapeHTML(q.word)}</div>
    </div>
    <div style="display:flex;gap:14px;justify-content:center;margin-top:18px;flex-wrap:wrap">
      <button type="button" class="btn-primary" id="verif-yes" style="width:auto;flex:0 1 220px;min-height:60px;font-size:1.1rem">✅ ${I18N.t('game_yes')}</button>
      <button type="button" class="btn-ghost" id="verif-no" style="width:auto;flex:0 1 220px;min-height:60px;font-size:1.1rem">✋ ${I18N.t('game_no')}</button>
    </div>`;
  body.querySelector('#verif-yes').addEventListener('click',()=>answer_feedback(q.ok===true, q.word));
  body.querySelector('#verif-no').addEventListener('click',()=>answer_feedback(q.ok===false, q.word));
}

async function answer_feedback(ok, given){
  stopRecognition();
  // v6.199 : mesure du temps de réponse (signal de fatigue, §6). On garde
  // la précédente pour comparer la tendance. __qStartMs est posé au rendu
  // de chaque question.
  window.__prevAnswerMs = window.__lastAnswerMs;
  window.__lastAnswerMs = window.__qStartMs ? (Date.now() - window.__qStartMs) : null;
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
    // v6.199 — FATIGUE (charte ERGONOMIE §6) : uniquement le comportement,
    // aucun capteur. 3 erreurs d'affilée OU un temps de réponse qui
    // s'allonge nettement → Ami PROPOSE une pause, UNE fois par séance,
    // sans jamais l'imposer ni interrompre. Constat, pas jugement.
    try{
      if(!c._fatigueOffered){
        const slow = (window.__lastAnswerMs && window.__prevAnswerMs && window.__lastAnswerMs > window.__prevAnswerMs * 2 && window.__lastAnswerMs > 12000);
        if(c.wrongInRow >= 3 || slow){
          c._fatigueOffered = true;
          Companion.sayText(I18N.t('ami_fatigue'), true); // important : passe même en mode discret
        }
      }
    }catch(e){}
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
// v6.199 — RÉSUMÉ DE FIN (charte ERGONOMIE §8.4) : ce qui a été
// travaillé, le résultat, et une suite douce — factuel, jamais d'affect.
// Le patient repart avec une impression de continuité.
function sessionRecap(c, pct){
  const label = I18N.t('ex_'+c.type+'_t');
  const ex = (label && !String(label).startsWith('ex_')) ? label : '';
  const nextKey = pct>=70 ? 'recap_next_up' : (pct>=40 ? 'recap_next_same' : 'recap_next_soft');
  return I18N.t('session_recap', { ex, correct:c.sessionCorrect, total:c.total }) + ' ' + I18N.t(nextKey);
}

function nextQuestion(){ const c=current; c.index++; if(c.index>=c.total){ finishExercise(); return; } renderQuestion(); }

async function finishExercise(){
  const c=current;
  user.sessions++; user.correct+=c.sessionCorrect; user.total+=c.total;
  // PERSISTANCE : dossier + journal + profil d'apprentissage
  await Store.savePatient(userCode, user);
  await Store.logSession(userCode, { type:c.type, score:c.sessionCorrect, total:c.total, level:user.level,
    duration_sec: Math.min(3600, Math.max(5, Math.round((Date.now() - (window.__exStartMs || Date.now())) / 1000))) });
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
      <p style="margin-top:14px;color:var(--ink-soft);font-size:.9rem;line-height:1.6">${escapeHTML(sessionRecap(c, pct))}</p>
      <p style="margin-top:10px;color:var(--ink-soft);font-size:.82rem">${I18N.t('progress_saved', Store.mode())}</p>
      <button class="btn-primary" style="margin-top:18px" onclick="goDashboard()">${I18N.t('back_to_home')}</button>
    </div>`;
  document.getElementById('ex-feedback').textContent='';
  document.getElementById('ai-message').textContent= pct>=70?I18N.t('session_good_msg'):I18N.t('session_soft_msg');
}

// =====================================================================
//  v6.174 — BOUCLE VOCALE ASYNCHRONE (côté patient)
//  ---------------------------------------------------------------------
//  Le patient enregistre sa production réelle sur ses mots ciblés
//  (v6.173) ; l'orthophoniste l'écoute entre deux séances et tranche
//  (« acquis » / « à retravailler ») — le verdict revient s'afficher
//  ici, c'est le retour pédagogique du patient. Cloud uniquement.
//  Consentement explicite (vérifié aussi CÔTÉ SQL), révocation =
//  suppression immédiate, rétention 30 jours (voir sql/schema.sql).
// =====================================================================
const VoiceLoop = {
  _recorder: null,
  _chunks: [],
  _activeWord: null,

  async render(){
    const card = document.getElementById('voice-loop-card');
    if(!card || !user || !user.code) return;
    // Cloud uniquement : sans cloud, pas d'orthophoniste à l'autre bout.
    if(Store.mode() !== 'cloud'){ card.style.display = 'none'; return; }
    const words = await Store.loadCaregiverWords(user.code);
    // La carte n'apparaît que s'il y a des mots ciblés — un écran vide
    // n'aide personne, et c'est l'ortho/l'aidant qui amorce la boucle.
    if(!words.length){ card.style.display = 'none'; return; }
    card.style.display = '';

    const consent = !!user.voice_consent;
    const checkbox = document.getElementById('voice-consent-checkbox');
    checkbox.checked = consent;
    if(!checkbox._voiceBound){
      checkbox.addEventListener('change', ()=> VoiceLoop.toggleConsent(checkbox.checked));
      checkbox._voiceBound = true;
    }

    const listEl = document.getElementById('voice-words-list');
    if(!consent){ listEl.innerHTML = ''; return; }

    const recs = await Store.listVoiceRecordings(user.code);
    const byWord = {};
    recs.forEach(r => { (byWord[r.word] = byWord[r.word] || []).push(r); });

    listEl.innerHTML = words.map(w => {
      const word = (w.word || '').trim();
      const wRecs = byWord[word.toUpperCase()] || byWord[word] || [];
      const last = wRecs[0];
      let verdictHtml = '';
      if(last && last.verdict === 'acquired') verdictHtml = `<span class="badge-pro" style="font-size:.72rem">${I18N.t('voice_verdict_acquired')}</span>`;
      else if(last && last.verdict === 'retry') verdictHtml = `<span class="badge-pro" style="font-size:.72rem">${I18N.t('voice_verdict_retry')}</span>`;
      return `
      <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;background:var(--surface-soft);border-radius:10px;padding:10px 14px">
        <span style="font-size:1.1rem">${escapeHTML(w.emoji || '💬')}</span>
        <b style="font-size:.95rem">${escapeHTML(word)}</b>
        ${verdictHtml}
        <button type="button" class="btn-ghost" style="margin-left:auto;padding:6px 14px" data-voice-word="${escapeHTML(word)}">🎙 <span>${I18N.t('voice_record_btn')}</span></button>
      </div>`;
    }).join('');

    if(!listEl._voiceBound){
      listEl.addEventListener('click', (e)=>{
        const btn = e.target.closest('button[data-voice-word]');
        if(btn) VoiceLoop.toggleRecording(btn, btn.dataset.voiceWord);
      });
      listEl._voiceBound = true;
    }
  },

  async toggleConsent(consent){
    const statusEl = document.getElementById('voice-status');
    const res = await Store.setVoiceConsent(user.code, consent);
    if(res && res.error){ statusEl.textContent = I18N.t('voice_error'); return; }
    user.voice_consent = consent;
    statusEl.textContent = consent ? '' : I18N.t('voice_consent_revoked');
    VoiceLoop.render();
  },

  async toggleRecording(btn, word){
    const statusEl = document.getElementById('voice-status');
    // Second clic = stop.
    if(VoiceLoop._recorder && VoiceLoop._activeWord === word){
      VoiceLoop._recorder.stop();
      return;
    }
    if(VoiceLoop._recorder) return; // un seul enregistrement à la fois
    if(!navigator.mediaDevices || !window.MediaRecorder){
      statusEl.textContent = I18N.t('voice_mic_error');
      return;
    }
    try{
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const rec = new MediaRecorder(stream);
      VoiceLoop._recorder = rec; VoiceLoop._activeWord = word; VoiceLoop._chunks = [];
      btn.classList.add('listening');
      const label = btn.querySelector('span'); if(label) label.textContent = I18N.t('voice_stop_btn');
      statusEl.textContent = I18N.t('voice_recording');
      rec.ondataavailable = (e)=>{ if(e.data && e.data.size) VoiceLoop._chunks.push(e.data); };
      rec.onstop = async ()=>{
        stream.getTracks().forEach(t=>t.stop());
        btn.classList.remove('listening');
        if(label) label.textContent = I18N.t('voice_record_btn');
        const blob = new Blob(VoiceLoop._chunks, { type: rec.mimeType || 'audio/webm' });
        VoiceLoop._recorder = null; VoiceLoop._activeWord = null; VoiceLoop._chunks = [];
        if(!blob.size){ statusEl.textContent = I18N.t('voice_error'); return; }
        statusEl.textContent = I18N.t('voice_sending');
        const res = await Store.addVoiceRecording(user.code, word, blob);
        statusEl.textContent = (res && res.error) ? I18N.t('voice_error') : I18N.t('voice_sent');
      };
      rec.start();
      // Garde-fou : 6 secondes max — un mot, pas un discours (et des
      // fichiers courts = bucket léger + écoute ortho rapide).
      setTimeout(()=>{ if(VoiceLoop._recorder === rec && rec.state === 'recording') rec.stop(); }, 6000);
    }catch(e){
      VoiceLoop._recorder = null; VoiceLoop._activeWord = null;
      statusEl.textContent = I18N.t('voice_mic_error');
    }
  },
};

// =====================================================================
//  v6.183 — EXERCICES SUR MESURE (IA -> validation ortho -> patient).
//  La carte n'apparaît que s'il existe des exercices VALIDÉS par
//  l'orthophoniste (l'enregistrement en base est son acte de
//  validation, vérifié côté SQL). L'exercice se joue dans le moteur
//  standard : les items sont déjà au schéma natif {text, choices,
//  answer} — la branche générique de renderQuestion() fait le reste.
// =====================================================================
const CustomExos = {
  _exos: [],
  async render(){
    const card = document.getElementById('custom-exos-card');
    if(!card || !user || !user.code) return;
    if(Store.mode() !== 'cloud'){ card.style.display = 'none'; return; }
    const exos = await Store.listCustomExercises(user.code);
    CustomExos._exos = exos;
    if(!exos.length){ card.style.display = 'none'; return; }
    card.style.display = '';
    const listEl = document.getElementById('custom-exos-list');
    listEl.innerHTML = exos.map(e => `
      <button type="button" class="btn-ghost" style="width:100%;text-align:left;display:flex;align-items:center;gap:10px" data-custom-exo="${escapeHTML(String(e.id))}">
        <span style="font-size:1.2rem">📝</span>
        <span>${escapeHTML(e.title)}</span>
        <span style="margin-left:auto">▶</span>
      </button>`).join('');
    if(!listEl._exoBound){
      listEl.addEventListener('click', (e)=>{
        const b = e.target.closest('button[data-custom-exo]');
        if(b) CustomExos.start(Number(b.dataset.customExo));
      });
      listEl._exoBound = true;
    }
  },
  start(id){
    const exo = CustomExos._exos.find(e => e.id === id);
    if(!exo || !exo.payload || !Array.isArray(exo.payload.items)) return;
    // items déjà validés côté ortho (answer ∈ choices) — re-filtre par
    // prudence, le moteur ne doit jamais recevoir un item cassé.
    const queue = exo.payload.items.filter(it =>
      it && it.text && Array.isArray(it.choices) && it.choices.includes(it.answer));
    if(!queue.length) return;
    recordDailySession();
    current = { type:'custom_ia', queue, index:0, total:queue.length,
      correctInRow:0, wrongInRow:0, sessionCorrect:0, voice:false, fluency:false };
    document.getElementById('ex-title').textContent = exo.title;
    document.getElementById('ai-message').textContent = I18N.t('custom_exo_intro');
    show('exercise');
    renderQuestion();
  },
};

// Exposer les fonctions appelées depuis le HTML
Object.assign(window, {login,pasteCode,startReducedSession,startRecommended,createNewPatient,dismissCodeBanner,copyMyKey,logout,goDashboard,startExercise,checkChoice,answer_feedback,toggleListen,toggleFluency,finishFluencyItem,speak,uploadMedia,deleteMedia,toggleReminder,saveReminderEmail,playPartialLangWordUI,showPricing,startCheckout,manageSubscription,generateCaregiverAccess,revokeCaregiverAccess,renderCaregiverSection,openMySummary,saveJournalEntry,renderJournal,exportMyData,restoreMyData,showExerciseHelp,toggleFavoriteCurrentWord,renderWordsToReview,deleteMyAccount,renderVoiceSelector,setPreferredVoice,attemptAutoLogin,rememberActiveSession,forgetActiveSession});


// =====================================================================
//  v6.235 — ICÔNES MODERNES (espace patient)
//  ---------------------------------------------------------------------
//  Les libellés de l'application sont traduits en 14 langues : les
//  émojis vivent donc dans js/i18n.js, dupliqués dans chaque langue.
//  Plutôt que de les modifier 14 fois (et de risquer d'en oublier),
//  cette couche les remplace À L'AFFICHAGE par des icônes SVG au trait,
//  dans le style des maquettes. Conséquences :
//    • aucune chaîne de traduction touchée (donc rien à retraduire) ;
//    • si un émoji n'est pas dans la table, il s'affiche normalement ;
//    • purement décoratif : les icônes sont aria-hidden, le texte lu par
//      les lecteurs d'écran est inchangé.
//  Portée : l'espace patient uniquement (#dashboard, #exercise, #login).
// =====================================================================
(function(){
  const S = 'xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" ' +
            'stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"';

  // Table émoji -> tracé SVG. Volontairement limitée aux pictogrammes
  // visibles dans l'espace patient (le reste est laissé tel quel).
  const P = {
    '☀':  '<circle cx="12" cy="12" r="4.2"/><path d="M12 2.6v2.2M12 19.2v2.2M4.2 4.2l1.6 1.6M18.2 18.2l1.6 1.6M2.6 12h2.2M19.2 12h2.2M4.2 19.8l1.6-1.6M18.2 5.8l1.6-1.6"/>',
    '🌧': '<path d="M7.5 15.5A4 4 0 0 1 8 7.6a5 5 0 0 1 9.4 1.5 3.5 3.5 0 0 1-.4 6.4"/><path d="M9 18.5l-1 2.4M13 18.5l-1 2.4M17 18.5l-1 2.4"/>',
    '📊': '<path d="M4 20V4"/><path d="M4 20h16"/><rect x="7.5" y="12" width="3" height="5" rx="1"/><rect x="12.5" y="8.5" width="3" height="8.5" rx="1"/><rect x="17" y="14" width="3" height="3" rx="1"/>',
    '📈': '<path d="M4 19V5M4 19h16"/><path d="M7 15l3.5-4 3 2.5L19 8"/>',
    '📷': '<rect x="3" y="7" width="18" height="13" rx="3"/><path d="M8.5 7l1.4-2.4h4.2L15.5 7"/><circle cx="12" cy="13.5" r="3.6"/>',
    '🖼': '<rect x="3" y="4.5" width="18" height="15" rx="2.6"/><circle cx="8.5" cy="10" r="1.6"/><path d="M4 17l4.6-4.2 3.4 3 3-2.4L20 17"/>',
    '✍':  '<path d="M4 20h4.5L20 8.5a2.3 2.3 0 0 0-3.2-3.2L5.2 16.8z"/><path d="M14.8 6.8l3.2 3.2"/>',
    '🔒': '<rect x="4.5" y="10.5" width="15" height="9.5" rx="2.4"/><path d="M8 10.5V8a4 4 0 0 1 8 0v2.5"/>',
    '📋': '<rect x="6" y="4.5" width="12" height="16" rx="2.4"/><path d="M9.5 4.5V3.6a1.4 1.4 0 0 1 1.4-1.4h2.2a1.4 1.4 0 0 1 1.4 1.4v.9z"/><path d="M9.5 11h5M9.5 15h5"/>',
    '🖨': '<path d="M7 9V4.5h10V9"/><rect x="3.5" y="9" width="17" height="7" rx="2.2"/><rect x="7" y="14" width="10" height="6" rx="1.6"/>',
    '💬': '<path d="M20.5 12.2c0 3.9-3.8 7-8.5 7-1 0-2-.1-2.9-.4L4 20.5l1.3-3.5A6.7 6.7 0 0 1 3.5 12.2c0-3.9 3.8-7 8.5-7s8.5 3.1 8.5 7z"/>',
    '🧩': '<path d="M10 4.5h4v2.2a1.8 1.8 0 1 0 3.6 0V4.5h2v4.2h-2.2a1.8 1.8 0 1 0 0 3.6H19.6v4.2h-4.2v-2.2a1.8 1.8 0 1 0-3.6 0v2.2H7.6v-4.2H5.4a1.8 1.8 0 1 0 0-3.6h2.2V4.5z"/>',
    '🎯': '<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="4.6"/><circle cx="12" cy="12" r="1.4"/>',
    '🔤': '<path d="M3.5 17l3.4-9 3.4 9M4.7 14h4.4"/><path d="M14 17V9.5h3.2a2.4 2.4 0 0 1 0 4.8H14"/>',
    '🔡': '<path d="M4 17V9.5h3a2.3 2.3 0 0 1 0 4.6H4"/><path d="M20 11.5a3 3 0 1 0 0 4.4V9.6"/>',
    '🧠': '<path d="M12 5.2a3 3 0 0 0-5.6 1.3A2.9 2.9 0 0 0 4.6 12a3 3 0 0 0 2 4.6A2.9 2.9 0 0 0 12 18z"/><path d="M12 5.2a3 3 0 0 1 5.6 1.3A2.9 2.9 0 0 1 19.4 12a3 3 0 0 1-2 4.6A2.9 2.9 0 0 1 12 18z"/><path d="M12 5.2V18"/>',
    '🎵': '<circle cx="7" cy="17.5" r="2.6"/><circle cx="17.5" cy="15" r="2.6"/><path d="M9.6 17.5V6.5l10.5-2v10.5"/>',
    '🎤': '<rect x="9.4" y="3" width="5.2" height="10.4" rx="2.6"/><path d="M5.8 11.4a6.2 6.2 0 0 0 12.4 0M12 17.6V21"/>',
    '🎙': '<rect x="9.4" y="3" width="5.2" height="10.4" rx="2.6"/><path d="M5.8 11.4a6.2 6.2 0 0 0 12.4 0M12 17.6V21"/>',
    '🗣': '<path d="M4 12a6.5 6.5 0 0 1 11-4.7"/><path d="M4 12v4.5h4l3.4 2.6V9.4"/><path d="M17 9.4a4 4 0 0 1 0 5.2M19.4 7a7 7 0 0 1 0 10"/>',
    '👂': '<path d="M7 9.5a5 5 0 0 1 10 0c0 3-2.4 4-3.4 5.4-.7 1-.4 2.4-1.6 3.4a2.6 2.6 0 0 1-4.2-2"/><path d="M10.4 9.6a1.8 1.8 0 0 1 3.4.8"/>',
    '🔊': '<path d="M4 9.5v5h3.4L12 18.4V5.6L7.4 9.5z"/><path d="M15.6 9.4a3.8 3.8 0 0 1 0 5.2M18 7a7 7 0 0 1 0 10"/>',
    '🕐': '<circle cx="12" cy="12" r="8.4"/><path d="M12 7.4V12l3.2 1.8"/>',
    '⏱': '<circle cx="12" cy="13.4" r="7.4"/><path d="M12 9.6v3.8l2.6 1.5M9.6 2.8h4.8"/>',
    '💶': '<rect x="2.8" y="5.5" width="18.4" height="13" rx="2.6"/><path d="M14.6 9.6a3.4 3.4 0 1 0 0 4.8M8.6 11.2h4.2M8.6 13h4.2"/>',
    '🧮': '<rect x="4" y="3.5" width="16" height="17" rx="2.4"/><path d="M4 9h16M9.4 3.5v17M14.6 3.5v17"/>',
    '⚖':  '<path d="M12 4.6V20M7 20h10"/><path d="M12 7.4l-7 1.8 3.5 5.4 3.5-5.4zM12 7.4l7 1.8-3.5 5.4L12 9.2z"/>',
    '🏷': '<path d="M11 3.6H20v9l-8.6 8.6a1.8 1.8 0 0 1-2.6 0L3.6 15.4a1.8 1.8 0 0 1 0-2.6z"/><circle cx="16.4" cy="7.6" r="1.4"/>',
    '🔗': '<path d="M10.5 13.5a4 4 0 0 0 5.7 0l2.6-2.6a4 4 0 1 0-5.7-5.7L11.8 6.5"/><path d="M13.5 10.5a4 4 0 0 0-5.7 0l-2.6 2.6a4 4 0 1 0 5.7 5.7l1.3-1.3"/>',
    '🎨': '<path d="M12 3.6a8.4 8.4 0 1 0 0 16.8c1.3 0 2-.9 2-1.9 0-1.4-1.2-1.7-1.2-2.8 0-.8.7-1.4 1.6-1.4h1.6a4.4 4.4 0 0 0 4.4-4.4C20.4 6.3 16.6 3.6 12 3.6z"/><circle cx="8" cy="10" r="1.2"/><circle cx="12" cy="7.6" r="1.2"/><circle cx="16" cy="10" r="1.2"/>',
    '🎭': '<path d="M4 6.5h7v6a3.5 3.5 0 0 1-7 0z"/><path d="M13 6.5h7v6a3.5 3.5 0 0 1-7 0z"/><path d="M6 10h.01M9 10h.01M16 10h.01M19 10h.01"/>',
    '📰': '<rect x="3" y="5" width="18" height="14" rx="2.4"/><path d="M7 9h6M7 12.5h6M7 16h4M16.5 9h1M16.5 12.5h1"/>',
    '📥': '<path d="M12 3.6v10.8M8 11l4 3.6 4-3.6"/><path d="M4.5 17.4v1.6a1.6 1.6 0 0 0 1.6 1.6h11.8a1.6 1.6 0 0 0 1.6-1.6v-1.6"/>',
    '📤': '<path d="M12 20.4V9.6M8 13l4-3.6 4 3.6"/><path d="M4.5 6.6V5a1.6 1.6 0 0 1 1.6-1.6h11.8A1.6 1.6 0 0 1 19.5 5v1.6"/>',
    '🗑': '<path d="M4.5 6.5h15M9.5 6.5V4.8a1.4 1.4 0 0 1 1.4-1.4h2.2a1.4 1.4 0 0 1 1.4 1.4v1.7"/><path d="M6.5 6.5l1 12.2a1.6 1.6 0 0 0 1.6 1.5h5.8a1.6 1.6 0 0 0 1.6-1.5l1-12.2"/>',
    '🔄': '<path d="M20 12a8 8 0 0 1-13.6 5.7L4 15.4"/><path d="M4 12a8 8 0 0 1 13.6-5.7L20 8.6"/><path d="M4 20v-4.6h4.6M20 4v4.6h-4.6"/>',
    '💡': '<path d="M9.2 17.4a6 6 0 1 1 5.6 0v1.4H9.2z"/><path d="M10 21h4"/>',
    '🎁': '<rect x="3.5" y="9.5" width="17" height="10.5" rx="2"/><path d="M3.5 13.5h17M12 9.5V20"/><path d="M12 9.5S10.6 5 8.4 5a2 2 0 0 0 0 4.5zM12 9.5S13.4 5 15.6 5a2 2 0 0 1 0 4.5z"/>',
    '👁': '<path d="M2.6 12S6 6.4 12 6.4 21.4 12 21.4 12 18 17.6 12 17.6 2.6 12 2.6 12z"/><circle cx="12" cy="12" r="2.8"/>',
    '🤗': '<circle cx="12" cy="12" r="8.4"/><path d="M8.6 9.6h.01M15.4 9.6h.01"/><path d="M8.2 13.6a4.6 4.6 0 0 0 7.6 0"/>',
    '🫁': '<path d="M12 3.6v8"/><path d="M12 11.6c-1-2.4-2.3-4-3.8-4C6 7.6 5 10 5 13.4c0 3 .6 5.4 2.6 5.4 2.2 0 4.4-1.6 4.4-4z"/><path d="M12 11.6c1-2.4 2.3-4 3.8-4C18 7.6 19 10 19 13.4c0 3-.6 5.4-2.6 5.4-2.2 0-4.4-1.6-4.4-4z"/>',
    '🤖': '<rect x="4.5" y="8" width="15" height="11" rx="3"/><path d="M12 4.5V8M9 13h.01M15 13h.01M9.6 16.2h4.8"/><circle cx="12" cy="3.6" r="1.2"/>',
    '🌱': '<path d="M12 20.4v-7"/><path d="M12 13.4C12 9.8 9 7.4 5.6 7.4c0 3.6 2.8 6 6.4 6z"/><path d="M12 13.4c0-3 2.4-5.4 5.4-5.4 0 3-2.4 5.4-5.4 5.4z"/>',
    '🤚': '<path d="M8.5 11V5.6a1.5 1.5 0 0 1 3 0V11"/><path d="M11.5 10.6V4.8a1.5 1.5 0 0 1 3 0v5.8"/><path d="M14.5 11V6.6a1.5 1.5 0 0 1 3 0V14a6.4 6.4 0 0 1-6.4 6.4h-.6A5.5 5.5 0 0 1 5 14.9l-.4-1.4a1.5 1.5 0 0 1 2.7-1.2l1.2 2"/>',
    '✋':  '<path d="M8.5 11V5.6a1.5 1.5 0 0 1 3 0V11"/><path d="M11.5 10.6V4.8a1.5 1.5 0 0 1 3 0v5.8"/><path d="M14.5 11V6.6a1.5 1.5 0 0 1 3 0V14a6.4 6.4 0 0 1-6.4 6.4h-.6A5.5 5.5 0 0 1 5 14.9l-.4-1.4a1.5 1.5 0 0 1 2.7-1.2l1.2 2"/>',
    '🔔': '<path d="M18 16.4V11a6 6 0 1 0-12 0v5.4L4.4 18.4h15.2z"/><path d="M10 21h4"/>',
    '🌙': '<path d="M20 14.2A8.4 8.4 0 0 1 9.8 4 8.4 8.4 0 1 0 20 14.2z"/>',
    '❓': '<circle cx="12" cy="12" r="8.4"/><path d="M9.8 9.6a2.3 2.3 0 1 1 3 2.2v1.4"/><path d="M12 16.6h.01"/>',
    '👋': '<path d="M8.5 11.5V6a1.5 1.5 0 0 1 3 0v5"/><path d="M11.5 10.4V4.6a1.5 1.5 0 0 1 3 0v5.8"/><path d="M14.5 11V7.6a1.5 1.5 0 0 1 3 0V14a6.4 6.4 0 0 1-6.4 6.4A6.1 6.1 0 0 1 5 14.3l-.4-1.2a1.5 1.5 0 0 1 2.6-1.4l1.3 2"/>'
  };

  function svgFor(ch){
    const d = P[ch];
    if(!d) return null;
    return '<svg class="mi" ' + S + ' aria-hidden="true" focusable="false">' + d + '</svg>';
  }

  // Émojis pris en charge (+ éventuel sélecteur de variation \uFE0F).
  const RE = new RegExp('(' + Object.keys(P).map(function(c){
    return c.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }).join('|') + ')\\uFE0F?', 'g');

  function processTextNode(node){
    const txt = node.nodeValue;
    if(!txt || !RE.test(txt)) return;
    RE.lastIndex = 0;
    const frag = document.createDocumentFragment();
    let last = 0, m;
    while((m = RE.exec(txt)) !== null){
      if(m.index > last) frag.appendChild(document.createTextNode(txt.slice(last, m.index)));
      const span = document.createElement('span');
      span.className = 'mi-wrap';
      span.innerHTML = svgFor(m[1]) || '';
      frag.appendChild(span);
      last = m.index + m[0].length;
    }
    if(last < txt.length) frag.appendChild(document.createTextNode(txt.slice(last)));
    node.parentNode.replaceChild(frag, node);
  }

  function apply(root){
    if(!root) return;
    let walker;
    try{
      walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
        acceptNode: function(n){
          const p = n.parentNode;
          if(!p) return NodeFilter.FILTER_REJECT;
          const tag = p.nodeName;
          if(tag === 'SCRIPT' || tag === 'STYLE' || tag === 'TEXTAREA') return NodeFilter.FILTER_REJECT;
          if(p.classList && p.classList.contains('mi-wrap')) return NodeFilter.FILTER_REJECT;
          return NodeFilter.FILTER_ACCEPT;
        }
      });
    }catch(e){ return; }
    const nodes = [];
    let n;
    while((n = walker.nextNode())) nodes.push(n);
    nodes.forEach(processTextNode);
  }

  function applyAll(){
    ['dashboard', 'exercise', 'login'].forEach(function(id){
      const el = document.getElementById(id);
      if(el) apply(el);
    });
  }

  let pending = null;
  function schedule(){
    if(pending) return;
    pending = setTimeout(function(){ pending = null; applyAll(); }, 60);
  }

  function start(){
    applyAll();
    try{
      const obs = new MutationObserver(schedule);
      ['dashboard', 'exercise', 'login'].forEach(function(id){
        const el = document.getElementById(id);
        if(el) obs.observe(el, { childList:true, subtree:true, characterData:true });
      });
    }catch(e){ /* observateur indisponible : l'affichage initial reste correct */ }
  }

  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();

  window.ReParoleIcons = { apply: applyAll };
})();
