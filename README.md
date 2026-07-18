# ReParole Pro — version 6 (sécurité & conformité)

Cette version s'attaque à la liste des points bloquants identifiés avant
tout usage réel, listés dans les versions précédentes : authentification
réelle, RLS, comparaison multi-patients, et documentation RGPD/HDS.

**Résumé honnête** : tout ce qui est du **code** est fait et testé. Trois
choses restent **hors de portée du code** — je ne peux pas les faire à
votre place, elles demandent une décision ou une action humaine de votre
côté (détail plus bas) :
1. Choisir et contracter un **hébergement certifié HDS**.
2. **Signer/valider juridiquement** le cadre RGPD (je fournis des modèles,
   pas un avis juridique).
3. Faire **valider le contenu clinique** par un·e orthophoniste en exercice.

---

## Ce qui a été implémenté dans cette version

### 1. Authentification réelle pour les orthophonistes
Fini le simple "code d'accès" tapé au clavier. L'espace orthophoniste
(`dashboard-ortho.html`) utilise maintenant **Supabase Auth** : compte
email + mot de passe, avec création de compte, connexion, et session
persistée (pas besoin de se reconnecter à chaque visite).

### 2. Row Level Security (RLS) activée et réelle
`sql/schema.sql` active RLS sur **toutes** les tables et écrit des règles
concrètes (pas des exemples commentés comme en v4/v5) :
- Un orthophoniste ne peut lire/modifier que les patients qu'il a
  explicitement rattachés (`patient_assignments`).
- Les notes cliniques et rapports sont réservés à l'orthophoniste
  propriétaire.
- **Ceci corrige une vraie faille des versions précédentes** : avec RLS
  désactivé, la clé publique ("anon", visible dans le code envoyé au
  navigateur) permettait de lister TOUS les patients via l'API REST de
  Supabase, sans même connaître un code. Ce n'est plus possible.

### 3. Accès patient : fonctions RPC "security definer"
Les patients n'ont pas de mot de passe (choix assumé : un mot de passe
complexe serait un obstacle réel pour une personne aphasique). Comme RLS
ne peut décider un accès qu'à partir d'un jeton d'authentification — pas
d'un champ de formulaire — tout accès patient passe désormais par des
fonctions SQL dédiées (`get_patient`, `log_session`, etc.) qui exigent le
code exact. La table brute n'est plus accessible directement à la clé
publique.

Le **code de suivi** patient est maintenant **généré automatiquement**
(12 caractères aléatoires, ex. `p-k3f9a2q7d1x8`) plutôt que choisi
librement — donc impossible à deviner. Il est affiché une seule fois, au
moment de la création du dossier, avec un message clair pour que le
patient le note.

### 4. Vue d'ensemble multi-patients (orthophoniste)
La liste des patients (`ortho-list`) se trie maintenant par inactivité,
taux de réussite, ou nom — avec un repère visuel (🔴) pour les patients
sans séance depuis plus de 7 jours, pour prioriser qui recontacter.

### 5. Documentation RGPD et HDS
- `RGPD.md` : modèles de registre de traitement et de mentions
  d'information, **à faire valider par un juriste**.
- `HEBERGEMENT.md` : section dédiée à l'hébergement certifié HDS, avec
  des pistes concrètes et les limites de ce que Supabase standard
  couvre (ou pas — à reconfirmer directement auprès d'eux).

---

## ⚠️ Ce qui reste une limite assumée du modèle patient

Le patient n'a toujours pas de "vraie" authentification cryptographique —
juste un code long et aléatoire. C'est un compromis d'accessibilité
délibéré (voir point 3), mais ça reste plus faible qu'un compte avec mot
de passe. Concrètement :
- Le code doit être transmis au patient de façon sûre (en personne, pas
  par SMS non chiffré par exemple).
- Il n'y a pas d'expiration ni de limite de tentatives sur ce code
  aujourd'hui — à ajouter si vous voulez durcir encore ce point (ex. une
  fonction Postgres qui limite le nombre d'essais par IP/minute).
- Le bucket de stockage des photos personnelles (`patient-media`) doit
  rester accessible en lecture directe par URL pour fonctionner sans
  backend supplémentaire : l'URL d'une photo n'est pas devinable, mais
  n'est pas non plus protégée par un vrai contrôle d'accès. À garder en
  tête si des photos sensibles y sont ajoutées.

## Comment mettre en place l'authentification (Supabase)

1. Dans votre projet Supabase : **Authentication → Providers**, vérifiez
   qu'« Email » est activé.
2. **Authentication → Settings** : décidez si vous activez "Confirm
   email" (recommandé en production, optionnel en test — si activé,
   l'orthophoniste doit cliquer un lien reçu par email avant sa première
   connexion, ce que l'app gère déjà).
3. Exécutez `sql/schema.sql` dans **SQL Editor** (fonctionne même si vous
   veniez d'une base v3/v4/v5 — rien n'est perdu).
4. Créez le bucket **patient-media** dans **Storage**, en lecture
   publique (voir la limite ci-dessus).
5. Collez `SUPABASE_URL` et `SUPABASE_ANON_KEY` dans `js/storage.js`.

## Ce qui reste à faire — et pourquoi je ne peux pas le faire moi-même

| Point | Pourquoi c'est hors de portée du code |
|---|---|
| **Choisir et contracter un hébergement certifié HDS** | C'est une démarche commerciale/contractuelle avec un prestataire. Voir les pistes dans `HEBERGEMENT.md`. |
| **Valider juridiquement le RGPD** (base légale, durées de conservation, DPO éventuel) | Je ne suis pas juriste ; `RGPD.md` fournit des modèles à faire compléter et valider par un professionnel du droit ou la CNIL. |
| **Validation clinique du contenu** (exercices, catégorisation des erreurs, pertinence du profil clinique) | Je ne suis pas orthophoniste. Le contenu actuel est un point de départ raisonnable mais non validé — indispensable avant un usage avec de vrais patients, comme le rappelait déjà `SKILL_ReParole_Pro_v4.md`. |
| **Décider de la durée de conservation des données et l'automatiser** | Décision organisationnelle (voir `RGPD.md` section 3) — une fois décidée, je peux coder la tâche planifiée qui l'applique. |
| **Interface de suppression/export des données par le patient (droit RGPD)** | Faisable techniquement, mais je ne l'ai pas ajoutée car elle dépend des décisions ci-dessus (durée de conservation, processus de demande). Dites-moi si vous voulez que je la construise maintenant avec des valeurs par défaut raisonnables. |

---

## Structure (fichiers modifiés ou ajoutés en v6)

```
reparole-v6/
├── sql/schema.sql          ← RLS activée, policies réelles, fonctions RPC patient
├── js/storage.js           ← accès patient via RPC, vraie auth orthophoniste
├── js/app.js                ← parcours "créer un nouveau dossier" avec code sécurisé
├── js/dashboard-ortho.js   ← connexion Supabase Auth, tri multi-patients
├── index.html               ← formulaire de connexion mis à jour + bannière code
├── dashboard-ortho.html     ← formulaire email/mot de passe + tri des patients
├── RGPD.md                  ← NOUVEAU : modèles à faire valider
├── HEBERGEMENT.md           ← + section HDS
└── README.md                ← ce fichier
```

Tout le reste (moteur adaptatif v5, photos, conversation guidée, rapports,
notes, export CSV...) est inchangé par rapport à la v5 — voir son README
pour le détail de ces fonctionnalités.

---

## Ajout : option de langue kabyle (taqbaylit)

Un sélecteur Français / Taqbaylit est disponible sur l'écran de connexion
et sur le tableau de bord patient.

**Ce qui est traduit** : toute l'interface générale (boutons, libellés,
messages) et le niveau 1 de l'exercice "Nommer les images" (vocabulaire
simple : animaux, maison, soleil, voiture, poisson, fleur, pain).

**Ce qui reste en français, volontairement** :
- Les exercices vocaux (répétition, dénomination orale, fluence,
  conversation guidée) : la reconnaissance et la synthèse vocales du
  navigateur ne prennent pas en charge le kabyle à ce jour (vérifié
  auprès des langues listées par Google Speech-to-Text / Web Speech API).
  L'app l'indique clairement au patient plutôt que de simuler un support
  qui n'existe pas.
- Les niveaux 2-3 de "Nommer les images", ainsi que "Compléter la phrase"
  et "Comprendre la consigne" : ces exercices demandent des phrases
  complètes avec accords grammaticaux. Je ne suis pas locuteur natif du
  kabyle — plutôt que d'improviser des phrases potentiellement
  incorrectes dans un outil de rééducation du langage, j'ai préféré
  limiter la traduction à du vocabulaire simple et bien attesté, et
  laisser le reste comme point de départ pour une relecture native.

**⚠️ Avant tout usage clinique en kabyle** : tout le contenu traduit
(`js/i18n.js`, `js/exercises-kab.js`) doit être relu par une personne
kabylophone, idéalement un·e orthophoniste. Ces fichiers sont conçus pour
être corrigés ou complétés facilement, indépendamment du reste du code
(même logique que `BANK_EXTEND` déjà utilisée pour le contenu français).

**Mise à jour** : le vocabulaire de "Nommer les images" niveau 1 a été
vérifié mot par mot auprès de sources kabyles (kabyle.com, Glosbe,
l'Encyclopédie berbère) — voir les commentaires dans
`js/exercises-kab.js` pour le détail. Deux mots ont été corrigés suite à
cette vérification (pomme : `tuffaḥt` → `taḍeffut` ; fleur : `ajeǧǧig` →
`tajeǧǧigt`, forme singulière confirmée par kabyle.com). Les distracteurs
(mauvaises réponses proposées) n'ont pas tous été vérifiés individuellement
— seuls les mots à retrouver (réponses correctes) l'ont systématiquement
été.

**Bilan initial (`js/assessment.js`)** : l'écran d'accueil et l'écran
"Petit test" du bilan proposé aux nouveaux patients sont maintenant
traduits (boutons, textes de présentation). Les 3 items de dénomination
du bilan (chien 🐶, vélo 🚲, pluie 🌧️) le sont aussi, avec le même
vocabulaire vérifié par source (aqjun, avilu, ageffur — tous confirmés).
Le questionnaire de ressenti ("Vous arrive-t-il de chercher vos mots ?",
etc.) et les items de complétion/compréhension du bilan restent en
français : ce sont des phrases complètes, pas des mots isolés, donc la
même règle de prudence s'applique. Un message le précise sur l'écran
d'accueil du bilan quand le kabyle est sélectionné.

**Liste des exercices et cartes du tableau de bord** : les intitulés et
descriptions de tous les exercices, ainsi que les cartes "Vos photos",
"Conversation guidée" et "Rappels", sont maintenant reliés au système de
traduction. Seul l'intitulé "Nommer les images" a une vraie traduction
kabyle (*Semmi tugniwin*, vérifié : *semmi*=nommer, *tugna/tugniwin*
=image(s), sources : ancien dictionnaire franco-kabyle + Wiktionnaire +
Glosbe) — les autres n'ont volontairement PAS de traduction kabyle
enregistrée, donc ils s'affichent automatiquement en français (filet de
sécurité intégré à `js/i18n.js`, pas un bug). C'est cohérent avec le
contenu réellement disponible en kabyle une fois l'exercice ouvert.

## v6.1 — architecture multi-langues, son, et niveau 2

**Architecture multi-langues** (`js/i18n.js`, `LANGUAGES`) : le
sélecteur de langue se génère maintenant automatiquement à partir d'un
registre (`LANGUAGES = { fr:{...}, kab:{...} }`), au lieu de boutons
codés en dur dans le HTML. Ajouter une langue = ajouter une entrée dans
ce registre + un bloc de traductions dans `I18N_STRINGS` — aucune
modification du HTML nécessaire. Prêt pour l'arabe algérien ou le
tamazight standard, avec le même travail de vérification par source que
pour le kabyle.

**Son en kabyle : mécanisme, pas de synthèse inventée** (`js/exercises-kab.js`,
`audio/kab/`) : comme aucune synthèse vocale ne prend en charge le
kabyle, l'app peut désormais jouer un **vrai enregistrement audio** si
vous en déposez un dans `audio/kab/` (convention de nommage détaillée
dans `audio/kab/README.md`), avec un bouton "🔊 Écouter le mot" sur
l'exercice "Nommer les images" en kabyle. Si aucun enregistrement
n'existe pour un mot, l'app le dit clairement plutôt que de rester
silencieuse ou d'inventer une prononciation.

**Niveau 2 en kabyle** : 4 nouveaux mots vérifiés par source (porte
*tabburt*, télévision *tiliẓri*, rouge *azeggaɣ*, neige *adfel*),
disponibles quel que soit le niveau adaptatif du patient (comme pour le
niveau 1).

## v6.2 — nouvelle source (apprendrelekabyle.com) : niveau 3 + une correction

Vous avez partagé des liens vers la chaîne YouTube "Apprendre le Kabyle"
(Moh). Je ne peux pas regarder le contenu des vidéos elles-mêmes (pas
d'accès audio/vidéo), mais le site associé, **apprendrelekabyle.com**,
propose des listes de vocabulaire écrites — **avec de vrais
enregistrements audio natifs** ("Voix Française : Amélie S., Voix
Kabyle : Moh A."). C'est une ressource nettement meilleure que ce que je
peux produire moi-même pour le son.

- **Niveau 3 ajouté** : blanc (*amellal*), abeille (*tizizwit*), bœuf
  (*azger*) — vocabulaire confirmé par ce site.
- **Correction** : *tabexsist* signifie "figue", pas "abricot" comme je
  l'avais supposé — corrigé dans `js/exercises-kab.js` (il n'était
  utilisé que comme mauvaise réponse, donc sans impact sur la validité
  des exercices, mais la précision compte).
- **Piste pour le son** : plutôt que d'enregistrer vous-même chaque mot,
  il serait sans doute plus rapide de contacter l'auteur du site
  (coordonnées sur apprendrelekabyle.com) pour lui demander l'autorisation
  d'utiliser ou de lier ses enregistrements existants pour les mots déjà
  présents dans l'app. Je ne peux pas faire cette demande à sa place,
  mais je peux préparer un message si vous voulez.

**Brouillon "Compléter la phrase"** (`docs/kabyle-completion-draft.md`) :
4 phrases candidates, tirées telles quelles d'un corpus réel (pas
inventées), prêtes à être validées par une personne kabylophone puis
intégrées. Pas encore dans l'application — voir ce document pour le détail
et pourquoi les phrases complètes restent plus délicates que les mots isolés.

## v6.3 — écran "Avez-vous un bilan ?" et rappel sur "Vos ressentis"

Deux écrans du bilan initial n'étaient pas cohérents avec le reste :
- **"Avez-vous un bilan ?"** n'était tout simplement pas branché au
  système de traduction (oubli). Il reste volontairement en français
  même maintenant : c'est un texte sur la confidentialité d'un fichier
  médical (jamais envoyé, effacé aussitôt) — une nuance mal traduite ici
  serait plus grave qu'ailleurs. Un message l'explique désormais
  clairement plutôt que de laisser deviner pourquoi.
- **"Vos ressentis"** (le questionnaire de symptômes) affiche maintenant
  aussi ce rappel directement sur l'écran, pas seulement sur l'écran
  d'accueil précédent — pour que ce soit clair même si on arrive
  directement sur cet écran.

## v6.4 — cohérence du bilan (titre/consigne mélangés) + écran de résultat

Repéré en test : l'item de dénomination du bilan affichait les bonnes
réponses en kabyle, mais le titre ("Trouver le nom des objets") et la
consigne ("Quel est ce mot ?") autour restaient en français — un
mélange confus, pas voulu. Corrigé : titre et consigne suivent
maintenant la langue des réponses. Le bouton "Écouter" a aussi été
retiré sur cet écran en kabyle : la synthèse vocale du navigateur
aurait prononcé "D acu-t?" à la française, ce qui aurait été faux.

L'écran final du bilan ("Votre point de départ") n'était pas branché du
tout. Il l'est maintenant pour son texte général (remerciement,
libellés, bouton) ; les noms d'exercices et de niveaux (Doux/
Intermédiaire/Avancé) restent en français avec une note explicite,
plutôt que de mélanger un titre kabyle autour de valeurs françaises.

## v6.5 — correction d'un vrai bug : "Passer / valider manuellement"

Repéré en test : sur les exercices vocaux, cliquer sur "Passer / valider
manuellement" (visible quand le micro n'est pas disponible) comptait
**toujours** comme une réussite, même sans avoir rien dit — ce qui
faussait le taux de réussite affiché et pouvait faire monter le niveau
sans raison. Corrigé : le bouton est remplacé par deux actions honnêtes :
- **"✅ Je l'ai dit correctement"** — pour s'auto-valider après avoir
  vraiment essayé à voix haute, quand le micro ne peut pas confirmer.
- **"Je n'ai pas essayé →"** — enregistré comme une absence de réponse
  (catégorie "omission" dans l'analyse des erreurs), pas comme un
  succès déguisé.

## v6.6 — trois nouveaux exercices, à partir des documents partagés

Trois documents partagés ont inspiré ces ajouts : un mémoire d'orthophonie
(Clermont Auvergne, 2022) sur les troubles vocaux post-AVC, un article de
blog généraliste sur les exercices cérébraux post-AVC, et une brochure
hospitalière (Saint-Luc, Bruxelles) sur la prise en charge des AVC.

**Un garde-fou d'abord** : la brochure Saint-Luc porte sur la
**déglutition** (dysphagie) — un sujet à risque réel de fausse route,
qui se surveille en présentiel par une équipe soignante. Aucun exercice
de déglutition n'a été ajouté, et ce n'est volontairement pas prévu :
ce n'est pas un terrain pour une application en auto-usage.

**1. Répéter avec intonation** (`js/exercises.js`, type `intonation`) —
inspiré de la fiche "Répétition de phrases" du mémoire. Réutilise le
moteur vocal existant, avec un repère visuel (flèche) selon que la
phrase est une question, une description ou une exclamation.

**2. Jeu de mémoire** (`js/memory.js`) — inspiré de l'idée générale des
"jeux de mémoire" du blog (source généraliste, pas clinique). Aucune
voix : on regarde une séquence d'images, puis on la reproduit en
cliquant dans l'ordre. Intégré à l'apprentissage adaptatif comme les
autres exercices.

**3. Tenue vocale minutée** (`js/phonation.js`) — inspiré de la fiche
"Temps maximum phonatoire". C'est l'exercice le plus sensible des trois
puisqu'il s'agit d'un effort vocal actif, pas juste de reconnaissance :
- Aucune comparaison à une norme clinique n'est montrée au patient (les
  repères 15-20 sec / <15 sec pathologique de la fiche source restent
  dans ce README, pas dans l'interface).
- Aucun encouragement à "tenir plus longtemps" — la mesure est neutre.
- Consigne explicite de confort et d'arrêt en cas de gêne.
- **Volontairement pas comptabilisé dans les statistiques de réussite
  globales** : il n'y a pas de "bonne réponse" pour un temps de
  phonation, donc pas de score qui fausserait le taux de réussite
  affiché ailleurs dans l'app (même principe de prudence que la
  correction du bug "Passer / valider manuellement" en v6.5).
- Techniquement : pas de reconnaissance vocale ici, mais une mesure de
  volume via l'API Web Audio (détection du début/fin de la phonation),
  donc ça fonctionne même sur les navigateurs sans `SpeechRecognition`.

## v6.7 — avancement du brouillon kabyle "Compléter la phrase"

Pas de nouvel exercice intégré dans l'app cette fois : uniquement du
travail de vérification sur `docs/kabyle-completion-draft.md`, dans le
même esprit de prudence que le reste du contenu kabyle.

- Les phrases 1 (\"Aql-i tetteɣ tatteffaḥt\") et 2 (\"Tsekkreḍ tawwurt?\")
  ont été retrouvées **mot pour mot** comme exemples attestés sur les
  pages Glosbe correspondantes (pas juste \"quelque part sur le web\") —
  ça confirme qu'il n'y a pas d'erreur de recopie.
- Le distracteur non vérifié de la phrase 4 (\"tiɣerdayin\") a été
  remplacé par deux mots déjà vérifiés ailleurs dans l'app (tabburt,
  axxam) — il ne reste donc plus aucun mot non sourcé dans ce brouillon.
- **Ce qui manque encore, et que je ne peux pas vérifier moi-même** :
  une relecture native pour confirmer que le découpage en \"phrase à
  trou\" ne casse pas un accord grammatical (ex. \"yislem\" vs \"aslem\"
  selon l'état d'annexion, déjà signalé dans le brouillon). Tant que ce
  point n'est pas confirmé, ces phrases restent dans `docs/` et hors de
  `js/exercises-kab.js`, par cohérence avec la règle établie en v6.1-v6.6
  (\"jamais de grammaire/phrases inventées sans relecture native\").
- Prochaine étape logique une fois une relecture native disponible :
  copier les 4 lignes du tableau dans `BANK_KAB.completion`, puis faire
  la même démarche pour \"Comprendre la consigne\" (même méthode : partir
  de phrases réelles de corpus, jamais en inventer).

## v6.8 — Ami, le compagnon animé (aucune IA, phrases scriptées)

Personnage SVG animé (clignement des yeux, petit éclat qui flotte),
visible sur le tableau de bord et pendant les exercices, qui affiche une
phrase encourageante selon le contexte (accueil, bonne réponse, série de
réussites, erreur, fin de séance).

**Ce que ce n'est volontairement pas** : pas de LLM, pas de génération de
texte à la volée. Toutes les phrases d'Ami sont écrites à l'avance dans
`js/companion.js` (`COMPANION_PHRASES`), piochées au hasard dans une
liste selon le contexte — même logique de prudence que le reste de
l'app (garde-fou n°1). C'est entièrement lisible et vérifiable, comme le
moteur adaptatif.

Garde-fous respectés dans le contenu des phrases :
- Jamais de "bravo" sur un score de fin de séance bas — Ami reste
  chaleureux mais valorise l'effort/la présence, jamais une fausse
  réussite (cohérent avec le garde-fou n°5, cf. bug "Passer / valider
  manuellement" corrigé en v6.5).
- Jamais de ton négatif ou moralisateur après une erreur.
- Jamais de comparaison à une norme clinique (garde-fou n°6).

Fichiers ajoutés : `js/companion.js` (logique + banque de phrases + SVG),
`css/companion.css` (styles/animations, respecte `prefers-reduced-motion`
et le mode "lecture facilitée" qui désactive les animations).

Intégration minimale dans `js/app.js` : au chargement du tableau de bord,
au démarrage d'un exercice, après chaque réponse, et en fin de séance.
Rien d'autre n'a été modifié dans la logique existante.

**Prochaine étape prévue** : une fois l'anglais ajouté à `js/i18n.js`
(prochaine tâche de la feuille de route), étendre `COMPANION_PHRASES`
avec une clé `en` de la même façon — le mécanisme de repli sur le
français fonctionne déjà à l'identique de `I18N.t()`.

## v6.9 — correction du bug "Ami invisible" + suite de l'anglais

**Le bug signalé** : Ami ne s'affichait pas du tout après la livraison de
la v6.8. Cause trouvée : le SVG utilisait `fill="var(--accent)"` comme
**attribut** brut (pas via CSS) — cette syntaxe n'est pas résolue de
façon fiable sur tous les navigateurs, en particulier Safari/iOS, très
présent chez les patients. Correction : toutes les couleurs du
personnage passent maintenant par des classes CSS déclarées dans
`css/companion.css` (`.companion-body`, `.companion-eye`, etc.), une
méthode beaucoup plus robuste.

**Comment ça a été vérifié cette fois** : au-delà d'un simple contrôle
de syntaxe JS, le rendu réel du tableau de bord a été simulé dans un
DOM (jsdom) — chargement des scripts dans l'ordre réel, connexion
simulée, appel de `renderDashboard()`, puis lecture du HTML généré pour
`#companion-dashboard` afin de confirmer que le SVG et le message
s'y trouvent bien. **Cette simulation ne remplace pas un test dans un
vrai navigateur** (elle ne vérifie pas le rendu visuel final, les polices,
ni les vrais moteurs Safari/Chrome) — un test réel sur votre téléphone
reste la seule vérification définitive.

**Suite du travail sur l'anglais** (toujours en cours, pas encore complet
— voir plus bas) : correction de 4 oublis trouvés en vérifiant plus en
profondeur avant de qualifier l'anglais de "langue complète" :
- `AI.insight()` et `fatigueSignal()` (`js/learner.js`) restaient
  codés en dur en français alors qu'ils s'affichent au patient —
  maintenant traduits via I18N (avec repli français pour que
  `tests/learner.test.js` reste exécutable tel quel en Node, sans
  navigateur).
- Le message d'erreur de connexion ("Aucun dossier ne correspond...")
  n'était pas traduit.
- L'étiquette "Recommandé" avait sa clé de traduction déjà prête dans
  `i18n.js` mais n'était jamais utilisée dans `app.js` — mot codé en dur
  oublié.
- Les intitulés "Répéter avec intonation", "Jeu de mémoire" et "Tenue
  vocale" dans la liste d'exercices n'avaient jamais eu de `data-i18n`,
  même avant l'anglais.

**Ce qui reste explicitement en français, avec notice à l'écran plutôt
que mélange silencieux** (garde-fou "jamais de mélange silencieux de
langues") : le bilan initial (`js/assessment.js`) et la conversation
guidée (`js/conversation.js`) contiennent des phrases entières
(questionnaire, scénarios de dialogue), pas juste du vocabulaire — les
traduire correctement est un vrai travail de contenu, pas encore fait.
**L'anglais n'est donc pas encore une langue à 100 % complète**, contrairement
à ce qu'un commentaire de code affirmait de façon trop optimiste (corrigé).

## v6.10 — Ami marche, flotte, et entre en scène

Suite au retour "je ne le vois toujours pas" (le personnage était en
fait bien là, mais trop discret pour être identifié comme un
personnage) :

- **Agrandi** (64px → 84px) et son nom "Ami" s'affiche maintenant
  au-dessus de sa bulle de texte.
- **Jambes qui marchent sur place** en continu (deux ellipses qui
  pivotent en alternance).
- **Flottement doux** du corps (idle bob), plus prononcé quand il est
  ravi (série de réussites).
- **Entrée en scène** : à chaque nouveau message, Ami glisse et
  apparaît au lieu de changer de texte de façon statique — sans code
  de gestion d'état supplémentaire, puisque `render()` reconstruit déjà
  le HTML à chaque appel.
- Toujours 0 dépendance externe, toujours pur SVG/CSS, toujours aucune
  IA générative.

Vérifié via simulation DOM (jsdom) : structure HTML générée, classes de
mood dynamiques, présence des jambes et du nom — voir note v6.9 sur les
limites de cette vérification (ne remplace pas un test dans un vrai
navigateur).

## v6.11 — Ami donne des conseils (pas médicaux), et le vrai streak

**Attention, pas de conseils cliniques** : suite à une demande d'ajouter
des "conseils", j'ai distingué explicitement ce qui est acceptable
(astuces sur l'usage de l'app, motivation, régularité) de ce qui ne
l'est pas sans validation professionnelle (conseils sur la récupération
post-AVC elle-même). Seule la première catégorie a été ajoutée.

- **Ami pointe vers les conseils du moteur adaptatif** : quand
  `AI.insight()` a un vrai conseil (pas le texte générique "je découvre
  votre profil"), Ami dit une phrase courte qui y renvoie plutôt que de
  dupliquer le texte — un seul endroit qui explique le raisonnement.
- **Astuces pratiques génériques** (rythme, pauses, régularité) — jamais
  de conseil médical, voir les commentaires de garde-fou dans
  `js/companion.js`.
- **Vrai bug corrigé au passage** : le compteur "jours d'affilée" du
  tableau de bord ne se recalculait en fait jamais — il gardait la
  valeur fixée à la création du dossier. Il se base maintenant sur
  `last_seen` : +1 si connecté la veille, remis à 1 après une pause de
  plus d'un jour, inchangé si déjà vu aujourd'hui.
- **Retour après une pause, sans culpabiliser** : si le patient revient
  après plusieurs jours d'absence, Ami dit un message d'accueil chaleureux
  spécifique — jamais de reproche ni de "ça fait longtemps". L'idée est
  d'aider à reprendre l'habitude, pas de culpabiliser quelqu'un qui a
  probablement d'autres priorités de santé.

Vérifié par simulation DOM (jsdom) avec de vraies dates : connexion la
veille (streak +1), connexion après 5 jours (streak remis à 1 + message
de retour), et présence du conseil pointé quand un insight réel existe.

## v6.12 — la bulle d'Ami ne ressemble plus à un champ de saisie

Retour d'un patient : il a essayé d'écrire dans la bulle d'Ami. En
regardant le CSS, la bulle avait exactement le même style que les
champs de saisie du formulaire de connexion (`field input` dans
`css/style.css`) — fond blanc, bordure fine grise, coins arrondis.
Confusion tout à fait compréhensible.

Corrigé dans `css/companion.css` :
- Fond teinté (vert clair, cohérent avec Ami) au lieu de blanc uni.
- Plus de bordure grise façon champ de formulaire.
- Petite pointe façon bulle de bande dessinée, qui désigne Ami — pour
  qu'on comprenne immédiatement "c'est lui qui parle", pas "c'est à moi
  d'écrire ici".
- Texte non sélectionnable (`user-select:none`) pour ne plus donner
  l'impression d'un champ éditable.

## v6.13 — corrections kabyle : police et notice manquante

Suite au retour "l'option kabyle ne fonctionne pas entièrement" :

- **Confirmé volontaire** : "Jeu de mémoire" et "Tenue vocale" restent
  en français — aucune traduction kabyle sourcée et fiable disponible
  pour ces termes pour l'instant (même règle de prudence que le reste du
  contenu kabyle, voir `js/exercises-kab.js`).
- **Corrigé** : l'encadré "Votre assistant a appris" restait en français
  sans aucune explication (contrairement au bilan initial, qui a déjà
  cette notice) — ajouté.
- **Possible bug de police** : le badge "TAƔECT" (voix, en kabyle)
  s'affichait "TAYECT" sur la capture reçue — la police 'Source Sans 3'
  ne couvre peut-être pas bien le Ɣ berbère à cette taille. Ajout de
  'Noto Sans' en repli, uniquement en mode kabyle (`html[lang="kab"]`),
  cette police ayant une bien meilleure couverture Unicode pour les
  caractères latins étendus (Ɣ ɣ ḥ ɛ ṛ ṣ ṭ ẓ ḍ ǧ). **À confirmer** une
  fois testé sur un vrai appareil — je n'ai pas pu vérifier le rendu
  visuel exact moi-même.

## v6.14 — l'animation de marche ne se déclenchait pas partout

Retour : Ami ne bougeait pas du tout chez le patient (pas de marche
visible). Cause probable : les animations des jambes/yeux utilisaient
`transform-box: fill-box` pour tourner autour de leur propre point
d'ancrage — cette propriété CSS a un **support inégal selon les
navigateurs**, notamment sur des téléphones plus anciens (justement le
public visé par l'app).

Corrigé : origine de rotation fixée en **coordonnées SVG explicites**
(ex. `transform-origin: 40px 86px` pour la jambe gauche, correspondant
exactement à son point de dessin dans `js/companion.js`), une méthode
supportée bien plus largement, sans dépendre de `fill-box`. Le
flottement de l'éclat (translation pure) ne dépendait déjà d'aucune
origine particulière — nettoyé au passage.

**Autres pistes si ça ne suffit pas** : l'app respecte volontairement
`prefers-reduced-motion` (réglage d'accessibilité du système/téléphone)
et le mode "lecture facilitée" de l'app elle-même — dans les deux cas,
toute animation est intentionnellement coupée. Si le patient a l'un de
ces réglages actif, Ami reste immobile par design, pas par bug.

## v6.15 — animation des jambes/yeux réécrite en SVG natif — ✅ CONFIRMÉ

**Mise à jour finale** : le mouvement d'Ami a été confirmé visuellement
par l'utilisateur après plusieurs jours d'aller-retours. La cause du
blocage n'était en réalité **pas le code** au-delà du vrai bug `ry` sur
`<circle>` (voir plus bas) : Netlify avait épuisé ses crédits et
bloquait silencieusement les redéploiements (aucun message clair côté
utilisateur), ce qui fait qu'aucune des corrections successives
(v6.9.1, v6.14) n'a pu être testée dans son état réel avant celle-ci. Le
premier essai de bascule vers GitHub Pages a aussi échoué une fois
(dossiers `css/` et `js/` absents du dépôt suite à un upload web
incomplet — l'interface de GitHub ne préserve pas toujours la structure
des dossiers en drag-and-drop). Une fois ces deux problèmes d'hébergement
réglés, le correctif SMIL ci-dessous a fonctionné du premier coup.

**Leçon pour la suite** : en cas de bug visuel qui semble "résister" à
plusieurs correctifs qui semblent tous corrects sur le papier, vérifier
en priorité que le déploiement testé correspond réellement au code livré
(hébergeur en panne, cache, upload incomplet) avant de continuer à
modifier le code.

Après plusieurs allers-retours (v6.9.1, v6.14) sans succès confirmé —
et après avoir éliminé "réduire les animations" comme cause (vérifié
avec le patient : ce réglage était bien désactivé) — changement
d'approche complet plutôt que d'empiler des correctifs incertains :

- Les animations des jambes, des yeux et de l'éclat passent de CSS
  (`transform` + `transform-origin` sur des formes SVG, historiquement
  capricieux selon les moteurs de rendu) à de **l'animation SVG native**
  (`<animateTransform>` / `<animate>`, la spécification SMIL) —
  un mécanisme bien plus ancien, largement supporté même sur d'anciens
  navigateurs Android.
- Le point de rotation des jambes est passé **explicitement en
  paramètre** (`rotate(-14 40 86)`), donc plus aucune ambiguïté possible
  sur l'origine — contrairement à `transform-origin`, source de deux
  bugs différents dans les versions précédentes.
- **Vrai bug corrigé au passage** : le clignement des yeux utilisait
  l'attribut `ry` sur un `<circle>` — qui n'existe pas sur cette forme
  (seules les `<ellipse>` en ont un). Les yeux sont maintenant des
  ellipses, l'animation de clignement fonctionne réellement.
- L'accessibilité (réduire les animations / mode lecture facilitée) est
  maintenant vérifiée **en JavaScript** avant de générer le SVG (les
  media-queries CSS n'ont aucun effet sur les animations SMIL) : si l'un
  des deux est actif, les balises d'animation ne sont simplement pas
  ajoutées.

Vérifié par simulation DOM : présence des 3 `<animateTransform>` et 2
`<animate>` attendus dans le HTML généré, et de la classe
`companion-animated`. **Rendu visuel toujours à confirmer par un test
réel** — je n'ai pas d'accès à un navigateur graphique dans cet
environnement (Playwright/Chromium bloqués par les restrictions
réseau du bac à sable).

## v6.16 — jeu de mémoire et tenue vocale traduits en anglais

Retour : en anglais, le jeu de mémoire restait entièrement en français
(titre, consignes, feedback). Vérification faite : `js/memory.js` et
`js/phonation.js` n'avaient effectivement jamais été reliés à I18N,
contrairement aux exercices principaux. Contrairement au kabyle, ce
texte est simple (interface, pas de grammaire à risque) — traduit
directement en anglais, y compris les phrases de sécurité de la tenue
vocale (traduites avec le même soin que l'original, pas paraphrasées).

Avec ceci, l'anglais couvre maintenant : l'interface générale, les 7
exercices principaux (denomination, complétion, compréhension,
répétition, dénomination orale, fluence, intonation), le jeu de mémoire,
et la tenue vocale. **Restent en français quelle que soit la langue** :
le bilan initial (`js/assessment.js`) et la conversation guidée
(`js/conversation.js`) — contenu de phrases entières, pas de simples
libellés d'interface, donc un vrai travail de traduction plus tard.

## v6.17 — le bilan initial traduit en anglais

Retour : à la création d'un nouveau dossier, le bilan initial
(`js/assessment.js`) restait entièrement en français, y compris en
anglais. C'était le plus gros morceau encore non traduit.

Contrairement au kabyle, l'anglais ne pose pas de risque grammatical —
traduit intégralement :
- Les 3 domaines évalués (`ASSESS_DOMAINS` → `domainLabel()`)
- Le questionnaire de ressenti (`SYMPTOM_QUESTIONS_EN`, mêmes clés et
  valeurs que le français pour que le score reste comparable)
- Les 9 items du bilan rapide (`ASSESS_ITEMS_EN`)
- Tous les textes d'interface (accueil, dépôt de bilan, résultat final)
- Réutilisation des clés déjà traduites ailleurs (`I18N.t('denom_prompt')`,
  `levelName()`) plutôt que de dupliquer une traduction qui existait déjà

Vérifié par simulation DOM sur tout le parcours (accueil → dépôt de
bilan → questionnaire → bilan rapide → résultat final), en anglais et
en français (non-régression confirmée sur le français).

**Décision explicite de l'utilisateur** : pas de version kabyle de
`memory.js`/`phonation.js` pour l'instant (voir plus haut) — ne pas
relancer ce chantier sans nouvelle demande. Le bilan kabyle reste dans
son état partiel existant (dénomination seulement, le reste avec repli
français et notice, inchangé par cette mise à jour).

## v6.18 — menu déroulant + 5 nouvelles langues (ES/IT/PT/DE/AR)

**Interface** : le sélecteur de langue passe de boutons (illisible à 8
langues) à un vrai menu déroulant (`<select>`), toujours généré
automatiquement depuis `LANGUAGES` dans `js/i18n.js` — ajouter une
langue reste une seule modification, sans toucher au HTML.

**5 nouvelles langues, niveau "interface complète"** (comme l'anglais
au départ) : espagnol, italien, portugais, allemand, arabe. Couvrent :
- L'interface générale (connexion, tableau de bord, statistiques)
- La liste des exercices (titres et descriptions)
- Le jeu de mémoire et la tenue vocale (texte de sécurité traduit avec
  le même soin que l'original)
- Les phrases d'Ami (`js/companion.js`)
- Les messages du moteur adaptatif (paliers de niveau, fatigue, ce que
  l'IA a appris)

**Arabe** : `dir:'rtl'` déjà pris en charge par le mécanisme existant
(`I18N.apply()` bascule `<html dir="...">` automatiquement). Vérifié
par simulation DOM ; **le rendu visuel RTL réel (alignement des boutons,
mise en page générale) reste à confirmer sur un vrai navigateur** — je
ne peux pas le juger depuis une simulation de structure seule.

**Ce qui n'est PAS encore traduit dans ces 5 langues** (comme pour
l'anglais à ses débuts) : le contenu des exercices eux-mêmes (mots à
deviner, phrases à compléter) et le bilan initial. Ces éléments
retombent automatiquement en français pour l'instant, sans mélange
silencieux (le mécanisme de repli de `I18N.t()` s'applique). Prochaine
étape si demandé : les banques d'exercices (`BANK_ES`, `BANK_IT`,
`BANK_PT`, `BANK_DE`, `BANK_AR`) et `assessment.js`, langue par langue,
comme cela a été fait pour l'anglais.

## v6.19 — exercices et bilan complets pour ES/IT/PT/DE/AR

Suite à la demande explicite de couvrir chaque langue entièrement (pas
seulement l'interface) : les 5 langues ajoutées en v6.18 ont maintenant
leur propre contenu d'exercices et de bilan initial, au même niveau que
l'anglais.

- **`js/exercises-es.js`, `-it.js`, `-pt.js`, `-de.js`, `-ar.js`** :
  même structure que `exercises-en.js` (7 types d'exercices × 3
  niveaux), mêmes images/emojis pour rester cohérent, vocabulaire
  traduit. Sélection automatique déjà généralisée dans `js/app.js`
  depuis la v6.9 (`window['BANK_'+lang.toUpperCase()]`) — aucune
  modification nécessaire côté moteur d'exercices.
- **`js/assessment.js`** : `domainLabel()`, `symptomQuestions()` et
  `assessItems()` généralisés (avant : anglais codé en dur) pour
  chercher automatiquement `ASSESS_DOMAIN_LABELS_XX`,
  `SYMPTOM_QUESTIONS_XX`, `ASSESS_ITEMS_XX` selon la langue active.
  Ajout du contenu correspondant pour les 5 langues, plus les textes
  d'interface du bilan (`ASSESS_STRINGS`).

**Arabe** : vocabulaire et grammaire standard (arabe classique/moderne),
avec attention portée aux accords de genre. Comme pour les autres
langues largement dotées de ressources, la confiance grammaticale est
bonne — mais une relecture native reste recommandée avant un usage
clinique réel, comme le rappelle le disclaimer déjà présent dans l'app
("ne remplace pas un bilan orthophonique").

Vérifié par simulation DOM : bilan complet (accueil → résultat) et
lancement d'un exercice de dénomination, dans les 5 langues.

**Kabyle non concerné** par cette mise à jour — reste dans son état
existant (dénomination sourcée, reste en français avec repli
documenté), conformément aux décisions précédentes de l'utilisateur.

## v6.20 — vrai bug corrigé : le bilan retombait en français pour les 5 langues

Retour (capture d'écran, mode arabe) : les questions du questionnaire de
ressenti et les libellés de domaine du bilan restaient en français,
malgré une interface arabe par ailleurs correcte. Et le compteur
affichait "4 / 1" au lieu de "1 / 4".

**Cause réelle, pas juste un oubli de contenu** : `domainLabel()`,
`symptomQuestions()` et `assessItems()` cherchaient les tables de
traduction via `window['ASSESS_ITEMS_'+lang]` etc., mais ces tables
étaient déclarées avec `const` — qui, contrairement à `window.X = ...`,
**ne s'attache jamais à l'objet `window`**, même dans le même fichier.
Ces recherches renvoyaient donc toujours `undefined`, et retombaient sur
le français, silencieusement. **Ce bug touchait les 5 langues (ES, IT,
PT, DE, AR), pas seulement l'arabe** — l'arabe l'a simplement rendu
visible en premier, car le contraste avec une interface RTL par
ailleurs correcte saute plus aux yeux.

Corrigé : toutes ces tables (`ASSESS_DOMAIN_LABELS_*`,
`SYMPTOM_QUESTIONS_*`, `ASSESS_ITEMS_*`) déclarées via `window.X = ...`,
comme le fait déjà `window.BANK_XX` dans les fichiers d'exercices
(`exercises-en.js` etc.), qui n'avaient pas ce problème.

**Deuxième correctif, RTL** : le compteur "1 / 4" s'affichait inversé en
arabe ("4 / 1") — un chiffre-slash-chiffre isolé dans un contexte
`dir="rtl"` peut être réordonné visuellement par l'algorithme
bidirectionnel du navigateur. Corrigé en forçant `dir="ltr"` sur ces
compteurs spécifiquement (bilan et exercices), sans toucher au reste de
la mise en page RTL.

Vérifié par simulation DOM : questions de ressenti et libellés de
domaine corrects dans les 5 langues, compteur affiché "1 / 4" partout.

## v6.21 — filet de sécurité automatique pour les traductions

Après plusieurs bugs de traduction passés inaperçus jusqu'à ce qu'un
patient les voie à l'écran (v6.20 notamment), un script qui vérifie
automatiquement la cohérence de toutes les langues, à lancer **avant**
toute livraison touchant à une langue :

```
npm install
npm test
```

Ce que `tests/i18n-completeness.test.js` vérifie :
- Pour chaque langue, toutes les clés de `I18N_STRINGS.fr`,
  `ASSESS_STRINGS.fr` et `COMPANION_PHRASES.fr` existent aussi dans
  cette langue (sauf 2 exceptions documentées, spécifiques au kabyle).
- Pour EN/ES/IT/PT/DE/AR : présence réelle de `window.BANK_XX`,
  `window.ASSESS_ITEMS_XX`, `window.SYMPTOM_QUESTIONS_XX`,
  `window.ASSESS_DOMAIN_LABELS_XX` — et surtout, que ce sont de
  **vraies propriétés de `window`**, pas des `const` orphelins
  invisibles pour le code qui les cherche dynamiquement (exactement le
  bug de la v6.20).
- Pour chaque banque d'exercices, que les 3 niveaux de chaque type
  d'exercice sont bien remplis.

**Testé pour de vrai** : un bug a été volontairement réintroduit
(`window.ASSESS_ITEMS_ES` remis en `const`), le script l'a détecté
correctement, puis a confirmé la correction une fois réparé.

**Bonus trouvé en cours de route** : `I18N_STRINGS` et `ASSESS_STRINGS`
avaient exactement la même fragilité que le bug v6.20 (déclarés en
`const`, jamais exposés sur `window`) — sans conséquence visible
jusqu'ici par pure chance, puisque seules des fonctions du même fichier
les utilisaient. Corrigé par précaution (`window.I18N_STRINGS = ...`,
`window.ASSESS_STRINGS = ...`), avant que ça ne devienne un vrai bug.

## v6.22 — la conversation guidée traduite en 6 langues

Dernier gros morceau non traduit : `js/conversation.js` (3 mises en
situation — médecin, café, téléphone — 4 échanges chacune). Traduit en
EN/ES/IT/PT/DE/AR, même structure que le reste (`window.CONV_SCENARIOS_XX`,
sélection automatique). Le kabyle n'est pas concerné (scénarios de
dialogue entiers, hors de portée sans relecture native, même règle que
le reste du kabyle).

Corrigé au passage :
- La reconnaissance vocale de la conversation restait câblée en
  `fr-FR` — oubli du passage multilingue. Utilise maintenant
  `I18N.speechLocale()` comme le reste de l'app.
- La notice "conversation non traduite" s'affichait pour *toutes* les
  langues non françaises — elle ne s'affiche plus que pour celles qui
  n'ont vraiment pas de contenu (le kabyle).

**Le filet de sécurité (v6.21) a servi dès la première utilisation** :
il a détecté que les clés d'interface de la conversation (`conv_*`)
avaient été oubliées pour le portugais — corrigé immédiatement, avant
toute livraison. Sans cet outil, ça serait probablement passé inaperçu
jusqu'à ce qu'un patient le voie, comme les fois précédentes.

Vérifié aussi par un vrai parcours simulé (pas seulement la structure) :
menu → démarrage d'un scénario → bonne réponse → progression à l'étape
suivante, dans les 6 langues.

## v6.23 — mode hors-ligne + installation sur l'écran d'accueil (PWA)

Dernière étape de la feuille de route initiale : l'app peut maintenant
s'installer comme une icône sur le téléphone et fonctionner sans
connexion internet.

**Nouveaux fichiers** :
- `manifest.json` — nom, icônes, couleurs, mode d'affichage
- `sw.js` — service worker : met en cache les fichiers de l'app pour
  qu'elle continue de fonctionner hors-ligne après une première visite
- `icons/` — icônes générées aux formats requis (192×192, 512×512,
  512×512 "maskable" pour Android, 180×180 pour iOS), reprenant le
  logo existant (rond vert + point orange)

**Ce que ça change concrètement** :
- Mode navigateur (sans compte cloud) : fonctionne entièrement
  hors-ligne, exercices compris, après une première visite.
- Mode cloud (compte Supabase) : l'interface se charge même
  hors-ligne, mais connexion/sauvegarde restent impossibles sans
  réseau (pas de synchronisation différée pour l'instant).

**Vérifié sans navigateur** (voir limite plus bas) : JSON du manifest
valide, tous les fichiers listés dans le cache existent réellement
(un seul manquant ferait échouer tout le cache au premier chargement),
et — nouveau test ajouté au filet de sécurité — tous les fichiers
CSS/JS chargés par `index.html` sont bien inclus dans le cache
hors-ligne (testé pour de vrai : un fichier volontairement oublié a
été détecté correctement).

**Non testé sur un vrai appareil** — je n'ai pas accès à un navigateur
graphique dans cet environnement (même limite que pour l'animation
d'Ami). Voir `HEBERGEMENT.md`, section "Mode hors-ligne", pour la
marche à suivre précise pour tester sur Android et iPhone.

**Point d'attention pour les prochaines mises à jour** : le fichier
`sw.js` a un numéro de version (`CACHE_NAME`) qui doit être incrémenté
à chaque changement notable de l'app, sinon les téléphones continueront
de servir une ancienne version mise en cache.

## v6.24.1 — corrections suite à l'audit "7 rôles"

Un cadre de gouvernance en 7 rôles (Architecte, Développeur Senior,
Orthophoniste Virtuel, UX/Accessibilité, Produit, Qualité, Visionnaire)
a été appliqué en rétro-audit sur la v6.24. 3 manques corrigés :

1. **Développeur Senior / Qualité** : la structure gratuit/pro et la
   double authentification n'avaient qu'un test jetable, jamais
   sauvegardé. Nouveau fichier permanent `tests/plan-and-mfa.test.js`
   (16 vérifications, ajouté à `npm test`) — simule un faux client
   Supabase pour tester la logique MFA sans dépendre d'un vrai projet.
   **En l'écrivant, le même piège de portée JS que plusieurs fois dans
   cette session s'est reproduit une fois de plus** (manipuler `user`
   depuis un contexte de test séparé ne mute pas le vrai `let user`
   interne à `app.js`) — corrigé en exposant des fonctions d'aide
   (`window.__testSetUser`, etc.) déclarées DANS le même fichier que
   `user`, seule façon fiable de le faire.
2. **UX/Accessibilité** : les exercices verrouillés (compte gratuit)
   n'avaient aucun signal visuel avant d'être cliqués. Nouveau badge
   "🔒 Pro" affiché directement sur le tableau de bord
   (`updateExerciseLocks()` dans `js/app.js`), mis à jour en direct au
   changement de langue. Pas de badge pour le verrou de quota
   journalier (transitoire, un badge permanent serait trompeur).
3. **Produit** : la question "conversation guidée + exercices vocaux
   avancés doivent-ils rester payants ?" a été posée explicitement —
   réponse de l'utilisateur : oui, gardés payants pour la viabilité du
   projet. Décision actée, aucun changement de code nécessaire ici.

## v6.25 — refonte visuelle

Nouvelle direction visuelle : l'ancienne palette (fond crème `#f4f1ea`
+ accent terracotta `#d98e48`) est presque exactement la combinaison la
plus généralement produite par défaut pour ce type d'app — un choix par
défaut, pas un choix pour ReParole en particulier.

**Nouvelle palette, pensée pour le sujet** — la rééducation comme une
"repousse" tranquille, pas un chantier clinique :
- Fond lin chaud (`#efead9`) plutôt que crème pur
- Vert forêt approfondi (`#26594b`) — la couleur qu'Ami avait déjà,
  enrichie plutôt que changée, pour ne pas perdre la reconnaissance
  déjà construite
- Doré chaud (`#9c6b2e`) à la place du terracotta — garde la chaleur,
  moins vu ailleurs
- Tous les contrastes texte/fond vérifiés à la main (WCAG AA, ≥4.5:1
  pour le texte normal) avant de choisir les teintes finales

**Un seul geste signature**, pour ne pas surcharger : les grandes
cartes (connexion, tableau de bord, question) ont un coin organique
asymétrique (`--radius-organic: 30px 14px 30px 14px`) au lieu d'un
rectangle uniformément arrondi. Les éléments interactifs (boutons,
champs, choix) restent réguliers — mélanger les deux aurait brouillé
la lisibilité plutôt que d'ajouter du caractère.

**Autres raffinements** :
- Boutons principaux avec un retour tactile (ombre qui "s'enfonce" au
  clic) — discret, pas un gadget, sert à rendre les zones cliquables
  plus évidentes.
- Cartes du tableau de bord qui apparaissent en cascade légère au
  chargement (respecte `prefers-reduced-motion`).
- La bulle d'Ami passe en italique (Fraunces) pour distinguer
  visuellement "ce qu'Ami dit" du reste de l'interface — **désactivé
  en mode lecture facilitée** (correctif au passage : la règle
  "pas d'italique en dyslexie" ne visait que les balises `<i>/<em>`,
  pas les styles CSS directs comme celui-ci — étendue).
- Couleurs codées en dur restantes (`#fbfaf6`, `#f6e4e0`, etc.)
  remplacées par de vraies variables (`--surface-soft`, `--error-soft`)
  pour que toute future évolution de palette n'ait qu'un seul endroit
  à modifier.

**Portée** : uniquement `css/style.css`, `css/ortho.css`,
`css/companion.css` — aucun fichier HTML ni JS modifié. Comme tout
passe par des variables CSS déjà en place, ça se propage automatiquement
à tous les écrans (connexion, tableau de bord, exercices, espace
orthophoniste, rapport imprimable) sans avoir eu à toucher à leur
structure.

**Non vérifié visuellement** — je n'ai pas accès à un navigateur
graphique dans cet environnement (même limite que pour l'animation
d'Ami en début de session). Vérifié à la place : équilibre des
accolades CSS, absence de variable CSS orpheline, contrastes calculés
à la main, et les 16 tests automatisés toujours au vert. **Un test
visuel réel une fois déployé reste indispensable** avant de considérer
que c'est fini.

## v6.26 — paiement réel (Stripe)

Suite à la demande explicite de l'utilisateur : un vrai parcours de
paiement, avec un bouton "Passer à Pro" visible sur les tableaux de
bord (patient et orthophoniste), une page de tarification avec
explications claires, et Stripe comme processeur (carte bancaire +
PayPal intégré — un seul SDK à intégrer pour les deux moyens de
paiement).

**Tarifs retenus** (validés avec l'utilisateur) :
- Patient : 2,99 €/mois ou 19,99 €/an (~1,67 €/mois)
- Orthophoniste : 9,99 €/mois ou 79 €/an (~6,60 €/mois)

**Pourquoi pas Oney** : c'est un partenariat commercial (dossier,
SIRET, vérifications), pas une simple inscription — disproportionné
pour un abonnement à quelques euros. À reconsidérer si le projet
grandit.

**Ce qui est fait** :
- Écrans de tarification (`#pricing` dans `index.html`, `#ortho-pricing`
  dans `dashboard-ortho.html`) avec explications de ce que Pro change
  concrètement, traduits dans les 7 langues (fr + 6, kabyle non
  concerné comme le reste des écrans complexes).
- Bouton "Voir les offres" visible en permanence sur les deux tableaux
  de bord (masqué automatiquement si le compte est déjà pro), en plus
  du lien déjà présent sur l'écran de verrou.
- `js/storage.js` : `createCheckoutSession()` — appelle une Supabase
  Edge Function, ne contient aucune clé secrète (sécurité : la
  correspondance entre l'offre choisie et le vrai tarif Stripe se fait
  côté serveur, jamais dans le code envoyé au navigateur).
- **`js/stripe-edge-functions.md`** — guide complet pour l'utilisateur :
  créer le compte Stripe, activer PayPal, créer les 4 tarifs, écrire les
  2 Edge Functions (`create-checkout-session` et `stripe-webhook`, cette
  dernière vérifie la signature Stripe avant de faire confiance à quoi
  que ce soit — jamais de confirmation de paiement décidée côté
  navigateur).
- `sql/schema.sql` : colonnes `stripe_customer_id` /
  `stripe_subscription_id` sur `patients` et `orthophonists`.
- Tests permanents ajoutés à `tests/plan-and-mfa.test.js` (18
  vérifications au total maintenant) : simulent `fetch` pour vérifier
  que la bonne requête part vers l'Edge Function et que les erreurs sont
  bien remontées.

**Ce qui attend l'utilisateur** (hors de ma portée, comme Supabase et
GitHub) : créer le compte Stripe, les 4 tarifs, et déployer les 2 Edge
Functions — tout est détaillé pas à pas dans
`js/stripe-edge-functions.md`. Une fois fait, transmettre la clé
publiable Stripe pour finaliser le branchement.

**Non testable de bout en bout avant ça** : je ne peux pas déclencher un
vrai paiement Stripe sans compte réel — vérifié à la place : la logique
côté app (tests simulés), la cohérence des traductions, et la structure
des 2 Edge Functions relue attentivement contre la documentation Stripe
officielle.

## v6.27 — retour utilisateur sur l'écran de connexion

Trois retours distincts traités :

1. **"C'est pas très joli"** — l'ancien dégradé flou en coin de la carte
   de connexion (v6.25) était trop vague, pas assez structuré. Remplacé
   par un **motif original de connexions neuronales** (dessiné en SVG,
   pas une photo — les images de cerveau/espace montrées en référence
   sont sous droits d'auteur Shutterstock, non réutilisables). Choix du
   cerveau plutôt que l'espace : cohérent avec le sujet réel de l'app
   (rééducation après un AVC, reconnexions neuronales), pas un motif
   arbitraire.
2. **Carte trop petite, pas adaptée au téléphone** — élargie
   spécifiquement pour l'écran de connexion (`760px` au lieu de
   `680px`, qui reste inchangé pour les écrans d'exercice, plus
   adaptés à du texte). Vrai point de rupture mobile ajouté
   (`@media max-width:480px`) — la première media query de tout le
   projet en dehors de `prefers-reduced-motion`.
3. **"On a perdu l'espace aidant"** — vérifié : n'a en réalité jamais
   existé dans ce projet (la capture de référence de l'utilisateur
   était une maquette, pas une ancienne version réelle). Ajouté : le
   message "cet outil vous aide à patienter, ne remplace pas votre
   rendez-vous" (sur la feuille de route depuis le tout début du
   projet, jamais fait avant maintenant), et un lien vers l'espace
   aidant. **L'espace aidant complet (compte, suivi du patient) est un
   vrai chantier à part, pas encore commencé** — une page d'attente
   honnête (`aidant.html`) remplace un lien mort en attendant.

**Non vérifié visuellement** (même limite que pour Ami et la refonte
v6.25 — pas de navigateur graphique disponible ici). Vérifié à la
place : structure du SVG confirmée par simulation DOM (7 nœuds, 4
connexions, présence du message et du lien), cohérence CSS, et
correction immédiate d'un risque déjà identifié une fois avec Ami
(`transform-box:fill-box` réintroduit par erreur puis retiré — ce
motif reste volontairement statique, sans animation, pour éviter ce
risque plutôt que de le gérer).

### v6.27.1 — le motif ne s'affichait pas du tout comme prévu

Retour (capture d'écran) : le motif neuronal s'affichait en pleine
largeur au-dessus du logo, au lieu d'un petit motif discret en coin.
**Vrai bug, pas une question de couleur** : la règle
`.login-card > *{ position:relative }` (pour que le contenu reste
au-dessus du motif) s'appliquait AUSSI au SVG lui-même, qui est un
enfant direct de `.login-card` — ça annulait son `position:absolute`
et le faisait retomber dans le flux normal de la page. Corrigé en
excluant explicitement le SVG de cette règle
(`.login-card > *:not(.login-decor)`) plutôt qu'avec un `!important`
(solution plus propre, sans dette technique cachée). Couleurs aussi
rendues moins délavées au passage (opacité relevée).

## v6.28 — vrai fond de page animé

Retour : un petit motif discret en coin de carte "ne sert à rien".
Remplacé par un **vrai fond de page**, derrière la carte de connexion,
sur tout l'écran — 12 nœuds colorés (vert, doré, corail) reliés par des
lignes de connexion, qui pulsent doucement.

**Deux principes de prudence gardés, pensés pour ce public** (patients
en rééducation, parfois avec fatigue visuelle) :
- **Rythme lent** (cycle de 7 secondes, décalé entre les nœuds) — un
  fond qui s'agite serait fatigant, pas accueillant.
- **Coupé automatiquement** si "réduire les animations" est activé sur
  l'appareil (`prefers-reduced-motion`).

**Toujours les mêmes garde-fous techniques que pour Ami** : couleurs en
classes CSS (jamais `fill="var(...)"` en attribut brut), et seulement
des animations d'**opacité** — pas de `scale`/`rotate`, pour ne jamais
dépendre de `transform-box` (qui a déjà causé un vrai bug une fois dans
cette session).

Le fond reste propre à l'écran de connexion (`#login`), pas étendu au
reste de l'app — un fond animé permanent pendant les exercices serait
distrayant, pas un plus.

## v6.29 — plus de beige sur l'écran de connexion

Retour : le beige restait visible entre les nœuds du fond animé,
toujours jugé "moche". L'écran de connexion a maintenant son **propre
fond en dégradé** (vert profond → doré), le motif neuronal passant en
tons clairs (blanc, doré pâle) pour bien ressortir dessus — plus de
beige du tout sur cet écran.

**Scope volontairement limité à l'écran de connexion** : le reste de
l'app (tableau de bord, exercices) garde le fond lin établi en v6.25 —
un fond aussi riche en continu pendant les exercices serait fatigant,
pas un plus (même logique que pour l'animation en v6.28). Si ce
principe ne convient pas et que le beige doit disparaître partout,
dites-le clairement.

**Incohérence trouvée en vérifiant** : la couleur de thème PWA
(`theme-color`, utilisée par le navigateur mobile et l'icône
d'installation) était restée l'ancienne teinte d'avant la refonte
v6.25 (`#2f6f5e` au lieu de `#26594b`) — corrigée dans `index.html`,
`aidant.html`, et `manifest.json` (`theme_color` et
`background_color`).

## v6.30 — teal plutôt que bleu

Demande : un fond bleu avec le motif du cerveau. Avis donné avant
d'exécuter : un vrai bleu casserait le lien avec l'identité déjà
construite (Ami est vert, tous les boutons/badges de l'app aussi) —
l'écran de connexion se serait retrouvé visuellement déconnecté du
reste de l'app. Compromis retenu avec l'utilisateur : un **teal
profond** (même famille que le vert, en plus frais) plutôt qu'un bleu
pur.

Nouvelles teintes ajoutées, dédiées à l'écran de connexion uniquement
(`--teal-deep`, `--teal`, `--teal-light`) — les couleurs de marque
existantes (`--accent`, `--warm`, etc.) ne changent pas, donc Ami et le
reste de l'app restent identiques. Seul le dégradé de fond de
`#login` passe du vert-doré au teal.

## v6.31 — le "J" de "Bonjour !"

Enfin compris : "un J moche" dans un tout premier message n'était pas
une coquille, mais bien une remarque sur la lettre J elle-même — repéré
tardivement, désolé pour l'aller-retour.

**Cause probable** : Fraunces est une police à axe variable "optical
size" (`opsz`) — à petite taille optique, ses lettres ont des détails
volontairement excentriques (c'est la "personnalité" de cette police),
et à grande taille optique, un rendu plus classique et sobre. Sans
réglage explicite, le navigateur choisit l'`opsz` automatiquement selon
la taille d'affichage — mais ce choix automatique peut varier d'un
navigateur à l'autre.

**Corrigé** : `font-variation-settings:'opsz' 144` forcé explicitement
sur tous les grands titres (`h1,h2,h3`, `.prompt-main`) — la valeur
maximale de l'axe, pensée pour un usage en grand titre, la plus
"classique". Pas touché aux petits textes (nom d'Ami, etc.) : à petite
taille, c'est justement l'axe bas qui est adapté (traits plus robustes),
le changer là créerait un autre problème.

**Incertitude assumée** : je ne peux toujours pas voir le rendu réel. Si
le J reste disgracieux après ce correctif, plan B tout prêt : arrêter
d'utiliser Fraunces pour "Bonjour !" spécifiquement (police plus neutre
à la place) — dites-le si besoin, je le fais immédiatement.

## v6.32 — harmonisation des couleurs sur tout le site

Confirmé par l'utilisateur (capture du bilan initial, entièrement
beige) : le beige à corriger, ce n'était pas juste les champs de
l'écran de connexion, mais **le fond de toute l'app**.

Le token `--bg` (fond de base, utilisé par chaque écran : tableau de
bord, exercices, bilan, espace ortho, tarifs...) passe du beige
(`#efead9`) à un ton clair et frais, dans la même famille que le teal
de l'écran de connexion — `#e6efec`. `--surface-soft`, `--line` et
`--accent-soft` ajustés en cohérence.

**Choix délibéré** : ce nouveau fond reste **clair**, pas aussi sombre
que le dégradé teal de la connexion. Le texte de l'app (`--ink`,
sombre) suppose un fond clair partout — un fond sombre généralisé
aurait rendu les écrans d'exercice illisibles, pas juste changé une
couleur. "Harmoniser" ici veut dire : même famille de teinte partout,
pas le même contraste fort partout.

Comme pour la refonte v6.25, ce changement ne touche que les tokens
CSS — aucun fichier HTML/JS modifié — donc il se propage automatiquement
à tous les écrans de l'app sans reprendre chaque page une par une.

**Vérifié** : aucune ancienne couleur beige codée en dur ne subsiste
nulle part dans le projet (recherché explicitement), aucune variable
CSS orpheline, tous les tests automatisés toujours au vert.
**Non vérifié visuellement**, comme toujours dans cet environnement.

## v6.33 — paywall désactivé pour l'instant, mode payant repoussé à plus tard

Décision explicite de l'utilisateur (7 juillet) : côté patient, tous
les exercices doivent être accessibles dès maintenant, sans verrou
"Pro" — la mise en place réelle du mode payant est repoussée à plus
tard.

**Ce qui a changé** : un interrupteur unique, `PAYWALL_ENABLED` (dans
`js/app.js`), passé à `false`. `lockReason()` renvoie désormais
toujours `null` tant que cet interrupteur est désactivé — plus aucun
badge "🔒 Pro" sur les exercices vocaux avancés/conversation guidée,
plus de restriction de langue, plus de quota journalier. La bannière
"passer au compte Pro" (`#pro-teaser-card`) est masquée pour la même
raison (inutile de mettre en avant une offre qui n'est pas branchée).

**Ce qui n'a PAS changé, volontairement** : toute la structure
gratuit/pro reste en place et intacte — les constantes
`FREE_DAILY_SESSION_LIMIT`/`FREE_LANGS`/`PRO_ONLY_TYPES`, la logique de
verrouillage elle-même, l'écran de tarification, Stripe
(`js/stripe-edge-functions.md`), les colonnes `plan`/`stripe_*` en
base. Pour réactiver le paywall plus tard, il suffira de repasser
`PAYWALL_ENABLED` à `true` dans `js/app.js` — aucune autre
modification de code nécessaire. Les tests (`tests/plan-and-mfa.test.js`)
vérifient les deux états : désactivé par défaut, ET la logique de
verrouillage sous-jacente toujours correcte si on la réactive.

**Non concerné par cette demande** : la limite de patients gratuite
côté espace orthophoniste (`ORTHO_FREE_PATIENT_LIMIT`, dans
`js/dashboard-ortho.js`) — la demande du 7 juillet portait sur l'écran
d'exercices du patient. À clarifier avec l'utilisateur si elle doit
être désactivée aussi.

## v6.34.1 — correctif : le cache hors-ligne servait encore l'ancienne app

Vrai bug signalé le 7 juillet par capture d'écran : après la livraison
de v6.33 (paywall désactivé) et v6.34 (Ami), les patients voyaient
encore les badges "🔒 Pro" et l'écran de verrouillage — comme si rien
n'avait changé.

**Cause** : `sw.js` (mode hors-ligne) utilise une stratégie "cache
d'abord" — une fois l'app chargée une première fois, le navigateur sert
les fichiers JS/CSS déjà en cache plutôt que d'aller chercher les
nouveaux sur le réseau, TANT QUE `CACHE_NAME` ne change pas. J'ai
livré v6.33 et v6.34 sans l'incrémenter — erreur de ma part, alors que
`sw.js` le rappelle explicitement en commentaire depuis la v6.23.
Résultat : les patients qui avaient déjà ouvert l'app continuaient de
recevoir l'ancien `js/app.js` (paywall actif, pas d'Ami à l'arrivée).

**Corrigé** : `CACHE_NAME` passe de `reparole-v6-27` à
`reparole-v6-34`. Au prochain chargement, le navigateur détecte le
nouveau `sw.js`, active la nouvelle version (`skipWaiting`/
`clients.claim()` déjà en place), supprime l'ancien cache, et
recharge tous les fichiers depuis le réseau.

**À savoir pour la suite** : à chaque livraison qui touche un fichier
JS ou CSS, `CACHE_NAME` doit être incrémenté dans `sw.js` — sinon les
patients qui ont déjà ouvert l'app une fois ne verront pas la mise à
jour avant de vider manuellement le cache de leur navigateur.

## v6.34 — Ami explique chaque exercice en y arrivant

Demande explicite du 7 juillet : quand on passe sur un exercice, Ami
doit expliquer à quoi il sert (pas comment y jouer, ça reste la
consigne affichée à l'écran) — et surtout, il doit se déplacer jusqu'à
l'exercice pour donner cette explication, dans toutes les langues.

**Explication du but** : une nouvelle banque de phrases,
`COMPANION_PHRASES[lang].explain`, avec une entrée par type d'exercice
(nommer les images, compléter la phrase, comprendre la consigne,
répéter à voix haute, nommer à voix haute, fluence, intonation, vos
photos, jeu de mémoire, tenue vocale, conversation guidée) — dans les 7
langues "interface complète" (fr/en/es/it/pt/de/ar). Contenu volontai-
rement sobre : ce que l'exercice entraîne, jamais une comparaison à une
norme ni une invitation à "faire mieux" (garde-fous n°6 et phonation
déjà en place, juste réaffirmés ici).

**Ami se déplace** : plutôt que d'apparaître d'un coup avec le message
générique "on y va, tranquillement", `Companion.explain(containerId,
type)` joue une entrée plus marquée — une marche depuis plus loin
(`companion-enter-explain`, glissement de 64px au lieu de 22px, 0,85s)
— et retarde l'apparition de la bulle de texte d'environ 0,6s
(`companion-bubble-delayed`), pour donner l'impression qu'il arrive
d'abord, puis parle une fois sur place. Comme pour le reste du
compagnon, les préférences d'accessibilité (réduire les animations /
lecture facilitée) désactivent entièrement la marche et le délai — le
message reste alors affiché instantanément.

**Chaque exercice a maintenant son Ami** : le jeu de mémoire, la tenue
vocale et le menu de conversation guidée n'avaient pas de compagnon
affiché jusqu'ici — ajout d'un conteneur dédié pour chacun
(`#companion-memory`, `#companion-phonation`, `#companion-conversation`),
au même endroit dans l'écran que `#companion-exercise`.

**Vérifié par simulation DOM (jsdom)**, pas un vrai navigateur comme
toujours dans cet environnement : les 7 langues ont bien une phrase
pour les 11 types d'exercice (77 vérifications), le bon message
s'affiche dans le bon conteneur, le repli sur le français fonctionne
si une langue n'a pas (encore) de banque `explain`, et les classes
d'animation sont bien absentes en mode accessibilité — voir
`tests/companion-explain.test.js` (83 tests).

## v6.35 — Espace aidant (première version fonctionnelle)

Chantier prioritaire identifié à la reprise du 7 juillet : l'espace
aidant n'était qu'une page d'attente honnête. Scope validé avec
l'utilisateur avant de coder (trois questions) :
- Accès par **code d'invitation généré par le patient** (pas un vrai
  compte, pas de code à usage unique — un code permanent que le
  patient peut régénérer à tout moment pour révoquer l'accès précédent).
- **Un seul aidant par patient** pour l'instant (décision volontairement
  simple, à étendre plus tard si besoin).
- L'aidant voit ses **progrès en lecture seule** + des **conseils
  pratiques du jour générés par des règles explicites** (pas de LLM —
  garde-fou n°1).

**Base de données** (`sql/schema.sql`) : colonne `patients.caregiver_code`
(unique), et trois fonctions RPC security-definer : `generate_caregiver_code`
(régénérer révoque l'ancien code), `revoke_caregiver_code`, et
`get_caregiver_data` — cette dernière est la SEULE porte d'entrée
laissée à la clé publique pour un aidant : elle renvoie un
sous-ensemble volontairement limité (nom, niveau, séries, séances
récentes, tally des catégories d'erreur sur 30 jours) et ne renvoie
JAMAIS `clinical_profile`, `reminder_email`, ni aucun champ administratif.
Comme pour le patient, `caregiver_code` n'est pas un jeton
cryptographique : RLS seule ne suffit pas, d'où le passage par une
fonction dédiée (même logique que `get_patient`, voir la section RPC
plus haut).

**Conseils du jour, moteur de règles** (`js/caregiver-tips.js`, nouveau
fichier, testé isolément) : pas de texte inventé au vol, une table de
correspondance fixe entre situation et conseil — pas de séance
enregistrée, inactivité (≥3 jours), série ≥5 jours, catégorie d'erreur
dominante sur les 30 derniers jours (seuil : au moins 3 erreurs pour
éviter de réagir à du bruit), et un rappel fixe toujours présent
(\"vous accompagnez, vous ne remplacez pas l'orthophoniste\"). Maximum
2 conseils dynamiques + le rappel, pour ne pas noyer l'aidant sous du
texte. Garde-fou n°6 respecté : ce sont des conseils pratiques, jamais
une norme clinique chiffrée qui pourrait inquiéter.

**Page `aidant.html`**, reconstruite (elle n'était qu'un message
d'attente) : formulaire de connexion par code, puis tableau de bord
(séances/réussite/série, courbe de progression réutilisant
`Charts.successLine`, conseils du jour) — en lecture seule, sans aucun
moyen de modifier le dossier patient. Bandeau rappelant que rien n'est
validé cliniquement (garde-fou n°8).

**Côté patient** (`index.html` + `js/app.js`) : nouvelle carte
\"Espace aidant\" sur le tableau de bord — créer/régénérer/révoquer le
code, affiché clairement une fois généré.

**Testé** (`tests/caregiver.test.js`, nouveau, 15 tests) : le moteur de
règles (chaque déclencheur, la limite à 3 conseils, le départage
déterministe en cas d'égalité entre catégories) + un parcours complet
en DOM simulé sur `aidant.html` en mode navigateur (code inconnu → message
d'erreur sans afficher le tableau de bord ; code valide → tableau de
bord rempli ; déconnexion → retour à l'écran de connexion).

**`CACHE_NAME`** incrémenté (`reparole-v6-34` → `reparole-v6-35`,
piège déjà rencontré en v6.34/v6.34.1) — deux nouveaux fichiers JS
(`js/caregiver.js`, `js/caregiver-tips.js`) ajoutés à `sw.js`.

**Ce qui reste explicitement hors de ce lot** (à faire plus tard, pas
oublié) :
- Traduction : l'espace aidant est **français uniquement** pour
  l'instant (comme d'autres parties du site à leurs débuts) — pas de
  clé `I18N` ajoutée, donc `tests/i18n-completeness.test.js` n'est pas
  concerné par ce choix, mais ça reste à traduire.
- Plusieurs aidants par patient (décision utilisateur : pas pour
  l'instant).
- Confirmation visuelle réelle par l'utilisateur (rendu jamais vu dans
  un vrai navigateur dans cet environnement, comme toujours — voir
  garde-fou n°3 de `SKILL_ReParole_v6.md`).
- Rien de tout ça ne fonctionne réellement tant que Supabase n'est pas
  configuré (mode navigateur/localStorage utilisé pour les tests,
  fonctionnel mais non partagé entre appareils).

## v6.36 — Résumé imprimable côté patient

Dernier point de la liste "prochaines pistes" resté ouvert depuis
longtemps : `report.html` (le rapport imprimable) n'existait que côté
orthophoniste (ton clinique, RLS réservé à l'ortho). Le patient n'avait
aucun moyen d'imprimer/exporter son propre suivi.

**Nouvelle page `mon-resume.html`**, volontairement distincte de
`report.html` plutôt qu'une simple réutilisation par paramètre d'URL :
le ton et le contenu diffèrent pour un lectorat patient plutôt que
professionnel — pas de section "analyse des erreurs" par catégorie
(sémantique/phonologique/etc., jugée trop clinique pour ce lectorat,
garde-fou n°6), remplacée par le texte "Ce sur quoi je travaille en ce
moment" qui réutilise directement `Learner.insight()` — le même texte
déjà affiché au patient sur son tableau de bord (`js/learner.js`), donc
aucune nouvelle formulation clinique introduite. Réutilise les mêmes
classes CSS que le rapport ortho (`css/ortho.css` : `.report-page`,
`.report-header`, `.report-grid`, `@media print`), donc le même bouton
"🖨️ Imprimer / Enregistrer en PDF" et le même comportement à
l'impression, sans dupliquer le CSS.

**Accès** : nouveau bouton "🖨️ Imprimer mon résumé" dans la carte
"Votre progression" du tableau de bord patient (`index.html`/
`js/app.js`, `openMySummary()`) — ouvre `mon-resume.html?code=...` dans
un nouvel onglet avec le code déjà rempli, le patient n'a rien à
ressaisir.

**Contenu de la page** : séances/réussite/série, courbe de progression
(réutilise `Charts.successLine`, comme le rapport ortho et l'espace
aidant), tendance, niveau actuel, l'historique des 20 dernières séances
avec des libellés lisibles par type d'exercice (`TYPE_LABELS` — ex.
"denomination" → "Nommer les images"), et un rappel en bas de page que
ce résumé ne remplace pas un bilan ou un avis orthophonique (garde-fou
n°8) — avec une suggestion positive : le montrer à son orthophoniste si
le patient le souhaite.

**Pas de `Store.saveReportMeta()` appelé depuis cette page** —
volontaire : la table `reports` est protégée par une policy RLS "for
all" qui exige `auth.uid()` (un orthophoniste connecté via Supabase
Auth), le patient n'a pas ce type de session. Plutôt que d'ouvrir une
nouvelle voie d'accès RPC pour ce besoin (décision d'architecture non
discutée avec l'utilisateur), la génération du résumé patient n'est
simplement pas journalisée côté serveur — cohérent avec le modèle de
sécurité déjà en place, à revoir si l'utilisateur demande un suivi de
ces générations plus tard.

**Français uniquement pour l'instant** (comme l'espace aidant à ses
débuts) — `Learner.insight()` a un repli français intégré quand
`I18N` n'est pas chargé (page volontairement légère, ne charge pas
`js/i18n.js`), donc aucun texte vide ni bug silencieux, juste pas
encore traduit.

**`CACHE_NAME`** incrémenté (`reparole-v6-35` → `reparole-v6-36`),
`mon-resume.html` ajouté à `sw.js`.

**Testé** (`tests/patient-summary.test.js`, nouveau, 4 tests) : pas de
code dans l'adresse → message clair sans plantage ; code inconnu →
"dossier introuvable" ; code valide avec historique → nom, stats,
libellés d'exercices, et texte du moment tous bien présents ; et
`typeLabel()` isolément (types connus traduits, type inconnu renvoyé
tel quel plutôt que de planter).

## v6.37 — Kabyle : vocabulaire étendu, brouillon re-vérifié, demande audio préparée

Trois pistes concrètes explorées suite à la question "que peux-tu faire
de plus pour le kabyle ?", validées par l'utilisateur ("les trois").
Aucune des trois ne touche aux garde-fous n°1 et n°3 : rien n'a été
inventé, tout est sourcé, aucune phrase complète n'a été intégrée sans
relecture native.

**1. Vocabulaire étendu (niveaux 2 et 3 de "Nommer les images")** —
`js/exercises-kab.js`. Les niveaux 2 et 3 étaient nettement plus courts
qu'en français (4 et 3 mots contre 8) faute de vocabulaire suffisamment
sourcé au moment de leur création. 7 nouveaux mots ajoutés, chacun
recoupant au moins 2 sources indépendantes (Glosbe + kabyle.com et/ou
Encyclopédie berbère et/ou un article académique) :
- Niveau 2 (4→8, parité avec le français) : `tafunast` (vache),
  `itri` (étoile), `adlis` (livre), `agmar` (cheval).
- Niveau 3 (3→6) : `aɣyul` (âne), `izem` (lion), `azemmur`
  (olive/olivier — symbole culturel fort de la Kabylie, sourcé jusque
  dans l'Encyclopédie berbère).
Les distracteurs de ces nouvelles entrées réutilisent uniquement du
vocabulaire déjà vérifié ailleurs dans le fichier, comme pour le reste
du fichier — aucun mot supplémentaire non sourcé introduit.

**2. Brouillon "Compléter la phrase" re-vérifié**
(`docs/kabyle-completion-draft.md`). Les phrases 1 et 2 étaient déjà
confirmées mot pour mot depuis la v6.7 ; passe ciblée sur les phrases 3
et 4, les deux seules encore non retrouvées telles quelles dans un
corpus :
- Phrase 3 ("Yemmut yislem-nni-inu azeggaɣ", *Mon poisson rouge est
  mort*) est **désormais confirmée mot pour mot**, trouvée identique
  sur la page Glosbe "poisson"/"poissons".
- Phrase 4 ("Ḥemmleɣ aṭas tikeṛṛusin", *J'adore les voitures*) reste
  **non confirmée telle quelle** : le corpus atteste la même structure
  mais à la première personne du pluriel ("Nḥemmel aṭas tikeṛṛusin",
  *nous adorons les voitures*), pas au singulier utilisé dans le
  brouillon. Recommandation ajoutée au document : utiliser la forme
  effectivement attestée (le pluriel) sauf si une relecture native
  confirme que le singulier fonctionne aussi. Toujours PAS intégré
  dans `js/exercises-kab.js` — la relecture native reste la seule
  chose bloquante, comme depuis la v6.7.

**3. Message prêt à envoyer à apprendrelekabyle.com** (préparé pour
l'utilisateur, pas envoyé — je ne peux pas le faire à sa place) :
demande d'autorisation d'utiliser leurs enregistrements audio natifs
("Voix Kabyle : Amélie S. et Moh A.") pour l'application, avec repli
proposé (recommandation d'une autre ressource ou d'un·e locuteur·rice
natif·ve) si la réponse est négative. Piste notée depuis longtemps
comme "non aboutie" dans le README — enfin lancée.

## v6.38 — Base de connaissances communautaire (contribution + validation admin)

Suite directe de la discussion sur le kabyle : plutôt que de traduire
manuellement une phrase à la fois, une vraie base de connaissances où
n'importe qui peut proposer un mot ou une phrase, avec validation
humaine obligatoire avant que ça n'apparaisse à un seul patient.
Décisions de scope validées avec l'utilisateur avant de coder :
validation par plusieurs administrateurs de confiance (pas seulement
le propriétaire du projet), intégration automatique dès validation
(pas de redéploiement), et **refus explicite de la génération
automatique de contenu par IA à partir des données patients** —
proposée par l'utilisateur, déclinée avec explication (garde-fou n°1),
remplacée par une piste plus sûre : signaler des tendances agrégées à
un humain plutôt que générer du contenu.

**Nouvelles tables** (`sql/schema.sql`) : `admins` (aucun droit
automatique — une ligne doit être ajoutée à la main dans Supabase par
le propriétaire du projet, procédure documentée dans
`HEBERGEMENT.md`) et `content_items` (les propositions, avec sources
obligatoires en pratique côté formulaire, statut pending/approved/
rejected). RLS stricte : n'importe qui peut proposer
(`submit_content`, force `status='pending'` côté serveur quoi que le
client envoie), seules les entrées déjà approuvées sont lisibles
publiquement, tout le reste (relecture, validation) réservé aux
comptes présents dans `admins`.

**`get_admin_trends()`** — la réponse au refus de la génération
automatique : agrège, sur TOUS les patients et sans jamais renvoyer un
identifiant individuel, les catégories d'erreurs et types de séances
des 30 derniers jours. Accessible aux admins ET aux orthophonistes
(la fonction SQL le permet déjà ; seul `admin.html` l'utilise pour
l'instant — brancher la même vue dans `dashboard-ortho.html` reste une
extension possible, pas faite dans cette version).

**`contribuer.html`** (public, pas de compte requis) — formulaire pour
proposer un mot isolé, une phrase à trous, une question à choix, ou
une idée d'exercice, avec sources obligatoires. Découvrable depuis un
lien discret en bas du tableau de bord patient (`index.html`).

**`admin.html`** (compte Supabase Auth requis, réservé aux lignes de
`admins`) — file d'attente de relecture (valider/refuser avec note
facultative) + tableau des tendances agrégées. Volontairement pas de
lien public vers cette page (accès par URL directe uniquement).

**`js/app.js` (`mergeApprovedContent`)** — au chargement de l'app, les
contributions de vocabulaire (`kind:'vocabulary'`) déjà approuvées
pour le kabyle sont ajoutées à `BANK_KAB.denomination`, sans
redéploiement. Portée délibérément limitée pour l'instant : une
contribution de type phrase (`kind:'sentence'`, completion/
comprehension) est bien validée et conservée en base, mais n'apparaît
pas encore dans l'app tant qu'un ajout de code (comme pour
`docs/kabyle-completion-draft.md`) n'a pas défini cette structure pour
le kabyle — éviter cette fusion automatique pour les phrases était un
choix délibéré, pas un oubli : une phrase complète reste plus risquée
qu'un mot isolé, même sourcée par un·e contributeur·rice de confiance.

**Limite connue, assumée** : contrairement aux comptes orthophonistes,
les comptes administrateurs ne proposent pas encore la double
authentification (MFA/TOTP) — acceptable vu le nombre restreint de
personnes de confiance concernées pour l'instant, mais à revoir si le
cercle d'administrateurs·rices s'élargit.

**Testé** (`tests/knowledge-base.test.js`, 17 tests) : logique du
formulaire (mapping type → kind/domaine, découpage des distracteurs),
couche de stockage avec un faux client Supabase (`submitContent` force
toujours `pending`, `signInAdmin` refuse un compte sans ligne
`admins`, `reviewContent`/`loadApprovedContent`/`getAdminTrends`), et
fusion dans `BANK_KAB` (mot approuvé fusionné, phrase jamais fusionnée
automatiquement, entrée mal formée ignorée sans planter, no-op en mode
navigateur).

**`CACHE_NAME`** incrémenté (`reparole-v6-37` → `reparole-v6-38`),
`admin.html`/`contribuer.html`/`js/admin.js`/`js/contribute.js`
ajoutés à `sw.js`.

## v6.39 — Turc (langue complète) + correctif reconnaissance vocale (ı/ł/ß)

Première d'une série de 6 langues européennes demandées par
l'utilisateur (turc → polonais → roumain → néerlandais → russe → grec).
Décision prise avant de commencer, avec l'utilisateur : les faire une
par une, complètes, plutôt que les 6 d'un coup — le volume par langue
(~30 000 caractères sur 7 fichiers) rendait un gros lot risqué en
qualité.

**Correctif trouvé en préparant le turc, avant toute traduction** :
`normalize()` (`js/app.js`), utilisée pour comparer ce que dit le
patient à voix haute avec la bonne réponse, décomposait les accents
via Unicode NFD puis ne gardait QUE les lettres latines `a-z`.
Problème à deux niveaux :
1. Certaines lettres latines n'ont pas de décomposition NFD — le "ı"
   turc (i sans point), le "ł" polonais, le "ß" allemand — et étaient
   donc supprimées au lieu d'être converties : "ışık" devenait "sk".
2. Plus grave, repéré en anticipant les langues suivantes : un mot
   entièrement dans un autre alphabet (cyrillique pour le russe, grec
   pour le grec — deux des 6 langues prévues ensuite) devenait une
   chaîne **entièrement vide**, pas juste dégradée.

Corrigé en deux temps : une table de substitution explicite pour les
lettres latines sans décomposition (`ı→i`, `ł→l`, `ß→ss`, etc.), PUIS
élargissement du filtre final de `[a-z]` à `\p{L}\p{N}` (n'importe
quelle lettre/chiffre Unicode) plutôt qu'un alphabet latin figé — donc
le cyrillique et le grec survivent désormais tels quels. Corrige aussi
silencieusement l'allemand, déjà en ligne depuis plusieurs versions
sans que personne ne l'ait remarqué (le contenu allemand actuel
n'utilise pas de ß). Testé isolément (`tests/text-normalize.test.js`,
nouveau, 9 tests — y compris des mots russes et grecs, alors qu'aucune
de ces deux langues n'est encore livrée).

**Turc, langue complète** (comme l'anglais/espagnol/italien/portugais/
allemand/arabe) : le turc est bien couvert par la reconnaissance et la
synthèse vocale des navigateurs (`tr-TR`), donc TOUS les types
d'exercice sont traduits, exercices vocaux compris — `js/exercises-tr.js`
(nouveau, même structure que `exercises-en.js`), `I18N_STRINGS.tr`
(`js/i18n.js`), `ASSESS_STRINGS.tr` + `ASSESS_ITEMS_TR` +
`SYMPTOM_QUESTIONS_TR` + `ASSESS_DOMAIN_LABELS_TR` (`js/assessment.js`),
`CONV_SCENARIOS_TR` (`js/conversation.js`), et `COMPANION_PHRASES.tr`
(`js/companion.js`, phrases d'Ami). `js/memory.js` et `js/phonation.js`
n'ont pas besoin de fichier séparé : ils passent déjà entièrement par
`I18N.t()`, donc traduire `I18N_STRINGS.tr` les couvre aussi.

**Attention capitalisation turque**, documentée en commentaire dans
`js/exercises-tr.js` : "i" minuscule devient "İ" majuscule (avec
point), et "ı" minuscule (sans point) devient "I" majuscule — l'inverse
de la plupart des langues latines. Le contenu turc est écrit
directement en majuscules correctes dans le code plutôt que dérivé par
un `.toUpperCase()` JS (qui utiliserait la règle latine et casserait
cette distinction).

**Filet de sécurité étendu** : `tests/i18n-completeness.test.js` avait
une liste de langues "complètes" codée en dur (`requiredIn:['en','es',
'it','pt','de','ar']`) — le turc n'y aurait pas été vérifié
silencieusement sans cet ajout. Ajouté aux 5 vérifications
structurelles, plus `tests/companion-explain.test.js` (liste
`FULL_LANGS` séparée, 11 nouveaux tests). **Point d'attention pour les
5 prochaines langues** : ne pas oublier ces deux listes à chaque fois.

**`CACHE_NAME`** incrémenté (`reparole-v6-38` → `reparole-v6-39`),
`js/exercises-tr.js` ajouté à `sw.js` et à `index.html`.

**Testé** : 9 suites, toutes ✅ — `text-normalize.test.js` (7, nouveau),
`i18n-completeness.test.js` (détecte et valide `tr` automatiquement),
`companion-explain.test.js` (94 tests, +11 pour le turc).

## v6.40 — Polonais (langue complète)

2/6 langues européennes prévues (turc → **polonais** → roumain →
néerlandais → russe → grec). Même méthode que le turc, documentée dans
`SKILL_ReParole_v6.md` pour rester reproductible sur les 4 langues
restantes.

**Bonne nouvelle côté reconnaissance vocale** : contrairement au turc,
le polonais ne nécessitait aucun nouveau correctif de
`js/app.js:normalize()` — sa seule lettre sans décomposition NFD est
`ł`, déjà couverte par la table de substitutions ajoutée en v6.39.
Vérifié avant de traduire quoi que ce soit (`łódź`, `żółw`, etc. se
décomposent tous correctement sauf `ł`, déjà géré).

**Polonais, langue complète** (comme le turc, l'anglais, l'espagnol...) :
`js/exercises-pl.js` (nouveau), `I18N_STRINGS.pl` (`js/i18n.js`),
`ASSESS_STRINGS.pl` + `ASSESS_ITEMS_PL` + `SYMPTOM_QUESTIONS_PL` +
`ASSESS_DOMAIN_LABELS_PL` (`js/assessment.js`), `CONV_SCENARIOS_PL`
(`js/conversation.js`), `COMPANION_PHRASES.pl` (`js/companion.js`).

**Les deux listes codées en dur mises à jour à chaque langue** (piège
identifié en v6.39, reproduit correctement ici) : `requiredIn` dans
les 5 vérifications de `tests/i18n-completeness.test.js`, et
`FULL_LANGS` dans `tests/companion-explain.test.js` (+11 tests, 94→105).

**`CACHE_NAME`** incrémenté (`reparole-v6-39` → `reparole-v6-40`),
`js/exercises-pl.js` ajouté à `sw.js` et à `index.html`.

**Testé** : 9 suites, toutes ✅.

## v6.41 — Mode "séance courte" + journal de ressenti libre

Deux des quatre pistes proposées à l'utilisateur en réponse à "quelle
idée pourrait-on ajouter ?" (les deux autres : populations voisines et
extension de l'espace aidant, voir v6.42 et au-delà).

**Mode "séance courte"** (`Prefs.data.shortSession`) : un nouveau bouton
d'accessibilité ("⏱️ Séance courte (3 questions)"), à côté de "Lecture
facilitée" et "Police adaptée". Une fois activé, `startExercise()`
tronque la file de questions à 3 items maximum — le contenu lui-même
n'est jamais modifié, seulement le nombre de questions posées d'affilée
avant la fin de séance. Pensé pour les jours de fatigue : moins
d'engagement demandé, sans jamais donner l'impression de "ne pas
finir" quelque chose de plus long. Testé (`tests/short-session.test.js`,
5 tests) : file complète par défaut, tronquée à 3 une fois activé, pas
d'erreur sur un type ayant déjà moins de 3 items (fluence), retour à la
file complète en désactivant, et confirmation que le contenu lui-même
n'est pas altéré.

**Journal de ressenti libre** (`journal_entries` en base, RPC
`add_journal_entry`/`get_journal_entries`) : PAS un questionnaire
structuré comme le bilan initial — un simple champ de texte libre
("comment ça s'est passé aujourd'hui ?"), jamais analysé
automatiquement, jamais montré à personne d'autre que le patient sauf
s'il choisit de le partager. Nouvelle carte "Mon journal" sur le
tableau de bord patient, et les 10 dernières entrées apparaissent
aussi dans le résumé imprimable (`mon-resume.html`) si le patient en a
écrit — texte HTML-échappé avant affichage (protection XSS basique sur
du texte libre non modéré). Testé (`tests/journal.test.js`, 9 tests) :
mode navigateur, mode cloud (faux Supabase), validation texte vide,
séparation stricte entre patients, et rendu correct dans le résumé
imprimable (avec vérification explicite que du HTML injecté dans une
entrée de journal est bien échappé, pas interprété).

## v6.42 — Populations cliniques voisines + dénomination française étendue

**Trois nouveaux profils cliniques** dans `js/learner.js`
(`CLINICAL_PROFILES`) — traumatisme crânien, suites ORL (chirurgie,
geste sur la voix), maladie de Parkinson — en plus des 5 déjà présents
(broca/wernicke/anomique/globale/dysarthrie). Chacun avec ses propres
coefficients de priorisation d'exercices (`boost`), cohérents avec le
profil clinique réel : ORL et Parkinson priorisent la répétition/
dénomination orale/intonation (travail de la voix), traumatisme
crânien priorise dénomination/compréhension/fluence. Le menu déroulant
de `dashboard-ortho.html` (`d-clinical`) se génère dynamiquement depuis
`window.CLINICAL_PROFILES` — aucune modification HTML nécessaire pour
qu'un nouveau profil y apparaisse. **Garde-fou n°2 vérifié explicitement
par un test** : aucun de ces nouveaux profils ne peut booster un
exercice de déglutition, puisqu'aucun type de ce genre n'existe dans
l'app (`tests/learner.test.js`, 4 nouveaux tests, 17→21).

**Dénomination française étendue** (`js/exercises.js`) : niveaux 1/2/3
passés de 8 à 35 mots chacun (105 items au total), à la demande de
l'utilisateur — premier lot resserré avant d'envisager une extension
plus large aux autres types d'exercices et aux autres langues (la
demande initiale portait sur 150 items × 3 niveaux × tous les types ×
9 langues ; jugé disproportionné en une fois — risque de doublons et de
qualité dégradée à ce volume — proposé et accepté à la place : un
premier lot vérifiable). **Correctif de cohérence appliqué après coup** :
les niveaux 2 et 3 doivent avoir respectivement 4 et 5 choix par
question (progression de difficulté déjà établie dans le reste de la
banque) — une partie des nouveaux items n'en avait que 3 ; corrigé en
ajoutant des distracteurs supplémentaires pertinents pour chaque item
concerné (53 items sur les 70 des niveaux 2-3). Vérifié
automatiquement : aucun doublon de réponse (dans un niveau ni entre
niveaux), chaque réponse présente dans ses propres choix, aucun choix
dupliqué au sein d'un même item.

**`CACHE_NAME`** incrémenté à `reparole-v6-43` (plusieurs fichiers JS
modifiés dans ces deux versions, plus le correctif tardif sur
`exercises.js`).

**Testé** : 11 suites, toutes ✅ (234 tests au total).

## v6.43 — Mots personnalisés proposés par l'aidant (4ᵉ et dernière piste)

Dernière des 4 pistes proposées en réponse à "quelle idée pourrait-on
ajouter ?". Scope validé avec l'utilisateur avant de coder (deux
questions) : le mot proposé par l'aidant est **lié au patient précis
qu'il accompagne** (pas anonyme, pas versé à la base commune de
`contribuer.html`), et **intégré automatiquement, sans validation
admin** — décision assumée : l'aidant a déjà un accès en lecture au
dossier de ce patient (via son propre code, voir v6.35), donc le
niveau de confiance est différent d'une contribution communautaire
anonyme.

**Nouvelle table `caregiver_words`** (`sql/schema.sql`) + 3 fonctions
RPC security-definer : `add_caregiver_word` (prend le CODE AIDANT,
retrouve le patient via ce code comme `get_caregiver_data`, insère
directement — pas de statut "pending"), `get_caregiver_words` (prend le
CODE PATIENT, utilisé côté app patient pour la fusion), et
`get_caregiver_added_words` (prend le CODE AIDANT, pour que l'aidant
voie ce qu'il/elle a déjà proposé).

**Nouvelle carte "Proposer un mot" sur `aidant.html`** (`js/caregiver.js`) :
emoji optionnel + mot, ajout immédiat avec confirmation claire ("sans
validation intermédiaire"), liste de ce qui a déjà été proposé.

**Fusion côté patient** (`mergeCaregiverWords()` dans `js/app.js`,
appelée à chaque rendu du tableau de bord) : les mots ajoutés par
l'aidant rejoignent `BANK.denomination.items[niveau]` de la langue
actuellement active du patient (pas juste le français — fonctionne
aussi avec `BANK_XX` pour les langues complètes et `BANK_KAB`) :
- Les distracteurs sont tirés du vocabulaire déjà présent à ce
  niveau — jamais inventés à la volée, cohérent avec le reste du
  projet (aucun mot non vérifié ajouté aux choix).
- Aucun doublon : un mot déjà présent dans la banque n'est pas
  réajouté.
- Emoji par défaut (💬) si l'aidant n'en a pas choisi.
- Texte échappé avant affichage (même précaution que pour le journal,
  v6.41 — protection XSS basique sur du texte libre).

**Piège de test découvert et documenté** (`SKILL_ReParole_v6.md`) :
réaffecter une variable `let` de haut niveau (`userCode`) via un appel
`eval()` séparé de celui où elle a été déclarée ne se propage PAS de
manière fiable aux fonctions déjà définies dans le premier `eval()` —
même si une lecture directe immédiate après semble fonctionner. Corrigé
en exposant un setter (`__testSetUserCode`) défini DANS le même
`eval()` que la déclaration, comme c'était déjà fait pour `user`.
Appliqué à `tests/caregiver-words.test.js` et rétroactivement à
`tests/short-session.test.js` par cohérence.

**`CACHE_NAME`** incrémenté (`reparole-v6-43` → `reparole-v6-44`),
aucun nouveau fichier (uniquement du contenu modifié dans des fichiers
existants).

**Testé** (`tests/caregiver-words.test.js`, nouveau, 11 tests) :
stockage mode navigateur et mode cloud (faux Supabase), validation mot
vide, code aidant invalide, et la fusion complète côté patient (ajout
avec 2 distracteurs, pas de doublon, emoji par défaut, no-op si aucun
mot proposé).

## v6.44 — Correctif : `sql/schema.sql` n'était pas rejouable (policies RLS)

Trouvé en aidant l'utilisateur à configurer son vrai projet Supabase
(qui contenait déjà une base d'une lignée de développement antérieure,
avec un système de quota "5 séances gratuites/jour" jamais implémenté
dans cette conversation — trois anciennes versions surchargées de
`upsert_patient()` nettoyées manuellement avant de lancer le script,
avec l'utilisateur, en inspectant `pg_proc`/`pg_get_function_identity_arguments`
pour éviter de laisser des fonctions mortes ambiguës).

**Le vrai bug** : `sql/schema.sql` se voulait rejouable à l'identique
sur une base existante ("vous pouvez le recoller tel quel, rien n'est
perdu") — vrai pour `create table if not exists` et
`create or replace function`, mais **PostgreSQL n'a pas d'équivalent
"if not exists" pour `create policy`**. Relancer le script sur une base
où il avait déjà tourné (même partiellement, ou juste une policy en
double d'une exécution précédente) provoquait une erreur `policy
"..." for table "..." already exists` et interrompait tout le reste du
script à ce point précis — potentiellement en silence si personne ne
va vérifier jusqu'où l'exécution est allée.

**Corrigé** : chacune des 17 `create policy` du fichier est désormais
précédée d'un `drop policy if exists` correspondant — le fichier est
maintenant réellement rejouable à l'identique, comme il prétendait
déjà l'être.

**Pas de `CACHE_NAME` à incrémenter** : `sql/schema.sql` n'est pas un
fichier servi par le service worker (il ne s'exécute que manuellement,
dans Supabase), donc hors du cache hors-ligne.

## v6.45 — le J (et le f) de "Bonjour !", partie 2 : les petits textes aussi

Suite de la v6.31. À l'époque, le correctif `font-variation-settings:
'opsz' 144` n'avait été appliqué qu'aux grands titres (`h1,h2,h3`,
`.prompt-main`) — délibérément pas aux petits textes (nom d'Ami,
bulle de dialogue...), avec l'hypothèse non vérifiée que l'axe bas de
Fraunces (traits plus robustes) convenait mieux à petite taille.
**Cette hypothèse était fausse** : l'utilisateur a signalé que le "J"
restait disgracieux, et que le "f" aussi — exactement là où je n'avais
pas appliqué le correctif. La bulle de dialogue d'Ami
(`.companion-bubble`, où s'affichent justement les messages d'accueil
comme "Bonjour !") était le point le plus probable, jamais corrigé
jusqu'ici.

**Corrigé, cette fois sans exception** : `opsz 144` appliqué aux 7
usages de Fraunces qui ne l'avaient pas encore — `.companion-name` et
`.companion-bubble` (`css/companion.css`), `.report-grid .num`
(`css/ortho.css`), `.brand` et `.stat .num` (`css/style.css`), et les
deux montants de prix en style inline (`index.html`). Tout le site
utilise maintenant le même réglage `opsz`, sans distinction grand
titre / petit texte.

**Incertitude assumée, comme en v6.31** : toujours pas de moyen de
voir le rendu réel ici. Si un problème persiste après ce correctif
plus large, le plan B reste le même qu'en v6.31 : abandonner Fraunces
pour ces usages précis, au profit d'une police plus neutre.

**`CACHE_NAME`** incrémenté (`reparole-v6-44` → `reparole-v6-45`).

## v6.46 — Vraies clés Supabase intégrées en dur + correctif des tests

L'utilisateur a terminé la configuration de son projet Supabase et a
demandé que `SUPABASE_URL`/`SUPABASE_ANON_KEY` (`js/storage.js`)
restent définitivement dans le code livré, pour ne plus avoir à les
recoller à chaque nouveau zip. Fait — l'URL et la clé `anon public`
(volontairement conçue pour être publique côté client, protégée par
la RLS plutôt que par le secret) sont maintenant permanentes dans le
fichier de travail.

**Effet de bord trouvé immédiatement** : une bonne partie des tests
automatisés (`caregiver.test.js`, `journal.test.js`,
`patient-summary.test.js`, `caregiver-words.test.js`,
`knowledge-base.test.js`) chargent `js/storage.js` "tel quel" en
s'appuyant sur le fait qu'il contenait des identifiants vides par
défaut, pour simuler de façon fiable et hors-ligne le "mode
navigateur" (`Store.mode()==='navigateur'`). Avec de vraies clés en
dur, ces tests tentaient désormais de VRAIS appels réseau vers le
projet Supabase de l'utilisateur — bloqués par les restrictions
réseau de cet environnement de travail, provoquant des blocages
silencieux (le test ne plante pas franchement, il ne se termine
simplement jamais).

**Corrigé** : chaque chargeur de test qui veut explicitement le mode
navigateur force désormais `SUPABASE_URL`/`SUPABASE_ANON_KEY` à vide
au moment de charger `storage.js`, par une substitution regex — donc
indépendamment du contenu réel du fichier, qu'il contienne les vraies
clés de l'utilisateur ou rien du tout. Les tests qui simulent
volontairement le mode cloud (faux client `window.supabase`)
n'avaient pas besoin de correctif : leur faux client intercepte déjà
`createClient(...)` quels que soient les arguments reçus.

**Leçon pour la suite** : tout nouveau test qui charge `js/storage.js`
brut et veut tester le mode navigateur doit systématiquement neutraliser
les identifiants Supabase de cette façon, plutôt que de compter sur le
fait que le fichier livré les a vides par défaut — ce n'est plus vrai
depuis cette version.

**`CACHE_NAME`** incrémenté (`reparole-v6-45` → `reparole-v6-46`).

**Testé** : 12 suites, toutes ✅ (245 tests), avec les vraies clés en place.

## v6.47 — le J (et le f) de "Bonjour !", partie 3 : j'avais l'axe à l'envers

L'utilisateur a confirmé par capture d'écran que le J restait
disgracieux malgré les correctifs v6.31 et v6.45 — sur `<h1
data-i18n="login_title">`, qui avait pourtant déjà `opsz 144` forcé
depuis v6.31. Ça voulait dire que mon hypothèse de départ était fausse,
pas juste incomplète. Plutôt que de retenter une troisième valeur au
hasard, recherche des vraies spécifications de Fraunces cette fois.

**Ce qui s'est réellement passé** : Fraunces a un axe séparé "wonk"
(formes excentriques : J recourbé, f à boucle, etc.) documenté par son
créateur (Undercase Type, GitHub) comme **s'activant automatiquement
dès que `opsz` dépasse 18**. En v6.31, j'avais forcé `opsz 144` en
pensant que la valeur haute donnait un rendu "classique" — c'est
l'inverse : 144 est l'extrémité "display", précisément celle qui
garantit les formes wonky actives. Sans le savoir, j'avais poussé le
réglage exactement dans la mauvaise direction sur les 9 endroits
corrigés en v6.31 et v6.45.

**Corrigé** : `opsz 17` partout (juste sous le seuil de 18 où
Fraunces substitue automatiquement les formes normalisées aux formes
wonky), sur les mêmes 9 emplacements que v6.45 — `h1,h2,h3`,
`.prompt-main`, `.brand`, `.stat .num`, `.report-grid .num`,
`.companion-name`, `.companion-bubble`, et les 2 montants de prix.

**Incertitude qui reste, honnêtement** : cette fois le changement
repose sur une documentation officielle de la police (pas une
supposition), donc la confiance est plus grande — mais je n'ai
toujours aucun moyen de voir le rendu réel ici. Si le J/f pose encore
problème après ce correctif, le plan B (abandonner Fraunces pour ces
usages précis) reste prêt, comme annoncé en v6.31/v6.45.

**`CACHE_NAME`** incrémenté (`reparole-v6-46` → `reparole-v6-47`).

## v6.48 — le J (et le f) de "Bonjour !", partie 4 : abandon de Fraunces

Confirmation par capture d'écran (identique après le correctif v6.47)
que le J restait disgracieux malgré une deuxième tentative, cette fois
fondée sur une vraie source (documentation officielle de l'axe "wonk"
de Fraunces). Explication probable : Google Fonts ne sert souvent que
les axes explicitement demandés dans l'URL `@import` (ici seulement
`opsz` et `wght`) — l'axe "wonk" n'était peut-être même pas présent
dans la police livrée au navigateur, rendant tout réglage `opsz`
inefficace sur ce point précis, quelle que soit sa valeur.

**Plan B exécuté**, comme annoncé dès la v6.31 : Fraunces entièrement
abandonné pour les titres (`h1,h2,h3`, `.prompt-main`, `.brand`,
`.stat .num`, `.report-grid .num`, `.companion-name`,
`.companion-bubble`, montants de prix), remplacé par Source Sans 3
(déjà chargée sur le site pour le corps de texte) — une police
sans-serif, sans axe de variation exotique, donc sans risque de forme
de lettre inattendue. L'import Google Fonts de Fraunces est retiré
entièrement (plus rien ne l'utilise), ce qui allège aussi le
chargement de la page.

**Après trois tentatives sur ce sujet (v6.31, v6.45, v6.47), la
priorité a changé : fiabilité avant élégance.** Une police plus neutre
partout vaut mieux qu'une police plus raffinée mais avec un risque
résiduel non vérifiable sur des lettres précises.

**`CACHE_NAME`** incrémenté (`reparole-v6-47` → `reparole-v6-48`).

## v6.49 — Confirmation visuelle du bilan + traduction incomplète, trouvées en testant en vrai

L'utilisateur a testé l'app dans plusieurs langues (anglais, italien,
allemand) avec de vraies captures d'écran, et a remonté deux problèmes
distincts : "on ne voit pas si on a fait les bonnes réponses" et "la
traduction n'est pas complète". Les deux se sont révélés être de vrais
bugs, pas des malentendus.

**1. Aucune confirmation visuelle sur les questions de ressenti**
(`js/assessment.js`, `answerSymptom`) — contrairement au petit test du
bilan (`answerBilan`, qui affiche déjà correct/incorrect avec un délai
avant d'avancer), les questions "Souvent/Parfois/Rarement" faisaient
avancer à la question suivante instantanément, sans aucun signe que le
clic avait été pris en compte. Corrigé : le bouton choisi est mis en
évidence (nouvelle classe CSS neutre `.choice.selected` — pas de vert/
rouge ici, ce sont des ressentis, pas des bonnes/mauvaises réponses),
les boutons se désactivent, puis l'écran suivant s'affiche après un
court délai (450 ms), cohérent avec le reste de l'app.

**2. Plusieurs zones jamais traduites, visibles dès qu'on change de
langue** — repérées sur les captures (bandeau du code de suivi, carte
"Mon journal", carte "Espace aidant", message "aucune photo" dans la
carte photos) : toutes strictement en français, quelle que soit la
langue active. **19 nouvelles clés ajoutées à `I18N_STRINGS`** pour les
9 langues complètes (fr/en/es/it/pt/de/ar/tr/pl), et `index.html`/
`js/app.js` mis à jour pour les utiliser (`data-i18n` ou `I18N.t()`
selon le cas) au lieu de texte français en dur.

**3. Bug plus profond découvert en creusant le point 2** : "Hello
Marie" restait affiché en anglais après avoir changé la langue vers
l'allemand (visible sur les captures). Cause : `Prefs.setLang()`
n'appelait que `I18N.apply()`, qui ne met à jour QUE les éléments
`[data-i18n]` statiques — tout ce qui est généré dynamiquement en JS
(salutation, niveau adapté, journal, carte aidant, graphique...)
restait figé dans l'ancienne langue jusqu'à un rechargement complet de
la page. Corrigé : `setLang()` regénère maintenant le tableau de bord
(`renderDashboard()`) s'il est actuellement affiché — donc tout se met
à jour immédiatement, sans recharger la page.

**Testé** (`tests/feedback-and-lang-refresh.test.js`, nouveau, 4
tests) : confirmation visuelle avant/après le délai sur les questions
de ressenti, rafraîchissement effectif de la salutation après un
changement de langue, et absence de plantage avec le kabyle (langue
partielle) comme langue cible.

**`CACHE_NAME`** incrémenté (`reparole-v6-48` → `reparole-v6-49`).

## v6.50 — Audit complet des traductions sur index.html

L'utilisateur a signalé que le J était enfin résolu (Fraunces
abandonné en v6.48 : confirmé) mais que "Vous êtes orthophoniste ?
Accéder à l'espace pro →" restait en français dans une session
anglaise, et a demandé de vérifier "toutes les traductions une par
une" plutôt que de corriger au coup par coup.

**Relecture complète de `index.html`, ligne par ligne**, en cherchant
tout texte visible sans `data-i18n`/`data-i18n-placeholder`. **11
endroits supplémentaires** trouvés, jamais traduits jusqu'ici :
- Le lien "Vous êtes orthophoniste ? Accéder à l'espace pro →"
  (`ortho_link`) — exactement celui signalé.
- La note de bas d'écran de connexion "🔒 Votre progression est
  sauvegardée..." (`progress_saved_note`).
- Les 3 boutons d'accessibilité, présents à 2 endroits différents de
  la page (`access_toggle_dyslexia`, `access_toggle_font`,
  `access_toggle_short_session`) — jamais traduits depuis leur
  création, sur tout l'historique du projet.
- Le bouton "🖨️ Imprimer mon résumé" (`print_summary_btn`).
- Le texte "Mode de sauvegarde :" en bas de tableau de bord
  (`storage_mode_label`).
- Le lien "✍️ Vous parlez une langue pas encore bien traduite ?..."
  vers `contribuer.html` (`propose_translation_link`).
- Le texte par défaut "Je découvre votre profil…" avant que l'IA
  adaptative n'ait généré un vrai message (`assistant_learning` —
  la clé existait déjà dans `I18N_STRINGS` pour ce besoin précis,
  simplement jamais reliée à cet élément HTML).
- L'encart "Assistant adaptatif" + son message par défaut affichés
  pendant les exercices (`adaptive_assistant_label`,
  `adaptive_assistant_default_msg`) — visibles sur CHAQUE exercice,
  dans n'importe quelle langue, jamais traduits.
- Les 4 boutons "← Retour" (conversation, mémoire, tenue vocale,
  exercice — `back_btn`, distinct de `back_to_home` déjà existant
  pour l'écran tarifs qui a un texte différent).

**10 nouvelles clés `I18N_STRINGS`** ajoutées aux 9 langues complètes
(fr/en/es/it/pt/de/ar/tr/pl), plus `back_btn` en tant que 11ᵉ clé —
soit 99 chaînes traduites au total pour ce correctif.

**Kabyle non concerné, volontairement** : la note partielle spécifique
à cette langue (`#lang-partial-note`, déjà en kabyle + français) reste
telle quelle, c'est son fonctionnement prévu.

**`CACHE_NAME`** incrémenté (`reparole-v6-49` → `reparole-v6-50`).

## v6.51 — Nouvelle palette de couleurs

L'utilisateur a fourni une table couleur par couleur. Appliquée aux
variables CSS (`css/style.css`) :

| Rôle | Ancienne valeur | Nouvelle valeur |
|---|---|---|
| `--bg` (fond principal) | #e6efec | #F6FAF7 |
| `--surface` (carte) | #ffffff | #FFFFFF (inchangé) |
| `--accent` (vert principal) | #26594b | #2F6B57 |
| `--accent-soft` (vert clair) | #dfe9e4 | #DDEEE7 |
| `--warm` (accent doré du logo/badges) | #9c6b2e | #D99A3C |
| `--ink` (texte) | #22271d | #23312C |

**Deux variantes calculées, pas fournies telles quelles dans la
table** : `--accent-dark` et `--warm-soft` (versions plus sombre/plus
claire des couleurs ci-dessus, dans le même ratio que les anciennes
valeurs) — nécessaires ailleurs dans le CSS mais absentes de la table
fournie.

**Deux nouvelles variables créées** : `--success:#4CAF50` et
`--warning:#E8A317` (la palette nommait "Succès" et "Attention" sans
que ces rôles existent avant). `--success` est câblé sur la réponse
correcte des exercices (`.choice.correct`, remplace `--accent` à cet
endroit précis). `--warning` est disponible mais pas encore branché
ailleurs — les bandeaux d'avertissement existants utilisent toujours
`--error` (#a6503f, inchangé), volontairement : "Attention" et
"Erreur" ne sont pas le même concept, à clarifier avec l'utilisateur
avant de remplacer l'un par l'autre quelque part.

**Couleur de thème PWA mise à jour aussi** (`manifest.json`,
`index.html`, `aidant.html`, `contribuer.html`) — la barre du
navigateur/l'écran de démarrage utilisait encore l'ancien vert
`#26594b`, désormais `#2F6B57` partout. `background_color` du manifest
(`#efead9`, fond de l'écran de démarrage) n'était pas dans la table
fournie, laissé inchangé.

**`CACHE_NAME`** incrémenté (`reparole-v6-50` → `reparole-v6-51`).

## v6.52 — Une couleur d'accent chaleureuse pour les réussites/badges/progrès

L'utilisateur a proposé d'ajouter une couleur chaude (ocre/orange doux)
en plus du vert/blanc dominant, pour les réussites, badges et
progrès — "plus vivant sans être agressif". `--warm` (#D99A3C)
existait déjà dans la palette mais servait presque uniquement à des
détails décoratifs (point du logo, lignes de fond animées, badge
"VOIX"). Étendu à 4 endroits précis, choisis pour rester rare et donc
garder son effet (pas touché au bouton principal ni au vert de
marque) :

1. **Série de jours** (`#s-streak`) — le stat le plus proche d'une
   vraie récompense de régularité.
2. **Badge "Niveau adapté"** (`.level-badge`) — fond/texte passés de
   `--accent-soft`/`--accent-dark` à `--warm-soft`/`--warm-dark`.
3. **Bulle d'Ami quand il félicite une série** — nouvelle classe
   `.companion-bubble-celebrate`, posée automatiquement quand
   `Companion.mood === 'delighted'` (ce mood existait déjà,
   `moodFor('streak')`, simplement jamais traduit visuellement avant).
4. **Barre de progression d'un exercice en cours** (`.progress span`).

**Nouvelle variable `--warm-dark` (#875F25)** — dérivée de `--warm`
selon le même ratio que `--accent-dark`/`--accent`, nécessaire pour
que le texte reste lisible sur fond `--warm-soft` clair (pas fournie
par la table de couleurs de la v6.51, calculée pour cette raison).

**Testé** (`tests/companion-explain.test.js`, +2 tests, 105→107) :
`companion-bubble-celebrate` bien présent pour le mood "delighted",
absent pour "happy" (une bonne réponse simple ne doit pas avoir le
même accent qu'une série de jours).

**`CACHE_NAME`** incrémenté (`reparole-v6-51` → `reparole-v6-52`).

## v6.53 — Correctif : impossible de revenir facilement depuis "Proposer une contribution"

L'utilisateur a signalé qu'en cliquant sur le lien "Proposez une
correction" depuis le tableau de bord, il n'arrivait pas à revenir
aux exercices. En fait le lien de retour existait déjà
(`contribuer.html`), mais tout en bas d'un formulaire de 11 champs —
invisible sans faire défiler toute la page.

**Corrigé** : le même lien ("← Revenir à mon espace") est maintenant
affiché aussi tout en haut de la page, juste sous le logo, avant même
le formulaire — visible immédiatement en arrivant sur la page, sans
scroller. Gardé aussi en bas (habitude déjà prise ailleurs dans le
site). Reformulé en "mon espace" plutôt que "l'accueil" (plus clair :
on revient à SON tableau de bord, pas à un écran de connexion
générique).

**Vérifié que les autres pages autonomes n'ont pas le même problème** :
`mon-resume.html` a déjà son lien de retour en haut, `admin.html` a un
formulaire court (2 champs), le lien y est déjà visible sans scroller.

**`CACHE_NAME`** incrémenté (`reparole-v6-52` → `reparole-v6-53`).

## v6.54 — Paiement Stripe configuré et activé

Configuration complète faite en direct avec l'utilisateur, sur son
compte Stripe (mode test) et son projet Supabase existant :
- 4 tarifs créés (`price_...` récupérés un par un, pas si simple à
  trouver dans l'interface Stripe — la première tentative via le
  journal d'événements a fonctionné, mais la méthode fiable qu'on a
  gardée : ouvrir la fiche du produit, cliquer sur les "..." de la
  ligne du tarif précis dans le tableau "Tarifs", pas ceux du produit).
- 2 Edge Functions déployées (`create-checkout-session`,
  `stripe-webhook`) — piège rencontré deux fois : le champ "Function
  name" en bas de l'éditeur Supabase se remplit tout seul avec un nom
  généré ("swift-endpoint", "smooth-endpoint"...) qu'il faut remplacer
  à la main, et le fichier de code doit s'appeler exactement `index.ts`
  (un nom de fichier différent fait échouer le déploiement avec une
  erreur "Entrypoint path does not exist").
- "Verify JWT" laissé activé sur `create-checkout-session` (l'app
  envoie déjà `Authorization: Bearer <clé anon>`), désactivé sur
  `stripe-webhook` (Stripe n'envoie jamais de clé Supabase).
- 6 secrets configurés (clé secrète Stripe, 4 identifiants de tarif,
  secret de signature du webhook) — `SUPABASE_URL`/
  `SUPABASE_SERVICE_ROLE_KEY` sont fournis automatiquement par
  Supabase à chaque fonction, pas besoin de les ajouter.
- Webhook Stripe créé, à l'écoute de `checkout.session.completed`,
  `customer.subscription.updated`, `customer.subscription.deleted`.

**`PAYWALL_ENABLED` repassé à `true`** (`js/app.js`) — toute la
structure gratuit/pro, en sommeil depuis la v6.33, est maintenant
active. Toujours en mode **test** Stripe à ce stade (aucun risque,
cartes de test uniquement) — le passage en mode réel se fera plus
tard, en remplaçant les clés `sk_test_`/`pk_test_` par leurs
équivalents `_live_` une fois les tests concluants.

**Effet de bord sur les tests, corrigé** : `tests/plan-and-mfa.test.js`
avait un test qui vérifiait explicitement l'ancien comportement par
défaut ("paywall désactivé par défaut") — mis à jour pour vérifier le
nouveau comportement voulu ("paywall activé par défaut"). Petit piège
au passage : ce test utilisait `dom.window.eval("PAYWALL_ENABLED")`
pour lire la valeur directement — ne fonctionne pas depuis un `eval()`
séparé de celui où la variable est déclarée (même piège que celui
documenté en v6.43 pour `userCode`), corrigé avec un getter
(`__testGetPaywallEnabled`), sur le même principe que le setter déjà
présent. `tests/short-session.test.js` avait aussi un test cassé par
ricochet (un compte gratuit ne pouvait plus démarrer un exercice vocal
maintenant que le paywall bloque ça par défaut) — corrigé en forçant
`PAYWALL_ENABLED` à `false` dans ce fichier précis, qui teste le mode
"séance courte" et n'a rien à voir avec la logique de paiement.

**`CACHE_NAME`** incrémenté (`reparole-v6-53` → `reparole-v6-54`).

**Testé** : 13 suites, toutes ✅, avec le paywall actif par défaut.

## v6.55 — Plafond de 5 questions par session pour le compte gratuit

Nouvelle limite du plan gratuit, distincte de celles déjà en place
(langues, types d'exercices, quota de 5 séances/jour) :
`FREE_QUESTIONS_PER_SESSION = 5` (`js/app.js`) — un compte gratuit ne
voit plus que 5 questions par session, quel que soit le type
d'exercice (dénomination, complétion, compréhension, photos
personnelles), au lieu de la file complète (35 pour la dénomination
française, par exemple).

**Se combine avec le mode "séance courte"** (v6.41, 3 questions,
choix du patient pour les jours de fatigue) via un minimum : un
compte gratuit qui active "séance courte" reste à 3 (le plus petit des
deux), pas 5. Les deux plafonds restent conceptuellement différents
— l'un est une limite du plan, l'autre un choix du patient — mais
s'appliquent au même endroit du code (`startExercise()`), donc traités
ensemble plutôt que dupliqués.

**Comptes pro et paywall désactivé non concernés** : la file reste
complète dans les deux cas, comme avant.

**Photos personnelles traitées à part** (`type==='photos_perso'`,
construite dans un bloc de code séparé) : même plafond appliqué pour
la cohérence, un compte gratuit ne voit que 5 de ses photos par
session s'il en a ajouté plus.

**Hors périmètre pour l'instant** : le jeu de mémoire et la tenue
vocale ne passent pas par `startExercise()` (démarrés directement via
`Memory.start()`/`Phonation.intro()`) — pas concernés par ce plafond
tel quel. À voir si demandé explicitement.

**Testé** (`tests/free-tier-cap.test.js`, nouveau, 5 tests) : compte
gratuit plafonné à 5, compte pro non plafonné, combinaison avec
"séance courte" (le plus petit des deux s'applique), paywall
désactivé = pas de plafond, et un type ayant déjà moins de 5 items
(fluence, 2 catégories) n'est pas cassé par le calcul.

**`CACHE_NAME`** incrémenté (`reparole-v6-54` → `reparole-v6-55`).

## v6.56 — Conformité légale : mentions légales, CGV, CGU, résiliation en 3 clics

Suite à la question de l'utilisateur sur les obligations légales à
respecter avant l'ouverture réelle du site (maintenant que le paiement
Stripe est actif, v6.54). Chantier en plusieurs parties :

**Pied de page commun** (`js/footer.js`, injecté en JS plutôt que
dupliqué dans chaque fichier HTML) — 3 liens (Mentions légales, CGV,
CGU) sur les 5 pages où ça a du sens pour un patient/aidant/orthophoniste
(`index.html`, `aidant.html`, `mon-resume.html`, `contribuer.html`,
`dashboard-ortho.html`). Volontairement absent de `admin.html` (outil
interne) et `report.html` (destiné à l'impression, pas à la navigation).

**3 nouvelles pages** (`mentions-legales.html`, `cgv.html`, `cgu.html`)
— brouillons structurés avec des sections `[À COMPLÉTER]` clairement
identifiées (identité de l'éditeur, hébergeur, SIRET le cas échéant) :
point de départ à faire valider par un∙e juriste avant tout usage réel,
pas un texte définitif.

**Consentement obligatoire avant paiement** (écran tarifs,
`index.html`) — deux cases à cocher distinctes, décochées par défaut,
conformes au Code de la consommation (art. L221-28 13°) : acceptation
des CGV/CGU, et renonciation expresse au délai de rétractation de 14
jours (nécessaire pour un accès numérique immédiat). `startCheckout()`
bloque tant que les deux ne sont pas cochées, avec un message d'erreur
explicite pour chacune.

**Résiliation "en 3 clics"** (loi française) — nouvelle Edge Function
`create-portal-session` (voir `js/stripe-edge-functions.md`, section
5c, **à déployer par l'utilisateur** comme les deux précédentes) qui
ouvre le Customer Portal Stripe (factures, moyen de paiement,
résiliation) plutôt que de reconstruire cette interface. Nouvelle
carte "Mon abonnement" sur le tableau de bord patient, visible
uniquement pour un compte pro.

**Deux vrais bugs trouvés et corrigés en complétant ce chantier** :
1. `Store.createPortalSession()` était appelée par `manageSubscription()`
   mais n'existait nulle part dans `storage.js` — ajoutée, sur le même
   principe que `createCheckoutSession()`. Le paramètre transmis était
   aussi incorrect (`userCode`, le code de suivi de l'app, au lieu de
   `user.stripe_customer_id`, le seul identifiant que Stripe connaît).
2. **`loadPatient()` ne renvoyait jamais `plan` ni `stripe_customer_id`**
   au client (`js/storage.js`) — un patient qui venait de payer (le
   webhook Stripe met bien `plan='pro'` en base) se retrouvait "free"
   à la prochaine connexion, puisque `user` était reconstruit sans ce
   champ. Trouvé en câblant le Customer Portal, qui a besoin de
   `stripe_customer_id`, jamais exposé non plus jusqu'ici. Corrigé :
   les deux champs sont maintenant renvoyés.
3. **9 nouvelles clés `I18N_STRINGS` manquaient entièrement** — le
   HTML utilisait déjà `data-i18n="pricing_read_cgv"` etc., mais
   aucune traduction n'existait, dans aucune langue (`I18N.t()` sans
   correspondance affiche la clé elle-même comme texte, y compris en
   français). Ajoutées aux 9 langues complètes.
4. **`js/footer.js` n'était pas dans le cache hors-ligne** (`sw.js`) —
   repéré automatiquement par `tests/pwa-check.test.js`, qui fait
   exactement ce pour quoi il a été écrit. Corrigé, et les 3 nouvelles
   pages légales ajoutées au cache par la même occasion (cohérent avec
   les autres pages patient-facing déjà cachées).

**Testé** (`tests/legal-compliance.test.js`, nouveau, 11 tests +
2 nouveaux tests `createPortalSession` dans `plan-and-mfa.test.js`,
19→21) : présence du pied de page sur les 5 bonnes pages, absence sur
`admin.html`/`report.html`, blocage de `startCheckout()` sans les deux
cases cochées, déblocage une fois cochées, et `manageSubscription()`
qui échoue proprement (pas de plantage) si `stripe_customer_id` est
absent.

**`CACHE_NAME`** incrémenté (`reparole-v6-55` → `reparole-v6-56`).

**⚠️ Reste à faire par l'utilisateur** : déployer la 3ᵉ Edge Function
(`create-portal-session`), l'activer côté Stripe (Paramètres →
Customer portal — étape de configuration à part, séparée du
déploiement du code), et compléter les 3 pages légales avec ses vraies
informations avant toute relecture juridique.

## v6.57 — Préparation de l'ajout du sango (documents pour un∙e traducteur∙rice)

L'utilisateur veut ajouter le sango (langue nationale de la
République centrafricaine) et a accès à une personne pour traduire.
Vérifié avant de commencer : comme le kabyle, le sango n'a **aucune**
prise en charge par les services de synthèse/reconnaissance vocale des
navigateurs — recherches web sans aucune mention de support TTS/STT,
uniquement des agences de traduction spécialisées (signe d'une langue
à faibles ressources numériques). Traité comme le kabyle : langue
partielle, vocabulaire de dénomination uniquement, pas d'exercices
vocaux.

**Contrairement au kabyle**, où j'ai sourcé le vocabulaire moi-même
via plusieurs dictionnaires en ligne (Glosbe, kabyle.com...), **aucune
source fiable équivalente n'existe pour le sango** — plutôt que de
risquer des mots incorrects sans pouvoir les vérifier, préparé un vrai
document de demande de traduction pour la personne sango-phone de
l'utilisateur :

- `docs/sango-translation-request.md` — les 22 mêmes concepts déjà
  utilisés pour le kabyle (8 mots niveau 1, 8 niveau 2, 6 niveau 3 —
  chat, pomme, maison... jusqu'à olive/olivier), sous forme de tableau
  à remplir. Volontairement limité au vocabulaire de dénomination pour
  ce premier tour — pas de phrases complètes (accords grammaticaux
  trop risqués sans relecture native complète, même logique que pour
  le kabyle).
- `audio/sango/README.md` — guide d'enregistrement audio, sur le même
  modèle que `audio/kab/README.md`, à utiliser **après** que le texte
  soit finalisé (le nom des fichiers dépend de l'orthographe retenue).

**Rien codé pour l'instant** — `js/exercises-sango.js` sera créé une
fois la liste de mots reçue en retour. Pas de `CACHE_NAME` à
incrémenter (aucun fichier chargé par l'app n'a changé), suite de
tests inchangée (15 suites, 267 tests, toutes ✅).

## v6.58 — Paiement désactivé de nouveau (décision utilisateur) + suite sango

**`PAYWALL_ENABLED` repassé à `false`** (`js/app.js`), sur demande
explicite de l'utilisateur ("débranche le mode payant pour l'instant").
Décision volontaire, pas un problème technique — toute la structure
Stripe/CGV/CGU/Customer Portal construite en v6.54-v6.56 reste
intacte, prête à être réactivée d'un coup en repassant ce booléen à
`true`.

**Correctif de tests en cascade** : le test qui vérifiait le réglage
par défaut ("paywall activé par défaut", v6.54) a été mis à jour pour
vérifier le nouveau défaut réel (désactivé). Deux tests dans
`tests/free-tier-cap.test.js` supposaient implicitement que le paywall
était actif par défaut sans le forcer explicitement — corrigés pour
forcer `PAYWALL_ENABLED` eux-mêmes, plutôt que de dépendre du réglage
du moment (plus robuste pour la suite : ce genre de va-et-vient sur ce
réglage va probablement se reproduire).

**Suite du sango** : l'utilisateur a transmis 4 réponses de sa
personne sango-phone (livre = Dukusa, pomme = pomme, télévision = tele
vision, neige = nguändra) — 19 des 22 mots sont maintenant confirmés.
`docs/sango-translation-request.md` mis à jour, il ne reste que 3
points à trancher (voiture, bœuf, olive/olivier — voir le document).
Un lien supplémentaire fourni par l'utilisateur (PolyTranslator)
identifié comme un outil de traduction automatique généraliste, pas un
dictionnaire — expliqué pourquoi il n'a pas été utilisé comme source
(risque de fiabilité plus élevé sur une langue à faibles ressources).

**`CACHE_NAME`** incrémenté (`reparole-v6-56` → `reparole-v6-58`).

## v6.59 — Le sango apparaît dans l'app + généralisation "langue partielle"

L'utilisateur veut montrer l'app à sa personne sango-phone pour une
validation en direct, exercice par exercice, plutôt que d'attendre une
liste 100% complète. 19 des 22 mots étaient déjà confirmés ; les 3
derniers (voiture, bœuf, olive/olivier) ont été transmis directement
par elle.

**Généralisation nécessaire d'abord** : plusieurs mécanismes de l'app
étaient câblés spécifiquement pour `lang==='kab'` en dur (notices
d'interface dans `js/prefs.js`, sélection de banque de dénomination et
bouton d'écoute audio dans `js/app.js`) — ça aurait fonctionné pour le
kabyle mais pas pour le sango sans dupliquer tout ce code. Généralisé :
- **`PARTIAL_LANGS`** (`js/i18n.js`) : nouvelle liste centralisée
  (`['kab', 'sg']`) réutilisée par les notices d'interface, au lieu de
  vérifier "kab" à chaque endroit.
- **`isKabDenom`** (renommage à faire plus tard, gardé pour l'instant)
  détecte maintenant n'importe quelle banque `BANK_XX` qui a son
  propre champ `consigne` — signe distinctif d'une langue partielle,
  par opposition aux langues complètes qui utilisent `I18N.t()`.
- **`playKabWordUI` → `playPartialLangWordUI(lang, word)`** : fonction
  générique de lecture audio. Le découpage du nom de fichier
  (`partialLangAudioSlug`) réutilise `kabAudioSlug()` pour le kabyle
  (lettres ɣ/ḥ/ɛ... qui ne se décomposent pas via NFD Unicode), et un
  découpage NFD générique pour toute autre langue partielle — suffisant
  pour le sango, dont les diacritiques (â, ä, ö, ü) se décomposent
  normalement.

**`js/exercises-sango.js`** créé — 22 mots de dénomination (parité
avec le kabyle à sa création), avec le même niveau de rigueur de
sourcing/commentaires que pour le kabyle. Un mot reste marqué comme
incertain (🥔, à la place d'une "olive/olivier" qui ne pousse pas en
Centrafrique — la réponse reçue de la personne sango-phone n'était pas
claire) : gardé volontairement tel quel pour qu'elle puisse le
corriger en le voyant directement dans l'app, but explicite de
l'utilisateur pour cette livraison.

**"Compléter la phrase" et "Comprendre la consigne"** : toujours pas
traduits pour le sango, comme pour le kabyle — mêmes raisons
(accords grammaticaux non garantissables sans relecture native).

**Testé** (`tests/partial-lang-generalization.test.js`, nouveau, 7
tests) : le kabyle ET le sango utilisent bien leur propre banque et
leur propre bouton d'écoute sans code dédié, le français n'est pas
affecté (pas de régression), et le découpage des noms de fichiers
audio se comporte différemment (et correctement) pour les deux
langues selon leurs diacritiques respectifs.

**`CACHE_NAME`** incrémenté (`reparole-v6-58` → `reparole-v6-59`).

## v6.60 — Retour d'utilisation groupé : vrai doublon trouvé, clarification conversation, sortie propre du résumé imprimable

L'utilisateur a testé le site en conditions réelles et remonté 8
points d'un coup. Traités :

**Vrai bug trouvé : `LANGUAGES.sg` déclaré DEUX FOIS** (`js/i18n.js`)
— un reste d'une tentative antérieure, jamais nettoyé. En JavaScript,
un objet littéral avec une clé en double ne lève aucune erreur : la
seconde déclaration écrase silencieusement la première. C'est
exactement pourquoi renommer "Sängö" en "Sango" n'avait aucun effet
visible la première fois — j'éditais la première des deux, ignorée par
le moteur JS. Doublon supprimé, une seule entrée reste, label "Sango"
sans diacritiques comme demandé. **Nouveau test de régression** pour
que ce type de bug (silencieux, sans erreur) soit détecté
automatiquement à l'avenir.

**"Conversation guidée" clarifiée** — ce n'était pas un bug : contrairement
aux autres exercices, il n'y a pas de bonne/mauvaise réponse parmi les
boutons proposés (ce sont tous des formulations naturelles valables).
La vraie évaluation se fait uniquement si le patient répond à voix
haute. Ajout d'une phrase d'explication directement dans l'exercice
(`conv_choices_hint`, 9 langues) pour que ce ne soit plus ambigu.

**Sortie du résumé imprimable corrigée** — la page s'ouvre dans un
nouvel onglet (`window.open`, déjà existant), donc le tableau de bord
reste connecté en arrière-plan. Le bouton "← Revenir à mon espace"
forçait un rechargement vers `index.html` (écran de connexion) au lieu
de simplement fermer cet onglet. Corrigé : `window.close()` en
priorité (retombe sur le tableau de bord déjà connecté), avec un repli
vers `index.html` si le navigateur refuse la fermeture (cas rare, page
ouverte autrement que via le tableau de bord).

**Points restés en attente d'une précision de l'utilisateur** (pas
assez d'information pour agir sans deviner) :
- Espace aidant qui affiche une page blanche — non reproduit en
  testant le code directement (structure HTML/CSS/JS correcte, aucune
  erreur détectée). Demandé : erreurs de la console navigateur (F12)
  et confirmation que c'est bien la dernière version déployée.
- "Beaucoup plus de détails" dans le résumé imprimable — demandé quels
  détails précisément, pour ne pas construire dans la mauvaise
  direction.
- Remarque sur `CACHE_NAME` "resté sur v6-59" — capture montrée
  correspondait exactement à la version livrée à ce moment-là ; demandé
  clarification sur ce qui semblait ne pas suivre.

**Testé** (`tests/partial-lang-generalization.test.js`, +2 tests, 7→9) :
`LANGUAGES.sg` n'apparaît qu'une fois dans le code source, et son
label est bien "Sango".

**`CACHE_NAME`** incrémenté (`reparole-v6-59` → `reparole-v6-60`).

## v6.61 — Vrai bug trouvé : page blanche après connexion (espace aidant ET espace admin)

L'utilisateur a confirmé aucune erreur dans la console navigateur —
information clé pour trouver ce bug, qui est un problème d'affichage
CSS silencieux, pas un plantage JavaScript.

**Cause exacte** : `caregiver-dashboard` (dans `aidant.html`) avait à
la fois `class="screen"` (sans `"active"`) ET un style en ligne
`style="display:none"`. Après une connexion réussie,
`caregiverLogin()` faisait `element.style.display = ''` pour
l'afficher — ce qui vide bien le style en ligne, mais retombe alors
sur la règle CSS `.screen{display:none}` du fichier `style.css`,
puisque la classe `"active"` (qui donnerait `display:block`) n'a
jamais été ajoutée. Résultat : le tableau de bord restait invisible
pour toujours après une connexion "réussie", sans la moindre erreur —
d'où la difficulté à le repérer sans regarder le code précisément.

**Le même bug existait aussi dans `admin.html`/`js/admin.js`**, trouvé
en cherchant s'il y avait d'autres endroits avec ce même motif.
Corrigé aux deux endroits : bascule par `classList.add('active')` /
`classList.remove('active')` (comme le fait `show()` partout ailleurs
dans l'app) au lieu de manipuler `.style.display` directement, et
suppression du style en ligne devenu inutile dans les deux fichiers
HTML.

**Nouveau test de régression** (`tests/screen-visibility.test.js`,
10 tests) qui scanne **toutes** les pages HTML du site : aucun élément
`.screen` ne doit avoir de style `display` en ligne — ce test aurait
détecté ce bug avant qu'il n'atteigne un patient.

**"Conversation guidée" clarifiée** (suite du retour précédent) — pas
un bug : ajout d'une phrase d'explication dans l'exercice
(`conv_choices_hint`) précisant que les boutons proposés sont tous des
réponses valables, et que la vraie évaluation se fait à voix haute.

**Résumé imprimable : historique complet** — sur demande explicite de
l'utilisateur. Les données complètes existaient déjà côté serveur
(aucune limite dans les requêtes SQL) ; seul l'affichage était
plafonné à 20 séances et 10 entrées de journal. Plafonds retirés,
tout l'historique s'affiche désormais. Titre de section mis à jour
("Historique complet de mes séances").

**`CACHE_NAME`** — clarifié avec l'utilisateur : la valeur affichée
sur sa capture précédente (`reparole-v6-59`) correspondait bien à la
version livrée à ce moment-là, pas un bug de suivi de version.
Incrémenté normalement pour cette livraison (`reparole-v6-60` →
`reparole-v6-61`).

**Testé** : `tests/caregiver.test.js` avait 2 tests qui vérifiaient
l'ancien mécanisme (`style.display`) — mis à jour pour vérifier le
vrai mécanisme (`classList.contains('active')`). 17 suites, toutes ✅.

## v6.62 — Mise en page grand écran, mise à jour automatique, clarification conversation

**Mise à jour automatique** (`index.html`) — jusqu'ici, une nouvelle
version déployée restait invisible tant que le patient ne faisait pas
un rechargement forcé (Ctrl+Maj+R) lui-même. `self.skipWaiting()`/
`clients.claim()` (déjà présents dans `sw.js`) faisaient qu'un nouveau
service worker prenait le contrôle rapidement en arrière-plan — il
manquait juste un signal visible. Ajout d'une bannière discrète ("🔄
Nouvelle version disponible — Actualiser") qui apparaît dès qu'une
mise à jour est détectée, plutôt qu'un rechargement automatique forcé
(un patient en plein exercice ne doit pas se faire recharger la page
sans l'avoir demandé).

**Mise en page grand écran pour le tableau de bord** — les 9 cartes du
tableau de bord (progression, journal, exercices, photos, conversation,
Pro, abonnement, aidant, rappels) passent en grille 2 colonnes à
partir de 900px de large, plutôt que de rester empilées en une seule
colonne étroite comme sur mobile. **Rien ne change en dessous de
900px** (tous les téléphones, la plupart des tablettes) — comportement
identique à avant, testé et approuvé. Le bandeau du code de suivi, la
salutation, Ami et le bloc de réglages en bas de page restent
volontairement pleine largeur. Écran de connexion élargi plus
modestement (760px → 860px sur grand écran) — une vraie refonte à
deux zones (illustration + formulaire) reste possible en complément
si souhaitée.

**"Conversation guidée" — explication étendue au menu de sélection**
(suite de la clarification v6.60 à l'intérieur de l'exercice) : le
texte affiché avant de choisir un scénario précise maintenant que
répondre à voix haute est vraiment évalué, alors que toucher une
phrase suggérée est toujours accepté (roue de secours).

**Fichier de vocabulaire sango reçu, pas encore intégré** — la liste
de mots isolés transmise contient de nombreuses entrées qui semblent
être du français/anglais à peine modifié plutôt que du vrai
vocabulaire sango (ex : "LAPIN" inchangé, "CORBE" pour "moufette" qui
ne correspond à aucun des deux animaux). Signalé à l'utilisateur avant
toute intégration — les phrases de "Compléter la phrase"/"Comprendre
la consigne" du même fichier semblent en revanche nettement plus
fiables (grammaire cohérente, réutilise correctement du vocabulaire
déjà sourcé comme "yanga-da").

**Testé** (`tests/dashboard-grid.test.js`, nouveau, 4 tests) : les 9
cartes sont bien à l'intérieur de `.dashboard-grid`, les éléments
pleine largeur (bandeau, salutation, Ami, réglages) restent bien en
dehors. 18 suites, toutes ✅.

**`CACHE_NAME`** incrémenté (`reparole-v6-61` → `reparole-v6-62`).

## v6.63 — Grille fluide (3 colonnes sur très grand écran)

L'utilisateur a confirmé que la grille 2 colonnes (v6.62) fonctionne
bien, mais a remarqué de l'espace inutilisé sur les côtés sur un très
grand écran. `grid-template-columns:1fr 1fr` (nombre de colonnes fixe)
remplacé par `repeat(auto-fit, minmax(380px, 1fr))` (nombre de
colonnes fluide, décidé par le navigateur selon la largeur réelle
disponible) + `max-width` du tableau de bord relevé à 1400px (au lieu
de 1120px).

**Deux itérations avant la version retenue**, vérifiées à chaque fois
par un vrai rendu (Playwright, mesure directe du nombre de colonnes
produit via `getComputedStyle`, pas une supposition) :
- Premier essai (`minmax(340px,1fr)`, max-width 1560px) : montait
  jusqu'à 4 colonnes sur un écran large — trop pour seulement 9 cartes
  de hauteurs très différentes (risque de déséquilibre visuel, lignes
  avec beaucoup de vide à côté d'une carte plus haute que ses voisines).
  Écarté avant livraison.
- Version retenue (`minmax(380px,1fr)`, max-width 1400px) : **2
  colonnes de 900 à ~1250px** (l'essentiel des écrans), **3 colonnes
  seulement au-delà** — mesuré : 950px→2, 1100px→2, 1440px→3,
  1920px→3.

**Mobile reconfirmé intact** : en dessous de 900px, `.dashboard-grid`
reste en `display:block` (pas de grille du tout) — vérifié par un
rendu à 390px de large (taille iPhone), zéro changement par rapport à
avant v6.62.

**`CACHE_NAME`** incrémenté (`reparole-v6-62` → `reparole-v6-63`).

## v6.64 — Vrai problème de mise en page corrigé : mosaïque plutôt que grille figée

L'utilisateur a testé la grille 2-3 colonnes (v6.62/v6.63) en vrai et
a montré un grand vide sous "Votre progression"/"Mon journal", pendant
que "Exercices recommandés" (bien plus haute, 9 éléments) continuait
seule à côté. **Vrai problème, pas une impression** : la grille CSS
classique (`display:grid`) aligne les cartes sur des rangées strictes
— dès qu'une carte d'une rangée est nettement plus haute que ses
voisines, toute la rangée prend sa hauteur, laissant un vide sous les
cartes plus courtes qui ne peuvent pas "remonter" combler l'espace.

**Remplacé par une disposition en colonnes CSS** (`columns` / masonry
manuel, pas de librairie ajoutée) : chaque carte remonte dans la
colonne la plus courte au moment d'être placée, comme un vrai mur de
briques. `break-inside:avoid` empêche qu'une carte soit coupée en deux
entre colonnes.

**Vérifié objectivement, pas juste "ça a l'air bien"** : position et
taille exactes de chaque carte mesurées via Playwright
(`getBoundingClientRect()`), à 1920px de large — confirmé que chaque
carte s'enchaîne directement après la précédente dans sa colonne, sans
écart artificiel. Mobile revérifié intact (390px : une seule colonne,
7 cartes visibles, toutes pleine largeur).

**`CACHE_NAME`** incrémenté (`reparole-v6-63` → `reparole-v6-64`).

## v6.65 — Décoration de fond, mosaïque à 2 colonnes, Ami : 10 expressions + gestes

Session de travail en plusieurs allers-retours avec l'utilisateur,
toujours avec de vrais aperçus (Playwright) avant chaque décision —
rien livré à l'aveugle.

**Fond du tableau de bord** — même décoration réseau (cercles + lignes)
que l'écran de connexion, réutilisée et recolorée en tons très doux
(vert/ocre à faible opacité) pour rester lisible sur fond clair.
Choisie après comparaison avec une piste de formes floues, écartée.

**Mise en page définitivement en mosaïque à 2 colonnes** — après
plusieurs itérations chiffrées avec l'utilisateur (voir v6.62-v6.64) :
`display:grid` (rangées figées) → grille fluide 3 colonnes (encore trop
de vide) → `columns` en mosaïque 3 colonnes → **2 colonnes**, la mieux
équilibrée des options essayées. "Exercices recommandés" plafonnée à
520px avec défilement interne plutôt que de dominer toute une colonne.

**Ami : 10 expressions** (calme, heureux, réfléchit, surpris, fier,
fatigué, bienveillant, célèbre, écoute, parle) — chacune avec sa propre
bouche/yeux, et un accessoire animé propre à certaines (points qui
montent pour "réfléchit", "Z" qui flottent pour "fatigué", cœur qui bat
pour "bienveillant", confettis pour une série de jours, ondes sonores
pour "écoute"/"parle"). L'expression "réfléchit" a été corrigée après
retour de l'utilisateur (bouche asymétrique qui donnait un air
grincheux, non voulu) — remplacée par le sourire calme habituel, la
posture (bras) suffit à dire "réfléchit".

**Ami : bras + gestes, découplés de l'humeur** — demande explicite de
l'utilisateur ("le faire plus interagir", "pas figé"). Nouveau système
`pose` indépendant de `mood` : `wave` (salut, à l'arrivée), `point`
(montre un exercice, dans `explain()`), `celebrate` (bras levés, série
de jours), `chin` (réfléchit, conseil du jour), `neutral` (repos,
par défaut). Branché sur les vrais déclencheurs existants
(`moodFor()`/`poseFor()`), pas seulement une démo :
- `welcome`/`welcome_back` → calme + salut
- `tip` → réfléchit + menton
- `encourage` → passe de "gentle" à "caring" (cœur qui bat)
- `streak` → célébration + confettis (fusionné dans le mood "delighted"
  déjà existant plutôt que dupliqué)

**Écarté en cours de route, sur demande explicite** : personnage
humain (risque de représentation — quelle origine/couleur de peau
pour une app parlant à des patients dans 10 langues), couleur d'Ami
différente par langue (perte d'identité visuelle cohérente), et toute
forme de conversation libre avec Ami (garde-fou n°1, rappelé et
confirmé avec l'utilisateur).

**Testé** (`tests/companion-gestures.test.js`, nouveau, 10 tests) :
mapping mood/pose pour les nouveaux contextes, rendu SVG (bras "wave"
présents/absents selon le contexte), confettis liés au bon mood, et
non-régression sur l'expression "réfléchit" (même bouche que "calme").
19 suites, toutes ✅ — y compris les 107 tests existants sur les
explications d'Ami, inchangés.

**`CACHE_NAME`** incrémenté (`reparole-v6-64` → `reparole-v6-65`).

## v6.66 — Bannière de mise à jour : ne fonctionnait pas sur mobile

L'utilisateur a testé sur téléphone : la bannière "Nouvelle version
disponible" (v6.62) n'apparaissait jamais, malgré une vraie mise à
jour déployée.

**Cause probable** : la vérification (`reg.update()`) ne se
déclenchait qu'une seule fois, au chargement initial de la page
(`window.addEventListener('load', ...)`). Sur ordinateur, on ferme et
rouvre plus souvent un vrai onglet (nouveau "load" à chaque fois). Sur
téléphone, on revient le plus souvent sur un onglet — ou une PWA
ajoutée à l'écran d'accueil — déjà ouvert, sans jamais redéclencher
"load" : la vérification ne se relançait donc jamais après la toute
première ouverture.

**Corrigé** : nouvelle vérification à chaque retour au premier plan
(`visibilitychange`), en plus de celle du chargement initial — un
patient qui rouvre l'app depuis son écran d'accueil ou qui revient
dessus après avoir utilisé une autre app la déclenche maintenant à
chaque fois.

**Correctif secondaire** : la bannière utilisait `bottom:18px` fixe,
qui peut se retrouver masquée par la barre gestuelle des iPhone
récents (invisible en test sur ordinateur) — passé à
`calc(18px + env(safe-area-inset-bottom))`, qui s'ajuste
automatiquement à la zone sûre de l'écran.

**Point restant, hors de portée du code** : GitHub Pages applique son
propre temps de cache HTTP par défaut sur les fichiers statiques
(dont `sw.js` lui-même) — même avec ces correctifs, un navigateur peut
mettre un peu de temps avant de récupérer le tout nouveau `sw.js`
depuis le réseau plutôt qu'une version en cache. Le comportement
devrait rester nettement plus fiable qu'avant, sans être instantané à
la seconde près.

**`CACHE_NAME`** incrémenté (`reparole-v6-65` → `reparole-v6-66`).

## v6.67 — Détection de la langue du navigateur pour proposer kabyle/sango d'emblée

Jusqu'ici, l'app démarrait toujours en français, quelle que soit la
langue du système/navigateur — le kabyle et le sango n'étaient
accessibles qu'en les choisissant explicitement dans le sélecteur, ce
qui les rend faciles à ne jamais découvrir pour quelqu'un dont
l'appareil est déjà configuré dans l'une de ces langues.

**Corrigé** : à la toute première visite (aucune préférence encore
enregistrée dans `localStorage`), `Prefs.load()` (`js/prefs.js`)
consulte `navigator.languages` et, si le navigateur/appareil est
configuré en kabyle ou en sango, démarre directement dans cette
langue.

**Volontairement limité à `PARTIAL_LANGS` (kab/sg), pas à toutes les
langues proposées** : l'anglais, l'espagnol, etc. n'ont pas ce problème
de découvrabilité (ce sont des choix visibles et attendus dans le
sélecteur), donc rebasculer automatiquement tout le monde vers la
langue système serait plus perturbant qu'utile pour un public de
patients en rééducation, qui n'a pas forcément envie de changement de
langue non sollicité. La bannière "langue partielle" continue de
s'afficher normalement dans ce cas — pas de fausse promesse de
traduction complète (garde-fou n°4).

**Un choix déjà enregistré n'est jamais écrasé**, y compris si
l'appareil change de langue système entre deux visites (autre onglet,
autre profil...) — la détection ne s'exécute qu'une seule fois, avant
toute première sauvegarde.

**Testé** : `tests/browser-lang-detect.test.js` (6 tests) — détection
kabyle, détection sango, non-écrasement d'une préférence déjà
enregistrée, pas de bascule automatique pour une langue non partielle
(ex. anglais), et code de langue non reconnu géré sans erreur.

`CACHE_NAME` incrémenté (`reparole-v6-66` → `reparole-v6-67`).

## v6.68 — Mode "cibles agrandies" : accessibilité motrice (pas seulement le langage)

Premier chantier du volet "spécifique AVC" du document de reprise :
beaucoup de patients ont aussi des séquelles motrices (tremblement,
spasticité, hémiplégie — mobilité réduite d'un côté du corps), pas
seulement un trouble du langage. Rien dans l'app ne leur facilitait la
vie côté précision du geste.

**Ajouté** : une nouvelle préférence d'accessibilité `bigTargets`
(`js/prefs.js`), au même endroit et avec le même mécanisme que les
préférences existantes (dyslexie, séance courte) — bouton "🤚 Boutons
agrandis" dans le bandeau d'accessibilité, à l'écran de connexion et
sur le tableau de bord.

**Ce que ça change concrètement** (`css/style.css`, classe
`body.big-targets`) : boutons, choix de réponse, sélecteur de langue et
puces de mots passent à des zones tactiles nettement plus grandes
(64px pour les choix de réponse, 56-64px ailleurs — au-delà des 44-48px
habituellement recommandés) avec plus d'espace entre elles, pour
réduire les appuis accidentels sur le mauvais bouton. Aucun changement
de texte ni de mise en page : uniquement la taille et l'espacement des
cibles, dans les 9 langues déjà traduites en entier (kabyle/sango
restent volontairement hors traduction d'interface, comme le reste).

**Volontairement pas fait dans cette version** : pas de réagencement
"pensé pour une seule main" (déplacer les contrôles d'un côté de
l'écran) — l'app est déjà en une seule colonne verticale, donc
utilisable au pouce quelle que soit la main, et un réagencement plus
poussé mériterait d'abord un retour de vraies personnes concernées
plutôt qu'une hypothèse de ma part.

**Testé** : `tests/motor-accessibility.test.js` (8 tests) — off par
défaut, bascule dans les deux sens, persistance après rechargement,
compatibilité avec les autres préférences (dyslexie), présence du
bouton aux deux emplacements, reflet visuel de l'état actif, et
traduction complète de la nouvelle clé dans les 9 langues.

`CACHE_NAME` incrémenté (`reparole-v6-67` → `reparole-v6-68`).

## v6.69 — Télécharger mes données / restaurer ma progression

Suite du volet "spécifique AVC" : deux besoins identifiés lors du
brainstorm précédent.

**Ajouté** (`js/app.js`, boutons dans `index.html`) :
- **"📥 Télécharger mes données"** : génère un fichier JSON contenant
  tout ce que le patient connecté peut voir sur lui-même (profil,
  historique de séances, journal, erreurs, mots ajoutés par un∙e
  aidant∙e) — pour la portabilité RGPD, indépendamment du mode de
  sauvegarde (cloud ou navigateur).
- **"📤 Restaurer ma progression"** : réimporte un fichier exporté par
  le bouton ci-dessus dans le compte actuellement connecté.

**Construit sur la couche `Store` existante (`js/storage.js`)**, pas
sur `localStorage` directement : fonctionne à l'identique en mode
cloud et en mode navigateur, sans dupliquer la logique déjà en place
pour l'export CSV côté orthophoniste (`js/dashboard-ortho.js`).

**Restauration volontairement limitée au profil agrégé
(séances/score/streak/niveau, toujours pris au maximum entre
l'existant et le fichier, jamais un recul) et au journal.** Les
séances et erreurs individuelles ne sont **pas** rejouées une par
une : ni `logSession` ni `logError` (ni `addJournalEntry`, en fait)
n'acceptent de date fournie par le client — la date est toujours
"maintenant", côté RPC Supabase comme côté `localStorage`. Réimporter
d'anciennes séances les aurait donc datées silencieusement
d'aujourd'hui, faussant les courbes de progression — contraire au
garde-fou n°5 (pas de score truqué). Un vrai rejeu fidèle nécessiterait
d'ajouter un paramètre de date optionnel aux fonctions RPC
(`sql/schema.sql`), donc une migration à appliquer manuellement côté
Supabase — noté pour plus tard si le besoin se confirme, pas fait dans
cette version.

Le journal, lui, est du texte libre sans incidence sur un graphique :
le réimporter avec la date du jour est sans risque. Dédoublonné par
contenu exact (une même phrase n'est pas réimportée deux fois).

**Testé** : `tests/export-restore-data.test.js` (7 tests) — contenu de
l'export, restauration du profil sans jamais reculer, réimport du
journal, non-duplication en cas de double import, fichier de version
inconnue rejeté proprement, JSON illisible géré sans plantage,
présence des deux boutons.

`CACHE_NAME` incrémenté (`reparole-v6-68` → `reparole-v6-69`).

## v6.70 — Bouton "❓ Aide" à la demande, pour tous les exercices, dans toutes les langues

Demande directe : une aide disponible dans toutes les langues, pour
tous les exercices. Jusqu'ici, l'explication d'Ami (`Companion.explain()`,
voir v6.34) ne s'affichait qu'une fois, à l'arrivée sur l'exercice — si
le patient l'avait fermée trop vite ou revenait dessus après une
pause, impossible de la revoir sans recommencer.

**Ajouté** : un bouton "❓ Aide" qui revient à tout moment
sur l'exercice en cours, dans :
- l'écran d'exercice principal (`#exercise`, tous les types :
  dénomination, dénomination orale, complétion, compréhension,
  répétition, fluence, intonation, mes photos) — nouvelle fonction
  `showExerciseHelp()` dans `js/app.js`, basée sur `current.type` ;
- les trois écrans indépendants qui ont leur propre logique (jeu de
  mémoire, tenue vocale, conversation guidée) — bouton dédié dans
  chacun, chaque fois qu'ils avaient déjà `Companion.explain()`.

**Aucun nouveau contenu à traduire** : réutilise telles quelles les
explications déjà écrites pour `Companion.explain()` (9 langues
complètes, 11 types d'exercice déjà couverts depuis v6.34). Le kabyle
et le sango affichent le repli en français, comme partout ailleurs
pour ces langues partielles — aucune traduction inventée ici (garde-fous
n°3 et n°4).

**Testé** : `tests/exercise-help-button.test.js` (10 tests) — présence
et câblage du bouton, bon texte pour deux types d'exercice différents,
suit un changement de langue, repli correct en kabyle, ne plante pas
sans exercice en cours, couverture des trois écrans indépendants,
traduction du libellé du bouton dans les 9 langues.

`CACHE_NAME` incrémenté (`reparole-v6-69` → `reparole-v6-70`).

## v6.71 — Mode sombre + codes mémorisés (accès rapide, plusieurs profils sur un appareil)

*(entrée de changelog ajoutée après coup en v6.73 — cette version avait
été codée et testée mais jamais documentée ici ni versionnée dans
`CACHE_NAME`, un oubli réparé maintenant.)*

**Mode sombre** (`css/style.css`, `js/prefs.js`) : même mécanisme que
les autres préférences d'accessibilité (`body.dys`, `body.big-targets`),
via `body.dark-mode` — une palette de couleurs dérivée de la palette
claire (mêmes rôles, pas de nouvelle structure), pensée pour le confort
visuel et la fatigue oculaire, fréquente en post-AVC.

**Codes mémorisés** (`js/app.js`) : en creusant l'accessibilité motrice,
constat qu'même un∙e patient∙e seul∙e sur son propre appareil doit
retaper son code de suivi (~14 caractères aléatoires) à chaque visite —
un vrai obstacle. Les profils déjà utilisés sont désormais mémorisés
localement (sur l'appareil, jamais envoyés à un serveur), avec un
accès en un geste (`quickLogin()`) et un bouton "oublier ce profil"
explicite pour un appareil partagé. Couvre au passage le besoin
"plusieurs personnes sur le même appareil" sans construire de vrai
système de comptes multiples : chaque code reste indépendant, mémorisé
séparément.

## v6.72 — "Mots à revoir" : favoris + mots les plus souvent manqués

*(même rattrapage de changelog qu'au-dessus.)*

**Favoris** (`js/storage.js`, `js/app.js`) : bouton étoile sur les
exercices "Nommer les images" / "dénomination orale" (`favoriteStarHTML()`),
pour marquer un mot à repratiquer plus tard, indépendamment du niveau
adaptatif automatique. Nouvelle table `favorite_words` déjà écrite dans
`sql/schema.sql` (avec repli local automatique tant que la migration
n'est pas appliquée côté Supabase — voir "Actions en attente"
ci-dessous).

**Mots les plus souvent manqués** (`renderWordsToReview()` dans
`js/app.js`) : combine les favoris avec un simple dénombrement des
mots qui reviennent le plus dans `errorHistory` (jamais un score ni un
diagnostic — garde-fous n°5/6). Purement informatif : aucune action
automatique n'en découle, juste une carte "Mots à revoir" sur le
tableau de bord, qui donne enfin un sens visible à ce qui était déjà
suivi en coulisses pour l'export CSV de l'orthophoniste.

## v6.73 — Bug corrigé (dossier audio du sango) + outil de suivi des enregistrements manquants

**Vrai bug trouvé en construisant l'outil ci-dessous** :
`playPartialLangWordUI('sg', ...)` (`js/app.js`) construisait le
chemin audio directement à partir du code de langue (`audio/sg/...`),
alors que le dossier réel — documenté dans `audio/sango/README.md` — est
`audio/sango/`. Jamais remarqué jusqu'ici puisque zéro enregistrement
n'existe encore pour aucune des deux langues partielles : le message
"pas encore d'enregistrement" s'affichait dans les deux cas, masquant
le problème. Corrigé avec une table de correspondance explicite
(`PARTIAL_LANG_AUDIO_FOLDER`) plutôt que de renommer le dossier, pour
ne pas invalider les instructions déjà données à d'éventuel∙le∙s
contributeur∙rice∙s dans le README.

**Ajouté** : `audio-checklist.html`, accessible depuis
`contribuer.html`. Liste tout le vocabulaire déjà présent dans
`js/exercises-kab.js` / `exercises-sango.js` (exercice "Nommer les
images", seul traduit pour ces deux langues à ce jour) et vérifie, en
interrogeant le serveur, lequel a déjà un fichier audio réel — sans
générer ni deviner aucune prononciation, juste un état des lieux pour
prioriser les prochains enregistrements. Fonctionne aussi bien en
local (`python3 -m http.server`) qu'en ligne ; un message prévient si
la vérification est bloquée (ex. page ouverte directement depuis le
disque).

**Testé** : `tests/audio-checklist.test.js` (8 tests) — correction du
bug de dossier, collecte des mots sans doublon pour les deux langues,
bon calcul de chemin pour chacune, comportement sans plantage quand la
vérification réseau échoue.

`CACHE_NAME` incrémenté (`reparole-v6-70` → `reparole-v6-73`, pour
couvrir les trois versions non versionnées jusqu'ici).

## v6.74 — Retour utilisateur sur une capture d'écran : contraste des champs en mode sombre + vitesse du jeu de mémoire

Deux retours directs après capture d'écran du mode sombre (v6.71) en usage réel.

**Contraste des champs en mode sombre** (`css/style.css`) : "pour voir
le nom et le code c'est pas top". Les champs de saisie (prénom, code de
suivi...) se distinguaient trop peu du fond de carte — `--surface-soft`
et `--line` éclaircis, et bordure des champs légèrement plus épaisse
spécifiquement en mode sombre, pour que la zone cliquable se voie
clairement.

**Vitesse réglable du jeu de mémoire** (`js/memory.js`) : la séquence
s'affichait à un rythme fixe (900ms/image) quel que soit le niveau —
demande explicite d'un vrai "lent" pour commencer, avec possibilité de
monter en vitesse. Trois vitesses (`MEMORY_SPEED_MS` : lent 1800ms,
normal 1100ms, rapide 650ms), réglables via un sélecteur sur l'écran du
jeu, persistées comme les autres préférences (`Prefs.data.memorySpeed`).
Indépendant de la longueur de séquence (déjà adaptée au niveau du
patient) : on peut vouloir une séquence courte ET lente, ou l'inverse.

**Testé** : `tests/memory-speed.test.js` (8 tests) — valeur par défaut,
délais croissants selon la vitesse, repli sur une valeur invalide,
persistance du choix, présence et bon câblage du sélecteur, reflet
d'une préférence déjà enregistrée, traduction dans les 9 langues.

`CACHE_NAME` incrémenté (`reparole-v6-73` → `reparole-v6-74`).

## v6.75 — Mode sombre + retour à l'accueil sur l'espace aidant et l'espace orthophoniste

Retour utilisateur : le mode sombre (v6.71) n'existait que sur
`index.html` — `aidant.html` et `dashboard-ortho.html` ne chargeaient
même pas `js/prefs.js`. Au passage, l'espace orthophoniste n'avait
aucun lien retour vers l'accueil, nulle part.

**Ajouté** :
- `js/prefs.js` chargé sur les deux pages, avec `Prefs.load()` — reste
  silencieux en l'absence de `js/i18n.js` (non chargé sur ces deux
  pages, qui restent français uniquement) : `Prefs.apply()` ne
  touche que le mode sombre et les éléments `[data-pref]` sur ces
  pages, pas la langue.
- Bouton "🌙 Mode sombre" sur le tableau de bord principal des deux
  espaces.
- Lien "← Accueil" vers `index.html` sur le tableau de bord aidant et
  le tableau de bord orthophoniste, et sur l'écran de connexion
  orthophoniste (qui n'en avait aucun jusqu'ici — celui d'aidant.html
  en avait déjà un).

**Nettoyage au passage** : `Prefs.setMemorySpeed()` / `[data-memory-speed]`
(introduits dans le même commit que `Prefs.data.memorySpeed` par
anticipation, mais jamais reliés à un vrai bouton HTML) supprimés —
la vitesse du jeu de mémoire (v6.74) est gérée par `Memory.setSpeed()`
et le sélecteur `#memory-speed-select`, seul mécanisme réellement
utilisé.

**Contexte** : cette version fait aussi suite à un retour sur capture
d'écran du mode sombre (contraste des champs, v6.74) — bonne occasion
de vérifier sa couverture sur le reste du site au même moment.

**Testé** : `tests/dark-mode-other-spaces.test.js` (8 tests) —
chargement sans erreur sur les deux pages, bouton mode sombre
fonctionnel sur chacune, présence des liens retour (dont celui qui
manquait sur l'espace orthophoniste), navigation interne existante non
cassée par l'ajout.

`CACHE_NAME` incrémenté (`reparole-v6-74` → `reparole-v6-75`).

## v6.76 — Espace aidant et espace orthophoniste traduits dans les 9 langues

Suite directe de la question "pourquoi ces deux pages restent en
français ?" — réponse : aucune décision documentée, juste un oubli de
portée (le multilingue avait été construit pour `index.html` en
premier). Corrigé pour les deux pages, dans les 9 langues déjà
complètes ailleurs (fr/en/es/it/pt/de/ar/tr/pl).

**Espace aidant** (`aidant.html`, `js/caregiver.js`) : tout le texte
statique (`data-i18n`), plus le contenu généré en JS — salutation,
date de dernière séance, messages d'erreur, et les 9 conseils du jour
(`js/caregiver-tips.js` reste volontairement en français pur, utilisé
par les tests Node ; c'est `js/caregiver.js` qui applique la
traduction à l'affichage via les nouvelles clés `cg_tip_*`).

**Espace orthophoniste** (`dashboard-ortho.html`,
`js/dashboard-ortho.js`) : les 5 écrans (connexion, code de sécurité,
liste des patients, tarifs, détail patient) plus tous les messages
dynamiques — authentification, double authentification, liste triée
de patients, analyse d'erreurs, tendance, notes, rapports. Réutilise
`level_1/2/3` et `stat_sessions/success/streak` déjà traduits côté
patient plutôt que de dupliquer. Les catégories d'erreur et les 9
profils cliniques (Broca, Wernicke, aphasie globale...) ont chacun
une version longue et courte traduite.

**Vrai bug corrigé au passage** : le sélecteur de bouton "🌙 Mode
sombre" ajouté en v6.75 sur ces deux pages n'avait pas
`data-i18n="access_toggle_dark_mode"` (contrairement à celui
d'`index.html`) — juste oublié sur le coup, maintenant cohérent.

**Nettoyage** : `LEVEL_NAMES` (objet français codé en dur) supprimé de
`js/dashboard-ortho.js`, remplacé par `levelName()` — même principe
que `js/app.js` depuis v6.9. `report.html` et `mon-resume.html`
gardent leur propre `LEVEL_NAMES` local, hors du périmètre de cette
version (pages d'impression, pas des espaces applicatifs).

**Testé** : `tests/caregiver-ortho-i18n.test.js` (12 tests) —
sélecteurs de langue présents, traduction du texte statique et
dynamique sur les deux espaces, repli propre pour les langues
partielles (kabyle/sango), profils cliniques et catégories d'erreur
traduits, aucun crash si le détail patient est retraduit sans données
chargées.

`CACHE_NAME` incrémenté (`reparole-v6-75` → `reparole-v6-76`).

## v6.77 — Vrai bug corrigé : le jeu de mémoire démarrait avant de pouvoir choisir la vitesse

Retour utilisateur (capture d'écran) : "le jeu commence avant que je
puisse choisir l'option [de vitesse]". Confirmé — `Memory.start()`
enchaînait directement sur l'affichage de la séquence à mémoriser,
sans laisser le temps de toucher au sélecteur de vitesse (v6.74),
pourtant affiché juste au-dessus.

**Corrigé** (`js/memory.js`) : `Memory.start()` affiche maintenant un
écran "prêt ?" explicite (`_renderIntro()`, bouton "▶️ Commencer") — la
première manche ne se lance qu'à son clic, laissant tout le temps de
régler la vitesse avant. Les manches suivantes (2 à 5) s'enchaînent
normalement, sans repasser par cet écran (l'utilisateur a déjà réglé
sa vitesse à ce stade).

**Testé** : `tests/memory-intro-screen.test.js` (5 tests) — écran
d'introduction affiché avant toute séquence, aucune séquence tirée
avant le clic, sélecteur de vitesse toujours utilisable à ce moment,
la vitesse choisie avant de cliquer est bien celle appliquée à la
première manche (vérifié jusqu'au délai réel passé à `setTimeout`), et
les manches suivantes ne redemandent pas de clic.

`CACHE_NAME` incrémenté (`reparole-v6-76` → `reparole-v6-77`).

## v6.78 — Carte "Vos photos" : ordre revu, retour utilisateur, "Comment ça marche ?"

Retour utilisateur (capture d'écran) : le texte de la carte donnait
l'impression d'être dupliqué, et rien n'expliquait ce qui se passe
après avoir ajouté une photo ("et ensuite ?"). En creusant : ce n'était
pas un vrai doublon de texte, mais deux phrases différentes empilées
au mauvais endroit — la description de la carte, puis le message
"aucune photo" du `#media-grid` (qui était positionné AVANT le
formulaire au lieu d'après), ce qui donnait l'impression de lire deux
fois la même consigne avant même de voir le formulaire.

**Réordonné** (`index.html`) : description → bloc "Comment ça marche
?" (nouveau, repliable) → formulaire → message de confirmation →
liste des photos déjà ajoutées. Le message "aucune photo" se retrouve
maintenant logiquement après le formulaire, plus avant.

**Ajouté** : un bloc **"❓ Comment ça marche ?"** (élément HTML natif
`<details>/<summary>`, pas de JS nécessaire) qui explique ce qui se
passe après l'ajout — qu'un nouvel exercice « Nommer vos photos » 📷
apparaît dans la liste des exercices. C'était l'information manquante
derrière le "et ensuite ?".

**Ajouté** : un message de confirmation explicite après l'ajout
(`#media-status`, ex. "✅ Photo « jardin » ajoutée ! Retrouvez-la dans
l'exercice « Nommer vos photos »…") — jusqu'ici, `renderMedia()`
rafraîchissait silencieusement la grille sans rien dire à l'utilisateur.

**Vrai bug corrigé au passage** : la validation du formulaire
(photo/mot manquant) utilisait `alert()` — une fenêtre native jamais
traduite dans les 9 langues et incohérente avec le reste de l'app (qui
affiche toujours ses erreurs en ligne). Remplacé par le même
`#media-status` que la confirmation.

**Traduit** dans les 9 langues complètes (`photos_how_it_works_title`,
`photos_how_it_works_text`, `photos_added_status`,
`photos_added_list_title`, `photos_err_missing`) ; `photos_empty` a
aussi été reformulé (moins redondant maintenant qu'il apparaît après
le formulaire, pas avant).

**Testé** : `tests/photos-card.test.js` (8 tests) — ordre des blocs,
position du message vide par rapport au formulaire, présence du bloc
"Comment ça marche", remplacement de l'alert() par un message en
ligne, confirmation après ajout avec le mot ajouté, apparition de
l'exercice "Nommer vos photos", titre de liste masqué tant qu'aucune
photo n'existe.

`CACHE_NAME` incrémenté (`reparole-v6-77` → `reparole-v6-78`).

## v6.79 — Performance (indices réseau, chargement des polices) + accessibilité (régions live, noms accessibles, focus, fin des alert())

Suite de la discussion sur la performance et l'accessibilité.

### Performance

**Mesuré avant d'agir** : la taille brute des fichiers JS donnait une
image trompeuse — `js/i18n.js` (272 Ko brut) ne pèse en réalité que
**80 Ko compressé (gzip)**, et le total JS d'`index.html` avoisine
**228 Ko compressé**, ce qui reste raisonnable. Le vrai chantier
(charger uniquement la langue active plutôt que les 10 déjà
disponibles) est noté pour plus tard, quand le nombre de langues aura
significativement augmenté — le rapport effort/risque n'est pas encore
favorable aujourd'hui (`Prefs.setLang()`/`I18N.t()` sont utilisés de
façon synchrone dans toute l'app et dans une trentaine de fichiers de
test).

**Fait maintenant, sans risque** :
- **Préconnexion Supabase** (`<link rel="preconnect">` +
  `dns-prefetch`) sur les 7 pages qui l'utilisent — accélère la toute
  première requête API.
- **Vrai bug corrigé** : les polices (Google Fonts) étaient chargées
  via `@import` dans `css/style.css` — un `@import` CSS force un
  aller-retour réseau supplémentaire en série (le navigateur doit
  d'abord télécharger et lire tout `style.css` avant même de découvrir
  qu'il faut aller chercher la police). Remplacé par des `<link
  rel="preconnect">` + `<link rel="stylesheet">` dans le `<head>` de
  chaque page, découverts et chargés en parallèle dès le début.
- **Autre bug corrigé au passage** : `Fraunces` (utilisée pour les prix
  sur `dashboard-ortho.html`) n'était référencée dans aucun import —
  elle ne s'est donc jamais réellement affichée, toujours repliée sur
  `serif` en silence. Ajoutée à la même balise `<link>`.

### Accessibilité

Audit avant correctifs : **seuls 2 messages de statut dynamiques sur
toute l'app étaient annoncés à un lecteur d'écran** (sur ~19 au total),
plusieurs champs de formulaire n'avaient **aucun nom accessible**, le
focus clavier reposait sur un simple changement de couleur de bordure
(souvent trop discret), et **6 `alert()` natifs** traînaient encore.

- **`role="status" aria-live="polite"`** ajouté sur les 19 messages de
  statut/erreur dynamiques restants (`index.html`, `aidant.html`,
  `dashboard-ortho.html`, `contribuer.html`, `admin.html`) — annoncés
  automatiquement dès qu'ils changent, sans que la personne ait besoin
  de les trouver elle-même sur l'écran.
- **Nouveau mécanisme `data-i18n-aria-label`** dans `js/i18n.js`
  (même principe que `data-i18n-placeholder`, déjà existant) — pour
  les champs sans `<label>` visible. Appliqué à 10 champs qui n'avaient
  jusqu'ici aucun nom accessible du tout (mot-clé photo, fichier photo,
  email de rappel, emoji aidant, code patient à rattacher, profil
  clinique, note clinique, code de confirmation MFA...).
- **Focus clavier renforcé** : `box-shadow` ajouté en plus du
  changement de couleur de bordure sur les champs de formulaire et le
  sélecteur de langue — un changement de couleur seul est souvent trop
  discret pour bien voir quel champ a le focus.
- **Les 6 derniers `alert()`/`confirm()` natifs remplacés** par des
  messages en ligne (connexion sans code, création d'accès aidant,
  démarrage de l'exercice photos sans photo, patient introuvable côté
  ortho, échec de relecture côté admin) — cohérent avec le reste de
  l'app, et bien mieux géré par les lecteurs d'écran qu'une fenêtre
  native jamais traduite.

**Testé** : `tests/perf-hints.test.js` (20 tests) et
`tests/accessibility.test.js` (11 tests) — présence des indices de
performance sur toutes les pages concernées, régions live sur tous les
messages de statut, noms accessibles sur les champs identifiés, focus
renforcé, absence de tout `alert()` restant.

`CACHE_NAME` incrémenté (`reparole-v6-78` → `reparole-v6-79`).

## v6.80 — Boîte à idées ("Une idée, une remarque ?")

Suite de la discussion sur le coffre-fort patient : le coffre-fort
optionnel est mis de côté pour l'instant, la boîte à idées retenue en
premier.

**Ajouté** : un widget "💡 Une idée, une remarque ?" (repliable,
`<details>/<summary>`, discret par défaut) présent sur les trois
espaces — tableau de bord patient (`index.html`), espace aidant
(`aidant.html`), tableau de bord orthophoniste (`dashboard-ortho.html`)
— message libre + contact facultatif (si la personne veut une
réponse). Un seul module partagé (`js/suggestions.js`), réutilisé sur
les trois pages ; seule la source passée à `submit()` change
(`'patient'`/`'caregiver'`/`'ortho'`).

**Volontairement séparé** de la base de connaissances communautaire
(`content_items`, contributions de traduction) : nouvelle table
`suggestions` dans `sql/schema.sql`, avec RLS dédiée (lecture/mise à
jour réservées aux administrateurs, écriture uniquement via la
fonction `submit_suggestion` qui force toujours `status='new'`). Pas
de statut approuvé/refusé ici — juste nouveau/lu/archivé, trié à la
main.

**Espace admin** (`admin.html`) : nouvelle section "💡 Suggestions
reçues", avec filtre (nouvelles / toutes / archivées) et actions
marquer-lu/archiver. Aucune réponse automatique n'est envoyée
(garde-fou n°4, même principe étendu au-delà de la traduction) — à
l'administrateur∙rice de recontacter via l'email laissé, si fourni.

**Repli local** si le mode cloud n'est pas configuré (comme les mots
favoris) : le message n'est pas perdu, même si personne ne peut encore
le lire côté admin sans mode cloud actif.

**Testé** : `tests/idea-box.test.js` (11 tests) — présence du widget
avec la bonne source sur les trois pages, validation du message vide,
confirmation et enregistrement corrects, contact facultatif, filtres
et changement de statut côté admin.

`CACHE_NAME` incrémenté (`reparole-v6-79` → `reparole-v6-80`).

## v6.81 — Vrai bug corrigé : mot de passe oublié n'avait nulle part où atterrir

Trouvé en usage réel : envoyer un email de récupération de mot de
passe (que ce soit depuis le tableau Supabase ou l'app) redirigeait
vers l'accueil de l'app — aucune page n'existait pour saisir le
nouveau mot de passe.

**Ajouté** :
- `reset-password.html` — détecte le jeton de récupération dans l'URL
  (mécanisme standard `detectSessionInUrl` de supabase-js, déjà actif
  par défaut), attend l'évènement `PASSWORD_RECOVERY`, puis affiche un
  formulaire (mot de passe + confirmation, mêmes règles de robustesse
  que la création de compte orthophoniste). Repli propre "lien invalide
  ou expiré" si le jeton est absent/périmé.
- `ReParoleStore.resetPasswordForEmail(email)` /
  `updatePassword(newPassword)` (`js/storage.js`) — partagés entre
  comptes admin et orthophoniste, même mécanisme Supabase Auth des deux
  côtés.
- Lien **"Mot de passe oublié ?"** sur les écrans de connexion
  `admin.html` et `dashboard-ortho.html` — déclenche l'email
  directement depuis l'app, avec le bon lien de redirection cette
  fois, plutôt que de dépendre du bouton du tableau Supabase.
  Volontairement le même message ("email envoyé si ce compte existe")
  que l'email existe ou non, pour ne pas laisser deviner quels emails
  ont un compte.

**Reste à faire côté vous** : vérifier dans Supabase > Authentication >
URL Configuration que l'URL de `reset-password.html` (ex.
`https://votredomaine/reset-password.html`) est bien listée dans les
Redirect URLs autorisées — sinon Supabase refusera d'y rediriger même
avec cette page maintenant prête à la recevoir.

**Testé** : `tests/password-reset.test.js` (10 tests) — structure de
la page, règles de robustesse du mot de passe, rejet si les deux
mots de passe ne correspondent pas, succès avec appel réel à
`updateUser`, gestion d'une erreur Supabase (session expirée), lien de
redirection correctement construit, présence des liens "Mot de passe
oublié ?" sur les deux écrans de connexion.

`CACHE_NAME` incrémenté (`reparole-v6-80` → `reparole-v6-81`).

## v6.82 — Double authentification pour l'espace admin

Comme discuté (capture d'écran du 11 juillet) : seuls les comptes
orthophoniste avaient la double authentification (TOTP). L'espace
admin — qui a pourtant accès au contenu des suggestions (parfois avec
un contact personnel) et à la file de contributions — n'avait
qu'email + mot de passe.

**Ajouté**, en réutilisant tel quel le mécanisme déjà en place côté
orthophoniste (`js/dashboard-ortho.js`) :
- `signInAdmin` déclenche désormais un défi MFA (code à 6 chiffres) si
  le compte en a une activée, avant de terminer la connexion.
- `completeMfaSignInAdmin` (`js/storage.js`) — équivalent de
  `completeMfaSignIn` côté ortho, mais vérifie la table `admins`
  plutôt que `orthophonists`.
- Nouvel écran `#admin-mfa-challenge` et carte "Sécurité du compte"
  sur le tableau de bord admin (`admin.html`) — activation par QR
  code, confirmation à 6 chiffres, désactivation. Les fonctions
  Supabase sous-jacentes (`mfaEnroll`/`mfaChallenge`/`mfaVerify`/
  `mfaListFactors`/`mfaUnenroll`) étaient déjà génériques, aucune
  duplication nécessaire de ce côté.

**Testé** : `tests/admin-mfa.test.js` (12 tests) — cycle complet
d'inscription/vérification/désactivation MFA, connexion admin exigeant
le défi, refus d'un compte absent de `admins` même après un MFA
valide, présence des écrans, bascule correcte vers l'écran de défi
sans terminer la connexion tant que le code n'est pas validé.

Au passage : le faux client Supabase de `tests/knowledge-base.test.js`
(qui simule `signInAdmin` pour d'autres besoins) ne connaissait pas
encore `auth.mfa.*` — mis à jour pour continuer à simuler un compte
sans MFA activée, sans quoi ce test aurait cassé.

`CACHE_NAME` incrémenté (`reparole-v6-81` → `reparole-v6-82`).

## v6.83 — VRAIS BUGS DE SÉCURITÉ corrigés : plusieurs failles XSS stockées

Suite de "je veux que le site soit pas piratable" : audit concret
plutôt qu'une promesse en l'air ("pas piratable" n'existe pour aucun
site — l'objectif réaliste est de retirer les vrais trous trouvables).
Trouvé en grepant systématiquement tous les `innerHTML =` du projet
pour repérer ceux qui affichent du texte libre non échappé.

**Le plus grave** : le contenu des propositions envoyées via
`contribuer.html` (mot, phrase, traduction, nom/contact/note du
contributeur) s'affichait sans échappement dans `admin.js`. Cette page
publique **ne demande aucune connexion** — n'importe qui pouvait donc
soumettre du HTML/JS actif qui se serait exécuté directement dans le
navigateur de l'administrateur·rice à la simple ouverture de la file
d'attente (XSS stockée classique).

**Egalement corrigés** (tous du texte libre patient affiché sans
échappement dans le navigateur d'une AUTRE personne) :
- Nom du patient dans la liste des patients et les rapports
  imprimables (`dashboard-ortho.html`, `report.html`, `mon-resume.html`).
- Légende des photos personnelles, visible côté orthophoniste
  (`dashboard-ortho.html`) et côté patient lui-même (`index.html`).
- Catégorie d'erreur et type de séance dans les tendances admin et
  l'historique orthophoniste — ces deux valeurs ne sont pas contraintes
  par la base de données (`log_session`/`log_error` acceptent
  n'importe quelle chaîne), donc théoriquement forçables via un appel
  direct à l'API Supabase, en contournant l'app.

**Déjà correct, vérifié pour non-régression** : la boîte à idées
(v6.80) échappait déjà correctement message et contact — pas de trou
trouvé là.

**Non corrigé, à considérer plus tard si vous voulez pousser plus
loin** : ajouter une contrainte `check` en base sur `sessions.type` et
`error_events.category` (liste fermée de valeurs), en plus de
l'échappement déjà en place côté affichage — une deuxième couche de
protection à la source, pas strictement nécessaire puisque
l'échappement suffit déjà à neutraliser le risque XSS, mais plus
rigoureux.

**Testé** : `tests/security-xss.test.js` (9 tests) — injecte une vraie
charge XSS (`<img src=x onerror=...>`) dans chaque champ concerné et
vérifie qu'elle ressort neutralisée, sur les deux espaces (admin et
orthophoniste) et les rapports imprimables.

`CACHE_NAME` incrémenté (`reparole-v6-82` → `reparole-v6-83`).

## v6.84 — Vrai bug corrigé : le message "photo ajoutée" mentait en cas d'échec réel

Retour utilisateur (capture d'écran) : "✅ Photo ajoutée !" s'affichait,
mais la liste montrait ensuite "Aucune photo ajoutée pour l'instant."

**Cause réelle** : `Store.addMedia()` (`js/storage.js`) renvoie `null`
si l'envoi échoue côté serveur (le plus souvent : le bucket Supabase
Storage `patient-media` n'existe pas encore dans le projet — voir
`README.md`, section "Comment mettre en place l'authentification",
étape 4). `uploadMedia()` (`js/app.js`) n'a jamais vérifié cette
valeur de retour avant d'afficher la confirmation — la personne voyait
donc un faux succès à chaque échec.

**Corrigé** :
- `uploadMedia()` vérifie maintenant le résultat réel avant d'afficher
  quoi que ce soit : succès → confirmation habituelle ; échec →
  message d'erreur clair, mot déjà tapé conservé (pas besoin de tout
  retaper), liste non rafraîchie inutilement.
- Second bug du même type trouvé au passage dans `addMedia()`
  elle-même : un échec de la fonction RPC `add_media` (distinct de
  l'échec d'upload déjà géré) renvoyait quand même un objet de repli
  "réussite" — corrigé pour renvoyer `null` dans ce cas aussi.

**Testé** : `tests/photo-upload-failure.test.js` (5 tests) — échec
simulé n'affiche plus de faux succès, le mot tapé n'est pas perdu, la
liste ne se rafraîchit pas sur un échec, un vrai succès reste inchangé,
et la source de `addMedia()` ne renvoie plus de repli fantôme en cas
d'erreur RPC.

`CACHE_NAME` incrémenté (`reparole-v6-83` → `reparole-v6-84`).

## v6.85 — Fiabilité de reset-password.html : détection du lien de récupération renforcée

Suite du dépannage en direct : une fois l'URL de redirection
correctement configurée côté Supabase (vraie cause du problème
précédent), un nouveau souci est apparu — le lien atterrissait bien
sur `reset-password.html`, mais affichait "Lien invalide ou expiré"
même pour un lien potentiellement valide.

**Cause identifiée** : supabase-js commence à traiter le jeton présent
dans l'URL dès la création du client (`initCloud()`), ce qui peut
arriver avant même que le code n'ait eu le temps de s'abonner à
l'évènement `PASSWORD_RECOVERY` une ligne plus loin — l'évènement est
alors raté. L'ancien code ne vérifiait `getSession()` qu'une seule
fois, après un délai fixe de 2,5 secondes : trop tardif ou pas assez
robuste si le traitement de l'URL prend un peu plus de temps que prévu.

**Corrigé** : remplacé par plusieurs vérifications rapprochées (toutes
les 400ms, jusqu'à 3 secondes), qui s'arrêtent dès qu'une session
valide est détectée — beaucoup plus tolérant aux variations de timing
du traitement interne de supabase-js.

**Testé** : `tests/password-reset.test.js` (10 tests, déjà existants)
— toujours au vert avec la nouvelle logique, aucune régression.

`CACHE_NAME` incrémenté (`reparole-v6-84` → `reparole-v6-85`).

## v6.86 — Supabase-js chargé depuis le CDN avec une version figée

Suite de "on est à jour côté sécurité ?" : dernier point trouvé en
resondant le sujet. `js/storage.js` chargeait `supabase-js` via
`@2` (toujours la toute dernière version 2.x), pas une version précise
— le principal vecteur des attaques de chaîne d'approvisionnement
("pin your versions" — une nouvelle version, même compromise, se
serait chargée automatiquement sans que rien ne change côté app).

**Corrigé** : version figée à `2.108.2`. Sans risque de régression —
seules des fonctions d'authentification/RPC/storage déjà stables et
utilisées depuis longtemps le sont ici.

`CACHE_NAME` incrémenté (`reparole-v6-85` → `reparole-v6-86`).

## v6.87 — VRAI MANQUE corrigé : le droit d'effacement (RGPD/LGPD) n'était pas exerçable

Trouvé en répondant à une question sur la mise en conformité LGPD pour
le Brésil, mais le manque touchait tout autant la France :
`RGPD.md` mentionnait déjà le "droit d'effacement" comme si les
patients l'avaient, mais **aucun bouton, aucune fonction ne permettait
réellement de supprimer son compte**.

**Ajouté** :
- `delete_patient_account(p_code)` (`sql/schema.sql`) — supprime la
  ligne `patients`, ce qui suffit à tout effacer grâce aux contraintes
  `on delete cascade` déjà en place sur toutes les tables liées
  (séances, journal, photos, erreurs, rapports, notes, mots proposés
  par l'aidant, favoris, rattachement orthophoniste) — rien à répéter
  table par table. Nettoie aussi explicitement les photos du bucket
  Storage (pas couvertes par le cascade SQL).
- `ReParoleStore.deleteAccount(code)` (`js/storage.js`) — RPC en mode
  cloud, nettoyage exhaustif de `localStorage` en mode navigateur (y
  compris l'index du code aidant lié, s'il existe).
- Section **"🗑️ Supprimer mon compte"** sur le tableau de bord
  patient — confirmation à deux niveaux (taper le mot affiché, puis
  confirmer une seconde fois) vu le caractère irréversible, cohérent
  avec `disableMfa()` côté orthophoniste qui utilise déjà ce même
  principe pour une action destructive. Nettoie aussi la liste des
  "codes mémorisés" (v6.71) pour ne pas laisser un accès rapide vers
  un compte qui n'existe plus.
- `RGPD.md` mis à jour pour refléter que ce droit (et celui de
  portabilité, déjà fait en v6.69) sont désormais réellement
  exerçables, pas juste mentionnés.

**Testé** : `tests/account-deletion.test.js` (9 tests) — mot de
confirmation incorrect rejeté, annulation de la confirmation native
respectée, suppression réelle en mode navigateur (toutes les clés
`localStorage` concernées), nettoyage de l'index aidant et des codes
mémorisés, comportement de `ReParoleStore.deleteAccount()`, présence
et cohérence de la fonction SQL et des contraintes `on delete cascade`
dont elle dépend entièrement.

`CACHE_NAME` incrémenté (`reparole-v6-86` → `reparole-v6-87`).

## v6.88 — Pied de page légal complet + bandeau "version bêta"

`confidentialite.html`, `politique-cookies.html` et `gestion-cookies.html`
existaient déjà (bien construites — `gestion-cookies.html` a même un
vrai outil "voir ce qui est stocké sur cet appareil / tout effacer",
pas juste du texte), mais `js/footer.js` ne pointait pas encore vers
elles.

**Ajouté** :
- Pied de page étendu à 6 liens : Mentions légales, Confidentialité,
  Politique cookies, Gestion des cookies, CGV, CGU — sur toutes les
  pages qui l'affichent déjà (`index.html`, `aidant.html`,
  `mon-resume.html`, `contribuer.html`, `dashboard-ortho.html`).
- Bandeau **"🚧 Version bêta"** tout en haut de `index.html`, avant
  même l'écran de connexion — fermable, mais réapparaît à chaque
  visite (pas mémorisé) tant que le site est vraiment en construction.
- Les 3 pages nouvellement liées ajoutées au cache hors-ligne
  (`sw.js`), pour rester cohérent avec les 3 déjà présentes.

**Reste à faire, et ça ne peut venir que de vous** :
`mentions-legales.html` et `confidentialite.html` contiennent encore
de vrais champs à compléter (identité/raison sociale, adresse
postale, email de contact, numéro SIRET le cas échéant, durée de
conservation des données, dates de mise à jour) — je ne peux
évidemment pas inventer ces informations à votre place.

**Testé** : `tests/legal-compliance.test.js` (13 tests, dont 2 nouveaux)
— présence des 6 liens sur toutes les pages concernées, bandeau bêta
bien positionné tout en haut de la page, bouton de fermeture
fonctionnel.

`CACHE_NAME` incrémenté (`reparole-v6-87` → `reparole-v6-88`).

## v6.89 — Ajout du japonais (contenu fourni par l'utilisateur)

Contenu intégralement fourni via `Japonais_Complet.xlsx` : dénomination
(3 niveaux, 92 mots avec kanji/hiragana/rōmaji), complétion de phrase
(24 items) et compréhension (18 questions). Rien n'a été inventé côté
vocabulaire — seuls les distracteurs (choix multiples) ont été générés,
et exclusivement à partir du vocabulaire déjà fourni par l'utilisateur
(regroupement par catégorie pour la dénomination, tirage parmi les
autres réponses du même niveau pour la complétion/compréhension).

**Nouveau fichier** `js/exercises-ja.js` (`BANK_JA`), chargé dans
`index.html`, ajouté au cache hors-ligne.

**Traité comme langue "partielle"** (`PARTIAL_LANGS`, comme le kabyle
et le sango) : l'interface (boutons, menus, messages) n'est pas
traduite en japonais, et le contenu n'a pas encore été relu par un∙e
professionnel∙le de santé ou un∙e locuteur∙rice natif∙ve — même
prudence que pour le kabyle, même si le contenu fourni est nettement
plus riche (3 types d'exercices contre 1 seul pour le kabyle/sango).

**Différence importante avec le kabyle/sango** : `speechLocale:'ja-JP'`
renseigné dans `LANGUAGES` — le japonais est bien pris en charge par la
synthèse et la reconnaissance vocales des navigateurs, contrairement
au kabyle/sango. Le mécanisme générique déjà en place depuis la v6.9
route donc automatiquement le japonais vers la synthèse vocale
normale plutôt que vers le système d'audio pré-enregistré (aucun code
spécifique nécessaire, aucun fichier audio à enregistrer).

**Limitation connue, notée dans le code** : la lecture
(hiragana/rōmaji) fournie dans le fichier source n'est pas encore
affichée dans l'interface — les exercices utilisent uniquement le
kanji/l'écriture japonaise standard. Ajouter une annotation furigana
demanderait une vraie extension du moteur d'affichage des choix (pas
fait ici pour ne pas risquer de casser la comparaison réponse/choix).

**Testé** : `tests/japanese-language.test.js` (12 tests) — intégrité
complète de la banque (aucune réponse manquante dans ses propres
choix, aucun doublon, comptes exacts par niveau), enregistrement
correct de la langue, sélecteur de langue mis à jour automatiquement,
et surtout : vérification que le japonais utilise bien la synthèse
vocale normale et non le mécanisme réservé aux langues sans voix.

`CACHE_NAME` incrémenté (`reparole-v6-88` → `reparole-v6-89`).

## v6.90 — Vrai bug corrigé : le placeholder "Ex : Marie" restait en français dans toutes les langues

Retour utilisateur (captures d'écran en kabyle et en arabe) : le
`<label>` du champ prénom était bien traduit ("Isem-ik" en kabyle,
"اسمك الأول" en arabe), mais son placeholder ("Ex : Marie") restait
figé en français — jamais relié à `data-i18n-placeholder`, un simple
oubli lors de la création du champ, jamais remarqué jusqu'ici.

**Même bug trouvé au passage** sur le champ nom de l'espace
orthophoniste ("Ex : Camille Dupont", `dashboard-ortho.html`) — corrigé
de la même façon.

**Audit fait pendant la correction** : tous les autres `placeholder`
non traduits du site ont été vérifiés un par un — les seuls restants
(`votre@email.fr`, `a-xxxxxxxxxxxx`, `123456`, 🙂) sont des exemples de
format, pas du texte de langue, donc corrects tels quels sans
traduction.

**Nouvelles clés** `field_name_ph` (9 langues + kabyle) et
`ortho_name_ph` (9 langues) — l'exemple de prénom reste "Marie"/
"Camille Dupont" dans toutes les langues (un prénom reste un prénom),
seul le mot "Ex :" est traduit dans chacune.

**Testé** : `tests/placeholder-translation.test.js` (6 tests) —
présence de `data-i18n-placeholder` dans le HTML, changement réel du
placeholder lors d'un changement de langue, avec les deux cas
précisément signalés (arabe, kabyle) couverts explicitement.

`CACHE_NAME` incrémenté (`reparole-v6-89` → `reparole-v6-90`).

## v6.91 — Japonais : interface complètement traduite (rejoint les 9 langues complètes)

Suite de "je veux que la traduction soit mise directement pour que je
puisse la faire tester" : le japonais passe de langue "partielle"
(contenu des exercices seulement, v6.89) à langue **complète**, comme
le français, l'anglais, l'espagnol, l'italien, le portugais,
l'allemand, l'arabe, le turc et le polonais.

**Trois systèmes de traduction distincts, tous les trois complétés** :
- `I18N_STRINGS.ja` (`js/i18n.js`) — 403 clés, toute l'interface
  (connexion, tableau de bord, écrans d'exercice, espace aidant,
  espace orthophoniste, tarifs, suppression de compte, boîte à
  idées...). Génération automatisée à partir de la structure exacte
  du bloc français (mêmes clés, mêmes fonctions, même formatage),
  traduites une par une.
- `COMPANION_PHRASES.ja` (`js/companion.js`) — les messages
  d'encouragement de l'assistant adaptatif (accueil, bravo,
  encouragements, fin de séance, explications par type d'exercice).
- `ASSESS_STRINGS.ja` (`js/assessment.js`) — l'écran de bilan initial
  facultatif.

**`ja` retiré de `PARTIAL_LANGS`** — il n'y a plus de repli vers le
français pour l'interface japonaise, sauf pour les scénarios de
conversation guidée (non traduits dans aucune langue autre que les 6
premières, message explicite déjà en place).

**Toujours vrai, inchangé** : ce travail reste en attente d'une
relecture par un∙e locuteur∙rice natif∙ve avant tout usage clinique
réel — même statut que les 8 autres langues complètes, qui n'ont
elles non plus jamais été relues par un∙e professionnel∙le natif∙ve.

**Testé** : `tests/japanese-language.test.js` étendu à 15 tests —
vérifie maintenant que l'interface elle-même est traduite (pas
seulement le contenu des exercices), que `ja` n'est plus listé comme
langue partielle, et que `COMPANION_PHRASES.ja`/`ASSESS_STRINGS.ja`
existent et fonctionnent (y compris leurs valeurs-fonctions).

`CACHE_NAME` incrémenté (`reparole-v6-90` → `reparole-v6-91`).

## v6.92 — VRAI BUG corrigé : le son ne fonctionnait pas dans certaines langues + choix de la voix

Retour utilisateur : le son ne fonctionne pas dans certaines langues,
l'arabe cité en exemple. Deux vraies causes trouvées, aucune gérée
jusqu'ici :

1. **`speechSynthesis.getVoices()` renvoie souvent un tableau vide au
   tout premier appel** — la vraie liste se charge en arrière-plan et
   n'est prête qu'après l'évènement `voiceschanged`. Sans gérer ce
   piège classique de Web Speech API, un premier clic sur "écouter"
   juste après le chargement de la page pouvait échouer en silence,
   pour n'importe quelle langue — pas seulement l'arabe.
2. **Aucune vérification qu'une voix existe réellement pour la langue
   choisie.** Contrairement au français/anglais (quasi toujours
   disponibles), une voix arabe (ou dans d'autres langues) n'est pas
   forcément installée sur l'appareil/navigateur utilisé — ça dépend
   entièrement du système d'exploitation, hors du contrôle de l'app.
   Avant ce correctif : silence total, aucune erreur visible,
   impossible de savoir pourquoi.

**Corrigé** (`js/app.js`) :
- `loadVoices()` — attend proprement le chargement réel des voix
  (`voiceschanged`), avec un filet de sécurité si l'évènement ne se
  déclenche jamais.
- `speak()` — vérifie qu'une voix existe pour la langue active ;
  sinon, affiche un message clair au lieu d'un silence inexpliqué.

**Nouveau, en réponse à "je voudrais proposer voix d'homme ou de
femme"** : un sélecteur **"🔊 Voix utilisée pour la lecture"** sur le
tableau de bord, qui liste toutes les voix disponibles sur l'appareil
pour la langue active, mémorisé d'une visite à l'autre. Précision
importante, assumée honnêtement : Web Speech API n'expose pas
officiellement le genre d'une voix (pas de propriété fiable
multi-navigateurs pour ça) — impossible de garantir un tri "homme/
femme" automatique. La personne choisit librement parmi ce que son
appareil propose ; les noms de voix indiquent généralement le genre
(ex. "Microsoft David"/"Microsoft Zira" sur Windows, "Google UK
English Male/Female" sur Chrome), mais ça dépend du système.

**Testé** : `tests/voice-selection.test.js` (10 tests) — piège
`voiceschanged` bien géré (avec et sans filet de sécurité), filtrage
correct par langue, respect du choix déjà enregistré, message clair
quand aucune voix n'existe, sélecteur correctement peuplé/masqué,
sauvegarde du choix, comportement propre si l'appareil ne supporte
pas du tout la synthèse vocale.

`CACHE_NAME` incrémenté (`reparole-v6-91` → `reparole-v6-92`).

## v6.93 — VRAI BUG racine corrigé (rattachement patient) + création de fiche patient par l'orthophoniste

Capture d'écran utilisateur : coller un code aidant par erreur dans
"Rattacher un patient" affichait l'erreur SQL brute *"violates foreign
key constraint"* au lieu d'un message clair.

**Cause racine réelle, plus profonde que prévu** : `get_patient()`
était déclarée `returns patients` (une ligne composite unique). En
PostgreSQL, une fonction SQL à ligne unique dont le `SELECT`
sous-jacent ne trouve **aucune** ligne renvoie quand même **une**
ligne, avec toutes les colonnes à `NULL` — jamais "rien". Le code JS
qui teste `if(!row) return null` ne pouvait donc jamais détecter cette
absence, puisque l'objet renvoyé n'était pas vide (juste rempli de
`null`). **Conséquence plus grave que le seul message d'erreur** :
cette même fonction est aussi utilisée par la connexion patient
elle-même (`js/app.js login()`) — un code inexistant aurait
théoriquement pu être traité comme "trouvé", avec un profil
entièrement vide, plutôt que de proposer clairement d'en créer un.

**Corrigé** : `get_patient()` déclarée `returns setof patients` — un
code inexistant renvoie désormais un vrai tableau vide, correctement
détecté par le code JS déjà écrit pour ce cas précis (aucune
modification JS nécessaire, juste la fonction SQL).

**Corrigé aussi côté interface** (`js/dashboard-ortho.js`) :
- Un code au format aidant (préfixe `a-`) est désormais détecté et
  rejeté immédiatement, avant même d'interroger le serveur.
- Plus aucun message d'erreur serveur brut n'est jamais affiché — un
  message générique clair à la place, quelle que soit la cause exacte.

**Nouveau, en réponse à "j'aimerais pouvoir créer une fiche patient"**
: carte **"Créer une fiche patient"** sur le tableau de bord
orthophoniste — utile pour un∙e patient∙e qui ne peut pas s'inscrire
seul∙e (première prise en main, difficulté à manier un écran).
L'orthophoniste crée le dossier, un code de suivi est généré
automatiquement, à transmettre ensuite au patient pour qu'il·elle se
connecte directement. Réutilise exactement le même mécanisme que la
création côté patient — même format de code partout dans l'app. Même
plafond de patients en compte gratuit que le rattachement.

**Rappel important, pas nouveau** : le tableau de bord listant tous
les patients suivis, la fiche détaillée d'un patient (historique des
séances, analyse des erreurs, notes cliniques, photos), et la
génération d'un bilan détaillé (`report.html`) **existent déjà** —
probablement jamais atteints jusqu'ici à cause du bug ci-dessus qui
empêchait de rattacher le moindre patient pour de bon.

**Testé** : `tests/patient-assignment-fix.test.js` (7 tests) — la
fonction SQL renvoie bien `setof patients`, un code aidant est rejeté
sans appel réseau, un code inexistant donne un message clair (jamais
de texte SQL brut), un vrai code fonctionne, et le cycle complet de
création de fiche (nom vide, création réussie, limite du compte
gratuit) est couvert.

`CACHE_NAME` incrémenté (`reparole-v6-92` → `reparole-v6-93`).

## v6.94 — Trois dialectes maghrébins ajoutés (algérien, marocain, tunisien)

Suite de la discussion sur l'arabe standard vs le dialecte algérien :
ajout de l'algérien, du marocain et du tunisien, à la demande
explicite de l'utilisateur.

**Choix assumé, expliqué avant de commencer** : contrairement au
japonais (langue écrite très standardisée, v6.91), l'arabe dialectal
maghrébin est avant tout **parlé**, avec une variation régionale
importante et un mélange constant avec le français — risque réel de
produire quelque chose qui sonne "arabe standard à peine modifié",
exactement le problème qui a fait rejeter le fichier Sango. Les trois
dialectes sont donc ajoutés en **langues partielles** (comme le
kabyle), avec le même socle minimal de 22 clés que le kabyle
(écran de connexion + tableau de bord de base) — pas les 400+ clés
des langues complètes.

**Différenciation réelle entre les trois**, pas trois copies du même
texte : utilisation des marqueurs possessifs réellement distinctifs
de chaque dialecte — تاع (algérien), ديال (marocain), متاع (tunisien)
— et de mots différents pour "maintenant" (دروك algérien, دابا
marocain, توا tunisien).

**⚠️ Prudence plus forte encore que pour le kabyle**, écrite dans le
code lui-même : ce premier jet n'a été relu par aucun∙e locuteur∙rice
natif∙ve d'aucun des trois dialectes. `speechLocale:null` pour les
trois — aucun navigateur ne propose de voix dédiée à ces dialectes,
contrairement à l'arabe standard déjà présent.

**Testé** : `tests/maghrebi-dialects.test.js` (7 tests) — enregistrement
correct (LANGUAGES, PARTIAL_LANGS, `speechLocale:null`), sélecteur de
langue à jour, même périmètre de 22 clés que le kabyle pour les trois,
écran de connexion bien traduit en écriture arabe pour chacun, et
surtout : les trois blocs sont bien différents entre eux et utilisent
chacun leur propre marqueur possessif distinctif.

`CACHE_NAME` incrémenté (`reparole-v6-93` → `reparole-v6-94`).

## v6.95 — Conseils de l'orthophoniste visibles côté patient

Réponse à "j'aurai aimé... pouvoir donner des conseils" : jusqu'ici,
les notes cliniques de l'orthophoniste étaient **entièrement privées**
(la description le disait explicitement : "visibles uniquement dans
cet espace professionnel"). Aucun moyen de communiquer un conseil
directement au patient depuis l'app.

**Ajouté** :
- Une case à cocher **"Visible par le patient"** sur chaque note
  (`dashboard-ortho.html`) — privée par défaut, rien ne change pour
  les notes déjà écrites. Un badge distinct les repère dans la liste
  côté orthophoniste.
- Nouvelle carte **"💬 Conseils de votre orthophoniste"** sur le
  tableau de bord patient (`index.html`) — lecture seule, n'apparaît
  que s'il y a au moins un conseil partagé.
- `get_patient_visible_notes(p_code)` (`sql/schema.sql`) — seule porte
  d'entrée pour le patient, ne renvoie jamais que les notes
  explicitement marquées visibles, jamais les notes cliniques privées.

**Cohérent avec le garde-fou n°1** : ce sont de vrais messages écrits
par un∙e vrai∙e professionnel∙le, jamais de contenu généré
automatiquement — aucune IA ne "parle" au patient dans ce canal.

**Testé** : `tests/patient-visible-notes.test.js` (8 tests) — une note
reste privée par défaut, une note marquée visible apparaît côté
patient avec son contenu exact, mélange privé/visible correctement
filtré, la carte reste masquée s'il n'y a rien à montrer, contenu
affiché échappé (pas de faille XSS), présence de la case à cocher et
du bon flux de transmission côté orthophoniste.

`tests/dashboard-grid.test.js` mis à jour (10 → 11 cartes, nouvelle
carte prise en compte).

`CACHE_NAME` incrémenté (`reparole-v6-94` → `reparole-v6-95`).

## v6.96 — Mode sombre sur l'espace admin

Dernière page de l'app sans mode sombre — corrigé, avec exactement le
même mécanisme que partout ailleurs (`js/prefs.js`, bouton "🌙 Mode
sombre" dans la barre du haut).

**Vérifié avant d'agir** : `admin.html` ne charge volontairement pas
`js/i18n.js` (page interne, jamais multilingue) — `Prefs.apply()` et
`renderLangSwitchers()` étaient déjà écrites de façon défensive pour
fonctionner sans I18N/LANGUAGES chargés (`if(window.I18N)`,
`if(!window.LANGUAGES) return`), donc aucune modification de
`js/prefs.js` n'a été nécessaire — juste charger le script et ajouter
le bouton.

**Testé** : `tests/admin-dark-mode.test.js` (5 tests) — script bien
chargé, bouton présent, `Prefs.load()` ne plante pas sans i18n.js,
bascule correcte de la classe sur `<body>`, mémorisation du choix.

`CACHE_NAME` incrémenté (`reparole-v6-95` → `reparole-v6-96`).

## v6.97 — Historique des connexions + suivi des erreurs techniques

Deux nouvelles cartes sur le tableau de bord admin, précisées avec
l'utilisateur avant de coder pour ne pas construire la mauvaise chose.

**🔑 Historique des connexions** — "voir qui s'est connecté
(admin/orthophonistes) et quand". Enregistre uniquement les connexions
**réussies** des comptes professionnels (jamais les patients — code de
suivi, pas de notion de connexion au même sens). `auth.uid()` lu côté
serveur dans `log_login_event()`, jamais transmis par le client :
impossible d'enregistrer une fausse connexion au nom de quelqu'un
d'autre. Enregistré au moment exact où chaque connexion se termine
réellement (après MFA si activée) — jamais à la simple restauration de
session au chargement de la page.

**⚠️ Erreurs techniques récentes** — "vraies erreurs techniques du
site (bugs, plantages), pas les erreurs des patients dans leurs
exercices" (déjà distinguées explicitement par l'utilisateur des
catégories d'erreurs d'exercice déjà existantes). Nouveau fichier
`js/error-tracking.js`, chargé sur les 7 pages qui utilisent déjà
`storage.js` — capture `window.onerror` et les rejets de promesse non
gérés, envoie à Supabase de façon systématiquement silencieuse en cas
d'échec (ne doit jamais elle-même faire planter l'app en essayant de
signaler un plantage). Callable par n'importe qui, y compris anonyme
— une vraie erreur peut survenir pour un∙e patient∙e non authentifié∙e
— champs tronqués côté serveur pour éviter un abus.

**Testé** : `tests/login-history-and-errors.test.js` (10 tests) —
tables/fonctions SQL présentes avec la bonne sécurité, capture
d'erreur correctement câblée sur les 7 pages, cycle complet
enregistrement/lecture pour les deux fonctionnalités,
`logClientError()` qui ne lève jamais d'exception même avec des
valeurs vides, présence des deux cartes et de leur appel après
connexion.

Deux fichiers de test préexistants (`admin-mfa.test.js`,
`plan-and-mfa.test.js`) mis à jour : leurs faux clients Supabase ne
connaissaient pas encore `rpc()` pour ce nouvel appel en arrière-plan
après connexion — corrigé pour continuer à passer.

`CACHE_NAME` incrémenté (`reparole-v6-96` → `reparole-v6-97`).

## v6.98 — Réduction de l'auto-remplissage navigateur (admin + orthophoniste)

Retour utilisateur : "le profil ainsi que le mot de passe reste à
chaque reconnexion... d'un point de vue sécurité c'est pas terrible."

**Clarifié d'abord** : c'est le gestionnaire de mots de passe du
navigateur qui fait ça, pas l'app — ReParole ne stocke jamais le mot
de passe nulle part, Supabase le gère de façon sécurisée côté serveur.
`autocomplete="username"`/`"current-password"` sont les attributs
normaux qui permettent au navigateur de proposer l'enregistrement.

**Réduit** (`admin.html`, `dashboard-ortho.html`) : email en
`autocomplete="off"`, mot de passe en `autocomplete="new-password"` —
la combinaison la plus efficace connue pour dissuader la plupart des
navigateurs de réutiliser un mot de passe déjà enregistré sur ces
écrans précis. **Honnêteté à garder en tête** : aucune méthode
HTML n'est garantie à 100% sur tous les navigateurs — Chrome en
particulier peut malgré tout proposer d'enregistrer selon les cas.
`reset-password.html` utilisait déjà `new-password` (cohérent, c'est
un formulaire de définition de mot de passe) — vérifié pour
non-régression, pas modifié.

**Testé** : `tests/reduced-autofill.test.js` (5 tests) — bonnes
valeurs `autocomplete` sur les deux écrans de connexion,
`reset-password.html` inchangé.

`CACHE_NAME` incrémenté (`reparole-v6-97` → `reparole-v6-98`).

## v6.99 — La touche "Entrée" valide les formulaires partout

Réponse à "j'aimerais que l'option ENTRÉE fonctionne quand on
renseigne des éléments". Aucun `<form>` n'est utilisé nulle part dans
l'app (boutons déclenchés par `onclick="..."`), donc Entrée ne
faisait rien nativement dans un champ — mécanisme générique construit
une seule fois plutôt que dupliqué page par page.

**Nouveau fichier** `js/enter-submit.js` : un seul écouteur délégué
sur `document`, aucune modification nécessaire de `js/app.js`,
`js/admin.js`, etc. — réutilise directement les `onclick` déjà en
place. Usage : `data-enter-submit="id-du-bouton"` sur un `<input>`.

**Câblé sur** : connexion patient, ajout de photo, suppression de
compte, boîte à idées (`index.html`) ; connexion aidant, ajout de mot
(`aidant.html`) ; connexion, double authentification, rattachement de
patient, création de fiche patient (`dashboard-ortho.html`) ;
connexion et double authentification admin (`admin.html`) ; nouveau
mot de passe (`reset-password.html`).

**Volontairement pas câblé** : les champs multi-lignes (journal, boîte
à idées, notes cliniques — Entrée doit y rester un retour à la ligne,
pas une validation), et le formulaire de contribution de traduction
(`contribuer.html`, 6 champs qui alimentent une seule soumission —
risque réel d'envoi prématuré avec des champs encore vides).

**Testé** : `tests/enter-key-submit.test.js` (10 tests) — mécanisme
central isolé (déclenchement correct, touches ignorées, bouton
désactivé jamais cliqué, champ non marqué sans plantage), échantillon
représentatif câblé sur chaque page, et vérification explicite que les
champs multi-lignes ne sont jamais câblés par erreur.

Deux tests préexistants ajustés pour rester corrects après l'ajout des
nouveaux attributs (`password-reset.test.js`, `reduced-autofill.test.js`).

`CACHE_NAME` incrémenté (`reparole-v6-98` → `reparole-v6-99`).

## v6.100 — Un drapeau devant chaque langue

Réponse à "c'est possible de mettre le drapeau qui va avec ?" (capture
d'écran montrant le sélecteur en tunisien).

**Point discuté avant d'agir** : pour la plupart des langues, un
drapeau correspond sans ambiguïté à un pays (japonais → 🇯🇵, sango →
🇨🇫, les trois dialectes maghrébins → leur pays respectif). Le kabyle
posait une vraie question : c'est une langue berbère/amazighe, avec un
drapeau amazigh distinct porté par un mouvement identitaire propre —
utiliser le drapeau algérien aurait pu sembler gommer cette
distinction. Techniquement, aucun émoji Unicode n'existe pour le
drapeau amazigh de toute façon (pas de code pays ISO associé). Après
discussion explicite avec l'utilisateur : drapeau algérien 🇩🇿 retenu
pour le kabyle aussi, en connaissance de cause.

**Drapeaux ajoutés**, alignés sur le `speechLocale` déjà choisi pour
chaque langue quand il existe : 🇫🇷 français, 🇺🇸 anglais, 🇪🇸 espagnol,
🇮🇹 italien, 🇵🇹 portugais, 🇩🇪 allemand, 🇸🇦 arabe, 🇹🇷 turc, 🇵🇱 polonais,
🇩🇿 kabyle et algérien, 🇲🇦 marocain, 🇹🇳 tunisien, 🇨🇫 sango, 🇯🇵 japonais.

**Testé** : `tests/language-flags.test.js` (17 tests) — chaque langue
a bien le drapeau attendu, aucune langue oubliée, le nom du kabyle
("Taqbaylit") reste inchangé après le drapeau.

Deux tests préexistants ajustés (`japanese-language.test.js`,
`partial-lang-generalization.test.js`) qui vérifiaient le libellé
exact d'une langue — toujours corrects sur le fond (nom sans
diacritiques pour le sango, présence du japonais dans le sélecteur),
juste adaptés pour tenir compte du nouveau préfixe drapeau.

`CACHE_NAME` incrémenté (`reparole-v6-99` → `reparole-v6-100`).

## v6.101 — Jeu de mémoire : bouton "Suivant" au lieu d'un enchaînement automatique

Retour utilisateur (capture d'écran du jeu de mémoire, manche 3/5) :
après une réponse, la correction — la séquence attendue en cas
d'erreur — disparaissait automatiquement après 1,6 seconde, sans
laisser le temps de la lire. Vrai problème d'usage, pas un
malentendu : pour une personne en rééducation du langage, 1,6s pour
lire une séquence de symboles + comprendre ce qui a été manqué est
trop court.

**Correctif** : l'enchaînement automatique est remplacé par un vrai
bouton "Suivant →" (`memory_next_btn`) affiché sous le message de
correction, sur lequel le patient clique quand il est prêt — même
principe que l'écran de fin de partie (`_finish()`), qui laissait déjà
la main à l'utilisateur. Le focus est posé automatiquement sur le
bouton pour rester utilisable au clavier.

Nouvelle clé `memory_next_btn` ajoutée aux 10 langues complètes
(fr/en/es/it/pt/de/ar/tr/pl/ja) — vérifié par
`tests/i18n-completeness.test.js`, qui compare automatiquement chaque
langue complète à la référence française.

`CACHE_NAME` incrémenté (`reparole-v6-100` → `reparole-v6-101`).

## v6.102 — Dialectes maghrébins : début de l'extension vers la parité complète (lot 1/N)

Retour utilisateur (capture d'écran du tableau de bord en tunisien) :
trop d'éléments visibles restaient en français (espace aidant,
rappels, boutons d'accessibilité, quelques titres d'exercices) — sur
demande explicite, on ne se contente plus du socle minimal de 22 clés
partagé avec le kabyle pour ces trois dialectes. **Objectif affiché :
parité complète comme le japonais (443 clés d'interface)**, mais vu le
volume (~420 clés × 3 dialectes), le travail avance par lots plutôt
qu'en une seule livraison, pour rester vérifiable.

**Lot 1 (22 nouvelles clés)** : les éléments exacts de la capture
d'écran — `caregiver_*` (espace aidant), `reminder*` (rappels),
`access_toggle_*` (mode sombre, boutons agrandis, séance courte, etc.)
et 3 titres/descriptions d'exercices (photos, dénomination orale,
répétition). Mêmes marqueurs distinctifs déjà établis (تاع algérien /
ديال marocain / متاع tunisien), même prudence déjà documentée : premier
jet, **pas relu par un∙e locuteur∙rice natif∙ve** de chacun des trois
dialectes.

**Important, à ne pas perdre de vue** : ce lot ne concerne que
l'**interface** (menus, boutons, titres d'écran). Le **contenu des
exercices** (banques de mots de dénomination, phrases de complétion,
questions de compréhension) pour dz/ma/tn n'existe toujours pas et
reste un chantier séparé, plus sensible — comme pour le kabyle et le
sango, ce contenu ne peut pas être inventé : il faut du vocabulaire
sourcé et, idéalement, une relecture native (garde-fou n°3). Tant que
ce contenu n'existe pas, les écrans d'exercices resteront en français
pour dz/ma/tn même une fois l'interface à 100 %.

**Test ajusté** (`tests/maghrebi-dialects.test.js`) : l'ancienne
vérification "exactement les 22 clés du kabyle, ni plus ni moins" est
remplacée par deux vérifications plus adaptées à une extension
progressive : (1) le socle kabyle reste toujours couvert (pas de
régression), (2) les trois dialectes restent synchronisés entre eux
(même ensemble de clés à chaque lot).

`CACHE_NAME` incrémenté (`reparole-v6-101` → `reparole-v6-102`).

## v6.103 — Darija algérienne : contenu d'exercices intégré (dénomination + complétion)

L'utilisateur a fourni 5 fichiers Excel avec du vocabulaire et des
phrases sourcés par une personne algérienne-darijaphone :
`Darija_Algerienne_Denomination_Partie1/2/3.xlsx` (92 mots, 23/34/35
par niveau — parité complète avec le français) et
`Darija_Algerienne_Completion_Partie1/2.xlsx` (24 phrases, 8/8/8 par
niveau — parité complète). Nouveau fichier `js/exercises-dz.js`,
`window.BANK_DZ`, même mécanisme que `js/exercises-kab.js` et
`js/exercises-ja.js`.

**Ce que j'ai généré moi-même** : uniquement les choix multiples
(distracteurs), toujours puisés dans le vocabulaire déjà fourni par
l'utilisateur pour ce même exercice — aucun mot ni aucune phrase
inventé.

**4 phrases de complétion ajustées** : le mot à blanquer dans la
phrase en darija n'était pas toujours identique au "mot attendu"
isolé de la colonne source, à cause des accords de l'arabe algérien
(possessif, duel) — ex. "فراشي" (mon lit) dans la phrase vs "الفراش"
(le lit) comme mot isolé. C'est la forme réellement présente dans la
phrase qui a été blanquée, pas la forme du dictionnaire (même
principe que l'arabe standard déjà en place, voir `exercises-ar.js`).

**Ce qui manque encore** : la **compréhension (18 questions)** —
demande créée dans `docs/dz-parity-request.md` (même format que
`docs/kabyle-parity-request.md`), en attente d'une traduction fournie
par l'utilisateur. Je ne l'ai pas improvisée moi-même : plusieurs
questions du niveau 3 sont des expressions/de la logique qui doivent
rester idiomatiquement correctes, un risque trop élevé sans relecture
native (garde-fou n°3).

**Toujours en attente** : relecture native complète (au-delà de la
personne qui a fourni les fichiers) avant tout usage clinique réel —
garde-fou n°8. Les exercices vocaux (répétition, dénomination orale,
fluence) restent en français : aucune voix de navigateur ne prend en
charge la darija algérienne.

Nouveau : `audio/dz/README.md` (même mécanisme d'enregistrements réels
que kabyle/sango — aucun fichier audio n'existe encore).

**Testé** : `tests/dz-exercises.test.js` (8 tests) — intégrité de la
banque (chaque bonne réponse dans ses propres choix, pas de doublons,
chaque trou de complétion présent), bon comptage par niveau, mécanisme
audio pré-enregistré actif (pas de synthèse vocale tentée), confirme
que la compréhension n'existe pas encore (à mettre à jour le jour où
elle est ajoutée, pour ne pas l'oublier).

`CACHE_NAME` incrémenté (`reparole-v6-102` → `reparole-v6-103`).

## v6.104 — Kabyle : parité complète du contenu d'exercices (dénomination + complétion + compréhension)

L'utilisateur a fourni `Kabyle_Complet.xlsx`, traduit/relu par une
personne kabylophone d'après l'utilisateur (confirmé explicitement
avant intégration — la feuille dénomination du fichier portait une
colonne "Statut: à valider" sur les 92 lignes, ce qui méritait de
vérifier la provenance avant de l'intégrer comme du contenu fiable).

**Dénomination** : 92 mots fusionnés avec les 22 déjà sourcés
manuellement (v6.1-v6.37) — un doublon exact ("Vache/Tafunast", déjà
présent) a été ignoré pour ne pas le dupliquer. Total : 30/42/41 mots
par niveau.

**Complétion (24 phrases) et compréhension (18 questions)** :
intégrées pour la première fois — ces deux exercices étaient bloqués
depuis la v6.7 faute d'une vraie relecture native (voir
`docs/kabyle-completion-draft.md`, maintenant dépassé et marqué comme
tel). `docs/kabyle-parity-request.md` marqué comme comblé.

**5 phrases de complétion ajustées** : même problème que pour la
darija algérienne (v6.103) — le mot à blanquer dans la phrase kabyle
n'était pas toujours identique au "mot attendu" isolé de la colonne
source, à cause de l'état d'annexion du kabyle (le nom change de forme
selon sa position dans la phrase — ex. "aẓekka" à l'état libre devient
"uẓekka" après une préposition). C'est la forme réellement présente
dans la phrase qui a été blanquée.

**Ce que j'ai généré moi-même** : uniquement les choix multiples
(distracteurs), toujours puisés dans le vocabulaire déjà fourni
(existant + nouveau) — jamais un mot ou une phrase inventés.

**Toujours vrai, ne change pas avec cet ajout** : premier jet malgré
la relecture native — pas de validation clinique (garde-fou n°8). Les
exercices vocaux restent en français : toujours pas de speechLocale
pour le kabyle.

**Testé** : `tests/kab-exercises.test.js` (8 tests) — le vocabulaire
d'origine n'a pas régressé après la fusion, pas de doublon, bonne
réponse toujours dans ses propres choix, compréhension accessible et
affichée en kabyle (plus de repli français pour ce type d'exercice).

`CACHE_NAME` incrémenté (`reparole-v6-103` → `reparole-v6-104`).

## v6.105 — Drapeau kabyle corrigé + interface dz/ma/tn, lot 2 (49 clés de plus)

**Drapeau kabyle** : capture d'écran fournie par l'utilisateur montrant
le vrai drapeau kabyle/amazigh (tricolore bleu/vert/jaune, symbole
rouge "yaz" au centre) — l'app utilisait 🇩🇿 (drapeau algérien) depuis
la v6.100, choix déjà discuté à l'époque faute d'alternative, mais qui
représentait mal une identité distincte. Remplacé par **ⵣ**, la lettre
tifinagh elle-même (c'est littéralement le symbole rouge du vrai
drapeau) — pas un vrai emoji drapeau au sens Unicode puisqu'aucun
n'existe pour le kabyle (ce n'est pas un État), mais le symbole le
plus proche et le plus reconnaissable. `tests/language-flags.test.js`
mis à jour : le kabyle est maintenant testé à part des 14 langues à
vrai drapeau pays.

**Interface dz/ma/tn, lot 2** : 49 nouvelles clés par langue (95 au
total, contre 46 après le lot 1) — mots à revoir, photos, journal,
conversation guidée, export/import de données, réglages de voix,
titres d'exercices restants (dénomination, complétion, compréhension,
fluence, intonation, mémoire, tenue vocale). Toujours premier jet, pas
relu par un∙e locuteur∙rice natif∙ve. ~350 clés restantes par dialecte
pour la parité complète (443 au total, comme le japonais) — la suite
en prochains lots.

`CACHE_NAME` incrémenté (`reparole-v6-104` → `reparole-v6-105`).

## v6.106 — Interface dz/ma/tn, lot 3 (66 clés de plus, 161/443)

Suite explicite de la demande de traduction totale de l'interface pour
dz (et étendue à ma/tn, même méthode) : consignes des exercices
(dénomination, complétion, dénomination orale, intonation, répétition,
fluence), retours vocaux (micro, écoute, validation manuelle), tags de
fluence verbale (catégories de mots), connexion (erreurs, code
manquant), suppression de compte, bandeau bêta, conseils de
l'orthophoniste, jeu de mémoire (titre, vitesse).

Même méthode que les lots précédents : marqueurs possessifs distincts
(تاع algérien / ديال marocain / متاع tunisien), vocabulaire différent
pour "maintenant" (دروك/دابا/توا), toujours premier jet — pas relu par
un∙e locuteur∙rice natif∙ve.

**Reste à faire pour la parité complète (443 clés comme le japonais)** :
~282 clés par dialecte, dont 32 clés à valeur "fonction" (gabarits
avec paramètres, ex. `session_result(score,total)`) qui demandent un
traitement au cas par cas plutôt qu'une simple traduction de chaîne —
prochain lot logique.

`CACHE_NAME` incrémenté (`reparole-v6-105` → `reparole-v6-106`).

## v6.107 — Interface dz/ma/tn, lot 4 : les 32 clés "fonction" (193/443)

Les 32 clés restantes qui n'étaient pas de simples chaînes mais des
gabarits avec paramètres (score de fin de séance, dates, niveaux,
tendances du tableau de bord orthophoniste, manches du jeu de
mémoire...) — ex. `session_result:(c,t)=>` Vous avez réussi ${c}
exercice(s) sur ${t}. ``. Même méthode que les lots précédents pour le
vocabulaire, adaptée pour préserver les paramètres dynamiques.

Plus aucune clé "fonction" ne manque pour dz/ma/tn — tout ce qui reste
(250 clés par dialecte) est maintenant de simples chaînes de texte.

`CACHE_NAME` incrémenté (`reparole-v6-106` → `reparole-v6-107`).

## v6.108 — Interface dz/ma/tn, lot 5 : espace aidant + espace orthophoniste (283/443)

90 clés de plus par dialecte : tout l'espace aidant (`cg_*` — connexion,
conseils contextuels, proposer un mot) et tout l'espace orthophoniste
(`ortho_*` — connexion, double authentification, gestion des patients,
tarifs Pro/Stripe, profil clinique).

**Changement de méthode pour ce lot, à savoir** : vu le volume, la
différenciation entre dialectes s'est faite par substitution lexicale
ciblée (تاع/دروك → ديال/دابا pour le marocain, متاع/توا pour le
tunisien, quelques mots comme "زين"→"زوين"/"باهي") plutôt qu'une
réécriture complète phrase par phrase comme les lots précédents. Les
verbes restent proches de la forme algérienne dans les trois — moins
fidèle à la grammaire propre à chaque dialecte que les lots 1-4.
Toujours premier jet, encore plus vrai pour ce lot : à corriger en
priorité si une relecture native devient disponible.

`CACHE_NAME` incrémenté (`reparole-v6-107` → `reparole-v6-108`).

## v6.109 — Interface dz/ma/tn : parité complète atteinte (443/443, lot 6/6)

Les 160 dernières clés — espace orthophoniste (rapports, export CSV,
gestion MFA, profil clinique, création de fiche patient), jeu de
mémoire, tenue vocale (phonation), conversation guidée, tarifs Pro,
et divers (suggestions, code de suivi, CGV/CGU). dz/ma/tn ont
maintenant exactement les mêmes 443 clés d'interface que le français
et les 9 autres langues complètes.

**dz/ma/tn restent dans `PARTIAL_LANGS`, volontairement — à ne pas
confondre avec une langue "complète" comme le japonais malgré la
parité d'interface.** Deux raisons, contrairement au japonais qui en
a été retiré en v6.91 :
1. **Contenu des exercices incomplet** : ma/tn n'ont toujours aucune
   banque d'exercices, dz n'a que dénomination + complétion (pas la
   compréhension). Retirer PARTIAL_LANGS masquerait ce vrai manque.
2. **Traduction non relue** : contrairement au japonais (fourni par
   l'utilisateur) et au contenu d'exercices darija/kabyle (relu par
   des locuteurs natifs), ces 443 clés d'interface sont un premier
   jet que j'ai traduit moi-même — jamais vérifié par un∙e
   locuteur∙rice natif∙ve. Le bandeau d'avertissement affiché pour
   les langues partielles (`lang-partial-note`) doit rester visible
   tant que ce n'est pas le cas.

**Historique des 6 lots** (v6.100-v6.109) : 22 (socle) → 46 (lot 1,
écran tableau de bord) → 95 (lot 2, mots à revoir/photos/journal) →
161 (lot 3, consignes d'exercices/voix/tags) → 193 (lot 4, gabarits à
paramètres) → 283 (lot 5, espaces aidant/orthophoniste) → 443 (lot 6,
reste — orthophoniste avancé, mémoire, phonation, tarifs).

**Reste, séparément** : compréhension darija (18 questions,
`docs/dz-parity-request.md`), tout le contenu d'exercices marocain et
tunisien, et — le plus important pour un usage réel — une relecture
native de l'ensemble avant tout usage clinique.

`CACHE_NAME` incrémenté (`reparole-v6-108` → `reparole-v6-109`).

## v6.112 — Phrases du compagnon "Ami" traduites pour dz/ma/tn (46 par langue)

Repéré par l'utilisateur (capture d'écran : tableau de bord entièrement
en arabe algérien, sauf le message d'Ami — resté en français). Cause :
`js/companion.js` (`COMPANION_PHRASES`) est une banque de contenu
séparée de l'interface (`I18N_STRINGS`, `js/i18n.js`) — sa parité
n'avait jamais été traitée. Avant ce correctif, **seuls fr/en/ja**
avaient ces phrases ; toute autre langue (dz/ma/tn, mais aussi
es/it/pt/de/ar/tr/pl) retombait silencieusement sur le français pour
tout ce qu'Ami dit.

**Corrigé pour dz/ma/tn** : 46 phrases par langue — accueil, retour
après une pause, conseils, encouragements, fins de séance, et les 11
explications affichées au lancement de chaque exercice. Même méthode
et même statut "premier jet" que le reste de l'interface dz/ma/tn.

**Le kabyle n'est volontairement PAS inclus** — même raisonnement que
pour `docs/kabyle-symptoms-request.md` : phrases complètes en berbère,
langue où je n'ai pas la même confiance que pour l'arabe dialectal.
Ami reste donc en français pour le kabyle, pour l'instant.

**Non traité, à noter pour plus tard** : es/it/pt/de/ar/tr/pl (les 7
autres langues "complètes") ont le même trou — `COMPANION_PHRASES` n'a
jamais eu que fr/en/ja. Pas demandé par l'utilisateur pour l'instant,
mais bon à savoir avant de considérer l'app "complète" dans une langue.

`CACHE_NAME` incrémenté (`reparole-v6-109` → `reparole-v6-112`,
saute 110-111 : ces deux versions n'étaient que de la documentation,
sans changement de code servi au navigateur).

## v6.113 — Kabyle : premier retour du contact natif intégré

L'utilisateur a transmis un vrai retour de relecture (avec versions
"recommandées" simplifiées pour un public aphasique, et des notes de
style). Intégré :

- **Écran "Avez-vous un bilan ?"** (`import_title/p1/note/upload`,
  `ASSESS_STRINGS.kab`) : traduit pour la première fois — c'était
  volontairement laissé en français depuis la v6.2 (confidentialité
  d'un fichier médical, risque jugé trop élevé sans relecture native).
  Le bandeau d'avertissement spécifique à cet écran est retiré pour le
  kabyle, devenu inutile.
- **Interface** (`I18N_STRINGS.kab`) : `not_a_substitute`,
  `ortho_forgot_password_link`, `progress_saved_note`, les 5
  `access_toggle_*`, `ortho_link`, `caregiver_link`,
  `beta_banner_text`, et 4 boutons génériques rattachés au glossaire
  reçu (`back_btn`, `phonation_cancel`, `ortho_validate_btn`,
  `memory_next_btn`).
- **Bilan de ressentis** : titre et bouton "écouter" mis à jour avec
  la formulation simplifiée recommandée (`feelings_title`,
  `listen_question`), ainsi que `ready`/`skip_step`/`small_test_p`.
  2 des 4 questions du questionnaire lui-même traduites — mais
  `SYMPTOM_QUESTIONS_KAB` n'est **pas encore créé** : il faut les 4
  ensemble (voir `docs/kabyle-symptoms-request.md`, mis à jour avec
  seulement les 2 questions restantes à demander).

Nouveau : `docs/kabyle-glossary.md` — vocabulaire général, boutons,
échelle de fréquence, remarques de style de la relectrice/du
relecteur, à réutiliser pour toute nouvelle traduction kabyle. Inclut
aussi la traduction des 6 liens légaux du pied de page, prête mais pas
encore branchée : `js/footer.js` est codé en dur en français pour
**toutes** les langues de l'app, pas seulement le kabyle — chantier
séparé, pas fait ici.

`CACHE_NAME` incrémenté (`reparole-v6-112` → `reparole-v6-113`).

## v6.114 — Évaluation initiale : bouton "Suivant" au lieu d'un enchaînement automatique

Même correctif que le jeu de mémoire (v6.101), repéré cette fois dans
le mini-test d'accueil (`answerBilan()`, `js/assessment.js`) : la
réponse disparaissait après 700ms/1100ms, avant d'avoir pu être lue.
Remplacé par un bouton "Suivant" explicite (`next_btn`, nouvelle clé
`ASSESS_STRINGS`, ajoutée aux 10 langues complètes + kabyle).

## v6.115 — Grosse intégration du retour kabylophone (interface, mini-test, découvertes au passage)

Trois envois de traductions natives intégrés d'un coup, à la demande
de l'utilisateur ("tu penses que tu peux faire totalement le site ?").
Réponse honnête d'abord : **non, pas totalement** — voir le détail
plus bas.

**Interface** (`I18N_STRINGS.kab`) : passée de 38 à 90 clés sur 448
(dashboard : code de suivi, statistiques, mots à revoir, journal,
liste des exercices avec titres/descriptions, conversation guidée,
espace aidant, rappels, paramètres).

**Mini-test d'accueil** (`ASSESS_ITEMS_KAB`, `js/assessment.js`) :
compréhension complète (3/3), complétion 2/3 (manque "café/TASSE").
Généralisé le mécanisme `useKab` : il ne se limitait qu'à la
dénomination (v6.3) — étendu à tous les domaines, avec suppression du
bouton "Écouter" (qui aurait lu le kabyle avec un accent français,
même correctif que pour la dénomination).

**Écran de résultat + écran "bilan"** (`ASSESS_STRINGS.kab`) :
"Votre point de départ" et "Avez-vous un bilan ?" entièrement
traduits — ce dernier était volontairement resté en français depuis
la v6.2 (confidentialité d'un fichier médical), maintenant résolu par
la relecture native (v6.113).

**2 découvertes au passage, corrigées pour TOUTES les langues, pas
seulement le kabyle** — du texte codé en dur en français, jamais
passé par le système de traduction : la tendance de progression du
tableau de bord patient (`js/app.js`, "En hausse/en baisse/stable") et
le message "pas encore assez de séances" du graphique
(`js/charts.js`). Nouvelles clés `chart_not_enough_data`, `trend_up`,
`trend_down`, `trend_stable`, `trend_not_enough` — ajoutées aux 10
langues complètes + dz/ma/tn (parité 448/448 maintenue) + kabyle.
`js/charts.js` protégé contre les pages qui ne chargent pas
`js/i18n.js` (ex. `mon-resume.html`) — repli français défensif plutôt
qu'une erreur JS si `I18N` n'existe pas.

**3 conflits de vocabulaire repérés, non résolus** — rien changé tant
que ce n'est pas confirmé, voir `docs/kabyle-glossary.md` : cheval
(Agmar existant vs Aɣyul proposé — Aɣyul désigne déjà l'âne ailleurs),
vélo (Avilu existant vs Tafradit proposé), voiture (Takeṛṛust existant
vs Ttamubil proposé).

**Ce qu'il reste pour une interface 100% traduite** : ~358 clés
d'interface (dont les liens légaux du pied de page, traductions déjà
en main mais pas branchées — chantier séparé qui touche toutes les
langues), les phrases du compagnon "Ami" (45 sur 46 encore
manquantes), et les 3 derniers éléments du mini-test d'accueil — voir
`docs/kabyle-symptoms-request.md`, remis à jour.

`CACHE_NAME` incrémenté (`reparole-v6-113` → `reparole-v6-115`).

## v6.116-120 — Kabyle : interface complète (448/448), compagnon Ami, mini-test, vos ressentis — tout intégré

Six envois supplémentaires du contact kabylophone, intégrés en une
série de sessions (code modifié à chaque fois, mais **livraison
volontairement retenue jusqu'au feu vert de l'utilisateur** —
« n'envoie rien tant que je ne te le dis pas »). Résumé :

- **v6.116** : les 3 conflits de vocabulaire (cheval/vélo/voiture)
  tranchés par l'utilisateur en faveur de la cohérence terminologique
  — confirme ce qui était déjà dans le code (Agmar/Avilu/Takeṛṛust),
  aucun changement de code nécessaire. `docs/kabyle-glossary.md` mis à
  jour ; commentaires de code actualisés pour ne pas relancer une
  fausse alerte de conflit plus tard.
- **v6.117-118** : ~130 clés d'interface supplémentaires (espace
  orthophoniste complet, tenue vocale, conversation guidée, tarifs
  Pro, journal, espace aidant, photos personnelles, CGV/CGU) —
  interface passée à 413/448.
- **v6.119** : les 46 phrases du compagnon "Ami" (`COMPANION_PHRASES.kab`,
  jusqu'ici seule langue partielle sans cette banque à part sango) ;
  `ASSESS_ITEMS_KAB.completion` complété (3/3, dont le dernier mot
  manquant "tasse" → *Tasekkurt*) ; `SYMPTOM_QUESTIONS_KAB` complété
  (4/4 questions) — bandeau "reste en français" et bouton d'écoute
  (aurait mal prononcé le kabyle) retirés pour cet écran, devenus
  inexacts. **3 tests ajustés** : deux utilisaient le kabyle comme
  exemple de "langue sans banque compagnon" pour vérifier le repli
  français — plus vrai depuis cette version, remplacés par le sango
  (toujours sans banque) ; un troisième vérifiait explicitement que
  `ASSESS_ITEMS_KAB.completion` n'existait pas encore.
- **v6.120** : les 35 dernières clés d'interface (gabarits avec
  variables — score, dates, tendances...) — **interface kabyle
  complète, 448/448**.

**Rappel volontaire, toujours vrai** : kab reste dans `PARTIAL_LANGS`
malgré les 448/448 — pas de `speechLocale`, et surtout, "relu par
un∙e locuteur∙rice natif∙ve" n'égale pas une validation clinique
(garde-fou n°8). Le bandeau d'avertissement reste affiché.

`CACHE_NAME` : pas incrémenté à chaque étape — livraison groupée à la
demande explicite de l'utilisateur. Prochaine livraison : passera de
`reparole-v6-115` à la version courante en une fois.

## v6.121 — 2 distracteurs améliorés + livraison groupée v6.116-121

Les 2 distracteurs "AƐEWDIW" (placeholder non vérifié) du mini-test
d'accueil remplacés par du vocabulaire maintenant confirmé et tranché
(v6.116) : "AGMAR" (cheval, item chien) et "TAMUTURT" (moto, item
vélo). Commentaires historiques de `js/assessment.js` mis à jour —
plusieurs mentionnaient encore "les phrases complètes restent en
français", plus vrai depuis la v6.115-119.

**Reste, repéré en vérifiant avant cette livraison** : l'écran de
dépôt/lecture d'un bilan externe (PDF/texte) a encore ~9 clés en
français (`reading_in_progress`, `read_file_failed`,
`priority_from_report`, etc. — voir `ASSESS_STRINGS.kab` dans
`js/assessment.js`) — chemin secondaire de l'app, pas la question de
départ. Et le pied de page légal (`js/footer.js`) reste câblé en dur
en français pour toutes les langues, kabyle compris — chantier séparé
déjà documenté, pas propre au kabyle.

`CACHE_NAME` incrémenté (`reparole-v6-115` → `reparole-v6-121`,
livraison groupée des versions 116-121 à la demande explicite de
l'utilisateur).

## v6.122 — Kabyle : 12 corrections stylistiques (relecture native)

Relecture des 35 gabarits ajoutés en v6.120 : suppression des
parenthèses de pluriel après un nombre (« awal(iwen) » → « awal », le
nom reste au singulier après un numéral en kabyle — même règle
appliquée à `ortho_sessions_count`, `ortho_reports_count`,
`memory_result`, `conv_result`), `ortho_last_visit` harmonisé avec un
« : » comme les autres libellés, `trend_down` allégé (tournure jugée
peu naturelle), `level_up_msg` et `insight_strong` reformulés
(idiomatique / évite une répétition), `level_down_msg` corrigé (coquille
"nebnu"→"nebdu"), `ortho_free_limit_reached` corrigé (sujet "vous"
plutôt que "la limite").

**Glossaire figé** (`docs/kabyle-glossary.md`) : 11 termes ne
changeront plus, sur recommandation du contact kabylophone, pour
garantir une cohérence durable dans toute l'app.

`CACHE_NAME` incrémenté (`reparole-v6-121` → `reparole-v6-122`).

## v6.122 — Sélecteur de langue : suffixe "(en cours de traduction)" pour dz/ma/tn/kab

Sur demande de l'utilisateur : les 4 entrées du menu déroulant de
langue affichent maintenant "(en cours de traduction)" directement
dans le libellé, visible avant même d'avoir sélectionné la langue —
pas seulement dans le bandeau d'avertissement affiché après coup.

Reste pertinent malgré les progrès récents : dz/ma/tn ont l'interface
à 448/448 mais un contenu d'exercices très incomplet (ma/tn : aucun ;
dz : compréhension manquante) ; kab a tout traduit (interface,
mini-test, compagnon) mais ~9 clés de l'écran de dépôt de bilan
externe restent en français, et surtout aucune des 4 langues n'a reçu
de validation clinique formelle (garde-fou n°8).

**Sango non touché** — l'utilisateur a demandé spécifiquement
"arabe et kabyle", pas sango, qui reste pourtant tout aussi partiel
(dénomination seule). Décision volontairement pas étendue de mon
propre chef ; à harmoniser si souhaité.

Test ajusté (`tests/language-flags.test.js`) : `.endsWith('Taqbaylit')`
devenu `.includes('Taqbaylit')`, le nom n'étant plus le dernier mot du
libellé.

## v6.123 — Sango ajouté au suffixe "(en cours de traduction)"

Suite logique de la v6.122 : le sango a le même statut (langue
partielle, dénomination seule) que dz/ma/tn/kab, donc le même
suffixe dans le sélecteur de langue, pour rester cohérent.

Test ajusté (`tests/partial-lang-generalization.test.js`) pour
accepter le nouveau suffixe tout en vérifiant toujours l'absence de
diacritiques sur "Sango" lui-même.

## v6.124-125 — Footer multilingue (déjà fait) + trou japonais comblé (mini-test manquant)

**v6.124** : `js/footer.js` — déjà localisé (voir commentaire dans le
fichier), utilise `I18N.t()` pour les 6 liens légaux, avec repli
français défensif pour les pages sans `js/i18n.js` (`mon-resume.html`,
`contribuer.html`), même principe que `js/charts.js` (v6.115).

**v6.125** : trou repéré par l'utilisateur (capture d'écran : titre et
bouton d'écoute du bilan de ressentis bien en japonais, mais question
et réponses en français en dessous). Cause : contrairement aux 8
autres langues complètes (en/es/it/pt/de/ar/tr/pl), le japonais
n'avait **jamais eu** `SYMPTOM_QUESTIONS_JA`, `ASSESS_ITEMS_JA` ni
`ASSESS_DOMAIN_LABELS_JA` — un oubli d'origine, pas une exception
volontaire. Comblé sur le même modèle que les 8 autres (4 questions de
ressenti, mini-test dénomination/complétion/compréhension 3/3
chacun), traduit par mes soins comme pour les 8 autres langues
complètes.

`CACHE_NAME` incrémenté (`reparole-v6-123` → `reparole-v6-125`).

## v6.126 — Reconnexion automatique au rafraîchissement (un seul profil mémorisé)

Signalé par l'utilisateur : "quand je rafraîchis la fenêtre je reviens
à l'accueil". Un rafraîchissement vide forcément la mémoire JS
(l'utilisateur et son code ne peuvent pas survivre), donc l'app ne
peut repartir que de l'écran de connexion — mais jusqu'ici elle s'y
arrêtait même quand un seul profil était déjà mémorisé sur cet
appareil (`reparole:remembered-profiles`), obligeant un clic de plus
sur "Se reconnecter rapidement".

Nouvelle fonction `attemptAutoLogin()` (`js/app.js`), appelée au
chargement de la page : si **exactement un** profil est mémorisé, la
reconnexion se déclenche automatiquement (même mécanisme que le clic
manuel, `quickLogin()`) et saute directement à l'écran de connexion
réussie. **Volontairement limité à un seul profil** : sur un appareil
partagé (plusieurs profils mémorisés), l'écran de connexion avec la
liste de reconnexion rapide reste affiché comme avant, pour ne pas
connecter automatiquement la mauvaise personne.

Refactorisé pour rester testable : la logique, d'abord écrite en
script inline dans `index.html`, a été déplacée dans une vraie
fonction de `js/app.js`, exposée sur `window`. Nouveau
`tests/auto-login.test.js` (5 tests) : fonction exposée, 0 profil → pas
de reconnexion, 1 profil → reconnexion déclenchée, 2+ profils → pas de
reconnexion, `localStorage` corrompu → pas de plantage.

`CACHE_NAME` incrémenté (`reparole-v6-125` → `reparole-v6-126`).

## v6.127 — Retrait des profils mémorisés, remplacés par une continuité de session (sessionStorage)

Retour sur la v6.126 : l'utilisateur ne veut aucun profil mémorisé de
façon permanente. La liste de "codes mémorisés" (v6.71, localStorage)
est **entièrement retirée** — fonctions, conteneur HTML, CSS, tout.

À la place : `sessionStorage` (pas `localStorage`) retient le code de
la session en cours, le temps que l'onglet reste ouvert. Objectif
concret demandé : rafraîchir la page pendant un exercice ne doit plus
renvoyer à l'écran de connexion. Rien ne survit à la fermeture de
l'onglet — ce n'est pas une mémorisation, juste une continuité pendant
l'utilisation. `attemptAutoLogin()` (v6.126) adapté en conséquence.

`js/app.js` : `rememberCurrentProfile()`/`forgetRememberedProfile()`/
`loadRememberedProfiles()`/`renderRememberedProfiles()`/`quickLogin()`
supprimées, remplacées par `rememberActiveSession()`/
`forgetActiveSession()`. `logout()` et la suppression de compte
utilisent désormais cette nouvelle paire.

**3 fichiers de test mis à jour** : `tests/dark-mode-and-profiles.test.js`
(section "codes mémorisés" retirée, ne teste plus que le mode sombre),
`tests/auto-login.test.js` (réécrit pour sessionStorage + vérifie
qu'aucune mémorisation permanente ne subsiste), `tests/account-deletion.test.js`
(vérifie l'effacement de la session active plutôt que du profil mémorisé).

## v6.128 — Compteur de connexions patients par jour (espace admin)

Demandé par l'utilisateur : "juste un compteur par jour, aucun nom,
rien d'autre" — nouveau panneau **"📅 Connexions par jour"** sur
`admin.html`.

**⚠️ Nécessite une action de votre part** : ce n'est pas branché tout
seul — il faut réexécuter `sql/schema.sql` en entier dans Supabase >
**SQL Editor** (le fichier est rejouable, comme d'habitude — voir
README section "Passer au cloud"). Sans ça, le nouveau panneau
affichera juste "Pas encore de données, ou accès non autorisé."

**Ce qui a été ajouté à `sql/schema.sql`** : table `patient_connections`
(uniquement une empreinte du code — jamais le code en clair — et une
date, dédoublonnée par jour via un index unique), fonction
`log_patient_connection()` (appelée à chaque connexion patiente,
silencieuse en cas d'échec), et `get_daily_connection_counts()`
(réservée aux admins, ne renvoie **que** `{jour, nombre}` — jamais de
ligne individuelle, jamais un code, jamais un nom, à aucun moment,
même pour un∙e admin).

**Pourquoi une empreinte plutôt qu'un compteur brut** : depuis la
reconnexion automatique au rafraîchissement (v6.126/127), une même
personne peut déclencher plusieurs "connexions" le même jour rien
qu'en rafraîchissant sa page — sans déduplication, le compteur aurait
été trompeur. L'empreinte (sha256) permet de ne compter qu'une fois
par jour et par personne, sans jamais stocker le code lui-même.

`Store.logConnection(code)` (nouveau, `js/storage.js`) appelée aux 2
points de connexion réussie dans `js/app.js`, silencieuse et non
bloquante en cas d'échec — ne doit jamais gêner une connexion normale.
Pas d'équivalent en mode navigateur (localStorage) : rien à compter
globalement sans serveur partagé.

`CACHE_NAME` incrémenté (`reparole-v6-126` → `reparole-v6-128`).

## v6.129 — Reconnexion silencieuse : mémorisation permanente restaurée, sans aucune interface

Précision de l'utilisateur après la v6.127 : "ne pas mémoriser" ne
visait que l'écran d'accueil (aucune liste, aucun bouton visible) —
la mémorisation permanente pour la reconnexion rapide pouvait rester.

**Deux mécanismes combinés dans `attemptAutoLogin()`** :
1. `sessionStorage` (l'onglet en cours) — priorité la plus haute,
   couvre un rafraîchissement pendant un exercice, même sur un
   appareil partagé.
2. `localStorage`, permanent — utilisé seulement s'il y a
   **exactement un** profil mémorisé sur l'appareil (sinon, appareil
   probablement partagé, écran de connexion normal sans deviner qui
   se connecte).

Dans les deux cas : **aucune interface**. Pas de conteneur HTML, pas
de liste de boutons, pas de CSS dédiée — juste une reconnexion en
arrière-plan. `rememberCurrentProfile()`/`forgetRememberedProfile()`/
`loadRememberedProfiles()` restaurées (v6.71), mais sans jamais
appeler de fonction de rendu.

**Correction au passage** : `logout()` efface désormais aussi le
profil mémorisé (localStorage), pas seulement la session
(sessionStorage) — sans ça, une déconnexion explicite était
silencieusement annulée par la reconnexion automatique au prochain
chargement, ce qui aurait rendu le bouton "Déconnexion" trompeur.

`tests/auto-login.test.js` réécrit (11 tests) : aucune interface
visible, mémorisation permanente restaurée, priorité de
sessionStorage sur localStorage, cas 1-profil vs appareil partagé (2+
profils), déconnexion qui efface vraiment tout.
`tests/account-deletion.test.js` mis à jour pour vérifier le nettoyage
des deux mécanismes.

`CACHE_NAME` incrémenté (`reparole-v6-128` → `reparole-v6-129`).

## v6.130 — Bouton "Coller" le code de suivi

Retour de test utilisateur réel (3 adultes + 1 enfant) : seul reproche
relevé, devoir copier-coller manuellement le code de suivi — un vrai
frein tactile sur mobile pour ce public. Bouton "📋 Coller" à côté du
champ (`navigator.clipboard.readText()`), échec silencieux si
permission refusée/API indisponible. Champ code aussi passé de
`type="password"` (masqué) à texte visible en police à chasse fixe,
pour vérifier ce qu'on vient de coller — le code n'est pas un secret
cryptographique (voir `js/storage.js`), le masquer n'apportait que de
la friction.

## v6.131 — Vague 1 des améliorations demandées (6 points sur 18)

18 pistes d'amélioration évoquées en discussion ; seule une partie
implémentée ici — celles ne nécessitant pas de nouveau contenu
d'exercice ni de refonte de l'architecture du niveau de difficulté
(reportées séparément, trop risquées à faire vite). Le reste (nouveaux
types d'exercices, niveau par type d'exercice, difficulté par volume
de pratique, etc.) reste à faire.

**Fait dans cette version** :
- **Signal de plateau** (`Learner.plateauSignal()`) — niveau inchangé
  sur 5+ séances consécutives, remonté à l'espace orthophoniste
  uniquement (pas au patient, une stabilité n'étant pas forcément un
  problème). Nouveau `d-plateau` dans `dashboard-ortho.html`.
- **Reconnaissance fine du progrès** — un mot ayant causé 2+ erreurs
  passées, retrouvé correctement, déclenche un message personnalisé
  ("Vous avez retrouvé « X »...") plutôt qu'un encouragement
  générique. Nouveau `Companion.sayText()` pour un message dynamique
  (impossible avec `Companion.say()`, qui pioche dans une banque de
  phrases fixes).
- **Mode "usage à une main"** — les boutons de réponse étaient déjà
  pleine largeur (pas de "côté" à changer) ; ce mode fixe plutôt les
  boutons "Suivant" (jeu de mémoire, mini-test) en bas de l'écran,
  toujours accessible au pouce sans avoir à faire défiler.
- **Retour sonore optionnel** — deux tons courts générés (Web Audio,
  pas de fichier audio à charger ni à traduire), désactivé par défaut,
  échec silencieux si l'API est indisponible/bloquée.
- **Échauffement avant la séance** — n'affiche un mot que s'il existe
  déjà un vrai favori enregistré par le patient (donnée réelle, jamais
  fabriquée) ; sinon, va directement à la première question comme
  avant.
- **"Je n'ai pas la force aujourd'hui"** — nouveau bouton sur le
  tableau de bord, séance de 2 questions du niveau le plus facile,
  effet limité à une seule séance (pas un réglage permanent comme
  "séance courte").

**Bug réel trouvé et corrigé en cours de route** : la première version
du point 10 chargeait l'historique des erreurs *avant* que `current`
soit posé, cassant une contrainte déjà documentée (v6.72) — les
appels à `startExercise()` sans `await` (utilisés par plusieurs tests)
trouvaient `current` toujours `undefined`. Déplacé après, comme
`currentFavorites`.

`tests/improvement-wave-1.test.js` (14 tests) couvre les 6 points.

`CACHE_NAME` incrémenté (`reparole-v6-129` → `reparole-v6-131`).

## v6.132 — Difficulté par type d'exercice (points 1-2-3 de la demande)

Le chantier reporté volontairement lors de la "vague 1" (v6.131) —
implémenté maintenant, avec la prudence annoncée : nouvelle colonne +
nouvelle fonction séparée plutôt que de toucher `upsert_patient()`
(signature figée, utilisée partout), pour ne rien casser en attendant
la migration.

**⚠️ Nécessite une action de votre part** : réexécuter `sql/schema.sql`
en entier dans Supabase → SQL Editor (rejouable comme d'habitude).
**Sans ça, l'app fonctionne normalement** (juste sans le détail par
type) — `Store.saveLevels()` échoue silencieusement si la colonne
n'existe pas encore, jamais bloquant pour une séance normale.

**Point 2 — niveau par type d'exercice** : `user.levels` (objet
`{denomination:2, completion:1, ...}`) remplace la lecture de
`user.level` partout où la difficulté est choisie (`startExercise`,
le but de fluence, les logs d'erreur). `user.level` (le champ
scalaire) continue d'exister — il reflète maintenant le niveau du
type pratiqué le plus récemment, pour ne pas casser l'affichage
"Niveau adapté" ni le tableau de bord orthophoniste. **Migration
automatique et silencieuse** pour les dossiers déjà existants : au
premier login après cette mise à jour, chaque type sans valeur reçoit
le niveau scalaire déjà connu, rien n'est perdu.

**Point 1 — seuil ajusté par catégorie d'erreur dominante** : avant de
baisser le niveau après 2 échecs d'affilée, `AI.dominantDifficulty()`
est consultée. Si la catégorie dominante est "omission" (pas de
réponse du tout — souvent un signal de fatigue/distraction plutôt
qu'un vrai décalage de difficulté), le seuil passe à 3 échecs au lieu
de 2. Les erreurs de contenu réelles (sens, sonorité, structure)
gardent le seuil habituel.

**Point 3 — poussée douce par volume de pratique** : `user.levelAttempts`
compte les réponses cumulées par type. Après 30 réponses stables (pas
d'échec dans la série en cours) au même niveau, une poussée d'un
niveau se déclenche même sans 2 bonnes réponses d'affilée récentes —
sauf si un signal de fatigue est actif, qui reste prioritaire dans
tous les cas. Nouveau message `level_up_volume_msg`, distinct du
`level_up_msg` habituel.

**Espace orthophoniste** : nouvelle ligne de détail par type sous le
niveau global (`d-levels-breakdown`), affichée seulement s'il y a des
données à montrer.

`tests/per-type-difficulty.test.js` (7 tests) : migration, indépendance
entre types, les deux seuils du point 1, la poussée du point 3 et son
inhibition par la fatigue.

`CACHE_NAME` incrémenté (`reparole-v6-131` → `reparole-v6-132`).

## v6.133 — Points 4, 5, 15, 16, 18 de la demande d'amélioration

**Point 4 — Association d'images** : nouveau type d'exercice
(`js/exercises-new-types.js`, `BANK_EXTEND`), 24 paires (clé/cadenas,
parapluie/pluie...) réparties 8/8/8 par niveau. Réutilise le mécanisme
de rendu de la dénomination (émoji + choix), les choix étant eux-mêmes
des émojis plutôt que des mots.

**Point 5 — Structure de phrase** : nouveau type d'exercice, 24 phrases
réparties 8/8/8. Version **choix multiple** (reconnaître la bonne
construction parmi 2 versions mélangées) plutôt qu'un vrai glisser-
déposer des mots — plus simple et plus fiable à livrer maintenant ; un
vrai réordonnancement à la main resterait une amélioration possible
plus tard.

**Point 15 — Progression par type visible pour l'aidant** : nouvelle
ligne "Progrès par type d'exercice" dans l'espace aidant
(`aidant.html`, `js/caregiver.js`), en plus de ce qui existait déjà
côté orthophoniste (v6.132). `get_caregiver_data()` (SQL) renvoie
maintenant aussi `levels` — même migration `sql/schema.sql` que
v6.132, pas de nouvelle action si déjà appliquée.

**Point 16 — Vocabulaire personnel dans plusieurs exercices** : un mot
suggéré par l'aidant apparaissait jusqu'ici seulement en dénomination
— il est maintenant aussi proposé en "nommer à voix haute" (même
mot/émoji, pas de distracteurs à générer). Pas étendu à la
complétion : construire une phrase grammaticalement correcte pour un
mot arbitraire suggéré par l'aidant demanderait de connaître sa
nature grammaticale, pas fiable à automatiser.

**Point 18 — Rappel par email contextuel** : le seul livrable possible
ici, l'envoi réel restant hors de portée (service tiers + clé API que
je ne peux pas détenir, voir `js/reminders-edge-function.md`).
L'exemple de code a été mis à jour : le rappel mentionne maintenant un
mot précis à retravailler (tiré de `error_events`, déjà journalisé),
plutôt qu'un message générique.

**Points non faits, avec la raison** :
- **Point 6** (sons/rimes) : nécessiterait soit de vrais fichiers
  audio (que je ne peux pas produire de façon fiable), soit une
  mécanique text-only qui dénaturerait l'objectif (travailler la
  perception auditive).
- **Point 7** (lecture de plusieurs phrases) : déjà signalé comme le
  plus délicat des 4 nouveaux exercices — profil-dépendant (surtout
  pertinent pour l'aphasie de Wernicke), demande un vrai travail de
  calibration de contenu, pas juste des phrases plus longues.
- **Point 17** (varier la présentation d'un même mot — photo, dessin,
  contexte) : demanderait de vrais visuels différents par mot, que je
  ne peux pas produire de façon fiable et cohérente pour tout le
  vocabulaire existant.

`tests/new-exercise-types.test.js` (5 tests) : intégrité du contenu
association/syntax, intégration dans le moteur d'exercice, tuiles
présentes sur le tableau de bord.

`CACHE_NAME` incrémenté (`reparole-v6-132` → `reparole-v6-133`).

## v6.134 — Bannière "nouvelle version" corrigée (2 vrais bugs)

Signalé par l'utilisateur : "il n'y a plus le bouton quand il y a une
nouvelle version". Deux bugs réels trouvés en creusant :

1. **Le vrai bug d'origine** : `sw.js` appelle `self.skipWaiting()`
   automatiquement dans son gestionnaire "install" — le nouveau
   service worker traverse donc l'état "installed" quasi
   instantanément avant de passer à "activating" puis "activated".
   Le code attendait précisément l'état "installed" via
   `statechange`, une fenêtre qui peut être ratée avec
   `skipWaiting()`. Remplacé par `controllerchange` sur
   `navigator.serviceWorker` — le signal fiable recommandé pour ce
   pattern précis (`skipWaiting` + `clients.claim`, tous les deux déjà
   présents dans `sw.js`). Garde `hadControllerAtLoad` ajoutée pour ne
   déclencher la bannière que sur une vraie mise à jour, pas la toute
   première activation d'un nouvel appareil.

2. **Un vrai bug de syntaxe** (double antislash cassant une chaîne),
   introduit en corrigeant le premier bug — jamais repéré avant car
   **aucun test ne chargeait les `<script>` inline d'`index.html`**
   (seulement les `<script src="...">`). Nouveau garde-fou dans
   `tests/update-banner.test.js` : vérifie la syntaxe de tous les
   scripts inline, pas seulement celui-ci, pour qu'un bug de ce genre
   ne puisse plus passer inaperçu.

`tests/update-banner.test.js` (3 tests) existait déjà mais n'était
jamais lancé — pas référencé dans `package.json`. Corrigé.

`CACHE_NAME` incrémenté (`reparole-v6-133` → `reparole-v6-134`).

## v6.135 — Correctif `sql/schema.sql` : redevenu rejouable après la migration v6.132

Signalé par l'utilisateur (capture d'écran de Supabase SQL Editor) :
`ERROR: 42P13: cannot change return type of existing function` /
`HINT: Use DROP FUNCTION get_patient(text) first.`

**Cause réelle** : `get_patient()` est déclarée `returns setof
patients` — PostgreSQL fige le type ligne de `patients` au moment de
la création de cette fonction. La migration v6.132 (`alter table
patients add column levels`) a changé cette structure ; rejouer
ensuite `create or replace function get_patient(...)` était donc
refusé par PostgreSQL, qui exige un `DROP FUNCTION` explicite dans ce
cas précis (`OR REPLACE` ne suffit pas quand le type ligne sous-jacent
a changé). Un `drop function if exists get_patient(text);` a été
ajouté juste avant sa (re)création — `sql/schema.sql` redevient
rejouable, y compris après un futur ajout de colonne à `patients`.

Même famille de problème que le bug de la v6.44 déjà documenté plus
bas dans ce fichier (schema.sql pas rejouable), mais une cause
différente — celle-ci spécifique aux fonctions `returns setof
<table>`, pas aux policies RLS.

**Pas de nouvelle action requise** si vous aviez déjà réussi à
appliquer la migration v6.132 par un autre moyen ; sinon, réexécutez
`sql/schema.sql` en entier comme d'habitude — ça devrait passer sans
erreur cette fois.

Pas de `CACHE_NAME` à incrémenter : `sql/schema.sql` n'est pas servi
au navigateur, aucun fichier JS/HTML touché par ce correctif.

## v6.135-137 — Lot de correctifs (retour de test réel : connexion, F5, suppression)

Plusieurs signalements groupés en une seule remontée. Trois vrais bugs
corrigés, plus deux points expliqués ci-dessous (pas des bugs, mais
méritent une clarification).

**v6.135 — Se connecter sans indiquer de prénom écrasait le vrai
prénom par "Marie"** : `login()` avait un repli `|| 'Marie'` quand le
champ prénom était vide — problème, `'Marie'` n'est jamais une chaîne
vide, donc la condition "le prénom a changé" se déclenchait à tort et
écrasait silencieusement le vrai prénom déjà enregistré. Un champ
vide ne change plus rien au prénom connu. Pour un **nouveau** dossier
(`createNewPatient()`), le prénom est maintenant explicitement requis
plutôt que de recevoir "Marie" par défaut — "Marie" n'était que le
texte d'exemple du champ (`field_name_ph`), jamais censé devenir un
vrai prénom silencieusement.

**v6.136 — F5 : passage visible par l'écran de connexion avant de
revenir sur le tableau de bord** : l'écran de connexion (`#login`) est
actif par défaut dans le HTML statique, donc visible immédiatement au
chargement, avant que `js/app.js` (chargé plus bas) ait pu vérifier
s'il y a une reconnexion automatique à faire (v6.126-129) — d'où le
flash. Nouveau script inline tout en haut d'`index.html`, qui
s'exécute en premier et lit directement sessionStorage/localStorage
(sans dépendre d'aucune fonction pas encore chargée) : s'il y a une
session ou un profil mémorisé, l'écran de connexion reste masqué
immédiatement via CSS, remplacé par un simple indicateur de
chargement le temps qu'`attemptAutoLogin()` fasse son travail. Filet
de sécurité à 6 secondes si quelque chose empêche l'auto-connexion de
s'exécuter.

**v6.137 — Bouton de suppression de compte "qui ne marche pas"** :
`window.confirm()` est connu pour être peu fiable en mode PWA
installée/standalone sur plusieurs navigateurs mobiles — le bouton
pouvait sembler ne rien faire au clic, sans erreur visible. Le mot à
taper ("SUPPRIMER") étant déjà une confirmation volontaire, remplacé
par un second clic explicite dans la page (le bouton change de texte
et attend un second clic dans les 8 secondes) plutôt qu'une boîte de
dialogue native. Même correctif appliqué à la révocation d'accès
aidant (`revokeCaregiverAccess()`), qui avait le même risque.
`tests/account-deletion.test.js` mis à jour (10 tests, dont un
nouveau sur l'expiration de la fenêtre de confirmation).

**Sur la reconnexion automatique côté orthophoniste** : ce n'est pas
un bug — Supabase Auth garde une session active par défaut
(`persistSession`, comportement standard, pas quelque chose que
`dashboard-ortho.js` a construit spécifiquement). Comportement
différent de la reconnexion patient (notre propre mécanisme,
v6.126-129) mais le même esprit. Dites-moi si vous préférez une
expiration plus courte pour ce compte-là spécifiquement.

**Sur le bouton "mise à jour" toujours absent** : le correctif (v6.134)
n'avait encore jamais été réellement déployé — `CACHE_NAME` n'avait
pas bougé depuis. Il l'est maintenant, avec ce lot.

**Sur désactiver le lien `coluccdavid-coder.github.io/reparole`** :
je ne peux pas agir dessus moi-même (paramètres GitHub Pages/DNS, pas
du code) — voir la question posée en réponse.

`CACHE_NAME` incrémenté (`reparole-v6-134` → `reparole-v6-137`).

## v6.138 — Aide + traductions complètes pour les nouveaux exercices

Signalé par l'utilisateur : "j'aimerais que toutes les traductions
soient bien faites pour les nouveaux exercices. L'aide ne fonctionne
pas dans les nouveaux exercices."

**Le bouton d'aide** : vrai bug — `COMPANION_PHRASES.explain` n'avait
les clés `association`/`syntax` pour **aucune langue**, pas même le
français, depuis leur ajout en v6.133. Corrigé pour les 10 langues
complètes + dz/ma/tn (kab reste en attente, comme le reste de son
contenu). `tests/new-exercise-i18n.test.js` couvre spécifiquement ce
point.

**Les traductions du contenu** : "Associer les images" n'a pas besoin
de traduction — les items sont des émojis, universels. Mais "Structure
de phrase" (des phrases complètes) n'existait qu'en français lors de
sa création. Un premier passage avait traduit 8 langues à moitié
seulement (4 phrases sur 8 par niveau), et le japonais manquait
entièrement. **Complété à 8/8/8 pour les 9 langues complètes**
(`js/exercises-syntax-i18n.js`) :
- en/es/it/pt/de/pl/tr/ar : les 4 phrases manquantes par niveau ajoutées
- ja : entièrement nouveau, absent jusqu'ici

**Prudence particulière notée pour le japonais** : contrairement aux
autres langues (ordre des mots largement figé), le japonais tolère un
ordre plus libre grâce à ses particules — un mélange aléatoire des
mots risque, dans de rares cas, de rester grammaticalement plausible
plutôt que clairement faux. Un garde-fou automatique élimine déjà les
mélanges qui se termineraient par le même élément que la bonne
réponse (le placement du verbe en fin de phrase étant la règle la
plus fiable en japonais), mais une relecture native reste recommandée
avant un usage clinique réel pour ce contenu précis, plus encore que
pour le reste de l'application.

**Sur la remarque de fond** ("à chaque ajout de fonctionnalité,
faudrait faire attention à ces points") : entièrement d'accord —
c'est exactement ce que `tests/new-exercise-i18n.test.js` et
`tests/new-exercise-types.test.js` verrouillent maintenant (aide +
traductions vérifiées automatiquement à chaque exécution des tests),
pour qu'un futur exercice ajouté sans l'un des deux se voie tout de
suite dans `npm test`, plutôt que découvert plus tard en usage réel.

`CACHE_NAME` incrémenté (`reparole-v6-137` → `reparole-v6-138`).

## v6.139 — Domaine personnalisé, taille des émojis, prénom de nouveau obligatoire

**Fichier `CNAME`** : capture d'écran montrant `reparole.fr` à
retaper à chaque mise à jour dans les réglages GitHub Pages —
il manquait simplement le fichier `CNAME` (sans extension) à la
racine du dépôt, celui que GitHub Pages utilise pour retenir le
domaine personnalisé d'un déploiement à l'autre. Ajouté (contient
juste `reparole.fr`). Après ce déploiement, ça ne devrait plus jamais
avoir besoin d'être retapé.

**Taille des émojis dans "Associer les images"** : les boutons de
réponse utilisaient la même taille de police que le texte des autres
exercices — beaucoup trop petit pour des émojis qui doivent être
reconnus visuellement, pas lus comme des mots. Nouvelle classe
`.emoji-choice`, uniquement pour ce type d'exercice, avec une taille
bien plus grande (encore augmentée avec le mode "boutons agrandis").

**Le prénom redevient obligatoire pour se connecter** : précision de
l'utilisateur après la v6.135 — "pour moi un code est associé à un
nom, on ne devrait pas pouvoir rentrer sans le nom." La v6.135 avait
rendu le prénom optionnel au moment de la connexion (uniquement
requis à la création d'un dossier) ; ce n'était pas ce qui était
voulu. Un champ prénom vide bloque maintenant la connexion avec un
message clair, comme pour la création de dossier.

Point d'attention géré au passage : la reconnexion automatique
(v6.126-129) remplissait jusqu'ici seulement le champ code, jamais le
prénom — avec ce nouveau contrôle, elle aurait échoué systématiquement
à chaque rafraîchissement. `rememberActiveSession()` stocke désormais
`{code, name}` (avant : le code seul) dans `sessionStorage`, et
`attemptAutoLogin()` remplit maintenant les deux champs avant
d'appeler `login()`. `tests/login-name-required.test.js` (nouveau, 4
tests) + `tests/login-name-and-flash.test.js` et
`tests/auto-login.test.js` mis à jour pour le nouveau format.

`CACHE_NAME` incrémenté (`reparole-v6-138` → `reparole-v6-139`).

## v6.140 — Le mot sous chaque émoji d'"Associer les images"

Signalé par l'utilisateur : une abeille (🐝) peut ressembler à une
guêpe ou un frelon selon la police/l'appareil — un émoji seul peut
être ambigu, ici comme pour les 57 autres émojis de l'exercice
"Associer les images". Le mot correspondant s'affiche maintenant sous
chaque image, pour la consigne comme pour les 3 choix — l'émoji reste
la donnée principale et bien plus grand (v6.139), le mot n'est qu'un
repère de clarté en dessous, pas un remplacement.

**Nouveau système de correspondance** : `EMOJI_LABEL_KEYS`
(`js/exercises-new-types.js`) associe chacun des 58 émojis utilisés à
une clé I18N (ex. `🐝` → `label_bee`), elle-même traduite dans les 10
langues complètes (`js/i18n.js`) — donc le mot affiché s'adapte à la
langue active de l'app, pas seulement au français. Nouvelle fonction
`emojiLabel(emoji)` (`js/app.js`) fait la correspondance à l'affichage.

`tests/new-exercise-types.test.js` : 4 nouveaux tests — tous les
émojis utilisés ont bien une étiquette, chaque clé existe dans les 10
langues (aucune ne retombe silencieusement sur une clé technique
vide), `emojiLabel()` renvoie le bon mot, et l'écran affiche bien le
mot sous la consigne et sous les 3 choix.

`CACHE_NAME` incrémenté (`reparole-v6-139` → `reparole-v6-140`).

## v6.141 — Un code = un prénom, plus n'importe lequel

Signalé par l'utilisateur : "quand on se connecte avec le code on met
n'importe quel nom est on rentre" — vrai bug, et plus sérieux qu'il n'y
paraît. `login()` acceptait bien un prénom obligatoire depuis la
v6.139, mais **n'importe lequel** : avec le bon code et n'importe quel
prénom tapé, la connexion réussissait — et pire, le prénom saisi
**écrasait silencieusement** le vrai prénom déjà enregistré
(`if(name && name!==existing.name){ user.name = name; }`, cette ligne
n'existe plus).

Le prénom saisi doit maintenant correspondre à celui du dossier,
sinon la connexion est refusée avec un message clair
(`login_name_mismatch`, nouvelle clé, 10 langues complètes).
Comparaison insensible à la casse et aux espaces superflus (comme le
mot de confirmation de suppression de compte) pour rester tolérant
aux petites variations de saisie, mais pas à un prénom différent.
Cas limite géré : un dossier sans prénom enregistré (ancien
enregistrement corrompu) n'est pas bloquant, pour ne jamais enfermer
quelqu'un hors de son propre dossier.

**Compatible avec la reconnexion automatique** (v6.126-129) sans
changement supplémentaire : `attemptAutoLogin()` remplit déjà les
deux champs à partir de données déjà validées lors de la dernière
connexion réussie (v6.139), donc le prénom auto-rempli correspond
toujours.

`tests/login-name-and-flash.test.js` : le test qui vérifiait l'ancien
comportement ("remplir un prénom différent met à jour le profil") est
remplacé par 3 tests couvrant le nouveau comportement — bon prénom,
bon prénom avec casse/espaces différents, et prénom différent
refusé (avec vérification que le vrai prénom n'a pas été écrasé).

**Compromis à noter** : il n'existe plus de moyen de corriger un
prénom mal orthographié à la création via l'écran de connexion — ce
serait maintenant traité comme un prénom "différent" et refusé. Si
besoin, dites-le-moi et j'ajouterai un vrai moyen de corriger son
prénom (dans les réglages, une fois connecté) plutôt que de rouvrir
cette porte au moment de la connexion.

`CACHE_NAME` incrémenté (`reparole-v6-140` → `reparole-v6-141`).

## v6.142 — Reconnaissance vocale : limite de navigateur clarifiée + darija algérienne complétée

**Reconnaissance vocale multi-navigateurs** : ce n'est pas un bug de
l'app — Firefox n'a **jamais implémenté** l'API `SpeechRecognition`,
aucun code JavaScript ne peut contourner ça. Deux améliorations
possibles faites : le micro est maintenant grisé (non cliquable) sur
un navigateur sans cette API, plutôt que de rester cliquable sans
rien faire ; le message d'avertissement nomme Firefox explicitement,
précise que ce n'est pas un bug, et propose Chrome/Edge/Safari.
Chaque exercice vocal reste entièrement utilisable sans micro
(validation manuelle déjà en place). Nouveau
`js/voice-recognition-cross-browser.md` : explique la seule vraie
solution pour Firefox (service de transcription tiers payant + Edge
Function côté serveur) — même limite que les rappels par email, je ne
peux pas créer/détenir de clé API à la place de l'utilisateur.

**Darija algérienne (dz) — compréhension complétée** : demandé
explicitement par l'utilisateur ("termine d'abord les traductions
presque terminées, comme le dz"). Contrairement à la dénomination et
la complétion (100% fournies par l'utilisateur, `docs/dz-parity-request.md`
le précisait), les 18 questions de compréhension sont **un brouillon
de ma part** — l'utilisateur a explicitement demandé de finaliser
plutôt que d'attendre un nouveau fichier natif. 2 questions (niveau 3,
des expressions idiomatiques) sont signalées comme les plus
incertaines. `docs/dz-parity-request.md` mis à jour avec le détail
pour une relecture native future. `tests/dz-exercises.test.js` : 2
tests mis à jour (l'un vérifiait explicitement l'absence de
compréhension).

`CACHE_NAME` déjà à `reparole-v6-142`.

## v6.143 — Nouvel exercice "Lire et comprendre" (point 7, dernier des 3 restants)

Suite de l'audit : sur les 3 derniers points de la demande
d'amélioration (6, 7, 17), seul le point 7 était réalisable proprement
sans nouvel atout que je n'ai pas (fichiers audio pour le point 6,
vrais visuels différents pour le point 17 — les rimes, en particulier,
ne se traduisent pas d'une langue à l'autre, contrairement à un texte).

**Nouvel exercice** : un court texte (2-3 phrases) suivi d'une
question à choix multiple — 18 items (6/6/6), niveau 3 basé sur un
petit raisonnement (calcul simple, déduction logique) plutôt qu'une
expression idiomatique, plus sûr à traduire fidèlement.

**Traductions ET aide faites dès cette version**, pas rattrapées après
coup — leçon retenue du retour de l'utilisateur sur "structure de
phrase" (v6.133 → complété seulement en v6.138) : les 18 items sont
traduits nativement dans les 9 langues complètes
(`js/exercises-story-i18n.js`, 162 items au total), et
`COMPANION_PHRASES.explain.story` existe dans les 10 langues
complètes + dz/ma/tn dès le départ.

**Réserve clinique à noter** : la compréhension de texte est un
profil d'aphasie à part entière (type Wernicke, notamment) — cet
exercice sera très inégal selon le profil du patient, pas un simple
"niveau supérieur" des autres exercices. À faire valider par un∙e
orthophoniste avant un usage clinique réel, comme le reste de la
banque (garde-fou n°8).

**Un vrai bug trouvé en écrivant les tests** : `exercises-story-i18n.js`
chargeait AVANT les fichiers par langue (`exercises-en.js`, etc.) dans
`index.html` — comme chaque fichier de langue fait
`window.BANK_EN = {...}` (remplacement complet, pas fusion), le
contenu que je venais d'ajouter était systématiquement écrasé à la
ligne suivante. Corrigé en déplaçant `exercises-story-i18n.js` après
tous les fichiers de langue, au même endroit que
`exercises-syntax-i18n.js` (qui, lui, était bien placé). Sans les
tests d'intégrité systématiques (`tests/story-exercise.test.js`), ce
bug n'aurait été visible qu'en testant manuellement dans le
navigateur — jamais repéré par une simple relecture du code.

`CACHE_NAME` incrémenté (`reparole-v6-142` → `reparole-v6-143`).

## v6.144 — Nouvel exercice "Rimes" (point 6, en parallèle du point 7 ci-dessus) + vrai bug de doublon corrigé

Suite de l'audit, en écho au point 7 juste au-dessus : le point 6
(sons/rimes) avait été écarté au premier passage par crainte de devoir
produire de vrais fichiers audio. En le reconsidérant : l'app a déjà
un mécanisme de synthèse vocale pour lire n'importe quel texte à voix
haute (`speak()`, déjà utilisé sur tous les autres exercices) — pas
besoin de fichiers audio séparés, la consigne elle-même ("Quel mot
rime avec « CHAT » ?") peut être lue par ce mécanisme existant.

**Vrai bug trouvé et corrigé en cours de route** : cet exercice avait
en fait déjà été ajouté en parallèle, avec un contenu différent —
deux implémentations complètes coexistaient dans le même fichier
(`js/exercises-new-types.js`, deux clés `rhyme:` dans le même objet
littéral), plus deux tuiles identiques sur le tableau de bord, plus
deux jeux de traductions `ex_rhyme_t`/`ex_rhyme_d` par langue. En JS,
une clé dupliquée dans un objet littéral ne provoque pas d'erreur —
la dernière définition écrase silencieusement la précédente. Résultat
concret : mon propre contenu était mort (jamais exécuté), et le
tableau de bord affichait la tuile "Rimes" deux fois. Nettoyé en
gardant une seule version (titre "Rimes", 24 items 8/8/8) et une seule
tuile. Aucune perte : `COMPANION_PHRASES.explain.rhyme` (aide
contextuelle) n'existait, lui, qu'une fois — comblé avant l'autre
implémentation, donc conservé tel quel.

Comble un manque réel : "sonorité" (erreurs phonologiques) est une
catégorie suivie par l'app depuis le début, sans exercice dédié pour
la travailler jusqu'ici.

`tests/new-exercise-types.test.js` : 6 nouveaux tests (contenu, tuile,
moteur d'exercice, aide, traductions) — écrits en vérifiant la
structure générique (existence, nombre d'items, cohérence des choix),
pas le texte exact du titre, donc restés valides après le nettoyage.

**Limite assumée, pas contournée** : contrairement aux autres
exercices, une rime ne se traduit pas d'une langue à l'autre (une
paire qui rime en français n'a aucune raison de rimer en anglais ou en
polonais) — le contenu de l'exercice lui-même reste donc en français
pour toutes les langues, seuls le titre/la description/l'aide sont
traduits.

`CACHE_NAME` incrémenté (`reparole-v6-143` → `reparole-v6-144`).

## v6.145 — Contenu corrigé + interface darija/kabyle rattrapée à 100%

Trois signalements sur les captures d'écran de l'utilisateur (darija
algérienne + français mélangés, "le marteau ne va pas avec une vis",
la phrase "que va avec ceci" pas top).

**Contenu corrigé** : la paire "Marteau → Vis" de l'exercice
"Associer les images" n'avait pas de sens (un marteau va avec un
clou, une vis va avec un tournevis) — remplacée par "Marteau → Bois"
(marteler du bois). Nouveau `label_wood` (10 langues complètes).

**Consigne rendue moins vague** : "Que va avec ceci ?" devient "Que
va avec « {mot} » ?" — `association_prompt` passe d'une chaîne fixe à
une fonction qui insère le nom réel de l'objet (déjà disponible via
`emojiLabel()`, utilisé pour l'étiquette sous l'image depuis la
v6.140), dans les 10 langues complètes + dz/ma/tn + kab (nouveau pour
ce dernier, il ne l'avait jamais eu).

**Interface darija/kabyle rattrapée à 100%** — le vrai sujet des
captures d'écran : dz/ma/tn et kab étaient tombés à 518-513 clés sur
538 (mélange visible de darija et de français dans les mêmes écrans),
à force d'ajouter des fonctionnalités seulement aux langues complètes
sans revenir ensuite compléter ces 4 langues. Comblé :
- **59 étiquettes d'émojis** (`label_alarm_clock` à `label_toothbrush`,
  plus `label_wood`) pour l'exercice "Associer les images" — c'est
  justement l'exercice testé sur les captures, où l'étiquette sous
  chaque image retombait en français.
- **20 clés d'interface** manquantes (bouton "Coller", "Je n'ai pas
  la force aujourd'hui", bascules d'accessibilité "usage à une main"/
  "sons de réponse"/"échauffement", messages de connexion, etc.)
- **5 clés propres au kabyle** (`ex_association_t/d`, `ex_syntax_t/d`,
  `association_prompt`) — dz/ma/tn les avaient déjà, kab ne les avait
  jamais eues.

Les 4 langues sont maintenant à **538/538**, comme les 10 langues
complètes. Pas une garantie de qualité native (toujours signalé comme
"en cours de traduction" pour dz/ma/tn/kab, voir v6.122-123) — juste
plus de mélange visible entre deux langues dans le même écran.

`CACHE_NAME` incrémenté (`reparole-v6-144` → `reparole-v6-145`).

## v6.146 — Masquer les exercices sans traduction plutôt que les afficher en français

Demandé par l'utilisateur : "possibilité de pas faire apparaître les
nouveaux exercices que l'on peut pas traduire en arabe ?"

**"Structure de phrase" et "Lire et comprendre"** reposent sur de
vraies phrases françaises — contrairement aux exercices classiques
(un mot isolé, facile à traduire) ou "Associer les images" (des
émojis, universels). Sans traduction pour dz/ma/tn/kab/sg, ces tuiles
menaient à du contenu qui retombait en français avec un bandeau
d'avertissement — aggravant le mélange de langues déjà signalé
plusieurs fois. Elles sont maintenant **masquées entièrement** si
aucun contenu traduit n'existe pour la langue active, plutôt
qu'affichées avec un repli. Se réaffichent automatiquement en
choisissant une langue qui a le contenu traduit (`updateExerciseLocks()`,
déjà appelée à chaque changement de langue — aucun nouveau
déclencheur nécessaire).

**"Rimes" n'est volontairement pas concerné** : contrairement aux
deux autres, une rime ne se traduit dans **aucune** langue, même
anglais ou espagnol — ce n'est pas un manque de traduction propre à
une langue partielle, mais une limite déjà documentée et acceptée
pour tout le monde (v6.144).

`tests/hide-untranslated-exercises.test.js` (nouveau, 8 tests) :
visible en français et dans les langues traduites, masqué dans les 4
langues partielles, "Rimes" jamais masqué, réaffichage correct au
changement de langue.

`CACHE_NAME` incrémenté (`reparole-v6-145` → `reparole-v6-146`).

## v6.147 — Contenu d'exercices pour le marocain et le tunisien (le vrai trou signalé depuis plusieurs audits)

Demandé explicitement : "attaque la traduction marocain et tunisien"
— ces deux langues avaient une interface complète (538/538 depuis la
v6.145) mais **zéro contenu d'exercice**, identifié comme la priorité
la plus concrète dans les deux derniers audits.

**Nouveaux fichiers** `js/exercises-ma.js` et `js/exercises-tn.js` :
24 mots de dénomination, 24 phrases de complétion, 18 questions de
compréhension chacun (8/8/8 et 6/6/6 par niveau) — même échelle que
les 9 langues "complètes", même contenu sémantique de base
(traduction de `js/exercises-en.js`, déjà éprouvé). Marqueurs
possessifs distinctifs respectés : ديال pour le marocain, متاع pour
le tunisien (comme le reste de l'interface de chacune, voir
`js/i18n.js`) — vérifié par test que ce ne sont pas deux copies
identiques.

**⚠️ Statut différent de la darija algérienne** : contrairement à
`js/exercises-dz.js` (dénomination/complétion fournies à 100% par des
fichiers Excel natifs), **aucun fichier natif n'a été fourni ici** —
ce contenu est un premier brouillon de ma part, comme la compréhension
algérienne (v6.142) et divers contenus kabyles. `docs/ma-parity-request.md`
et `docs/tn-parity-request.md` (nouveaux) détaillent ce qui mérite le
plus une relecture native, notamment les 2 questions par langue
contenant une expression idiomatique.

`tests/moroccan-tunisian-exercises.test.js` (nouveau, 12 tests) :
intégrité du contenu, distinction réelle entre les 3 dialectes
maghrébins (pas trois copies), intégration dans le moteur d'exercice.

**Pas d'exercices vocaux** pour ces deux langues (répétition,
dénomination orale, fluence) : aucune voix de navigateur ne prend en
charge le marocain ni le tunisien — limite technique documentée dans
`js/voice-recognition-cross-browser.md`, pas un manque de contenu.

`CACHE_NAME` incrémenté (`reparole-v6-146` → `reparole-v6-147`).

## v6.148 — Le choix de langue seulement à l'accueil

Signalé par l'utilisateur : le sélecteur de langue était accessible à
deux endroits — l'écran de connexion (attendu) et aussi le tableau de
bord, juste au-dessus des bascules d'accessibilité (Lecture facilitée,
Police adaptée, etc.). Retiré du tableau de bord (`index.html`, le
conteneur `<div class="access-bar" data-lang-switcher>` correspondant
a été supprimé) — un seul sélecteur reste, à l'écran de connexion.

Les espaces aidant et orthophoniste (`aidant.html`,
`dashboard-ortho.html`) ne sont pas concernés — pas mentionnés par
l'utilisateur, et ce sont des contextes différents (accès ponctuel,
pas une session de travail continue comme le tableau de bord patient).

`tests/lang-switcher-login-only.test.js` (nouveau, 3 tests) : un seul
conteneur `data-lang-switcher` dans tout `index.html`, situé dans
`#login` et non `#dashboard`, et `Prefs.renderLangSwitchers()` ne crée
bien qu'un seul `<select>` de langue au final.

Test complet relancé à cette occasion (66 suites, 0 échec) — confirme
au passage que la mise à jour précédente (v6.147, contenu marocain et
tunisien) fonctionne toujours correctement.

`CACHE_NAME` incrémenté (`reparole-v6-147` → `reparole-v6-148`).

## v6.149 — "Rimes" rejoint la liste des exercices masqués en langue non française

Capture d'écran à l'appui : l'utilisateur a confirmé que "Rimes"
n'aurait pas dû apparaître en darija — décision inversée par rapport
à la v6.146, où j'avais volontairement exclu cet exercice du
masquage en distinguant "manque de traduction" (Structure de phrase,
Lire et comprendre) et "limite universelle intraduisible" (une rime
ne se traduit dans aucune langue). Cette distinction technique
n'avait pas d'importance du point de vue du patient : dans les deux
cas, du français apparaît là où il ne l'attend pas.

`FRENCH_ONLY_EXERCISE_TYPES` (`js/app.js`) inclut maintenant `rhyme`
en plus de `syntax` et `story`. Conséquence logique du mécanisme déjà
en place (`hasTranslatedContent()`) : "Rimes" est désormais masqué
pour **toutes** les langues non françaises, pas seulement les 4
partielles — y compris les 9 langues "complètes" (anglais, espagnol...),
puisqu'aucune n'a de contenu de rimes traduit non plus.

`tests/hide-untranslated-exercises.test.js` mis à jour : l'ancien test
qui vérifiait que "Rimes" restait toujours visible est remplacé par 3
tests qui vérifient le nouveau comportement (masqué en kabyle, masqué
en anglais, visible en français).

`CACHE_NAME` incrémenté (`reparole-v6-148` → `reparole-v6-149`).

## v6.150 — Infrastructure voix cloud (préparation avant l'application téléphonique)

Demandé explicitement : améliorer la qualité des voix avant
d'envisager une app téléphonique. Tout le code est prêt — il ne
manque que la clé API Google Cloud, que je ne peux pas créer à la
place de l'utilisateur (voir `scripts/SETUP-VOIX-CLOUD.md` pour le
guide pas à pas, ~15-20 minutes).

**`scripts/extract-voice-content.js`** (nouveau) : fait tourner l'app
réelle pour chacune des 10 langues complètes et capture chaque texte
que `speak()` recevrait jamais — plutôt que de reconstruire la
logique séparément (risque de décalage si le code change). Corrigé
en cours de route : `startExercise()` n'échantillonne qu'un
sous-ensemble par séance, il fallait itérer directement sur le
contenu des banques pour couvrir vraiment tout. Résultat :
`scripts/voice-manifest.json`, 1 366 textes uniques, ~48 000
caractères au total.

**Découverte en marge du travail, pas liée aux voix** : le japonais
n'a en fait pas les banques "dénomination orale", "répétition" ni
"intonation" — contrairement aux 9 autres langues complètes,
découvert en comparant les comptages EN vs JA. Signalé ici pour
mémoire, pas traité dans cette livraison (hors sujet du jour).

**`scripts/generate-voice-audio.js`** (nouveau) : génère un MP3 par
texte unique du manifeste. Découvre lui-même la meilleure voix
disponible par langue via l'API Google (Neural2 en priorité, puis
WaveNet, puis Standard) plutôt que de figer un nom de voix qui
pourrait devenir invalide avec le temps. Idempotent : relancer après
un ajout de contenu ne régénère que les nouveaux fichiers.

**`speak()` (`js/app.js`)** : essaie d'abord un fichier audio
pré-généré, ne retombe sur la synthèse du navigateur que si ce
fichier n'existe pas — avec un **filet de sécurité par délai de
2,5s**, trouvé nécessaire en écrivant les tests (une requête qui ne
se résout jamais, ex. connexion lente, ne doit jamais laisser le
patient sans rien entendre). Reste volontairement sur la voix
navigateur pour le texte de bilan téléversé par le patient
(dynamique, ne peut pas être pré-généré) et les langues partielles.

`tests/cloud-voice.test.js` (nouveau, 8 tests) : cohérence de la
fonction de hachage entre les deux scripts (condition indispensable
pour que l'app retrouve les bons fichiers), comportement du repli,
absence de clé API en dur dans le code.

**Coût réel estimé** : moins d'1 €, une seule fois — pas un
abonnement (voir le guide de configuration pour le détail).

`CACHE_NAME` incrémenté (`reparole-v6-149` → `reparole-v6-150`).

## v6.151 — Sango retiré, japonais réellement complété

Demandé explicitement : "faudra enlever le sango et compléter le
japonais."

**Sango retiré entièrement** : n'avait jamais dépassé 22 mots de
dénomination ni eu d'interface traduite (0/538). Supprimé de
`LANGUAGES` et `PARTIAL_LANGS` (`js/i18n.js`), du sélecteur de langue,
du chargement (`index.html`, `sw.js`), et des fichiers dédiés
(`js/exercises-sango.js`, `audio/sango/`,
`docs/sango-translation-request.md`) — plus une trace dans le code
actif. **10 fichiers de test** référençaient sango : les tests qui
utilisaient sango comme exemple de "langue partielle sans aucun
contenu" ont été adaptés avec un code de langue synthétique (`'xx'`)
plutôt que supprimés, puisque ce scénario générique reste pertinent
pour de futures langues partielles — kab/dz/ma/tn ont maintenant
toutes du vrai contenu, aucune ne peut plus servir d'exemple "vide".
Un vrai test de régression (`partial-lang-generalization.test.js`)
utilisait sango comme second exemple du mécanisme audio
pré-recorded : remplacé par dz, qui utilise réellement ce même
mécanisme (trouvé en vérifiant — `BANK_DZ.denomination` a bien un
champ `consigne`, comme le kabyle).

**Japonais réellement complété** : le vrai manque trouvé en marge de
la v6.150 (denomination_orale/repetition/intonation absents malgré
le statut "langue complète" depuis la v6.91) est comblé —
`js/exercises-ja.js` a maintenant les 3 exercices vocaux, même échelle
que les 8 autres langues complètes (6/6/6, 8/8/8, 6/6/6). Contenu de
ma part (pas de nouveau fichier fourni), avec le même soin que le
reste : mots volontairement longs/complexes au niveau 3 de
"repetition" (même logique que les autres langues), pas une
traduction terme à terme de leur liste. `tests/japanese-language.test.js`
mis à jour : le test qui vérifiait explicitement le repli sur le
français pour "repetition" (le manque n'existant pas encore) est
remplacé par un test qui vérifie que du vrai contenu japonais est
utilisé.

`CACHE_NAME` incrémenté (`reparole-v6-150` → `reparole-v6-151`).

## v6.152 — Le bilan initial (accueil, dépôt de rapport, résultat) ne mélange plus les langues

Signalé par l'utilisateur, captures d'écran à l'appui : "Bienvenue",
"Avez-vous un bilan ?", "Vos ressentis" s'affichaient en français
malgré une interface en darija — "on a régressé au niveau des langues
arabes."

**Le vrai bug, plus profond que prévu** : `ASSESS_STRINGS` (l'écran de
bilan initial) est un objet **entièrement séparé** de `I18N_STRINGS` —
jamais couvert par les vérifications de parité "538/538" mises en
place en v6.145. dz/ma/tn n'y avaient **tout simplement aucune
entrée**, ni `SYMPTOM_QUESTIONS_XX` (le mini-test "Vos ressentis") ni
`ASSESS_ITEMS_XX` (le mini-test à choix multiple du bilan) associés —
pas une régression au sens strict, mais un manque jamais comblé
depuis la création de ces 3 langues. Kabyle avait un socle partiel,
avec 9 clés connues comme manquantes depuis longtemps (documenté dans
un commentaire du code, jamais traité) — combattu au passage.

**Comblé** :
- `ASSESS_STRINGS` : dz/ma/tn passent de 0/36 à 36/36 (brouillon de
  ma part, même statut que le reste du contenu dz/ma/tn) ; kab passe
  de 27/36 à 36/36.
- `SYMPTOM_QUESTIONS_DZ/MA/TN` (nouveau, 4 questions chacune).
- `ASSESS_ITEMS_DZ/MA/TN` (nouveau, 3/3/3).
- `ASSESS_DOMAIN_LABELS_DZ/MA/TN` (nouveau, 3 domaines).

**Vérifié, pas un bug** : le pied de page (CGU/CGV/mentions légales)
visible en français sur les captures utilise déjà `I18N.t()` avec les
bonnes traductions présentes dans `I18N_STRINGS` (vérifié directement)
— très probablement des captures prises sur une version pas encore à
jour plutôt qu'un bug actuel.

`tests/assessment-i18n-completeness.test.js` (nouveau, 5 tests) :
verrouille la parité 36/36 pour les 4 langues partielles, empêche ce
trou de refaire surface à l'avenir.

`CACHE_NAME` incrémenté (`reparole-v6-151` → `reparole-v6-152`).

## v6.153 — Le compteur de connexions restait à zéro sans jamais dire pourquoi

Signalé par l'utilisateur : "on voit toujours pas le nombre de
connexions des personnes" — alors que le panneau admin montre bien
21 vraies séances enregistrées ("Séances par type d'exercice") juste
au-dessus, ce qui exclut un simple "personne ne s'est encore
connecté·e".

**Piste la plus probable trouvée** : `log_patient_connection()`
utilise `digest(p_code, 'sha256')` — une fonction fournie par
l'extension PostgreSQL `pgcrypto`. `sql/schema.sql` l'active bien
(`create extension if not exists pgcrypto;`), mais l'activation d'une
extension peut échouer silencieusement selon le plan/les droits
Supabase. Le vrai problème : `Store.logConnection()` avalait
**toute** erreur sans rien logger nulle part — un échec d'écriture
invisible qui rendait ce problème précis impossible à diagnostiquer
depuis le navigateur.

**Corrigé** :
- `Store.logConnection()` (`js/storage.js`) journalise maintenant
  l'erreur réelle dans la console du navigateur (`console.warn`) —
  toujours non-bloquant pour la connexion elle-même, juste visible
  pour qui vérifie.
- Le panneau admin (`js/admin.js`) explique maintenant, quand le
  compteur est à zéro, que ça peut venir d'un échec d'écriture
  silencieux plutôt que d'une absence réelle de connexions, et pointe
  directement vers `pgcrypto` (Supabase → Database → Extensions)
  comme première chose à vérifier.

**Reste à faire par l'utilisateur** : vérifier dans Supabase que
l'extension `pgcrypto` est bien activée, puis se reconnecter une fois
en gardant la console du navigateur (F12) ouverte pour confirmer —
soit le compteur se peuple, soit l'erreur exacte apparaît enfin.

`CACHE_NAME` incrémenté (`reparole-v6-152` → `reparole-v6-153`).

## v6.154 — Le vrai correctif du compteur de connexions (enfin trouvé, grâce au console.warn de la v153)

Suite directe de la v6.153 : une fois le `console.warn` déployé et la
console du navigateur consultée par l'utilisateur au bon endroit
(page patient, onglet Console — pas la page admin), le vrai message
est enfin apparu : **"function digest(text, unknown) does not exist"**.

**La cause réelle, confirmée** : l'extension `pgcrypto` était bien
activée dans Supabase (vérifié par capture d'écran, Database →
Extensions) — ma première piste (v6.153) n'était donc pas fausse sur
le fond, juste incomplète. Le vrai problème : Supabase installe
`pgcrypto` dans le schéma **`extensions`**, jamais dans `public`. La
fonction `log_patient_connection()` restreignait sa recherche de
fonctions à `public` uniquement (`search_path = public`) — une bonne
pratique de sécurité en général, mais qui rend `digest()` invisible
dans ce cas précis, même avec l'extension bel et bien active.

**Corrigé** (`sql/schema.sql`) : `search_path = public, extensions` —
`digest()` est maintenant trouvée sans rien changer côté Supabase.

`tests/sql-schema-sanity.test.js` (nouveau, 3 tests) : verrouille ce
correctif précis pour qu'il ne puisse plus être perdu par erreur lors
d'une future modification du fichier, plus deux autres vérifications
de bon sens sur le fichier SQL (pgcrypto bien déclarée, le correctif
`get_patient` de la v6.135 toujours en place).

Message du panneau admin mis à jour en conséquence : pointe
maintenant directement vers "rejouez sql/schema.sql", plutôt que vers
une simple vérification de pgcrypto qui, on le sait maintenant, ne
suffit pas à elle seule.

**Reste à faire par l'utilisateur** : rejouer `sql/schema.sql` en
entier dans Supabase → SQL Editor (comme d'habitude, sans risque) —
c'est ce qui applique enfin ce correctif à la base réelle.

`CACHE_NAME` incrémenté (`reparole-v6-153` → `reparole-v6-154`).

## v6.155 — Répartition gratuit/Pro revue : toutes les langues restent gratuites

Suite d'une discussion sur le prix (10 €/mois retenu, plutôt que
2,99 €) : l'occasion de revoir la structure gratuit/Pro elle-même,
jamais activée jusqu'ici (`PAYWALL_ENABLED` reste `false`).

**VRAIE INCOHÉRENCE trouvée en revoyant `js/app.js`** : `FREE_LANGS`
ne couvrait jusqu'ici que le français — verrouillant tout le travail
multilingue (14 langues, la vraie différence de ce projet) derrière
l'abonnement, à l'exact inverse de l'objectif « accessible à tous »
pour le public visé en priorité (personnes ne parlant pas français,
souvent le budget le plus limité). **Toutes les 14 langues sont
maintenant gratuites** — seuls les exercices vocaux avancés
(répétition, dénomination orale, fluence, intonation) et la
conversation guidée restent réservés au Pro, une répartition qui
reflète de vrais coûts (ces exercices coûteraient réellement plus
cher à faire tourner si la reconnaissance vocale cloud est ajoutée
plus tard) plutôt qu'une langue parlée.

**Vérifié à cette occasion, pas modifié** : les réglages
d'accessibilité (`js/prefs.js` — usage à une main, police adaptée,
séance courte...) ne référencent le paywall nulle part, structurellement
— jamais payants, par construction et pas par oubli. Verrouillé par
un nouveau test pour que ça le reste.

**Tarifs affichés mis à jour** (`index.html`) pour refléter la
décision : 10 €/mois (au lieu de 2,99 €), 100 €/an (au lieu de
19,99 €, qui n'avait plus de sens à côté du nouveau mensuel — environ
2 mois offerts, une hypothèse raisonnable à confirmer plutôt qu'un
choix arbitraire). La liste des avantages Pro affichée au patient a
aussi été corrigée : elle promettait encore « toutes les langues »
comme bénéfice payant, ce qui n'est plus vrai.

`tests/plan-and-mfa.test.js` : 3 nouveaux tests (toutes les langues
accessibles en gratuit, le verrou vient bien du type d'exercice pas
de la langue, les réglages d'accessibilité restent structurellement
hors du système de paiement).

**Toujours désactivé** : `PAYWALL_ENABLED = false` — la structure est
prête, rien ne facture personne tant que ce booléen n'est pas
explicitement réactivé.

`CACHE_NAME` incrémenté (`reparole-v6-154` → `reparole-v6-155`).

## v6.156 — 5 nouveaux exercices pour l'acalculie (cognition numérique post-AVC)

Demandé explicitement par l'utilisateur, après une discussion sur des
outils professionnels (Examath, HappyNeuron Pro) : « pour moi si
c'est utile aux personnes qui ont fait un AVC, il faut que cela
existe dans ReParole... quitte à le faire, faut le faire jusqu'au
bout. »

**Le besoin confirmé par recherche** : l'acalculie (trouble acquis du
traitement des nombres après une lésion cérébrale) touche une partie
réelle du public de ReParole, souvent en plus de l'aphasie, et reste
peu prise en charge — les outils cliniques existants (comme Examath)
sont étalonnés sur des enfants avec un trouble développemental, pas
sur des adultes avec un trouble acquis. Voir
`docs/acalculie-exercises.md` pour le détail complet du raisonnement.

**5 nouveaux types d'exercice** (`js/exercises-acalculie.js`),
inspirés dans l'**esprit** de la BENQ (tâches concrètes du quotidien)
mais avec un contenu intégralement original, jamais une reproduction
d'un outil publié : Lire l'heure (émojis d'horloge Unicode), Compter
la monnaie, Calcul du quotidien, Comparer les nombres, Estimer un
prix. 3 niveaux, 6 items/niveau, 90 items au total — même mécanisme
de difficulté adaptative que les 14 autres exercices existants.
Comme tout ReParole : de l'entraînement, jamais un diagnostic —
aucun score normé, aucun seuil pathologique.

**Bug trouvé et corrigé en cours de route** : le champ `emoji` pour
un item n'est traité spécialement que pour le type `denomination`
dans `renderQuestion()` (`js/app.js`) — pas génériquement. Les items
de "Lire l'heure" utilisent donc `text` (contenant l'émoji d'horloge)
comme les 4 autres nouveaux types, pas `emoji`.

**Traductions d'interface immédiates, contenu français pour
l'instant** : même précédent que syntax/story/rhyme en leur temps —
les 10 clés d'interface (5 titres + 5 descriptions) sont traduites
dans les 14 langues dès maintenant, mais les 5 nouveaux exercices
rejoignent `FRENCH_ONLY_EXERCISE_TYPES` et restent masqués partout
ailleurs tant que le contenu réel n'est pas traduit — jamais de
mélange de langues visible.

`tests/acalculie-exercises.test.js` (nouveau, 10 tests) : intégrité
du contenu (90 items vérifiés), intégration dans le tableau de bord
et le moteur d'exercice, masquage correct en langue non traduite,
parité des 14 langues pour l'interface.

`CACHE_NAME` incrémenté (`reparole-v6-155` → `reparole-v6-156`).

## v6.157 — Contenu d'acalculie étendu (168 items au lieu de 90)

Suite directe de la v6.156 : l'utilisateur a demandé s'il était
possible d'ajouter plus d'items.

**Une vraie limite trouvée pour « Lire l'heure »** : Unicode ne
fournit que 24 émojis d'horloge distincts (12 heures pleines + 12
demi-heures) — 18 étaient déjà utilisés, il n'en restait que 6
possibles sans dupliquer. Plafonné à 8/niveau (24 au total), les 6
émojis restants intégrés — ce n'est pas un choix arbitraire mais une
contrainte réelle du format choisi (changer de représentation
casserait la cohérence visuelle de l'exercice).

**Les 4 autres exercices doublés** (`js/exercises-acalculie.js`) :
monnaie, calcul_quotidien, comparaison_nombres et prix passent de
6 à 12 items par niveau (36 chacun), sans aucun doublon avec le
contenu existant — vérifié explicitement par test.

**168 items au total** (24 + 36×4), contre 90 avant cette version.

`tests/acalculie-exercises.test.js` mis à jour : les tests
d'intégrité couvrent maintenant les nouveaux volumes exacts (8/8/8
pour heure, 12/12/12 pour les 4 autres), et un nouveau test verrouille
le fait que « heure » utilise bien les 24 émojis disponibles, pas un
de plus ni un de moins.

`CACHE_NAME` incrémenté (`reparole-v6-156` → `reparole-v6-157`).

## v6.158 — Une vraie horloge dessinée, plus de plafond pour "Lire l'heure"

Suite de la v6.157 : "tu en es capable j'en suis sûr de me faire une
superbe horloge" — le plafond de 24 émojis d'horloge Unicode était
réel, mais contournable en dessinant l'horloge soi-même plutôt que de
dépendre du jeu de caractères disponible.

**Horloge SVG dessinée** (générée dans le script de contenu, intégrée
dans `js/exercises-acalculie.js`) : cadran, 12 repères, aiguille des
heures et des minutes positionnées par calcul trigonométrique exact
selon l'heure et la minute demandées — pas une image fixe, une vraie
horloge calculée pour chaque item. `currentColor` hérite de la
couleur du texte du prompt (`css/style.css`, nouvelle règle
`.clock-face`), s'adapte donc automatiquement au mode sombre sans
règle séparée.

**Plus de plafond** : "Lire l'heure" passe de 24 à **36 items**
(12/12/12, aligné sur les 4 autres exercices) — et surtout, les
**quarts d'heure deviennent possibles** ("3 heures et quart", "5
heures moins le quart"...), quelque chose que le jeu d'émojis limité
ne permettait pas du tout.

**180 items au total** pour les 5 exercices d'acalculie (36 chacun),
contre 168 avant cette version.

`tests/acalculie-exercises.test.js` mis à jour : vérifie que "heure"
contient bien du SVG avec la classe `.clock-face`, que les 36 heures
sont toutes distinctes, et que le niveau 3 contient bien des quarts
d'heure — une preuve directe que le plafond a sauté.

**Vérification** : la géométrie (trigonométrie standard pour les
aiguilles) a été vérifiée par le calcul et par une analyse de pixels
de l'image rendue (contenu visible bien positionné dans la zone
attendue) — pas de confirmation visuelle directe possible dans cette
session pour des raisons d'outil, à vérifier visuellement une fois
déployé.

`CACHE_NAME` incrémenté (`reparole-v6-157` → `reparole-v6-158`).

## v6.159 — Les 5 exercices d'acalculie traduits dans les 9 langues complètes

Demandé : « je te fais confiance, fais ce qui te semble le mieux...
livre-moi un upgrade avec toutes les traductions de faites pour tous
les exercices. »

**1620 items traduits** (5 exercices × 3 niveaux × 12 items × 9
langues : en/es/it/pt/de/ar/tr/pl/ja), déjà présents dans
`js/exercises-acalculie-i18n.js` et correctement câblés dans
`index.html`/`sw.js` — restait seulement à retirer le verrou qui les
gardait masqués.

**Monnaie et prix localisés par pays**, pas juste traduits mot à
mot : dollars pour l'anglais, livre égyptienne pour l'arabe (22 pays
parlent arabe, aucun choix de devise n'est neutre — un choix
pragmatique a dû être fait), yens avec de vraies coupures de pièces
japonaises, lires turques, zlotys polonais. Une approche plus fidèle
que garder l'euro partout.

**Vrai bug trouvé et corrigé en testant** : `FRENCH_ONLY_EXERCISE_TYPES`
(`js/app.js`) a un nom trompeur — elle ne veut pas dire « toujours
français uniquement », mais déclenche une vérification dynamique
(`hasTranslatedContent()`) qui affiche ou masque une tuile selon que
la langue active a réellement du contenu. Retirer les 5 exercices
d'acalculie de cette liste (première tentative) désactivait la
vérification *entièrement* — plus aucun masquage, y compris pour
dz/ma/tn/kab qui n'ont toujours pas de traduction. Corrigé en les
laissant dans la liste : `hasTranslatedContent()` les affiche
maintenant correctement pour les 9 langues complètes et les masque
toujours proprement pour les 4 langues partielles.

`tests/acalculie-exercises.test.js` : 5 nouveaux tests couvrant les
1620 items (intégrité, aucun doublon), la localisation monétaire
réelle (`$` en anglais, `円` en japonais), et la visibilité correcte
par langue.

**Toujours français uniquement** pour dz/ma/tn/kab — masqué
proprement, pas de mélange de langues.

`CACHE_NAME` incrémenté (`reparole-v6-158` → `reparole-v6-159`).

## v6.160 — Deux vrais trous de localisation trouvés : le prénom d'exemple et le nom du compagnon

Demandé explicitement : porter une attention particulière à la
qualité linguistique, en citant deux exemples précis — le compagnon
qui reste "Ami" dans certaines langues, et un prénom qui reste en
français.

**Le prénom d'exemple ("Ex : Marie")** : vérifié précisément —
7 langues sur 9 langues complètes (en/es/it/pt/de/tr/pl) affichaient
encore "Marie" (un prénom français) comme exemple, alors que
l'arabe, le japonais et le kabyle avaient déjà leur propre prénom
localisé (مريم, さくら, Meryem) depuis longtemps. Une vraie
incohérence, pas un oubli généralisé — corrigé pour les 7 : Emma
(en), María (es), Maria (it/pt), Anna (de/pl), Ayşe (tr).

**Le nom du compagnon "Ami"** : jusqu'ici volontairement identique
dans toutes les langues (décision documentée dans le code, même
logique que "ReParole" qui reste "ReParole" partout). Le raisonnement
tenait pour les langues en alphabet latin, mais pas pour l'arabe ou
le japonais : "Ami" y apparaissait en lettres latines au milieu d'un
texte dans une tout autre écriture — illisible phonétiquement, pas la
même situation qu'un nom de marque affiché tel quel. Transcrit
maintenant phonétiquement selon l'écriture active : **آمي** pour
l'arabe et les 3 dialectes maghrébins (dz/ma/tn, même écriture
arabe), **アミ** pour le japonais (katakana, comme n'importe quel nom
étranger — "Netflix" devient ネットフリックス de la même façon).
Kabyle reste "Ami" : alphabet latin, le nom y reste lisible tel quel.

**Vérifié, pas de bug trouvé** : un balayage plus large de
l'ensemble des clés `I18N_STRINGS` n'a révélé aucun autre cas
similaire — les autres correspondances identiques entre langues sont
des noms de marque légitimes ("ReParole", "ReParole Pro") ou de
vrais cognats ("Normal", identique en français/anglais/espagnol/
portugais/allemand/turc).

`tests/placeholder-translation.test.js` : 3 nouveaux tests
verrouillent les deux correctifs — chaque langue complète a son
propre prénom, "Ami" reste "Ami" en alphabet latin et se transcrit
correctement en écriture arabe/japonaise.

`CACHE_NAME` incrémenté (`reparole-v6-159` → `reparole-v6-160`).

## v6.161 — "Lire et comprendre" pour dz/ma/tn — et ce qui a été délibérément écarté

Suite de l'audit du cœur du produit (v6.160) : le seul vrai trou
identifié dans les 4 piliers demandés (langage, parole, mémoire,
acalculie) était l'absence de "Structure de phrase" et "Lire et
comprendre" pour dz/ma/tn/kab. L'utilisateur a explicitement demandé
fiabilité maximale ("on n'a pas le droit à l'erreur") — l'occasion de
calibrer honnêtement la confiance réelle par exercice et par langue,
plutôt que de tout traiter de la même façon.

**Construit** : "Lire et comprendre" pour dz, ma, tn (18 items × 3 =
54 au total, `js/exercises-story-dz.js` et équivalents) — mêmes
petites histoires que la version française, adaptées avec les
marqueurs dialectaux déjà établis dans ce projet (تاع/ديال/متاع).

**Délibérément écarté, avec la raison à chaque fois** :
- **"Structure de phrase" pour les 4 langues** : cet exercice
  demande de construire des erreurs grammaticales *plausibles* comme
  pièges — un niveau de maîtrise de l'ordre des mots et de l'accord
  que je ne peux pas garantir pour ces dialectes. Produire un
  brouillon ici risquerait de paraître fiable sans l'être vraiment.
- **"Lire et comprendre" en kabyle** : le kabyle est une langue à
  part (berbère), pas un dialecte arabe comme dz/ma/tn — ma
  familiarité y est nettement plus limitée, et écrire un texte
  cohérent de plusieurs phrases est plus exigeant que le vocabulaire
  ou les questions courtes déjà traduites pour cette langue.

`tests/story-darija.test.js` (nouveau, 5 tests) : intégrité du
contenu, confirmation que `story` n'est plus masqué pour dz/ma/tn
mais reste masqué pour kab, et vérification que le contenu affiché
est bien en écriture arabe (pas un repli silencieux sur le français).

**⚠️ Comme toujours pour le contenu dz/ma/tn** : brouillon de ma
part, jamais relu par un∙e locuteur∙rice natif∙ve — à faire vérifier
avant tout usage clinique réel.

`CACHE_NAME` incrémenté (`reparole-v6-160` → `reparole-v6-161`).

## v6.162 — "Écouter la consigne" lisait le code SVG de l'horloge à voix haute

Signalé par l'utilisateur, juste après avoir testé les nouvelles voix
cloud : « il me sort un tas de code incompréhensible » sur l'exercice
"Lire l'heure".

**Le vrai bug, sans rapport avec les voix cloud elles-mêmes** :
l'horloge dessinée en SVG (v6.158) stocke son dessin dans le même
champ `text` que la consigne parlée, par nécessité technique. La
branche générique de `renderQuestion()` (`js/app.js`) faisait
`consigne = q.text` pour tout type sans cas particulier — pour
"heure", ça voulait dire lire le balisage SVG brut caractère par
caractère au clic sur "Écouter la consigne", au lieu d'une vraie
question.

**Corrigé** : "heure" a maintenant son propre cas dans
`renderQuestion()`, avec une consigne dédiée (`heure_prompt`,
"Quelle heure est-il ?") — l'affichage garde le dessin SVG comme
avant, seule la voix change.

**Vérifié, pas d'autre cas similaire** : balayage de tous les types
d'exercice pour du balisage HTML/SVG dans un champ `text` — "heure"
était bien le seul concerné.

`tests/acalculie-exercises.test.js` : nouveau test qui vérifie
directement le texte transmis au bouton "Écouter" plutôt que
l'affichage, pour empêcher ce genre de bug de repasser inaperçu.

**⚠️ Voix cloud à régénérer** : `heure_prompt` est un nouveau texte
parlé (10 langues). Depuis Codespaces, avec la même clé API que la
dernière fois :
```bash
node scripts/extract-voice-content.js
GOOGLE_TTS_API_KEY=votre_clé node scripts/generate-voice-audio.js
```
Sans ça, "Écouter la consigne" sur "Lire l'heure" retombera
temporairement sur la voix du navigateur (pas cassé, juste moins
naturel) jusqu'à la prochaine génération.

`CACHE_NAME` incrémenté (`reparole-v6-161` → `reparole-v6-162`).

## v6.163 — Documenté : ne jamais écraser le dossier audio/ lors d'une mise à jour

Suite directe de la génération des voix cloud : l'utilisateur a
mentionné son habitude habituelle de tout supprimer puis remettre le
zip complet à chaque mise à jour — une méthode qui **effacerait les
~1 400 fichiers audio générés**, puisqu'aucun zip livré ne contient
jamais ce dossier (il n'existe que sur le dépôt de l'utilisateur,
généré avec sa propre clé Google Cloud).

**Documenté à deux endroits, avec renvoi croisé** :
- `HEBERGEMENT.md` : avertissement en haut du document, avant même
  les instructions d'hébergement, plus une méthode de mise à jour
  sûre (« tout supprimer sauf `audio/` »)
- `scripts/SETUP-VOIX-CLOUD.md` : rappel juste après la section qui
  explique comment ce dossier se génère

Purement documentaire — aucun changement de code, `CACHE_NAME`
incrémenté par cohérence avec le reste du versionnage
(`reparole-v6-162` → `reparole-v6-163`).

## v6.164 — Deux vrais trous trouvés pour l'acalculie : les voix, et le message d'Ami

Signalé par l'utilisateur : "j'entends une série de code" sur
"Estimer un prix" en japonais, malgré les deux générations de voix
déjà faites. Sa capture d'écran a aussi révélé un second problème,
visible juste au-dessus : le message d'Ami restait en français alors
que toute l'interface était en japonais.

**Le vrai bug voix, plus large que prévu** :
`scripts/extract-voice-content.js` a une liste figée (`SIMPLE_TYPES`)
des types d'exercice à extraire pour la génération de voix — écrite
en v6.150, **jamais mise à jour** depuis la création des 5 exercices
d'acalculie (v6.156+). Leur contenu n'a donc jamais été envoyé à
Google, dans aucune des deux générations déjà faites — pas un raté
ponctuel, un trou de couverture depuis le début. Corrigé : les 5
types ajoutés à `SIMPLE_TYPES`. Le manifeste passe de 1 366 à **2 864
textes** (presque le double) une fois régénéré.

**Le message d'Ami** : les explications du compagnon pour les 5
exercices d'acalculie n'existaient qu'en français
(`js/companion.js`) — jamais traduites dans les 9 langues
complètes, contrairement à tout le reste du contenu. Corrigé : 45
nouvelles traductions (5 exercices × 9 langues).

`tests/voice-extraction-coverage.test.js` (nouveau, 3 tests) :
vérifie que tout type d'exercice à contenu textuel simple présent
dans `BANK` est bien couvert par `SIMPLE_TYPES`, sauf exclusion
documentée (repetition/intonation/fluence gérés séparément,
photos_perso/memory/conversation volontairement exclus) — empêche un
futur nouveau type de se retrouver dans la même situation sans qu'on
s'en aperçoive.

**⚠️ Voix cloud à régénérer, lot plus important cette fois** (~1 500
nouveaux textes, contre 42 la dernière fois) :
```bash
node scripts/extract-voice-content.js
GOOGLE_TTS_API_KEY=votre_clé node scripts/generate-voice-audio.js
```
Coût toujours attendu à 0 € (bien en dessous du palier gratuit
mensuel). Puis `git add audio/`, `git commit`, `git push` comme
d'habitude — **en pensant à ne jamais supprimer le dossier `audio/`
existant avant de redéposer**, voir `HEBERGEMENT.md`.

`CACHE_NAME` incrémenté (`reparole-v6-163` → `reparole-v6-164`).

## v6.165 — Audit complet demandé : deux trous trouvés, hors des zones déjà vérifiées

Demandé explicitement : "fait un audite complet sans rien oublié au
passage, traduction, traduction.... tout le reste."

**Zones vérifiées, toutes propres** : interface (549 clés × 14
langues, 100%), explications du compagnon Ami pour l'acalculie (9
langues × 5 exercices, 100% suite au correctif v6.164), messages du
compagnon (toutes catégories × 14 langues), bilan initial
(ASSESS_STRINGS, 36 clés × 4 langues partielles, 100%), contenu des
15 exercices à choix multiple (complet ou proprement masqué partout,
aucun mélange détecté), 734 tests existants toujours au vert.

**Méthode pour trouver les trous restants** : recherche systématique
de tout mécanisme `window['XXX_'+lang]` dans le code — le même genre
de repli dynamique par langue qui avait déjà causé plusieurs bugs
similaires (acalculie, prénom d'exemple). Deux trous trouvés, dans
une zone jamais auditée jusqu'ici : la conversation guidée.

**1. `extract-voice-content.js` ignorait la conversation guidée** —
le bouton "réécouter" de chaque étape (`speak(step.ai)`,
`js/conversation.js`) n'a jamais été dans la liste d'extraction,
exactement le même trou que l'acalculie avant sa correction (v6.164),
jamais repéré parce que personne n'avait vérifié ce mécanisme précis.
Corrigé : le script parcourt maintenant aussi `CONV_SCENARIOS` pour
chaque langue. Manifeste : 2864 → **2984 textes** (+120, la
conversation dans les 10 langues).

**2. `CONV_SCENARIOS_JA` n'existait pas du tout** — le japonais était
la seule des 9 langues complètes sans scénarios de conversation,
repliant silencieusement... enfin, presque silencieusement : un
bandeau d'avertissement (`conversation_untranslated_note`) existait
déjà et s'affichait correctement pour ce cas précis, donc pas un
mélange totalement invisible comme les bugs précédents, mais un vrai
manque de contenu pour une langue censée être complète. Comblé : 3
scénarios (médecin, café, appel téléphonique), 4 étapes chacun, même
structure que les 8 autres langues complètes.

**⚠️ Brouillon de ma part** pour le contenu japonais — même statut
que le reste du contenu multilingue de ReParole, à faire vérifier par
un∙e locuteur∙rice natif∙ve avant tout usage clinique réel.

`tests/conversation-audit-fixes.test.js` (nouveau, 5 tests) :
verrouille les deux correctifs.

**⚠️ Voix cloud à régénérer** (+120 nouveaux textes, la conversation) :
```bash
node scripts/extract-voice-content.js
GOOGLE_TTS_API_KEY=votre_clé node scripts/generate-voice-audio.js
```
Puis `git add audio/`, `git commit`, `git push` comme d'habitude —
en gardant bien `audio/` intact lors de la mise à jour du code (voir
`HEBERGEMENT.md`).

`CACHE_NAME` incrémenté (`reparole-v6-164` → `reparole-v6-165`).

## v6.166 — "level_[object Object]" dans l'espace aidant

Signalé par l'utilisateur, capture d'écran à l'appui, en réponse à une
question sur l'espace aidant : « Progrès par type d'exercice :
ex_levels_t : level_[object Object] · ex_attempts_t :
level_[object Object] » s'affichait au lieu d'un vrai récapitulatif
par exercice.

**Le vrai bug** : `save_patient_levels()` enregistre un objet combiné
`{levels:{...}, attempts:{...}}` dans la colonne `patients.levels`
(voir v6.132). Le code patient (`js/storage.js`, `getPatient()`) sait
déjà déballer cette structure (`row.levels.levels`) — mais
`get_caregiver_data()` (SQL) renvoyait `v_patient.levels` **brut**,
sans déballage, laissant échapper la structure combinée entière
jusqu'à l'affichage. `Object.entries()` itérait alors sur les clés
`levels` et `attempts` du conteneur au lieu des vrais types
d'exercice, d'où "ex_levels_t" et "ex_attempts_t" — des noms de
champs techniques, jamais censés être visibles.

**Corrigé** (`sql/schema.sql`) : `get_caregiver_data()` déballe
maintenant `v_patient.levels->'levels'`, exactement comme le fait
déjà le code patient.

`tests/sql-schema-sanity.test.js` : nouveau test verrouillant ce
déballage.

**⚠️ Nécessite de rejouer `sql/schema.sql`** dans Supabase (SQL
Editor) pour que ce correctif s'applique — sans risque, comme
d'habitude.

`CACHE_NAME` incrémenté (`reparole-v6-165` → `reparole-v6-166`).

## v6.167 — Nettoyage : SKILL_ReParole_v6.md refait à neuf

Demandé : "commence par faire du nettoyage dans la conversation et
garder vraiment l'essentiel." L'ancien `SKILL_ReParole_v6.md` (667
lignes) datait de v6.109 — largement périmé face aux ~60 versions
depuis (acalculie, voix cloud, 5ᵉ langue partielle, etc.).

Remplacé par une version courte (88 lignes) qui résume l'essentiel
actuel : les 4 piliers du produit et leur statut réel, les 14
langues, la tarification, ce qui reste avant la production, et les
pièges déjà rencontrés à ne pas refaire (dossier `audio/`,
régénération des voix, `FRENCH_ONLY_EXERCISE_TYPES`). Le détail
complet de chaque décision reste dans l'historique de ce README, pas
dupliqué dans les deux fichiers.

`CACHE_NAME` incrémenté (`reparole-v6-166` → `reparole-v6-167`).

## v6.168 — 3 ajouts à l'espace aidant : mots à revoir, activité 14 jours, langue actuelle

Demandé suite à un retour "je trouve l'espace aidant un peu vide" —
3 pistes proposées puis validées :

**1. Mots à revoir** (lecture seule) — les mots où le patient bute le
plus souvent en erreur récemment, réutilisant la même logique que le
tableau de bord patient (`error_events.target`). Complémentaire, pas
un doublon, de la fonction d'ajout de mot déjà existante.

**2. Frise d'activité sur 14 jours calendaires** — un point plein par
jour avec au moins une séance, sur une vraie fenêtre de 14 jours (pas
les "14 dernières séances", qui peuvent toutes tomber sur 2-3 jours
si le patient est très actif).

**3. Badge de langue de travail actuelle** — n'apparaît que si le
patient ne travaille pas en français. A demandé un vrai ajout
d'infrastructure : la langue active (`Prefs.data.lang`) n'était
**jamais enregistrée nulle part côté serveur** avant cette version —
purement un réglage local au navigateur du patient. Nouvelle colonne
`sessions.lang`, `log_session()` étendue d'un 6ᵉ paramètre.

**Fonctionne en mode cloud (Supabase) et en mode local** —
`get_caregiver_data()` (SQL) et le repli localStorage
(`js/storage.js`) enrichis en parallèle, pas juste l'un des deux.

**Traductions** : les 5 nouvelles clés d'interface couvrent les 14
langues, comme le reste de l'espace aidant.

`tests/caregiver-enrichments.test.js` (nouveau, 9 tests) : structure
SQL, transmission de la langue, rendu des 3 sections, parité des
traductions.

**⚠️ Nécessite de rejouer `sql/schema.sql`** dans Supabase (SQL
Editor) — nouvelle colonne et fonctions mises à jour, sans risque
comme d'habitude. Les séances déjà enregistrées avant cette version
n'ont pas de langue connue (traité comme français par défaut) — pas
de perte de données, juste une information manquante pour l'historique
ancien.

`CACHE_NAME` incrémenté (`reparole-v6-167` → `reparole-v6-168`).

## v6.169 — 4 ajouts à l'accueil orthophoniste + correctif SQL de déploiement

Même retour que pour l'espace aidant, cette fois sur le tableau de bord
orthophoniste : « il fait un peu vide », surtout avec zéro patient (une
pile de cartes de réglage, une liste réduite à une ligne). La vue d'un
patient une fois ouvert était déjà riche — c'est l'**accueil** (la
liste) qui était pauvre. 4 points, validés puis livrés :

**1. Vue d'ensemble** — une carte de synthèse en tête : patients suivis,
à recontacter (> 7 j sans séance), actifs cette semaine, et réussite
moyenne. La réussite moyenne est un **agrégat** `sum(correct)/sum(total)`
(plus juste qu'une moyenne de moyennes). Entièrement calculée à partir
des données déjà renvoyées par `listPatients` — **aucun appel serveur
supplémentaire**. Masquée tant qu'aucun patient n'est rattaché.

**2. État vide accueillant** — à zéro patient, la liste ne montre plus
une seule ligne mais rappelle les deux façons d'ajouter un patient, avec
deux boutons qui amènent directement au bon champ (rattacher / créer).

**3. Mini-frise d'activité 14 jours par patient** — sur chaque ligne,
un point plein par jour avec au moins une séance, exactement la même
logique que la frise de l'espace aidant (v6.168). A demandé une nouvelle
fonction SQL `get_ortho_activity()` qui renvoie l'activité de tous les
patients rattachés en **un seul appel**. **Sécurité** : l'identité est
dérivée de `auth.uid()` **dans** la fonction, jamais d'un paramètre —
un orthophoniste ne peut donc jamais lire l'activité des patients d'un∙e
autre, même en falsifiant l'appel.

**4. Réorganisation (patients en tête)** — la 2FA et l'offre Pro,
peu consultées au quotidien, sont repliées dans un `<details>`
« Réglages du compte » ; les patients passent devant. Le panneau
s'ouvre automatiquement tant que la 2FA n'est pas activée, pour ne pas
masquer cette recommandation de sécurité.

**Correctif SQL de déploiement (important).** `get_history()` renvoie
`setof sessions` — un type ligne figé à la création. La colonne
`sessions.lang` ajoutée en v6.168 rendait donc `sql/schema.sql`
**non rejouable sur une base existante** (`ERROR 42P13`), et comme
`get_caregiver_data()` (l'espace aidant de v6.168) est déclarée *après*
`get_history`, **tout le bloc suivant ne se déployait pas**. Corrigé par
un `drop function` explicite, comme pour `get_patient`. Même précaution
ajoutée pour l'ancienne surcharge à 5 paramètres de `log_session`. Et un
nouveau test généralisant la règle a trouvé **un 3ᵉ cas latent**
(`get_patient_visible_notes`, `setof notes`) — corrigé au passage.

**Traductions** : les 8 nouvelles clés couvrent les 10 langues complètes.
Brouillons darija (dz/ma/tn). **Kabyle laissé en repli français** pour
ces 8 clés — pas de tournures inventées dont je ne suis pas sûr (garde-
fou n°8) ; à compléter avec une relecture kabyle.

`tests/ortho-dashboard-enrichments.test.js` (nouveau, 16 tests) : SQL,
i18n, structure réorganisée, calcul de la synthèse, frise, état vide.
`tests/sql-schema-sanity.test.js` étendu d'un test qui **verrouille la
classe de bug** (toute fonction `returns setof <table>` sur une table
modifiée par `ALTER … ADD COLUMN` doit être précédée d'un `DROP`).

**⚠️ Nécessite de rejouer `sql/schema.sql`** dans Supabase — et cette
fois, c'est ce qui débloque enfin le déploiement complet de la v6.168.
L'espace ortho ne fonctionne qu'en mode cloud : la vue d'ensemble et les
frises n'apparaissent qu'avec des patients rattachés et des données.

`CACHE_NAME` incrémenté (`reparole-v6-168` → `reparole-v6-169`).

## v6.170 — l'ambiance de l'accueil étendue à l'espace orthophoniste (+ bug placeholder email)

Retour utilisateur (captures) : les écrans orthophonistes avaient un fond
plat — noir en mode sombre, clair sinon — jugé « vide » et peu accueillant,
la connexion « montait et descendait » au lieu de tenir dans l'écran, et le
tableau de bord empilait ses cartes en une seule colonne, gâchant l'espace
sur un ordinateur. Le parti pris : **ne rien réinventer**. L'ambiance
souhaitée (dégradé teal + lignes qui serpentent) et la mise en page large
existaient déjà, mais uniquement câblées sur les écrans patients (`#login`,
`#dashboard`). On réutilise ces briques déjà éprouvées, à l'identique, sur
les écrans ortho — une seule identité visuelle dans toute l'app, risque
minimal.

**1. Connexion ortho habillée comme l'accueil.** `#ortho-login` reçoit le
même dégradé teal et le même décor de fond (SVG de lignes et de nœuds) que
la connexion patient. Fini le fond plat.

**2. Tableau de bord ortho : décor + pleine largeur sur ordinateur.**
`#ortho-list` reçoit le décor clair discret déjà utilisé sur le tableau de
bord patient (pour combler les côtés). Et au-delà de 900 px, la liste des
patients et les cartes d'ajout se répartissent sur 2 colonnes (même
mécanisme `.dashboard-grid` que côté patient) au lieu de s'empiler ; en
dessous (téléphones, tablettes étroites), rien ne change, une seule colonne
comme avant. La salutation et la vue d'ensemble restent pleine largeur
au-dessus ; les réglages du compte et la boîte à idées restent pleine
largeur en dessous, volontairement hors de la grille (ce sont des blocs
repliés `<details>`, qui se comportent mal dans des colonnes CSS).

**3. Écrans de connexion centrés verticalement.** `#login` et `#ortho-login`
centrent désormais leur carte dans la hauteur de l'écran (`min-height` +
flex-column + centrage). Quand le contenu tient, il est centré ; s'il dépasse
(petits écrans, la connexion patient est très fournie avec ses réglages
d'accessibilité), la page défile normalement, sans que le haut soit rogné.

**4. Bug corrigé — placeholder du champ « Email professionnel ».** Le champ
affichait `ortho_email_placeholder` en toutes lettres : l'attribut
`data-i18n-placeholder` pointait vers une clé absente de `js/i18n.js`, donc
le système d'i18n renvoyait le nom brut de la clé. La clé est ajoutée dans
les 14 langues avec un exemple d'email réaliste.

Changements **visuels/CSS** : le rendu ne peut pas être vérifié
automatiquement ici, donc à contrôler à l'œil (facile à ajuster ensuite).
Le décor du tableau de bord ortho est aligné sur celui du patient ; si tu
veux aller plus loin (dégradé aussi derrière les cartes), c'est faisable.
L'espace ortho ne s'affiche complètement qu'en mode cloud.

Nouveau fichier de test `tests/ortho-accueil-style.test.js` (contrôles
structurels : décor présent sur les deux écrans ortho, grille 2 colonnes,
placeholder email traduit, règles CSS de dégradé et de centrage).

`CACHE_NAME` incrémenté (`reparole-v6-169` → `reparole-v6-170`).

## v6.171 — correctif d'affichage + connexion patient qui tient dans l'écran + espace aidant habillé

Trois corrections après retour utilisateur (captures), dont une régression
introduite par la v6.170.

**1. Correctif — l'écran de connexion s'empilait par-dessus le tableau de
bord.** La v6.170 centrait les connexions avec `#login{display:flex}`. Un
sélecteur d'ID l'emporte sur `.screen{display:none}` (un sélecteur de
classe) : conséquence, l'écran de connexion ne se cachait plus jamais et
restait affiché au-dessus du tableau de bord une fois connecté (visible côté
ortho sur la capture). Le centrage est déplacé sur `.wrap`, qui est à
l'intérieur de l'écran et donc masqué avec lui — le problème ne peut plus se
reproduire. Un test verrouille la règle : aucune déclaration `display:` ne
doit viser directement l'ID d'un écran.

**2. La connexion patient tient maintenant dans l'écran sur ordinateur.**
Elle est très fournie (intro, formulaire, 8 réglages d'accessibilité, liens)
et débordait en hauteur. Au-delà de 900 px, son corps passe en **2 colonnes**
(formulaire à gauche, options d'accessibilité et liens à droite) sous un
en-tête pleine largeur — la carte tient alors dans la hauteur de l'écran. Sur
téléphone, rien ne change : une seule colonne, dans le même ordre qu'avant.
Les connexions ortho et aidant, bien plus courtes, restent en une colonne
centrée.

**3. Espace aidant habillé comme les autres (oublié en v6.170).** La
connexion aidant reçoit le dégradé teal + le décor de l'accueil ; le tableau
de bord aidant reçoit le décor clair et, sur grand écran, ses 4 cartes se
répartissent sur 2 colonnes (le rappel de non-substitution reste pleine
largeur en haut, la mention « lecture seule » en bas). L'espace aidant est
désormais cohérent avec l'accueil patient et l'espace orthophoniste.

Changements **visuels/CSS** : rendu à contrôler à l'œil (impossible à
vérifier automatiquement ici). Nouveau fichier `tests/login-layout.test.js`
(garde-fou anti-régression d'affichage + connexion patient 2 colonnes +
habillage aidant).

`CACHE_NAME` incrémenté (`reparole-v6-170` → `reparole-v6-171`).

## v6.172 — vérification complète des traductions + outillage sécurité/ops de l'audit

**1. Vérification exhaustive des traductions (demandée avant tout).**
Résultat : **zéro erreur**. Parité parfaite (563 clés × 14 langues, aucune
manquante, aucune en trop) ; les 40 clés-fonctions (messages paramétrés) ont
la même signature partout et s'exécutent toutes sans erreur ; aucune valeur
vide ni clé brute ; toutes les clés référencées dans les 15 pages HTML et le
JS existent (les familles dynamiques `level_*`, `ex_*_t`, `cg_tip_*`,
`tag_*`, `ortho_clinical_*` sont complètes) ; les rares valeurs identiques au
français dans d'autres langues sont des vrais cognats (« Normal », « Date »,
« Miel » en espagnol, « Papier » en allemand), pas des fuites. Les 10
fichiers de tests i18n existants passent tous.

**2. `scripts/build-deploy-zip.sh` — le déploiement ne peut plus écraser les
voix.** Jusqu'ici, l'exclusion du dossier `audio/` de l'hébergeur reposait
sur la discipline (HEBERGEMENT.md). Le script la rend automatique : il lance
la suite de tests (refus si rouge), construit le ZIP de production en
excluant `audio/`, `tests/`, `docs/`, `scripts/`, la CI et `node_modules`,
puis **vérifie son propre résultat** (audio/ absent, fichiers clés présents)
et s'auto-détruit en cas d'anomalie. Le nom de sortie reprend la version du
`sw.js` (source de vérité). Au passage, correction d'un piège shell réel
rencontré pendant l'écriture : `grep -q` branché sur le pipe d'`unzip` avec
`set -o pipefail` provoque des faux « fichier manquant » (SIGPIPE) — la
liste est maintenant capturée une fois puis analysée.

**3. `.github/workflows/ci.yml` — CI GitHub Actions.** La suite complète
(86 fichiers) tourne à chaque push et pull request. Une régression comme
celle d'affichage de la v6.170 serait désormais détectée automatiquement.

**4. `sql/durcissement-securite.sql` — à relire avant d'appliquer.** Les deux
durcissements issus de l'audit, volontairement hors de `schema.sql` tant
qu'ils ne sont pas validés : le code aidant généré par `gen_random_bytes`
(CSPRNG) au lieu de `md5(random())` (prédictible), et une garde
anti-force-brute `_rate_guard()` (40 appels / 10 min / IP) à brancher en tête
des fonctions accessibles avec la clé anon. Le fichier documente honnêtement
ses limites (IP partagée en cabinet → seuil large ; attaque distribuée →
c'est l'entropie du code qui protège) et l'ordre d'application conseillé.

Nouveau fichier de test `tests/deploy-tooling.test.js` (9 tests) qui
verrouille les invariants : `audio/` toujours exclu, tests obligatoires avant
déploiement, auto-vérification du ZIP, CI branchée sur `npm test`, SQL
rejouable et sans `random()`.

`CACHE_NAME` incrémenté (`reparole-v6-171` → `reparole-v6-172`).

## v6.173 — mots ciblés par l'orthophoniste (14 langues)

L'aidant pouvait proposer des mots à travailler, **pas l'orthophoniste** —
un manque presque incohérent : c'est pourtant l'ortho qui sait quels mots
travailler en priorité. Comblé, en réutilisant le mécanisme éprouvé des
mots de l'aidant plutôt qu'en dupliquant un pipeline.

**1. Fiche patient : nouvelle carte « Mots ciblés ».** L'ortho saisit un
mot (+ emoji facultatif) ; il est **ajouté directement aux exercices de
dénomination du patient**, exactement comme un mot proposé par l'aidant.
La carte liste tous les mots du patient : ceux de l'ortho et ceux de
l'aidant (marqués d'un badge « aidant »), chacun avec un bouton de
retrait — l'ortho peut retirer n'importe quel mot, y compris ceux de
l'aidant (autorité clinicienne sur le contenu des exercices, principe de
conception du projet).

**2. Côté aidant : badge « ciblé par l'orthophoniste ».** L'aidant voit
désormais dans sa liste les mots que le/la professionnel·le travaille en
priorité — de quoi s'en inspirer au quotidien, sans rien lui demander de
plus.

**3. Côté patient : zéro changement.** Les mots arrivent par le même
canal (`get_caregiver_words`) et s'intègrent aux mêmes exercices. Les
mots étant du contenu dynamique lu par la synthèse vocale du navigateur
(comme les mots de l'aidant depuis toujours), **aucune régénération de
voix n'est nécessaire**.

**4. Sécurité (mêmes règles que le reste).** Table `caregiver_words` +
colonne `source` ('caregiver'/'ortho'). `add_ortho_word` et
`delete_target_word` dérivent l'identité de `auth.uid()` **dans** la
fonction (jamais d'un paramètre) et exigent le rattachement
(`patient_assignments`) : un ortho ne peut cibler/retirer que chez SES
patients. La colonne modifiant le rowtype, les deux fonctions
`returns setof caregiver_words` reçoivent leur `drop function` préalable
(classe de bug verrouillée depuis la v6.169 — le test de cohérence SQL
l'a validé). Le rendu utilise la délégation d'événements, pas d'`onclick`
interpolé (recommandation de l'audit v6.171).

**Traductions :** 10 clés × 14 langues, parité 100 % vérifiée. Kabyle
ancré sur le vocabulaire déjà présent dans l'app (« ameslay n tutlayt »
pour orthophoniste, « amɛiwen » pour aidant, « isemdanen » pour
exercices) — vrai kabyle, sans relecture native.

⚠ **Rejouer `sql/schema.sql`** dans Supabase pour activer la colonne
`source` et les deux nouvelles fonctions.

Nouveau fichier `tests/ortho-target-words.test.js` (11 tests).

`CACHE_NAME` incrémenté (`reparole-v6-172` → `reparole-v6-173`).

## v6.174 — boucle vocale asynchrone : le patient enregistre, l'orthophoniste écoute et tranche

Le différenciant face aux concurrents (HappyNeuron Pro et consorts) : tous
remontent des **scores** ; l'orthophonie, c'est de l'**audio**, et les
orthos se méfient à juste titre des scores automatiques. ReParole devient
le seul outil où le cabinet s'étend entre les séances autour de la **voix
réelle** du patient.

**1. Côté patient — carte « 🎙 Ma voix pour mon orthophoniste ».** Sur ses
mots ciblés (v6.173), le patient s'enregistre (MediaRecorder, 6 s max — un
mot, pas un discours) et envoie. Le verdict de l'ortho revient s'afficher
sur chaque mot (« ✅ Acquis » / « 🔁 À retravailler ») : c'est son retour
pédagogique. La carte n'apparaît qu'en mode cloud ET s'il existe des mots
ciblés — un écran vide n'aide personne.

**2. Côté orthophoniste — « Enregistrements reçus »** dans la carte Mots
ciblés : les productions réelles, avec lecteur audio et deux boutons de
verdict. **Le jugement humain fait foi, pas un score automatique** — dans
la droite ligne du principe « l'ortho reste décisionnaire ».

**3. Vie privée (données de santé sensibles), verrouillée par les tests :**
consentement explicite, **faux par défaut**, vérifié **côté SQL** (l'UI ne
suffit pas) ; révocation = suppression **immédiate** de tout (métadonnées
+ fichiers du bucket) ; **rétention 30 jours** filtrée aux deux lectures +
fonction de purge (`purge_old_voice_recordings`, appelée opportunément à
l'ouverture d'une fiche, planifiable via pg_cron) ; accès ortho gaté par
`auth.uid()` + rattachement ; fichiers sous `<code>/voice/` dans le bucket
`patient-media` existant — donc **déjà couverts** par la purge de
suppression de compte. Aucun nouveau bucket à configurer.

**Traductions :** 14 clés × 14 langues, parité 100 %. Kabyle ancré sur le
vocabulaire de l'app (taɣect = voix, ameslay n tutlayt = orthophoniste).
Contenu dynamique : **aucune régénération de voix TTS nécessaire**.

⚠ **Rejouer `sql/schema.sql`** dans Supabase (colonne `voice_consent`,
table `voice_recordings`, 6 fonctions). À tester à l'œil : patient → cocher
le consentement → enregistrer un mot ciblé → côté ortho, écouter et
trancher → le verdict apparaît chez le patient. Vérifier aussi la
révocation (décocher = liste vidée).

Nouveau fichier `tests/voice-loop.test.js` (11 tests, dont toutes les
garanties de vie privée). `tests/dashboard-grid` passe à 12 cartes.

`CACHE_NAME` incrémenté (`reparole-v6-173` → `reparole-v6-174`).

## v6.175 — première brique IA : brouillon de compte-rendu (Pro), avec garde-fous stricts

L'IA entre dans ReParole par la porte la plus sûre et la plus utile : la
**rédaction assistée des comptes-rendus**, corvée notoire des orthos (et
rattrapage concurrentiel : HappyNeuron a son aide à la rédaction). Pas
d'IA face au patient, pas de score automatique — l'IA **met en forme**
des données existantes, l'humain relit et signe.

**1. Le socle : edge function `generate-report-draft`**
(`js/ia-edge-function.md`, déployable tel quel, même format que Stripe).
Garanties, toutes verrouillées par les tests : la **clé API n'est jamais
côté client** (secrets Supabase) ; authentification par **jeton de
session** + re-vérification du **rattachement** ; **anonymisation
totale** — ni nom ni code patient ne partent vers l'IA, uniquement des
agrégats (« le patient », séances, tendance, catégories d'erreurs, mots
ciblés, verdicts vocaux) ; le **prompt interdit tout diagnostic** et
impose la mention de relecture ; **plafond 20 brouillons/jour/ortho**
(table `ia_usage`) — coût borné à quelques centimes/jour. Fournisseur par
défaut : Claude (claude-haiku) ; **bascule Mistral documentée** (2 lignes)
si l'argument « hébergeur européen » compte pour la FNO / France AVC.

**2. Côté ortho : bouton « ✨ Brouillon de compte-rendu (IA) »** dans la
carte Rapport. Le brouillon arrive dans une **zone éditable** avec
l'avertissement permanent : généré depuis des données anonymisées, à
relire et corriger, **vous restez signataire, l'IA ne pose aucun
diagnostic**. Bouton Copier. Réservé au plan **Pro** (les appels ont un
coût réel — contrôle AVANT tout appel). Si la fonction n'est pas encore
déployée, message clair au lieu d'une erreur brute.

**3. Ce que l'IA ne fera pas** (décisions assumées) : pas d'analyse
automatique des enregistrements vocaux (le verdict humain est LE
différenciant de la v6.174), pas d'IA en conversation directe avec le
patient sans validation d'un∙e ortho, pas de génération de contenu
d'exercice sans passage par la validation admin.

**Traductions :** 9 clés × 14 langues, parité 100 %, kabyle réel.

⚠ **Pour activer** : rejouer `sql/schema.sql` (table `ia_usage`), créer
la clé API (console Anthropic ou Mistral), l'ajouter aux secrets
Supabase, déployer la fonction — guide pas à pas dans
`js/ia-edge-function.md`. Sans déploiement, le bouton affiche simplement
« fonction non déployée ». Penser à la mention « sous-traitant IA » dans
la politique de confidentialité (formulation proposée dans le guide, à
faire relire par un juriste).

Nouveau fichier `tests/ai-report-draft.test.js` (10 tests).

`CACHE_NAME` incrémenté (`reparole-v6-174` → `reparole-v6-175`).

## v6.176 — connexion patient sur ordinateur : colonne de droite structurée + carte compacte

Retour utilisateur (captures, mode sombre) : la mise en 2 colonnes de la
v6.171 était « moche » — la colonne de droite n'était qu'un nuage de
pastilles flottantes au-dessus d'un grand vide, avec des liens qui se
coupaient mal (flèche orpheline en fin de ligne) — et la carte débordait
encore de l'écran.

**1. La colonne de droite devient un vrai parcours.** Les préférences
d'accessibilité sont regroupées dans un **panneau titré « Votre confort »**
(fond, bordure, pastilles alignées), cohérent avec les cartes du reste de
l'app — le groupement s'applique aussi sur téléphone, où il aide autant.
Sous le panneau : « Première visite ? » + « Créer un nouveau dossier » +
la note de sauvegarde, puis les liens vers les espaces pro et aidant
(classe `login-space-link` : plus de coupure moche). Les deux colonnes
s'équilibrent enfin — formulaire à gauche, découverte à droite.

**2. Carte compacte sur grand écran** pour tenir dans la hauteur : les
**espacements** sont resserrés (padding de carte, marges du titre et du
sélecteur de langue) **sans toucher aux tailles de police** — lisibilité
d'abord, public post-AVC. Le téléphone garde ses espacements d'origine.

Nouvelle clé `login_comfort_title` (14 langues). Tests de mise en page
étendus (`tests/login-layout.test.js`, 10 tests).

Note : la **bannière bêta** en haut consomme aussi de la hauteur — une
fois fermée (croix à droite), la carte se centre dans l'écran. Rendu
visuel à contrôler à l'œil comme toujours.

`CACHE_NAME` incrémenté (`reparole-v6-175` → `reparole-v6-176`).

## v6.177 — passe systématique : décor sur TOUS les écrans, admin réparé, fiche ortho large, choix alignés

Retour utilisateur (5 captures) : « les fonds d'écran sont même pas
appliqués », « on ne prend pas tout l'espace », « le marteau va avec quoi
sérieusement ? », admin en panne (« NetworkError »), et le reproche de
fond, exact : « c'est pas fait à fond ». Le décor était posé écran par
écran, au fil des retours — 12 écrans sur 18 avaient été oubliés. Cette
version corrige la méthode, pas seulement les symptômes.

**1. Décor sur les 18 écrans, verrouillé par un test qui les énumère.**
Tous les écrans de toutes les pages (patient : assessment, exercise,
conversation, memory, phonation, pricing ; ortho : mfa, pricing,
**detail** ; admin : login, mfa, dashboard) reçoivent le décor —
dégradé teal sur les connexions et défis MFA, décor clair sur les écrans
de contenu. `tests/screens-completeness.test.js` énumère lui-même les
`.screen` de toutes les pages : un écran ajouté demain sans décor fera
échouer la suite. Plus jamais « au fil des retours ».

**2. Admin réparé — cause racine du « NetworkError ».** Le SDK Supabase
était chargé depuis un CDN (jsdelivr) ; bloqué (bloqueur de pub, réseau
d'entreprise), tout l'espace admin — qui n'a pas de repli local — tombait
en erreur brute. Le SDK est désormais **auto-hébergé** (`js/vendor/
supabase-2.108.2.js`) : plus de dépendance CDN du tout (et ça règle le
point « SRI manquant » de l'audit v6.171 par la racine). En cas d'échec
réseau restant (ex. projet Supabase en pause), le message est désormais
**actionnable** au lieu de « NetworkError » brut.

**3. Fiche patient ortho : pleine largeur + 2 colonnes.** `#ortho-detail`
passe à 1400 px et ses cartes se répartissent en 2 colonnes sur grand
écran (même mécanisme éprouvé), une colonne sur téléphone.

**4. Exercices : les choix s'alignent sur grand écran.** `#exercise`
passe à 960 px et les réponses se rangent en grille (2 colonnes dès que
la place le permet, `minmax(240px,1fr)`) au lieu de s'empiler — l'écran
suffit à nouveau. Téléphone inchangé : une colonne.

**5. Contenu : fini le marteau qui « va avec » le bois.** L'association
faible est remplacée par 🪚 scie → 🪵 bois (lien d'usage évident), avec
retouches équivalentes dans les langues concernées.

⚠ **VOIX À RÉGÉNÉRER** : du contenu parlé a changé (nouveaux mots type
« scie ») dans plusieurs langues. Dans l'ordre, comme d'habitude :
`node scripts/extract-voice-content.js` puis le script de génération avec
la clé API (GitHub Codespaces). Sans ça, les nouveaux mots retomberont
sur la synthèse du navigateur.

`CACHE_NAME` incrémenté (`reparole-v6-176` → `reparole-v6-177`).

## Tester

```
python3 -m http.server 8000
```
Ouvrez Chrome sur `http://localhost:8000`. Pour tester l'auth réelle,
configurez d'abord le mode cloud (voir plus haut) — sans lui, l'app
tourne en mode navigateur (localStorage), sans compte ni RLS puisqu'il
n'y a pas de serveur à protéger.

Pour lancer les tests automatisés (moteur adaptatif + traductions +
mode hors-ligne + gratuit/pro + MFA + paiement + Ami) : `npm install && npm test`.
