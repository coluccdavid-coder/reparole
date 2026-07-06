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

## Tester

```
python3 -m http.server 8000
```
Ouvrez Chrome sur `http://localhost:8000`. Pour tester l'auth réelle,
configurez d'abord le mode cloud (voir plus haut) — sans lui, l'app
tourne en mode navigateur (localStorage), sans compte ni RLS puisqu'il
n'y a pas de serveur à protéger.

Pour lancer les tests automatisés (moteur adaptatif + cohérence des
traductions + cohérence du mode hors-ligne) : `npm install && npm test`.

```
node tests/learner.test.js
```
