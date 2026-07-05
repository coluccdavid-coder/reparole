// =====================================================================
//  COMPAGNON ANIMÉ "AMI" — v7
//  ---------------------------------------------------------------------
//  ⚠️ AUCUNE IA GÉNÉRATIVE / LLM ICI, ET C'EST VOLONTAIRE (garde-fou n°1
//  du projet, voir SKILL_ReParole_v6.md). Ami ne "comprend" rien : c'est
//  un dessin SVG animé (CSS pur, pas de dépendance) qui affiche une
//  phrase piochée au hasard dans une banque de phrases ÉCRITES À
//  L'AVANCE, selon un contexte précis (accueil, bonne réponse, erreur,
//  fin de séance...). Le mécanisme est donc entièrement testable et
//  prévisible, comme le reste du moteur d'exercices — pas de boîte
//  noire, pas de réponse inventée.
//
//  Pourquoi ce choix plutôt qu'un vrai agent conversationnel :
//   - Le public de cette app peut être vulnérable (troubles cognitifs
//     ou de compréhension post-AVC). Une IA qui semble "comprendre"
//     peut créer une confusion ou une confiance mal placée.
//   - Une boîte noire n'est pas vérifiable phrase par phrase. Cette
//     banque l'est : n'importe qui peut relire (et donc valider ou
//     corriger) chaque phrase avant qu'elle n'atteigne un patient.
//
//  RÈGLES DE CONTENU DE CE FICHIER — mêmes garde-fous que le reste :
//   - Jamais une phrase qui compare à une "norme" ou pourrait sembler
//     un diagnostic (garde-fou n°6).
//   - Jamais de phrase négative/moralisatrice après une erreur — on
//     encourage, sans minimiser ni forcer un ton faussement enjoué.
//   - Le score bas en fin de séance reste valorisé pour l'EFFORT, pas
//     pour une fausse réussite (cohérent avec le garde-fou n°5 : pas de
//     score truqué — Ami ne dit jamais "bravo, parfait" sur une séance
//     ratée, mais reste toujours bienveillant).
//
//  POUR AJOUTER UNE LANGUE : ajouter une clé dans COMPANION_PHRASES avec
//  les mêmes noms de contexte. Comme pour I18N, une langue incomplète
//  retombe automatiquement sur le français (voir Companion.pick).
// =====================================================================

