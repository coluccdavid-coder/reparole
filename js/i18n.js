// =====================================================================
//  v6.9 — ANGLAIS : langue complète, contrairement au kabyle
//  ---------------------------------------------------------------------
//  L'anglais est entièrement pris en charge : interface (ci-dessous),
//  contenu des exercices (js/exercises-en.js, BANK_EN, tous les types y
//  compris les exercices vocaux), synthèse ET reconnaissance vocales
//  (voir speechLocale ci-dessous, utilisé par js/app.js). Un patient qui
//  choisit l'anglais n'a donc plus aucun repli automatique vers le
//  français, contrairement au kabyle qui reste volontairement partiel
//  (voir l'explication ci-dessus).
// =====================================================================

// =====================================================================
//  TRADUCTION DE L'INTERFACE — français / kabyle (v6)
//  ---------------------------------------------------------------------
//  ⚠️ Je ne suis pas locuteur natif du kabyle. Ces traductions couvrent
//  l'interface générale avec un vocabulaire courant et standard, mais
//  DOIVENT être relues par une personne kabylophone avant tout usage
//  clinique réel — comme pour tout le contenu de cette application
//  (voir SKILL_ReParole_Pro_v4.md : "validation clinique obligatoire").
//
//  Pourquoi le kabyle ne couvre pas TOUT :
//   - Les exercices vocaux (répétition, dénomination orale, fluence,
//     conversation guidée) restent en français : la reconnaissance et
//     la synthèse vocales du navigateur ne prennent pas en charge le
//     kabyle à ce jour (vérifié — absent des langues de Google
//     Speech-to-Text / Web Speech API). Un patient qui choisit le
//     kabyle verra ces exercices annoncés comme restant en français,
//     avec une explication, plutôt que de simuler un support qui
//     n'existe pas.
//   - Seul le niveau 1 de "Nommer les images" est traduit pour l'instant
//     (vocabulaire simple et bien attesté). Les niveaux 2-3 et les
//     autres exercices à choix (complétion, compréhension) restent à
//     traduire — voir js/exercises-kab.js pour ajouter du contenu avec
//     le même mécanisme BANK_EXTEND que le reste de l'application.
//   - Certaines clés n'ont volontairement PAS d'entrée "kab" (ex :
//     "Niveau adapté", "Votre assistant a appris", les noms de niveaux
//     Doux/Intermédiaire/Avancé). Ce sont des tournures plus abstraites
//     pour lesquelles je n'ai pas de traduction que je juge assez fiable
//     sans relecture native. Dans ce cas, I18N.t() affiche automatiquement
//     le français — c'est un filet de sécurité, pas un bug. Ajoutez la
//     clé "kab" correspondante ici dès qu'une traduction fiable existe.
// =====================================================================

