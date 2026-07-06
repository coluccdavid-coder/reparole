---
name: reparole-pro-v6
description: Reprise du projet ReParole Pro (v6.24) — application web de rééducation orthophonique post-AVC, à mini prix, pour aider un maximum de personnes en attente d'un rendez-vous avec un·e orthophoniste. Contient l'historique des décisions, l'état d'avancement, les garde-fous établis et la structure des fichiers, pour reprendre le développement sans tout ré-expliquer.
---

# ReParole Pro — document de reprise (v6.24)

Ce fichier résume tout ce qu'il faut savoir pour continuer ce projet dans
une nouvelle conversation. Donnez-le à Claude en début de session, avec
le zip du projet (la version la plus récente livrée).

**⚠️ Session en cours au moment de la rédaction de ce fichier** — voir la
section "v6.24 — EN COURS" plus bas avant toute chose : plusieurs
fonctionnalités (double authentification notamment) sont écrites mais
pas encore vérifiées, et une action de l'utilisateur (créer un projet
Supabase) est attendue.

## Objectif du projet (à ne jamais perdre de vue)

Une application web **à mini prix**, pour aider **un maximum de personnes**
en rééducation du langage après un AVC, **pendant leur attente d'un vrai
rendez-vous** avec un·e orthophoniste. Ce n'est PAS un substitut à un
suivi professionnel — c'est un outil d'appui, à coût minimal, largement
accessible (hébergement à bas coût : site statique + paliers gratuits
Netlify/Supabase pour limiter les frais, pas nécessairement 0€ à terme).

**Nuance apparue en v6.24** : une structure gratuit/pro a été introduite
(voir plus bas) à la demande explicite de l'utilisateur. Garder à
l'esprit la tension avec l'objectif "aider un maximum de personnes" —
les seuils choisis (5 séances/jour gratuites, français toujours
gratuit) essaient de rester raisonnables, mais si une future demande
pousse à restreindre plus fortement l'accès gratuit, ça vaut la peine de
le signaler à l'utilisateur plutôt que d'exécuter sans recul.

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
- **v6.17** : le bilan initial (`js/assessment.js`) traduit en anglais —
  c'était le plus gros morceau non traduit restant. Domaines, questionnaire
  de ressenti, 9 items du bilan, tous les textes d'interface. Réutilise
  les clés I18N déjà existantes (`denom_prompt`, `completion_label`,
  `levelName()`) plutôt que de dupliquer. Vérifié par simulation DOM sur
  tout le parcours, fr et en. Kabyle inchangé (décision utilisateur :
  pas de kabyle sur memory.js/phonation.js pour l'instant ; le bilan
  kabyle reste dans son état partiel existant, dénomination seulement).
  **Reste en français quelle que soit la langue** : uniquement
  `js/conversation.js` maintenant (scénarios de dialogue entiers).
- **v6.18** : menu déroulant de langue (remplace les boutons) + 5
  nouvelles langues niveau "interface complète" : espagnol, italien,
  portugais, allemand, arabe (RTL déjà géré par le mécanisme existant,
  rendu visuel réel pas encore confirmé). Même limite que l'anglais à
  ses débuts : contenu des exercices et bilan initial pas encore
  traduits dans ces 5 langues (repli français automatique, sans mélange
  silencieux). Décision utilisateur explicite sur le choix des langues :
  un seul "English" (pas de distinction US/UK), et portugais + allemand
  plutôt que turc/roumain (pertinence pour les populations immigrées en
  France). Prochaine étape logique si demandée : les banques d'exercices
  et `assessment.js` par langue, une à la fois comme pour l'anglais —
  ne pas tenter de faire les 5 d'un coup, le volume devient ingérable.
