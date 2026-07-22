// =====================================================================
//  LECTURE ET COMPRÉHENSION — v6.143 (point 7 de la demande
//  d'amélioration, dernier des 3 restants réalisable proprement)
//  ---------------------------------------------------------------------
//  Différent des autres exercices : lire 2-3 phrases, pas un mot ou
//  une phrase isolée, puis répondre à une question de compréhension.
//  Réserve clinique déjà notée (point 7 de la discussion d'origine) :
//  la compréhension de texte est un profil d'aphasie à part entière
//  (type Wernicke, notamment) — cet exercice sera très inégal selon
//  le profil, pas un simple "niveau supérieur" des autres. À faire
//  valider par un∙e orthophoniste avant un usage clinique réel, comme
//  le reste de la banque (garde-fou n°8).
//
//  Contenu volontairement simple : phrases courtes, vocabulaire
//  courant, questions à choix multiple (jamais de réponse à rédiger).
//  Niveau 3 : un petit raisonnement (calcul simple, déduction logique)
//  plutôt qu'une expression idiomatique — plus sûr à traduire
//  fidèlement d'une langue à l'autre qu'un jeu de mots.
// =====================================================================
window.BANK_EXTEND({
  story:{ title:'Lire et comprendre', items:{
    1:[ {text:"Le chat dort sur le canapé. Il fait la sieste l'après-midi.\n\nOù dort le chat ?",answer:'SUR LE CANAPÉ',choices:['SUR LE CANAPÉ','DANS LE JARDIN','SOUS LA TABLE']},
        {text:"Marie prépare le café. Elle boit une tasse chaque matin.\n\nQu'est-ce que Marie prépare ?",answer:'LE CAFÉ',choices:['LE CAFÉ','LE THÉ','LE CHOCOLAT']},
        {text:"Il pleut aujourd'hui. Paul prend son parapluie avant de sortir.\n\nQue prend Paul avant de sortir ?",answer:'SON PARAPLUIE',choices:['SON PARAPLUIE','SON CHAPEAU','SES LUNETTES']},
        {text:"Les enfants jouent dans le jardin. Ils courent après le ballon.\n\nOù jouent les enfants ?",answer:'DANS LE JARDIN',choices:['DANS LE JARDIN','DANS LA MAISON',"À L'ÉCOLE"]},
        {text:"Le boulanger vend du pain frais. Il ouvre son magasin très tôt.\n\nQue vend le boulanger ?",answer:'DU PAIN',choices:['DU PAIN','DES FLEURS','DES LIVRES']},
        {text:"Sophie lit un livre le soir. Elle aime les histoires de voyage.\n\nQuand Sophie lit-elle ?",answer:'LE SOIR',choices:['LE SOIR','LE MATIN','À MIDI']} ],
    2:[ {text:"Le train part à 8 heures. Julien arrive à la gare à 7h45, juste à temps.\n\nJulien arrive-t-il en retard ou à l'heure ?",answer:"À L'HEURE",choices:["À L'HEURE",'EN RETARD','EN AVANCE DE 2 HEURES']},
        {text:"Il fait très froid ce matin. Emma met un gros manteau et une écharpe avant de partir.\n\nPourquoi Emma met-elle un manteau ?",answer:'IL FAIT FROID',choices:['IL FAIT FROID','IL PLEUT','IL FAIT NUIT']},
        {text:"Le magasin ferme à 18 heures. Il est 17h30 quand Laura arrive pour acheter du pain.\n\nLaura a-t-elle le temps de faire ses courses ?",answer:'OUI',choices:['OUI','NON','LE MAGASIN EST FERMÉ']},
        {text:"Thomas a mal aux dents depuis deux jours. Il décide d'appeler le dentiste.\n\nPourquoi Thomas appelle-t-il le dentiste ?",answer:'IL A MAL AUX DENTS',choices:['IL A MAL AUX DENTS','IL VEUT UN CONTRÔLE','IL A PERDU UNE DENT']},
        {text:"La météo annonce du soleil pour le week-end. La famille prévoit un pique-nique au parc.\n\nQue prévoit la famille ?",answer:'UN PIQUE-NIQUE',choices:['UN PIQUE-NIQUE','UNE SORTIE AU CINÉMA','UN VOYAGE']},
        {text:"Léa a oublié ses clés au bureau. Elle doit attendre son mari pour rentrer.\n\nPourquoi Léa attend-elle son mari ?",answer:'ELLE A OUBLIÉ SES CLÉS',choices:['ELLE A OUBLIÉ SES CLÉS','SA VOITURE EST EN PANNE',"ELLE N'A PAS D'ARGENT"]} ],
    3:[ {text:"Le magasin de vêtements fait des soldes cette semaine. Les prix ont baissé de moitié sur tous les articles.\n\nUn pull qui coûtait 40€ coûte maintenant combien ?",answer:'20€',choices:['20€','30€','10€']},
        {text:"Chaque jour, Marc arrose ses plantes le matin. Aujourd'hui il a beaucoup plu, alors il ne les arrose pas.\n\nPourquoi Marc n'arrose-t-il pas ses plantes aujourd'hui ?",answer:'IL A DÉJÀ PLU',choices:['IL A DÉJÀ PLU','IL EST PARTI EN VACANCES','LES PLANTES SONT MORTES']},
        {text:"Le film commence à 20h30. Il dure deux heures. Camille doit prendre le dernier bus qui part à 23h.\n\nCamille aura-t-elle le temps de prendre son bus après le film ?",answer:'OUI',choices:['OUI','NON','DE JUSTESSE SEULEMENT']},
        {text:"Le médecin a prescrit un médicament à prendre trois fois par jour, pendant 5 jours. Aujourd'hui, c'est le 3ème jour du traitement.\n\nCombien de jours reste-t-il de traitement ?",answer:'2 JOURS',choices:['2 JOURS','3 JOURS','5 JOURS']},
        {text:"Nina économise 10 euros chaque semaine pour s'acheter un vélo qui coûte 100 euros. Elle a déjà économisé pendant 7 semaines.\n\nCombien d'argent manque-t-il à Nina ?",answer:'30 EUROS',choices:['30 EUROS','70 EUROS','100 EUROS']},
        {text:"L'avion devait décoller à 14h, mais il a 1h de retard à cause de la météo. Les passagers attendent dans le hall.\n\nÀ quelle heure l'avion va-t-il décoller ?",answer:'15H',choices:['15H','13H','14H']} ]
  }}
});
