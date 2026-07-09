---
name: reparole-pro-v6
description: Reprise du projet ReParole Pro (v6.59) — application web de rééducation orthophonique post-AVC, à mini prix, pour aider un maximum de personnes en attente d'un rendez-vous avec un·e orthophoniste. Version épurée : contient l'essentiel pour reprendre (état actuel, garde-fous, structure, pièges connus) sans l'historique détaillé de chaque version — voir README.md dans le zip pour l'historique complet.
---

# ReParole Pro — document de reprise épuré (v6.59)

Ce fichier résume l'essentiel pour continuer ce projet dans une nouvelle
conversation, sans le détail de chaque version passée (ce détail existe
dans `README.md`, à l'intérieur du zip du projet — à consulter si besoin
de comprendre POURQUOI un choix précis a été fait). Donnez ce fichier à
Claude en début de session, avec le zip du projet (la version la plus
récente livrée).

## ⚠️ À faire en priorité à la reprise

1. **Rien de cassé ni de bloquant** — la dernière session s'est terminée
   proprement (16 suites de tests automatisés au vert, 274 tests).
   **v6.59 : le sango a sa propre langue dans le sélecteur, dénomination
   complète (22 mots).** Un mot reste incertain (🥔, "olive/olivier" —
   voir le commentaire tout en haut de `js/exercises-sango.js`) :
   volontairement laissé tel quel pour que la personne sango-phone de
   l'utilisateur le corrige en le voyant en direct dans l'app. **Gros
   ménage fait au passage** : plusieurs mécanismes étaient câblés en
   dur pour "kab" spécifiquement (notices d'interface, sélection de
   banque de dénomination, lecture audio) — généralisés via
   `PARTIAL_LANGS` (`js/i18n.js`) et `playPartialLangWordUI()`
   (`js/app.js`), donc une 3ᵉ langue partielle future n'aura presque
   rien à toucher côté mécanique. **"Compléter la phrase" et
   "Comprendre la consigne" toujours pas traduits pour le sango** —
   même chantier que pour le kabyle (voir
   `docs/kabyle-parity-request.md`, 24 phrases + 18 questions,
   demandent une relecture native).
   **v6.58 : `PAYWALL_ENABLED` repassé à `false`** (décision explicite
   de l'utilisateur, "débranche le mode payant pour l'instant") —
   toute la structure Stripe/CGV/CGU/Customer Portal (v6.54-v6.56)
   reste intacte et prête à être réactivée d'un coup. **Ne pas
   réactiver le paywall sans qu'on en reparle.**
   **v6.56 : conformité légale (mentions légales, CGV, CGU, résiliation
   en 3 clics)** — voir point 2 pour l'action utilisateur qui reste (3ᵉ
   Edge Function à déployer + configuration Customer Portal côté
   Stripe, utile seulement si/quand le paywall est réactivé). Deux
   vrais bugs trouvés en construisant ça, tous deux corrigés :
   `loadPatient()` ne renvoyait jamais `plan`/`stripe_customer_id` au
   client (un patient qui payait restait "free" à la reconnexion), et
   `Store.createPortalSession()` était appelée mais n'existait nulle
   part.
   **v6.55 : plafond de 5 questions/session pour le compte gratuit**
   (actif uniquement quand `PAYWALL_ENABLED` l'est).
   **v6.50 : audit complet de `index.html`** — 11 endroits jamais
   traduits trouvés et corrigés (lien espace pro, boutons
   d'accessibilité, encart "Assistant adaptatif" pendant les
   exercices, boutons "← Retour", etc.), 99 nouvelles chaînes au
   total. **Pour toute nouvelle carte/bouton ajouté à `index.html` à
   l'avenir : `data-i18n` dès la création, dans les 9 langues
   complètes** — c'est le même oubli qui s'est répété plusieurs fois
   de suite (v6.41, v6.42, v6.43 avaient chacun ajouté du texte non
   traduit sans que ça ne soit repéré avant un audit complet).
   **Important : `js/storage.js` contient maintenant les VRAIES clés
   Supabase de l'utilisateur en dur** (URL + clé `anon public`), à sa
   demande explicite — voir point 10 pour le détail complet et un vrai
   piège de test que ça a révélé (déjà corrigé, v6.46). Ne jamais vider
   ces deux lignes par réflexe "retour à un état propre" : elles sont
   voulues telles quelles.
   **Police Fraunces totalement abandonnée (v6.48)** — après 3
   tentatives de réglage de l'axe `opsz` (v6.31, v6.45, v6.47, la
   dernière fondée sur une vraie source officielle) sans que le J/f de
   "Bonjour !" ne s'améliore selon l'utilisateur, tous les titres
   utilisent maintenant Source Sans 3 (sans-serif, déjà chargée). **Ne
   pas réintroduire Fraunces sans qu'on en rediscute** — 3 tentatives
   de correctif ont déjà échoué sur ce sujet précis.