// =====================================================================
//  v6.1 — REGISTRE DES LANGUES DISPONIBLES
//  ---------------------------------------------------------------------
//  Pour ajouter une nouvelle langue à l'application :
//   1. Ajoutez une entrée ici (code + nom affiché dans le sélecteur).
//   2. Ajoutez un bloc de traductions dans I18N_STRINGS (une clé =
//      une traduction ; les clés absentes retombent automatiquement
//      sur le français, comme pour le kabyle — voir plus bas).
//   3. Rien à changer dans le HTML : le sélecteur de langue se génère
//      seul à partir de ce registre (voir Prefs.renderLangSwitcher()
//      dans js/prefs.js).
//  Ordre décidé avec l'utilisateur (v6.7) : anglais d'abord (langue la
//  mieux couverte par les dictionnaires ET par la reconnaissance/synthèse
//  vocale du navigateur — contrairement au kabyle, les exercices vocaux
//  ont de bonnes chances de fonctionner nativement), une langue complète
//  à la fois avant de passer à la suivante, puis arabe, italien, espagnol
//  (le champ `dir:'rtl'` ci-dessous existe déjà pour préparer l'arabe).
// =====================================================================
// v6.59 : langues "partielles" (vocabulaire de dénomination sourcé,
// mais pas de traduction complète de l'interface ni de synthèse/
// reconnaissance vocale) — jusqu'ici seul le kabyle, le sango vient
// s'y ajouter. Centralisé ici pour que la logique d'interface (voir
// js/prefs.js, js/app.js) n'ait plus besoin de vérifier "kab" en dur
// à chaque fois — ça évite d'oublier un endroit à chaque nouvelle
// langue partielle.
const PARTIAL_LANGS = ['kab', 'dz', 'ma', 'tn'];
const LANGUAGES = {
  fr:  { label:'🇫🇷 Français',  dir:'ltr', speechLocale:'fr-FR' },
  en:  { label:'🇺🇸 English',   dir:'ltr', speechLocale:'en-US' },
  es:  { label:'🇪🇸 Español',   dir:'ltr', speechLocale:'es-ES' },
  it:  { label:'🇮🇹 Italiano',  dir:'ltr', speechLocale:'it-IT' },
  pt:  { label:'🇵🇹 Português', dir:'ltr', speechLocale:'pt-PT' },
  de:  { label:'🇩🇪 Deutsch',   dir:'ltr', speechLocale:'de-DE' },
  ar:  { label:'🇸🇦 العربية',   dir:'rtl', speechLocale:'ar-SA' },
  tr:  { label:'🇹🇷 Türkçe',    dir:'ltr', speechLocale:'tr-TR' },
  pl:  { label:'🇵🇱 Polski',    dir:'ltr', speechLocale:'pl-PL' },
  // v6.100 : drapeau algérien pour le kabyle — choix explicite de
  // l'utilisateur après discussion (aucun émoji Unicode n'existe pour
  // le drapeau amazigh, propre à ce mouvement identitaire distinct de
  // l'Algérie ; l'alternative envisagée était de ne mettre aucun
  // drapeau plutôt que celui d'un État, ou un symbole texte ⵣ).
  kab: { label:'ⵣ Taqbaylit (en cours de traduction)', dir:'ltr', speechLocale:null },  // pas de synthèse/reconnaissance dispo — voir plus haut ; v6.105 : 🇩🇿 (drapeau algérien) remplacé par ⵣ (yaz, le symbole rouge du vrai drapeau kabyle/amazigh) — signalé par l'utilisateur : l'ancien emoji représentait mal une identité distincte. Aucun emoji de drapeau kabyle n'existe en Unicode (ce n'est pas un État), donc pas de vrai drapeau possible dans un <select> natif — le yaz est le symbole le plus proche et le plus reconnaissable. v6.122 : suffixe "(en cours de traduction)" ajouté sur demande de l'utilisateur — reste pertinent malgré l'interface à 448/448 : ~9 clés de l'écran de dépôt de bilan externe encore en français, et surtout pas de relecture clinique formelle (garde-fou n°8).
  // v6.94 : trois dialectes maghrébins ajoutés en langues partielles,
  // à la demande explicite de l'utilisateur, avec la même prudence que
  // le kabyle — voir le commentaire détaillé au-dessus du bloc
  // I18N_STRINGS.dz plus bas pour le pourquoi (risque de "arabe
  // standard à peine modifié" comme pour le sango). speechLocale:null
  // partout : aucun navigateur ne propose de voix dédiée à ces
  // dialectes (contrairement à l'arabe standard déjà présent).
  // v6.122 : suffixe "(en cours de traduction)" ajouté sur demande de
  // l'utilisateur — l'interface est à 448/448 pour les trois, mais le
  // contenu d'exercices reste très incomplet (dz : comprehension
  // manquante ; ma/tn : aucun contenu d'exercices du tout).
  dz: { label:'🇩🇿 الدارجة الجزائرية (en cours de traduction)', dir:'rtl', speechLocale:null },
  ma: { label:'🇲🇦 الدارجة المغربية (en cours de traduction)',  dir:'rtl', speechLocale:null },
  tn: { label:'🇹🇳 الدارجة التونسية (en cours de traduction)',  dir:'rtl', speechLocale:null },
  // v6.151 : sango retiré, demandé explicitement par l'utilisateur —
  // n'avait jamais dépassé 22 mots de dénomination, aucune interface
  // traduite (0/538), jamais devenu une vraie langue utilisable.
  // v6.91 : interface complète (403 clés traduites) — le japonais
  // rejoint les langues "complètes" ci-dessus, retiré de
  // PARTIAL_LANGS. Contenu des exercices fourni par l'utilisateur
  // (v6.89), interface traduite par mes soins (comme les 8 autres
  // langues complètes non-françaises) — en attente de relecture par
  // un∙e locuteur∙rice natif∙ve avant tout usage clinique réel, même
  // statut que le reste de l'app (garde-fou n°8).
  ja:  { label:'🇯🇵 日本語',     dir:'ltr', speechLocale:'ja-JP' }
};

