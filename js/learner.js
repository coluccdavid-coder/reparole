// =====================================================================
//  MOTEUR D'APPRENTISSAGE DU PROFIL PATIENT (v5)
//  ---------------------------------------------------------------------
//  Ce n'est PAS une IA générative. C'est un modèle adaptatif qui APPREND
//  du patient au fil des réponses, sans serveur ni clé API. Ce choix est
//  délibéré : une conversation générée par un grand modèle de langage
//  avec des personnes en rééducation du langage après un AVC demanderait
//  une validation clinique et des garde-fous spécifiques que ce
//  prototype n'a pas. La "force" de ce moteur vient donc de règles
//  explicites, transparentes et vérifiables — pas d'une boîte noire.
//
//  Ce que fait le moteur :
//   - mémorise la réussite par type d'exercice et par "étiquette" (mots
//     courts/longs, champ lexical : animaux, nourriture, objets...) ;
//   - en déduit les points forts et les points faibles ;
//   - v5 : applique une logique de RÉPÉTITION ESPACÉE (inspirée de la
//     pratique de récupération espacée, utilisée en rééducation du
//     langage) : ce qui est réussi revient moins souvent, ce qui est
//     manqué revient plus vite ;
//   - v5 : détecte des signaux de FATIGUE en cours de séance ;
//   - v5 : mesure une TENDANCE de progression dans le temps ;
//   - v5 : peut tenir compte d'un PROFIL CLINIQUE déclaré par
//     l'orthophoniste (pas déduit automatiquement) pour pondérer les
//     recommandations ;
//   - recommande en priorité les exercices qui font le plus progresser.
//
//  Le profil est sauvegardé via la couche Storage (navigateur ou cloud),
//  donc l'apprentissage se poursuit d'une séance à l'autre.
// =====================================================================

// Classe un mot par longueur (pour repérer une difficulté sur les mots longs)
function lengthTag(word){
  const n = (word||'').replace(/[^A-Za-zÀ-ÿ]/g,'').length;
  if(n<=5) return 'mot_court';
  if(n<=9) return 'mot_moyen';
  return 'mot_long';
}

// Dictionnaire léger de champs lexicaux pour étiqueter un mot
const LEXFIELDS = {
  animaux:['chat','chien','lapin','cheval','vache','poisson','oiseau','papillon','girafe','herisson','loutre','abeille'],
  nourriture:['pomme','poire','pain','lait','champignon','fromage','gateau','eau'],
  objets:['table','porte','montre','stylo','cle','verre','lampe','boussole','ancre','microscope','bouclier','voiture','voilier','ordinateur','parapluie','telephone'],
  nature:['soleil','fleur','arbre','volcan','tornade','montagne','nuage'],
  musique:['violon','trompette','banjo','guitare'],
  corps:['main','pied','tete','bras','jambe']
};
function fieldTag(word){
  const w=(word||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');
  for(const [field,list] of Object.entries(LEXFIELDS)){
    if(list.some(x=>w.includes(x)||x.includes(w))) return field;
  }
  return 'autre';
}

// Profil vierge
function emptyProfile(){
  return {
    byType:{},   // { denomination:{seen,ok}, ... }
    byTag:{},    // { mot_long:{seen,ok,box,lastSeenAt}, animaux:{...}, ... }  (v5: +box, +lastSeenAt)
    errors:{},   // { semantic:n, phonological:n, syntax:n, omission:n }  (v4)
    updated:null
  };
}

// =====================================================================
//  v4 — ANALYSE DES ERREURS
//  ---------------------------------------------------------------------
//  Catégories retenues (familles d'erreurs usuelles en bilan
//  orthophonique de l'aphasie) :
//   - semantic       : mot proche par le sens (paraphasie sémantique)
//   - phonological   : mot proche par la forme sonore (paraphasie phono.)
//   - syntax         : erreur de structure de phrase / catégorie grammaticale
//   - omission       : absence de réponse (silence, passage, timeout)
//
//  ⚠️ Ceci reste une HEURISTIQUE côté client, présentée à l'orthophoniste
//  comme une PISTE de lecture — jamais comme un diagnostic. C'est
//  toujours l'orthophoniste qui interprète et décide.
// =====================================================================
const ERROR_CATEGORIES = ['semantic','phonological','syntax','omission'];
const ERROR_LABELS = {
  semantic:'erreurs de sens (mot proche par le sens)',
  phonological:'erreurs de son (mot proche par la sonorité)',
  syntax:'erreurs de structure de phrase',
  omission:'absences de réponse'
};

// Distance de Levenshtein légère (indépendante de app.js, pour rester autonome)
function _lev(a,b){
  const m=a.length,n=b.length;
  const d=Array.from({length:m+1},(_,i)=>[i,...Array(n).fill(0)]);
  for(let j=0;j<=n;j++)d[0][j]=j;
  for(let i=1;i<=m;i++)for(let j=1;j<=n;j++)
    d[i][j]=Math.min(d[i-1][j]+1,d[i][j-1]+1,d[i-1][j-1]+(a[i-1]===b[j-1]?0:1));
  return d[m][n];
}
function _norm(s){ return (s||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z\s]/g,'').trim(); }
function _soundsClose(a,b){
  const s=_norm(a), t=_norm(b);
  if(!s || !t || s===t) return false;
  return _lev(s,t) <= Math.max(1, Math.floor(Math.max(s.length,t.length)*0.3));
}

