# 🤖 La suite IA (`ia-assist`)

## Philosophie — la règle absolue

Chaque prompt commence par la même règle (`HUMAN_RULE`) : **l'IA
PRÉPARE, l'humain DÉCIDE.** Aucun diagnostic, aucune décision clinique
ou produit, aucune recommandation thérapeutique. Le patient est
désigné « le patient » — aucun nom ne quitte la base. Les réponses
sont en texte brut (pas de Markdown), sauf formats JSON explicites.

Le patient n'est **jamais** face à un LLM : la couche IA sert
l'orthophoniste et l'administrateur. (Une conversation LLM patient
n'arrivera, le cas échéant, qu'après validation par un∙e ortho en
exercice, en opt-in ortho.)

## Les 13 tâches

| Tâche | Rôle | Sortie | Notes |
|---|---|---|---|
| `report_draft` | ortho | texte | Brouillon de compte-rendu — à relire/valider |
| `prep_note` | ortho | texte | Note de préparation de séance (30 s de lecture) |
| `suggest_words` | ortho | JSON | 5-6 mots proposés — validés UN PAR UN au clic |
| `rewrite_note` | ortho | texte | Reformulation d'une note, faits STRICTEMENT conservés |
| `generate_exercise` | ortho | JSON | UN exercice 6 questions — prévisualisé, envoyé SEULEMENT sur validation |
| `evolution_story` | ortho | texte | Récit d'évolution sur 7/30/90 j, lisible famille + confrère |
| `cabinet_digest` | ortho | texte | Vue cabinet du matin — patients anonymisés A, B, C… (seule tâche ortho sans patient) |
| `ami_journal` | ortho | texte | Journal de bord qualitatif du dossier clinique (volet 4) — à valider |
| `clinical_reco` | ortho | texte | Pistes d'action du dossier clinique (volet 5) — non-décisionnaires, à valider |
| `research_exercises` | ortho + admin | texte | Veille scientifique avec **recherche web réelle**, sources exigées |
| `triage_suggestions` | admin | texte | Tri de la boîte à idées (SANS les emails de contact) |
| `errors_digest` | admin | texte | Regroupement des erreurs techniques par cause probable |

(12 lignes, 13 autorisations : `research_exercises` compte pour ortho ET admin.)

## Garde-fous techniques

- **Authentification** : jeton de session Supabase obligatoire ; le
  rôle est re-vérifié CÔTÉ SERVEUR (rattachement `patient_assignments`
  pour l'ortho, table `admins` pour l'admin).
- **Plafond** : `DAILY_CAP = 40` appels/24 h par compte (table
  `ia_usage`) → réponse « plafond journalier atteint ».
- **Anonymisation** : la fonction collecte elle-même les données en
  base (le client n'envoie que `task`, `patient_code`, `lang`, options) ;
  aucun nom, aucun email n'est transmis au fournisseur.
- **Bêta ouverte** : côté client, `IA_BETA_OPEN = true` dans
  `dashboard-ortho.js` — à passer à `false` au lancement commercial
  pour regater les boutons sur le plan Pro.

## Modèle, coûts, bascule

- Modèle : `claude-haiku-4-5` (le plus économe) ; `max_tokens` 1200
  (2000 pour la veille). Ordre de grandeur : **quelques centimes/jour**
  au plafond.
- Bascule **Mistral** documentée dans le code de la fonction (URL
  `api.mistral.ai/v1/chat/completions`, corps format OpenAI, réponse
  dans `choices[0].message.content`) — hébergement européen.

## Dépannage express

| Symptôme | Cause | Remède |
|---|---|---|
| « Fonction IA non déployée » | l'edge function n'existe pas sur le projet | suivre DEPLOIEMENT.md §2 |
| « non authentifié » | session ortho expirée | se déconnecter/reconnecter |
| « fournisseur IA indisponible (401) » | clé absente/mal posée | `supabase secrets set ANTHROPIC_API_KEY=…` puis redeploy |
| « plafond journalier atteint » | 40 appels/24 h | attendre — comportement voulu |
| « réponse IA non exploitable » | JSON attendu, prose reçue | relancer ; si persistant, lire les logs |
| Données visiblement fausses (« inactif » à tort) | colonnes edge ≠ schéma | leçon v6.190 — vérifier le verrou `ia-suite` |
| Autre | — | Dashboard Supabase → Edge Functions → ia-assist → **Logs** |

Le code source complet et commenté : `js/ia-edge-function.md`.