// =====================================================================
//  v6.247 — LE DICTIONNAIRE N'EST PLUS DANS CE FICHIER
//  ---------------------------------------------------------------------
//  Les 14 langues vivaient ici, dans un seul fichier de 735 Ko chargé
//  intégralement à chaque ouverture — pour n'en utiliser qu'une seule.
//  Sur le téléphone d'entrée de gamme d'une personne âgée après un AVC,
//  c'était le poste de dépense le plus lourd de l'application.
//
//  Chaque langue est désormais dans js/i18n/<code>.js et s'enregistre
//  elle-même par I18N.register(). Le navigateur ne télécharge que le
//  français (toujours, car c'est le repli de t()) et la langue active.
//
//  Rien d'autre n'a changé : I18N.t(), I18N.rand(), I18N.apply() et
//  window.I18N_STRINGS se comportent exactement comme avant.
// =====================================================================
const I18N_STRINGS = {};

const I18N = {
  // v6.9 : accepte des valeurs sous forme de fonction, ex. session_result:(c,t)=>`...`
  // -> I18N.t('session_result', 3, 8). Rétrocompatible : les chaînes simples
  // fonctionnent comme avant.
  t(key, ...params){
    const lang = (window.Prefs && Prefs.data.lang) || 'fr';
    const raw = (I18N_STRINGS[lang] && I18N_STRINGS[lang][key]!==undefined ? I18N_STRINGS[lang][key] : undefined);
    const val = raw!==undefined ? raw : (I18N_STRINGS.fr[key]!==undefined ? I18N_STRINGS.fr[key] : key);
    if(typeof val==='function') return val(...params);
    if(Array.isArray(val)) return val[0]; // valeur stable ; voir I18N.rand() pour un tirage aléatoire
    return val;
  },
  // Pioche une valeur au hasard dans une clé qui contient un tableau (ex : phrases d'encouragement variées)
  rand(key){
    const lang = (window.Prefs && Prefs.data.lang) || 'fr';
    const bank = (I18N_STRINGS[lang] && I18N_STRINGS[lang][key]) || I18N_STRINGS.fr[key];
    if(!Array.isArray(bank) || !bank.length) return this.t(key);
    return bank[Math.floor(Math.random()*bank.length)];
  },
  // Renvoie le code de langue vocale (fr-FR, en-US...) de la langue active,
  // ou null si cette langue ne dispose pas de synthèse/reconnaissance fiable.
  speechLocale(){
    const lang = (window.Prefs && Prefs.data.lang) || 'fr';
    return (LANGUAGES[lang] && LANGUAGES[lang].speechLocale) || null;
  },
  // Applique les traductions à tous les éléments marqués data-i18n / data-i18n-placeholder
  apply(lang){
    document.documentElement.lang = lang;
    document.documentElement.dir = (LANGUAGES[lang] && LANGUAGES[lang].dir) || 'ltr';
    document.querySelectorAll('[data-i18n]').forEach(el=>{
      el.textContent = this.t(el.dataset.i18n);
    });
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el=>{
      el.placeholder = this.t(el.dataset.i18nPlaceholder);
    });
    // v6.79 : même mécanisme que data-i18n-placeholder, pour les champs
    // qui n'ont pas de <label> visible (ex : petit champ emoji, bouton
    // icône seule) — trouvé en auditant l'accessibilité : plusieurs
    // champs de formulaire n'avaient aucun nom accessible du tout.
    document.querySelectorAll('[data-i18n-aria-label]').forEach(el=>{
      el.setAttribute('aria-label', this.t(el.dataset.i18nAriaLabel));
    });
  }
};