const COMPANION_PHRASES = {
  fr: {
    // Accueil du patient sur le tableau de bord
    welcome: [
      "Contente de vous revoir !",
      "Prêt·e quand vous voudrez, on y va doucement.",
      "Une nouvelle séance, à votre rythme.",
      "Je suis là si vous avez besoin d'un coup de pouce."
    ],
    // v6.11 : quand le patient revient après plus d'un jour sans venir —
    // JAMAIS de reproche ni de culpabilisation ("ça fait longtemps",
    // compteur remis à zéro affiché comme un échec, etc.). Le seul but
    // est d'aider à reprendre l'habitude, pas de faire culpabiliser
    // quelqu'un qui a probablement d'autres priorités de santé.
    welcome_back: [
      "Content de vous revoir, peu importe la pause !",
      "Vous revoilà, c'est le principal — on reprend en douceur.",
      "Ravi de vous revoir. On repart tranquillement, à votre rythme."
    ],
    // v6.11 : quand le moteur adaptatif a un vrai conseil à donner (pas
    // le texte par défaut), Ami y renvoie plutôt que de le répéter —
    // voir renderDashboard() dans js/app.js.
    insight_pointer: [
      "J'ai un conseil pour vous juste en dessous 👇",
      "Regardez ce que j'ai remarqué pour vous, juste ici 👇",
      "J'ai ajusté quelque chose pour vous — le détail est juste en dessous."
    ],
    // v6.11 : conseils pratiques génériques sur la façon de s'entraîner
    // (rythme, régularité, repos) — PAS des conseils médicaux. Aucune
    // phrase ici ne doit évoquer un symptôme, un traitement, ou un avis
    // clinique : ça reste strictement hors de portée de cette app (voir
    // garde-fou n°8 et les disclaimers de js/assessment.js).
    tip: [
      "Un petit peu chaque jour aide souvent plus qu'une longue séance de temps en temps.",
      "Si vous êtes fatigué·e, une pause est toujours une bonne idée — on reprendra après.",
      "Pas besoin de tout réussir : chaque séance compte, même les difficiles.",
      "Vous pouvez noter votre code de suivi quelque part de sûr, pour le transmettre à votre orthophoniste si vous le souhaitez."
    ],
    // Au lancement d'un exercice
    exerciseStart: [
      "On y va, tranquillement.",
      "Prenez votre temps, il n'y a pas de chrono.",
      "Je reste avec vous pendant l'exercice."
    ],
    // Bonne réponse
    correct: [
      "Bravo !",
      "Voilà, exactement ça.",
      "Très bien !",
      "Parfait, on continue comme ça."
    ],
    // Plusieurs bonnes réponses d'affilée
    streak: [
      "Vous enchaînez bien, bravo !",
      "Trois de suite, belle régularité !",
      "Ça avance très bien, continuez ainsi."
    ],
    // Réponse incorrecte — jamais de ton négatif, jamais de fausse joie
    encourage: [
      "Pas grave, on continue.",
      "Ce n'est rien, on avance à votre rythme.",
      "On essaie la suivante, tranquillement.",
      "Aucun souci, chaque séance compte."
    ],
    // Fin de séance — le ton reste chaleureux quel que soit le score,
    // mais Ami ne dit jamais "bravo" sur un score bas (pas de fausse
    // réussite, cf. garde-fou n°5).
    sessionEnd_high: [
      "Belle séance, bravo pour votre travail !",
      "Très bonne séance aujourd'hui !"
    ],
    sessionEnd_mid: [
      "Bonne séance, merci d'être venu·e.",
      "C'est une séance de plus, et ça compte."
    ],
    sessionEnd_low: [
      "Merci d'être resté·e jusqu'au bout, c'est ce qui compte.",
      "Chaque séance aide, même quand c'est plus difficile.",
      "On se retrouve pour la prochaine, à votre rythme."
    ]
  },
  en: {
    welcome: [
      "Good to see you again!",
      "Ready whenever you are, nice and easy.",
      "A new session, at your own pace.",
      "I'm here if you need a hand."
    ],
    welcome_back: [
      "Good to see you, no matter the break!",
      "You're back, that's what matters — let's ease back in.",
      "Glad to see you again. We'll pick up gently, at your own pace."
    ],
    insight_pointer: [
      "I've got a tip for you just below 👇",
      "Take a look at what I've noticed, right here 👇",
      "I adjusted something for you — the detail is just below."
    ],
    tip: [
      "A little bit each day often helps more than one long session now and then.",
      "If you're tired, a break is always a good idea — we'll pick up again after.",
      "You don't need to get everything right: every session counts, even the hard ones.",
      "You can keep your follow-up code somewhere safe, to share with your speech therapist if you'd like."
    ],
    exerciseStart: [
      "Let's go, nice and easy.",
      "Take your time, there's no clock.",
      "I'll stay with you through this exercise."
    ],
    correct: [
      "Well done!",
      "That's it, exactly right.",
      "Very good!",
      "Perfect, keep it up."
    ],
    streak: [
      "You're on a roll, well done!",
      "Three in a row, great consistency!",
      "This is going really well, keep going."
    ],
    encourage: [
      "That's alright, let's carry on.",
      "No worries, we go at your own pace.",
      "Let's try the next one, gently.",
      "No problem at all, every session counts."
    ],
    sessionEnd_high: [
      "Great session, well done for your work!",
      "Really good session today!"
    ],
    sessionEnd_mid: [
      "Good session, thanks for coming.",
      "That's one more session, and it counts."
    ],
    sessionEnd_low: [
      "Thanks for staying until the end, that's what matters.",
      "Every session helps, even the harder ones.",
      "See you next time, at your own pace."
    ]
  }
};