- **v6.19** : ES/IT/PT/DE/AR passent au niveau "complet" (exercices +
  bilan initial), suite à demande explicite de l'utilisateur. Nouveaux
  fichiers `js/exercises-{es,it,pt,de,ar}.js` (même structure que
  `-en.js`). `js/assessment.js` généralisé (`domainLabel()`,
  `symptomQuestions()`, `assessItems()` cherchent désormais
  `ASSESS_*_XX` dynamiquement au lieu d'anglais codé en dur). Vérifié
  par simulation DOM : bilan complet + lancement d'exercice, 5 langues.
  Kabyle non touché (état existant conservé, décision précédente de
  l'utilisateur de ne pas y toucher pour l'instant).
- **v6.20** : vrai bug trouvé via capture (mode arabe) — `const X = ...`
  ne s'attache JAMAIS à `window`, contrairement à `window.X = ...`.
  `domainLabel()`/`symptomQuestions()`/`assessItems()` faisaient des
  recherches `window['...']` sur des tables déclarées en `const` →
  toujours `undefined` → repli silencieux sur le français, pour les 5
  langues (ES/IT/PT/DE/AR), pas seulement l'arabe. Corrigé en passant
  ces déclarations en `window.X = ...` (même pattern que `window.BANK_XX`
  qui fonctionnait déjà correctement). Deuxième correctif : compteurs
  "1/4" affichés inversés en RTL (bidi du navigateur) — `dir="ltr"`
  forcé sur ces éléments spécifiquement. **Point de vigilance pour la
  suite** : si une future table de traduction est ajoutée et accédée via
  `window['NOM_'+lang]`, il FAUT la déclarer en `window.NOM_XX = ...`,
  jamais en `const`/`let`, sous peine de reproduire ce bug silencieusement.
- **v6.21** : filet de sécurité automatique — `tests/i18n-completeness.test.js`
  (+ `package.json` pour `npm install && npm test`). Vérifie la
  cohérence de toutes les traductions et, surtout, que les tables
  dynamiques par langue sont de vraies propriétés `window.X` (pas des
  `const` orphelins — le bug v6.20). Testé pour de vrai : bug
  réintroduit volontairement, détecté correctement, confirmé réparé
  après correction. Bonus : `I18N_STRINGS`/`ASSESS_STRINGS` avaient la
  même fragilité latente (jamais exposés sur `window`), corrigé par
  précaution avant que ça ne devienne un vrai bug.
- **v6.21.1** : en faisant la démonstration du filet de sécurité à
  l'utilisateur, un angle mort a été trouvé dans le script lui-même —
  un tableau vide `[]` est "présent" en JavaScript (donc pas détecté
  comme manquant), alors qu'il ne contient aucun exercice. Corrigé pour
  vérifier `.length`, pas juste l'existence. Retesté avec le même
  scénario simulé : détecté correctement cette fois, puis confirmé
  réparé après restauration.
- **v6.22** : conversation guidée (`js/conversation.js`) traduite en
  EN/ES/IT/PT/DE/AR — dernier gros morceau de contenu non traduit.
  Kabyle non concerné (même règle que le reste : dialogue entier, pas
  de vocabulaire isolé). Corrigé au passage : reconnaissance vocale
  restée en `fr-FR` codé en dur (oubli du passage multilingue), et
  notice "conversation non traduite" qui s'affichait pour toutes les
  langues non-fr au lieu de seulement le kabyle. **Le filet de sécurité
  a servi dès sa première utilisation réelle** : a détecté les clés
  `conv_*` manquantes en portugais, corrigé avant livraison plutôt
  qu'après.
- **v6.23** : PWA — `manifest.json`, `sw.js`, `icons/` (générées,
  cohérentes avec le logo existant). Mode hors-ligne complet pour le
  mode navigateur (localStorage), interface seulement pour le mode
  cloud (connexion toujours nécessaire pour se connecter/sauvegarder).
  Nouveau test `tests/pwa-check.test.js` ajouté au filet de sécurité —
  vérifie que tout fichier chargé par `index.html` est bien dans le
  cache hors-ligne, testé pour de vrai (fichier oublié simulé, détecté
  correctement). **Non testé sur un vrai appareil** — pas d'accès à un
  navigateur graphique dans cet environnement. Voir HEBERGEMENT.md pour
  la marche à suivre de test réel (Android/iPhone). Penser à incrémenter
  `CACHE_NAME` dans `sw.js` à chaque future mise à jour notable.

## Les 3 étapes demandées le 5 juillet sont terminées
1. ✅ Filet de sécurité automatique (v6.21, v6.21.1)
2. ✅ Conversation guidée traduite en 6 langues (v6.22)
3. ✅ PWA / mode hors-ligne (v6.23)

Chaque étape a été vérifiée avant de passer à la suivante, comme
demandé. Le filet de sécurité (étape 1) a été utile dès l'étape 2 —
preuve que l'ordre choisi (sécurité d'abord) était le bon.

## v6.24 — EN COURS au moment de la reprise (5 juillet, fin de session)

Demande de l'utilisateur : (1) mettre en place le vrai mode cloud
Supabase (l'espace orthophoniste en a besoin, actuellement non
configuré), (2) une structure gratuit/pro avec un mélange de limites
(séances/jour, nombre de patients suivis, exercices/langues réservés),
(3) un compte test avec mot de passe renforcé et double authentification
(TOTP, type Google Authenticator).

**Précision obtenue de l'utilisateur** : pas de vrai système de paiement
pour l'instant — juste la structure gratuit/pro, activation manuelle en
attendant (voir `sql/schema.sql`, section v6.24, pour la commande SQL).

### Ce qui est fait ET vérifié par simulation (fiable)
- **Structure gratuit/pro côté patient** (`js/app.js`) : constantes
  `FREE_DAILY_SESSION_LIMIT` (5/jour), `FREE_LANGS` (français
  seulement), `PRO_ONLY_TYPES` (repetition, denomination_orale,
  fluence, intonation, conversation guidée). Fonctions `isPro()`,
  `lockReason(type)`, `showUpsell(reason)`. Câblé dans
  `startExercise()`, `Memory.start()`, `Phonation.intro()`,
  `Conversation.start()`. **Testé avec 6 scénarios réels** (compte
  gratuit/pro × langue × type × quota) — tous corrects. Voir le détail
  dans les logs de cette session si besoin de les rejouer.
- **Colonne `plan`** ajoutée aux tables `patients` et `orthophonists`
  dans `sql/schema.sql` (`'free'` par défaut, avec migration `alter
  table ... add column if not exists` pour une base déjà existante).
