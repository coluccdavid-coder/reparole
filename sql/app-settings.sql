-- =====================================================================
--  REJOUABLE : chaque fonction est supprimée avant d'être recréée.
--  PostgreSQL refuse en effet « create or replace » lorsque le type
--  de retour change (erreur 42P13) — d'où les « drop function ».
-- =====================================================================
-- =====================================================================
--  v6.207 — RÉGLAGES DE L'APPLICATION (app_settings)
--  ---------------------------------------------------------------------
--  Table clé/valeur pour les réglages modifiables SANS toucher au code
--  (d'abord : paiement & tarifs, clé 'billing'). Lecture publique (les
--  tarifs sont une info publique affichée aux utilisateurs), écriture
--  réservée aux admins (même motif RLS que le reste de l'espace admin).
--  À exécuter une fois dans l'éditeur SQL de Supabase.
-- =====================================================================
create table if not exists app_settings (
  key         text primary key,
  value       jsonb not null default '{}'::jsonb,
  updated_at  timestamptz not null default now()
);
alter table app_settings enable row level security;

drop policy if exists app_settings_read on app_settings;
create policy app_settings_read on app_settings
  for select using (true);

drop policy if exists app_settings_write on app_settings;
create policy app_settings_write on app_settings
  for all
  using (exists (select 1 from admins a where a.code = auth.uid()::text))
  with check (exists (select 1 from admins a where a.code = auth.uid()::text));

-- =====================================================================
--  v6.209 — ACTIVATION PRO MANUELLE (admin_set_plan)
--  ---------------------------------------------------------------------
--  Avec un simple lien de paiement bancaire, la confirmation de paiement
--  est manuelle : l'admin bascule ici un compte en 'pro' (ou le repasse
--  en 'free'). Fonction SECURITY DEFINER gatée par la table admins,
--  search_path fixé (même durcissement que le reste du schéma).
-- =====================================================================
create or replace function admin_set_plan(p_type text, p_id text, p_plan text)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_caller text := auth.uid()::text;
  v_count  int;
begin
  if not exists (select 1 from admins a where a.code = v_caller) then
    raise exception 'Réservé aux administrateurs.';
  end if;
  if p_plan not in ('free','pro') then
    raise exception 'Plan invalide (free ou pro).';
  end if;
  if p_type = 'patient' then
    update patients set plan = p_plan where code = p_id;
    get diagnostics v_count = row_count;
  elsif p_type = 'ortho' then
    update orthophonists set plan = p_plan where code = p_id or email = p_id;
    get diagnostics v_count = row_count;
  else
    raise exception 'Type invalide (patient ou ortho).';
  end if;
  if v_count = 0 then
    raise exception 'Compte introuvable (vérifiez la clé ou l''e-mail).';
  end if;
  return 'ok';
end;
$$;

-- =====================================================================
--  v6.223 — MÉNAGE DE L'HISTORIQUE AVEC DURÉE AU CHOIX
--  ---------------------------------------------------------------------
--  L'admin choisit ce qu'il garde (7, 14 ou 30 jours) au lieu des 30
--  jours figés. Gaté par la table admins, search_path fixé.
-- =====================================================================
drop function if exists admin_purge_login_events(integer);
create or replace function admin_purge_login_events(p_days int default 30)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not exists (select 1 from admins a where a.code = auth.uid()::text) then
    raise exception 'réservé aux administrateurs';
  end if;
  if p_days not in (7, 14, 30) then
    raise exception 'durée invalide (7, 14 ou 30 jours)';
  end if;
  delete from login_events where created_at < now() - make_interval(days => p_days);
end;
$$;

