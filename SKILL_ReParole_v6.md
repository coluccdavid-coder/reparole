---
name: reparole-pro-v6
description: Reprise du projet ReParole Pro (v6.34) — application web de rééducation orthophonique post-AVC, à mini prix, pour aider un maximum de personnes en attente d'un rendez-vous avec un·e orthophoniste. Contient l'historique des décisions, l'état d'avancement, les garde-fous établis et la structure des fichiers, pour reprendre le développement sans tout ré-expliquer.
---

# ReParole Pro — document de reprise (v6.34)

Ce fichier résume tout ce qu'il faut savoir pour continuer ce projet dans
une nouvelle conversation. Donnez-le à Claude en début de session, avec
le zip du projet (la version la plus récente livrée).

## ⚠️ À faire en priorité à la reprise

1. **Rien de cassé ni de bloquant** — la dernière session s'est terminée
   proprement (tous les tests automatisés au vert, dernière demande de
   l'utilisateur traitée). Pas d'urgence particulière au démarrage.
2. **Réflexe à ne pas oublier (déjà manqué une fois, v6.33/v6.34,
   corrigé en v6.34.1)** : toute livraison touchant un fichier JS ou
   CSS doit incrémenter `CACHE_NAME` dans `sw.js` — sinon les patients
   ayant déjà ouvert l'app (mode hors-ligne, cache "cache d'abord")
   continuent de recevoir les anciens fichiers, sans erreur visible,
   ce qui ressemble à "rien n'a changé" côté utilisateur.
3. **Toujours en attente de l'utilisateur** (je ne peux pas le faire à sa
   place, comme pour GitHub) :
   - Créer un vrai projet **Supabase** et en transmettre les identifiants
     (`SUPABASE_URL`/`SUPABASE_ANON_KEY` sont encore des chaînes vides
     dans `js/storage.js`) — l'espace orthophoniste ne fonctionne pas
     réellement tant que ce n'est pas fait.
   - Créer un compte **Stripe** + les 4 tarifs + déployer les 2 Edge
     Functions (voir `js/stripe-edge-functions.md`) pour que le paiement
     Pro fonctionne réellement.
4. **Rien de tout ce qui touche au visuel n'a été confirmé par un vrai
   navigateur** (v6.25 à v6.32 : palette, écran de connexion, fond
   animé, typographie) — je n'ai pas accès à un navigateur graphique
   dans cet environnement. Vérifié uniquement structurellement à chaque
   fois (CSS valide, variables non orphelines, tests). L'utilisateur a
   testé lui-même et donné des retours itératifs — considérer que
   c'est "probablement bon" mais pas "confirmé".
5. **"Espace aidant" (proche du patient)** : l'utilisateur veut un vrai
   espace complet (compte, suivi du patient) — **pas commencé**, juste
   une page d'attente honnête (`aidant.html`). Ordre de grandeur : un
   chantier comparable à l'espace orthophoniste (table dédiée, RLS,
   auth, dashboard). À scoper avec l'utilisateur avant de coder (qui
   voit quoi, plusieurs aidants par patient possible ?, etc.) —
   décidé/validé explicitement le 6 juillet : "un vrai espace complet",
   pas juste un lien.

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

## v6.24 — structure gratuit/pro + double authentification (terminé)

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

### ✅ Résolu depuis (ne plus reprendre ce qui suit, c'est de l'historique)
Tout ce qui était listé ici comme "pas encore vérifié" a depuis été
testé pour de vrai : voir `tests/plan-and-mfa.test.js` (18 tests —
limite de patients, mot de passe renforcé, double authentification
complète avec un faux client Supabase simulé, et paiement Stripe
simulé). Le piège de portée JS rencontré en écrivant ce test
(`dom.window.Store` n'existe pas, le bon nom est
`dom.window.ReParoleStore` — `Store` est un alias `const` LOCAL à
`js/dashboard-ortho.js`/`js/app.js`) a été corrigé. **Reste tout de même
non testé avec un vrai compte Supabase/Stripe réel** — la simulation
prouve que le CODE est correct, pas que l'intégration avec de vrais
services fonctionne de bout en bout.