- **Traductions `upsell_*`** ajoutées dans les 7 langues (fr + 6),
  vérifiées par le filet de sécurité (`npm test` vert).

### Ce qui est fait ET maintenant vérifié par simulation (v6.24, suite)
- **`tests/ortho-security.test.js`** (nouveau, intégré à `npm test`) :
  faux client Supabase simulé (`window.supabase.createClient` mocké,
  imitant l'API MFA documentée : `signUp`, `signInWithPassword`,
  `auth.mfa.{enroll,challenge,verify,listFactors,unenroll}`,
  `getAuthenticatorAssuranceLevel`, `from().upsert()/maybeSingle()`).
  Trois choses vérifiées bout en bout :
  - **Mot de passe renforcé** (`OrthoApp._checkPasswordStrength()`) :
    les 4 règles (longueur, minuscule, majuscule, chiffre) testées dans
    les deux sens.
  - **Limite de patients côté orthophoniste** (`ORTHO_FREE_PATIENT_LIMIT
    = 3`) : bloque à 3/3 en gratuit, débloqué en `pro`, message affiché.
  - **Double authentification TOTP complète** : inscription → connexion
    sans MFA (pas encore activée) → activation via `OrthoApp` (mauvais
    code refusé, bon code accepté) → reconnexion avec défi MFA exigé
    (`mfaRequired`, `factorId`, `challengeId`) → code invalide refusé,
    code valide termine la connexion → désactivation via `disableMfa()`
    → plus de défi à la reconnexion suivante.
  - **Bug du test précédent corrigé** : ce n'était pas seulement
    `dom.window.Store` (inexistant) vs `dom.window.ReParoleStore` (le
    bon nom, `js/storage.js` : `window.ReParoleStore = ReParoleStore;`).
    Plus largement : une variable `let`/`const` déclarée dans un
    `eval()` (donc dans `js/dashboard-ortho.js`, ex. `patients`,
    `orthoPlan`) n'est PAS modifiable depuis un `eval()` séparé lancé
    ensuite dans le test — une simple affectation `patients = ...` y
    crée une variable globale à part, invisible du code de l'app. Le
    test passe donc par de vraies fonctions de l'app (`refreshList()`,
    `signIn()` après avoir muté le faux compte serveur) plutôt que par
    des affectations directes. **Point de vigilance pour tout futur
    test similaire** sur une variable de portée module de
    `dashboard-ortho.js`.
  - **Reste indispensable avant de livrer cette fonctionnalité comme
    "terminée" pour de vrai** : un test manuel avec un vrai compte
    Supabase et une vraie application TOTP (Google Authenticator etc.),
    la simulation ne remplace pas ça — voir section suivante.

### Ce qui attend l'utilisateur (bloquant, hors de ma portée)
- ✅ **Projet Supabase créé** (`bwxlshedzpfaeszwktdx`, région eu-west-1).
- ✅ **`sql/schema.sql` exécuté** avec succès (confirmé par capture du
  SQL Editor : "Success. No rows returned").
- ✅ **`SUPABASE_URL` et `SUPABASE_ANON_KEY` renseignées** dans
  `js/storage.js` (v6.25). Point notable : ce projet utilise le nouveau
  système de clés Supabase (`sb_publishable_...`), pas l'ancienne "anon
  key" JWT — voir le commentaire dans `js/storage.js` pour le détail.
  `CLOUD_ENABLED` vaut donc maintenant `true` en usage réel.