// =====================================================================
//  v6.247 — ENREGISTREMENT ET CHARGEMENT DES LANGUES
// =====================================================================

// Appelé par chaque fichier js/i18n/<code>.js au moment où il se charge.
I18N.register = function(code, table){
  I18N_STRINGS[code] = table;
};

// Vrai si la langue est déjà en mémoire (fichier chargé).
I18N.estChargee = function(code){
  return !!I18N_STRINGS[code];
};

// Charge js/i18n/<code>.js si nécessaire. Renvoie une promesse tenue dès
// que les chaînes sont disponibles. Deux appels simultanés sur la même
// langue ne déclenchent qu'un seul téléchargement.
const _chargementsLangue = {};
I18N.charger = function(code){
  if(!LANGUAGES[code]) return Promise.reject(new Error('langue inconnue : ' + code));
  if(I18N.estChargee(code)) return Promise.resolve(code);
  if(_chargementsLangue[code]) return _chargementsLangue[code];
  _chargementsLangue[code] = new Promise(function(resoudre, rejeter){
    const s = document.createElement('script');
    s.src = 'js/i18n/' + code + '.js';
    s.onload = function(){
      delete _chargementsLangue[code];
      // Filet : si le fichier s'est chargé sans rien enregistrer, on ne
      // fait pas semblant que la langue est disponible.
      if(I18N.estChargee(code)) resoudre(code);
      else rejeter(new Error('js/i18n/' + code + '.js chargé mais vide'));
    };
    s.onerror = function(){
      delete _chargementsLangue[code];
      rejeter(new Error('js/i18n/' + code + '.js introuvable'));
    };
    document.head.appendChild(s);
  });
  return _chargementsLangue[code];
};

// Charge la langue PUIS applique les traductions. C'est le point d'entrée
// à utiliser lors d'un changement de langue : il garantit qu'on n'affiche
// jamais un écran à moitié traduit.
// En cas d'échec réseau, on n'échoue pas : t() retombe sur le français,
// qui est toujours chargé. Un écran en français vaut mieux qu'un écran
// vide — surtout pour quelqu'un qui cherche déjà ses mots.
I18N.appliquer = function(code){
  return I18N.charger(code)
    .catch(function(e){ console.warn('Traductions indisponibles, repli sur le français :', e && e.message); })
    .then(function(){ I18N.apply(code); });
};

window.I18N = I18N;
window.LANGUAGES = LANGUAGES;
window.PARTIAL_LANGS = PARTIAL_LANGS;
// v6.21 : I18N_STRINGS n'était accessible que par les fonctions de ce
// même fichier (I18N.t()) — jamais exposé sur `window` comme LANGUAGES
// l'est déjà. Ça n'avait causé aucun bug visible jusqu'ici par pure
// chance, mais c'est exactement la même fragilité qui a causé le bug
// v6.20 ailleurs. Corrigé pour que le script de vérification
// automatique (tests/i18n-completeness.test.js) puisse l'inspecter, et
// pour que ça ne devienne pas un bug plus tard.
window.I18N_STRINGS = I18N_STRINGS;
