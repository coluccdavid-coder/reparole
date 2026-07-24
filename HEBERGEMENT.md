# Héberger ReParole gratuitement — guide pas à pas

Ce projet est un site « statique » (HTML/CSS/JS), donc il s'héberge très
facilement et gratuitement. Voici les meilleures options en 2026, de la plus
simple à la plus complète.

⚠️ Important : un hébergement gratuit convient pour **tester et faire une
démo**. Pour un usage avec de vrais patients, il faudra un hébergement
**certifié HDS** (données de santé) et la conformité RGPD — voir le README
principal.

## ⚠️ À NE JAMAIS FAIRE : remplacer tout le dossier en une fois si les voix cloud sont activées

Signalé par l'utilisateur (v6.162) : l'habitude de « tout supprimer puis
remettre le zip complet » à chaque mise à jour est **dangereuse une fois les
voix cloud générées** (voir `scripts/SETUP-VOIX-CLOUD.md`). Le dossier
`audio/` (jusqu'à ~1 400 fichiers .mp3) n'existe **que sur votre dépôt** —
aucun zip livré ne le contient jamais, il ne peut pas être régénéré par un
zip qui suivrait. Le supprimer par erreur veut dire refaire payer/attendre
toute la génération.

**La bonne méthode, à chaque mise à jour, si `audio/` existe déjà** :
1. Supprimez tout **sauf les dossiers `audio/` ET `img/`**
2. Remettez le contenu du nouveau zip par-dessus
3. `audio/` reste intact, tout le reste (code, contenu) se met à jour

En cas de doute avant une manipulation risquée : copiez d'abord `audio/`
quelque part en sécurité (votre ordinateur, par exemple) — ça permet de le
remettre en place même après une erreur.

---

## Option 1 — Netlify Drop (le plus simple, sans compte technique)

C'est la méthode la plus rapide : on dépose le dossier, le site est en ligne.

1. Allez sur **https://app.netlify.com/drop**
2. Glissez-déposez le **dossier `reparole-v6` entier** dans la zone indiquée.
   (Pas le fichier zip : le dossier décompressé.)
3. Attendez quelques secondes : Netlify vous donne une adresse du type
   `https://nom-aleatoire.netlify.app`. Votre site est en ligne. 🎉
4. Partagez ce lien : il fonctionne sur téléphone et ordinateur, et le
   **micro marchera** (Netlify sert le site en HTTPS, requis pour la voix).

Pour mettre à jour le site plus tard, il suffit de redéposer le dossier.
Créer un compte gratuit (facultatif) permet de garder la même adresse.

⚠️ **Si les voix cloud sont activées** : voir l'avertissement tout en haut
de ce document avant de redéposer — ne redéposez pas un dossier qui
n'inclurait pas votre `audio/` à jour.

---

## Option 2 — Cloudflare Pages (bande passante illimitée)

Très bon aussi, et la bande passante est illimitée sur le plan gratuit.
Le plus simple passe par un compte gratuit :

1. Créez un compte sur **https://pages.cloudflare.com**
2. « Create a project » → « Direct Upload » (téléversement direct).
3. Téléversez le contenu du dossier `reparole-v6`.
4. Vous obtenez une adresse `https://votre-projet.pages.dev`.

---

## Option 3 — GitHub Pages (si vous utilisez déjà Git)

Pratique si vous voulez versionner le code.

1. Créez un dépôt sur **https://github.com** et envoyez-y le contenu de
   `reparole-v6` (le fichier `index.html` doit être à la racine du dépôt).
2. Dans le dépôt : **Settings → Pages**.
3. Sous « Branch », choisissez `main` puis `/ (root)`, et **Save**.
4. Au bout d'une minute, votre site est sur
   `https://votre-pseudo.github.io/nom-du-depot/`.

---

## Tester en local sur votre ordinateur (sans rien mettre en ligne)

Si vous voulez juste essayer chez vous, le site a besoin d'un petit serveur
local (les fichiers séparés et le micro ne marchent pas en double-clic
direct). Depuis le dossier `reparole-v6`, ouvrez un terminal et lancez :

```
python3 -m http.server 8000
```

Puis ouvrez **Chrome** sur `http://localhost:8000`.
(Sur Windows sans Python : installez l'extension « Live Server » dans
l'éditeur VS Code, puis clic droit sur `index.html` → « Open with Live
Server ».)

---

## Quelle option choisir ?

- Juste montrer la démo à quelqu'un, tout de suite → **Netlify Drop** (option 1).
- Garder une adresse stable et des mises à jour faciles → **Cloudflare Pages**
  ou **Netlify avec compte**.
- Vous codez et versionnez → **GitHub Pages**.

Toutes ces options sont gratuites et donnent une adresse en HTTPS, ce qui est
nécessaire pour que la reconnaissance vocale (le micro) fonctionne.

---

## Et le mode cloud (sauvegarde des dossiers) ?

Par défaut, le site sauvegarde dans le navigateur (parfait pour tester).
Pour une vraie sauvegarde partagée entre appareils, suivez la section
« Passer au cloud (Supabase) » du README principal : il suffit de coller
2 clés dans `js/storage.js`. Cela fonctionne avec n'importe lequel des
hébergements ci-dessus.

---

## Hébergement certifié HDS — obligatoire avant tout patient réel

En France, toute donnée de santé identifiante (ce que produit ReParole dès
qu'un vrai patient l'utilise) doit être hébergée chez un hébergeur
**certifié HDS** (Hébergeur de Données de Santé, certification prévue par
le Code de la santé publique, art. L1111-8). Ce n'est pas une option.

Ce que je ne peux pas faire à votre place : choisir et souscrire un
hébergement HDS est une démarche contractuelle et organisationnelle, pas
une tâche de code. Voici néanmoins des pistes concrètes à vérifier :

- **Le site statique (Netlify/Cloudflare/GitHub Pages)** ne pose pas de
  problème HDS en lui-même : il ne contient aucune donnée de santé, juste
  du code. Le sujet HDS concerne uniquement la **base de données**
  (Supabase ou équivalent) où sont stockées les données patient.
- **Supabase standard** : à ma connaissance, Supabase (hébergé par défaut
  sur AWS) n'est pas certifié HDS. **Vérifiez ce point directement auprès
  de Supabase** avant toute décision — les certifications évoluent, et je
  ne peux pas garantir l'information à la date où vous lisez ceci.
- **Alternatives françaises/européennes à étudier**, certifiées ou
  proposant des offres de santé : OVHcloud (offre santé dédiée),
  Scaleway, Cleyrop, Clever Cloud, ou un hébergeur PostgreSQL managé chez
  un prestataire HDS. Le plus simple techniquement serait de retrouver un
  hébergeur PostgreSQL compatible avec la logique déjà écrite dans
  `sql/schema.sql` (tables + RLS), quitte à remplacer le SDK Supabase par
  des appels HTTP vers PostgREST auto-hébergé, ou un léger backend.
- **Solution hybride envisageable** : garder Supabase pour le
  développement/tests, et ne migrer vers un hébergeur HDS qu'au moment de
  passer à de vrais patients — le schéma SQL (`sql/schema.sql`) est conçu
  pour rester portable vers du PostgreSQL standard.

Dans tous les cas, faites confirmer par l'hébergeur retenu qu'il est bien
titulaire d'une certification HDS **en cours de validité** pour l'activité
concernée (hébergement d'infrastructure et/ou plateforme, selon votre
architecture), et demandez le certificat.

## Mode hors-ligne / installation sur l'écran d'accueil (v6.23)

Depuis la v6.23, l'app peut :
- **s'installer** comme une icône sur l'écran d'accueil du téléphone
  (comme une vraie app, sans passer par un store) ;
- **fonctionner sans connexion internet** une fois visitée au moins une
  fois (utile en salle d'attente, en zone mal couverte).

### Comment tester

**Sur Android (Chrome)** : après avoir visité le site une fois, Chrome
propose normalement automatiquement "Ajouter à l'écran d'accueil" (ou
via le menu ⋮ → "Installer l'application"). Ensuite, activez le mode
avion et rouvrez l'app : elle doit continuer à fonctionner.

**Sur iPhone (Safari)** : Safari ne propose pas d'installation
automatique. Il faut : bouton Partager (le carré avec la flèche) →
"Sur l'écran d'accueil". C'est une limitation d'Apple, pas de l'app.

**Vérification technique (pour vous ou un développeur)** : Chrome →
outils de développement (F12) → onglet "Application" → "Service
Workers" doit montrer `sw.js` actif, et "Manifest" doit afficher les
informations de l'app sans erreur.

### Limites importantes à connaître

- **Mode navigateur (sans compte cloud)** : fonctionne entièrement
  hors-ligne après la première visite, exercices compris (les données
  restent dans le navigateur).
- **Mode cloud (compte Supabase)** : l'interface se charge même
  hors-ligne, mais se connecter ou sauvegarder une séance nécessite
  une connexion — ce n'est pas une vraie synchronisation différée pour
  l'instant (ça pourrait être une amélioration future si besoin).
- **Après chaque mise à jour de l'app** : le fichier `sw.js` a un
  numéro de version (`CACHE_NAME`) qui doit être incrémenté à chaque
  changement notable, sinon les téléphones continueront de servir
  l'ancienne version en cache. C'est déjà fait pour cette version-ci ;
  à ne pas oublier pour les prochaines.
- **Non testé sur un vrai appareil** au moment de cette livraison — je
  n'ai pas accès à un navigateur graphique dans mon environnement de
  travail (voir le journal des versions dans `SKILL_ReParole_v6.md`
  pour le détail de cette limite). Tout ce qui peut être vérifié sans
  navigateur (fichiers présents, JSON valide, syntaxe) l'a été — mais le
  comportement réel à l'installation reste à confirmer par vous.

## Nommer un·e administrateur·rice (validation des contributions, v6.38)

`admin.html` permet de valider les propositions de traduction/exercices
envoyées via `contribuer.html` (voir `sql/schema.sql`, tables `admins`
et `content_items`). Volontairement, **aucun compte n'a de droit
administrateur par défaut**, même après inscription — c'est vous qui
décidez qui a ce droit, à la main, directement dans Supabase :

1. La personne que vous voulez nommer doit d'abord avoir un compte
   Supabase Auth. Le plus simple : qu'elle tente de se connecter une
   fois sur `admin.html` avec un email + mot de passe de son choix —
   ça échouera ("droits administrateur" refusés), mais ça n'existe pas
   encore avant qu'un compte Supabase Auth soit créé quelque part. En
   pratique, utilisez plutôt Supabase > **Authentication** > **Users**
   > **Add user** (ou **Invite**) pour créer directement son compte
   avec l'email de votre choix.
2. Une fois le compte créé, notez son **User UID** (visible dans la
   liste des utilisateurs Supabase).
3. Allez dans Supabase > **Table Editor** > table **admins** > **Insert
   row**, et remplissez :
   - `code` = le User UID copié à l'étape 2
   - `name` = le nom de la personne (affiché dans `admin.html`)
   - `email` = son email (facultatif, pour vos propres notes)
4. C'est tout — elle peut désormais se connecter sur `admin.html` avec
   son email et son mot de passe.

Pour retirer un droit administrateur : supprimez simplement sa ligne
dans la table `admins` (son compte Supabase Auth continue d'exister,
mais n'a plus aucun privilège particulier).

## Mot de passe oublié (comptes admin et orthophoniste, v6.81)

Les liens "Mot de passe oublié ?" (`admin.html`, `dashboard-ortho.html`)
envoient la personne vers `reset-password.html` pour choisir un
nouveau mot de passe. Pour que Supabase accepte d'y rediriger, l'URL
complète de cette page doit être autorisée :

1. Supabase > **Authentication** > **URL Configuration**.
2. Dans **Redirect URLs**, ajoutez l'adresse complète de
   `reset-password.html` une fois votre site en ligne (ex.
   `https://votredomaine.fr/reset-password.html`).
3. Enregistrez.

Sans cette étape, Supabase refuse la redirection même si la page
existe déjà côté app.
