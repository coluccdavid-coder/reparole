// =====================================================================
//  BANQUE D'EXERCICES — inspirée des protocoles orthophoniques.
//  À faire valider/enrichir par un·e orthophoniste avant usage clinique.
//
//  MISE À JOUR DU CONTENU
//  ----------------------
//  Le contenu clinique évolue (recommandations des sociétés savantes,
//  manuels d'orthophonie). Il n'existe pas d'API publique d'exercices
//  validés : le contenu de référence est sous droits (éditeurs, ortho-
//  phonistes). Ce fichier est donc conçu pour être ENRICHI facilement :
//
//   1. Augmentez le numéro de version ci-dessous à chaque mise à jour.
//   2. Ajoutez vos items dans BANK, ou chargez une banque additionnelle
//      via BANK_EXTEND({...}) depuis un autre fichier (ex: banque-2026.js)
//      sans toucher au code principal.
//
//  Sources sérieuses à suivre pour faire évoluer le contenu :
//   - Sociétés savantes et ordres d'orthophonie (FNO en France, OOAQ au
//     Québec, RCSLT au Royaume-Uni).
//   - Revues de bonnes pratiques (ex. revues systématiques sur l'aphasie
//     en phase aiguë post-AVC).
//   - Manuels d'exercices d'aphasie publiés par des éditeurs spécialisés.
//  ⚠️ Vérifiez toujours les droits avant de réutiliser un contenu, et
//     faites valider les nouveaux exercices par un·e orthophoniste.
// =====================================================================
window.BANK_VERSION = "2026.05";   // ← incrémentez à chaque mise à jour du contenu

