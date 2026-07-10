# Enregistrements audio en kabyle

Ce dossier est prévu pour de **vrais enregistrements humains** — aucune
voix de synthèse ne prend en charge le kabyle aujourd'hui (vérifié :
absent de Google Speech-to-Text / Web Speech API), et générer une fausse
prononciation serait pire que ne rien avoir.

## Comment ajouter un enregistrement

1. Enregistrez le mot à voix haute (téléphone, dictaphone, micro
   d'ordinateur — la qualité d'un smartphone suffit largement).
2. Exportez en `.mp3` (formats acceptés : mp3 uniquement pour l'instant).
3. Nommez le fichier selon le mot **tel qu'il apparaît dans
   `js/exercises-kab.js`**, en minuscules, sans les caractères
   diacritiques (ɣ→gh, ḥ→h, ɛ→aa, ṛ→r, ṣ→s, ṭ→t, ẓ→z, ḍ→d, ǧ→j), espaces
   remplacés par des tirets. La fonction `kabAudioSlug()` dans
   `js/exercises-kab.js` fait cette conversion automatiquement — en cas
   de doute, ouvrez la console du navigateur et tapez :
   ```js
   kabAudioSlug('TAḌEFFUT')  // → "tadeffut"
   ```
4. Déposez le fichier ici : `audio/kab/tadeffut.mp3`

C'est tout — l'application détecte et joue automatiquement le fichier
s'il existe, et affiche un message clair s'il n'existe pas encore
(jamais de silence trompeur).

## Mots qui bénéficieraient d'un enregistrement en priorité

Les mots actuellement utilisés dans "Nommer les images" (niveaux 1 et 2) :

amcic, taḍeffut, axxam, tafukt, takeṛṛust, aslem, tajeǧǧigt, aɣrum,
tabburt, tiliẓri, azeggaɣ, adfel

(voir `js/exercises-kab.js` pour le mot exact tel qu'il doit apparaître
dans le nom de fichier)

## Qualité et validation

Un enregistrement par une personne kabylophone native compte double :
il donne le bon mot ET la bonne prononciation. Si vous avez accès à
quelqu'un qui peut enregistrer ces mots, c'est probablement la
contribution la plus utile possible à ce stade du projet.
