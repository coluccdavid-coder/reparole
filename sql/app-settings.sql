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
