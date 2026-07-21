// =====================================================================
//  BANQUE D'EXERCICES EN KABYLE (v6.104) — contenu partiel
//  ---------------------------------------------------------------------
//  ⚠️ IMPORTANT — à lire avant d'utiliser ce contenu avec un patient :
//
//  1. VOCABULAIRE DE BASE (v6.1-v6.37, 22 mots — voir NIVEAU 1/2/3 pour
//     le détail) : sourcé mot par mot par moi-même auprès de plusieurs
//     sources kabyles indépendantes (kabyle.com, Glosbe, l'Encyclopédie
//     berbère, apprendrelekabyle.com) — voir les commentaires sur chaque
//     ligne. Une vérification de sources n'égale pas une relecture
//     native.
//
//  2. DÉNOMINATION ÉTENDUE + COMPLÉTION + COMPRÉHENSION (v6.104, 92+24+18
//     items) : fournies intégralement par l'utilisateur (fichier
//     Kabyle_Complet.xlsx), traduites/relues par une personne
//     kabylophone d'après l'utilisateur — je n'ai inventé aucun mot ni
//     aucune phrase. C'est ce qui débloque le garde-fou n°3 (jamais de
//     grammaire/phrase inventée sans relecture native) pour la
//     complétion et la compréhension, qui étaient bloquées depuis la
//     v6.7 faute d'une vraie relecture native (voir
//     docs/kabyle-completion-draft.md pour l'historique — dépassé
//     depuis, conservé pour mémoire).
//
//     Ce que j'ai généré moi-même dans ce lot : uniquement les choix
//     multiples (distracteurs), toujours puisés dans le vocabulaire
//     déjà fourni (existant + nouveau) pour ce même exercice — jamais
//     un mot ou une forme grammaticale ajoutée de mon cru. 5 phrases de
//     complétion ont demandé un ajustement : le mot à blanquer dans la
//     phrase n'était pas toujours identique au "mot attendu" isolé de
//     la colonne source, à cause de l'état d'annexion du kabyle (le nom
//     change de forme selon sa position dans la phrase — ex. "aẓekka"
//     à l'état libre devient "uẓekka" après une préposition). C'est la
//     forme réellement présente dans la phrase qui a été blanquée.
//
//     ⚠️ Malgré la relecture par une personne kabylophone, ceci reste un
//     premier jet : pas de validation clinique, pas de relecture par
//     un∙e orthophoniste kabylophone — garde-fou n°8, toujours en
//     attente pour l'ensemble de l'app.
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
        {emoji:'🍞',answer:'AƔRUM',choices:['AƔRUM','AYEFKI','AMAN']},
        // v6.104 — 22 mots ajoutés (fichier Kabyle_Complet.xlsx, traduits/relus
        // par une personne kabylophone d'après l'utilisateur — voir README
        // pour le détail). "Vache/Tafunast" du fichier a été ignoré ici : déjà
        // présent au niveau 2 (voir plus bas), pour éviter un doublon.
        {emoji:'🐶',answer:'AQJUN',choices:['TAKEṚṚUST','AQJUN','AƔERDA']},
        {emoji:'🐰',answer:'AWTUL',choices:['AXXAM','AWTUL','TAQENDURT']},
        {emoji:'🐷',answer:'AḤELLUF',choices:['AKANAR','FRAWLA','AḤELLUF']},
        {emoji:'🐭',answer:'AƔERDA',choices:['AƔERDA','AXXAM','TAḌEFFUT']},
        {emoji:'🦆',answer:'AKANAR',choices:['AƔRUM','AXXAM','AKANAR']},
        {emoji:'🥚',answer:'TAMELLALT',choices:['TAḌEFFUT','TAMELLALT','TAQENDURT']},
        {emoji:'🧀',answer:'AFROMAJ',choices:['AFROMAJ','AKANAR','LBANAN']},
        {emoji:'🥛',answer:'AƔU',choices:['LLIM','ADIL','AƔU']},
        {emoji:'🍌',answer:'LBANAN',choices:['ADIL','FRAWLA','LBANAN']},
        {emoji:'🍊',answer:'LLIM',choices:['LLIM','TAZARET','AḤELLUF']},
        {emoji:'🍇',answer:'ADIL',choices:['AWTUL','ADIL','TAZARET']},
        {emoji:'🍓',answer:'FRAWLA',choices:['FRAWLA','TAKERSI','AXXAM']},
        {emoji:'🥕',answer:'TAZARET',choices:['TAQENDURT','TAZARET','SERWAL']},
        {emoji:'🌙',answer:'AGGUR',choices:['AXXAM','AGGUR','AWTUL']},
        {emoji:'☁️',answer:'ASIGNA',choices:['LBANAN','AXXAM','ASIGNA']},
        {emoji:'🌧️',answer:'AƔFFUR',choices:['AƔFFUR','AƔU','FRAWLA']},
        {emoji:'🔑',answer:'TASARUT',choices:['ADIL','TASARUT','AKANAR']},
        {emoji:'🪑',answer:'TAKERSI',choices:['ASEBBAḌ','TAKERSI','AƔU']},
        {emoji:'🛏️',answer:'AẒEKKA',choices:['TAQENDURT','SERWAL','AẒEKKA']},
        {emoji:'👕',answer:'TAQENDURT',choices:['TAQENDURT','AGGUR','AKANAR']},
        {emoji:'👖',answer:'SERWAL',choices:['TASARUT','TAQENDURT','SERWAL']},
        {emoji:'👟',answer:'ASEBBAḌ',choices:['AFROMAJ','AWTUL','ASEBBAḌ']}
      ],
      // v6.1 : niveau 2, avec le même niveau d'exigence de vérification qu'au
      // niveau 1 (que des mots croisant plusieurs sources indépendantes).
      // v6.37 : complété à 8 items (parité avec le français) avec 4 nouveaux
      // mots sourcés — voir README pour le détail des sources par mot.
      2:[
        // tabburt (variante : tawwurt) = porte — confirmé Glosbe, très large corpus
        {emoji:'🚪',answer:'TABBURT',choices:['TABBURT','AXXAM','TAKEṚṚUST']},
        // tiliẓri = télévision — confirmé Glosbe ("Tiliẓri-w ahat 14 iseggasen...")
        {emoji:'📺',answer:'TILIẔRI',choices:['TILIẔRI','AXXAM','TAKEṚṚUST']},
        // azeggaɣ = rouge — confirmé Glosbe + apprendrelekabyle.com (liste couleurs)
        {emoji:'🔴',answer:'AZEGGAƔ',choices:['AZEGGAƔ','TAFUKT','AMAN']},
        // v6.37 — 4 mots ajoutés, même niveau d'exigence (sources multiples, voir README) :
        // tafunast = vache — confirmé Glosbe + dictionnaire-kabyle.com + Wiktionnaire (3 sources concordantes)
        {emoji:'🐄',answer:'TAFUNAST',choices:['TAFUNAST','AZGER','AQNIN']},
        // itri = étoile — confirmé Glosbe (très large corpus) + Encyclopédie berbère (journals.openedition.org) + kabyle.com (alphabet, exemple "Itri (Étoile)")
        {emoji:'⭐',answer:'ITRI',choices:['ITRI','TAFUKT','AMAN']},
        // adlis = livre — confirmé Glosbe, très large corpus de phrases attestées
        {emoji:'📖',answer:'ADLIS',choices:['ADLIS','TABBURT','TILIẔRI']},
        // agmar = cheval — confirmé Glosbe + article académique (books.openedition.org, lexique berbère du cheval) + kabyle.com
        {emoji:'🐴',answer:'AGMAR',choices:['AGMAR','AQJUN','TAFUNAST']},
        // adfel = neige — confirmé Glosbe ("En kabyle neige signifie : adfel")
        {emoji:'❄️',answer:'ADFEL',choices:['ADFEL','AGEFFUR','TAFUKT']},
        // v6.104 — 34 mots ajoutés (fichier Kabyle_Complet.xlsx, voir en-tête du fichier)
        {emoji:'🦋',answer:'AFERFAR',choices:['TAMRINT','AFERFAR','TAZERRAFT']},
        {emoji:'⌚',answer:'TAMRINT',choices:['TAMRINT','AVYULUN',"AƔERBAZ S LERYAḤ"]},
        {emoji:'🎻',answer:'AVYULUN',choices:['ADDAD','AVYULUN','TARUMPIT']},
        {emoji:'🍄',answer:'ADDAD',choices:['ADDAD','AVULKAN','AYZEM']},
        {emoji:'🦒',answer:'TAZERRAFT',choices:['TAZERRAFT','TABERWALT','AQCICER']},
        {emoji:'⛵',answer:'AƔERBAZ S LERYAḤ',choices:['AƔERBAZ S LERYAḤ','TARUMPIT','AVULKAN']},
        {emoji:'🎺',answer:'TARUMPIT',choices:['TARUMPIT','AYZEM','TAGITART']},
        {emoji:'🌋',answer:'AVULKAN',choices:['AVULKAN','ADDAD','AḌEBBAL']},
        {emoji:'🦌',answer:'AYZEM',choices:['AYZEM','TABERWALT','AQCICER']},
        {emoji:'🦉',answer:'TABERWALT',choices:['TABERWALT','AƔERF','TAZREMT']},
        {emoji:'🦅',answer:'AQCICER',choices:['AQCICER','AXTUBUS','AKRAB']},
        {emoji:'🐢',answer:'AƔERF',choices:['AƔERF','TAZREMT','AXTUBUS']},
        {emoji:'🦎',answer:'TAZREMT',choices:['TAZREMT','AƔERF','AKRAB']},
        {emoji:'🐙',answer:'AXTUBUS',choices:['AXTUBUS','AKRAB','TAGITART']},
        {emoji:'🦀',answer:'AKRAB',choices:['AKRAB','AXTUBUS','AḌEBBAL']},
        {emoji:'🎸',answer:'TAGITART',choices:['TAGITART','APYANU','ASAKSIFUN']},
        {emoji:'🥁',answer:'AḌEBBAL',choices:['AḌEBBAL','TAGITART','APYANU']},
        {emoji:'🎹',answer:'APYANU',choices:['APYANU','ASAKSIFUN','AḌEBBAL']},
        {emoji:'🎷',answer:'ASAKSIFUN',choices:['ASAKSIFUN','APYANU','TARUMPIT']},
        {emoji:'⛰️',answer:'ADRAR',choices:['ADRAR','TAFTIST','LMUJA']},
        {emoji:'🏝️',answer:'TAFTIST',choices:['TAFTIST','ADRAR','LMUJA']},
        {emoji:'🌊',answer:'LMUJA',choices:['LMUJA','TAFTIST','TAQENṬERT']},
        {emoji:'🌉',answer:'TAQENṬERT',choices:['TAQENṬERT','LQELƐA','TAQECCABT']},
        {emoji:'🏰',answer:'LQELƐA',choices:['LQELƐA','TAQENṬERT','TAQECCABT']},
        {emoji:'🗼',answer:'TAQECCABT',choices:['TAQECCABT','LQELƐA','TALA']},
        {emoji:'⛲',answer:'TALA',choices:['TALA','TAQECCABT','TUGNA']},
        {emoji:'🖼️',answer:'TUGNA',choices:['TUGNA','TALA','TAKAMIRA']},
        {emoji:'🎥',answer:'TAKAMIRA',choices:['TAKAMIRA','TUGNA','AMPUL']},
        {emoji:'💡',answer:'AMPUL',choices:['AMPUL','FANUS','TAKAMIRA']},
        {emoji:'🏮',answer:'FANUS',choices:['FANUS','AMPUL','APARASUL']},
        {emoji:'⛱️',answer:'APARASUL',choices:['APARASUL','FANUS','AHDAY']},
        {emoji:'🎁',answer:'AHDAY',choices:['AHDAY','APARASUL','TABALLUNT']},
        {emoji:'🎈',answer:'TABALLUNT',choices:['TABALLUNT','AHDAY','APUZEL']},
        {emoji:'🧩',answer:'APUZEL',choices:['APUZEL','TABALLUNT','FANUS']}
      ],
      // v6.2 : niveau 3 — vocabulaire trouvé sur apprendrelekabyle.com (liste
      // de vocabulaire du site, voix française/kabyle par Amélie S. et Moh A.).
      // v6.37 : complété à 6 items avec 3 nouveaux mots sourcés.
      3:[
        // amellal = blanc / aberkan = noir / aweraɣ = jaune (tous confirmés, liste couleurs apprendrelekabyle.com)
        {emoji:'⚪',answer:'AMELLAL',choices:['AMELLAL','ABERKAN','AWERAƔ']},
        // tizizwit = abeille (confirmé apprendrelekabyle.com) / aqjun = chien / aqnin = lapin
        {emoji:'🐝',answer:'TIZIZWIT',choices:['TIZIZWIT','AQJUN','AQNIN']},
        // azger = bœuf (confirmé apprendrelekabyle.com) / amcic = chat / aqnin = lapin
        {emoji:'🐂',answer:'AZGER',choices:['AZGER','AMCIC','AQNIN']},
        // v6.37 — 3 mots ajoutés, même niveau d'exigence (sources multiples, voir README) :
        // aɣyul = âne — confirmé Glosbe + kabyle.com/polyglotclub (liste vocabulaire animaux, avec audio natif référencé)
        {emoji:'🫏',answer:'AƔYUL',choices:['AƔYUL','AGMAR','AZGER']},
        // izem = lion — confirmé Glosbe (usage attesté, phrase de corpus) + Encyclopédie berbère (journals.openedition.org)
        {emoji:'🦁',answer:'IZEM',choices:['IZEM','AQJUN','AMCIC']},
        // azemmur = olive/olivier — confirmé Glosbe (très large corpus) + Encyclopédie berbère (Chaker, "Azemmur", 1990) + dictionnaire-kabyle.com + kabyle.com ; symbole culturel fort de la Kabylie
        {emoji:'🫒',answer:'AZEMMUR',choices:['AZEMMUR','TAJEǦǦIGT','AƔRUM']},
        // v6.104 — 35 mots ajoutés (fichier Kabyle_Complet.xlsx, voir en-tête du fichier)
        {emoji:'🧭',answer:'TAKUMPAST',choices:['LANKUR','TAKUMPAST','ATAWUS']},
        {emoji:'🦔',answer:'INISI',choices:['LLUTRA','INISI','TAMENSART']},
        {emoji:'⚓',answer:'LANKUR',choices:['ABANJU','TAKUMPAST','LANKUR']},
        {emoji:'🔬',answer:'AMIKRUSKUP',choices:['AMIKRUSKUP','BULUN','AFLAMINGU']},
        {emoji:'🪕',answer:'ABANJU',choices:['ASIGN','AƔEWWAR','ABANJU']},
        {emoji:'🦦',answer:'LLUTRA',choices:['LLUTRA','TAKUMPAST','TASEGNIT']},
        {emoji:'🌪️',answer:'TAZZAYT N WUḌU',choices:['TAZZAYT N WUḌU',"IƔISI N WAKAL",'ASENSI N TMES']},
        {emoji:'🛡️',answer:'AMESTAN',choices:['BABAƔI','AMESTAN','ASKUNK']},
        {emoji:'🦥',answer:'ASLAS',choices:['AMIKRUSKUP','AQECCAC','ASLAS']},
        {emoji:'🦫',answer:'ABASTUR',choices:['TAXXAST','ABASTUR','AQRAB']},
        {emoji:'🦨',answer:'ASKUNK',choices:['AMIKRUSKUP','AQRAB','ASKUNK']},
        {emoji:'🦩',answer:'AFLAMINGU',choices:['ATILISKUP','AFLAMINGU','ABANJU']},
        {emoji:'🦚',answer:'ATAWUS',choices:['ATILISKUP','ATAWUS','LANKUR']},
        {emoji:'🦜',answer:'BABAƔI',choices:['BABAƔI','AKRUKUDIL','BULUN']},
        {emoji:'🦢',answer:'ASIGN',choices:['AQECCAC','BABAƔI','ASIGN']},
        {emoji:'🧪',answer:'TABUBBT N TESREFT',choices:['TABUBBT N TESREFT','AMESTAN','ASLAS']},
        {emoji:'🔭',answer:'ATILISKUP',choices:['ASENSI N TMES','AQECCAC','ATILISKUP']},
        {emoji:'🧲',answer:'IMENANT',choices:['ASENSI N TMES','TAZZAYT N WUḌU','IMENANT']},
        {emoji:'⚖️',answer:'LMIZAN',choices:['ATILISKUP','AQRAB','LMIZAN']},
        {emoji:'🏺',answer:'IƔISI N WAKAL',choices:['IƔISI N WAKAL','TABUBBT N TESREFT','ABANJU']},
        {emoji:'⚔️',answer:'TAKUBA',choices:['TAKUBA','ASKUNK','TAMENSART']},
        {emoji:'🏹',answer:'AQECCAC',choices:['AQECCAC','AKRUKUDIL','TAKUMPAST']},
        {emoji:'🎪',answer:'AXXAM N USIRK',choices:['ASLAS','AXXAM N USIRK','TAZZAYT N WUḌU']},
        {emoji:'🎠',answer:'LMANEJ',choices:['LMANEJ','ABASTUR','TAZZAYT N WUḌU']},
        {emoji:'🎯',answer:'ASAḌAS',choices:['AQECCAC','BABAƔI','ASAḌAS']},
        {emoji:'🪡',answer:'TASEGNIT',choices:['AẒEṬṬA N TIKKELT','TASEGNIT','AQRAB']},
        {emoji:'⚙️',answer:'AƔEWWAR',choices:['TAMENSART','AƔEWWAR','LLUTRA']},
        {emoji:'🔩',answer:'BULUN',choices:['AQECCAC','TAKUMPAST','BULUN']},
        {emoji:'🪛',answer:'TURNAVIS',choices:['TURNAVIS','ASKUNK','TAMENSART']},
        {emoji:'🪚',answer:'TAMENSART',choices:['TAKUMPAST','AƔEWWAR','TAMENSART']},
        {emoji:'🧯',answer:'ASENSI N TMES',choices:['ASENSI N TMES','LANKUR','LMANEJ']},
        {emoji:'🪤',answer:'TAXXAST',choices:['ABASTUR','BULUN','TAXXAST']},
        {emoji:'🕸️',answer:'AẒEṬṬA N TIKKELT',choices:['LANKUR','TAXXAST','AẒEṬṬA N TIKKELT']},
        {emoji:'🦂',answer:'AQRAB',choices:['AQRAB','TAZZAYT N WUḌU','TABUBBT N TESREFT']},
        {emoji:'🐊',answer:'AKRUKUDIL',choices:['ABASTUR','TABUBBT N TESREFT','AKRUKUDIL']}
      ]
    }
  },
  // v6.104 — Complétion et compréhension : traduites/relues par une personne
  // kabylophone d'après l'utilisateur (fichier Kabyle_Complet.xlsx), le
  // même statut que le vocabulaire fourni par cette même personne pour le
  // sango et la darija algérienne dans ce projet. Ça débloque le garde-fou
  // n°3 (jamais de grammaire/phrase inventée sans relecture native) : ce
  // n'est PAS moi qui ai improvisé ces phrases. Le brouillon précédent
  // (docs/kabyle-completion-draft.md, 4 phrases seulement, jamais intégré
  // faute de relecture native) est maintenant dépassé par ce contenu plus
  // complet — conservé pour l'historique, plus référencé comme "à faire".
  //
  // 5 phrases de complétion demandaient un ajustement : le mot à blanquer
  // dans la phrase n'était pas toujours identique au "mot attendu" isolé
  // de la colonne source, à cause de l'état d'annexion du kabyle (le nom
  // change de forme selon sa position dans la phrase — ex. "aẓekka" à
  // l'état libre devient "uẓekka" après une préposition comme "deg"). Le
  // mot RÉELLEMENT présent dans la phrase a été blanqué, jamais la forme
  // du dictionnaire seule — même principe que pour l'arabe et la darija
  // déjà en place dans l'app.
  completion:{ title:'Faḍi tafyirt', items:{
    1:[ {text:'Amcic yesswa ___.',answer:'aɣu',choices:['tawraɣt','aɣu','iḍarren']},
        {text:'Tṭṭseɣ deg ___.',answer:'uẓekka-w',choices:['uẓekka-w','aɣu','aberkan']},
        {text:'Tafukt d ___.',answer:'tawraɣt',choices:['teforkect','tawraɣt','aɣu']},
        {text:'Tetteɣ s ___.',answer:'teforkect',choices:['aɣu','aberkan','teforkect']},
        {text:'Iḍ, igenni d ___.',answer:'aberkan',choices:['aɣu','tecrurit-is','aberkan']},
        {text:'Teddueɣ s ___-iw.',answer:'iḍarren',choices:['tawraɣt','uẓekka-w','iḍarren']},
        {text:'Nesswa deg ___.',answer:'uqeddiḥ',choices:['iḍarren','uẓekka-w','uqeddiḥ']},
        {text:'Agrud yettru deg ___.',answer:'tecrurit-is',choices:['teforkect','aberkan','tecrurit-is']} ],
    2:[ {text:'I tira, seqdaceɣ ___.',answer:'akalam',choices:['akalam','tabrat','tasarut']},
        {text:'Deg tegrest ___ aṭas.',answer:'yessemmiḍ',choices:['yessemmiḍ','akalam','tilibizyun']},
        {text:'Amsiweḍ yawi-d ___.',answer:'tabrat',choices:['tabrat','tasarut','axxam']},
        {text:'I uldi n tewwurt, tesraḍ ___.',answer:'tasarut',choices:['tasarut','tabrat','ifassen']},
        {text:'Ttwaliɣ asaru deg ___.',answer:'tilibizyun',choices:['tilibizyun','akalam','axxam']},
        {text:'Afrux ibennu ___-is.',answer:'axxam',choices:['axxam','tilibizyun','tasarut']},
        {text:'Nezzenz aɣrum deg ___.',answer:'tmseɣt n uɣrum',choices:['tmseɣt n uɣrum','tabrat','ifassen']},
        {text:'Send ad ččeɣ, ssirideɣ ___-iw.',answer:'ifassen',choices:['ifassen','akalam','tasarut']} ],
    3:[ {text:"Send ad truḥeḍ, ur tettu ara ad ___ tawwurt.",answer:'tmedleḍ',choices:['tmedleḍ','ttamen','icehhed']},
        {text:'Aṭbib yura-yi-d ___.',answer:'amsefrak',choices:['amsefrak','yettwasseɣẓef','tseqddeḍ']},
        {text:'Amlaqa ___ ar azekka.',answer:'yettwasseɣẓef',choices:['yettwasseɣẓef','tseqddeḍ','igzem']},
        {text:'Ilaq ad ___ tiẓiwin-ik send taggara.',answer:'tseqddeḍ',choices:['tseqddeḍ','yettwasseɣẓef','tesresteḍ']},
        {text:'Ajennay ad ___ iruẓan.',answer:'igzem',choices:['igzem','ttamen','icehhed']},
        {text:'Deffir n leɛtab ilaq ad ___.',answer:'tesresteḍ',choices:['tesresteḍ','igzem','tmedleḍ']},
        {text:'Tamacahut-a tewɛer i ___.',answer:'ttamen',choices:['ttamen','icehhed','amsefrak']},
        {text:'Anagi yugi ad ___.',answer:'icehhed',choices:['icehhed','ttamen','tmedleḍ']} ]
  }},
  comprehension:{ title:'Fhem tiwtilin', items:{
    1:[ {text:'Anwa aɣersiw i yettḥawḥawen ?',answer:'Aqjun',choices:['Aqjun','Aslem','Afrux']},
        {text:'S wacu nettett tasebḥit ?',answer:'Taforkect',choices:['Taforkect','Ajenwi','Aqeddiḥ']},
        {text:'Anida nettṭṭas ?',answer:'Deg uẓekka',choices:['Deg uẓekka','Deg uqbal','Deg tacekkart']},
        {text:'Amek i d-ella yini n yizem ?',answer:'Azegzaw',choices:['Azegzaw','Azeggaɣ','Amellal']},
        {text:'D acu i nessew mi neffuẓ ?',answer:'Aman',choices:['Aman','Asennan','Waraq']},
        {text:'D acu i d-yessefrayen iḍ ?',answer:'Tafat',choices:['Tafat','Talɣimt','Taseɣnest']} ],
    2:[ {text:'D acu i nesseqdac akken ad nẓer akud ?',answer:'Tamrint',choices:['Tamrint','Adlis','Tafat']},
        {text:'Anta tasemhayt i d-iteddun deffir n tegrest ?',answer:'Tafsut',choices:['Tanezzayt','Tafsut','Tegrest']},
        {text:'D acu i nexdem s uselas n ugeffur ?',answer:'Nmesten seg ugeffur',choices:['Nmesten seg ugeffur','Nečč','Nettes']},
        {text:'Anwa amahil i yettseḥḥayen imuḍan ?',answer:'Aṭbib',choices:['Aṭbib','Ajennay','Amsiweḍ']},
        {text:'Acḥal n wussan deg dduṛt ?',answer:'Sa',choices:['Sa','Xemsa','Ɛecra']},
        {text:'Anida nezznuzu tisefriyin ?',answer:'Deg tfarmasit',choices:['Deg tfarmasit','Deg tmseɣt n uɣrum','Deg tbankut']} ],
    3:[ {text:'Ma yella akk twardin d ijjigen, tawardt d ajjij ?',answer:'Ih',choices:['Ih','Xaṭi','Ur ẓriɣ ara']},
        {text:"Amgal n 's tazzla' d acu ?",answer:'S leɛqel',choices:['S leɛqel','S lǧehd','Aṭas']},
        {text:"'Yettageffur s yiseglan' anamek-is ?",answer:'Yettageffur aṭas',choices:['Yettageffur aṭas','Ulac ageffur','Yettageffur cwiṭ']},
        {text:'Pierre meqqer ɣef Paul. Anwa i meẓẓiyen ?',answer:'Paul',choices:['Paul','Pierre','Sin-nsen']},
        {text:"'Tuzzfet n usebtar' d acu i d-yebɣa ad yini ?",answer:'Ad yebdu amaynut',choices:['Ad yebdu amaynut','Ad yeɣra adlis','Ad yestrayeḥ']},
        {text:'Anwa awal ur nelli d lfakya ?',answer:'Tazaret',choices:['Tazaret','Frawla','Adil']} ]
  }}
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