-- =====================================================================
--  v6.250 — PURGE DES ERREURS TECHNIQUES CLIENT (audit RGPD)
--  ---------------------------------------------------------------------
--  client_errors n'avait AUCUNE purge : messages, pages et user_agent
--  s'accumulaient sans limite. Un user_agent est une donnée à caractère
--  personnel au sens du RGPD (il participe à l'identification). Même
--  modèle que la purge des connexions : gatée admin, durées bornées.
-- =====================================================================
drop function if exists admin_purge_client_errors(integer);
create or replace function admin_purge_client_errors(p_days int default 30)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not exists (select 1 from admins a where a.code = auth.uid()::text) then
    raise exception 'réservé aux administrateurs';
  end if;
  if p_days not in (7, 14, 30) then
    raise exception 'durée invalide (7, 14 ou 30 jours)';
  end if;
  delete from client_errors where created_at < now() - make_interval(days => p_days);
end;
$$;

-- =====================================================================
--  v6.224 — VUE D'ENSEMBLE ADMIN (get_admin_overview)
--  ---------------------------------------------------------------------
--  Quatre compteurs AGRÉGÉS pour l'en-tête de l'admin. Aucune donnée
--  individuelle : ni nom, ni code, ni ligne patient — uniquement des
--  totaux. Gaté par la table admins, search_path fixé.
--    • patients_actifs   : patients ayant fait au moins une séance sur 30 j
--    • sessions_7d       : nombre de séances sur les 7 derniers jours
--    • connexions_today  : connexions admin/ortho du jour
--    • suggestions_new   : suggestions encore à traiter (statut « new »)
-- =====================================================================
drop function if exists get_admin_overview();
create or replace function get_admin_overview()
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_caller text := auth.uid()::text;
  v_out jsonb;
begin
  if not exists (select 1 from admins a where a.code = v_caller) then
    raise exception 'réservé aux administrateurs';
  end if;
  select jsonb_build_object(
    'patients_actifs',  (select count(distinct code) from sessions where at > now() - interval '30 days'),
    'sessions_7d',      (select count(*) from sessions where at > now() - interval '7 days'),
    'connexions_today', (select count(*) from login_events where created_at >= date_trunc('day', now())),
    'suggestions_new',  (select count(*) from suggestions where status = 'new')
  ) into v_out;
  return v_out;
end;
$$;

-- =====================================================================
--  v6.235 — PATIENTS INACTIFS (liste pseudonymisée + purge)
--  ---------------------------------------------------------------------
--  L'admin doit pouvoir repérer les comptes abandonnés sans identifier
--  les personnes : le prénom est réduit à sa PREMIÈRE et sa DERNIÈRE
--  lettre (« David » -> « D…d »). La clé du patient n'est JAMAIS
--  renvoyée au navigateur — sinon l'admin pourrait se connecter à sa
--  place. La suppression se fait donc en lot, côté serveur.
-- =====================================================================
drop function if exists get_admin_inactive_patients(integer);
create or replace function get_admin_inactive_patients(p_days int default 14)
returns table(label text, days_inactive int, sessions_count bigint, created_on date)
language plpgsql security definer set search_path = public as $$
begin
  if not exists (select 1 from admins a where a.code = auth.uid()::text) then
    raise exception 'réservé aux administrateurs';
  end if;
  return query
    select
      case
        when p.name is null or length(trim(p.name)) = 0 then '—'
        when length(trim(p.name)) = 1 then left(trim(p.name), 1) || '…'
        else left(trim(p.name), 1) || '…' || right(trim(p.name), 1)
      end as label,
      (current_date - greatest(coalesce(max(s.at)::date, p.created_at::date), p.created_at::date))::int as days_inactive,
      count(s.*)::bigint as sessions_count,
      p.created_at::date as created_on
    from patients p
    left join sessions s on s.code = p.code
    group by p.code, p.name, p.created_at
    having (current_date - greatest(coalesce(max(s.at)::date, p.created_at::date), p.created_at::date))::int >= greatest(p_days, 1)
    order by days_inactive desc;
end;
$$;

-- Suppression en lot des comptes inactifs. Volontairement bridée à
-- 30 jours minimum : on ne supprime pas un compte qu'une personne
-- pourrait simplement avoir laissé de côté quelques semaines.
drop function if exists admin_delete_inactive_patients(integer);
create or replace function admin_delete_inactive_patients(p_days int default 30)
returns int language plpgsql security definer set search_path = public as $$
declare
  v_deleted int := 0;
  v_code text;
begin
  if not exists (select 1 from admins a where a.code = auth.uid()::text) then
    raise exception 'réservé aux administrateurs';
  end if;
  if p_days < 30 then
    raise exception 'suppression interdite en dessous de 30 jours d''inactivité';
  end if;
  for v_code in
    select p.code from patients p
    left join sessions s on s.code = p.code
    group by p.code, p.created_at
    having (current_date - greatest(coalesce(max(s.at)::date, p.created_at::date), p.created_at::date))::int >= p_days
  loop
    perform delete_patient_account(v_code);
    v_deleted := v_deleted + 1;
  end loop;
  return v_deleted;
end;
$$;
