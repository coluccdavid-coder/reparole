// =====================================================================
//  v6.7 — "Compléter la phrase" reste volontairement HORS de ce fichier.
//  Le brouillon (docs/kabyle-completion-draft.md) a été mis à jour :
//  2 des 4 phrases sont maintenant re-vérifiées mot pour mot sur Glosbe,
//  et le distracteur non vérifié a été remplacé par du vocabulaire déjà
//  présent dans cette app. Il ne manque plus qu'une relecture native des
//  accords grammaticaux pour les intégrer ici en toute confiance — ce
//  n'est pas quelque chose que je peux vérifier moi-même de façon fiable.
// =====================================================================

// =====================================================================
//  BANQUE D'EXERCICES EN KABYLE (v6) — contenu partiel, volontairement
//  ---------------------------------------------------------------------
//  ⚠️ IMPORTANT — à lire avant d'utiliser ce contenu avec un patient :
//
//  1. Je ne suis pas locuteur natif du kabyle. Le vocabulaire ci-dessous
//     a été vérifié mot par mot auprès de sources kabyles (kabyle.com,
//     Glosbe, l'Encyclopédie berbère, apprendrelekabyle.com — ce dernier
//     propose même des enregistrements audio natifs, voir README.md pour
//     l'idée d'utiliser cette ressource) — voir les commentaires sur
//     chaque ligne — mais reste à faire relire par une personne
//     kabylophone, idéalement un·e orthophoniste, avant tout usage
//     clinique. Une vérification de sources n'égale pas une relecture
//     native.
//
//  2. Les NIVEAUX 1, 2 et 3 de l'exercice "Nommer les images" sont
//     traduits ici, avec un vocabulaire simple et largement attesté.
//     Les exercices "Compléter la phrase" et "Comprendre la consigne"
//     ne sont PAS encore traduits : les phrases complètes demandent des
//     accords grammaticaux (genre, personne, temps) que je préfère ne
//     pas improviser sans relecture native, plutôt que de risquer des
//     phrases incorrectes dans un outil de rééducation du langage. Voir
//     docs/kabyle-completion-draft.md pour un brouillon en attente.
//
//  3. Les exercices qui utilisent le micro (répétition, dénomination
//     orale, fluence, conversation guidée) restent en français dans
//     TOUTE l'application, quelle que soit la langue choisie : la
//     reconnaissance et la synthèse vocales du navigateur ne prennent
//     pas en charge le kabyle à ce jour. Voir js/i18n.js.
//
//  POUR CONTRIBUER / CORRIGER : ce fichier suit le même mécanisme que
//  js/exercises.js (BANK_EXTEND) — ajoutez ou corrigez des entrées ici,
//  sans toucher au reste du code. Chaque entrée est indépendante.
// =====================================================================