### Ce qui attend l'utilisateur (bloquant, hors de ma portée)
- **Créer un vrai projet Supabase** (supabase.com → New project) et me
  transmettre l'URL + la clé anonyme, pour remplacer les chaînes vides
  `SUPABASE_URL`/`SUPABASE_ANON_KEY` dans `js/storage.js`.
- **Exécuter `sql/schema.sql`** dans l'éditeur SQL du projet Supabase
  une fois créé (contient déjà la colonne `plan` et les migrations).
- Une fois le cloud configuré : créer le **compte test** demandé
  (email + mot de passe renforcé via le formulaire "Créer un compte" de
  l'espace ortho), puis activer sa double authentification via la
  nouvelle carte "Sécurité du compte".

### Point de vigilance pour la suite
Le piège récurrent de cette session (`const X` déclaré dans un fichier
n'est PAS automatiquement accessible via `window.X` depuis un autre
contexte, même si "ça a l'air d'être la même page") s'est reproduit une
fois de plus, cette fois dans mon propre test, pas dans le code livré.
**Toujours vérifier le nom réellement exposé sur `window` avant d'écrire
un test** (`grep -n "window\." fichier.js` est le réflexe à avoir).

## v6.24.1 — audit "7 rôles" + corrections

Un cadre de gouvernance en 7 rôles (Architecte, Développeur Senior,
Orthophoniste Virtuel, UX/Accessibilité, Produit, Qualité, Visionnaire)
fourni par l'utilisateur a été appliqué en rétro-audit sur la v6.24.
Avis donné : dans l'ensemble solide, deux réserves notées (coût de la
"cérémonie" si appliqué à la lettre pour de petits correctifs ; pas
d'arbitre prévu en cas de désaccord entre rôles non-sécurité). 3 manques
corrigés : test permanent `tests/plan-and-mfa.test.js` (16 vérifications,
le même piège de scope JS que ci-dessus s'y est révélé puis corrigé),
badge "🔒 Pro" visible sur le tableau de bord (`updateExerciseLocks()`),
et décision actée avec l'utilisateur : conversation guidée + vocal
avancé restent payants (viabilité du projet).

## v6.25 — refonte visuelle complète

Nouvelle palette pensée pour le sujet (repousse tranquille, pas chantier
clinique) plutôt qu'un rafraîchissement de la palette précédente, qui
était presque exactement le résultat par défaut pour ce genre de brief
(fond crème + terracotta). Vert forêt approfondi (garde la couleur
d'Ami), doré chaud à la place du terracotta, contrastes vérifiés à la
main (WCAG AA). Un seul geste signature (coin organique sur les grandes
cartes) pour ne pas surcharger. Détail : la bulle d'Ami passe en
italique, avec correctif d'accessibilité au passage (la règle
anti-italique du mode dyslexie ne couvrait que `<i>/<em>`, étendue aux
styles CSS directs). **Uniquement les 3 fichiers CSS modifiés** — se
propage automatiquement à tous les écrans. **Non vérifié visuellement**
(pas de navigateur graphique disponible ici) — un test réel une fois
déployé reste nécessaire avant de considérer que c'est fini.

## v6.26 — paiement réel (Stripe)

Demande explicite de l'utilisateur : bouton/onglet pour passer en Pro,
page de tarification avec explications et prix, paiement carte + PayPal
+ Oney. Prix suggérés puis validés avec l'utilisateur : **patient 2,99
€/mois ou 19,99 €/an ; orthophoniste 9,99 €/mois ou 79 €/an**. Oney
écarté (partenariat commercial, pas une inscription simple — jugé
disproportionné). Décidé : Stripe seul, avec PayPal activé dedans
(un seul SDK, deux moyens de paiement).

**Fait** : écrans de tarification (patient + ortho), traduits dans les 7
langues ; bouton "Voir les offres" permanent sur les deux tableaux de
bord (masqué si déjà pro) ; `js/storage.js` `createCheckoutSession()`
(aucune clé secrète côté client) ; `js/stripe-edge-functions.md` (guide
complet, même format que `reminders-edge-function.md` déjà existant) ;
colonnes `stripe_customer_id`/`stripe_subscription_id` dans
`sql/schema.sql` ; 2 tests supplémentaires dans
`tests/plan-and-mfa.test.js` (18 vérifications au total) simulant
`fetch` pour tester la logique sans vrai Stripe.

**Ce qui attend l'utilisateur, comme pour Supabase/GitHub** : créer le
compte Stripe, les 4 tarifs, déployer les 2 Edge Functions
(`create-checkout-session` et `stripe-webhook` — celle-ci vérifie la
signature Stripe avant de faire confiance à un paiement, jamais de
confirmation décidée côté navigateur). Une fois fait, transmettre la
clé publiable Stripe (`pk_...`) pour finaliser.

**Pas testable de bout en bout** sans compte Stripe réel — la logique
JS est vérifiée par simulation, mais un vrai parcours de paiement (même
en mode test Stripe) reste à faire une fois les identifiants disponibles.

## v6.27 — retour utilisateur : écran de connexion

3 retours traités : (1) motif décoratif jugé "pas très joli" — remplacé
par un motif ORIGINAL de connexions neuronales (SVG maison, pas les
photos Shutterstock montrées en référence — droits d'auteur), choix
cohérent avec le sujet (cerveau/AVC) plutôt qu'arbitraire ; (2) carte de
connexion trop petite / pas adaptée au mobile — élargie (760px, écrans
d'exercice restent à 680px) + premier vrai point de rupture mobile du
projet (`@media max-width:480px`) ; (3) "on a perdu l'espace aidant" —
**vérifié : n'a jamais existé dans ce projet**, la référence de
l'utilisateur était une maquette. Message "aide à patienter" ajouté
(sur la feuille de route depuis le tout début, jamais fait). **Décision
utilisateur : l'espace aidant sera un VRAI espace complet (compte,
suivi patient), pas juste un lien — gros chantier, pas encore commencé.**
`aidant.html` est une page d'attente honnête en attendant, pas le
chantier lui-même.

**Piège évité de justesse** : en écrivant l'animation du nouveau motif,
j'ai failli réintroduire `transform-box:fill-box` (le bug d'Ami) —
repéré et corrigé avant livraison en gardant le motif statique plutôt
que de gérer ce risque.

**Prochaine étape logique si demandée** : construire le vrai espace
aidant (table `caregivers` dans `sql/schema.sql`, auth + RLS comme
l'espace ortho, un dashboard en lecture — probablement pas d'écriture,
juste suivre les progrès — avec le consentement du patient à définir).
À scoper avec l'utilisateur avant de coder (qui peut voir quoi, un
patient peut-il avoir plusieurs aidants, etc.), comme pour chaque gros
chantier précédent dans cette session.

## v6.27.1 — le motif ne s'affichait pas du tout comme prévu

Retour (capture d'écran) : le motif neuronal s'affichait en pleine
largeur au-dessus du logo au lieu d'un petit coin discret. **Vrai bug,
pas juste une question de couleur** : `.login-card > *{
position:relative }` (pour garder le contenu au-dessus du motif)
s'appliquait AUSSI au SVG lui-même (enfant direct de `.login-card`),
annulant son `position:absolute`. Corrigé proprement avec
`:not(.login-decor)` plutôt qu'un `!important`. Couleurs rendues moins
délavées au passage. **Reste non vérifié visuellement** — à confirmer
par l'utilisateur après ce correctif.

## v6.28 — vrai fond de page animé

Retour : "faut qu'il y ait toute la page sinon ça sert à rien" — le
petit motif en coin ne suffisait pas. Remplacé par un vrai fond
pleine page derrière la carte de connexion : 12 nœuds colorés
(vert/doré/corail) reliés par des lignes, pulsation douce (cycle 7s,
décalée). Prudence gardée pour ce public : rythme lent, coupé si
`prefers-reduced-motion`. Mêmes garde-fous SVG qu'Ami (couleurs en
classes CSS, animations d'opacité seulement — jamais scale/rotate, pour
ne jamais dépendre de `transform-box`). Limité à l'écran de connexion
uniquement, pas étendu au reste de l'app (distrayant pendant les
exercices). **Non vérifié visuellement, comme toujours dans cette
session** — à confirmer par l'utilisateur.

