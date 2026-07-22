-- =====================================================================
--  durcissement-securite.sql — À RELIRE AVANT D'APPLIQUER dans Supabase
-- ---------------------------------------------------------------------
--  Suite de l'audit v6.171. Deux durcissements indépendants :
--    1) Code aidant généré par un CSPRNG (et non random(), prédictible)
--    2) Limitation anti-force-brute sur les fonctions accessibles avec
--       la clé anon publique (accès patient / aidant par code)
--  Ce fichier est REJOUABLE (create or replace / if not exists) et
--  n'est PAS inclus dans schema.sql tant que tu ne l'as pas validé.
--  Aucun changement côté client n'est nécessaire.
-- =====================================================================

-- ---------------------------------------------------------------------
--  1. CODE AIDANT : entropie cryptographique
-- ---------------------------------------------------------------------
--  Avant : 'a-' || substr(md5(random()::text || clock_timestamp()::text), 1, 12)
--  random() est un PRNG *prédictible* (pas un générateur cryptographique).
--  Après : gen_random_bytes (pgcrypto, déjà activée dans le schéma) —
--  12 caractères hex = 48 bits d'aléa réel, format inchangé pour
--  l'utilisateur (a-xxxxxxxxxxxx), la boucle anti-collision est conservée.

create or replace function generate_caregiver_code(p_patient_code text)
returns text language plpgsql security definer set search_path = public as $$
declare
  v_code text;
  v_taken int;
begin
  if not exists (select 1 from patients where code = p_patient_code) then
    raise exception 'patient introuvable';
  end if;
  loop
    v_code := 'a-' || encode(gen_random_bytes(6), 'hex');  -- CSPRNG (pgcrypto)
    select count(*) into v_taken from patients where caregiver_code = v_code;
    exit when v_taken = 0;
  end loop;
  update patients set caregiver_code = v_code where code = p_patient_code;
  return v_code;
end;
$$;

-- ---------------------------------------------------------------------
--  2. ANTI-FORCE-BRUTE : garde de débit pour les fonctions "anon"
-- ---------------------------------------------------------------------
--  Les données patient/aidant sont lues via des fonctions security
--  definer gatées uniquement par un code, appelables avec la clé anon
--  publique. Sans limite, un attaquant peut énumérer des codes en masse.
--  Cette garde limite chaque IP à p_max appels par fenêtre glissante.
--
--  SEUIL : 40 appels / 10 minutes par IP — large exprès. En cabinet,
--  plusieurs patients partagent la même IP : ce seuil ne gêne pas
--  l'usage réel (une connexion = quelques appels) mais tue le
--  brute-force (40 essais/10 min contre 2^48 codes = inexploitable).
--
--  LIMITES HONNÊTES :
--   - L'IP vient de request.headers (x-forwarded-for), fixé par la
--     passerelle Supabase. En dehors de Supabase, à adapter.
--   - Un attaquant distribué (botnet) contourne une limite par IP ;
--     c'est l'entropie du code (point 1) qui reste la vraie défense.
--   - La table se purge à chaque appel (delete des entrées expirées) :
--     simple et sans tâche planifiée, au prix d'un delete par appel.

create table if not exists access_attempts(
  ip text not null,
  at timestamptz not null default now()
);
create index if not exists idx_access_attempts_ip_at on access_attempts(ip, at);
alter table access_attempts enable row level security;
-- (aucune policy : accès direct refusé à tous — seule la fonction y écrit)

create or replace function _rate_guard(
  p_max int default 40,
  p_window interval default interval '10 minutes'
) returns void language plpgsql security definer set search_path = public as $$
declare
  v_ip text;
  v_n  int;
begin
  v_ip := coalesce(
    nullif(split_part(
      current_setting('request.headers', true)::json->>'x-forwarded-for', ',', 1
    ), ''),
    'unknown'
  );
  delete from access_attempts where at < now() - p_window;
  select count(*) into v_n from access_attempts
    where ip = v_ip and at > now() - p_window;
  if v_n >= p_max then
    raise exception 'Trop de tentatives. Réessayez dans quelques minutes.';
  end if;
  insert into access_attempts(ip) values (v_ip);
end;
$$;

-- ---------------------------------------------------------------------
--  3. BRANCHEMENT de la garde sur les portes d'entrée "anon"
-- ---------------------------------------------------------------------
--  Ci-dessous, le branchement sur get_caregiver_data (déjà en plpgsql) :
--  ajouter `perform _rate_guard();` en PREMIÈRE ligne du bloc begin.
--  ⚠ Je ne réécris PAS la fonction complète ici pour ne pas risquer
--  d'écraser ta version en production avec une version divergente :
--  applique la ligne dans TON schema.sql, puis rejoue-le.
--
--     create or replace function get_caregiver_data(p_caregiver_code text) ...
--     begin
--       perform _rate_guard();          -- ← LIGNE À AJOUTER
--       ... (corps existant inchangé)
--
--  Même principe pour les autres fonctions gatées par code seul
--  (get_history, get_patient, log_session, get_patient_visible_notes…).
--  Pour celles en `language sql`, deux options :
--    a) les passer en plpgsql (compatible avec les `drop function`
--       déjà présents dans schema.sql depuis la v6.169), ou
--    b) plus simple : garder `language sql` et ajouter la garde en
--       première expression :  select _rate_guard();
--
--  CONSEIL DE DÉPLOIEMENT : applique d'abord 1) et 2) seuls (sans
--  danger), vérifie que l'app fonctionne, puis branche la garde
--  fonction par fonction en commençant par get_caregiver_data.
