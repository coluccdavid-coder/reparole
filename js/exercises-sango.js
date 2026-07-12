// =====================================================================
//  BANQUE D'EXERCICES EN SANGO (v6.59) — contenu partiel, volontairement
//  ---------------------------------------------------------------------
//  ⚠️ IMPORTANT — à lire avant d'utiliser ce contenu avec un patient :
//
//  1. Je ne suis pas locuteur natif du sango. La plupart des mots
//     ci-dessous ont été vérifiés auprès de sources fiables (dictionnaire
//     SIL International/Webonary, articles académiques cités dans la
//     bibliographie Wikipédia du sango) — voir les commentaires sur
//     chaque ligne. Certains ont ensuite été CONFIRMÉS DIRECTEMENT par
//     la personne sango-phone de l'utilisateur, ce qui compte plus
//     qu'une source écrite. Un seul mot (voir niveau 3, "olive/olivier")
//     reste incertain — voir la note dédiée plus bas.
//
//  2. Ce fichier a été construit AVANT une relecture complète dans
//     l'application elle-même : l'utilisateur va le montrer à sa
//     personne sango-phone pour qu'elle teste et corrige exercice par
//     exercice, directement dans l'interface plutôt que sur un
//     document. C'est volontaire — voir docs/sango-translation-request.md
//     pour tout l'historique de cette construction collaborative.
//
//  3. Seul le NIVEAU 1, 2 et 3 de l'exercice "Nommer les images" est
//     traduit ici (22 mots, parité avec les 22 mots d'origine du
//     kabyle). "Compléter la phrase" et "Comprendre la consigne" ne
//     sont PAS traduits — ces exercices demandent des phrases
//     grammaticalement correctes qu'une vérification mot à mot ne
//     suffit pas à garantir.
//
//  4. Les exercices qui utilisent le micro (répétition, dénomination
//     orale, fluence, conversation guidée) restent en français dans
//     TOUTE l'application, quelle que soit la langue choisie : aucune
//     synthèse ni reconnaissance vocale de navigateur ne prend en
//     charge le sango à ce jour. Voir js/i18n.js (speechLocale: null).
//
//  5. Certains mots n'ont pas d'équivalent sango direct et ont été
//     gardés/adaptés tels quels par la personne sango-phone elle-même
//     (pas une improvisation de ma part) : "pomme" (le fruit ne pousse
//     pas en Centrafrique) et "télévision" (mot importé, "tele
//     vision"). C'est un choix assumé, pas un oubli.
//
//  POUR CONTRIBUER / CORRIGER : ce fichier suit le même mécanisme que
//  js/exercises-kab.js (BANK_EXTEND) — ajoutez ou corrigez des entrées
//  ici, sans toucher au reste du code. Chaque entrée est indépendante.
// =====================================================================

