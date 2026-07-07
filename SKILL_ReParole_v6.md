---
name: reparole-pro-v6
description: Reprise du projet ReParole Pro (v6.36) — application web de rééducation orthophonique post-AVC, à mini prix, pour aider un maximum de personnes en attente d'un rendez-vous avec un·e orthophoniste. Version épurée : contient l'essentiel pour reprendre (état actuel, garde-fous, structure, pièges connus) sans l'historique détaillé de chaque version — voir README.md dans le zip pour l'historique complet.
---

# ReParole Pro — document de reprise épuré (v6.36)

Ce fichier résume l'essentiel pour continuer ce projet dans une nouvelle
conversation, sans le détail de chaque version passée (ce détail existe
dans `README.md`, à l'intérieur du zip du projet — à consulter si besoin
de comprendre POURQUOI un choix précis a été fait). Donnez ce fichier à
Claude en début de session, avec le zip du projet (la version la plus
récente livrée).

## ⚠️ À faire en priorité à la reprise

1. **Rien de cassé ni de bloquant** — la dernière session s'est terminée
   proprement (7 suites de tests automatisés au vert, dernière demande
   de l'utilisateur traitée : résumé imprimable côté patient, v6.36).
2. **Toujours en attente de l'utilisateur** (je ne peux pas le faire à sa
   place, comme pour GitHub) :
   - Créer un vrai projet **Supabase** et en transmettre les identifiants
     (`SUPABASE_URL`/`SUPABASE_ANON_KEY` sont encore des chaînes vides
     dans `js/storage.js`) — l'espace orthophoniste ET l'espace aidant
     ne fonctionnent pas réellement (juste en mode navigateur local)
     tant que ce n'est pas fait.
   - Créer un compte **Stripe** + les 4 tarifs + déployer les 2 Edge
     Functions (voir `js/stripe-edge-functions.md`) pour que le paiement
     Pro fonctionne réellement (actuellement désactivé de toute façon —
     voir "État actuel" plus bas).
3. **Rien de tout ce qui touche au visuel n'a été confirmé par un vrai
   navigateur** — je n'ai pas accès à un navigateur graphique dans cet
   environnement, seulement à une vérification structurelle (CSS valide,
   simulation DOM via jsdom, tests). L'utilisateur teste lui-même et
   donne des retours — considérer tout rendu visuel comme "probablement
   bon" mais pas "confirmé" tant qu'il n'a pas dit l'avoir vu. Ceci
   inclut la toute nouvelle page `aidant.html` (v6.35), jamais vue dans
   un vrai navigateur.