// Devine la catégorie d'une erreur à partir de l'exercice, de la cible
// (bonne réponse) et de la réponse donnée (peut être vide -> omission).
function classifyError(type, target, given){
  if(!given || !String(given).trim()) return 'omission';
  if(target && _soundsClose(target, given)) return 'phonological';
  if(target && fieldTag(target) !== 'autre' && fieldTag(target) === fieldTag(given)) return 'semantic';
  if(type==='completion' || type==='comprehension') return 'syntax';
  return 'semantic';
}

// =====================================================================
//  v5 — RÉPÉTITION ESPACÉE
//  ---------------------------------------------------------------------
//  Principe (inspiré des systèmes de type Leitner/SM-2, simplifié) :
//  chaque étiquette (tag) a une "boîte" de 1 à 5. Une réussite fait
//  monter la boîte (l'intervalle avant de revoir s'allonge) ; un échec
//  la fait retomber à 1 (on revoit vite). Ceci reflète un principe
//  reconnu en rééducation du langage : la "pratique de récupération
//  espacée" (spaced retrieval practice) aide à consolider le rappel
//  lexical chez les personnes aphasiques.
// =====================================================================
const SPACING_HOURS = {1:0, 2:6, 3:24, 4:72, 5:168}; // boîte -> délai avant "dû" (heures)

function _hoursSince(iso){
  if(!iso) return Infinity;
  return (Date.now() - new Date(iso).getTime()) / 3_600_000;
}

// Renvoie un score de 0 (pas encore dû) à 1+ (très en retard) pour une étiquette
function dueScore(tagEntry){
  if(!tagEntry || !tagEntry.lastSeenAt) return 1; // jamais vu -> considéré "dû"
  const box = tagEntry.box || 1;
  const targetHours = SPACING_HOURS[box] ?? 168;
  if(targetHours===0) return 1;
  return _hoursSince(tagEntry.lastSeenAt) / targetHours;
}

// =====================================================================
//  v5 — PROFILS CLINIQUES (déclarés par l'orthophoniste, PAS déduits)
//  ---------------------------------------------------------------------
//  Optionnel : l'orthophoniste peut indiquer une orientation clinique
//  pour pondérer les recommandations. Ce n'est jamais l'application qui
//  pose ce choix — uniquement un réglage explicite fait par le
//  professionnel, modifiable/retirable à tout moment.
// =====================================================================
const CLINICAL_PROFILES = {
  broca:       { label:"Type Broca (production non fluente)", boost:{completion:1.3, repetition:1.25, denomination_orale:1.15} },
  wernicke:    { label:"Type Wernicke (compréhension atteinte)", boost:{comprehension:1.35, denomination:1.1} },
  anomique:    { label:"Anomique (manque du mot)", boost:{denomination:1.3, denomination_orale:1.3, fluence:1.2} },
  globale:     { label:"Aphasie globale", boost:{denomination:1.15, comprehension:1.15, repetition:1.15} },
  dysarthrie:  { label:"Dysarthrie / trouble moteur de la parole", boost:{repetition:1.4, denomination_orale:1.2} },
  // v6.42 : trois profils "voisins" de l'AVC, ajoutés à la demande de
  // l'utilisateur — même principe : un simple réglage de priorité
  // parmi les exercices EXISTANTS, jamais un nouveau contenu ou une
  // nouvelle catégorie clinique gérée différemment. Garde-fou n°2
  // inchangé : aucun exercice de déglutition, y compris pour Parkinson
  // (où ce trouble est fréquent mais reste hors du périmètre de l'app).
  traumatisme_cranien: { label:"Traumatisme crânien", boost:{denomination:1.2, comprehension:1.2, fluence:1.25} },
  orl:                 { label:"Suites ORL (chirurgie, geste sur la voix)", boost:{repetition:1.3, denomination_orale:1.25, intonation:1.15} },
  parkinson:           { label:"Maladie de Parkinson (voix/parole)", boost:{repetition:1.3, intonation:1.25, denomination_orale:1.15} },
  none:        { label:"Non précisé", boost:{} }
};