window.BANK = {
  denomination:{ title:'Nommer les images', items:{
    1:[ {emoji:'🐱',answer:'CHAT',choices:['CHAT','CHIEN','LAPIN']},
        {emoji:'🍎',answer:'POMME',choices:['POIRE','POMME','PRUNE']},
        {emoji:'🏠',answer:'MAISON',choices:['MAISON','VOITURE','ARBRE']},
        {emoji:'☀️',answer:'SOLEIL',choices:['SOLEIL','LUNE','NUAGE']},
        {emoji:'🚗',answer:'VOITURE',choices:['VOITURE','VÉLO','BATEAU']},
        {emoji:'🐟',answer:'POISSON',choices:['POISSON','OISEAU','CHEVAL']},
        {emoji:'🌹',answer:'FLEUR',choices:['FLEUR','HERBE','FEUILLE']},
        {emoji:'🍞',answer:'PAIN',choices:['PAIN','GÂTEAU','FROMAGE']},
        // v6.42 : niveau 1 étendu de 8 à 35 mots (vocabulaire simple et
        // courant), à la demande de l'utilisateur — premier lot resserré
        // avant d'envisager une extension plus large.
        {emoji:'🐶',answer:'CHIEN',choices:['CHIEN','CHAT','LAPIN']},
        {emoji:'🐰',answer:'LAPIN',choices:['LAPIN','CHAT','CHIEN']},
        {emoji:'🐮',answer:'VACHE',choices:['VACHE','COCHON','CHEVAL']},
        {emoji:'🐷',answer:'COCHON',choices:['COCHON','VACHE','MOUTON']},
        {emoji:'🐴',answer:'CHEVAL',choices:['CHEVAL','VACHE','ÂNE']},
        {emoji:'🐭',answer:'SOURIS',choices:['SOURIS','RAT','LAPIN']},
        {emoji:'🦆',answer:'CANARD',choices:['CANARD','POULE','OIE']},
        {emoji:'🥚',answer:'ŒUF',choices:['ŒUF','LAIT','PAIN']},
        {emoji:'🧀',answer:'FROMAGE',choices:['FROMAGE','PAIN','ŒUF']},
        {emoji:'🥛',answer:'LAIT',choices:['LAIT','EAU','JUS']},
        {emoji:'🍌',answer:'BANANE',choices:['BANANE','ORANGE','POMME']},
        {emoji:'🍊',answer:'ORANGE',choices:['ORANGE','BANANE','CITRON']},
        {emoji:'🍇',answer:'RAISIN',choices:['RAISIN','FRAISE','CERISE']},
        {emoji:'🍓',answer:'FRAISE',choices:['FRAISE','RAISIN','CERISE']},
        {emoji:'🥕',answer:'CAROTTE',choices:['CAROTTE','TOMATE','POMME DE TERRE']},
        {emoji:'🌙',answer:'LUNE',choices:['LUNE','SOLEIL','ÉTOILE']},
        {emoji:'⭐',answer:'ÉTOILE',choices:['ÉTOILE','LUNE','SOLEIL']},
        {emoji:'☁️',answer:'NUAGE',choices:['NUAGE','PLUIE','CIEL']},
        {emoji:'🌧️',answer:'PLUIE',choices:['PLUIE','NEIGE','SOLEIL']},
        {emoji:'❄️',answer:'NEIGE',choices:['NEIGE','PLUIE','GLACE']},
        {emoji:'🔑',answer:'CLÉ',choices:['CLÉ','PORTE','SERRURE']},
        {emoji:'🚪',answer:'PORTE',choices:['PORTE','FENÊTRE','MUR']},
        {emoji:'🪑',answer:'CHAISE',choices:['CHAISE','TABLE','LIT']},
        {emoji:'🛏️',answer:'LIT',choices:['LIT','CHAISE','TABLE']},
        {emoji:'👕',answer:'CHEMISE',choices:['CHEMISE','PANTALON','CHAUSSURE']},
        {emoji:'👖',answer:'PANTALON',choices:['PANTALON','CHEMISE','CHAUSSETTE']},
        {emoji:'👟',answer:'CHAUSSURE',choices:['CHAUSSURE','CHAUSSETTE','CHAPEAU']} ],
    2:[ {emoji:'🦋',answer:'PAPILLON',choices:['PAPILLON','ABEILLE','LIBELLULE','SAUTERELLE']},
        {emoji:'⌚',answer:'MONTRE',choices:['HORLOGE','MONTRE','RÉVEIL','PENDULE']},
        {emoji:'🎻',answer:'VIOLON',choices:['GUITARE','VIOLON','VIOLONCELLE','ALTO']},
        {emoji:'🍄',answer:'CHAMPIGNON',choices:['CHAMPIGNON','TOMATE','OIGNON','CHOU']},
        {emoji:'🦒',answer:'GIRAFE',choices:['GIRAFE','CHAMEAU','ZÈBRE','ÂNE']},
        {emoji:'⛵',answer:'VOILIER',choices:['VOILIER','PAQUEBOT','CANOË','RADEAU']},
        {emoji:'🎺',answer:'TROMPETTE',choices:['TROMPETTE','FLÛTE','SAXOPHONE','CLARINETTE']},
        {emoji:'🌋',answer:'VOLCAN',choices:['VOLCAN','MONTAGNE','COLLINE','FALAISE']},
        // v6.42 : niveau 2 étendu de 8 à 35 mots.
        {emoji:'🐝',answer:'ABEILLE',choices:['ABEILLE','PAPILLON','LIBELLULE','GUÊPE']},
        {emoji:'🦌',answer:'CERF',choices:['CERF','CHEVREUIL','ÉLAN','DAIM']},
        {emoji:'🦉',answer:'HIBOU',choices:['HIBOU','AIGLE','CORBEAU','CHOUETTE']},
        {emoji:'🦅',answer:'AIGLE',choices:['AIGLE','HIBOU','FAUCON','VAUTOUR']},
        {emoji:'🐢',answer:'TORTUE',choices:['TORTUE','LÉZARD','CRABE','GRENOUILLE']},
        {emoji:'🦎',answer:'LÉZARD',choices:['LÉZARD','TORTUE','SERPENT','GECKO']},
        {emoji:'🐙',answer:'POULPE',choices:['POULPE','CRABE','MÉDUSE','CALMAR']},
        {emoji:'🦀',answer:'CRABE',choices:['CRABE','POULPE','HOMARD','CREVETTE']},
        {emoji:'🎸',answer:'GUITARE',choices:['GUITARE','VIOLON','BANJO','MANDOLINE']},
        {emoji:'🥁',answer:'TAMBOUR',choices:['TAMBOUR','GUITARE','PIANO','FLÛTE']},
        {emoji:'🎹',answer:'PIANO',choices:['PIANO','GUITARE','TAMBOUR','VIOLON']},
        {emoji:'🎷',answer:'SAXOPHONE',choices:['SAXOPHONE','TROMPETTE','CLARINETTE','FLÛTE']},
        {emoji:'⛰️',answer:'MONTAGNE',choices:['MONTAGNE','COLLINE','VOLCAN','FALAISE']},
        {emoji:'🏝️',answer:'PLAGE',choices:['PLAGE','MONTAGNE','FORÊT','DÉSERT']},
        {emoji:'🌊',answer:'VAGUE',choices:['VAGUE','MARÉE','TEMPÊTE','COURANT']},
        {emoji:'🌉',answer:'PONT',choices:['PONT','TUNNEL','ROUTE','AUTOROUTE']},
        {emoji:'🏰',answer:'CHÂTEAU',choices:['CHÂTEAU','TOUR','FORTERESSE','PALAIS']},
        {emoji:'🗼',answer:'TOUR',choices:['TOUR','CHÂTEAU','PONT','GRATTE-CIEL']},
        {emoji:'⛲',answer:'FONTAINE',choices:['FONTAINE','PUITS','ÉTANG','BASSIN']},
        {emoji:'🖼️',answer:'TABLEAU',choices:['TABLEAU','PHOTO','MIROIR','AFFICHE']},
        {emoji:'🎥',answer:'CAMÉRA',choices:['CAMÉRA','APPAREIL PHOTO','TÉLÉVISION','PROJECTEUR']},
        {emoji:'💡',answer:'AMPOULE',choices:['AMPOULE','BOUGIE','LAMPE','TORCHE']},
        {emoji:'🏮',answer:'LANTERNE',choices:['LANTERNE','AMPOULE','BOUGIE','RÉVERBÈRE']},
        {emoji:'⛱️',answer:'PARASOL',choices:['PARASOL','PARAPLUIE','TENTE','CHAPEAU']},
        {emoji:'🎁',answer:'CADEAU',choices:['CADEAU','JOUET','BOÎTE','PAQUET']},
        {emoji:'🎈',answer:'BALLON',choices:['BALLON','CADEAU','CERF-VOLANT','JOUET']},
        {emoji:'🧩',answer:'PUZZLE',choices:['PUZZLE','JEU','CASSE-TÊTE','DEVINETTE']} ],
    3:[ {emoji:'🧭',answer:'BOUSSOLE',choices:['BOUSSOLE','BAROMÈTRE','THERMOMÈTRE','SEXTANT','ALTIMÈTRE']},
        {emoji:'🦔',answer:'HÉRISSON',choices:['HÉRISSON','PORC-ÉPIC','TAUPE','MUSARAIGNE','BLAIREAU']},
        {emoji:'⚓',answer:'ANCRE',choices:['ANCRE','HÉLICE','GOUVERNAIL','QUILLE','MÂT']},
        {emoji:'🔬',answer:'MICROSCOPE',choices:['MICROSCOPE','TÉLESCOPE','PÉRISCOPE','STÉTHOSCOPE','KALÉIDOSCOPE']},
        {emoji:'🪕',answer:'BANJO',choices:['BANJO','MANDOLINE','UKULÉLÉ','LUTH','CITHARE']},
        {emoji:'🦦',answer:'LOUTRE',choices:['LOUTRE','BELETTE','FOUINE','MARTRE','VISON']},
        {emoji:'🌪️',answer:'TORNADE',choices:['TORNADE','OURAGAN','TYPHON','CYCLONE','BOURRASQUE']},
        {emoji:'🛡️',answer:'BOUCLIER',choices:['BOUCLIER','ARMURE','HEAUME','CUIRASSE','RONDACHE']},
        // v6.42 : niveau 3 étendu de 8 à 35 mots.
        {emoji:'🦥',answer:'PARESSEUX',choices:['PARESSEUX','SINGE','KOALA','ORANG-OUTAN','GORILLE']},
        {emoji:'🦫',answer:'CASTOR',choices:['CASTOR','LOUTRE','RAT MUSQUÉ','MARMOTTE','RENARD']},
        {emoji:'🦨',answer:'MOUFETTE',choices:['MOUFETTE','BLAIREAU','RATON LAVEUR','HÉRISSON','PUTOIS']},
        {emoji:'🦩',answer:'FLAMANT',choices:['FLAMANT','CIGOGNE','HÉRON','PÉLICAN','AIGRETTE']},
        {emoji:'🦚',answer:'PAON',choices:['PAON','DINDON','FAISAN','PINTADE','CAILLE']},
        {emoji:'🦜',answer:'PERROQUET',choices:['PERROQUET','TOUCAN','PERRUCHE','COCKATOO','CANARI']},
        {emoji:'🦢',answer:'CYGNE',choices:['CYGNE','OIE','CANARD','GRUE','MOUETTE']},
        {emoji:'🧪',answer:'ÉPROUVETTE',choices:['ÉPROUVETTE','FIOLE','BÉCHER','PIPETTE','ENTONNOIR']},
        {emoji:'🔭',answer:'TÉLESCOPE',choices:['TÉLESCOPE','MICROSCOPE','JUMELLES','LOUPE','PÉRISCOPE']},
        {emoji:'🧲',answer:'AIMANT',choices:['AIMANT','BOUSSOLE','PILE','BATTERIE','CIRCUIT']},
        {emoji:'⚖️',answer:'BALANCE',choices:['BALANCE','THERMOMÈTRE','RÈGLE','CHRONOMÈTRE','BAROMÈTRE']},
        {emoji:'🏺',answer:'POTERIE',choices:['POTERIE','SCULPTURE','MOSAÏQUE','FRESQUE','GRAVURE']},
        {emoji:'⚔️',answer:'ÉPÉE',choices:['ÉPÉE','LANCE','HALLEBARDE','SABRE','POIGNARD']},
        {emoji:'🏹',answer:'ARC',choices:['ARC','ARBALÈTE','FRONDE','CATAPULTE','JAVELOT']},
        {emoji:'🎪',answer:'CHAPITEAU',choices:['CHAPITEAU','TENTE','PAVILLON','STADE','GYMNASE']},
        {emoji:'🎠',answer:'MANÈGE',choices:['MANÈGE','CARROUSEL','BALANÇOIRE','TOBOGGAN','TRAMPOLINE']},
        {emoji:'🎯',answer:'CIBLE',choices:['CIBLE','FLÉCHETTE','PANNEAU','PANCARTE','ÉCRITEAU']},
        {emoji:'🪡',answer:'AIGUILLE',choices:['AIGUILLE','ÉPINGLE','CISEAUX','DÉ À COUDRE','FIL']},
        {emoji:'⚙️',answer:'ENGRENAGE',choices:['ENGRENAGE','ROUAGE','MÉCANISME','RESSORT','PISTON']},
        {emoji:'🔩',answer:'BOULON',choices:['BOULON','VIS','CLOU','ÉCROU','RIVET']},
        {emoji:'🪛',answer:'TOURNEVIS',choices:['TOURNEVIS','MARTEAU','PINCE','CLÉ À MOLETTE','PERCEUSE']},
        {emoji:'🪚',answer:'SCIE',choices:['SCIE','HACHE','CISEAUX','RABOT','LIME']},
        {emoji:'🧯',answer:'EXTINCTEUR',choices:['EXTINCTEUR','SEAU','TUYAU','LANCE À INCENDIE','ALARME']},
        {emoji:'🪤',answer:'PIÈGE',choices:['PIÈGE','FILET','CAGE','APPÂT','COLLET']},
        {emoji:'🕸️',answer:'TOILE D\'ARAIGNÉE',choices:['TOILE D\'ARAIGNÉE','NID','TERRIER','TANIÈRE','GALERIE']},
        {emoji:'🦂',answer:'SCORPION',choices:['SCORPION','ARAIGNÉE','MILLE-PATTES','SCARABÉE','TIQUE']},
        {emoji:'🐊',answer:'CROCODILE',choices:['CROCODILE','ALLIGATOR','LÉZARD','IGUANE','VARAN']} ]
  }},
  completion:{ title:'Compléter la phrase', items:{
    1:[ {text:'Le chat boit du ___',answer:'LAIT',choices:['LAIT','PAIN','EAU']},
        {text:'Je dors dans mon ___',answer:'LIT',choices:['LIT','PLAT','SAC']},
        {text:'Le soleil est ___',answer:'JAUNE',choices:['JAUNE','FROID','LOURD']},
        {text:'Je mange avec une ___',answer:'FOURCHETTE',choices:['FOURCHETTE','CHAISE','PORTE']},
        {text:'La nuit, le ciel est ___',answer:'NOIR',choices:['NOIR','VERT','ROND']},
        {text:'Je marche avec mes ___',answer:'PIEDS',choices:['PIEDS','MAINS','YEUX']},
        {text:'On boit dans un ___',answer:'VERRE',choices:['VERRE','LIVRE','MUR']},
        {text:'Le bébé pleure dans son ___',answer:'BERCEAU',choices:['BERCEAU','JARDIN','FOUR']} ],
    2:[ {text:'Pour écrire, j\'utilise un ___',answer:'STYLO',choices:['STYLO','MARTEAU','BALAI','VERRE']},
        {text:'En hiver, il fait très ___',answer:'FROID',choices:['CHAUD','FROID','HUMIDE','SEC']},
        {text:'Le facteur apporte le ___',answer:'COURRIER',choices:['COURRIER','PAIN','JOURNAL','COLIS']},
        {text:'Pour ouvrir la porte, il faut une ___',answer:'CLÉ',choices:['CLÉ','LAMPE','TASSE','CARTE']},
        {text:'Je regarde un film à la ___',answer:'TÉLÉVISION',choices:['TÉLÉVISION','RADIO','FENÊTRE','CUISINE']},
        {text:'L\'oiseau construit son ___',answer:'NID',choices:['NID','TROU','MUR','PONT']},
        {text:'On achète le pain à la ___',answer:'BOULANGERIE',choices:['BOULANGERIE','PHARMACIE','BANQUE','POSTE']},
        {text:'Avant de manger, je me lave les ___',answer:'MAINS',choices:['MAINS','CHEVEUX','DENTS','OREILLES']} ],
    3:[ {text:'Avant de partir, n\'oublie pas de ___ la porte',answer:'FERMER',choices:['FERMER','OUVRIR','PEINDRE','CASSER','LAVER']},
        {text:'Le médecin m\'a prescrit un ___',answer:'TRAITEMENT',choices:['TRAITEMENT','DESSERT','BOUQUET','VOYAGE','OUTIL']},
        {text:'La réunion a été ___ à demain',answer:'REPORTÉE',choices:['REPORTÉE','MANGÉE','PEINTE','CHANTÉE','PLANTÉE']},
        {text:'Il faut ___ ses impôts avant la date limite',answer:'DÉCLARER',choices:['DÉCLARER','DANSER','ARROSER','CONDUIRE','DESSINER']},
        {text:'Le jardinier va ___ les rosiers',answer:'TAILLER',choices:['TAILLER','LIRE','TÉLÉPHONER','NAGER','VOTER']},
        {text:'Après l\'effort, il faut ___',answer:'SE REPOSER',choices:['SE REPOSER','SE PRESSER','S\'ÉNERVER','S\'INQUIÉTER','SE PERDRE']},
        {text:'Cette histoire est difficile à ___',answer:'CROIRE',choices:['CROIRE','COUDRE','CUIRE','COURIR','COUPER']},
        {text:'Le témoin a refusé de ___',answer:'TÉMOIGNER',choices:['TÉMOIGNER','TÉLÉPHONER','VOYAGER','CHANTER','PLONGER']} ]
  }},
  comprehension:{ title:'Comprendre la consigne', items:{
    1:[ {text:'Quel animal aboie ?',answer:'LE CHIEN',choices:['LE CHIEN','LE POISSON','L\'OISEAU']},
        {text:'Avec quoi mange-t-on la soupe ?',answer:'UNE CUILLÈRE',choices:['UNE CUILLÈRE','UN COUTEAU','UNE FOURCHETTE']},
        {text:'Où dort-on ?',answer:'DANS UN LIT',choices:['DANS UN LIT','DANS UN BOL','DANS UN SAC']},
        {text:'Quelle couleur est l\'herbe ?',answer:'VERTE',choices:['VERTE','ROUGE','BLEUE']},
        {text:'Que boit-on quand on a soif ?',answer:'DE L\'EAU',choices:['DE L\'EAU','DU SABLE','DU PAPIER']},
        {text:'Quel objet éclaire la nuit ?',answer:'UNE LAMPE',choices:['UNE LAMPE','UN COUSSIN','UNE ASSIETTE']} ],
    2:[ {text:'Quel objet sert à voir l\'heure ?',answer:'UNE MONTRE',choices:['UNE MONTRE','UN LIVRE','UNE LAMPE','UN VERRE']},
        {text:'Quelle saison vient après l\'hiver ?',answer:'LE PRINTEMPS',choices:['L\'ÉTÉ','LE PRINTEMPS','L\'AUTOMNE','L\'HIVER']},
        {text:'Que fait-on avec un parapluie ?',answer:'SE PROTÉGER DE LA PLUIE',choices:['SE PROTÉGER DE LA PLUIE','MANGER','DORMIR','LIRE']},
        {text:'Quel métier soigne les malades ?',answer:'LE MÉDECIN',choices:['LE MÉDECIN','LE BOULANGER','LE PEINTRE','LE PILOTE']},
        {text:'Combien de jours dans une semaine ?',answer:'SEPT',choices:['SEPT','CINQ','DIX','TROIS']},
        {text:'Où achète-t-on des médicaments ?',answer:'À LA PHARMACIE',choices:['À LA PHARMACIE','À LA POSTE','AU GARAGE','À L\'ÉCOLE']} ],
    3:[ {text:'Si tous les roses sont des fleurs, une rose est-elle une fleur ?',answer:'OUI',choices:['OUI','NON','PARFOIS','ON NE SAIT PAS']},
        {text:'Le contraire de "rapidement" est :',answer:'LENTEMENT',choices:['LENTEMENT','FORTEMENT','GAIEMENT','SOUVENT']},
        {text:'"Il pleut des cordes" signifie :',answer:'IL PLEUT BEAUCOUP',choices:['IL PLEUT BEAUCOUP','IL FAIT BEAU','IL VENTE','IL NEIGE']},
        {text:'Pierre est plus grand que Paul. Qui est le plus petit ?',answer:'PAUL',choices:['PAUL','PIERRE','LES DEUX','AUCUN']},
        {text:'"Tourner la page" veut dire :',answer:'PASSER À AUTRE CHOSE',choices:['PASSER À AUTRE CHOSE','LIRE UN LIVRE','SE REPOSER','RECOMMENCER']},
        {text:'Quel mot n\'est pas un fruit ?',answer:'CAROTTE',choices:['CAROTTE','CERISE','BANANE','RAISIN']} ]
  }},
  repetition:{ title:'Répéter à voix haute', voice:true, items:{
    1:[ {word:'BALLON'},{word:'TABLE'},{word:'SOLEIL'},{word:'CHAT'},{word:'PORTE'},{word:'FLEUR'},{word:'MAIN'},{word:'EAU'} ],
    2:[ {word:'ORDINATEUR'},{word:'PARAPLUIE'},{word:'TÉLÉPHONE'},{word:'BIBLIOTHÈQUE'},{word:'RESTAURANT'},{word:'MONTAGNE'},{word:'JARDINIER'},{word:'CALENDRIER'} ],
    3:[ {word:'HÉLICOPTÈRE'},{word:'KINÉSITHÉRAPEUTE'},{word:'ANTICONSTITUTIONNEL'},{word:'PARALLÉLÉPIPÈDE'},{word:'OTORHINOLARYNGOLOGISTE'},{word:'CHRYSANTHÈME'},{word:'PROCHAINEMENT'},{word:'STATISTIQUEMENT'} ]
  }},
  denomination_orale:{ title:'Nommer à voix haute', voice:true, items:{
    1:[ {emoji:'🐱',word:'CHAT'},{emoji:'🍎',word:'POMME'},{emoji:'🏠',word:'MAISON'},{emoji:'☀️',word:'SOLEIL'},{emoji:'🚗',word:'VOITURE'},{emoji:'🌹',word:'FLEUR'} ],
    2:[ {emoji:'🦋',word:'PAPILLON'},{emoji:'⌚',word:'MONTRE'},{emoji:'🍄',word:'CHAMPIGNON'},{emoji:'🦒',word:'GIRAFE'},{emoji:'⛵',word:'VOILIER'},{emoji:'🎺',word:'TROMPETTE'} ],
    3:[ {emoji:'🧭',word:'BOUSSOLE'},{emoji:'🦔',word:'HÉRISSON'},{emoji:'⚓',word:'ANCRE'},{emoji:'🔬',word:'MICROSCOPE'},{emoji:'🌪️',word:'TORNADE'},{emoji:'🛡️',word:'BOUCLIER'} ]
  }},
  fluence:{ title:'Fluence verbale', voice:true, fluency:true, items:{
    1:[ {cat:'des animaux',accept:['chat','chien','lapin','cheval','vache','poule','mouton','cochon','oiseau','poisson','souris','lion','tigre','ours','loup','renard','canard','ane','chevre','singe','elephant','girafe','zebre','serpent','grenouille']},
        {cat:'des fruits',accept:['pomme','poire','banane','orange','fraise','cerise','raisin','kiwi','melon','peche','abricot','prune','citron','ananas','mangue','framboise','myrtille','pasteque','figue','clementine']} ],
    2:[ {cat:'des objets de la cuisine',accept:['couteau','fourchette','cuillere','assiette','verre','casserole','poele','four','frigo','evier','table','tasse','bol','passoire','spatule','louche','plat','saladier','theiere','bouilloire']},
        {cat:'des vetements',accept:['pantalon','chemise','pull','robe','jupe','manteau','veste','chaussette','chaussure','echarpe','gant','bonnet','short','tee-shirt','cravate','ceinture','botte','sandale','collant','gilet']} ],
    3:[ {cat:'des mots commençant par la lettre P',accept:['pomme','porte','plante','papier','pain','poire','pied','poisson','pull','pont','parc','plage','pluie','peinture','piano','pierre','prince','plume','poule','panier','pantalon','parapluie','pharmacie','printemps']},
        {cat:'des métiers',accept:['medecin','boulanger','pompier','professeur','infirmier','avocat','plombier','peintre','cuisinier','facteur','jardinier','coiffeur','mecanicien','pharmacien','electricien','architecte','journaliste','policier','pilote','dentiste']} ]
  }},
  // v6.6 : inspiré de la fiche "Répétition de phrases" (mémoire d'orthophonie,
  // Clermont Auvergne, 2022) — varier les types de phrases pour travailler
  // l'intonation (question / description / exclamation). Repose sur le même
  // moteur que "Répéter à voix haute" (reconnaissance vocale), avec un repère
  // visuel (flèche) selon le type de phrase.
  intonation:{ title:'Répéter avec intonation', voice:true, items:{
    1:[ {word:'Tu as fini ?',cue:'question'},
        {word:'Es-tu sûre ?',cue:'question'},
        {word:'Je viens demain.',cue:'descriptive'},
        {word:'Tu manges ici.',cue:'descriptive'},
        {word:'Viens ici !',cue:'exclamative'},
        {word:'Quelle bonne idée !',cue:'exclamative'} ],
    2:[ {word:'Que fais-tu ?',cue:'question'},
        {word:'Ah bon ?',cue:'question'},
        {word:'Elle joue dehors.',cue:'descriptive'},
        {word:'Ils discutent avec un ami.',cue:'descriptive'},
        {word:'Comme tu es belle !',cue:'exclamative'},
        {word:'Quelle surprise !',cue:'exclamative'} ],
    3:[ {word:'Est-ce que tu as bien dormi cette nuit ?',cue:'question'},
        {word:'Pourrais-tu m\'aider à porter ça ?',cue:'question'},
        {word:'Nous partirons demain matin de bonne heure.',cue:'descriptive'},
        {word:'Le facteur est passé pendant que tu dormais.',cue:'descriptive'},
        {word:'Quelle magnifique journée nous avons eue !',cue:'exclamative'},
        {word:'Je n\'en reviens toujours pas !',cue:'exclamative'} ]
  }}
};

// ---------------------------------------------------------------------
//  Permet d'ajouter/mettre à jour du contenu sans modifier ce fichier.
//  Exemple dans un fichier "banque-2026.js" chargé après celui-ci :
//    BANK_EXTEND({ denomination:{ items:{ 1:[ {emoji:'🐧',answer:'PINGOUIN',
//                  choices:['PINGOUIN','MANCHOT','CANARD']} ] } } });
//  Les nouveaux items sont AJOUTÉS aux niveaux existants.
// ---------------------------------------------------------------------
window.BANK_EXTEND = function(extra){
  for(const type in extra){
    if(!BANK[type]){ BANK[type]=extra[type]; continue; }
    const lv = extra[type].items||{};
    for(const level in lv){
      BANK[type].items[level] = (BANK[type].items[level]||[]).concat(lv[level]);
    }
  }
  console.info('[ReParole] Contenu étendu. Version banque:', window.BANK_VERSION);
};