- **Reste à faire par l'utilisateur** : créer le **compte test** demandé
  (email + mot de passe renforcé via le formulaire "Créer un compte" de
  l'espace ortho), puis activer sa double authentification via la
  nouvelle carte "Sécurité du compte", et vérifier que la connexion
  fonctionne vraiment de bout en bout (le mode cloud n'a encore jamais
  été testé avec un vrai projet, seulement simulé — voir
  `tests/ortho-security.test.js`).

### Point de vigilance pour la suite
Le piège récurrent de cette session (`const X` déclaré dans un fichier
n'est PAS automatiquement accessible via `window.X` depuis un autre
contexte, même si "ça a l'air d'être la même page") s'est reproduit une
fois de plus, cette fois dans mon propre test, pas dans le code livré.
**Toujours vérifier le nom réellement exposé sur `window` avant d'écrire
un test** (`grep -n "window\." fichier.js` est le réflexe à avoir).

**⚠️ IMPORTANT pour toute session future** : avant de livrer une
modification touchant à une langue, aux exercices, ou au bilan, lancer
`npm install && npm test` et vérifier que le filet de sécurité est vert.
Ne pas se contenter de vérifications manuelles au cas par cas comme lors
des sessions précédentes — c'est exactement ce qui a laissé passer le
bug v6.20 plusieurs fois de suite.

## v6.25 — bug de langue confirmé + première étape Supabase (6 juillet)

- **Vrai bug confirmé par capture** : en changeant de langue (arabe →
  français) DEPUIS le tableau de bord, les libellés statiques
  (`data-i18n`) repassaient bien en français, mais l'accueil ("Bonjour
  Marie"), le nom du niveau, le message d'Ami et l'encadré "Votre
  assistant a appris" restaient figés dans l'ancienne langue — ces
  éléments sont écrits directement en JS par `renderDashboard()`
  (js/app.js), jamais recalculés par `I18N.apply()` qui ne touche que le
  DOM marqué `data-i18n`. Corrigé via un hook optionnel
  `onLangChange()` (js/app.js), appelé par `Prefs.apply()` (js/prefs.js)
  après avoir appliqué la nouvelle langue : si le tableau de bord est
  l'écran actif, il est entièrement re-rendu. Nouveau test
  `tests/lang-switch-dashboard.test.js` (ajouté à `npm test`) : connexion
  en arabe, changement vers le français, retour à l'arabe — vérifie que
  l'accueil, le nom du niveau et le message d'Ami suivent réellement.
  **Point de vigilance pour la suite** : ce même problème pourrait
  exister sur d'autres écrans si un futur sélecteur de langue y est
  ajouté (actuellement, il n'existe que sur l'écran de connexion et le
  tableau de bord — voir `data-lang-switcher` dans `index.html`) ; si un
  écran d'exercice/conversation en gagne un un jour, il faudra étendre
  `onLangChange()` en conséquence.
- **Vérification étendue aux 8 langues**, suite à une question directe
  de l'utilisateur ("tu as vérifié avec les autres langues ?") : le
  test initial ne couvrait que arabe↔français (seul couple signalé par
  capture). Ajout d'une boucle sur les 8 langues du sélecteur (fr, en,
  es, it, pt, de, ar, kab) dans `tests/lang-switch-dashboard.test.js`,
  y compris le cas particulier du kabyle (accueil traduit "Azul", mais
  nom de niveau qui retombe sur le français — repli documenté de
  `I18N.t()` pour cette langue volontairement incomplète, pas un bug).
  Les 8 passent. **Leçon à retenir pour la suite** : après un correctif
  sur un cas précis signalé par l'utilisateur, généraliser la
  vérification à tous les cas équivalents AVANT de considérer que
  c'est fini — ne pas attendre qu'il ait à le redemander.
- **Mode cloud Supabase configuré (bout technique)** : `SUPABASE_URL`
  (`https://bwxlshedzpfaeszwktdx.supabase.co`) et `SUPABASE_ANON_KEY`
  renseignées dans `js/storage.js`. `sql/schema.sql` confirmé exécuté
  avec succès sur ce projet ("Success. No rows returned", capture SQL
  Editor). **Point notable découvert en cours de route** : ce projet
  utilise le nouveau système de clés Supabase — plus d'ancienne "anon
  key" (JWT `eyJ...`), remplacée par une "Publishable key"
  (`sb_publishable_...`), avec en face une "Secret key"
  (`sb_secret_...`) qui remplace `service_role`. Compatible tel quel
  avec `createClient()` (confirmé par la doc Supabase, aucun changement
  de code nécessaire), donc la clé publishable a été mise directement
  dans `SUPABASE_ANON_KEY` — le nom de la constante n'a pas été renommé
  pour rester cohérent avec le reste du fichier, mais le commentaire
  au-dessus explique le changement de terminologie. **Vigilance** :
  l'utilisateur a d'abord collé par erreur la clé *secrète* — jamais
  utilisée, mais je lui ai conseillé de la régénérer par précaution
  puisqu'elle avait transité en clair dans la conversation ; à vérifier
  qu'il l'a bien fait avant de considérer ce point clos.
  `CLOUD_ENABLED` vaut donc maintenant `true`. **Aucun test réel
  effectué avec ce projet** (seulement la simulation de
  `tests/ortho-security.test.js`, mise à jour pour forcer un mode local
  dans ses propres tests même si les vraies clés sont maintenant
  présentes dans le fichier). Reste à créer le compte test et vérifier
  en vrai le flux MFA (voir section v6.24 ci-dessus, toujours valable).

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
- **Décision utilisateur (même session)** : pas de traduction kabyle pour
  `memory.js`/`phonation.js` pour l'instant (pas prioritaire) — un mot
  sourcé isolé ("ales" = recommencer, confirmé Glosbe + dictionnaire-
  kabyle.com) ne suffisait pas à couvrir ces écrans, essentiellement
  faits de phrases entières. Ne pas relancer ce chantier sans nouvelle
  demande explicite de l'utilisateur.

## v6.25 (suite) — le correctif ne s'appliquait pas en pratique : CACHE_NAME oublié

**Symptôme signalé par capture** : après avoir livré et testé le
correctif du bug de langue ci-dessus, l'utilisateur a testé sur le vrai
site et le bug persistait à l'identique. Le correctif était pourtant
bien dans le zip livré, et le filet de sécurité était vert.

**Cause réelle** : `sw.js` contient un avertissement explicite en tête
de fichier — toute modification de `js/app.js`, `js/prefs.js`,
`js/storage.js` etc. doit s'accompagner d'un incrément de `CACHE_NAME`,
sans quoi les navigateurs qui ont déjà visité l'app continuent de
servir les anciens fichiers depuis le cache hors-ligne (PWA, `sw.js`).
`CACHE_NAME` était resté à `'reparole-v6-23'` alors que `js/app.js`,
`js/prefs.js` et `js/storage.js` avaient été modifiés en v6.24 et
v6.25 — l'avertissement a été raté deux livraisons de suite.
**Corrigé** : `CACHE_NAME` passé à `'reparole-v6-25'`.

