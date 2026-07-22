# 🛠️ Développement — conventions et discipline

## La discipline de version (obligatoire, dans l'ordre)

1. Développer + **tests verts** : `npm test` → 0 échec (89 fichiers de
   tests, jsdom, sans navigateur).
2. Incrémenter `CACHE_NAME` dans `sw.js` (ligne 30).
3. Écrire l'entrée `## v6.X` dans `README.md` (juste avant `## Tester`) —
   le README est le journal de bord du projet.
4. Mettre à jour `docs/INDEX.md` (ligne « Version documentée ») — exigé
   par `tests/documentation.test.js`.
5. Zip de livraison : exclure `node_modules/`, `.git/`,
   `reparole-deploy-*.zip` ; vérifier 0 fichier node_modules et la
   présence des 2 `audio/(dz|kab)/README.md`.
6. Git : TOUJOURS `git commit -m "message"` (un `git commit` nu ouvre
   Vim).

## Toute nouvelle version DOIT être documentée

C'est un principe du projet (et un verrou de test) : une fonctionnalité
qui n'est pas dans `README.md` + le document `docs/` concerné n'est pas
terminée. Le test de synchronisation vérifie automatiquement : version
courante dans INDEX.md, toutes les tables SQL dans DONNEES.md, tous les
types d'exercices dans FONCTIONNALITES.md, toutes les tâches IA dans
IA.md, les 14 langues listées.

## Conventions i18n (`js/i18n.js`)

- **14 blocs de langues** ; les nouvelles clés s'insèrent **en tête de
  chaque bloc** (script Python matchant `^  ([a-z]{2,3}): \{$`) — les 14
  blocs reçoivent les clés d'un coup, aucune langue oubliée.
- **Clés-fonctions** pour les valeurs paramétrées :
  `journal_days_ago:(d)=>\`il y a ${d} jour${d>1?'s':''}\`` — appelées
  via `I18N.t('clé', arg)`.
- Le test `tests/i18n-usage.test.js` échoue si une clé référencée dans
  le code n'est pas définie.
- **Kabyle : contenu réel uniquement** — jamais de kabyle inventé ; en
  cas de doute, la langue est exclue de la fonctionnalité (voir
  `docs/kabyle-*.md`).
- Admin (`admin.html`) : FR en dur, volontairement hors i18n.

## Banques de contenu (`js/exercises*.js`)

- Un item = `{emoji, answer, choices}` (+ variantes par type).
- **Unicité visuelle** (verrou v6.188) : un emoji (normalisé Unicode)
  ne peut pointer que vers UNE réponse par banque, et les jumeaux
  visuels connus (🏖️/⛱️) ne peuvent pas coexister —
  `tests/feedback-v188.test.js`.
- Emojis abstraits (💬, ❓, ⭐…) exclus des jeux
  (`ABSTRACT_GAME_EMOJIS`).
- **Changer un MOT** ⇒ régénérer les voix (voir DEPLOIEMENT.md §4).
  Changer un emoji seul est voice-safe.

## Tests — comment et pourquoi

- Lancer tout : `npm test`. Un fichier : `node tests/<nom>.test.js`.
- Chaque fonctionnalité livrée embarque son fichier de tests qui
  verrouille les INVARIANTS (pas l'implémentation) : ex. « l'ortho est
  le SEUL chemin d'envoi d'un exercice IA », « aucune émotion en
  première personne chez Ami », « les colonnes de l'edge existent dans
  le schéma ».
- Astuce apprise à la dure : préférer des fenêtres
  (`[\s\S]{0,600}?`) aux assertions d'adjacence stricte — les
  insertions futures cassent l'adjacence, pas l'invariant.
- Après toute édition scriptée (Python/sed), **relire les coutures** :
  deux bugs graves (v6.189) sont nés d'un remplacement automatique mal
  bordé. L'équilibre des parenthèses du bloc edge est désormais testé.

## Style de code

- Vanilla JS, pas de dépendance front. Commentaires en français,
  orientés « pourquoi » (les leçons y sont gravées avec leur numéro de
  version).
- `js/storage.js` est le SEUL point d'accès aux données — jamais
  d'appel Supabase direct ailleurs.
- Toute nouvelle chaîne visible passe par `data-i18n` ou `I18N.t` ;
  tout HTML dynamique passe par `escapeHTML`.
