---
name: reparole-pro-v6
description: Reprise du projet ReParole Pro (v6.81) — application web de rééducation orthophonique post-AVC, à mini prix, pour aider un maximum de personnes en attente d'un rendez-vous avec un·e orthophoniste. Version épurée : contient l'essentiel pour reprendre (état actuel, garde-fous, structure, pièges connus) sans l'historique détaillé de chaque version — voir README.md dans le zip pour l'historique complet.
---

# ReParole Pro — document de reprise épuré (v6.81)

Ce fichier résume l'essentiel pour continuer ce projet dans une nouvelle
conversation, sans le détail de chaque version passée (ce détail existe
dans `README.md`, à l'intérieur du zip du projet — à consulter si besoin
de comprendre POURQUOI un choix précis a été fait). Donnez ce fichier à
Claude en début de session, avec le zip du projet (la version la plus
récente livrée).

**Nettoyé le 11 juillet** : ce document avait accumulé un deuxième
historique empilé au fil des livraisons (chaque version rajoutait son
propre paragraphe sans jamais rien retirer). Restructuré pour rester ce
qu'il doit être — un état des lieux actuel, pas un changelog. Le vrai
changelog détaillé reste `README.md`.

## Objectif du projet (à ne jamais perdre de vue)

Une application web **à mini prix**, pour aider **un maximum de personnes**
en rééducation du langage après un AVC, **pendant leur attente d'un vrai
rendez-vous** avec un·e orthophoniste. Ce n'est PAS un substitut à un
suivi professionnel — c'est un outil d'appui, à coût minimal, largement
accessible.

**Qui est l'utilisateur** : le fondateur du projet, non-développeur,
construit ça pour aider des proches/patients réels. Il teste lui-même
l'app en cours de route (navigateur réel + captures d'écran très
précises) et remonte des signalements à prendre au sérieux — la plupart
révèlent de vrais bugs, pas des malentendus.

## Positionnement et priorités (à garder en tête)

**Face à la concurrence** (Aphasix en France — bien financée, vise un
statut de dispositif médical remboursé ; Tactus Therapy/Constant
Therapy/Lingraphica à l'international — établis, chers, quasi
uniquement anglophones) : la vraie place de ReParole, c'est l'accès —
gratuit ou presque, et **multilingue comme aucun concurrent identifié
ne l'est** (10 langues dont kabyle/sango, sourcées sérieusement). Ce
qui manque le plus par rapport à eux : la validation clinique.

**Priorité avant tout nouveau développement** : faire tester l'app par
de vraies personnes en rééducation (pas seulement l'utilisateur), et
trouver un∙e orthophoniste pour une relecture même informelle du
contenu. Rien de tout ça ne demande du code — mais c'est plus
important que n'importe quelle nouvelle fonctionnalité à ce stade.

**Si de nouvelles pistes de développement sont demandées**, rester
concentré sur le multilingue (l'avantage réel face à la concurrence :
langues restantes, contenu kabyle/sango plus riche) plutôt que
d'ajouter des fonctionnalités génériques. Hébergement HDS et paiement
réel : à garder en pause tant qu'il n'y a pas de vrais patients avec
de vraies données.

## État actuel (résumé, pas un historique)

**Hébergement réel, en ligne** : GitHub Pages, domaine `reparole.fr`
configuré et confirmé fonctionnel (DNS propagé). Supabase configuré
avec de vraies clés (voir plus bas). Site accessible publiquement.

**Exercices** : dossier patient, 8 types (dénomination, complétion,
compréhension, répétition, répétition avec intonation, dénomination
orale, fluence, photos personnelles) + jeu de mémoire + tenue vocale +
conversation guidée + journal de ressenti libre. IA adaptative (règles
explicites, pas de LLM) avec répétition espacée, analyse d'erreurs,
détection de fatigue, 8 profils cliniques. Mode "séance courte" (3
questions). Compte gratuit plafonné à 5 questions/session quand le
paywall est actif (voir plus bas).

**10 langues** : fr (complète, dénomination 35 mots/niveau) ;
en/es/it/pt/de/ar/tr/pl (interface complète + tous les exercices
vocaux) ; kab et sg (**partielles**, volontairement — dénomination
sourcée uniquement, pas de synthèse/reconnaissance vocale disponible
pour ces langues, mécanisme commun via `PARTIAL_LANGS`). Voir "Sango"
et "Kabyle" ci-dessous pour l'état précis de chacune.

**Espaces séparés** : patient (`index.html`), orthophoniste
(`dashboard-ortho.html`, vraie auth Supabase + MFA), aidant
(`aidant.html`, code d'invitation, lecture seule, un seul aidant par
patient), admin (`admin.html`, validation des contributions +
tendances agrégées, réservé aux comptes de la table `admins`).

**Paiement** : structure gratuit/pro entièrement codée et Stripe
entièrement configuré côté utilisateur (4 tarifs, mode test, 6
secrets, webhook actif), mais **`PAYWALL_ENABLED = false`** dans
`js/app.js` — désactivé sur décision explicite de l'utilisateur après
avoir testé le parcours. Tout redevient accessible gratuitement. Prêt
à réactiver d'un coup en repassant le booléen à `true` — **ne pas le
réactiver sans qu'on en reparle**. Une 3ᵉ Edge Function
(`create-portal-session`, pour la résiliation en 3 clics) reste à
déployer par l'utilisateur si/quand le paywall est réactivé (voir
"Actions en attente").

