// =====================================================================
//  NOUVEAUX TYPES D'EXERCICES — v6.133 (points 4 et 5 de la demande
//  d'amélioration)
//  ---------------------------------------------------------------------
//  Comme le reste de js/exercises.js : contenu de départ raisonnable,
//  à faire enrichir/valider par un∙e orthophoniste avant un usage
//  clinique réel — même statut que la banque principale, pas un degré
//  de confiance différent.
//
//  1. ASSOCIATION D'IMAGES (point 4) — associer deux concepts liés
//     (clé/cadenas, pluie/parapluie...), travaille le lien sémantique
//     sans avoir besoin de parler. Réutilise le même mécanisme que la
//     dénomination (émoji + choix), juste avec des émojis comme
//     réponses plutôt que des mots.
//
//  2. STRUCTURE DE PHRASE (point 5) — reconnaître la bonne phrase
//     parmi des versions mélangées. Version choix multiple plutôt que
//     "glisser les mots dans l'ordre" (plus simple et plus fiable à
//     implémenter qu'un vrai glisser-déposer) — comble un manque déjà
//     suivi comme catégorie d'erreur ("structure de phrase") sans
//     exercice dédié jusqu'ici.
// =====================================================================
window.BANK_EXTEND({
  association:{ title:'Associer les images', items:{
    1:[ {text:'🔑',answer:'🔒',choices:['🔒','☂️','🚗']},
        {text:'☂️',answer:'🌧️',choices:['🌧️','☀️','🔑']},
        {text:'🖊️',answer:'📄',choices:['📄','🍽️','🔨']},
        {text:'🍽️',answer:'🍴',choices:['🍴','🔑','🚗']},
        {text:'🧦',answer:'👟',choices:['👟','🧢','📖']},
        {text:'🪥',answer:'🦷',choices:['🦷','👂','🖐️']},
        {text:'🕯️',answer:'🔥',choices:['🔥','💧','❄️']},
        {text:'🧴',answer:'🖐️',choices:['🖐️','👞','📚']} ],
    2:[ {text:'🔨',answer:'🔩',choices:['🔩','🍞','📖']},
        {text:'🌱',answer:'🌻',choices:['🌻','❄️','🚗']},
        {text:'✉️',answer:'📬',choices:['📬','🍎','🔑']},
        {text:'🎣',answer:'🐟',choices:['🐟','🐦','🚲']},
        {text:'🧵',answer:'🪡',choices:['🪡','🍽️','📖']},
        {text:'🕰️',answer:'⏰',choices:['⏰','🌧️','🍞']},
        {text:'🧯',answer:'🔥',choices:['🔥','💧','🌱']},
        {text:'🔋',answer:'🔦',choices:['🔦','📖','🚗']} ],
    3:[ {text:'🐝',answer:'🍯',choices:['🍯','🥛','🍞']},
        {text:'🐄',answer:'🥛',choices:['🥛','🍯','🥚']},
        {text:'🌾',answer:'🍞',choices:['🍞','🧶','🪑']},
        {text:'🐔',answer:'🥚',choices:['🥚','🍯','🥛']},
        {text:'🐑',answer:'🧶',choices:['🧶','🍞','🥚']},
        {text:'🌳',answer:'🪑',choices:['🪑','🧶','🥛']},
        {text:'🐛',answer:'🦋',choices:['🦋','🐝','🐟']},
        {text:'🌰',answer:'🌳',choices:['🌳','🌻','🌱']} ]
  }},
  syntax:{ title:'Reconnaître la bonne phrase', items:{
    1:[ {text:'Remettez les mots dans le bon ordre :',answer:'Le chat dort.',choices:['Le chat dort.','Dort chat le.','Chat dort le.']},
        {text:'Remettez les mots dans le bon ordre :',answer:'Je mange une pomme.',choices:['Je mange une pomme.','Pomme mange je une.','Une je pomme mange.']},
        {text:'Remettez les mots dans le bon ordre :',answer:'Il fait beau.',choices:['Il fait beau.','Beau il fait.','Fait beau il.']},
        {text:'Remettez les mots dans le bon ordre :',answer:'Elle lit un livre.',choices:['Elle lit un livre.','Livre elle un lit.','Un lit elle livre.']},
        {text:'Remettez les mots dans le bon ordre :',answer:'Nous aimons la mer.',choices:['Nous aimons la mer.','La nous aimons mer.','Mer la aimons nous.']},
        {text:'Remettez les mots dans le bon ordre :',answer:'Le soleil brille.',choices:['Le soleil brille.','Brille le soleil.','Soleil brille le.']},
        {text:'Remettez les mots dans le bon ordre :',answer:"Tu bois de l'eau.",choices:["Tu bois de l'eau.","De l'eau tu bois.","Bois tu de l'eau."]},
        {text:'Remettez les mots dans le bon ordre :',answer:'Les enfants jouent dehors.',choices:['Les enfants jouent dehors.','Dehors jouent les enfants.','Jouent les enfants dehors.']} ],
    2:[ {text:'Quelle phrase est correctement construite ?',answer:'Le petit chien court dans le jardin.',choices:['Le petit chien court dans le jardin.','Jardin le dans court chien petit le.','Chien le court petit jardin le dans.']},
        {text:'Quelle phrase est correctement construite ?',answer:'Nous allons visiter nos grands-parents dimanche.',choices:['Nous allons visiter nos grands-parents dimanche.','Dimanche grands-parents nos visiter allons nous.','Allons nous grands-parents dimanche visiter nos.']},
        {text:'Quelle phrase est correctement construite ?',answer:'Elle a oublié son parapluie à la maison.',choices:['Elle a oublié son parapluie à la maison.','Maison la à parapluie son oublié a elle.','Son a elle maison la parapluie à oublié.']},
        {text:'Quelle phrase est correctement construite ?',answer:'Le facteur apporte le courrier chaque matin.',choices:['Le facteur apporte le courrier chaque matin.','Chaque matin courrier le apporte le facteur.','Apporte facteur le matin chaque le courrier.']},
        {text:'Quelle phrase est correctement construite ?',answer:'Mon voisin arrose ses fleurs tous les jours.',choices:['Mon voisin arrose ses fleurs tous les jours.','Tous les jours fleurs ses arrose mon voisin.','Ses voisin mon arrose fleurs jours les tous.']},
        {text:'Quelle phrase est correctement construite ?',answer:"Les enfants attendent le bus devant l'école.",choices:["Les enfants attendent le bus devant l'école.","Devant l'école bus le attendent les enfants.","Le bus enfants les devant attendent l'école."]},
        {text:'Quelle phrase est correctement construite ?',answer:'Le boulanger ouvre sa boutique très tôt.',choices:['Le boulanger ouvre sa boutique très tôt.','Très tôt boutique sa ouvre le boulanger.','Sa le boulanger tôt très ouvre boutique.']},
        {text:'Quelle phrase est correctement construite ?',answer:'Nous regardons un film ce soir ensemble.',choices:['Nous regardons un film ce soir ensemble.','Ce soir film un ensemble regardons nous.','Un nous ensemble ce regardons soir film.']} ],
    3:[ {text:'Quelle phrase est correctement construite ?',answer:'Quand il pleut, je préfère rester à la maison.',choices:['Quand il pleut, je préfère rester à la maison.','À la maison je rester quand pleut il préfère.','Il pleut préfère je quand rester maison la à.']},
        {text:'Quelle phrase est correctement construite ?',answer:'Depuis qu\'elle a déménagé, nous nous voyons moins souvent.',choices:['Depuis qu\'elle a déménagé, nous nous voyons moins souvent.','Moins souvent nous voyons nous nous a déménagé qu\'elle depuis.','Nous nous depuis qu\'elle voyons a moins déménagé souvent.']},
        {text:'Quelle phrase est correctement construite ?',answer:'Bien qu\'il soit fatigué, il continue son travail.',choices:['Bien qu\'il soit fatigué, il continue son travail.','Son travail continue il fatigué soit qu\'il bien.','Il bien qu\'il continue fatigué soit son travail.']},
        {text:'Quelle phrase est correctement construite ?',answer:'Avant de partir, elle a fermé toutes les fenêtres.',choices:['Avant de partir, elle a fermé toutes les fenêtres.','Toutes les fenêtres a fermé elle avant de partir.','Elle a avant partir de fermé toutes fenêtres les.']},
        {text:'Quelle phrase est correctement construite ?',answer:'Comme il faisait froid, nous avons allumé le feu.',choices:['Comme il faisait froid, nous avons allumé le feu.','Le feu avons nous allumé faisait froid comme il.','Nous il comme allumé avons faisait froid le feu.']},
        {text:'Quelle phrase est correctement construite ?',answer:'Pendant que je cuisine, tu peux mettre la table.',choices:['Pendant que je cuisine, tu peux mettre la table.','La table peux tu mettre je pendant que cuisine.','Tu pendant que je peux cuisine mettre la table.']},
        {text:'Quelle phrase est correctement construite ?',answer:'Après avoir mangé, nous sommes allés nous promener.',choices:['Après avoir mangé, nous sommes allés nous promener.','Nous promener sommes allés après avoir mangé nous.','Avoir après nous mangé sommes nous allés promener.']},
        {text:'Quelle phrase est correctement construite ?',answer:'Si tu as le temps, appelle-moi ce week-end.',choices:['Si tu as le temps, appelle-moi ce week-end.','Le temps tu si as appelle-moi ce week-end.','Appelle-moi as tu si le temps ce week-end.']} ]
  }}
});

