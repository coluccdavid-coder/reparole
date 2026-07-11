# Enregistrements audio en sango

Ce dossier est prévu pour de **vrais enregistrements humains** — aucune
voix de synthèse ne prend en charge le sango aujourd'hui (vérifié :
absent des services de synthèse/reconnaissance vocale des navigateurs),
et générer une fausse prononciation serait pire que ne rien avoir.

## ⚠️ À faire après, pas avant

Ce guide ne sert que **quand la liste de mots
(`docs/sango-translation-request.md`) aura été traduite et intégrée**
au code (`js/exercises-sango.js`, qui n'existe pas encore). Le nom de
chaque fichier audio doit correspondre exactement au mot tel qu'il
apparaît dans ce fichier — enregistrer avant risquerait de devoir tout
renommer si l'orthographe change en cours de route.

## Comment ajouter un enregistrement (une fois le texte finalisé)

1. Enregistrez le mot à voix haute (téléphone, dictaphone, micro
   d'ordinateur — la qualité d'un smartphone suffit largement).
2. Exportez en `.mp3`.
3. Nommez le fichier selon le mot tel qu'il apparaîtra dans
   `js/exercises-sango.js`, en minuscules, espaces remplacés par des
   tirets. Si le sango utilise des signes toniques ou diacritiques
   dans l'orthographe retenue, dites-le-moi à ce moment-là : j'écrirai
   une fonction de conversion pour les noms de fichiers, comme
   `kabAudioSlug()` le fait déjà pour le kabyle (ɣ→gh, ḥ→h, etc.) —
   pas la peine d'y réfléchir maintenant.
4. Déposez le fichier ici : `audio/sango/<mot>.mp3`

L'application détectera et jouera automatiquement le fichier s'il
existe, avec un message clair s'il n'existe pas encore (jamais de
silence trompeur) — même mécanisme que pour le kabyle.

## Qualité et validation

Un enregistrement par une personne sango-phone native compte double :
il donne le bon mot ET la bonne prononciation. Si votre personne qui
aide à la traduction est aussi partante pour enregistrer les mots
qu'elle traduit, c'est la contribution la plus utile possible à ce
stade — mais rien d'urgent : mieux vaut d'abord finaliser le texte.
