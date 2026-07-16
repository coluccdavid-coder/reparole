# Enregistrements audio en darija algérienne

Ce dossier est prévu pour de **vrais enregistrements humains** — aucune
voix de synthèse du navigateur ne prend en charge la darija algérienne
aujourd'hui (`LANGUAGES.dz.speechLocale = null` dans `js/i18n.js`), et
générer une fausse prononciation serait pire que ne rien avoir.

## Comment ajouter un enregistrement

1. Enregistrez le mot à voix haute (téléphone, dictaphone, micro
   d'ordinateur — la qualité d'un smartphone suffit largement).
2. Exportez en `.mp3` (formats acceptés : mp3 uniquement pour l'instant).
3. Nommez le fichier selon le mot **tel qu'il apparaît dans
   `js/exercises-dz.js`** (colonne `answer`), en minuscules. La
   fonction `partialLangAudioSlug()` dans `js/app.js` fait cette
   conversion automatiquement (translittération générique, pas de
   règles spécifiques comme pour le kabyle) — en cas de doute, ouvrez
   la console du navigateur et tapez :
   ```js
   partialLangAudioSlug('dz', 'خنزير')
   ```
4. Déposez le fichier `.mp3` directement dans ce dossier
   (`audio/dz/<mot-translittéré>.mp3`).

Rien d'autre à faire : l'app détecte automatiquement le fichier au
prochain chargement de l'exercice de dénomination en darija algérienne
(bouton 🔊 sous l'image). Tant qu'aucun fichier n'existe pour un mot
donné, un message clair l'indique au patient plutôt que de rester
silencieux ou de simuler une voix.