window.BANK_KAB = {
  denomination:{
    title:'Semmi tugniwin',  // "Nomme les images" — confirmé : semmi=nommer (vieux dictionnaire franco-kabyle + article académique), tugna/tugniwin=image(s) (Wiktionnaire, Glosbe, titre académique)
    consigne:'D acu-t?',      // "Qu'est-ce que c'est ?" — construction attestée dans le corpus Glosbe ("dacu-t" = "quoi c'est"), confiance modérée (pas une phrase entière relue par un natif)
    items:{
      1:[
        // amcic = chat (confirmé kabyle.com) / aqjun = chien (confirmé, Glosbe+Encyclopédie berbère) / aqnin = lapin (confirmé, Encyclopédie berbère)
        {emoji:'🐱',answer:'AMCIC',choices:['AMCIC','AQJUN','AQNIN']},
        // taḍeffut = pomme (confirmé Glosbe, ex. "tatteffaḥt/tteffaḥ" aussi attesté régionalement) / tifirest = poire / tabexsist = figue (confirmé apprendrelekabyle.com — utilisé ici comme distracteur, pas comme "abricot" contrairement à une première hypothèse corrigée)
        {emoji:'🍎',answer:'TAḌEFFUT',choices:['TIFIREST','TAḌEFFUT','TABEXSIST']},
        // axxam = maison (confirmé kabyle.com) / takeṛṛust = voiture (confirmé Glosbe, très large corpus) / aseklu = arbre (non vérifié par une source)
        {emoji:'🏠',answer:'AXXAM',choices:['AXXAM','TAKEṚṚUST','ASEKLU']},
        // tafukt = soleil (confirmé Glosbe/Wiktionnaire ; iṭij est une variante tout aussi valable) / aggur = lune (variante de "ayyur", non vérifié exact) / asigna = nuage (non vérifié)
        {emoji:'☀️',answer:'TAFUKT',choices:['TAFUKT','AGGUR','ASIGNA']},
        // takeṛṛust = voiture (confirmé) / aɛewdiw = cheval (non vérifié) / lbabuṛ = bateau (non vérifié)
        {emoji:'🚗',answer:'TAKEṚṚUST',choices:['TAKEṚṚUST','AƐEWDIW','LBABUṚ']},
        // aslem = poisson (confirmé Glosbe) / afrux = oiseau (non vérifié) / aɛewdiw = cheval (non vérifié)
        {emoji:'🐟',answer:'ASLEM',choices:['ASLEM','AFRUX','AƐEWDIW']},
        // tajeǧǧigt = fleur (confirmé kabyle.com + corpus Glosbe ; ajeǧǧig/tanewwart sont des variantes valables) / aseklu = arbre (non vérifié) / aɣanim = roseau (non vérifié)
        {emoji:'🌹',answer:'TAJEǦǦIGT',choices:['TAJEǦǦIGT','ASEKLU','AƔANIM']},
        // aɣrum = pain (confirmé kabyle.com + Wikipédia) / ayefki = lait (confirmé, plusieurs sources) / aman = eau (confirmé Glosbe)
        {emoji:'🍞',answer:'AƔRUM',choices:['AƔRUM','AYEFKI','AMAN']}
      ],
      // v6.1 : niveau 2 — 4 items, avec le même niveau d'exigence de vérification
      // (moins d'items qu'en français : je préfère un niveau 2 plus court mais
      // fiable, plutôt que de compléter à 8 avec des mots non vérifiés).
      2:[
        // tabburt (variante : tawwurt) = porte — confirmé Glosbe, très large corpus
        {emoji:'🚪',answer:'TABBURT',choices:['TABBURT','AXXAM','TAKEṚṚUST']},
        // tiliẓri = télévision — confirmé Glosbe ("Tiliẓri-w ahat 14 iseggasen...")
        {emoji:'📺',answer:'TILIẔRI',choices:['TILIẔRI','AXXAM','TAKEṚṚUST']},
        // azeggaɣ = rouge — confirmé Glosbe + apprendrelekabyle.com (liste couleurs)
        {emoji:'🔴',answer:'AZEGGAƔ',choices:['AZEGGAƔ','TAFUKT','AMAN']},
        // adfel = neige — confirmé Glosbe ("En kabyle neige signifie : adfel")
        {emoji:'❄️',answer:'ADFEL',choices:['ADFEL','AGEFFUR','TAFUKT']}
      ],
      // v6.2 : niveau 3 — vocabulaire trouvé sur apprendrelekabyle.com (liste
      // de vocabulaire du site, voix française/kabyle par Amélie S. et Moh A.)
      3:[
        // amellal = blanc / aberkan = noir / aweraɣ = jaune (tous confirmés, liste couleurs apprendrelekabyle.com)
        {emoji:'⚪',answer:'AMELLAL',choices:['AMELLAL','ABERKAN','AWERAƔ']},
        // tizizwit = abeille (confirmé apprendrelekabyle.com) / aqjun = chien / aqnin = lapin
        {emoji:'🐝',answer:'TIZIZWIT',choices:['TIZIZWIT','AQJUN','AQNIN']},
        // azger = bœuf (confirmé apprendrelekabyle.com) / amcic = chat / aqnin = lapin
        {emoji:'🐂',answer:'AZGER',choices:['AZGER','AMCIC','AQNIN']}
      ]
      // "Compléter la phrase" et "Comprendre la consigne" : toujours pas
      // traduits — voir docs/kabyle-completion-draft.md pour un brouillon
      // basé sur des phrases réelles de corpus, en attente de relecture.
    }
  }
  // completion, comprehension : à traduire.
};

// =====================================================================
//  v6.1 — SON EN KABYLE : mécanisme, PAS de synthèse vocale inventée
//  ---------------------------------------------------------------------
//  Aucune voix ne peut aujourd'hui prononcer du kabyle correctement (ni
//  la synthèse du navigateur, ni une génération artificielle par ce
//  prototype — ce serait pire que rien). Ce que ce fichier prépare :
//  un mécanisme qui joue un VRAI enregistrement audio si vous en
//  déposez un, et qui l'indique clairement sinon (jamais de silence
//  trompeur, jamais de fausse voix).
//
//  Pour ajouter un enregistrement réel (vous, un proche, un·e
//  orthophoniste kabylophone) :
//   1. Enregistrez le mot (ex. avec le dictaphone du téléphone), export
//      en .mp3 ou .m4a.
//   2. Nommez le fichier avec le mot en minuscules, sans diacritiques,
//      espaces remplacés par "-" (voir kabAudioSlug ci-dessous).
//      Exemple : "TAḌEFFUT" → taddeffut.mp3
//   3. Déposez le fichier dans audio/kab/ (voir audio/kab/README.md).
//  Rien d'autre à faire : l'app détecte automatiquement le fichier.
// =====================================================================
function kabAudioSlug(word){
  return (word||'').toLowerCase()
    .replace(/[ɣ]/g,'gh').replace(/[ḥ]/g,'h').replace(/[ɛ]/g,'aa').replace(/[ṛ]/g,'r')
    .replace(/[ṣ]/g,'s').replace(/[ṭ]/g,'t').replace(/[ẓ]/g,'z').replace(/[ḍ]/g,'d').replace(/[ǧ]/g,'j')
    .normalize('NFD').replace(/[\u0300-\u036f]/g,'')
    .replace(/[^a-z0-9]+/g,'-').replace(/(^-|-$)/g,'');
}
// Tente de jouer un enregistrement réel ; sinon prévient au lieu de rester muet.
function playKabWord(word, onMissing){
  const slug = kabAudioSlug(word);
  const audio = new Audio(`audio/kab/${slug}.mp3`);
  audio.play().catch(()=>{ if(onMissing) onMissing(); });
  audio.onerror = ()=>{ if(onMissing) onMissing(); };
}
if(typeof window!=='undefined'){ window.kabAudioSlug = kabAudioSlug; window.playKabWord = playKabWord; }