const Learner = {
  profile: emptyProfile(),

  load(p){
    this.profile = (p && p.byType) ? p : emptyProfile();
    if(!this.profile.errors) this.profile.errors = {}; // v4 : compatibilité avec profils sans historique d'erreurs
    if(!this.profile.byTag) this.profile.byTag = {};
  },
  dump(){ return this.profile; },

  // Enregistre une réponse. target = le mot/réponse concerné, ok = bool.
  record(type, target, ok){
    const P=this.profile;
    const now = new Date().toISOString();
    const bumpType=(bucket,key)=>{ bucket[key]=bucket[key]||{seen:0,ok:0}; bucket[key].seen++; if(ok)bucket[key].ok++; };
    const bumpTag=(key)=>{
      const b = P.byTag[key] = P.byTag[key] || {seen:0,ok:0,box:1,lastSeenAt:null};
      b.seen++; if(ok) b.ok++;
      b.box = ok ? Math.min(5,(b.box||1)+1) : 1;   // v5 : répétition espacée
      b.lastSeenAt = now;
    };
    bumpType(P.byType, type);
    if(target){
      bumpTag(lengthTag(target));
      bumpTag(fieldTag(target));
    }
    P.updated=now;
  },

  rate(bucket,key){ const b=bucket[key]; return b&&b.seen?b.ok/b.seen:null; },

  // Renvoie les faiblesses identifiées (taux < 60% avec assez d'essais)
  weaknesses(){
    const out=[];
    for(const [tag,v] of Object.entries(this.profile.byTag)){
      if(v.seen>=4){ const r=v.ok/v.seen; if(r<0.6) out.push({tag,rate:r,seen:v.seen}); }
    }
    return out.sort((a,b)=>a.rate-b.rate);
  },
  strengths(){
    const out=[];
    for(const [tag,v] of Object.entries(this.profile.byTag)){
      if(v.seen>=4){ const r=v.ok/v.seen; if(r>=0.8) out.push({tag,rate:r,seen:v.seen}); }
    }
    return out.sort((a,b)=>b.rate-a.rate);
  },

  // v5 : étiquettes "dues" pour une révision espacée (déjà vues, prêtes à revenir)
  dueTags(){
    return Object.entries(this.profile.byTag)
      .filter(([,v])=>v.seen>0)
      .map(([tag,v])=>({tag, due:dueScore(v), box:v.box||1}))
      .filter(t=>t.due>=1)
      .sort((a,b)=>b.due-a.due);
  },

  // Phrase lisible pour le patient (l'IA "explique" ce qu'elle a appris)
  // v6.9 : utilise I18N si disponible (navigateur), sinon repli français
  // codé en dur — nécessaire pour que ce module reste testable tel quel
  // en Node (tests/learner.test.js n'a pas de `window`/`I18N`).
  insight(){
    const w=this.weaknesses(), s=this.strengths(), due=this.dueTags();
    const hasI18N = typeof window!=='undefined' && window.I18N;
    const label={mot_court:'les mots courts',mot_moyen:'les mots de longueur moyenne',mot_long:'les mots longs',
      animaux:'les animaux',nourriture:'la nourriture',objets:'les objets du quotidien',nature:'la nature',
      musique:'les instruments de musique',corps:'le corps',autre:'le vocabulaire général'};
    const tagLabel = (tag)=> hasI18N ? I18N.t('tag_'+tag) : (label[tag]||tag);
    if(w.length){
      return hasI18N ? I18N.t('insight_weak', tagLabel(w[0].tag))
        : `J'ai remarqué que ${tagLabel(w[0].tag)} vous demandent plus d'effort. Je vais vous en proposer un peu plus pour progresser.`;
    }
    if(due.length){
      return hasI18N ? I18N.t('insight_due', tagLabel(due[0].tag))
        : `C'est le bon moment pour revoir ${tagLabel(due[0].tag)} — un peu de temps a passé depuis votre dernière réussite, on consolide.`;
    }
    if(s.length){
      return hasI18N ? I18N.t('insight_strong', tagLabel(s[0].tag))
        : `Vous êtes à l'aise avec ${tagLabel(s[0].tag)}. On consolide et on varie pour continuer à progresser.`;
    }
    return hasI18N ? I18N.t('insight_default') : "Je continue d'apprendre votre profil au fil des séances.";
  },

  // Donne un score de priorité par type d'exercice (plus c'est haut, plus
  // l'exercice mérite d'être proposé). On priorise : signalé par le bilan du
  // patient > jamais essayé > faible réussite > peu pratiqué récemment >
  // étiquettes "dues" en répétition espacée. v5 : + pondération clinique
  // optionnelle déclarée par l'orthophoniste.
  priority(type, clinicalProfile){
    const b=this.profile.byType[type];
    let score;
    if(b && b.flagged) score = 120;          // axe déclaré par la personne (bilan)
    else if(!b||b.seen===0) score = 100;      // jamais fait -> à découvrir
    else {
      const r=b.ok/b.seen;
      score = Math.round((1-r)*80 + Math.max(0,20-b.seen)); // faible réussite + peu vu
    }
    // v5 : bonus de répétition espacée si des étiquettes liées à ce type sont "dues"
    const due = this.dueTags();
    if(due.length) score += Math.min(15, due.length*2);
    // v5 : pondération clinique (facultative, réglée par l'orthophoniste)
    const cp = CLINICAL_PROFILES[clinicalProfile];
    if(cp && cp.boost && cp.boost[type]) score = Math.round(score * cp.boost[type]);
    return score;
  },

  // Trie une liste de types d'exercices par priorité décroissante
  recommend(types, clinicalProfile){
    return [...types].sort((a,b)=>this.priority(b,clinicalProfile)-this.priority(a,clinicalProfile));
  },

  // =====================================================================
  //  v5 — DÉTECTION DE FATIGUE (au sein d'une séance)
  //  ---------------------------------------------------------------------
  //  Signal simple et transparent : une série d'échecs consécutifs peut
  //  traduire de la fatigue plutôt qu'une vraie difficulté. On le
  //  signale au patient (jamais de diagnostic) et on peut suggérer une
  //  pause plutôt que de descendre indéfiniment en difficulté.
  // =====================================================================
  fatigueSignal(wrongInRow){
    const hasI18N = typeof window!=='undefined' && window.I18N;
    if(wrongInRow>=3) return { level:'high', message: hasI18N ? I18N.t('fatigue_high') : "Vous enchaînez plusieurs essais difficiles — une petite pause peut aider. Vous pouvez reprendre quand vous voulez." };
    if(wrongInRow===2) return { level:'medium', message: hasI18N ? I18N.t('fatigue_medium') : "On ralentit un peu le rythme." };
    return { level:'none', message:null };
  },

  // =====================================================================
  //  v5 — TENDANCE DE PROGRESSION
  //  ---------------------------------------------------------------------
  //  À partir de l'historique des séances (fourni par Store.history),
  //  compare les 5 dernières séances aux 5 précédentes. Retourne une
  //  tendance lisible, jamais une prédiction ou un pronostic médical.
  // =====================================================================
  trend(history){
    if(!history || history.length<4) return { direction:'insuffisant', deltaPct:0 };
    const rate=arr=>{ const t=arr.reduce((s,x)=>s+x.total,0), o=arr.reduce((s,x)=>s+x.score,0); return t?o/t:0; };
    const recent = history.slice(-5);
    const prior = history.slice(-10,-5);
    if(!prior.length) return { direction:'insuffisant', deltaPct:0 };
    const rRecent=rate(recent), rPrior=rate(prior);
    const deltaPct = Math.round((rRecent-rPrior)*100);
    let direction='stable';
    if(deltaPct>=8) direction='hausse';
    else if(deltaPct<=-8) direction='baisse';
    return { direction, deltaPct };
  },

  // =====================================================================
  //  v4 — API d'analyse des erreurs (voir SKILL_ReParole_Pro_v4)
  // =====================================================================

  // Devine et enregistre la catégorie d'une erreur. À appeler à chaque
  // réponse incorrecte, en plus de record(). `given` peut être omis
  // (=> comptée comme omission).
  recordError(type, target, given){
    const category = classifyError(type, target, given);
    const P=this.profile;
    P.errors[category] = (P.errors[category]||0) + 1;
    P.updated = new Date().toISOString();
    return category;
  },

  // Liste les catégories d'erreurs triées par fréquence décroissante :
  // [{category:'phonological', count:7}, ...]
  topErrors(){
    return Object.entries(this.profile.errors||{})
      .map(([category,count])=>({category,count}))
      .sort((a,b)=>b.count-a.count);
  },

  // Renvoie la catégorie d'erreur dominante (celle qui revient le plus
  // souvent), avec son libellé lisible pour l'orthophoniste. null si
  // aucune erreur enregistrée encore.
  dominantDifficulty(){
    const top = this.topErrors();
    if(!top.length || top[0].count===0) return null;
    return { category: top[0].category, count: top[0].count, label: ERROR_LABELS[top[0].category] || top[0].category };
  }
};

// Expose dans le navigateur…
if(typeof window !== 'undefined'){
  window.Learner = Learner;
  window.ERROR_CATEGORIES = ERROR_CATEGORIES;
  window.ERROR_LABELS = ERROR_LABELS;
  window.CLINICAL_PROFILES = CLINICAL_PROFILES;
}
// …et en Node, pour les tests automatisés (tests/learner.test.js)
if(typeof module !== 'undefined' && module.exports){
  module.exports = { Learner, ERROR_CATEGORIES, ERROR_LABELS, CLINICAL_PROFILES, classifyError, lengthTag, fieldTag, dueScore };
}
