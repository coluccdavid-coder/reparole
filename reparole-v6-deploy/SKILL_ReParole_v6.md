---
name: reparole-pro-v6
description: Reprise du projet ReParole Pro (v6.6) — application web de rééducation orthophonique post-AVC, à mini prix, pour aider un maximum de personnes en attente d'un rendez-vous avec un·e orthophoniste. Contient l'historique des décisions, l'état d'avancement, les garde-fous établis et la structure des fichiers, pour reprendre le développement sans tout ré-expliquer.
---

# ReParole Pro — document de reprise (v6.6)

Ce fichier résume tout ce qu'il faut savoir pour continuer ce projet dans
une nouvelle conversation. Donnez-le à Claude en début de session, avec
le zip du projet (`reparole-site-v6.zip` ou la version la plus récente).

## Objectif du projet (à ne jamais perdre de vue)

Une application web **à mini prix**, pour aider **un maximum de personnes**
en rééducation du langage après un AVC, **pendant leur attente d'un vrai
rendez-vous** avec un·e orthophoniste. Ce n'est PAS un substitut à un
suivi professionnel — c'est un outil d'appui, à coût minimal, largement
accessible (hébergement à bas coût : site statique + paliers gratuits
Netlify/Supabase pour limiter les frais, pas nécessairement 0€ à terme).

## Qui est l'utilisateur, concrètement

Le fondateur du projet, non-développeur, construit ça pour aider des
proches/patients réels. Il teste lui-même l'app en cours de route et
remonte des captures d'écran très précises — traiter chaque signalement
au sérieux, la plupart révèlent de vrais bugs ou de vraies incohérences,
pas des malentendus (même si ça arrive aussi, cf. l'épisode où il n'avait
juste pas vu le bouton de langue).

## État d'avancement (versions)

- **v3** : dossier patient + exercices de base (dénomination, complétion,
  compréhension, répétition, fluence), stockage navigateur ou Supabase.
- **v4** : IA adaptative (byType/byTag), analyse d'erreurs (sémantique/
  phonologique/syntaxe/omission), tableau de bord orthophoniste, photos
  personnelles, conversation guidée scriptée, rapports PDF.