## v6.29 — plus de beige sur l'écran de connexion

Retour : "pas de fond beige c'est moche" — le beige restait visible
entre les nœuds. L'écran de connexion a maintenant son propre fond en
dégradé (vert profond → doré), motif neuronal en tons clairs dessus.
**Scope limité à l'écran de connexion** (dashboard/exercices gardent le
fond lin de v6.25 — un fond riche en continu serait fatigant pendant
les exercices) — à clarifier avec l'utilisateur si le beige doit
disparaître partout, pas juste ici.

## v6.30 — teal plutôt que bleu

Demande "fond bleu avec le cerveau" — avis donné avant d'exécuter (un
vrai bleu casserait le lien avec l'identité vert/doré déjà construite
partout ailleurs). Compromis trouvé avec l'utilisateur : teal profond
(nouvelles teintes dédiées `--teal-deep`/`--teal`/`--teal-light`,
n'affectent QUE le fond de `#login` — Ami et le reste de l'app gardent
exactement leurs couleurs actuelles). Incohérence trouvée et corrigée au
passage : `theme-color`/`theme_color`/`background_color` (PWA)
étaient restés à l'ancienne palette d'avant v6.25.

## v6.31 — le "J" de "Bonjour !"

Compris tardivement : "un J moche" dans le tout premier message de
retour visuel était une vraie remarque typographique, pas une
coquille — manqué sur le moment, corrigé maintenant. Cause probable :
Fraunces (axe variable `opsz`) a des lettres volontairement
excentriques à petite taille optique, plus classiques à grande taille
— le choix automatique du navigateur peut varier. Forcé `opsz:144`
(valeur classique, grand titre) sur `h1,h2,h3` et `.prompt-main` — PAS
sur les petits textes (Ami), où l'axe bas est justement adapté.
**Toujours pas vérifiable visuellement** — plan B prêt si insuffisant :
abandonner Fraunces pour "Bonjour !" spécifiquement.