const Companion = {
  mood: 'neutral',
  message: '',
  mounts: [],

  // Enregistre un conteneur DOM (id) où afficher Ami ; peut y en avoir
  // plusieurs en même temps (tableau de bord + écran d'exercice) — ils
  // restent synchronisés.
  mount(containerId){
    if(!this.mounts.includes(containerId)) this.mounts.push(containerId);
    this.render(containerId);
  },

  pick(context){
    const lang = (window.Prefs && Prefs.data.lang) || 'fr';
    const bank = (COMPANION_PHRASES[lang] && COMPANION_PHRASES[lang][context])
      || (COMPANION_PHRASES.fr[context]) || [];
    if(!bank.length) return '';
    return bank[Math.floor(Math.random()*bank.length)];
  },

  moodFor(context){
    if(context==='streak') return 'delighted';
    if(context==='correct') return 'happy';
    if(context==='encourage') return 'gentle';
    if(context && context.indexOf('sessionEnd')===0) return 'proud';
    return 'neutral';
  },

  say(context){
    this.message = this.pick(context);
    this.mood = this.moodFor(context);
    this.mounts.forEach(id=>this.render(id));
  },

  // Nom du personnage — volontairement identique dans toutes les langues
  // (comme "ReParole" reste "ReParole" en anglais), plutôt qu'un nom
  // traduit qui perdrait son identité.
  name(){ return 'Ami'; },

  render(containerId){
    const el = document.getElementById(containerId);
    if(!el) return;
    const textWrap = document.createElement('div');
    textWrap.className = 'companion-textwrap';
    const name = document.createElement('div');
    name.className = 'companion-name';
    name.textContent = this.name();
    const bubble = document.createElement('div');
    bubble.className = 'companion-bubble';
    bubble.setAttribute('role','status');
    bubble.setAttribute('aria-live','polite');
    bubble.textContent = this.message || '';
    textWrap.appendChild(name);
    textWrap.appendChild(bubble);
    el.innerHTML = this.svg(this.mood);
    el.appendChild(textWrap);
  },

  // v6.10 : Ami "marche sur place" (jambes qui alternent) et flotte
  // doucement (idle bob), et entre en scène (glisse + apparaît) à chaque
  // fois qu'il prend la parole — comme `render()` reconstruit le HTML à
  // chaque appel, l'animation d'entrée se rejoue naturellement à chaque
  // nouveau message, sans code de gestion d'état supplémentaire.
  // v6.15 : les animations des jambes/yeux passent de CSS
  // (transform-origin sur des formes SVG, comportement historiquement
  // capricieux selon les moteurs de rendu) à de l'animation SVG native
  // (<animateTransform>/<animate>, spec SMIL) — un mécanisme bien plus
  // ancien et beaucoup plus largement supporté, y compris sur d'anciens
  // navigateurs Android. Le point de rotation est passé explicitement en
  // paramètre ("rotate(-14 40 86)"), donc aucune ambiguïté possible sur
  // l'origine, contrairement à transform-origin qui a été la source de
  // plusieurs bugs successifs.
  //
  // L'accessibilité (préférence système "réduire les animations", et le
  // mode "lecture facilitée" de l'app) est vérifiée ICI en JS plutôt
  // qu'en CSS, car ces media-queries CSS n'ont pas d'effet sur les
  // animations SMIL : si l'une des deux est active, les balises
  // d'animation ne sont simplement pas générées — Ami reste alors une
  // image fixe, comme prévu.
  svg(mood){
    const mouths = {
      neutral:  'M 37 59 Q 50 63 63 59',
      happy:    'M 35 55 Q 50 72 65 55',
      delighted:'M 33 53 Q 50 77 67 53',
      gentle:   'M 39 60 Q 50 62 61 60',
      proud:    'M 35 56 Q 50 70 65 56'
    };
    const mouth = mouths[mood] || mouths.neutral;
    const reduceMotion = (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches)
      || !!(window.Prefs && Prefs.data && Prefs.data.dyslexia);

    const legLeftAnim  = reduceMotion ? '' : '<animateTransform attributeName="transform" type="rotate" values="-14 40 86;14 40 86;-14 40 86" dur="0.8s" repeatCount="indefinite"/>';
    const legRightAnim = reduceMotion ? '' : '<animateTransform attributeName="transform" type="rotate" values="14 60 86;-14 60 86;14 60 86" dur="0.8s" repeatCount="indefinite"/>';
    const eyeAnim       = reduceMotion ? '' : '<animate attributeName="ry" values="4.2;4.2;0.4;4.2;4.2" keyTimes="0;0.85;0.9;0.95;1" dur="5.5s" repeatCount="indefinite"/>';
    const sparkAnim     = reduceMotion ? '' : '<animateTransform attributeName="transform" type="translate" values="0 0;0 -4;0 0" dur="3.2s" repeatCount="indefinite"/>';
    const bobClass = reduceMotion ? '' : ' companion-animated';

    return (
      '<div class="companion-enter">'+
        '<svg class="companion-svg mood-'+mood+bobClass+'" viewBox="0 0 100 120" width="84" height="100" aria-hidden="true" focusable="false">'+
          '<ellipse class="companion-leg" cx="40" cy="96" rx="7" ry="10">'+legLeftAnim+'</ellipse>'+
          '<ellipse class="companion-leg" cx="60" cy="96" rx="7" ry="10">'+legRightAnim+'</ellipse>'+
          '<ellipse class="companion-body" cx="50" cy="52" rx="34" ry="30"/>'+
          '<ellipse class="companion-belly" cx="50" cy="65" rx="22" ry="12"/>'+
          '<ellipse class="companion-eye" cx="39" cy="45" rx="4.2" ry="4.2">'+eyeAnim+'</ellipse>'+
          '<ellipse class="companion-eye" cx="61" cy="45" rx="4.2" ry="4.2">'+eyeAnim+'</ellipse>'+
          '<path class="companion-mouth" d="'+mouth+'"/>'+
          '<circle class="companion-spark" cx="78" cy="16" r="5">'+sparkAnim+'</circle>'+
        '</svg>'+
      '</div>'
    );
  }
};

window.Companion = Companion;
window.COMPANION_PHRASES = COMPANION_PHRASES;
