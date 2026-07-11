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