## v6.32 — harmonisation des couleurs sur tout le site

Confirmé par l'utilisateur (capture du bilan initial, entièrement
beige) : "le beige c'est totalement moche" visait **toute l'app**, pas
juste les champs de l'écran de connexion. `--bg` (fond de base utilisé
partout) passe du beige (`#efead9`) à un teal très clair (`#e6efec`),
même famille que le dégradé de connexion. `--surface-soft`, `--line`,
`--accent-soft` ajustés en cohérence. **Choix délibéré : reste clair**
(pas le dégradé sombre de la connexion) — le texte sombre de l'app
suppose un fond clair partout, sinon les écrans d'exercice
deviendraient illisibles. Uniquement des tokens CSS modifiés, se
propage automatiquement à tout le site. Vérifié : aucune ancienne
couleur beige codée en dur ne subsiste, tous les tests au vert.
**Non vérifié visuellement.**

**⚠️ IMPORTANT pour toute session future** : avant de livrer une
modification touchant à une langue, aux exercices, ou au bilan, lancer
`npm install && npm test` et vérifier que le filet de sécurité est vert.
Ne pas se contenter de vérifications manuelles au cas par cas comme lors
des sessions précédentes — c'est exactement ce qui a laissé passer le
bug v6.20 plusieurs fois de suite.
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

