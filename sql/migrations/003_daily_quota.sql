-- =====================================================================
--  MIGRATION 003 — persister le quota gratuit journalier (5 séances/jour)
--  ---------------------------------------------------------------------
--  Bug trouvé lors d'un audit complet du site (v6.32) : le quota de 5
--  séances gratuites/jour (FREE_DAILY_SESSION_LIMIT, js/app.js) vivait
--  UNIQUEMENT en mémoire (variables `user.dailySessionsDate` /
--  `user.dailySessionsCount`), jamais sauvegardé nulle part. Un compte
--  gratuit qui rechargeait la page, ou se reconnectait, repartait avec
--  un quota neuf — la limite ne protégeait quasiment rien en pratique.
--
--  Cette migration ajoute 2 colonnes à `patients` et met à jour
--  `upsert_patient()` pour les accepter, sur le même principe que
--  `sql/migrations/002_plan_upsert.sql` (paramètres optionnels avec
--  `coalesce()`, pour rester rétrocompatible si un ancien client JS
--  appelle cette fonction sans ces paramètres).
--
--  À EXÉCUTER dans Supabase (SQL Editor) :
-- =====================================================================

alter table patients add column if not exists daily_sessions_date date;
alter table patients add column if not exists daily_sessions_count int not null default 0;

create or replace function upsert_patient(
  p_code text, p_name text, p_level int, p_sessions int,
  p_correct int, p_total int, p_streak int,
  p_plan text default null,                  -- NULL = ne touche pas au plan existant
  p_daily_sessions_date date default null,    -- NULL = ne touche pas la date existante
  p_daily_sessions_count int default null     -- NULL = ne touche pas le compteur existant
) returns void language sql security definer set search_path = public as $$
  insert into patients (code, name, level, sessions, correct, total, streak, last_seen, plan, daily_sessions_date, daily_sessions_count)
  values (p_code, p_name, p_level, p_sessions, p_correct, p_total, p_streak, now(), coalesce(p_plan, 'free'),
          p_daily_sessions_date, coalesce(p_daily_sessions_count, 0))
  on conflict (code) do update set
    name=excluded.name, level=excluded.level, sessions=excluded.sessions,
    correct=excluded.correct, total=excluded.total, streak=excluded.streak,
    last_seen=now(),
    plan=coalesce(p_plan, patients.plan),
    daily_sessions_date=coalesce(p_daily_sessions_date, patients.daily_sessions_date),
    daily_sessions_count=coalesce(p_daily_sessions_count, patients.daily_sessions_count);
$$;

-- Vérification rapide après exécution (optionnel) :
--   select code, name, daily_sessions_date, daily_sessions_count from patients limit 5;