// v6.140 : correspondance émoji -> clé I18N, pour l'exercice
// "Associer les images" — signalé par l'utilisateur (une abeille
// peut être ambiguë selon le rendu de la police, idem pour d'autres
// émojis). Le mot correspondant est affiché sous chaque image (la
// consigne comme les choix), dans la langue active, en plus de
// l'émoji — jamais à la place, l'exercice reste avant tout visuel.
window.EMOJI_LABEL_KEYS = {
  '⏰': 'label_alarm_clock',
  '☀️': 'label_sun',
  '☂️': 'label_umbrella',
  '✉️': 'label_envelope',
  '❄️': 'label_snowflake',
  '🌧️': 'label_rain',
  '🌰': 'label_chestnut',
  '🌱': 'label_seedling',
  '🌳': 'label_tree',
  '🌻': 'label_sunflower',
  '🌾': 'label_wheat',
  '🍎': 'label_apple',
  '🍞': 'label_bread',
  '🍯': 'label_honey',
  '🍴': 'label_fork',
  '🍽️': 'label_plate',
  '🎣': 'label_fishing_rod',
  '🐄': 'label_cow',
  '🐑': 'label_sheep',
  '🐔': 'label_chicken',
  '🐛': 'label_caterpillar',
  '🐝': 'label_bee',
  '🐟': 'label_fish',
  '🐦': 'label_bird',
  '👂': 'label_ear',
  '👞': 'label_shoe',
  '👟': 'label_sneaker',
  '💧': 'label_droplet',
  '📄': 'label_paper',
  '📖': 'label_book',
  '📚': 'label_books',
  '📬': 'label_mailbox',
  '🔋': 'label_battery',
  '🔑': 'label_key',
  '🔒': 'label_lock',
  '🔥': 'label_fire',
  '🔦': 'label_flashlight',
  '🔨': 'label_hammer',
  '🔩': 'label_screw',
  '🕯️': 'label_candle',
  '🕰️': 'label_clock',
  '🖊️': 'label_pen',
  '🖐️': 'label_hand',
  '🚗': 'label_car',
  '🚲': 'label_bike',
  '🥚': 'label_egg',
  '🥛': 'label_milk',
  '🦋': 'label_butterfly',
  '🦷': 'label_tooth',
  '🧢': 'label_cap',
  '🧦': 'label_sock',
  '🧯': 'label_fire_extinguisher',
  '🧴': 'label_soap',
  '🧵': 'label_thread',
  '🧶': 'label_yarn',
  '🪑': 'label_chair',
  '🪡': 'label_needle',
  '🪥': 'label_toothbrush',
};