## v6.33 — paywall désactivé pour l'instant (mode payant repoussé à plus tard)

Demande explicite du 7 juillet, à partir d'une capture de l'écran
d'exercices patient (badges "🔒 Pro" visibles sur répétition, nommage à
voix haute, fluence, intonation) : tout doit être accessible côté
patient dès maintenant, le mode payant est repoussé à plus tard.

**Implémenté** : un seul interrupteur, `PAYWALL_ENABLED` (`js/app.js`,
`let`, `false` par défaut). `lockReason()` renvoie `null` sans même
regarder `isPro()`/langue/quota tant qu'il est désactivé — plus aucun
badge Pro, plus de restriction de langue ni de quota journalier côté
patient. La bannière `#pro-teaser-card` est masquée aussi (inutile de
pousser vers une offre non branchée). **Rien de la structure gratuit/
pro n'a été supprimé** — constantes, `lockReason`, écran de
tarification, Stripe : tout reste en place, prêt à revenir d'un coup
en repassant `PAYWALL_ENABLED` à `true` dans `js/app.js`, sans autre
changement de code. Tests mis à jour (`tests/plan-and-mfa.test.js`)
pour couvrir les deux états : désactivé par défaut, et la logique de
verrouillage sous-jacente toujours correcte si réactivée — 19 tests,
tous ✅.

**Pas traité, à clarifier si besoin** : `ORTHO_FREE_PATIENT_LIMIT`
(limite de 3 patients gratuits côté espace orthophoniste,
`js/dashboard-ortho.js`) — la demande du 7 juillet portait sur l'écran
patient, pas sur celui-ci. Ne pas y toucher sans nouvelle demande
explicite.

## v6.34.1 — correctif : le cache hors-ligne servait encore l'ancienne app

Vrai bug, signalé par capture d'écran le 7 juillet : après v6.33
(paywall désactivé) et v6.34 (Ami), les badges "🔒 Pro" et l'écran de
verrouillage étaient encore là, comme si rien n'avait changé.

**Cause, et erreur de ma part** : `sw.js` (mode hors-ligne, stratégie
"cache d'abord") sert les fichiers déjà en cache tant que `CACHE_NAME`
ne change pas — j'ai livré v6.33 et v6.34 sans l'incrémenter, alors que
le fichier le rappelle en commentaire depuis la v6.23. Les patients
ayant déjà ouvert l'app continuaient donc de recevoir l'ancien
`js/app.js`.

**Corrigé** : `CACHE_NAME` passe à `reparole-v6-34`. **Réflexe à
prendre pour toute livraison future touchant un fichier JS/CSS :
incrémenter `CACHE_NAME` dans `sw.js`, systématiquement** — sinon les
patients ayant déjà ouvert l'app ne verront pas la mise à jour sans
vider leur cache manuellement.

## v6.34 — Ami explique chaque exercice en y arrivant