**Garde-fou ajouté pour ne pas perdre encore du temps sur ce piège** :
nouveau `tests/sw-cache-version.test.js` (ajouté à `npm test`), qui
calcule une empreinte du contenu réel des fichiers listés dans
`APP_SHELL` (sw.js) et la compare à une référence enregistrée dans
`tests/.sw-fingerprint.json` (fichier à conserver dans le zip livré —
il fait partie du filet de sécurité, pas un fichier temporaire). Si le
contenu a changé sans que `CACHE_NAME` ait été incrémenté, le test
échoue avec un message explicite. Si `CACHE_NAME` a été incrémenté, la
référence se met à jour automatiquement et le test passe.

**⚠️ Pour toute session future** : si `npm test` échoue précisément sur
`tests/sw-cache-version.test.js`, ne PAS contourner le test — incrémenter
`CACHE_NAME` dans `sw.js`, relancer les tests (la référence se met à
jour toute seule), puis livrer.

## v6.25 (suite) — 3 textes en dur trouvés côté "Vos photos" (6 juillet)

**Signalé par capture** (italien et anglais) : la carte "Vos photos" du
tableau de bord se traduisait bien pour son titre et sa description,
mais le message affiché quand il n'y a pas encore de photo restait
figé en français, avec un rendu bizarre (mot par mot, ligne par ligne)
qui a d'abord semblé être un doublon de texte.

**Cause réelle** : `renderMedia()` (`js/app.js`) construit ce message
directement en JS, en français en dur, jamais passé par `I18N.t()` — le
même problème de fond que le bug du tableau de bord, mais à un endroit
différent (pas détecté par le correctif précédent puisque c'est un
texte différent, pas la même variable). En creusant plus loin dans le
même fichier (l'utilisateur avait signalé ne pas encore avoir vérifié
"côté exercice"), 2 `alert()` liées aux photos avaient le même problème :
"Choisissez une photo et donnez-lui un nom..." et "Ajoutez d'abord une
photo...".

**Corrigé** : 3 nouvelles clés ajoutées à `js/i18n.js` dans les 7
langues à support complet (`photos_empty`, `btn_delete`,
`alert_choose_photo`, `alert_add_photo_first` — kab reste volontairement
en repli français comme le reste de ses clés manquantes), et
`js/app.js` mis à jour pour utiliser `I18N.t()` à ces 3 endroits au lieu
du texte en dur. Comme `renderMedia()` fait déjà partie de
`renderDashboard()`, le hook `onLangChange()` de la session précédente
la rafraîchit automatiquement — aucun changement structurel
supplémentaire nécessaire, seulement remplacer le texte en dur.
`tests/lang-switch-dashboard.test.js` étendu pour vérifier le message
d'état vide des photos dans les 8 langues (avec le même repli kab
documenté que pour `level_1`). **`CACHE_NAME` incrémenté à
`'reparole-v6-26'`** — le nouveau garde-fou `sw-cache-version.test.js`
a immédiatement détecté l'oubli quand j'ai testé, preuve qu'il sert à
quelque chose.

**Point de vigilance pour la suite** : cette classe de bug (texte en
dur dans du contenu généré en JS, jamais repéré par
`i18n-completeness.test.js` puisque ce test ne regarde que
`I18N_STRINGS`, pas le code qui les utilise) peut probablement exister
ailleurs — dans `conversation.js`, `memory.js`, `phonation.js`,
`assessment.js` (celui-ci reste en partie volontairement français,
voir `symptoms_note`), pas encore audités systématiquement pour ce
piège précis. Une recherche ciblée (`grep` des mots français courants
dans les template strings JS) a été faite une fois pour `js/app.js` et
ses voisins directs, mais pas de façon exhaustive sur tout le code.

## v6.25 (suite) — audit large demandé par l'utilisateur ("fait un passage plus large")

Passage systématique sur tout `js/` à la recherche du même piège
(texte en dur bypassant `I18N.t()`), fichier par fichier :

- **`js/conversation.js`, `js/memory.js`, `js/phonation.js`,
  `js/learner.js`, `js/storage.js`** : rien trouvé, déjà propres.
- **`js/companion.js`** : rien à corriger — chaque langue a son propre
  bloc de phrases (`COMPANION_PHRASES`), c'est la structure normale,
  pas un texte en dur oublié.
- **`js/assessment.js`** : rien à corriger — `ASSESS_STRINGS` a déjà
  ses 8 blocs de langue, déjà vérifiés par
  `tests/i18n-completeness.test.js` (qui passait déjà avant cet audit).
  Les questions du bilan lui-même (`ASSESS_ITEMS`) restent
  volontairement en français pour l'instant — c'est documenté et
  assumé (`symptoms_note`), pas un oubli.
- **`js/dashboard-ortho.js`** : plein de texte français en dur, mais
  **volontairement** — cette page ne charge même pas `js/i18n.js`
  (vérifié), l'espace orthophoniste n'a jamais été prévu multilingue.
  Pas un bug, hors périmètre par conception.
