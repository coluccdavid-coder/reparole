# 🗄️ Données

## Les 20 tables (`sql/schema.sql`)

| Table | Contenu | Sensibilité |
|---|---|---|
| `patients` | Dossier patient : code, name, niveau, compteurs, profil, consentement voix, `games_all_unlocked` | 🔴 santé |
| `sessions` | Une ligne par séance : `type`, `score`, `total`, `level`, `at` | 🔴 santé |
| `error_events` | Erreurs détaillées : `exercise`, `category`, `target`, `given` | 🔴 santé |
| `notes` | Notes cliniques de l'ortho (+ drapeau « visible patient ») | 🔴 santé |
| `reports` | Rapports générés/enregistrés | 🔴 santé |
| `voice_recordings` | Enregistrements vocaux + `verdict` (pending/acquired/retry) | 🔴 santé + voix |
| `journal_entries` | Journal libre du patient — JAMAIS analysé | 🔴 intime |
| `patient_media` | Photos personnelles + mot associé | 🔴 personnel |
| `favorite_words` | Mots marqués ⭐ | 🟠 |
| `caregiver_words` | Mots proposés par l'aidant/l'ortho | 🟠 |
| `custom_exercises` | Exercices sur mesure validés (titre + payload) | 🟠 |
| `content_items` | Contenus contribués (relecture) | 🟡 |
| `orthophonists` | Comptes ortho (auth) | 🟠 |
| `patient_assignments` | Rattachements ortho ↔ patient — la clé de la RLS | 🟠 |
| `patient_connections` | Codes de connexion patient | 🟠 |
| `admins` | Comptes admin (clé = `code` = auth.uid en texte) | 🟠 |
| `suggestions` | Boîte à idées (`source`, message, `contact` facultatif) | 🟡 |
| `client_errors` | Erreurs techniques du site (message, page, stack) | 🟡 |
| `login_events` | Connexions ortho/admin (purge 30 j possible) | 🟡 |
| `ia_usage` | Compteur d'appels IA par compte (plafond 40/24 h) | 🟡 |

⚠️ Leçon v6.190 gravée en test : **les noms de colonnes font foi** —
`sessions.score` (pas `correct`), `error_events.target` (pas `word`),
`suggestions.source` (pas `role`), `admins.code` (pas `user_id`). Le
verrou `tests/ia-suite.test.js` vérifie l'edge function contre le
schéma.

## Ce qui part vers l'IA (et ce qui ne part JAMAIS)

Part (anonymisé, collecté PAR la fonction serveur) : niveaux, compteurs,
scores de séances, catégories et mots d'erreurs, mots ciblés, verdicts
vocaux (mot + verdict, jamais l'audio), titres d'exercices déjà créés,
texte d'une note à reformuler (tronqué 4000 caractères), suggestions
SANS emails, erreurs techniques.

Ne part JAMAIS : **noms de patients** (lettres A, B, C pour la vue
cabinet), **emails**, **journal du patient**, **photos**,
**enregistrements audio**, codes d'accès.

## RGPD / HDS

- Cadre détaillé : `RGPD.md` et `PREPARATION-REGLEMENTAIRE.md`.
- Export et suppression des données patient : intégrés à l'app
  (espace patient).
- **HDS** : Supabase n'est pas certifié Hébergeur de Données de Santé —
  la production avec de VRAIS patients exige une migration (piste
  identifiée : VPS OVHcloud HDS). Jusque-là : données de test
  uniquement.