Demande explicite du 7 juillet : quand on passe sur un exercice, Ami
doit expliquer à quoi il sert (pas comment y jouer — ça reste la
consigne affichée à l'écran), et surtout se déplacer jusqu'à l'exercice
pour donner cette explication, dans toutes les langues.

**Implémenté** :
- Nouvelle banque `COMPANION_PHRASES[lang].explain` (`js/companion.js`)
  — une phrase par type d'exercice (11 types), dans les 7 langues
  "interface complète" (fr/en/es/it/pt/de/ar). Contenu volontairement
  sobre : ce que l'exercice entraîne, jamais une comparaison à une
  norme ni une invitation à "faire mieux" — cohérent avec les
  garde-fous déjà en place (n°6, et la prudence spécifique à
  `phonation.js`).
- `Companion.explain(containerId, type)` : affiche cette phrase, ET
  joue une entrée plus marquée que l'entrée par défaut
  (`companion-enter-explain`, glissement de 64px au lieu de 22px,
  0,85s au lieu de 0,5s dans `css/companion.css`) avec la bulle de
  texte retardée d'environ 0,6s (`companion-bubble-delayed`) — pour
  donner l'impression qu'Ami arrive d'abord, puis parle une fois sur
  place. Respecte les mêmes préférences d'accessibilité que le reste du
  compagnon (réduire les animations / lecture facilitée) : dans ce cas,
  tout s'affiche instantanément, sans marche ni délai.
- Remplace les anciens appels `Companion.mount('companion-exercise');
  Companion.say('exerciseStart');` dans `js/app.js` (`startExercise()`,
  y compris la branche photos personnelles).
- **Chaque exercice a maintenant un Ami**, pas seulement les exercices
  passant par `startExercise()` : ajout d'un conteneur dédié et d'un
  appel `Companion.explain(...)` pour le jeu de mémoire
  (`js/memory.js`, `Memory.start()`), la tenue vocale
  (`js/phonation.js`, `Phonation.intro()`) et le menu de conversation
  guidée (`js/conversation.js`, `Conversation.menu()`) — ces trois-là
  n'avaient aucun compagnon affiché avant cette version.

**Non fait, décision volontaire, non demandée** : un vrai déplacement
continu d'un écran à l'autre (ex. depuis la position d'Ami sur le
tableau de bord jusqu'à sa position sur l'écran d'exercice) aurait
nécessité une couche d'overlay `position:fixed` mesurant les positions
avant/après changement d'écran (`getBoundingClientRect`) — plus fragile
sur d'anciens téléphones Android (public cible probable) et plus
difficile à vérifier structurellement sans navigateur réel. L'approche
retenue (marche marquée + délai à l'arrivée, dans l'écran de
destination) donne la même sensation côté patient pour un risque
technique bien moindre. À revoir si un retour utilisateur montre que ce
n'est pas suffisant.

**Vérifié par simulation DOM (jsdom)**, pas un vrai navigateur comme
toujours dans cet environnement — nouveau fichier
`tests/companion-explain.test.js` (83 tests) : complétude des 7 langues
x 11 types, bon message dans le bon conteneur, repli sur le français,
et classes d'animation bien absentes en mode accessibilité.
**Rendu visuel réel de la marche/du délai non confirmé**, comme le
reste des animations du compagnon.

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

## Structure des fichiers (v6.34)

```
reparole-v6/
├── index.html                 ← app patient (dashboard, exercices, PWA, tarifs)
├── dashboard-ortho.html       ← espace ortho (auth réelle + MFA + tarifs)
├── aidant.html                ← v6.27 : page d'attente (espace aidant PAS encore construit)
├── report.html                ← rapport imprimable
├── manifest.json              ← PWA (nom, icônes, couleurs — v6.32 harmonisées)
├── sw.js                      ← service worker (mode hors-ligne, CACHE_NAME v6-27)
├── icons/                     ← icônes PWA générées (192/512/apple-touch)
├── package.json               ← dépendance jsdom pour les tests
├── README.md                  ← historique détaillé de TOUTES les versions
├── RGPD.md, HEBERGEMENT.md    ← conformité + section PWA hors-ligne
├── bilan-exemple.txt          ← exemple de fichier pour tester l'import bilan
├── css/{style.css, ortho.css, companion.css} ← v6.25-v6.32 : palette teal, radius organique
├── js/
│   ├── prefs.js               ← préférences (dyslexie, langue, menu déroulant)
│   ├── i18n.js                ← I18N_STRINGS pour fr/en/es/it/pt/de/ar/kab, LANGUAGES
│   ├── exercises.js           ← BANK (français), + BANK_EXTEND()
│   ├── exercises-{en,es,it,pt,de,ar}.js ← BANK_XX, niveau complet
│   ├── exercises-kab.js       ← BANK_KAB (kabyle, vocabulaire sourcé uniquement)
│   ├── storage.js             ← navigateur OU Supabase + MFA + Stripe (testé par simulation)
│   ├── stripe-edge-functions.md ← v6.26 : guide complet paiement Stripe (comme reminders-edge-function.md)
│   ├── learner.js             ← IA adaptative + analyse d'erreurs + tests
│   ├── charts.js              ← SVG maison, zéro dépendance
│   ├── assessment.js          ← bilan initial, traduit fr/en/es/it/pt/de/ar
│   ├── app.js                 ← moteur d'exercices + structure gratuit/pro + tarifs
│   ├── conversation.js        ← conversation guidée, traduite 6 langues, verrou pro
│   ├── memory.js              ← jeu de mémoire, traduit, verrou gratuit/pro
│   ├── phonation.js           ← tenue vocale, traduit, verrou gratuit/pro
│   ├── dashboard-ortho.js     ← espace ortho + limite patients + MFA + tarifs
│   ├── companion.js           ← Ami, compagnon animé (phrases scriptées, pas de LLM) + explications par exercice (v6.34)
│   └── reminders-edge-function.md
├── audio/kab/README.md        ← comment ajouter de vrais enregistrements kabyles
├── docs/kabyle-completion-draft.md ← phrases kabyles sourcées, non intégrées
├── tests/
│   ├── learner.test.js            ← 17 tests moteur adaptatif
│   ├── i18n-completeness.test.js  ← cohérence des 8 langues (voir garde-fous)
│   ├── pwa-check.test.js          ← cohérence manifest/service worker
│   ├── plan-and-mfa.test.js       ← 19 tests : gratuit/pro (+ interrupteur PAYWALL_ENABLED), MFA (faux Supabase), paiement (faux fetch)
│   └── companion-explain.test.js  ← 83 tests : explications d'Ami (7 langues x 11 types) + animation d'arrivée
└── sql/schema.sql             ← RLS réelle, fonctions RPC, colonnes plan/stripe_*

npm install && npm test  →  doit afficher 5 suites, toutes ✅, avant toute livraison
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
Doit afficher "17 test(s) réussi(s)" + deux "✅ Aucun problème détecté".
Sinon, lire le détail affiché avant de livrer quoi que ce soit.

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

## Prochaines pistes réelles (état au 7 juillet)

- **Espace aidant complet** — décidé/validé par l'utilisateur, pas
  commencé. Le plus gros chantier ouvert actuellement.
- **Configurer les vrais comptes Supabase + Stripe** — bloquant pour
  que l'espace ortho et le paiement fonctionnent réellement (voir
  "À faire en priorité à la reprise" tout en haut de ce fichier).
- **Confirmation visuelle réelle** de toute la refonte (v6.25-v6.32) —
  demander à l'utilisateur un retour à jour si ce n'est pas déjà fait
  au moment de la reprise.
- Résumé imprimable côté PATIENT (pas seulement côté ortho) — toujours
  pas fait, mentionné dès le tout début du projet.
- Continuer le kabyle : compléter/valider `docs/kabyle-completion-draft.md`,
  étendre le vocabulaire (niveaux 2-3 des autres exercices), contacter
  apprendrelekabyle.com pour l'audio. Décision utilisateur : pas de
  kabyle pour `memory.js`/`phonation.js`/conversation guidée pour
  l'instant — ne pas relancer sans nouvelle demande explicite.
- Vérifier la performance sur de vieux téléphones Android (public cible
  probable : personnes âgées, matériel parfois ancien).
- Surveiller les limites du plan gratuit Supabase si l'usage grandit.
- ✅ FAIT depuis la dernière mise à jour de cette liste : PWA/hors-ligne,
  message "aide à patienter", filet de sécurité automatique, 5 langues
  supplémentaires complètes, conversation guidée traduite, structure
  gratuit/pro, double authentification, paiement Stripe, refonte
  visuelle complète.

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
