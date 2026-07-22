# Contexte de démarrage — ReParole Pro

*À coller en premier message d'une nouvelle conversation avec Claude pour
reprendre ce projet sans perdre le contexte accumulé.*

## Qui developpe ça

Coluche — développeur solo du projet, pas d'équipe technique derrière.
Confortable avec le code une fois qu'il tourne, mais a besoin d'un
accompagnement pas à pas pour tout ce qui touche au terminal / Git /
Codespaces (ne pas supposer une aisance technique sur ces outils
précis — détailler chaque commande, anticiper les blocages classiques
comme les branches divergentes).

## Le projet en une phrase

**ReParole Pro** : application de rééducation du langage pour patients
post-AVC, multilingue (14 langues), conçue comme un complément à
l'orthophoniste — jamais un remplacement, jamais un diagnostic médical.
Vanilla JS, PWA, Supabase, Stripe. Version bêta fonctionnelle,
pas encore en production.

**Avant toute chose, lire `SKILL_ReParole_v6.md`** à la racine du projet
— état réel et à jour du produit (pas ce présent fichier, qui parle du
processus de travail, pas du produit lui-même).

## Comment ce projet a été travaillé jusqu'ici — conventions à garder

### Rigueur non négociable
- **Toujours vérifier avant d'affirmer.** Ce projet a connu plusieurs
  vrais bugs découverts uniquement parce que le code a été vérifié
  directement plutôt que supposé correct (ex. : liste de types
  d'exercice figée depuis des mois, structure de données mal déballée
  côté aidant). Ne jamais dire "c'est corrigé" sans avoir testé.
- **Chaque changement passe par la suite de tests** (`npm test`, 738+
  tests) avant toute livraison. Zéro échec exigé.
- **Chaque nouvelle version** : `CACHE_NAME` incrémenté dans `sw.js`,
  entrée de changelog ajoutée en haut de `README.md` (juste après
  `## Tester`), tests dédiés si le changement le justifie.
- **Livraison** : zip du dossier complet (hors `node_modules`, `.git`)
  vers `/mnt/user-data/outputs/`, ancien zip supprimé avant.

### Honnêteté sur les limites de compétence
- Le contenu en darija (dz/ma/tn) est un brouillon assumé, construit
  avec une confiance raisonnable mais **jamais relu par un∙e locuteur∙rice
  natif∙ve**.
- Le kabyle est traité avec plus de prudence encore — langue berbère à
  part entière, pas un dialecte arabe, compétence plus limitée.
- Certains types de contenu ont été **volontairement refusés** plutôt
  que produits avec une fausse confiance — ex. : "Structure de phrase"
  (construire des erreurs grammaticales plausibles) pour les 4 langues
  partielles. Mieux vaut un manque visible qu'un contenu qui a l'air
  fiable sans l'être.
- Cette discipline a été explicitement demandée et doit continuer :
  proposer, dire le niveau de confiance réel, laisser le choix plutôt
  que d'imposer.

### Qualité linguistique
- Toute traduction ajoutée doit couvrir : le contenu de l'exercice, les
  clés d'interface (`I18N_STRINGS`), les explications du compagnon Ami
  (`COMPANION_PHRASES`), et si applicable le contenu vocal
  (`scripts/extract-voice-content.js`). Plusieurs bugs passés venaient
  d'avoir oublié l'un de ces 4 éléments en ajoutant un nouveau type de
  contenu.
- Toujours vérifier la parité réelle avec un script, jamais par
  supposition.

## Pièges déjà rencontrés — ne pas refaire

- **Le dossier `audio/`** ne doit jamais être supprimé lors d'une mise
  à jour complète du code — aucun zip livré ne le contient (généré par
  l'utilisateur avec sa propre clé Google Cloud). Toujours le préserver
  explicitement lors d'un remplacement de fichiers.
- **Nouveau contenu parlé** → toujours rappeler de relancer
  `node scripts/extract-voice-content.js` puis
  `generate-voice-audio.js` — plusieurs oublis ont laissé des
  exercices entiers sur la voix robot du navigateur.
- **`FRENCH_ONLY_EXERCISE_TYPES`** (js/app.js) a un nom trompeur : ne
  pas retirer un type de cette liste en pensant qu'il a une traduction
  — le mécanisme est dynamique (`hasTranslatedContent()`), le retirer
  désactive la vérification entièrement.
- **Modifier une fonction SQL `returns setof`** après un `alter table`
  échoue sans un `drop function` explicite avant le `create or
  replace` — voir le commentaire dans `sql/schema.sql`.
- **Les variables JS déclarées en `const` au niveau module** ne sont
  pas accessibles via `window.X` dans les tests — prévoir un hook de
  test explicite (`window.__testXxx = ...`) plutôt que de supposer un
  accès direct.
- **wkhtmltoimage / rendu de captures** : le tool `view` ne renvoie pas
  toujours un aperçu visuel exploitable dans certaines sessions —
  vérifier par analyse de pixels/couleurs (PIL) plutôt que d'assumer un
  échec ou une réussite.
- **Dimensionner une image dans un docx** : la largeur en pixels doit
  tenir compte de la page réelle (~600px max pour une page A4 avec
  marges standard), pas une valeur arbitraire — déjà provoqué un
  débordement hors-page.

## Où en est le projet (résumé — voir SKILL_ReParole_v6.md pour le détail)

- 14 langues, 4 piliers (langage / parole / mémoire / acalculie), tous
  testés et cohérents
- Voix cloud générées pour les 9 langues complètes
- Tarification : 10 €/mois patient, 9,99 €/mois orthophoniste (paywall
  désactivé pour l'instant)
- Pas encore en production : pages légales incomplètes, Supabase non
  certifié HDS, relecture native manquante

## Prochaines pistes en discussion, pas encore tranchées

- Étoffer l'espace aidant (mots à revoir, historique visuel, contexte
  de langue)
- Attention / fonctions exécutives comme nouveaux exercices, si
  souhaité
- Prise de contact FNO et France AVC (coordonnées déjà réunies)
- Décision GitHub vs alternative si besoin de migrer