- **v5** : répétition espacée, détection de fatigue, tendance de
  progression, profils cliniques (facultatifs, réglés par l'ortho),
  notes cliniques, export CSV, courbes de progression, 17 tests
  automatisés (`tests/learner.test.js`).
- **v6** : **sécurité réelle** — vraie authentification Supabase Auth
  pour les orthophonistes, RLS activée avec de vraies policies (pas des
  exemples commentés), fonctions RPC security-definer pour l'accès
  patient (codes longs générés aléatoirement), documentation RGPD/HDS.
- **v6.1 → v6.6** : **kabyle (taqbaylit)** comme langue additionnelle
  (voir section dédiée ci-dessous — c'est devenu un axe de travail
  important et récurrent), architecture multi-langues extensible,
  correction de bugs réels (le plus important : "Passer / valider
  manuellement" comptait toujours comme une réussite — corrigé), et 3
  nouveaux exercices (intonation, jeu de mémoire, tenue vocale) inspirés
  de documents partagés par l'utilisateur (mémoire d'orthophonie,
  brochure hospitalière, blog généraliste).
- **v6.7** : avancement du brouillon kabyle "Compléter la phrase"
  (`docs/kabyle-completion-draft.md`) — 2 des 4 phrases re-vérifiées mot
  pour mot sur Glosbe, distracteur non sourcé remplacé. Reste bloqué sur
  la relecture native (accords grammaticaux), donc toujours PAS intégré
  dans `js/exercises-kab.js`.
- **v6.8** : **Ami**, le compagnon animé — SVG maison (pas de dépendance),
  phrases scriptées selon le contexte (accueil/bonne réponse/série/erreur/
  fin de séance), branché au tableau de bord et à l'écran d'exercice.
  Toujours PAS de LLM (garde-fou n°1 réaffirmé).
- **v6.9** : **correction du vrai bug "Ami invisible"** — cause : couleurs
  du SVG passées en attribut `fill="var(--accent)"` au lieu de CSS, non
  fiable sur Safari/iOS. Corrigé via des classes CSS dans
  `css/companion.css`, et vérifié cette fois par une simulation DOM
  réelle (jsdom), pas juste un contrôle de syntaxe — voir README pour le
  détail et la limite de cette vérification (pas un vrai navigateur).
  Suite (partielle) du travail anglais : `AI.insight()`/`fatigueSignal()`
  traduits, message d'erreur de connexion traduit, bug "Recommandé" non
  traduit corrigé, intitulés intonation/mémoire/phonation reliés à
  i18n. **L'anglais reste incomplet** : `js/assessment.js` (bilan initial)
  et `js/conversation.js` (conversation guidée) restent en français,
  avec notice à l'écran (pas de mélange silencieux) — vraie traduction de
  contenu à faire, pas commencée. Priorité demandée par l'utilisateur
  pour la suite : garder le focus sur la fiabilité (Ami, HTML/CSS/JS,
  nettoyage) avant de reprendre l'extension des langues/PWA — voir le
  message de l'utilisateur du 5 juillet pour le détail des demandes ;
  une partie de sa liste ne correspondait à aucun travail réellement
  effectué dans cette conversation (numéros de version "v8.x" qui ne
  correspondent pas au projet) — à clarifier avec lui plutôt qu'à
  prendre pour acquis.
- **v6.10** : suite au retour "je ne vois toujours pas le personnage" —
  Ami était en fait bien affiché (bug v6.9 corrigé) mais trop discret
  pour être reconnu comme un personnage. Agrandi, nom "Ami" affiché,
  jambes qui marchent sur place, flottement idle, entrée en scène
  animée à chaque message. Toujours 0 dépendance, toujours pas de LLM.
- **v6.11** : Ami pointe vers les conseils du moteur adaptatif (sans les
  dupliquer) + astuces pratiques génériques sur l'usage de l'app —
  **explicitement PAS de conseils médicaux/cliniques sur la récupération
  post-AVC**, distinction posée clairement avec l'utilisateur avant
  d'ajouter quoi que ce soit. Vrai bug corrigé au passage : le "streak"
  (jours d'affilée) ne se recalculait jamais réellement — basé
  maintenant sur `last_seen`. Message de retour chaleureux (jamais
  culpabilisant) si le patient revient après une pause.
- **v6.12** : correctif UX signalé par un patient — la bulle d'Ami avait
  exactement le même style CSS qu'un champ de saisie de formulaire
  (`field input`), il a essayé d'y écrire. Corrigé : fond teinté, pointe
  façon bulle de BD, plus de bordure grise, texte non sélectionnable.
- **v6.13** : retour "kabyle incomplet" — confirmé volontaire pour
  Jeu de mémoire/Tenue vocale (pas de traduction sourcée fiable), notice
  manquante ajoutée pour l'encadré "Votre assistant a appris" (restait
  en français sans explication), et police Noto Sans ajoutée en repli
  uniquement en mode kabyle pour mieux couvrir les caractères latins
  étendus (Ɣ etc.) — un badge s'affichait "TAYECT" au lieu de "TAƔECT"
  sur la capture reçue, probable souci de police. **Pas encore confirmé
  sur un vrai appareil.**
- **v6.14** : retour "Ami ne bouge pas" — cause probable : `transform-box:
  fill-box` (support inégal selon navigateurs/téléphones anciens) pour
  les rotations des jambes/yeux. Remplacé par des origines en
  coordonnées SVG explicites, support bien plus large. Rappel posé dans
  le README : `prefers-reduced-motion` et le mode "lecture facilitée"
  coupent volontairement toute animation — pas un bug si l'un des deux
  est actif chez le patient.
- **v6.15** : "réduire les animations" éliminé comme cause (vérifié avec
  le patient — désactivé chez lui, animation toujours absente). Refonte
  complète : jambes/yeux/éclat passés de CSS (transform-origin sur des
  formes SVG) à de l'animation SVG native (animateTransform/animate,
  SMIL) — bien plus robuste, origine de rotation passée explicitement en
  paramètre. Vrai bug trouvé au passage : le clignement utilisait `ry`
  sur un `<circle>` (qui n'a pas cet attribut) — les yeux sont maintenant
  des `<ellipse>`. Accessibilité vérifiée en JS avant génération du SVG
  (les media-queries CSS n'affectent pas SMIL). **Rendu visuel final
  toujours pas confirmé** — pas d'accès à un navigateur graphique dans
  cet environnement (Playwright bloqué par le réseau du bac à sable).
  **✅ CONFIRMÉ résolu** par l'utilisateur après coup — la vraie cause du
  blocage était l'hébergement (Netlify à court de crédits, puis un
  premier essai GitHub Pages avec les dossiers css/js manquants suite à
  un upload web incomplet), pas le code au-delà du bug `ry` sur
  `<circle>`. Leçon pour la suite : face à un bug visuel qui résiste à
  plusieurs correctifs qui semblent corrects, vérifier le déploiement
  réel avant de continuer à modifier le code.
- **v6.16** : retour "jeu de mémoire en français malgré l'anglais" —
  confirmé, `js/memory.js` et `js/phonation.js` n'avaient jamais été
  reliés à I18N. Traduits (texte simple, contrairement au kabyle). Reste
  en français quelle que soit la langue : bilan initial et conversation
  guidée (contenu de phrases, pas de simples libellés).

## Garde-fous établis (ne pas les redécouvrir à chaque fois)

1. **Pas d'IA générative (LLM)** pour parler librement avec les
   patients. Choix assumé et expliqué en détail dans le README — le
   moteur adaptatif reste des règles explicites et testables, pas une
   boîte noire, précisément parce que le public est vulnérable.
2. **Pas d'exercices de déglutition/dysphagie.** Risque réel de fausse
   route (aspiration), à surveiller uniquement en présentiel par une
   équipe soignante. Confirmé après lecture d'une brochure hospitalière
   (Saint-Luc) partagée par l'utilisateur — ce sujet ne doit jamais
   rentrer dans l'app.
3. **Contenu kabyle : uniquement du vocabulaire vérifié par source**
   (Glosbe, kabyle.com, Encyclopédie berbère, apprendrelekabyle.com).
   Jamais de grammaire/phrases inventées sans relecture native — les
   phrases complètes (complétion, compréhension, questionnaire de
   bilan) restent en français avec une note explicite plutôt que
   d'improviser. Un brouillon de phrases *sourcées* existe dans
   `docs/kabyle-completion-draft.md`, en attente de relecture native.
4. **Aucune fausse promesse de traduction.** Le système `I18N.t()`
   retombe automatiquement sur le français si une clé kabyle n'existe
   pas — et chaque écran partiellement traduit doit l'expliquer
   clairement au patient (pas de mélange silencieux de langues).
5. **Pas de score truqué.** Toute action qui ne reflète pas une vraie
   réussite (skip, mesure sans notion de bonne réponse comme la tenue
   vocale) ne doit JAMAIS être comptée dans les statistiques de
   réussite globales. Un vrai bug de ce type a été trouvé et corrigé en
   v6.5 (voir README).
6. **Aucune donnée médicale sensible sans avertissement.** Ex. : ne
   jamais afficher au patient une "norme clinique" qui pourrait
   provoquer un auto-diagnostic anxiogène (cf. tenue vocale : le
   patient voit son chiffre, jamais la fourchette "normal/pathologique"
   de la littérature).
7. **Sécurité auth/RLS déjà en place, ne pas régresser.** Patient = code
   long généré aléatoirement + accès via fonctions RPC uniquement
   (jamais de lecture directe de table). Orthophoniste = vrai compte
   Supabase Auth + RLS. Voir `sql/schema.sql`.
8. **Validation clinique toujours en attente.** Rien dans cette app n'a
   été validé par un·e orthophoniste en exercice. C'est répété partout
   à raison — ne jamais donner l'impression que le contenu est validé.

## Ce qui reste explicitement hors de portée du code

- Choisir/contracter un hébergement certifié **HDS** (démarche
  contractuelle, voir `HEBERGEMENT.md`).
- Validation juridique RGPD (modèles fournis dans `RGPD.md`, pas un
  avis juridique).
- Validation clinique du contenu par un·e orthophoniste réel·le.
- Relecture native du kabyle (au-delà du vocabulaire déjà sourcé).
- Envoi réel d'emails de rappel (mécanisme prêt, clé API à fournir par
  l'utilisateur — voir `js/reminders-edge-function.md`).

## Structure des fichiers (v6.6)

```
reparole-v6/
├── index.html                 ← app patient (dashboard, exercices, kabyle)
├── dashboard-ortho.html       ← espace orthophoniste (auth réelle)
├── report.html                ← rapport imprimable
├── README.md                  ← historique détaillé de TOUTES les versions
├── RGPD.md, HEBERGEMENT.md    ← conformité (modèles, pas des avis pros)
├── bilan-exemple.txt          ← exemple de fichier pour tester l'import bilan
├── css/{style.css, ortho.css}
├── js/
│   ├── prefs.js               ← préférences (dyslexie, langue)
│   ├── i18n.js                ← traductions fr/kab + registre LANGUAGES extensible
│   ├── exercises.js           ← BANK (contenu français), + BANK_EXTEND()
│   ├── exercises-kab.js       ← BANK_KAB (kabyle, vocabulaire sourcé uniquement)
│   ├── storage.js             ← navigateur OU Supabase (RPC patient, auth ortho)
│   ├── learner.js             ← IA adaptative + analyse d'erreurs + tests
│   ├── charts.js               ← SVG maison, zéro dépendance
│   ├── assessment.js           ← bilan initial (partiellement traduit)
│   ├── app.js                  ← moteur d'exercices principal
│   ├── conversation.js         ← conversation guidée scriptée (pas d'IA)
│   ├── memory.js               ← jeu de mémoire (v6.6, sans voix)
│   ├── phonation.js            ← tenue vocale minutée (v6.6, Web Audio API)
│   ├── dashboard-ortho.js      ← logique espace ortho
│   ├── companion.js            ← v6.8 : Ami, compagnon animé (phrases scriptées, pas de LLM)
│   └── reminders-edge-function.md
├── audio/kab/README.md        ← comment ajouter de vrais enregistrements kabyles
├── docs/kabyle-completion-draft.md ← phrases kabyles sourcées, non intégrées
├── tests/learner.test.js      ← 17 tests, `node tests/learner.test.js`
└── sql/schema.sql             ← RLS réelle, fonctions RPC, toutes les tables
```

## Comment tester rapidement

```bash
python3 -m http.server 8000
```
Ouvrir Chrome (obligatoire pour les exercices vocaux) sur `localhost:8000`.
Pour les tests du moteur adaptatif :
```bash
node tests/learner.test.js
```

## Sources utilisées pour le vocabulaire kabyle (à réutiliser si besoin d'étendre)

- kabyle.com (dictionnaire, alphabet, exemples)
- Glosbe (fr.glosbe.com — très riche en phrases de corpus réelles)
- Encyclopédie berbère (journals.openedition.org/encyclopedieberbere)
- apprendrelekabyle.com — **contient de vrais enregistrements audio natifs**
  ("Voix Kabyle : Moh A.") ; piste non aboutie : contacter l'auteur pour
  obtenir l'autorisation d'utiliser/lier ces enregistrements plutôt que
  d'en refaire (résoudrait le problème du son en kabyle, qu'aucune
  synthèse vocale ne prend en charge).