2. **Nom de domaine réel : `reparole.fr`.** DNS en cours de
   propagation au moment de cette note (l'utilisateur a dit compter
   environ 1h d'attente). Rien dans le code n'a de domaine en dur
   (chemins relatifs partout), donc aucun changement de code
   nécessaire pour ça — le seul point à vérifier côté configuration
   est Supabase Auth (voir point 3 juste en dessous).
3. **Toujours en attente de l'utilisateur** (je ne peux pas le faire à sa
   place, comme pour GitHub) :
   - **Supabase — pour l'essentiel FAIT (v6.44-v6.46), voir point 10 pour
     le détail complet.** `SUPABASE_URL`/`SUPABASE_ANON_KEY` sont les
     VRAIES clés de l'utilisateur, en dur dans `js/storage.js` (à sa
     demande, pour ne pas les reperdre à chaque zip). `sql/schema.sql`
     (corrigé en v6.44) a normalement été exécuté avec succès sur son
     projet — à reconfirmer si l'utilisateur revient avec une erreur.
   - **Stripe — FAIT (v6.54).** Compte créé (mode test), 4 tarifs, 2
     Edge Functions déployées, 6 secrets configurés, webhook actif.
     `PAYWALL_ENABLED = true` dans `js/app.js`. Reste : tester le
     parcours avec une carte de test Stripe (`4242 4242 4242 4242`),
     puis décider quand basculer en mode production (voir la fin du
     document, section "Prochaines pistes réelles").
   - **v6.56 — 3ᵉ Edge Function à déployer : `create-portal-session`**
     (code complet dans `js/stripe-edge-functions.md`, section 5c,
     même méthode que les deux premières — nom exact dans le champ
     "Function name", fichier `index.ts`). **Étape en plus, propre à
     celle-ci** : le Customer Portal doit être activé/configuré au
     moins une fois côté Stripe (Paramètres → Customer portal) avant
     de fonctionner, sinon erreur "No configuration provided" —
     séparé entre mode test et mode production, à refaire au passage
     en réel. Sans ça, le bouton "Gérer mon abonnement" (déjà présent
     dans l'app, carte visible pour un compte pro) ne fonctionnera pas.
   - **Compléter les 3 pages légales** (`mentions-legales.html`,
     `cgv.html`, `cgu.html`, v6.56) avec ses vraies informations
     (identité, SIRET le cas échéant, hébergeur) avant toute relecture
     juridique — sections `[À COMPLÉTER]` clairement marquées.
   - **Envoyer le message préparé en v6.37** à apprendrelekabyle.com
     (demande d'autorisation d'utiliser leurs enregistrements audio
     kabyles) — rédigé, pas envoyé, ce n'est pas quelque chose que je
     peux faire à sa place.
   - **Nommer au moins un·e administrateur·rice** (v6.38, procédure
     dans `HEBERGEMENT.md`) — sans ça, `admin.html` n'est utilisable
     par personne et les contributions envoyées via `contribuer.html`
     s'accumulent sans jamais être relues. Peut se faire dès que le
     schéma SQL est en place (point ci-dessus).
4. **Rien de tout ce qui touche au visuel n'a été confirmé par un vrai
   navigateur** — je n'ai pas accès à un navigateur graphique dans cet
   environnement, seulement à une vérification structurelle (CSS valide,
   simulation DOM via jsdom, tests). L'utilisateur teste lui-même et
   donne des retours — considérer tout rendu visuel comme "probablement
   bon" mais pas "confirmé" tant qu'il n'a pas dit l'avoir vu. Ceci
   inclut la toute nouvelle page `aidant.html` (v6.35), jamais vue dans
   un vrai navigateur.
5. **"Espace aidant" — première version fonctionnelle livrée en v6.35,
   mais pas terminée.** Ce qui existe : le patient génère un code
   d'invitation depuis son tableau de bord, l'aidant se connecte avec ce
   code sur `aidant.html` et voit les progrès + des conseils du jour
   générés par des règles explicites (pas de LLM). Ce qui reste
   ouvert, à ne pas relancer sans demande explicite :
   - Traduction (français uniquement pour l'instant).
   - Plusieurs aidants par patient (décision utilisateur du 7 juillet :
     un seul pour l'instant, volontairement).
   - Confirmation visuelle réelle (point 4 ci-dessus).
   - Tout ce qui dépend de Supabase (point 3 ci-dessus) : en mode
     navigateur local, l'aidant et le patient doivent être sur le même
     appareil/navigateur pour que ça fonctionne (pas de vrai partage
     entre appareils sans cloud configuré).
6. **Résumé imprimable patient (v6.36, `mon-resume.html`)** : terminé et
   testé, français uniquement pour l'instant (comme l'espace aidant à
   ses débuts). Accessible depuis le bouton "🖨️ Imprimer mon résumé"
   dans la carte "Votre progression" du tableau de bord patient.
7. **Base de connaissances communautaire (v6.38)** : terminée et
   testée. `contribuer.html` (public) → `content_items` en attente →
   `admin.html` (validation par les comptes présents dans `admins`,
   voir `HEBERGEMENT.md`) → intégration automatique dans `BANK_KAB`
   pour le vocabulaire (les phrases restent hors fusion automatique,
   voir garde-fou n°3). Génération automatique de contenu par IA
   explicitement proposée par l'utilisateur puis déclinée (garde-fou
   n°1) — remplacée par `get_admin_trends()`, des tendances agrégées
   signalées à un humain, jamais du contenu généré.
8. **Ajout de 6 langues européennes, EN COURS (v6.40 = 2/6 faites).**
   Décision explicite avec l'utilisateur : une langue à la fois,
   complète (interface + tous les exercices vocaux), pas les 6 d'un
   coup. Ordre convenu : **turc (✅ v6.39) → polonais (✅ v6.40) →
   roumain → néerlandais → russe → grec**. Si l'utilisateur relance
   "continue les langues" ou similaire, reprendre à **roumain**, avec
   exactement la même méthode (voir README v6.39/v6.40 pour le détail
   complet) :
   - `js/exercises-XX.js` (nouveau fichier, copier la structure de
     `exercises-tr.js` ou `exercises-en.js`)
   - `I18N_STRINGS.XX` dans `js/i18n.js` (+ ligne dans `LANGUAGES`)
   - `ASSESS_STRINGS.XX` + `ASSESS_ITEMS_XX` + `SYMPTOM_QUESTIONS_XX` +
     `ASSESS_DOMAIN_LABELS_XX` dans `js/assessment.js`
   - `CONV_SCENARIOS_XX` dans `js/conversation.js`
   - `COMPANION_PHRASES.XX` dans `js/companion.js`
   - `<script src="js/exercises-XX.js">` dans `index.html`
   - `sw.js` : ajouter le fichier à `APP_SHELL`, incrémenter `CACHE_NAME`
   - **Ne pas oublier** (piège déjà rencontré en v6.39, à ne pas
     reproduire) : ajouter le code langue aux listes codées en dur
     `requiredIn` de `tests/i18n-completeness.test.js` (5 occurrences)
     ET à `FULL_LANGS` dans `tests/companion-explain.test.js` — sinon
     le filet de sécurité ne couvre pas la nouvelle langue en silence.
   - **Vérifier la casse spéciale de la langue AVANT de traduire** (le
     turc a la distinction i/İ vs ı/I qui a nécessité un vrai correctif
     de `js/app.js:normalize()` — voir `tests/text-normalize.test.js`).
     Le polonais a `ł` (déjà couvert par le correctif v6.39, confirmé
     en pratique en v6.40, aucun nouveau correctif nécessaire).
   - **Russe et grec : déjà couverts par le correctif v6.39.**
     `normalize()` gardait uniquement `[a-z]`, donc un mot entièrement
     en cyrillique ou en grec devenait une chaîne VIDE (pas juste
     dégradée) — corrigé en élargissant à `\p{L}\p{N}` (Unicode) plutôt
     qu'un alphabet latin figé, testé avec de vrais mots russes/grecs
     dans `tests/text-normalize.test.js`. Reste à confirmer avec un
     vrai navigateur au moment de livrer ces deux langues (la
     reconnaissance vocale elle-même n'a jamais été testée en dehors
     de cet environnement, comme toujours).
9. **4 pistes proposées par l'utilisateur en réponse à "quelle idée
   pourrait-on ajouter ?" — LES 4 FAITES (v6.41/v6.42/v6.43).**
   Ordre choisi par l'utilisateur : "les 4 et par celui que tu veux".
   - ✅ Mode "séance courte" (`Prefs.data.shortSession`, v6.41)
   - ✅ Journal de ressenti libre (`journal_entries`, v6.41)
   - ✅ Populations cliniques voisines — traumatisme crânien, ORL,
     Parkinson (`CLINICAL_PROFILES` dans `js/learner.js`, v6.42)
   - ✅ Mots personnalisés proposés par l'aidant (`caregiver_words`,
     v6.43) — décisions de scope validées avec l'utilisateur : liés au
     patient précis suivi (pas anonymes, pas dans la base commune de
     `contribuer.html`), intégrés automatiquement sans validation admin
     (l'aidant a déjà un accès en lecture à ce dossier précis). Fusionnés
     dans la banque de dénomination de la langue active du patient
     (`mergeCaregiverWords()` dans `js/app.js`), avec des distracteurs
     tirés du vocabulaire déjà vérifié — jamais inventés à la volée.
   - **Décision prise en marge de ce chantier, à ne pas relancer sans
     nouvelle demande** : l'utilisateur avait initialement demandé
     "150 exercices" (tous types, 9 langues, 150 par niveau —
     ~24 000 items). Jugé disproportionné en une fois (risque de
     doublons/qualité dégradée à ce volume) ; remplacé, avec l'accord
     de l'utilisateur, par un premier lot resserré : dénomination
     française seulement, 35 mots/niveau (au lieu de 8). Étendre aux
     autres types/langues reste possible mais doit repasser par un
     vrai échange avant d'être relancé à grande échelle.
   - **Piège de test découvert pendant ce chantier** (v6.43) :
     réaffecter une variable `let` de haut niveau (ex. `userCode`) via
     un `eval()` séparé de celui où elle a été déclarée ne se propage
     PAS de manière fiable aux fonctions déjà définies dans le premier
     `eval()` — même si une lecture directe immédiate après semble
     fonctionner. Toujours exposer un setter (`__testSetXxx`) défini
     DANS le même `eval()` que la déclaration plutôt qu'une
     réaffectation brute depuis un `eval()` ultérieur. Voir
     `tests/caregiver-words.test.js` et `tests/short-session.test.js`.
10. **Déploiement Supabase réel — pour l'essentiel TERMINÉ (v6.44-v6.46).**
   Projet : "coluccdavid-coder's Project" sur Supabase (pas de vraies
   données dedans, juste du test/dev — confirmé par l'utilisateur).
   Résumé de tout ce qui s'est passé, dans l'ordre :
   - `SUPABASE_URL` et `SUPABASE_ANON_KEY` : d'abord collés
     manuellement par l'utilisateur, puis (v6.46) **intégrés en dur,
     de façon PERMANENTE, dans `js/storage.js`**, à sa demande
     explicite ("sinon je vais perdre le paramétrage à chaque zip").
     URL : `https://bwxlshedzpfaeszwktdx.supabase.co`. La clé `anon
     public` est volontairement conçue pour être publique côté client
     (protégée par la RLS, pas par le secret) — aucun souci à ce
     qu'elle soit dans le code livré, contrairement à une clé
     `service_role`.
   - **Découverte importante en cours de route** : ce projet Supabase
     contenait déjà les restes d'une AUTRE lignée de développement de
     ce même projet (probablement une session Claude antérieure à
     celle-ci), avec un système de quota "5 séances gratuites/jour"
     (`FREE_DAILY_SESSION_LIMIT`) jamais implémenté dans le code de
     cette conversation-ci. Ça avait laissé 3 versions surchargées de
     `upsert_patient()` (7, 8, et 10 paramètres). Les deux versions en
     trop ont été supprimées à la main avec l'utilisateur
     (`drop function ...`, signatures identifiées via
     `pg_get_function_identity_arguments`) avant de toucher au reste.
   - **Bug trouvé et corrigé dans `sql/schema.sql` (v6.44)** : le
     fichier n'était pas réellement rejouable à l'identique comme il
     le prétendait — `create policy` n'a pas d'équivalent
     "if not exists" en PostgreSQL. Corrigé en ajoutant un
     `drop policy if exists` devant chacune des 17 policies. **Si une
     erreur "policy ... already exists" ressurgit ailleurs**, même
     piège probable — chercher d'autres instructions DDL sans
     équivalent "if not exists".
   - **Effet de bord trouvé en intégrant les vraies clés (v6.46)** :
     plusieurs fichiers de test (`caregiver.test.js`, `journal.test.js`,
     `patient-summary.test.js`, `caregiver-words.test.js`,
     `knowledge-base.test.js`) supposaient que `js/storage.js` livré
     avait des identifiants vides par défaut, pour simuler le "mode
     navigateur" de façon fiable. Avec les vraies clés en dur, ces
     tests tentaient de vrais appels réseau (bloqués/muets dans cet
     environnement) et restaient bloqués indéfiniment sans message
     d'erreur clair. **Corrigé** : chaque chargeur de test qui veut le
     mode navigateur force maintenant `SUPABASE_URL`/`SUPABASE_ANON_KEY`
     à vide par substitution regex au moment de charger `storage.js`,
     plutôt que de compter sur le contenu réel du fichier. **Pour tout
     nouveau test futur qui charge `js/storage.js` brut en voulant le
     mode navigateur : appliquer systématiquement ce même correctif**
     (chercher `SUPABASE_URL = "[^"]*"` dans les tests existants pour
     voir le pattern exact).
   - **Ce qui reste, si l'utilisateur le demande** : nommer un·e
     administrateur·rice (point 3) pour que `admin.html` serve à
     quelque chose ; tout le reste de la configuration Supabase
     (Storage, Auth) a été fait avec l'utilisateur en direct pendant
     cette session.
11. **v6.49 — deux leçons à ne pas oublier, trouvées en testant l'app
    en vrai dans plusieurs langues (captures d'écran de l'utilisateur)** :
    - **Toute nouvelle carte/section ajoutée à `index.html` doit
      recevoir `data-i18n` dès sa création, dans les 9 langues
      complètes** — pas seulement en français avec l'intention de
      traduire "plus tard". Plusieurs cartes ajoutées lors de cette
      session (journal, espace aidant, bandeau du code de suivi)
      étaient restées 100% françaises malgré des langues actives
      différentes — corrigé avec 19 nouvelles clés, mais à surveiller
      pour toute future carte.
    - **`Prefs.setLang()` doit rester le seul endroit qui gère un
      changement de langue**, et il regénère maintenant
      `renderDashboard()` si le tableau de bord est affiché (sinon,
      tout ce qui est écrit en JS — `textContent`, pas `data-i18n` —
      reste figé dans l'ancienne langue jusqu'au rechargement complet
      de la page). Si un nouvel élément dynamique apparaît un jour et
      ne se traduit pas en changeant de langue sans recharger, ce
      correctif est probablement la première chose à vérifier.

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
tenue vocale + conversation guidée + **journal de ressenti libre**
(v6.41, texte libre, jamais analysé automatiquement) ; IA adaptative
avec répétition espacée, analyse d'erreurs, détection de fatigue, **8
profils cliniques** (broca/wernicke/anomique/globale/dysarthrie +
traumatisme crânien/ORL/Parkinson depuis v6.42) ; **mode "séance
courte"** (v6.41, 3 questions au lieu de la file complète, pour les
jours de fatigue) ; tableau de bord orthophoniste avec vraie
authentification Supabase (RLS, RPC security-definer, MFA/TOTP) ;
**espace aidant (v6.35, première version ; v6.43, mots personnalisés)**
— code d'invitation généré par le patient, vue en lecture seule
(progrès + conseils du jour à base de règles), un seul aidant par
patient pour l'instant, et depuis v6.43 l'aidant peut proposer des
mots liés à ce patient précis (prénoms, lieux familiers...), intégrés
automatiquement à ses exercices sans validation admin ;
**base de connaissances communautaire (v6.38)** — n'importe qui propose
un mot/une phrase via `contribuer.html`, validation par les comptes
admin sur `admin.html`, intégration automatique du vocabulaire validé ;
10 langues (fr complet avec dénomination étendue à 35 mots/niveau
depuis v6.42, en/es/it/pt/de/ar/tr/pl niveau "interface complète" —
tr et pl ajoutés en v6.39/v6.40, kabyle partiel — vocabulaire sourcé
uniquement, voir garde-fou n°3 ; l'espace aidant et le journal restent
français uniquement) ; mode hors-ligne (PWA/service worker) ; Ami, le
compagnon animé (SVG, phrases scriptées, PAS de LLM — garde-fou n°1)
qui explique le but de chaque exercice en y "arrivant" visuellement ;
structure gratuit/pro codée mais **paywall désactivé depuis la v6.58**
(`PAYWALL_ENABLED = false` dans `js/app.js` — décision explicite de
l'utilisateur après avoir testé le parcours de paiement en mode TEST
Stripe fin v6.54-v6.56 ; Stripe reste entièrement configuré côté
utilisateur : 4 tarifs, 2 Edge Functions, 6 secrets, webhook — prêt à
réactiver d'un coup en repassant le booléen à `true`) ; **résumé
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
   patients, ni pour générer du contenu d'exercice. Le moteur adaptatif,
   Ami, et le moteur de conseils de l'espace aidant
   (`js/caregiver-tips.js`) restent des règles explicites et testables,
   pas une boîte noire — précisément parce que le public est
   vulnérable. **Explicitement testé en v6.38** : l'utilisateur a
   proposé que "l'app apprenne" à partir des données patients pour
   générer automatiquement de nouveaux exercices — décliné avec
   explication, remplacé par `get_admin_trends()` (tendances agrégées
   signalées à un humain, jamais de contenu généré). Si cette demande
   revient sous une autre forme, le même garde-fou s'applique.
2. **Pas d'exercices de déglutition/dysphagie.** Risque réel de fausse
   route (aspiration), à surveiller uniquement en présentiel par une
   équipe soignante. Ce sujet ne doit jamais rentrer dans l'app.
3. **Contenu kabyle : uniquement du vocabulaire vérifié par source**
   (Glosbe, kabyle.com, Encyclopédie berbère, apprendrelekabyle.com).
   Jamais de grammaire/phrases inventées sans relecture native — les
   phrases complètes (complétion, compréhension, questionnaire de
   bilan) restent en français avec une note explicite plutôt que
   d'improviser. **Depuis la v6.38**, la relecture native a un vrai
   canal : `contribuer.html` → validation par un·e administrateur·rice
   sur `admin.html`. Ça ne change rien à la règle elle-même — une
   phrase reste hors de portée tant qu'un humain (pas une IA) ne l'a
   pas relue et approuvée.
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
   jamais la fiche patient complète. Administrateur (v6.38) = compte
   Supabase Auth, mais AUCUN droit automatique — seules les lignes
   ajoutées à la main dans `admins` (par le propriétaire du projet, via
   Supabase Table Editor, jamais depuis l'app) ont un accès ; un compte
   qui s'inscrit ne devient jamais admin tout seul. Mots personnalisés
   aidant (v6.43) = même code aidant que la lecture, mais un niveau de
   confiance assumé différemment : `add_caregiver_word` intègre le mot
   directement (pas de statut "pending"), parce que l'aidant a déjà un
   accès en lecture à ce dossier précis — décision explicite de
   l'utilisateur, pas un oubli de validation. Voir `sql/schema.sql`.
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

## Structure des fichiers (v6.43)

```
reparole-v6/
├── index.html                 ← app patient (dashboard, exercices, PWA, tarifs, accès aidant)
├── dashboard-ortho.html       ← espace ortho (auth réelle + MFA + tarifs)
├── aidant.html                ← espace aidant (v6.35 : vrai tableau de bord, plus une page d'attente)
├── mon-resume.html            ← v6.36 : résumé imprimable côté PATIENT (ton chaleureux, distinct du rapport ortho)
├── report.html                ← rapport imprimable côté ORTHO (ton clinique, réservé — voir RLS)
├── contribuer.html            ← v6.38 : proposer un mot/une phrase (public, lien discret en bas du dashboard patient)
├── admin.html                 ← v6.38 : validation des contributions + tendances agrégées (réservé aux comptes `admins`, pas de lien public)
├── manifest.json              ← PWA (nom, icônes, couleurs)
├── sw.js                      ← service worker (mode hors-ligne — CACHE_NAME à incrémenter à CHAQUE livraison JS/CSS ; v6.42 = reparole-v6-43)
├── icons/                     ← icônes PWA générées (192/512/apple-touch)
├── package.json               ← dépendance jsdom pour les tests
├── README.md                  ← historique détaillé de TOUTES les versions
├── RGPD.md, HEBERGEMENT.md    ← conformité + section PWA hors-ligne + procédure de nomination admin
├── bilan-exemple.txt          ← exemple de fichier pour tester l'import bilan
├── css/{style.css, ortho.css, companion.css}
├── js/
│   ├── prefs.js               ← préférences (dyslexie, langue, séance courte, menu déroulant)
│   ├── i18n.js                ← I18N_STRINGS pour fr/en/es/it/pt/de/ar/tr/pl/kab, LANGUAGES
│   ├── exercises.js           ← BANK (français, dénomination 35 mots/niveau depuis v6.42), + BANK_EXTEND()
│   ├── exercises-{en,es,it,pt,de,ar,tr,pl}.js ← BANK_XX, niveau complet (8 langues complètes)
│   ├── exercises-kab.js       ← BANK_KAB (kabyle, vocabulaire sourcé uniquement)
│   ├── exercises-sango.js     ← BANK_SG (sango, v6.59, dénomination uniquement — 22 mots)
│   ├── storage.js             ← navigateur OU Supabase + MFA + Stripe + accès aidant + journal (testé par simulation)
│   ├── stripe-edge-functions.md ← guide complet paiement Stripe
│   ├── learner.js             ← IA adaptative + analyse d'erreurs + 8 profils cliniques (CLINICAL_PROFILES)
│   ├── charts.js              ← SVG maison, zéro dépendance (réutilisé par l'espace aidant)
│   ├── assessment.js          ← bilan initial, traduit fr/en/es/it/pt/de/ar/tr/pl
│   ├── app.js                 ← moteur d'exercices + structure gratuit/pro (PAYWALL_ENABLED=true depuis v6.54) + tarifs + séance courte + journal + normalize() Unicode-aware
│   ├── conversation.js        ← conversation guidée, traduite 8 langues, verrou pro
│   ├── memory.js              ← jeu de mémoire, traduit
│   ├── phonation.js           ← tenue vocale, traduit
│   ├── dashboard-ortho.js     ← espace ortho + limite patients + MFA + tarifs + profils cliniques (menu généré dynamiquement)
│   ├── companion.js           ← Ami : compagnon animé + explications par exercice (COMPANION_PHRASES[lang].explain)
│   ├── caregiver.js           ← v6.35 : logique de la page aidant.html (login par code, rendu du tableau de bord)
│   ├── caregiver-tips.js      ← v6.35 : moteur de conseils du jour, règles explicites (pas de LLM), testé isolément
│   ├── admin.js                ← v6.38 : logique de admin.html (login, file de relecture, tendances agrégées)
│   ├── contribute.js           ← v6.38 : logique de contribuer.html (mapping type → kind/domaine, validation du formulaire)
│   └── reminders-edge-function.md
├── audio/kab/README.md        ← comment ajouter de vrais enregistrements kabyles
├── docs/kabyle-completion-draft.md ← phrases kabyles sourcées, non intégrées
├── tests/
│   ├── learner.test.js            ← 21 tests moteur adaptatif + 8 profils cliniques
│   ├── i18n-completeness.test.js  ← cohérence des 10 langues (dont tr/pl, listes requiredIn à jour)
│   ├── pwa-check.test.js          ← cohérence manifest/service worker
│   ├── plan-and-mfa.test.js       ← 21 tests : gratuit/pro (+ interrupteur PAYWALL_ENABLED), MFA, paiement (+ Customer Portal, v6.56)
│   ├── companion-explain.test.js  ← 105 tests : explications d'Ami (9 langues complètes x 11 types) + animation d'arrivée
│   ├── caregiver.test.js          ← v6.35 : 15 tests (moteur de conseils + parcours complet aidant.html en DOM simulé)
│   ├── patient-summary.test.js    ← v6.36 : 4 tests (mon-resume.html : code manquant/inconnu/valide, libellés d'exercices)
│   ├── knowledge-base.test.js     ← v6.38 : 17 tests (formulaire, stockage avec faux Supabase, fusion dans BANK_KAB)
│   ├── text-normalize.test.js     ← v6.39 : 9 tests (turc/polonais/allemand + cyrillique/grec préparés à l'avance)
│   ├── short-session.test.js      ← v6.41 : 5 tests (troncature à 3 items, contenu inchangé)
│   ├── journal.test.js            ← v6.41 : 9 tests (navigateur, cloud, validation, échappement HTML dans mon-resume.html)
│   ├── caregiver-words.test.js    ← v6.43 : 11 tests (navigateur, cloud, fusion dans les exercices du patient)
│   ├── feedback-and-lang-refresh.test.js ← v6.49 : 4 tests (confirmation visuelle bilan, rafraîchissement au changement de langue)
│   ├── free-tier-cap.test.js      ← v6.55 : 5 tests (plafond de 5 questions/session en compte gratuit)
│   ├── legal-compliance.test.js   ← v6.56 : 11 tests (pied de page, consentement CGV/rétractation, Customer Portal)
│   └── partial-lang-generalization.test.js ← v6.59 : 7 tests (kab/sg utilisent le même mécanisme, pas de code dupliqué)
└── sql/schema.sql             ← RLS réelle, fonctions RPC (patient + ortho + aidant + admin/contributions + journal + mots aidant), colonnes plan/stripe_*/caregiver_code

npm install && npm test  →  doit afficher 16 suites, toutes ✅ (274 tests), avant toute livraison
```

## Comment tester rapidement

```bash
python3 -m http.server 8000
```
Ouvrir Chrome (obligatoire pour les exercices vocaux) sur `localhost:8000`.

**⚠️ Avant toute livraison touchant une langue, un exercice, le bilan,
Ami, l'espace aidant, le résumé imprimable, la base de connaissances,
le journal, ou le mode hors-ligne** :
```bash
npm install && npm test
```
Doit afficher 16 suites toutes ✅ (21 + i18n/pwa + 21 + 107 + 15 + 4 + 17 + 9 + 5 + 9 + 11 + 4 + 5 + 11 + 7 = 274 tests).
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

## Prochaines pistes réelles (état au 8 juillet, après v6.43)

- **Configurer les vrais comptes Supabase + Stripe** — bloquant pour
  que l'espace ortho, l'espace aidant, la base de connaissances, et le
  paiement fonctionnent réellement (au lieu du mode navigateur local
  actuel).
- **Nommer au moins un·e administrateur·rice** (v6.38, procédure dans
  `HEBERGEMENT.md`) — sinon `admin.html` reste inutilisable et les
  contributions s'accumulent sans être relues.
- **Confirmation visuelle réelle** de la refonte visuelle (v6.25-v6.32),
  de l'animation d'Ami (v6.34), et des pages `aidant.html` (v6.35),
  `contribuer.html`/`admin.html` (v6.38) — demander à l'utilisateur un
  retour à jour si ce n'est pas déjà fait au moment de la reprise.
- **Base de connaissances (v6.38)** :
  - Étendre `mergeApprovedContent()` aux phrases (completion/
    comprehension) une fois qu'une première phrase kabyle est
    effectivement validée par un administrateur — actuellement seul le
    vocabulaire fusionne automatiquement, par choix (voir README).
  - Brancher `get_admin_trends()` dans `dashboard-ortho.html` aussi
    (la fonction SQL le permet déjà, seul `admin.html` l'utilise pour
    l'instant).
  - MFA pour les comptes admin, si le cercle de confiance s'élargit
    (pas fait en v6.38, jugé disproportionné pour quelques personnes).
- **Espace aidant : traduction** (actuellement français uniquement) —
  à faire si l'utilisateur le demande, suivre le même schéma que les
  autres écrans (I18N, repli français, notice si partiel).
- **Espace aidant : plusieurs aidants par patient** — décision
  utilisateur du 7 juillet : pas pour l'instant, volontairement. Ne pas
  relancer sans nouvelle demande explicite.
- **Résumé imprimable patient : traduction** (v6.36, `mon-resume.html`,
  actuellement français uniquement) — à faire si demandé, même schéma
  que les autres écrans.
- **Kabyle (v6.37, état à jour — voir aussi "Base de connaissances"
  ci-dessus pour le nouveau canal de contribution v6.38)** :
  - Vocabulaire "Nommer les images" niveaux 2-3 étendu (parité avec le
    français au niveau 2 désormais) — peut encore être étendu si
    demandé, même méthode (2+ sources indépendantes par mot).
  - `docs/kabyle-completion-draft.md` : phrases 1, 2 et 3 confirmées
    mot pour mot dans un corpus. Phrase 4 : forme attestée trouvée,
    mais à la 1ère personne du pluriel, pas au singulier utilisé dans
    le brouillon — recommandation notée dans le fichier. **Toujours
    bloqué sur la relecture native** avant toute intégration dans
    `js/exercises-kab.js` (garde-fou n°3).
  - Message prêt à envoyer à apprendrelekabyle.com (demande
    d'autorisation audio) préparé en v6.37 mais **pas encore envoyé
    par l'utilisateur** — à vérifier à la reprise si une réponse est
    arrivée.
  - Décision utilisateur toujours valide : pas de kabyle pour
    `memory.js`/`phonation.js`/conversation guidée pour l'instant — ne
    pas relancer sans nouvelle demande explicite.
- Vérifier la performance sur de vieux téléphones Android (public cible
  probable : personnes âgées, matériel parfois ancien).
- Surveiller les limites du plan gratuit Supabase si l'usage grandit.
- Clarifier si `ORTHO_FREE_PATIENT_LIMIT` (limite de 3 patients gratuits
  côté espace ortho, `js/dashboard-ortho.js`) doit aussi être désactivée
  comme le paywall patient — pas demandé explicitement jusqu'ici.
- **Paiement (v6.54) : tester le parcours complet avec une carte de
  test Stripe** (`4242 4242 4242 4242`, n'importe quelle date future,
  n'importe quel CVC) avant de passer en mode réel. Une fois validé,
  basculer Stripe en mode production et remplacer les 6 secrets
  Supabase (`STRIPE_SECRET_KEY`, les 4 `STRIPE_PRICE_*`,
  `STRIPE_WEBHOOK_SECRET`) par leurs équivalents live — les identifiants
  de tarif et le secret de webhook seront différents en mode réel,
  probablement à refaire une bonne partie de la config Stripe (nouveau
  webhook, nouveaux tarifs) plutôt que de simplement remplacer des
  valeurs.

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
