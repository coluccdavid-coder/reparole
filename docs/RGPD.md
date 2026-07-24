# 🛡️ RGPD — registre des traitements et droits des personnes (v6.249)

> **Document de travail, pas un avis juridique.** Rédigé à partir du code
> réel (chaque affirmation est vérifiable dans `sql/schema.sql` et
> `js/storage.js`) pour préparer la mise en production. Il DOIT être
> relu et validé par un professionnel (juriste ou DPO) avant l'accueil
> de vrais patients — comme l'hébergement doit être certifié HDS.
> Les lacunes connues sont listées en §6, sans enjolivement.

---

## 1. Responsable de traitement et contexte

- **Responsable** : David (éditeur de ReParole), à compléter avec les
  mentions légales définitives (`mentions-legales.html`).
- **Finalité générale** : proposer des exercices d'entraînement du
  langage aux personnes aphasiques, en complément (jamais en
  remplacement) des séances d'orthophonie, et donner aux orthophonistes
  et proches aidants une vue de l'activité — sans diagnostic ni
  interprétation clinique automatique (règle 6 du projet).
- **Deux modes de fonctionnement**, aux implications très différentes :
  - **Mode navigateur** (par défaut sans configuration cloud) : toutes
    les données restent dans le `localStorage` du navigateur de la
    personne. Aucune donnée ne quitte son appareil. Le RGPD s'applique
    a minima (pas de collecte côté serveur).
  - **Mode cloud** : les données sont stockées chez Supabase
    (projet `bwxlshedzpfaeszwktdx`, région **West EU — Irlande**, donc
    Union européenne), protégées par RLS + fonctions RPC (21 tables sur
    21 avec RLS, audit v6.245).

## 2. Registre des traitements (par catégorie de données)