4. **"Espace aidant" — première version fonctionnelle livrée en v6.35,
   mais pas terminée.** Ce qui existe : le patient génère un code
   d'invitation depuis son tableau de bord, l'aidant se connecte avec ce
   code sur `aidant.html` et voit les progrès + des conseils du jour
   générés par des règles explicites (pas de LLM). Ce qui reste
   ouvert, à ne pas relancer sans demande explicite :
   - Traduction (français uniquement pour l'instant).
   - Plusieurs aidants par patient (décision utilisateur du 7 juillet :
     un seul pour l'instant, volontairement).
   - Confirmation visuelle réelle (point 3 ci-dessus).
   - Tout ce qui dépend de Supabase (point 2 ci-dessus) : en mode
     navigateur local, l'aidant et le patient doivent être sur le même
     appareil/navigateur pour que ça fonctionne (pas de vrai partage
     entre appareils sans cloud configuré).
5. **Résumé imprimable patient (v6.36, `mon-resume.html`)** : terminé et
   testé, français uniquement pour l'instant (comme l'espace aidant à
   ses débuts). Accessible depuis le bouton "🖨️ Imprimer mon résumé"
   dans la carte "Votre progression" du tableau de bord patient.

## Objectif du projet (à ne jamais perdre de vue)

Une application web **à mini prix**, pour aider **un maximum de personnes**
en rééducation du langage après un AVC, **pendant leur attente d'un vrai
rendez-vous** avec un·e orthophoniste. Ce n'est PAS un substitut à un
suivi professionnel — c'est un outil d'appui, à coût minimal, largement
accessible (hébergement à bas coût : site statique + paliers gratuits
Netlify/Supabase, pas nécessairement 0€ à terme).

## Qui est l'utilisateur, concrètement

Le fondateur du projet, non-développeur, construit ça pour aider des
proches/patients réels. Il teste lui-même l'app en cours de route et
remonte des captures d'écran très précises — traiter chaque signalement
au sérieux : la plupart révèlent de vrais bugs ou de vraies incohérences,
pas des malentendus.

## État actuel du projet (résumé, pas un historique)

L'app couvre : dossier patient, 8 types d'exercices (dénomination,
complétion, compréhension, répétition, répétition avec intonation,
dénomination orale, fluence, photos personnelles) + jeu de mémoire +
tenue vocale + conversation guidée ; IA adaptative avec répétition
espacée, analyse d'erreurs, détection de fatigue ; tableau de bord
orthophoniste avec vraie authentification Supabase (RLS, RPC
security-definer, MFA/TOTP) ; **espace aidant (v6.35, première version)**
— code d'invitation généré par le patient, vue en lecture seule
(progrès + conseils du jour à base de règles), un seul aidant par
patient pour l'instant ; 8 langues (fr complet, en/es/it/pt/de/ar
niveau "interface complète", kabyle partiel — vocabulaire sourcé
uniquement, voir garde-fou n°3 ; l'espace aidant lui-même est encore
français uniquement) ; mode hors-ligne (PWA/service worker) ; Ami, le
compagnon animé (SVG, phrases scriptées, PAS de LLM — garde-fou n°1)
qui explique le but de chaque exercice en y "arrivant" visuellement ;
structure gratuit/pro codée mais **paywall actuellement désactivé**
(`PAYWALL_ENABLED = false` dans `js/app.js` — décision utilisateur du 7
juillet, "tout accessible pour l'instant, paiement repoussé à plus
tard" ; toute la logique de verrouillage reste en place, prête à être
réactivée d'un coup en repassant ce booléen à `true`) ; **résumé
imprimable côté patient** (v6.36, `mon-resume.html`) — séances,
réussite, série, courbe, historique, accessible depuis le tableau de
bord, français uniquement pour l'instant.

Pour le détail version par version (pourquoi chaque choix a été fait,
les bugs corrigés, les demandes de l'utilisateur citées), voir
`README.md` dans le zip — pas reproduit ici pour rester lisible.

## Pièges techniques déjà rencontrés (à ne pas refaire)

- **`CACHE_NAME` dans `sw.js`** : toute livraison touchant un fichier JS
  ou CSS doit l'incrémenter, sinon les patients ayant déjà ouvert l'app
  (mode hors-ligne, cache "cache d'abord") continuent de recevoir les
  anciens fichiers, sans erreur visible — ça ressemble à "rien n'a
  changé" côté utilisateur. Oublié une fois (v6.33/v6.34), corrigé en
  v6.34.1 ; bien incrémenté depuis (v6.35 : `reparole-v6-35`).
- **Un seul rechargement peut ne pas suffire à voir une mise à jour**,
  même après avoir bien incrémenté `CACHE_NAME` : le nouveau service
  worker s'installe en tâche de fond au premier rechargement, mais ne
  prend le contrôle qu'au rechargement suivant (ou à la fermeture
  complète/réouverture de l'app). Un navigateur qui n'a jamais ouvert
  l'app voit la mise à jour immédiatement, ce qui peut dérouter en
  comparaison. Le dire à l'utilisateur plutôt que de laisser croire à un
  nouveau bug s'il ne voit pas le changement du premier coup.
- **Attributs de présentation SVG (`fill="var(--accent)"`) non fiables
  sur Safari/iOS** — utiliser des classes CSS à la place (voir
  `css/companion.css`).
- **`user` et les autres `const`/`let` de haut niveau d'un fichier JS
  sont invisibles depuis un `eval()` séparé** en test jsdom — toujours
  vérifier avec `grep -n "window\." fichier.js` avant d'écrire un test,
  et exposer explicitement ce dont un test a besoin.
- **Un `test()` qui enveloppe une fonction `async` doit être `await`é** —
  sinon les assertions internes s'exécutent après le résumé final du
  script de test (compteurs faux, résumé imprimé trop tôt). Repéré en
  écrivant `tests/caregiver.test.js` (connexion aidant = fonction
  async) : la moindre fonction testée qui utilise `await` à l'intérieur
  exige que TOUT le fichier de test tourne dans un `async function
  main(){ ... } main();`, avec `await test(...)` à chaque appel — pas
  seulement ceux qui semblent async.

## Garde-fous établis (ne pas les redécouvrir à chaque fois)

1. **Pas d'IA générative (LLM)** pour parler librement avec les
   patients. Le moteur adaptatif, Ami, et le moteur de conseils de
   l'espace aidant (`js/caregiver-tips.js`) restent des règles
   explicites et testables, pas une boîte noire — précisément parce
   que le public est vulnérable.
2. **Pas d'exercices de déglutition/dysphagie.** Risque réel de fausse
   route (aspiration), à surveiller uniquement en présentiel par une
   équipe soignante. Ce sujet ne doit jamais rentrer dans l'app.
3. **Contenu kabyle : uniquement du vocabulaire vérifié par source**
   (Glosbe, kabyle.com, Encyclopédie berbère, apprendrelekabyle.com).
   Jamais de grammaire/phrases inventées sans relecture native — les
   phrases complètes (complétion, compréhension, questionnaire de
   bilan) restent en français avec une note explicite plutôt que
   d'improviser.
4. **Aucune fausse promesse de traduction.** Le système `I18N.t()`
   retombe automatiquement sur le français si une clé manque — et
   chaque écran partiellement traduit doit l'expliquer clairement au
   patient (pas de mélange silencieux de langues). L'espace aidant
   n'utilise pas encore I18N (français seulement, assumé) — pas un
   "mélange", juste une page pas encore traduite.
5. **Pas de score truqué.** Toute action qui ne reflète pas une vraie
   réussite (skip, mesure sans notion de bonne réponse comme la tenue
   vocale) ne doit JAMAIS être comptée dans les statistiques de
   réussite globales.
6. **Aucune donnée médicale sensible sans avertissement.** Ex. : ne
   jamais afficher au patient (ni à l'aidant) une "norme clinique" qui
   pourrait provoquer un auto-diagnostic anxiogène (cf. tenue vocale :
   le patient voit son chiffre, jamais la fourchette "normal/
   pathologique" de la littérature). Même prudence pour les phrases
   d'Ami ET pour les conseils de l'espace aidant : pratiques, jamais
   une norme chiffrée.
7. **Sécurité auth/RLS déjà en place, ne pas régresser.** Patient = code
   long généré aléatoirement + accès via fonctions RPC uniquement
   (jamais de lecture directe de table). Orthophoniste = vrai compte
   Supabase Auth + RLS. Aidant (v6.35) = même logique que le patient :
   code long non-cryptographique + fonction RPC dédiée
   (`get_caregiver_data`) qui ne renvoie qu'un sous-ensemble limité,
   jamais la fiche patient complète. Voir `sql/schema.sql`.
8. **Validation clinique toujours en attente.** Rien dans cette app n'a
   été validé par un·e orthophoniste en exercice. Ne jamais donner
   l'impression que le contenu est validé — l'espace aidant affiche ce
   rappel explicitement à l'écran.

## Ce qui reste explicitement hors de portée du code

- Choisir/contracter un hébergement certifié **HDS** (démarche
  contractuelle, voir `HEBERGEMENT.md`).
- Validation juridique RGPD (modèles fournis dans `RGPD.md`, pas un
  avis juridique).
- Validation clinique du contenu par un·e orthophoniste réel·le.
- Relecture native du kabyle (au-delà du vocabulaire déjà sourcé).
- Envoi réel d'emails de rappel (mécanisme prêt, clé API à fournir par
  l'utilisateur — voir `js/reminders-edge-function.md`).

## Structure des fichiers (v6.36)

```
reparole-v6/
├── index.html                 ← app patient (dashboard, exercices, PWA, tarifs, accès aidant)
├── dashboard-ortho.html       ← espace ortho (auth réelle + MFA + tarifs)
├── aidant.html                ← espace aidant (v6.35 : vrai tableau de bord, plus une page d'attente)
├── mon-resume.html            ← v6.36 : résumé imprimable côté PATIENT (ton chaleureux, distinct du rapport ortho)
├── report.html                ← rapport imprimable côté ORTHO (ton clinique, réservé — voir RLS)
├── manifest.json              ← PWA (nom, icônes, couleurs)
├── sw.js                      ← service worker (mode hors-ligne — CACHE_NAME à incrémenter à CHAQUE livraison JS/CSS ; v6.35 = reparole-v6-35)
├── icons/                     ← icônes PWA générées (192/512/apple-touch)
├── package.json               ← dépendance jsdom pour les tests
├── README.md                  ← historique détaillé de TOUTES les versions
├── RGPD.md, HEBERGEMENT.md    ← conformité + section PWA hors-ligne
├── bilan-exemple.txt          ← exemple de fichier pour tester l'import bilan
├── css/{style.css, ortho.css, companion.css}
├── js/
│   ├── prefs.js               ← préférences (dyslexie, langue, menu déroulant)
│   ├── i18n.js                ← I18N_STRINGS pour fr/en/es/it/pt/de/ar/kab, LANGUAGES
│   ├── exercises.js           ← BANK (français), + BANK_EXTEND()
│   ├── exercises-{en,es,it,pt,de,ar}.js ← BANK_XX, niveau complet
│   ├── exercises-kab.js       ← BANK_KAB (kabyle, vocabulaire sourcé uniquement)
│   ├── storage.js             ← navigateur OU Supabase + MFA + Stripe + accès aidant (testé par simulation)
│   ├── stripe-edge-functions.md ← guide complet paiement Stripe
│   ├── learner.js             ← IA adaptative + analyse d'erreurs + tests
│   ├── charts.js              ← SVG maison, zéro dépendance (réutilisé par l'espace aidant)
│   ├── assessment.js          ← bilan initial, traduit fr/en/es/it/pt/de/ar
│   ├── app.js                 ← moteur d'exercices + structure gratuit/pro (PAYWALL_ENABLED=false) + tarifs + carte "espace aidant"
│   ├── conversation.js        ← conversation guidée, traduite 6 langues, verrou pro
│   ├── memory.js              ← jeu de mémoire, traduit
│   ├── phonation.js           ← tenue vocale, traduit
│   ├── dashboard-ortho.js     ← espace ortho + limite patients + MFA + tarifs
│   ├── companion.js           ← Ami : compagnon animé + explications par exercice (COMPANION_PHRASES[lang].explain)
│   ├── caregiver.js           ← v6.35 : logique de la page aidant.html (login par code, rendu du tableau de bord)
│   ├── caregiver-tips.js      ← v6.35 : moteur de conseils du jour, règles explicites (pas de LLM), testé isolément
│   └── reminders-edge-function.md
├── audio/kab/README.md        ← comment ajouter de vrais enregistrements kabyles
├── docs/kabyle-completion-draft.md ← phrases kabyles sourcées, non intégrées
├── tests/
│   ├── learner.test.js            ← 17 tests moteur adaptatif
│   ├── i18n-completeness.test.js  ← cohérence des 8 langues
│   ├── pwa-check.test.js          ← cohérence manifest/service worker
│   ├── plan-and-mfa.test.js       ← 19 tests : gratuit/pro (+ interrupteur PAYWALL_ENABLED), MFA, paiement
│   ├── companion-explain.test.js  ← 83 tests : explications d'Ami (7 langues x 11 types) + animation d'arrivée
│   ├── caregiver.test.js          ← v6.35 : 15 tests (moteur de conseils + parcours complet aidant.html en DOM simulé)
│   └── patient-summary.test.js    ← v6.36 : 4 tests (mon-resume.html : code manquant/inconnu/valide, libellés d'exercices)
└── sql/schema.sql             ← RLS réelle, fonctions RPC (patient + ortho + aidant), colonnes plan/stripe_*/caregiver_code

npm install && npm test  →  doit afficher 7 suites, toutes ✅, avant toute livraison
```

## Comment tester rapidement

```bash
python3 -m http.server 8000
```
Ouvrir Chrome (obligatoire pour les exercices vocaux) sur `localhost:8000`.

**⚠️ Avant toute livraison touchant une langue, un exercice, le bilan,
Ami, l'espace aidant, le résumé imprimable, ou le mode hors-ligne** :
```bash
npm install && npm test
```
Doit afficher 7 suites toutes ✅ (17 + tests i18n/pwa + 19 + 83 + 15 + 4).
Sinon, lire le détail affiché avant de livrer quoi que ce soit. Et ne
pas oublier `CACHE_NAME` dans `sw.js` si un fichier JS/CSS a changé
(voir "Pièges techniques" plus haut) — et d'ajouter tout nouveau
fichier JS/CSS à `APP_SHELL` dans `sw.js`.

## Sources utilisées pour le vocabulaire kabyle (à réutiliser si besoin d'étendre)

- kabyle.com (dictionnaire, alphabet, exemples)
- Glosbe (fr.glosbe.com — très riche en phrases de corpus réelles)
- Encyclopédie berbère (journals.openedition.org/encyclopedieberbere)
- apprendrelekabyle.com — **contient de vrais enregistrements audio natifs**
  ("Voix Kabyle : Moh A.") ; piste non aboutie : contacter l'auteur pour
  obtenir l'autorisation d'utiliser/lier ces enregistrements plutôt que
  d'en refaire (résoudrait le problème du son en kabyle, qu'aucune
  synthèse vocale ne prend en charge).

## Prochaines pistes réelles (état au 7 juillet, après v6.35)

- **Configurer les vrais comptes Supabase + Stripe** — bloquant pour
  que l'espace ortho, l'espace aidant, et le paiement fonctionnent
  réellement (au lieu du mode navigateur local actuel).
- **Confirmation visuelle réelle** de la refonte visuelle (v6.25-v6.32),
  de l'animation d'Ami (v6.34), et de la toute nouvelle page
  `aidant.html` (v6.35) — demander à l'utilisateur un retour à jour si
  ce n'est pas déjà fait au moment de la reprise.
- **Espace aidant : traduction** (actuellement français uniquement) —
  à faire si l'utilisateur le demande, suivre le même schéma que les
  autres écrans (I18N, repli français, notice si partiel).
- **Espace aidant : plusieurs aidants par patient** — décision
  utilisateur du 7 juillet : pas pour l'instant, volontairement. Ne pas
  relancer sans nouvelle demande explicite.
- **Résumé imprimable patient : traduction** (v6.36, `mon-resume.html`,
  actuellement français uniquement) — à faire si demandé, même schéma
  que les autres écrans.
- Continuer le kabyle : compléter/valider `docs/kabyle-completion-draft.md`,
  étendre le vocabulaire, contacter apprendrelekabyle.com pour l'audio.
  Décision utilisateur : pas de kabyle pour `memory.js`/`phonation.js`/
  conversation guidée pour l'instant — ne pas relancer sans nouvelle
  demande explicite.
- Vérifier la performance sur de vieux téléphones Android (public cible
  probable : personnes âgées, matériel parfois ancien).
- Surveiller les limites du plan gratuit Supabase si l'usage grandit.
- Clarifier si `ORTHO_FREE_PATIENT_LIMIT` (limite de 3 patients gratuits
  côté espace ortho, `js/dashboard-ortho.js`) doit aussi être désactivée
  comme le paywall patient — pas demandé explicitement jusqu'ici.
- Décider si/quand réactiver le paywall (`PAYWALL_ENABLED` dans
  `js/app.js`) — repoussé "à plus tard" par l'utilisateur, pas annulé.

## Ton et méthode à garder

- Toujours vérifier une traduction/affirmation avant de la livrer plutôt
  que de deviner — l'utilisateur a lui-même fourni des sources utiles
  par le passé (liens Glosbe, YouTube, PDF de mémoires d'orthophonie) :
  les accueillir et les exploiter sérieusement.
- Quand l'utilisateur signale un souci avec une capture d'écran, d'abord
  vérifier si c'est un vrai bug avant de l'expliquer comme "normal" —
  plusieurs signalements se sont avérés être de vrais bugs.
- Pour tout chantier de l'ampleur de l'espace aidant (nouvel espace,
  nouveau modèle d'accès, nouvelles données exposées) : scoper avec
  l'utilisateur AVANT de coder (qui voit quoi, combien d'aidants,
  quelles données) — c'est ce qui a été fait en v6.35, à reproduire
  pour tout chantier comparable.
- Toujours repackager et livrer un zip à jour après chaque changement,
  après avoir validé (syntax check JS, `npm test`, équilibre des
  balises HTML) — et vérifié `CACHE_NAME` dans `sw.js`.