- **`js/charts.js`** : **2 vrais bugs trouvés**. `successLine()` et
  `barRows()` (cette dernière pas encore appelée nulle part dans le
  code actuel, mais corrigée par cohérence) affichaient un message
  français en dur. Piège particulier ici : ce fichier est utilisé à la
  fois par `index.html` (patient, multilingue) ET
  `dashboard-ortho.html` (ortho, français uniquement, qui ne charge pas
  `i18n.js`) — la correction utilise donc un repli explicite
  (`I18N.t()` si disponible, sinon le texte français d'origine) plutôt
  que d'appeler `I18N.t()` sans condition, ce qui aurait cassé le côté
  ortho (`I18N is not defined`).
- **`js/app.js`** : **1 bug de plus trouvé**, différent des 3 déjà
  corrigés plus tôt dans la session — l'alerte "Saisissez votre code de
  suivi..." affichée sur l'écran de connexion quand le champ est vide,
  elle aussi en dur en français.

**Corrigé** : nouvelles clés `chart_no_data_yet`, `chart_no_data`,
`chart_success_aria`, `alert_enter_code` ajoutées dans les 7 langues à
support complet. `tests/lang-switch-dashboard.test.js` étendu avec un
nouveau test qui vérifie ces 2 derniers points dans plusieurs langues
(alerte de connexion + message du graphique). **`CACHE_NAME` incrémenté
à `'reparole-v6-27'`.**

**Bilan de cette classe de bug** : 6 occurrences trouvées et corrigées
au total dans cette session (1 dans le tableau de bord lui-même,
détecté par capture ; 3 côté "Vos photos", détectées par capture ; 2
trouvées par cet audit systématique). Tout `js/` a maintenant été
passé en revue au moins une fois pour ce piège précis. Aucune garantie
absolue qu'il n'en reste pas (un audit par grep de mots-clés n'est pas
exhaustif à 100%), mais la couverture est maintenant large plutôt que
réactive au coup par coup.

## v6.26 — l'espace ortho devient multilingue + changement de police (6 juillet)

**Décision explicite de l'utilisateur, qui change un choix de scope
précédent** : jusqu'ici, `dashboard-ortho.html`/`js/dashboard-ortho.js`
étaient volontairement français uniquement (voir note v6.25 ci-dessus).
L'utilisateur a explicitement demandé de changer ça : l'objectif du
projet est une app utilisable dans tous les pays à coût abordable, donc
rien ne garantit qu'un orthophoniste (ou un aidant qui l'utiliserait)
soit francophone. **Ce n'était donc pas un bug à laisser de côté, mais
un vrai manque fonctionnel** — bien noté pour ne pas revenir en arrière
par erreur dans une session future.

- **Police des titres** : `Fraunces` remplacée par `Playfair Display`
  partout (`css/style.css`, `css/companion.css`, `css/ortho.css`) — la
  personne n'aimait pas le rendu du "J" de Fraunces. Comparaison faite
  via l'outil de visualisation avant de choisir.
- **Espace ortho traduit dans les 7 langues à support complet** (fr, en,
  es, it, pt, de, ar — kab exclu, comme le reste du site, support
  volontairement partiel) :
  - `dashboard-ortho.html` : ~50 textes statiques convertis en
    `data-i18n`/`data-i18n-placeholder`, + un sélecteur de langue
    (`data-lang-switcher`) ajouté sur l'écran de connexion ET sur le
    tableau de bord (`ortho-list`), + chargement de `js/prefs.js` et
    `js/i18n.js` (qui n'étaient pas chargés du tout avant).
  - `js/dashboard-ortho.js` : ~40 textes dynamiques (messages d'erreur,
    statut MFA, liste de patients, détail patient, tendance, rapports...)
    convertis en `I18N.t()`. Les noms de niveaux (`LEVEL_NAMES` figé en
    français) réutilisent maintenant les clés `level_1/2/3` déjà
    traduites côté patient, plutôt que de dupliquer la traduction. Les
    dates (`toLocaleDateString('fr-FR')` en dur) utilisent maintenant
    `I18N.speechLocale()` (repli sur `'fr-FR'` si absent, ex. kab).
  - Les libellés du "Profil clinique" (Type Broca, Wernicke...) dans
    `js/learner.js` (`CLINICAL_PROFILES`) sont aussi traduits (nouvelles
    clés `cp_broca`, `cp_wernicke`, etc.), avec repli sur le `label`
    français d'origine si `I18N` n'est pas chargé (garde une
    compatibilité si ce fichier est réutilisé ailleurs un jour).
  - **~70 nouvelles clés i18n au total.** Certaines sont des fonctions
    (comme le `session_result` déjà existant) pour les messages avec
    variables (ex. `ortho_limit_msg(n)`, `ortho_assign_success(name)`,
    `trend_up(pct)`) — rappel : `I18N.t('cle', arg1, arg2)` appelle
    directement la fonction avec ces arguments, pas besoin de refaire
    `I18N.t('cle')(arg1)`.
  - **Même hook `onLangChange()` que côté patient** (v6.25), adapté ici :
    si l'écran actif est `ortho-list`, re-appelle `refreshList()` et
    `refreshMfaStatus()` ; si c'est `ortho-detail`, rappelle
    `openPatient()` sur le patient actuellement affiché. Sans ça, on
    aurait eu exactement le même bug que côté patient (contenu
    dynamique figé dans l'ancienne langue après changement).
  - `js/charts.js` n'a plus besoin d'un repli `I18N si disponible` —
    l'espace ortho charge maintenant `i18n.js` aussi, donc `I18N` est
    toujours défini des deux côtés. Le code du repli a été laissé tel
    quel (inoffensif, et protège contre un chargement partiel futur).
- **Nouveau test `tests/ortho-i18n.test.js`** (ajouté à `npm test`) :
  vérifie que les écrans statiques ET le contenu dynamique (liste de
  patients, statut MFA) suivent bien la langue, y compris DEPUIS le
  tableau de bord ortho lui-même (comme pour le bug patient de la
  v6.25 — c'est exactement le genre de régression que ce test doit
  attraper si quelqu'un oublie le hook `onLangChange` à l'avenir).
- **`CACHE_NAME` incrémenté à `'reparole-v6-28'`.**

**Ce qui n'a PAS été fait, à signaler si ça devient un problème** :
- Le kabyle reste absent de l'espace ortho (comme convenu implicitement
  par cohérence avec le reste du site — support volontairement
  partiel), mais personne n'a demandé explicitement si c'était le bon
  choix pour CETTE partie précise de l'app (public professionnel plutôt
  que patient). À reconfirmer si besoin.
