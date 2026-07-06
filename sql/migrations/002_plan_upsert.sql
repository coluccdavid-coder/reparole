-- =====================================================================
--  MIGRATION 002 — upsert_patient() doit pouvoir écrire la colonne "plan"
--  ---------------------------------------------------------------------
--  Bug trouvé en v6.30 : la colonne `plan` existe bien dans la table
--  `patients` (voir sql/schema.sql, ajoutée en v6.24), et la méthode
--  documentée pour passer un patient en Pro était de la modifier à la
--  main dans Supabase (table editor ou `update patients set plan='pro'
--  where code=...`). Mais :
--   1. `get_patient()` renvoyait bien la colonne (elle fait `select *`),
--      MAIS le code JS qui transforme la ligne en objet (js/storage.js,
--      loadPatient()) oubliait de la reprendre → `user.plan` valait
--      toujours `undefined` après connexion, donc jamais 'pro'. Corrigé
--      côté JS (v6.30), rien à faire côté SQL pour ce point.
--   2. `upsert_patient()` — appelée à CHAQUE sauvegarde de progression
--      (fin d'exercice, etc.) — n'accepte pas de paramètre pour "plan" et
--      ne le touche donc jamais. Ce n'était pas dangereux en soi (une
--      valeur "pro" mise à la main n'était pas écrasée), MAIS ça
--      signifie aussi qu'aucun mécanisme dans l'app ne peut faire passer
--      un patient en Pro (ex: futur bouton d'upgrade, ou le code de test
--      QA ajouté en v6.30 pour les besoins de recette) sans passer par
--      Supabase à la main à chaque fois. Cette migration corrige ce
--      second point.
--
--  À EXÉCUTER dans Supabase (SQL Editor) pour que le code de test QA
--  (ou un futur vrai système de paiement) puisse effectivement passer un
--  patient en Pro depuis l'app, en mode cloud :
-- =====================================================================

create or replace function upsert_patient(
  p_code text, p_name text, p_level int, p_sessions int,
  p_correct int, p_total int, p_streak int,
  p_plan text default null   -- NULL = ne touche pas au plan existant (rétrocompatible)
) returns void language sql security definer set search_path = public as $$
  insert into patients (code, name, level, sessions, correct, total, streak, last_seen, plan)
  values (p_code, p_name, p_level, p_sessions, p_correct, p_total, p_streak, now(), coalesce(p_plan, 'free'))
  on conflict (code) do update set
    name=excluded.name, level=excluded.level, sessions=excluded.sessions,
    correct=excluded.correct, total=excluded.total, streak=excluded.streak,
    last_seen=now(),
    -- coalesce() est important ici : si un ancien client JS (pas encore
    -- mis à jour, ex. onglet resté ouvert / service worker qui sert
    -- encore l'ancien js/storage.js) appelle cette fonction SANS p_plan,
    -- p_plan vaudra NULL et le plan existant du patient est conservé —
    -- il n'est PAS réinitialisé à 'free'. Sans ce coalesce, un déploiement
    -- non simultané JS/SQL pourrait faire perdre le statut Pro à des
    -- patients existants à leur prochaine sauvegarde de séance.
    plan=coalesce(p_plan, patients.plan);
$$;

-- Vérification rapide après exécution (optionnel) :
--   select code, name, plan from patients limit 5;