window.BANK_SG = {
  denomination:{
    title:'Iri afongo',  // "Nomme les images" — construction directe (iri=nommer, afongo=images), non relue nativement, à confirmer avec la personne sango-phone comme le reste
    consigne:'Nyë ni ayeke nyën?',  // "Qu'est-ce que c'est ?" — construction directe, à confirmer nativement
    items:{
      1:[
        // nyâü = chat — dictionnaire SIL International (Webonary), non encore confirmé directement par la personne sango-phone
        {emoji:'🐱',answer:'NYÂÜ',choices:['NYÂÜ','SUSU','KONGÖ']},
        // pomme = pomme (mot français gardé tel quel) — CONFIRMÉ directement par la personne sango-phone de l'utilisateur : ce fruit ne pousse pas en Centrafrique, pas d'équivalent sango
        {emoji:'🍎',answer:'POMME',choices:['POMME','MÂPA','KONGÖ']},
        // da = maison — dictionnaire SIL International (Webonary), confirmé dans plusieurs phrases d'exemple du même dictionnaire (usage cohérent)
        {emoji:'🏠',answer:'DA',choices:['DA','KUTUKUTU','LÂ']},
        // lâ = soleil — confirmé par 2 sources indépendantes (dictionnaire SIL/Webonary + liste de vocabulaire nature, desmotsetdeslangues.eklablog.com)
        {emoji:'☀️',answer:'LÂ',choices:['LÂ','DA','KONGÖ']},
        // kutukutu = voiture — CONFIRMÉ directement par la personne sango-phone de l'utilisateur (je n'avais qu'une piste incertaine avant, trouvée dans une seule phrase d'exemple)
        {emoji:'🚗',answer:'KUTUKUTU',choices:['KUTUKUTU','DA','NYÂÜ']},
        // susu = poisson — dictionnaire SIL International (Webonary)
        {emoji:'🐟',answer:'SUSU',choices:['SUSU','NYÂÜ','POMME']},
        // kongö = fleur — dictionnaire SIL International (Webonary) + liste de vocabulaire nature (desmotsetdeslangues.eklablog.com)
        {emoji:'🌹',answer:'KONGÖ',choices:['KONGÖ','POMME','LÂ']},
        // mâpa = pain — dictionnaire SIL International (Webonary), confirmé dans une phrase d'exemple ("Lo te mâpa mîngi" = "il a mangé trop de pain")
        {emoji:'🍞',answer:'MÂPA',choices:['MÂPA','POMME','SUSU']}
      ],
      2:[
        // yângâ tî da = porte — le mot le mieux confirmé de toute cette liste : 4 sources académiques indépendantes citées dans une étude comparative (Gérard 1930, Taber 1965, Bouquiaux et al. 1984, Ngalasso-Mwatha 2013), littéralement "bouche de la maison"
        {emoji:'🚪',answer:'YÂNGÂ TÎ DA',choices:['YÂNGÂ TÎ DA','WÂLÏ-BÂGARA','MBÂRÂTÂ']},
        // tele vision = télévision (mot importé du français/anglais) — CONFIRMÉ directement par la personne sango-phone de l'utilisateur
        {emoji:'📺',answer:'TELE VISION',choices:['TELE VISION','DUKUSA','TONGOLO']},
        // bengbä = rouge — dictionnaire SIL International (Webonary)
        {emoji:'🔴',answer:'BENGBÄ',choices:['BENGBÄ','NGUÄNDRA','TONGOLO']},
        // wâlï-bâgara = vache (littéralement "femelle-bétail") — dictionnaire SIL International (Webonary)
        {emoji:'🐄',answer:'WÂLÏ-BÂGARA',choices:['WÂLÏ-BÂGARA','MBÂRÂTÂ','YÂNGÂ TÎ DA']},
        // tongolo = étoile — dictionnaire SIL International (Webonary), confirmé aussi dans une liste de vocabulaire nature (desmotsetdeslangues.eklablog.com)
        {emoji:'⭐',answer:'TONGOLO',choices:['TONGOLO','NGUÄNDRA','BENGBÄ']},
        // Dukusa = livre — CONFIRMÉ directement par la personne sango-phone de l'utilisateur
        {emoji:'📖',answer:'DUKUSA',choices:['DUKUSA','TELE VISION','YÂNGÂ TÎ DA']},
        // mbârâtâ = cheval — dictionnaire SIL International (Webonary)
        {emoji:'🐴',answer:'MBÂRÂTÂ',choices:['MBÂRÂTÂ','WÂLÏ-BÂGARA','YÂNGÂ TÎ DA']},
        // nguändra = neige — CONFIRMÉ directement par la personne sango-phone de l'utilisateur (surprise : un mot existe bien, malgré l'absence de neige en Centrafrique)
        {emoji:'❄️',answer:'NGUÄNDRA',choices:['NGUÄNDRA','BENGBÄ','TONGOLO']}
      ],
      3:[
        // vurü = blanc — dictionnaire SIL International (Webonary)
        {emoji:'⚪',answer:'VURÜ',choices:['VURÜ','WÔTORO','BÄMARÄ']},
        // wôtoro = abeille — dictionnaire SIL International (Webonary) + liste de vocabulaire nature (desmotsetdeslangues.eklablog.com)
        {emoji:'🐝',answer:'WÔTORO',choices:['WÔTORO','BÄMARÄ','KORÔRÖ']},
        // bagara ngasangbi = bœuf — CONFIRMÉ directement par la personne sango-phone de l'utilisateur (plus précis que mes pistes : je n'avais que "bâgara", racine générale bovine, sans certitude sur le mot exact pour "bœuf")
        {emoji:'🐂',answer:'BAGARA NGASANGBI',choices:['BAGARA NGASANGBI','KORÔRÖ','BÄMARÄ']},
        // korôrö = âne — dictionnaire SIL International (Webonary) + liste de vocabulaire nature (desmotsetdeslangues.eklablog.com)
        {emoji:'🫏',answer:'KORÔRÖ',choices:['KORÔRÖ','BAGARA NGASANGBI','WÔTORO']},
        // bämarä = lion — dictionnaire SIL International (Webonary)
        {emoji:'🦁',answer:'BÄMARÄ',choices:['BÄMARÄ','KORÔRÖ','VURÜ']},
        // ⚠️ MOT INCERTAIN — voir la note ci-dessous avant d'utiliser cette entrée avec un patient
        {emoji:'🥔',answer:'LINGO TI POMME DE TERRE',choices:['LINGO TI POMME DE TERRE','VURÜ','WÔTORO']}
      ]
      // "Compléter la phrase" et "Comprendre la consigne" : pas traduits —
      // voir docs/kabyle-parity-request.md pour la méthode déjà utilisée
      // sur le kabyle (mêmes questions à traiter un jour pour le sango).
    }
  }
};

// =====================================================================
//  NOTE SUR LE DERNIER MOT (🥔) — À CONFIRMER AVEC LA PERSONNE SANGO-PHONE
//  ---------------------------------------------------------------------
//  Le concept d'origine était "olive/olivier" (🫒), qui ne pousse pas en
//  Centrafrique. La réponse reçue — "lingo ti pomme de terre" — n'est
//  pas claire pour moi : je ne sais pas ce que signifie précisément
//  "lingo" dans ce contexte (littéralement quelque chose comme "lingo
//  de la pomme de terre"). J'ai provisoirement :
//  - changé l'emoji de 🫒 (olive) à 🥔 (pomme de terre), pour que
//    l'image corresponde au moins visuellement au mot donné plutôt que
//    de montrer une olive à côté d'un texte qui parle d'autre chose ;
//  - gardé la réponse EXACTEMENT telle que transmise, sans la modifier
//    ni la deviner davantage.
//  Quand la personne sango-phone testera cet exercice précis dans
//  l'app, elle verra directement s'il y a un problème et pourra le
//  corriger sur place — c'est exactement pour ça que ce mot est inclus
//  malgré l'incertitude, plutôt que laissé de côté.
// =====================================================================