- Les traductions ont été écrites par moi (Claude) sans relecture par un
  locuteur natif de chaque langue — correctes à ma connaissance, mais
  une relecture humaine reste recommandée avant un usage professionnel
  à grande échelle, en particulier pour l'arabe et l'allemand (compte
  tenu du vocabulaire clinique spécifique : "Type Broca", "aphasie
  globale", etc.).
- Les emails que Supabase Auth envoie lui-même (confirmation de compte,
  réinitialisation de mot de passe) ne sont PAS couverts par ce
  changement — ils suivent la configuration de langue du projet
  Supabase lui-même (Authentication > Email Templates), pas
  `js/i18n.js`. Hors de portée du code de l'app.

## v6.27 — deux améliorations demandées par l'utilisateur (6 juillet)

Suite au récapitulatif du projet, l'utilisateur a choisi de coder les
deux améliorations suivantes (les autres pistes de la liste demandent
une action humaine/externe — relecture native, test sur un vrai
appareil, validation clinique, hébergement HDS, avis juridique — pas du
code) :

1. **Message d'accueil** : bandeau sur l'écran de connexion
   (`home_disclaimer`, traduit dans les 7 langues à support complet)
   rappelant que l'app aide à patienter, sans remplacer le rendez-vous
   avec l'orthophoniste.
2. **Résumé imprimable côté PATIENT** (`patient-report.html`, nouveau
   fichier) : version simplifiée et multilingue du rapport, à imprimer
   et apporter au premier vrai rendez-vous. Volontairement différente de
   `report.html` (réservé à l'orthophoniste, resté français uniquement) :
   pas d'analyse d'erreurs par catégorie (lecture professionnelle), juste
   séances/réussite/niveau/tendance + un rappel que ce n'est pas un
   diagnostic. Accessible via un nouveau bouton sur le tableau de bord
   (`printSummary()` dans `js/app.js`), ouvre `patient-report.html?code=...`
   dans un nouvel onglet. A son propre `onLangChange()` (même mécanisme
   que le tableau de bord patient/ortho) pour éviter de reproduire le bug
   v6.25 si la langue change depuis cette page. Ajouté à `sw.js`
   (fonctionne hors-ligne comme le reste de l'app en mode navigateur).

**Bug trouvé en passant (pas demandé, corrigé quand même)** : la note de
tendance du tableau de bord patient (`trend-note`, `js/app.js`) était en
dur en français, alors que les clés `trend_up`/`trend_down`/
`trend_stable`/`ortho_no_trend_data` existaient déjà dans les 7 langues
(créées pour l'espace ortho en v6.26) — jamais réutilisées côté patient.
Trouvé en construisant `patient-report.html`, qui réutilise ces mêmes
clés. Corrigé pour utiliser `I18N.t()` comme le reste de l'app.

**Nouveau test** `tests/patient-report.test.js` (ajouté à `npm test`) :
rendu FR par défaut, retraduction en changeant de langue depuis cette
page, RTL + bouton d'impression traduit en arabe, gestion des cas
`?code=` manquant ou inconnu. **`CACHE_NAME` incrémenté à
`'reparole-v6-29'`** (nouveau fichier `patient-report.html` + fix dans
`js/app.js`).

**Non fait / hors de portée, comme pour tout le reste de l'i18n** :
traductions de `home_disclaimer` et des nouvelles clés du résumé pas
relues par un locuteur natif (même limite que le reste, voir plus haut) ;
kabyle non concerné (nouvelles clés absentes de son bloc, repli
automatique sur le français comme convenu).

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

## Structure des fichiers (v6.24)

```
reparole-v6/
├── index.html                 ← app patient (dashboard, exercices, PWA)
├── dashboard-ortho.html       ← espace ortho (auth réelle + MFA)
├── report.html                ← rapport imprimable (orthophoniste, français uniquement)
├── patient-report.html        ← v6.27 : résumé imprimable côté PATIENT (multilingue, simplifié)
├── manifest.json              ← v6.23 : PWA (nom, icônes, couleurs)
├── sw.js                      ← v6.23 : service worker (mode hors-ligne)
├── icons/                     ← v6.23 : icônes PWA générées (192/512/apple-touch)
├── package.json               ← v6.21 : dépendance jsdom pour les tests
├── README.md                  ← historique détaillé de TOUTES les versions
├── RGPD.md, HEBERGEMENT.md    ← conformité + section PWA hors-ligne (v6.23)
├── bilan-exemple.txt          ← exemple de fichier pour tester l'import bilan
├── css/{style.css, ortho.css, companion.css}
├── js/
│   ├── prefs.js               ← préférences (dyslexie, langue, menu déroulant v6.18)
│   ├── i18n.js                ← I18N_STRINGS pour fr/en/es/it/pt/de/ar/kab, LANGUAGES
│   ├── exercises.js           ← BANK (français), + BANK_EXTEND()
│   ├── exercises-{en,es,it,pt,de,ar}.js ← v6.9/v6.19 : BANK_XX, niveau complet
│   ├── exercises-kab.js       ← BANK_KAB (kabyle, vocabulaire sourcé uniquement)
│   ├── storage.js             ← navigateur OU Supabase + MFA (v6.24, non testé en vrai)
│   ├── learner.js             ← IA adaptative + analyse d'erreurs + tests
│   ├── charts.js              ← SVG maison, zéro dépendance
│   ├── assessment.js          ← bilan initial, traduit fr/en/es/it/pt/de/ar (v6.17/v6.19)
│   ├── app.js                 ← moteur d'exercices + structure gratuit/pro (v6.24)
│   ├── conversation.js        ← conversation guidée, traduite 6 langues (v6.22)
│   ├── memory.js              ← jeu de mémoire, traduit (v6.16), verrou gratuit/pro (v6.24)
│   ├── phonation.js           ← tenue vocale, traduit (v6.16), verrou gratuit/pro (v6.24)
│   ├── dashboard-ortho.js     ← espace ortho + limite patients + MFA (v6.24, non testé)
│   ├── companion.js           ← Ami, compagnon animé (phrases scriptées, pas de LLM)
│   └── reminders-edge-function.md
├── audio/kab/README.md        ← comment ajouter de vrais enregistrements kabyles
├── docs/kabyle-completion-draft.md ← phrases kabyles sourcées, non intégrées
├── tests/
│   ├── learner.test.js            ← 17 tests moteur adaptatif
│   ├── i18n-completeness.test.js  ← v6.21 : cohérence des 8 langues (voir garde-fous)
│   ├── pwa-check.test.js          ← v6.23 : cohérence manifest/service worker
│   ├── sw-cache-version.test.js   ← v6.25 : détecte un CACHE_NAME oublié
│   ├── .sw-fingerprint.json       ← référence utilisée par le test ci-dessus (à conserver, versionné)
│   ├── ortho-security.test.js     ← v6.24 : mot de passe, limite patients, MFA
│   ├── ortho-i18n.test.js         ← v6.26 : espace ortho multilingue (statique + dynamique)
│   ├── lang-switch-dashboard.test.js ← v6.25 : contenu dynamique du tableau de bord vs changement de langue
│   └── patient-report.test.js     ← v6.27 : résumé imprimable côté patient (i18n, RTL, cas d'erreur)
└── sql/schema.sql             ← RLS réelle, fonctions RPC, colonne `plan` (v6.24)
```

## Comment tester rapidement

```bash
python3 -m http.server 8000
```
Ouvrir Chrome (obligatoire pour les exercices vocaux) sur `localhost:8000`.

**⚠️ Avant toute livraison touchant une langue, un exercice, le bilan,
ou le mode hors-ligne** :
```bash
npm install && npm test
```
Doit afficher "17 test(s) réussi(s)" (`learner.test.js`), un
"✅ Aucun problème détecté" (i18n), un autre (PWA), un autre
(`sw-cache-version.test.js`, ajouté en v6.25 — voir plus haut pourquoi
c'est important), "13 test(s) réussi(s)" + un "✅" (`ortho-security`),
"7 test(s) réussi(s)" + un "✅" (`ortho-i18n`, ajouté en v6.26),
"8 test(s) réussi(s)" + un "✅" (`lang-switch-dashboard`), puis
"5 test(s) réussi(s)" + un dernier "✅" (`patient-report`, ajouté en
v6.27). Sinon, lire le détail affiché avant de livrer quoi que ce soit.

Pour les tests du moteur adaptatif seul :
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

- ✅ Résumé imprimable côté PATIENT — fait en v6.27 (`patient-report.html`).
- ✅ Transformer le site en PWA installable — fait en v6.23.
- ✅ Message explicite dès l'accueil ("ceci aide à patienter...") — fait
  en v6.27 (`home_disclaimer`).
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