Les patients sont identifiés par un **code pseudonyme** (généré par
l'app), jamais par nom/email — sauf les orthophonistes, qui ont un
compte email (Supabase Auth). Tableau fondé sur les 20 tables réelles
du schéma :

| Données | Table(s) | Finalité | Durée de conservation constatée |
|---|---|---|---|
| Fiche patient (code, prénom d'affichage, préférences, niveaux) | `patients` | fonctionnement de l'app | vie du compte ; **purge des inactifs à 30 jours** possible depuis l'admin (liste pseudonymisée, v6.235) |
| Historique d'exercices | `sessions` | suivi de progression | vie du compte |
| Erreurs détaillées | `error_events` | apprentissage adaptatif, bilan ortho | vie du compte |
| Journal personnel | `journal_entries` | fonctionnalité journal — **données potentiellement sensibles** (texte libre) | vie du compte |
| Enregistrements de voix | `voice_recordings` | exercices vocaux | **purge automatique à 30 jours** (`purge_old_voice_recordings()`, métadonnées + fichiers) |
| Connexions patient | `patient_connections` | statistiques d'usage — **code haché**, granularité au jour | purge admin 7/14/30 jours ; **supprimées avec le compte** (v6.250) |
| Événements de connexion | `login_events` | sécurité | purge admin 7/14/30 jours ; **supprimés avec le compte** (v6.250) |
| Mots de l'aidant, favoris, exercices personnalisés | `caregiver_words`, `favorite_words`, `custom_exercises` | personnalisation | vie du compte |
| Comptes orthophonistes (email) | `orthophonists` + Supabase Auth | authentification pro | vie du compte |
| Rattachements ortho↔patient, notes, bilans, médias | `patient_assignments`, `notes`, `reports`, `patient_media` | suivi clinique par l'ortho | vie du compte |
| Usage IA (compteurs) | `ia_usage` | plafond d'usage équitable | technique, non nominatif au-delà du code |
| Administrateurs (codes d'accès) | `admins` | contrôle d'accès à l'espace admin | vie du produit ; retrait d'un droit = suppression de la ligne (procédure dans `HEBERGEMENT.md`) |
| Erreurs techniques client | `client_errors` | fiabilité (v6.246 : y compris pertes de synchronisation) | **purge admin 7/14/30 jours** (`admin_purge_client_errors`, v6.250) |
| Suggestions, contenus | `suggestions`, `content_items` | amélioration produit | vie du produit |

**Traitement IA** (`ia-assist`, Supabase Edge, modèle `claude-haiku-4-5`
d'Anthropic) : utilisé uniquement à l'initiative de l'orthophoniste ou
de l'admin, jamais automatiquement. La vue « cabinet » est anonymisée
par lettres (A, B, C…) avant l'appel — vérifié par test
(`ia v2 : anonymat du cabinet`). Le détail des tâches et données
transmises est documenté dans `docs/IA.md`.

## 3. Sous-traitants et transferts

| Sous-traitant | Rôle | Localisation | Données |
|---|---|---|---|
| Supabase | base, auth, fonctions edge | **Irlande (UE)** | toutes les données du mode cloud |
| GitHub Pages | hébergement des fichiers statiques du site | CDN mondial (**États-Unis** — voir §6) | aucune donnée patient stockée ; journaux de diffusion (IP) côté GitHub |
| Anthropic | modèle IA (via edge function) | États-Unis | uniquement le contenu des requêtes IA décrites ci-dessus |
| Google Cloud TTS | génération des voix | — | **hors ligne de production** : exécuté par David à la génération, aucun texte patient — uniquement les textes d'exercices |
| ~~Google Fonts~~ | ~~polices~~ | — | **supprimé en v6.249** : les polices sont auto-hébergées (`fonts/`, 18 fichiers). Plus aucune IP transmise à Google au chargement. |

## 4. Droits des personnes — procédures RÉELLES

- **Accès / portabilité** : bouton « Télécharger mes données » dans
  l'app (`exportMyData()`, `js/app.js`) — export JSON complet : fiche,
  profil, historique, journal, erreurs, mots de l'aidant, **favoris et
  métadonnées des enregistrements de voix** (complété v6.250). Testé
  (`export-restore-data.test.js`).
- **Effacement** : suppression de compte dans l'app
  (`deleteAccount()` → RPC `delete_patient_account`), qui couvre les
  deux modes (cloud et navigateur, y compris l'index aidant). **Depuis
  v6.250, la fonction efface aussi `login_events` (code en clair) et
  `patient_connections` (code haché)** — deux traces qui survivaient à
  la suppression et rendaient le droit à l'effacement incomplet. Testé
  (`account-deletion.test.js`, complété par `rgpd-nickel-v250.test.js`).
- **Rectification** : prénom et préférences modifiables dans l'app ;
  le reste (historique) est factuel et non éditable — à mentionner dans
  la politique de confidentialité.
- **Limitation / opposition** : le mode navigateur permet d'utiliser
  l'app sans AUCUNE collecte serveur — c'est l'option d'opposition la
  plus forte qui existe, à présenter comme telle.

## 5. Sécurité (constatée par l'audit v6.245)

RLS sur 21/21 tables ; 7 tables sensibles accessibles uniquement par
RPC ; 57 fonctions `security definer` avec `search_path` épinglé ;
codes aidants générés par CSPRNG (`gen_random_bytes`) ; clé publique
anon seule exposée ; aucune clé secrète dans le dépôt.

## 6. Lacunes connues — à traiter AVANT de vrais patients

1. **Hébergement HDS** : Supabase standard n'est pas certifié HDS. Pour
   des données de santé de patients français, c'est un **bloquant
   réglementaire**, pas une option. Chantier n°1, non commencé.
2. **GitHub Pages sert le site depuis un CDN américain.** Aucune donnée
   patient n'y est stockée, mais les journaux de diffusion (adresses
   IP) relèvent d'un transfert hors UE. À réévaluer avec l'hébergement
   HDS (qui devra de toute façon héberger le statique aussi).
3. **Pas de registre validé ni de DPO désigné** : ce document est un
   brouillon de travail, pas un registre au sens de l'art. 30.
4. ~~`confidentialite.html` à mettre à jour~~ — **fait en v6.250** :
   durées réelles, portée exacte de l'export et de la suppression ;
   `politique-cookies.html` ne décrit plus le chargement Google Fonts
   disparu. Restent les champs [email de contact] et [éditeur] à
   compléter par le responsable.
5. ~~`client_errors` sans purge~~ — **fait en v6.250** :
   `admin_purge_client_errors` (7/14/30 j) + bouton dans l'espace admin.
6. **Sauvegardes Supabase** : jamais testées en restauration
   (bloquant n°3 de la liste du projet).

---

*Généré en v6.249 à partir du code. Toute divergence entre ce document
et le code est un bug de documentation : la vérité est dans le code.*