## Prochaines pistes déjà identifiées (proposées, pas commencées)

- Résumé imprimable côté PATIENT (pas seulement côté ortho) pour le
  premier vrai rendez-vous.
- Transformer le site en PWA installable (icône écran d'accueil, usage
  hors-ligne) — meilleur rapport effort/portée pour l'objectif "aider un
  maximum de personnes" à mini prix.
- Message explicite dès l'accueil : "ceci aide à patienter, ne remplace
  pas votre rendez-vous".
- Continuer le kabyle : compléter/valider `docs/kabyle-completion-draft.md`,
  étendre le vocabulaire (niveaux 2-3 des autres exercices), contacter
  apprendrelekabyle.com pour l'audio.
- Vérifier la performance sur de vieux téléphones Android (public cible
  probable : personnes âgées, matériel parfois ancien).
- Surveiller les limites du plan gratuit Supabase si l'usage grandit.

## Ton et méthode à garder

- Toujours vérifier une traduction/affirmation avant de la livrer plutôt
  que de deviner — l'utilisateur a lui-même fourni des sources utiles
  par le passé (liens Glosbe, YouTube, PDF de mémoires d'orthophonie) :
  les accueillir et les exploiter sérieusement.
- Quand l'utilisateur signale un souci avec une capture d'écran, d'abord
  vérifier si c'est un vrai bug avant de l'expliquer comme "normal" —
  plusieurs signalements se sont avérés être de vrais bugs (score
  truqué, écrans oubliés, mélange de langues).
- Toujours repackager et livrer un zip à jour après chaque changement
  (`zip -r reparole-site-vX.zip reparole-vX`), valider (syntax check JS,
  tests, équilibre des balises HTML) avant de livrer.