**Conformité légale** : pied de page commun (mentions légales/CGV/CGU)
sur les pages patient-facing, 3 pages créées en brouillon avec des
sections `[À COMPLÉTER]`, cases à cocher obligatoires avant paiement
(CGV + renonciation au délai de rétractation). Pas encore relu par un
vrai juriste, et les 3 pages légales pas encore remplies avec les
vraies informations de l'utilisateur.

**Mise en page** : mosaïque à 2 colonnes (`columns`, pas
`display:grid`) pour le tableau de bord patient, avec décoration de
fond réseau (recolorée, adaptée du fond de l'écran de connexion) —
mobile inchangé (v6.62-v6.65). Bannière de mise à jour automatique du
service worker (v6.62), revérifiée à chaque retour au premier plan de
l'app depuis v6.66 (un patient qui rouvre l'app sur téléphone ne
redéclenche pas "load" comme un vrai rechargement d'ordinateur — sans
ça, la bannière n'apparaissait jamais sur mobile). Palette de couleurs
fournie par l'utilisateur appliquée (v6.51), accent chaleureux ocre
pour les réussites/badges/progrès (v6.52).

**Ami** (v6.65) : 10 expressions (voir `js/companion.js:svg()`,
`mouths`/`accessories`), bras + système de gestes découplé de l'humeur
(`mood`/`pose`, voir `moodFor()`/`poseFor()`) branché sur les vrais
déclencheurs de l'app (arrivée, conseil du jour, série, encouragement).
Reste non-humain et sans couleur par langue (décidé explicitement avec
l'utilisateur), et toujours aucune conversation libre (garde-fou n°1).

Pour le détail version par version, voir `README.md` dans le zip.

## Sango (langue partielle) — état précis

`js/exercises-sango.js` contient 22 mots de dénomination, sourcés avec
soin (dictionnaire SIL/Webonary, articles académiques, confirmations
directes de la personne sango-phone de l'utilisateur). Un mot reste
incertain (🥔, à la place d'"olive/olivier" qui ne pousse pas en
Centrafrique — voir le commentaire en tête du fichier).

**⚠️ L'utilisateur a transmis un fichier `Sango.txt` plus complet
(92 mots de dénomination pour la parité avec le français + 24 phrases
de complétion + 18 questions de compréhension), PAS ENCORE intégré.**
Réserve sérieuse : la liste de mots isolés contient beaucoup d'entrées
qui ressemblent à du français/anglais à peine modifié plutôt qu'à du
vrai sango (ex. "LAPIN" inchangé, "CORBE" donné pour "moufette" qui ne
correspond à aucun des deux animaux). Signalé à l'utilisateur, en
attente de sa confirmation avant d'intégrer quoi que ce soit. **Les
phrases de complétion/compréhension du même fichier semblent
nettement plus fiables** (grammaire cohérente, réutilise correctement
du vocabulaire déjà validé comme "yanga-da") — possible de commencer
par celles-là si l'utilisateur revient sans avoir tranché sur les mots
isolés.

## Kabyle (langue partielle) — état précis

Dénomination : 22 mots sourcés (2+ sources indépendantes chacun).
`docs/kabyle-parity-request.md` liste ce qu'il faudrait pour atteindre
la parité avec le français (92 mots supplémentaires + 24 phrases de
complétion + 18 questions de compréhension) — pas commencé, chantier
lourd qui bénéficierait d'un accès à une personne kabylophone comme
pour le sango. `docs/kabyle-completion-draft.md` : 4 phrases sourcées
via corpus réel, jamais intégrées (bloquées sur une relecture native,
garde-fou n°3). Message prêt à envoyer à apprendrelekabyle.com (demande
d'autorisation d'utiliser leurs enregistrements audio) — **rédigé
depuis longtemps, toujours pas envoyé par l'utilisateur**, à vérifier
si une réponse est arrivée à la reprise.

## Actions en attente de l'utilisateur (je ne peux pas les faire à sa place)

- **3ᵉ Edge Function Stripe** (`create-portal-session`) à déployer +
  Customer Portal à activer côté Stripe — seulement utile si/quand le
  paywall est réactivé.
- **Compléter les 3 pages légales** (`mentions-legales.html`,
  `cgv.html`, `cgu.html`) avec les vraies informations (identité,
  SIRET le cas échéant, hébergeur) avant toute relecture juridique.
- **Nommer un·e administrateur·rice** Supabase si ce n'est pas déjà
  fait (procédure dans `HEBERGEMENT.md`) — sans ça, `admin.html` ne
  sert à personne et les contributions de `contribuer.html`
  s'accumulent sans être relues.
- **Envoyer le message à apprendrelekabyle.com** (autorisation audio
  kabyle) — toujours en attente.
- **Trancher sur la qualité du fichier `Sango.txt`** (voir ci-dessus)
  avant que je puisse l'intégrer.
- **Tester le parcours de paiement Stripe** (carte de test
  `4242 4242 4242 4242`) si/quand le paywall est un jour réactivé,
  avant de basculer en mode production (nécessitera de refaire une
  bonne partie de la config Stripe : nouveaux tarifs, nouveau webhook,
  les identifiants changent entre mode test et réel).
- **(Optionnel, pas bloquant) Migration SQL pour un import fidèle des
  dates** — `restoreMyData()` (v6.69) ne rejoue pas les séances/erreurs
  individuelles à leur date d'origine, parce que `log_session` /
  `log_error` / `add_journal_entry` ne prennent pas de date en
  paramètre. Si un import 100% fidèle devient nécessaire, ça veut dire
  ajouter un paramètre `p_at` optionnel à ces fonctions RPC dans
  `sql/schema.sql` (avec `coalesce(p_at, now())`) et le redéployer dans
  Supabase — je ne peux pas l'appliquer moi-même.
- **Migration SQL pour les mots favoris** (v6.72) — la table
  `favorite_words` et ses fonctions RPC sont déjà écrites dans
  `sql/schema.sql`, mais pas encore appliquées à votre projet
  Supabase. Le bouton étoile fonctionne déjà en local (repli
  automatique) mais ne se synchronisera pas entre appareils tant que
  cette migration n'est pas jouée côté Supabase.
- **(Décision consciente, pas un oubli) Chargement paresseux par
  langue** (v6.79) — `js/i18n.js` charge aujourd'hui les 10 langues
  d'un coup (~80 Ko compressé), pareil pour les banques d'exercices.
  Mesuré et jugé raisonnable pour l'instant. À reconsidérer une fois
  que plusieurs langues supplémentaires (africaines ou autres) auront
  été ajoutées — le chantier est plus gros qu'il n'y paraît
  (`Prefs.setLang()`/`I18N.t()` sont utilisés de façon synchrone
  partout, y compris dans une trentaine de fichiers de test), donc à
  ne pas lancer avant que le besoin soit clair.
- **Migration SQL pour la boîte à idées** (v6.80) — la table
  `suggestions` et ses fonctions RPC sont déjà écrites dans
  `sql/schema.sql`, pas encore appliquées à votre projet Supabase. Le
  widget fonctionne déjà en local (repli automatique, message jamais
  perdu) mais personne ne peut le lire côté admin tant que cette
  migration n'est pas jouée.
- **Coffre-fort patient (mis de côté pour l'instant)** — discuté le
  même jour que la boîte à idées : une zone à part, optionnelle,
  activable uniquement par le patient lui-même (jamais par
  l'orthophoniste), avec un vrai compte Supabase Auth (mot de passe +
  confirmation email + MFA TOTP, même mécanisme que côté
  orthophoniste) pour des notes personnelles particulièrement
  sensibles. Explicitement PAS pour remplacer le code de suivi
  actuel — un mot de passe/MFA sur la connexion principale resterait
  un vrai obstacle d'accessibilité pour une partie du public visé
  (troubles moteurs/cognitifs post-AVC). Repartir de cette conversation
  si le sujet revient.
- **Configurer l'URL de redirection pour `reset-password.html`**
  (v6.81) — Supabase > Authentication > URL Configuration > Redirect
  URLs, ajouter l'adresse complète de `reset-password.html` une fois
  le site en ligne. Sans ça, les liens "Mot de passe oublié ?"
  (admin et orthophoniste) ne fonctionneront pas malgré la page déjà
  prête côté app — procédure détaillée dans `HEBERGEMENT.md`.
- **MFA pour les comptes admin** — actuellement seuls les comptes
  orthophoniste ont la double authentification (`dashboard-ortho.html`).
  `admin.html` n'a que email + mot de passe. Discuté (voir capture
  d'écran du 11 juillet) mais pas encore fait — même mécanisme TOTP à
  reprendre tel quel depuis `js/dashboard-ortho.js`.

## Pièges techniques déjà rencontrés (à ne pas refaire)

- **`display:grid` pour des cartes de hauteurs très inégales crée de
  grands vides** — une grille CSS classique aligne les cartes sur des
  rangées strictes ; si une carte est bien plus haute que ses
  voisines, toute la rangée prend sa hauteur, sans que les cartes plus
  courtes puissent "remonter" combler l'espace. Utiliser `columns`
  (avec `break-inside:avoid` sur chaque carte) pour un vrai effet
  mosaïque à la place, dès que le contenu a des hauteurs variables et
  imprévisibles (voir `.dashboard-grid` dans `css/style.css`).
- **`CACHE_NAME` dans `sw.js`** : toute livraison touchant un fichier
  JS/CSS doit l'incrémenter — sinon les patients en mode hors-ligne
  continuent de recevoir les anciens fichiers, sans erreur visible.
  Ajouter aussi tout nouveau fichier à `APP_SHELL`. Depuis v6.62, une
  bannière prévient l'utilisateur qu'une mise à jour est disponible
  (plus besoin de rechargement forcé manuel).
- **Un élément avec `class="screen"` ne doit JAMAIS avoir de style
  `display` en ligne dans le HTML** — l'inline style est prioritaire
  sur la règle CSS `.screen.active{display:block}` et reste caché pour
  toujours même après `classList.add('active')`, sans la moindre
  erreur JS (juste un problème CSS silencieux — page blanche après une
  connexion "réussie"). Bug réel trouvé deux fois (aidant.html,
  admin.html), corrigé, et gardé sous surveillance par
  `tests/screen-visibility.test.js` qui scanne toutes les pages.
- **Un objet JS avec une clé dupliquée ne lève aucune erreur** — la
  seconde déclaration écrase silencieusement la première (trouvé sur
  `LANGUAGES.sg`, déclaré deux fois par erreur ; un renommage qui ne
  semble avoir aucun effet est un signe possible de ce piège).
- **`user` et les autres `const`/`let` de haut niveau d'un fichier JS
  sont invisibles depuis un `eval()` séparé** en test jsdom — toujours
  exposer un setter (`__testSetXxx`) défini DANS le même `eval()` que
  la déclaration, jamais une réaffectation brute depuis un `eval()`
  ultérieur.
- **Un `test()` qui enveloppe une fonction `async` doit être `await`é**
  — sinon les assertions s'exécutent après le résumé final du script
  (compteurs faux). Tout fichier de test avec au moins un test async
  doit tourner entièrement dans `async function main(){...} main();`.
- **Attributs de présentation SVG (`fill="var(--accent)"`) non fiables
  sur Safari/iOS** — utiliser des classes CSS (voir `css/companion.css`).
- **Un seul rechargement peut ne pas suffire à voir une mise à jour**
  même avec `CACHE_NAME` bien incrémenté — le nouveau service worker
  s'installe en tâche de fond, ne prend le contrôle qu'au rechargement
  suivant (atténué depuis v6.62 par la bannière de mise à jour).

## Garde-fous établis (ne pas les redécouvrir à chaque fois)

1. **Pas d'IA générative (LLM)** pour parler librement avec les
   patients, ni pour générer du contenu d'exercice. Le moteur
   adaptatif, Ami, et le moteur de conseils de l'espace aidant restent
   des règles explicites et testables — le public est vulnérable.
   Explicitement demandé puis décliné une fois (v6.38) : "faire
   apprendre l'app" à partir des données patients pour générer
   automatiquement des exercices — remplacé par des tendances
   agrégées signalées à un humain, jamais de contenu généré.
2. **Pas d'exercices de déglutition/dysphagie.** Risque réel de fausse
   route, à surveiller uniquement en présentiel par une équipe
   soignante.
3. **Contenu en langue partielle (kabyle, sango) : uniquement du
   vocabulaire vérifié par au moins une source, idéalement deux.**
   Jamais de grammaire/phrases inventées sans relecture native — les
   phrases complètes restent hors de portée tant qu'un humain (pas une
   IA, pas un outil de traduction automatique générique) ne les a pas
   relues. Canal de contribution existant : `contribuer.html` →
   validation admin sur `admin.html`.
4. **Aucune fausse promesse de traduction.** `I18N.t()` retombe
   automatiquement sur le français si une clé manque — chaque écran
   partiellement traduit doit l'expliquer clairement, jamais de
   mélange silencieux de langues.
5. **Pas de score truqué.** Toute action qui ne reflète pas une vraie
   réussite ne doit jamais compter dans les statistiques globales.
6. **Aucune donnée médicale sensible sans avertissement.** Jamais de
   "norme clinique" chiffrée montrée au patient/aidant qui pourrait
   provoquer un auto-diagnostic anxiogène.
7. **Sécurité auth/RLS déjà en place, ne pas régresser.** Patient =
   code long aléatoire + accès via fonctions RPC uniquement (jamais de
   lecture directe de table). Orthophoniste = vrai compte Supabase
   Auth + RLS. Aidant = même logique, code long + RPC dédiée qui ne
   renvoie qu'un sous-ensemble limité. Admin = compte Supabase Auth
   mais aucun droit automatique — seules les lignes ajoutées à la main
   dans `admins` (par le propriétaire du projet, jamais depuis l'app)
   ont un accès.
8. **Validation clinique toujours en attente.** Rien dans cette app
   n'a été validé par un·e orthophoniste en exercice — ne jamais
   donner l'impression contraire.

## Ce qui reste explicitement hors de portée du code

- Choisir/contracter un hébergement certifié **HDS** (démarche
  contractuelle, voir `HEBERGEMENT.md`) — nécessaire dès qu'un vrai
  patient utilise l'app (données de santé identifiantes).
- Validation juridique RGPD (modèles fournis dans `RGPD.md`) et des 3
  pages légales (mentions légales/CGV/CGU) — pas un avis juridique.
- Validation clinique du contenu par un·e orthophoniste réel·le.
- Relecture native du kabyle et du sango au-delà du vocabulaire déjà
  sourcé.
- Envoi réel d'emails de rappel (mécanisme prêt, clé API à fournir —
  voir `js/reminders-edge-function.md`).

## Structure des fichiers

```
reparole-v6/
├── index.html                 ← app patient (dashboard grille 2 colonnes ≥900px, exercices, PWA, tarifs, accès aidant)
├── dashboard-ortho.html       ← espace ortho (auth réelle + MFA + tarifs)
├── aidant.html                ← espace aidant (tableau de bord, code d'invitation)
├── mon-resume.html            ← résumé imprimable PATIENT (historique complet, ferme l'onglet au retour)
├── report.html                ← rapport imprimable ORTHO (réservé)
├── contribuer.html            ← proposer un mot/une phrase (public)
├── admin.html                 ← validation des contributions + tendances (réservé aux comptes `admins`)
├── mentions-legales.html, cgv.html, cgu.html ← pages légales, brouillons [À COMPLÉTER]
├── manifest.json, sw.js       ← PWA + service worker (CACHE_NAME à incrémenter à CHAQUE livraison JS/CSS)
├── icons/                     ← icônes PWA
├── package.json               ← dépendances de test (jsdom)
├── README.md                  ← historique détaillé de TOUTES les versions
├── RGPD.md, HEBERGEMENT.md    ← conformité + procédure de nomination admin
├── docs/kabyle-parity-request.md, docs/kabyle-completion-draft.md, docs/sango-translation-request.md
├── css/{style.css, ortho.css, companion.css}
├── audio/{kab,sango}/README.md ← comment ajouter de vrais enregistrements
├── js/
│   ├── prefs.js               ← préférences (dyslexie, langue, séance courte, PARTIAL_LANGS)
│   ├── i18n.js                ← I18N_STRINGS pour 10 langues, LANGUAGES, PARTIAL_LANGS
│   ├── exercises.js           ← BANK français (dénomination 35 mots/niveau) + BANK_EXTEND()
│   ├── exercises-{en,es,it,pt,de,ar,tr,pl}.js ← langues complètes
│   ├── exercises-kab.js, exercises-sango.js ← langues partielles (dénomination sourcée uniquement)
│   ├── storage.js              ← navigateur OU Supabase (vraies clés en dur) + MFA + Stripe + aidant + journal
│   ├── stripe-edge-functions.md ← guide complet paiement Stripe (3 fonctions)
│   ├── learner.js              ← IA adaptative + analyse d'erreurs + 8 profils cliniques
│   ├── charts.js               ← SVG maison, zéro dépendance
│   ├── assessment.js           ← bilan initial, 9 langues
│   ├── app.js                  ← moteur d'exercices + gratuit/pro (PAYWALL_ENABLED=false) + playPartialLangWordUI()
│   ├── conversation.js         ← conversation guidée, 8 langues, verrou pro
│   ├── memory.js, phonation.js ← jeu de mémoire, tenue vocale
│   ├── dashboard-ortho.js      ← espace ortho + MFA + tarifs
│   ├── companion.js            ← Ami : compagnon animé (accent chaleureux pour les séries)
│   ├── caregiver.js, caregiver-tips.js ← logique aidant.html + moteur de conseils
│   ├── admin.js, contribute.js ← logique admin.html / contribuer.html
│   ├── footer.js               ← pied de page commun (mentions légales/CGV/CGU)
│   └── reminders-edge-function.md
├── sql/schema.sql             ← RLS réelle, fonctions RPC, colonnes plan/stripe_*/caregiver_code
└── tests/ (35 fichiers, 427 tests — voir liste ci-dessous)
    learner, i18n-completeness, pwa-check, plan-and-mfa, companion-explain,
    caregiver, patient-summary, knowledge-base, text-normalize, short-session,
    journal, caregiver-words, feedback-and-lang-refresh, free-tier-cap,
    legal-compliance, partial-lang-generalization, screen-visibility,
    dashboard-grid, companion-gestures, browser-lang-detect, motor-accessibility, export-restore-data, exercise-help-button, dark-mode-and-profiles, favorite-words, audio-checklist, memory-speed, dark-mode-other-spaces, caregiver-ortho-i18n, memory-intro-screen, photos-card, perf-hints, accessibility, idea-box, password-reset
```

## Comment tester rapidement

```bash
python3 -m http.server 8000
```
Ouvrir Chrome (obligatoire pour les exercices vocaux) sur `localhost:8000`.

**⚠️ Avant toute livraison** :
```bash
npm install && npm test
```
Doit afficher **35 suites, toutes ✅, 427 tests**. Sinon, lire le détail
avant de livrer quoi que ce soit. Ne pas oublier `CACHE_NAME` dans
`sw.js` si un fichier JS/CSS a changé, et d'ajouter tout nouveau
fichier à `APP_SHELL`.

## Sources utilisées pour le vocabulaire (à réutiliser si besoin d'étendre)

**Kabyle** : kabyle.com (dictionnaire), Glosbe (fr.glosbe.com, riche en
phrases de corpus réelles), Encyclopédie berbère
(journals.openedition.org/encyclopedieberbere), apprendrelekabyle.com
(contient de vrais enregistrements audio natifs — piste non aboutie,
email prêt mais pas envoyé).

**Sango** : dictionnaire SIL International/Webonary
(webonary.org/sango, ~2200 entrées, la source la plus fiable trouvée),
centrafrique.sango.free.fr, desmotsetdeslangues.eklablog.com. **Éviter
les outils de traduction automatique généralistes** (ex. PolyTranslator)
pour cette langue — fiabilité douteuse sur une langue aussi peu
dotée numériquement.

## Ton et méthode à garder

- Toujours vérifier une traduction/affirmation avant de la livrer
  plutôt que de deviner — accueillir et exploiter sérieusement les
  sources fournies par l'utilisateur.
- Quand l'utilisateur signale un souci avec une capture d'écran,
  d'abord vérifier si c'est un vrai bug avant de l'expliquer comme
  "normal" — la plupart des signalements se sont avérés être de vrais
  bugs (parfois subtils : CSS silencieux, doublons de clé JS...).
- Pour tout chantier de l'ampleur d'un nouvel espace (nouveau modèle
  d'accès, nouvelles données exposées) : scoper avec l'utilisateur
  AVANT de coder (qui voit quoi, quelles données).
- Toujours repackager et livrer un zip à jour après chaque changement,
  après avoir validé (syntax check JS, `npm test`, équilibre des
  balises HTML, `CACHE_NAME` dans `sw.js`).
- Ce document de reprise doit rester un état des lieux, pas un
  changelog — mettre à jour les sections existantes plutôt que d'en
  empiler de nouvelles à chaque version.
