# Héberger ReParole gratuitement — guide pas à pas

Ce projet est un site « statique » (HTML/CSS/JS), donc il s'héberge très
facilement et gratuitement. Voici les meilleures options en 2026, de la plus
simple à la plus complète.

⚠️ Important : un hébergement gratuit convient pour **tester et faire une
démo**. Pour un usage avec de vrais patients, il faudra un hébergement
**certifié HDS** (données de santé) et la conformité RGPD — voir le README
principal.

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
