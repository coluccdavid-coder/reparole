# 🏗️ Architecture

## Pile technique

- **Front** : HTML/CSS/JavaScript *vanilla* — aucun framework, aucun
  bundler. Chaque page est autonome et lisible telle quelle.
- **PWA** : `sw.js` (service worker) met en cache l'application ; la
  constante `CACHE_NAME` (ligne 30) **doit être incrémentée à chaque
  version**, c'est elle qui force le rafraîchissement chez l'utilisateur.
- **Cloud** : Supabase (Postgres + Auth + Edge Functions). Le site
  fonctionne aussi **hors cloud** (mode local, localStorage) pour un
  patient seul.
- **Paiement** : Stripe (abonnement Pro ortho).
- **IA** : une seule edge function `ia-assist` (Deno) appelant
  Anthropic (`claude-haiku-4-5`) — bascule Mistral documentée dans le
  code (2 lignes, hébergement européen).

## Carte des fichiers

| Zone | Fichiers | Rôle |
|---|---|---|
| Patient | `index.html` + `js/app.js` | Tableau de bord, 20 exercices, jeux, quête, journal, photos, Ami |
| Compagnon | `js/companion.js` | Ami : poses, humeurs, consignes par exercice, niveaux d'accompagnement (14 langues) |
| Contenu | `js/exercises.js` (fr) + `js/exercises-XX.js` | Banques d'items par langue ; `js/exercises-acalculie*.js` pour le calcul |
| Orthophoniste | `dashboard-ortho.html` + `js/dashboard-ortho.js` | Fiches patients, récit 📖, notes, rapports, boutons IA, mots ciblés, boucle vocale |
| Aidant | `aidant.html` + `js/caregiver.js` (+ `caregiver-tips.js`) | Lecture seule + mots proposés + conseils du jour |
| Admin | `admin.html` + `js/admin.js` | Suggestions, erreurs techniques, connexions, boutons IA admin (FR en dur, pas d'i18n) |
| Transverse | `js/storage.js` | TOUTE la persistance (local + Supabase + RPC) — un seul point d'entrée |
| Transverse | `js/i18n.js` | Les 14 langues (voir conventions dans DEVELOPPEMENT.md) |
| Transverse | `js/prefs.js` | Préférences appareil (dys, sombre, séance courte, niveau d'Ami…) |
| Transverse | `js/error-tracking.js`, `js/charts.js`, `js/assessment.js`, `js/conversation.js` | Suivi d'erreurs, courbes, bilan, conversations guidées scriptées |
| Moteur adaptatif | dans `js/app.js` (`AI.*`) | `AI.recommend` (tri des exercices), `AI.trend` (tendance), `AI.record` (profil d'erreurs), `typeLevel` (niveau par type) |
| Serveur | `sql/schema.sql` | Schéma COMPLET rejouable (`if not exists` partout) : tables, RLS, RPC |
| Serveur | `js/ia-edge-function.md` | Source commentée de l'edge function `ia-assist` |
| Voix | `audio/<lang>/…` + `scripts/` | Fichiers voix pré-générés (cloud TTS) + scripts d'extraction/génération |

## Flux de données (résumé)

1. Le **patient** se connecte par *code de suivi* (pas de compte
   Supabase Auth) ; ses données transitent par des **RPC gatées** dans
   `storage.js`.
2. L'**ortho** et l'**admin** ont un compte **Supabase Auth**
   (email + mot de passe) ; la **RLS** limite chaque ortho aux patients
   explicitement rattachés (`patient_assignments`).
3. La **fonction IA** est appelée avec le jeton de session ortho/admin ;
   elle re-vérifie le rôle CÔTÉ SERVEUR, collecte les données
   anonymisées elle-même (jamais envoyées par le client), applique le
   plafond journalier (`ia_usage`), appelle le fournisseur, renvoie le
   texte.
4. L'**aidant** accède en lecture seule par un code dédié révocable.

## Modèle de sécurité

- RLS active sur toutes les tables sensibles ; règles concrètes (pas
  d'exemples commentés).
- Clé `service_role` UNIQUEMENT dans l'edge function (jamais côté client).
- Les fonctions SQL sensibles sont `security definer` + vérification du
  rattachement (`auth.uid()`).
- Leçon v6.169 : modifier une table dont une fonction retourne le
  rowtype impose de recréer la fonction — le schéma est écrit pour être
  rejouable sans casse.
