-- =====================================================================
--  ReParole — schéma de base de données pour Supabase (v4)
--  À coller dans : Supabase > votre projet > SQL Editor > New query > Run
--  Ce fichier contient le schéma v3 (patients, sessions) + les nouvelles
--  tables v4 (orthophonistes, suivi, médias, erreurs, rapports).
--  Il est écrit avec "if not exists" : vous pouvez le recoller tel quel
--  sur une base v3 existante, rien n'est perdu.
-- =====================================================================

-- ---------------------------------------------------------------------
--  v3 — Table des dossiers patients
-- ---------------------------------------------------------------------
create table if not exists patients (
  code        text primary key,            -- code de suivi (identifiant)
  name        text not null,
  level       int  not null default 2,     -- 1=Doux, 2=Intermédiaire, 3=Avancé
  sessions    int  not null default 0,
  correct     int  not null default 0,
  total       int  not null default 0,
  streak      int  not null default 1,
  profile     jsonb,                       -- profil d'apprentissage (forces/faiblesses/erreurs)
  clinical_profile text,                   -- v5 : orientation clinique déclarée par l'orthophoniste
                                            --      (broca | wernicke | anomique | globale | dysarthrie |
                                            --       traumatisme_cranien | orl | parkinson | none — v6.42)
                                            --      Source de vérité réelle : window.CLINICAL_PROFILES
                                            --      dans js/learner.js (cette colonne reste `text` libre,
                                            --      pas de contrainte CHECK, pour ne pas avoir à modifier
                                            --      le schéma à chaque nouveau profil ajouté côté code).
  reminder_opt_in boolean default false,    -- v5 : le patient souhaite des rappels
  reminder_email   text,                    -- v5 : email pour les rappels (facultatif)
  last_seen   timestamptz default now(),
  created_at  timestamptz default now(),
  -- v6.24 : structure gratuit/pro — pas de paiement branché pour
  -- l'instant (décision explicite : structure prête, activation
  -- manuelle en attendant un vrai système de paiement). Pour passer un
  -- patient en 'pro' à la main : Supabase > Table Editor > patients >
  -- modifier la colonne plan sur la ligne concernée.
  plan        text not null default 'free' check (plan in ('free','pro'))
);

-- ---------------------------------------------------------------------
--  v3 — Historique des séances (courbes de progression, suivi ortho)
-- ---------------------------------------------------------------------
create table if not exists sessions (
  id      bigint generated always as identity primary key,
  code    text references patients(code) on delete cascade,
  type    text not null,                   -- ex : 'denomination', 'fluence', 'conversation_medecin'...
  score   int  not null,                   -- nombre de réussites
  total   int  not null,                   -- nombre d'items
  level   int  not null,
  at      timestamptz default now()
);
create index if not exists sessions_code_idx on sessions(code);

-- ---------------------------------------------------------------------
--  v6.41 — Journal de ressenti libre. PAS un questionnaire structuré
--  (voir SYMPTOM_QUESTIONS pour ça) : juste un espace de texte libre,
--  "comment ça s'est passé aujourd'hui", que le patient remplit s'il
--  le souhaite. Peut être montré à l'orthophoniste via le résumé
--  imprimable (mon-resume.html), jamais analysé automatiquement.
-- ---------------------------------------------------------------------
create table if not exists journal_entries (
  id          bigint generated always as identity primary key,
  code        text references patients(code) on delete cascade,
  text        text not null,
  created_at  timestamptz default now()
);
create index if not exists journal_entries_code_idx on journal_entries(code);

-- Si votre table `patients` existe déjà (v3/v4), ces commandes ajoutent
-- les nouvelles colonnes v5 sans rien supprimer :
alter table patients add column if not exists clinical_profile text;
alter table patients add column if not exists reminder_opt_in boolean default false;
alter table patients add column if not exists reminder_email text;

-- =====================================================================
--  v4 — NOUVELLES TABLES
-- =====================================================================

-- Orthophonistes : un compte par professionnel·le.
-- v6 : `code` est désormais l'identifiant Supabase Auth (auth.users.id),
-- pas une chaîne choisie à la main — voir js/dashboard-ortho.js (inscription
-- / connexion par email + mot de passe, via Supabase Auth).
create table if not exists orthophonists (
  code        text primary key,            -- = auth.users.id (uuid, en texte)
  name        text not null,
  email       text,
  created_at  timestamptz default now(),
  -- v6.24 : même logique gratuit/pro que patients — limite le nombre
  -- de patients suivis en gratuit (voir js/dashboard-ortho.js).
  plan        text not null default 'free' check (plan in ('free','pro'))
);

-- Rattachement patient <-> orthophoniste (un patient peut être suivi
-- par un ou plusieurs professionnels ; un ortho suit plusieurs patients)
create table if not exists patient_assignments (
  id             bigint generated always as identity primary key,
  ortho_code     text references orthophonists(code) on delete cascade,
  patient_code   text references patients(code) on delete cascade,
  assigned_at    timestamptz default now(),
  unique(ortho_code, patient_code)
);
create index if not exists patient_assignments_ortho_idx on patient_assignments(ortho_code);
create index if not exists patient_assignments_patient_idx on patient_assignments(patient_code);

-- Photos personnelles du patient, utilisées dans les exercices de
-- dénomination personnalisés ("Comment appelle-t-on ceci ?").
-- En mode cloud, `url` pointe vers un fichier du bucket de stockage
-- Supabase "patient-media" (à créer dans Storage). En mode navigateur,
-- l'app stocke une image encodée en base64 (limite : taille locale).
create table if not exists patient_media (
  id           bigint generated always as identity primary key,
  code         text references patients(code) on delete cascade,
  label        text not null,               -- le mot à travailler (ex: "jardin")
  url          text not null,
  created_at   timestamptz default now()
);
create index if not exists patient_media_code_idx on patient_media(code);

-- Journal des erreurs, catégorisées pour l'analyse orthophonique.
-- Catégories : semantic | phonological | syntax | omission
-- Le classement est fait par une heuristique côté client (voir
-- js/learner.js), affichée comme une PISTE et non un diagnostic.
create table if not exists error_events (
  id           bigint generated always as identity primary key,
  code         text references patients(code) on delete cascade,
  exercise     text not null,               -- type d'exercice (denomination, completion...)
  category     text not null,               -- semantic | phonological | syntax | omission
  target       text,                        -- réponse attendue
  given        text,                        -- réponse donnée par le patient (si dispo)
  level        int,
  at           timestamptz default now()
);
create index if not exists error_events_code_idx on error_events(code);
create index if not exists error_events_category_idx on error_events(category);

-- Rapports générés (métadonnées seulement — le PDF est généré et
-- téléchargé dans le navigateur, il n'est PAS stocké côté serveur ici,
-- pour limiter la conservation de données de santé).
create table if not exists reports (
  id            bigint generated always as identity primary key,
  code          text references patients(code) on delete cascade,
  ortho_code    text references orthophonists(code) on delete set null,
  period_start  timestamptz,
  period_end    timestamptz,
  summary       jsonb,                      -- chiffres clés au moment de la génération
  generated_at  timestamptz default now()
);
create index if not exists reports_code_idx on reports(code);

-- ---------------------------------------------------------------------
--  v5 — Notes cliniques de l'orthophoniste sur un dossier patient.
--  Texte libre, jamais généré ni suggéré automatiquement : entièrement
--  écrit par le professionnel.
-- ---------------------------------------------------------------------
create table if not exists notes (
  id           bigint generated always as identity primary key,
  code         text references patients(code) on delete cascade,
  ortho_code   text references orthophonists(code) on delete set null,
  content      text not null,
  created_at   timestamptz default now()
);
create index if not exists notes_code_idx on notes(code);

-- =====================================================================
--  v6 — SÉCURITÉ RÉELLE (Row Level Security + fonctions RPC)
--  ---------------------------------------------------------------------
--  Deux modèles d'accès cohabitent, et ils sont volontairement différents :
--
--  1) L'ORTHOPHONISTE est un vrai compte Supabase Auth (email + mot de
--     passe). Ses lectures/écritures passent par les tables directement,
--     protégées par RLS : il ne voit QUE les patients qu'il a
--     explicitement rattachés dans patient_assignments.
--
--  2) Le PATIENT n'a pas de compte — il garde un simple "code de suivi"
--     pour rester accessible aux personnes aphasiques (retenir un
--     identifiant court est déjà un effort ; un mot de passe complexe
--     serait un obstacle réel). Comme ce code n'est pas une vraie preuve
--     d'identité cryptographique, on NE PEUT PAS s'appuyer sur RLS pour
--     décider "ce patient a le droit de voir cette ligne" — RLS ne sait
--     lire que des jetons d'authentification, pas un champ de formulaire.
--     À la place, TOUT accès patient passe par des fonctions RPC
--     "security definer" : la table brute n'est plus accessible du tout
--     à la clé publique (anon), seule la fonction l'est, et elle exige de
--     connaître le code exact pour renvoyer quoi que ce soit.
--
--  Concrètement, ceci ferme une vraie faille du prototype précédent (v3
--  à v5) : avec RLS désactivé, la clé "anon" (visible dans le code source
--  envoyé au navigateur) permettait de lister TOUS les patients via
--  l'API REST de Supabase (`GET /rest/v1/patients?select=*`), sans même
--  connaître un seul code. Ce n'est plus possible après ce script.
--
--  ⚠️ Ce que ça ne résout PAS : un code de suivi simple reste devinable
--  (codes courts, prévisibles). Pour un usage clinique réel, générez des
--  codes longs et aléatoires (voir js/storage.js, fonction generateCode) et
--  envisagez une expiration après une période d'inactivité.
-- =====================================================================

alter table patients             enable row level security;
alter table sessions             enable row level security;
alter table orthophonists        enable row level security;
alter table patient_assignments  enable row level security;
alter table patient_media        enable row level security;
alter table error_events         enable row level security;
alter table journal_entries      enable row level security;
alter table reports              enable row level security;
alter table notes                enable row level security;

-- Par défaut, avec RLS activé et AUCUNE policy, personne (à part le
-- rôle "service_role", réservé au backend) ne peut rien lire ni écrire.
-- On rouvre seulement ce qui est nécessaire, et rien de plus :
--
-- v6.44 : contrairement à `create table if not exists` et
-- `create or replace function`, PostgreSQL n'a PAS d'équivalent
-- "if not exists" pour `create policy` — relancer ce script sur une
-- base où il a déjà tourné (même partiellement) provoque une erreur
-- "policy already exists" et interrompt tout le reste du script.
-- Chaque `create policy` est donc précédé d'un `drop policy if exists`
-- correspondant, pour que ce fichier reste rejouable à l'identique,
-- comme documenté plus haut ("vous pouvez le recoller tel quel").

-- --- Orthophonistes : chacun voit/modifie uniquement sa propre ligne ---
drop policy if exists "ortho lit son propre compte" on orthophonists;
create policy "ortho lit son propre compte" on orthophonists for select
  using (code = auth.uid()::text);
drop policy if exists "ortho met à jour son propre compte" on orthophonists;
create policy "ortho met à jour son propre compte" on orthophonists for update
  using (code = auth.uid()::text);
drop policy if exists "ortho crée son propre compte" on orthophonists;
create policy "ortho crée son propre compte" on orthophonists for insert
  with check (code = auth.uid()::text);

-- --- Rattachements : un ortho authentifié gère ses propres rattachements ---
drop policy if exists "ortho lit ses rattachements" on patient_assignments;
create policy "ortho lit ses rattachements" on patient_assignments for select
  using (ortho_code = auth.uid()::text);
drop policy if exists "ortho crée ses rattachements" on patient_assignments;
create policy "ortho crée ses rattachements" on patient_assignments for insert
  with check (ortho_code = auth.uid()::text);
drop policy if exists "ortho supprime ses rattachements" on patient_assignments;
create policy "ortho supprime ses rattachements" on patient_assignments for delete
  using (ortho_code = auth.uid()::text);

-- --- Patients : un ortho authentifié voit/modifie SEULEMENT ses patients ---
drop policy if exists "ortho lit ses patients" on patients;
create policy "ortho lit ses patients" on patients for select
  using (exists (
    select 1 from patient_assignments pa
    where pa.patient_code = patients.code and pa.ortho_code = auth.uid()::text
  ));
drop policy if exists "ortho modifie ses patients" on patients;
create policy "ortho modifie ses patients" on patients for update
  using (exists (
    select 1 from patient_assignments pa
    where pa.patient_code = patients.code and pa.ortho_code = auth.uid()::text
  ));

-- --- Séances / erreurs / photos : lecture ortho limitée à ses patients ---
drop policy if exists "ortho lit les séances de ses patients" on sessions;
create policy "ortho lit les séances de ses patients" on sessions for select
  using (exists (
    select 1 from patient_assignments pa
    where pa.patient_code = sessions.code and pa.ortho_code = auth.uid()::text
  ));
drop policy if exists "ortho lit les erreurs de ses patients" on error_events;
create policy "ortho lit les erreurs de ses patients" on error_events for select
  using (exists (
    select 1 from patient_assignments pa
    where pa.patient_code = error_events.code and pa.ortho_code = auth.uid()::text
  ));
drop policy if exists "ortho lit les photos de ses patients" on patient_media;
create policy "ortho lit les photos de ses patients" on patient_media for select
  using (exists (
    select 1 from patient_assignments pa
    where pa.patient_code = patient_media.code and pa.ortho_code = auth.uid()::text
  ));

-- --- Rapports & notes : entièrement réservés à l'orthophoniste concerné ---
drop policy if exists "ortho gère les rapports de ses patients" on reports;
create policy "ortho gère les rapports de ses patients" on reports for all
  using (exists (
    select 1 from patient_assignments pa
    where pa.patient_code = reports.code and pa.ortho_code = auth.uid()::text
  ));
drop policy if exists "ortho gère les notes de ses patients" on notes;
create policy "ortho gère les notes de ses patients" on notes for all
  using (exists (
    select 1 from patient_assignments pa
    where pa.patient_code = notes.code and pa.ortho_code = auth.uid()::text
  ))
  with check (ortho_code = auth.uid()::text);

-- =====================================================================
--  v6 — ACCÈS PATIENT : fonctions RPC "security definer"
--  Ces fonctions tournent avec les droits du PROPRIÉTAIRE de la fonction
--  (donc elles peuvent lire/écrire malgré RLS), mais uniquement pour la
--  ligne correspondant au code passé en paramètre. C'est la seule porte
--  d'entrée laissée à la clé publique (anon) sur les données patient.
-- =====================================================================

create or replace function get_patient(p_code text)
returns patients language sql security definer set search_path = public as $$
  select * from patients where code = p_code;
$$;

create or replace function upsert_patient(
  p_code text, p_name text, p_level int, p_sessions int,
  p_correct int, p_total int, p_streak int
) returns void language sql security definer set search_path = public as $$
  insert into patients (code, name, level, sessions, correct, total, streak, last_seen)
  values (p_code, p_name, p_level, p_sessions, p_correct, p_total, p_streak, now())
  on conflict (code) do update set
    name=excluded.name, level=excluded.level, sessions=excluded.sessions,
    correct=excluded.correct, total=excluded.total, streak=excluded.streak,
    last_seen=now();
$$;

create or replace function get_patient_profile(p_code text)
returns jsonb language sql security definer set search_path = public as $$
  select profile from patients where code = p_code;
$$;

create or replace function save_patient_profile(p_code text, p_profile jsonb)
returns void language sql security definer set search_path = public as $$
  update patients set profile = p_profile where code = p_code;
$$;

create or replace function set_reminder_prefs(p_code text, p_opt_in boolean, p_email text)
returns void language sql security definer set search_path = public as $$
  update patients set reminder_opt_in = p_opt_in, reminder_email = p_email where code = p_code;
$$;

create or replace function log_session(p_code text, p_type text, p_score int, p_total int, p_level int)
returns void language sql security definer set search_path = public as $$
  insert into sessions (code, type, score, total, level) values (p_code, p_type, p_score, p_total, p_level);
$$;

create or replace function get_history(p_code text)
returns setof sessions language sql security definer set search_path = public as $$
  select * from sessions where code = p_code order by at asc;
$$;

create or replace function log_error(p_code text, p_exercise text, p_category text, p_target text, p_given text, p_level int)
returns void language sql security definer set search_path = public as $$
  insert into error_events (code, exercise, category, target, given, level)
  values (p_code, p_exercise, p_category, p_target, p_given, p_level);
$$;

create or replace function get_error_history(p_code text)
returns setof error_events language sql security definer set search_path = public as $$
  select * from error_events where code = p_code order by at asc;
$$;

-- v6.41 : journal de ressenti libre — texte non modéré, jamais analysé
-- automatiquement, jamais montré à qui que ce soit d'autre que le
-- patient lui-même (et l'orthophoniste, s'il choisit de partager le
-- résumé imprimable qui le contient).
create or replace function add_journal_entry(p_code text, p_text text)
returns void language plpgsql security definer set search_path = public as $$
begin
  if length(trim(p_text)) = 0 then
    raise exception 'texte vide';
  end if;
  insert into journal_entries (code, text) values (p_code, p_text);
end;
$$;

create or replace function get_journal_entries(p_code text)
returns setof journal_entries language sql security definer set search_path = public as $$
  select * from journal_entries where code = p_code order by created_at desc;
$$;

create or replace function add_media(p_code text, p_label text, p_url text)
returns patient_media language sql security definer set search_path = public as $$
  insert into patient_media (code, label, url) values (p_code, p_label, p_url) returning *;
$$;

create or replace function list_media(p_code text)
returns setof patient_media language sql security definer set search_path = public as $$
  select * from patient_media where code = p_code order by created_at asc;
$$;

create or replace function delete_media(p_code text, p_id bigint)
returns void language sql security definer set search_path = public as $$
  delete from patient_media where id = p_id and code = p_code;
$$;

-- Le profil clinique n'est PAS modifiable via cette voie : seul un
-- orthophoniste authentifié peut le régler, via la policy "ortho modifie
-- ses patients" ci-dessus (update direct de patients.clinical_profile).

-- =====================================================================
--  v5 — RAPPELS PAR EMAIL (optionnel, à câbler vous-même)
--  Les colonnes reminder_opt_in / reminder_email sont prêtes, mais
--  L'ENVOI D'EMAIL N'EST PAS INCLUS dans ce prototype : il faut un
--  service d'envoi (Resend, Postmark, SendGrid...) et une clé API, que
--  ce projet ne peut pas fournir. Voir js/reminders-edge-function.md
--  pour une Supabase Edge Function + tâche planifiée (cron) prête à adapter.
-- =====================================================================

-- =====================================================================
--  v6.24 — GRATUIT / PRO (structure seulement, pas de paiement branché)
--  Ces deux lignes garantissent que la colonne `plan` existe même si
--  vous recollez ce script sur une base où `patients`/`orthophonists`
--  existaient déjà avant cette version (le `create table if not
--  exists` plus haut ne les aurait pas ajoutées dans ce cas précis).
-- =====================================================================
alter table patients      add column if not exists plan text not null default 'free' check (plan in ('free','pro'));
alter table orthophonists add column if not exists plan text not null default 'free' check (plan in ('free','pro'));

-- Pour passer un compte en 'pro' à la main (en attendant un vrai système
-- de paiement) : Supabase > Table Editor > patients (ou orthophonists)
-- > cliquer la ligne > champ "plan" > "pro" > Save. Ou en SQL :
--   update patients      set plan='pro' where code='p-xxxxxxxx';
--   update orthophonists set plan='pro' where email='vous@cabinet.fr';

-- =====================================================================
--  v6.26 — PAIEMENT RÉEL (Stripe) — colonnes de suivi d'abonnement
--  Voir js/stripe-edge-functions.md pour la mise en place complète
--  (création du compte Stripe, des tarifs, des deux Edge Functions).
--  Ces colonnes permettent de retrouver quel abonnement Stripe
--  correspond à quel patient/orthophoniste (pour le désactiver si
--  l'abonnement est annulé ou impayé), sans jamais stocker de données
--  de carte bancaire nulle part dans cette base — Stripe s'en occupe.
-- =====================================================================
alter table patients      add column if not exists stripe_customer_id text;
alter table patients      add column if not exists stripe_subscription_id text;
alter table orthophonists add column if not exists stripe_customer_id text;
alter table orthophonists add column if not exists stripe_subscription_id text;

-- =====================================================================
--  v6.35 — ESPACE AIDANT (proche du patient)
--  ---------------------------------------------------------------------
--  Décisions de scope (validées avec l'utilisateur le 7 juillet) :
--   - Un seul aidant par patient pour l'instant (pas de table séparée
--     de rattachements comme pour les orthophonistes — juste un code
--     unique de plus sur la ligne patient).
--   - Le PATIENT génère lui-même le code d'invitation depuis son
--     espace ; ce code devient l'identifiant permanent de l'aidant
--     (pas un code à usage unique — le patient peut le régénérer à
--     tout moment pour révoquer l'accès précédent).
--   - Même logique de sécurité que côté patient : ce code n'est pas un
--     jeton cryptographique, donc AUCUN accès direct aux tables — tout
--     passe par une fonction RPC security-definer qui ne renvoie qu'un
--     sous-ensemble volontairement limité de champs (pas de
--     clinical_profile, pas de reminder_email, etc.), jamais la ligne
--     patient complète.
-- =====================================================================

alter table patients add column if not exists caregiver_code text unique;

-- Génère (ou régénère) le code aidant d'un patient. Régénérer révoque
-- automatiquement l'ancien code : un seul valide à la fois.
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
    v_code := 'a-' || substr(md5(random()::text || clock_timestamp()::text), 1, 12);
    select count(*) into v_taken from patients where caregiver_code = v_code;
    exit when v_taken = 0;
  end loop;
  update patients set caregiver_code = v_code where code = p_patient_code;
  return v_code;
end;
$$;

-- Révoque l'accès aidant en cours (le patient peut le refaire à tout moment).
create or replace function revoke_caregiver_code(p_patient_code text)
returns void language sql security definer set search_path = public as $$
  update patients set caregiver_code = null where code = p_patient_code;
$$;

-- Seule porte d'entrée laissée à l'aidant (clé publique anon) : renvoie
-- un sous-ensemble limité, jamais la ligne patient complète, jamais de
-- champ clinique/administratif. p_caregiver_code inconnu -> null.
create or replace function get_caregiver_data(p_caregiver_code text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_patient patients%rowtype;
  v_sessions jsonb;
  v_errors jsonb;
begin
  select * into v_patient from patients where caregiver_code = p_caregiver_code;
  if not found then
    return null;
  end if;

  select coalesce(jsonb_agg(s), '[]'::jsonb) into v_sessions from (
    select type, score, total, at from sessions
    where code = v_patient.code order by at desc limit 14
  ) s;

  select coalesce(jsonb_object_agg(category, cnt), '{}'::jsonb) into v_errors from (
    select category, count(*) as cnt from error_events
    where code = v_patient.code and at > now() - interval '30 days'
    group by category
  ) e;

  return jsonb_build_object(
    'name', v_patient.name,
    'level', v_patient.level,
    'streak', v_patient.streak,
    'sessions', v_patient.sessions,
    'correct', v_patient.correct,
    'total', v_patient.total,
    'last_seen', v_patient.last_seen,
    'recent_sessions', v_sessions,
    'error_tally', v_errors
  );
end;
$$;

-- Pas de policy RLS à ajouter : `patients` reste totalement fermé à la
-- clé anon (aucune policy select ne correspond à un accès aidant), donc
-- get_caregiver_data() est bien la SEULE voie de lecture pour ce rôle.

-- =====================================================================
--  v6.43 — MOTS PERSONNALISÉS PROPOSÉS PAR L'AIDANT
--  ---------------------------------------------------------------------
--  4ᵉ et dernière des pistes proposées par l'utilisateur en réponse à
--  "quelle idée pourrait-on ajouter ?". Décisions de scope validées :
--   - Un mot proposé par l'aidant est lié AU PATIENT QU'IL ACCOMPAGNE
--     (pas anonyme, pas versé à la base commune — contrairement aux
--     contributions de contribuer.html).
--   - Intégré AUTOMATIQUEMENT, sans validation admin : l'aidant a déjà
--     un accès en lecture au dossier de ce patient précis (via son
--     propre code, voir generate_caregiver_code plus haut), donc le
--     niveau de confiance est déjà différent d'une contribution
--     communautaire anonyme.
-- =====================================================================
create table if not exists caregiver_words (
  id          bigint generated always as identity primary key,
  code        text references patients(code) on delete cascade,
  word        text not null,
  emoji       text,
  created_at  timestamptz default now()
);
create index if not exists caregiver_words_code_idx on caregiver_words(code);
alter table caregiver_words enable row level security;
-- Aucune policy directe : comme pour tout le reste, uniquement via les
-- fonctions RPC ci-dessous (aucune n'expose autre chose que ce champ).

-- Appelée depuis aidant.html avec le CODE AIDANT (pas le code patient) —
-- retrouve le patient via ce code, exactement comme get_caregiver_data,
-- puis insère directement (pas de statut "pending" : intégration
-- immédiate, décision assumée ci-dessus).
create or replace function add_caregiver_word(p_caregiver_code text, p_word text, p_emoji text default null)
returns void language plpgsql security definer set search_path = public as $$
declare
  v_code text;
begin
  if length(trim(p_word)) = 0 then
    raise exception 'mot vide';
  end if;
  select code into v_code from patients where caregiver_code = p_caregiver_code;
  if v_code is null then
    raise exception 'code aidant invalide';
  end if;
  insert into caregiver_words (code, word, emoji) values (v_code, trim(p_word), p_emoji);
end;
$$;

-- Utilisée par l'app PATIENT (avec son propre code) pour fusionner ces
-- mots dans ses exercices de dénomination — voir mergeCaregiverWords()
-- dans js/app.js.
create or replace function get_caregiver_words(p_code text)
returns setof caregiver_words language sql security definer set search_path = public as $$
  select * from caregiver_words where code = p_code order by created_at desc;
$$;

-- Utilisée par aidant.html pour que l'aidant voie ce qu'il/elle a déjà
-- proposé (pas de données patient supplémentaires exposées ici, juste
-- ses propres contributions).
create or replace function get_caregiver_added_words(p_caregiver_code text)
returns setof caregiver_words language plpgsql security definer set search_path = public as $$
declare
  v_code text;
begin
  select code into v_code from patients where caregiver_code = p_caregiver_code;
  if v_code is null then
    return;
  end if;
  return query select * from caregiver_words where code = v_code order by created_at desc;
end;
$$;

-- =====================================================================
--  v6.38 — BASE DE CONNAISSANCES COMMUNAUTAIRE (vocabulaire/phrases) +
--          COMPTES ADMINISTRATEUR + TENDANCES AGRÉGÉES POUR ORTHOS
--  ---------------------------------------------------------------------
--  Décisions de scope (validées avec l'utilisateur le 7 juillet) :
--   - N'importe qui peut PROPOSER une traduction/un mot (formulaire
--     public, `contribuer.html`) — mais rien n'est jamais visible des
--     patients avant validation par un administrateur.
--   - Les comptes administrateur ne sont PAS en self-service : la
--     personne crée un compte Supabase Auth normal (email + mot de
--     passe), mais ça ne lui donne AUCUN privilège tant que le
--     propriétaire du projet n'a pas ajouté sa ligne dans `admins` à
--     la main (Table Editor). C'est la seule façon d'éviter que
--     n'importe qui s'auto-désigne administrateur.
--   - Une fois validée, une contribution devient automatiquement
--     visible dans l'app (pas de redéploiement nécessaire) — mais
--     UNIQUEMENT si elle garde le même niveau d'exigence que le reste
--     du contenu kabyle : le champ `sources` reste affiché à
--     l'administrateur pendant la relecture, garde-fou n°3 inchangé.
--   - PAS de génération automatique de contenu par IA à partir des
--     données patients (décision explicite, refusée) — à la place,
--     une fonction d'agrégat anonymisé (`get_admin_trends`) signale
--     des tendances à un humain, qui décide quoi en faire.
-- =====================================================================

-- ---------------------------------------------------------------------
--  Comptes administrateur (validation des contributions)
-- ---------------------------------------------------------------------
create table if not exists admins (
  code        text primary key,   -- = auth.users.id (uuid, en texte) — voir note ci-dessus : AUCUNE ligne créée automatiquement
  name        text not null,
  email       text,
  created_at  timestamptz default now()
);
alter table admins enable row level security;

drop policy if exists "admin lit son propre compte" on admins;
create policy "admin lit son propre compte" on admins for select
  using (code = auth.uid()::text);
-- Volontairement AUCUNE policy d'insertion ouverte à l'utilisateur : un
-- compte admin ne peut être créé que depuis Supabase (Table Editor ou
-- SQL), jamais depuis l'app elle-même. Voir HEBERGEMENT.md pour la
-- procédure exacte de nomination d'un·e nouvel·le administrateur·rice.

-- ---------------------------------------------------------------------
--  Base de connaissances : contributions de vocabulaire/phrases
-- ---------------------------------------------------------------------
create table if not exists content_items (
  id                 bigint generated always as identity primary key,
  language           text not null,                 -- ex : 'kab'
  domain             text not null,                  -- 'denomination' | 'completion' | 'comprehension' | ...
  level              int,                             -- 1/2/3, nullable si non applicable
  kind               text not null check (kind in ('vocabulary','sentence','exercise')),
  payload            jsonb not null,                  -- forme identique aux items de js/exercises-*.js
  sources            text,                            -- sources citées par le contributeur (garde-fou n°3)
  contributor_name   text,
  contributor_contact text,
  contributor_note   text,
  status             text not null default 'pending' check (status in ('pending','approved','rejected')),
  reviewed_by        text references admins(code) on delete set null,
  admin_notes        text,
  reviewed_at        timestamptz,
  created_at         timestamptz default now()
);
create index if not exists content_items_status_idx on content_items(status);
create index if not exists content_items_lang_domain_idx on content_items(language, domain, level);

alter table content_items enable row level security;

-- Lecture publique : UNIQUEMENT les contributions déjà approuvées (donc
-- jamais le nom/contact d'un contributeur dont la proposition est encore
-- en attente ou a été refusée — ces lignes restent invisibles à "anon").
drop policy if exists "tout le monde lit les contributions approuvées" on content_items;
create policy "tout le monde lit les contributions approuvées" on content_items for select
  using (status = 'approved');

-- Lecture complète (tous statuts) réservée aux administrateurs.
drop policy if exists "admin lit toutes les contributions" on content_items;
create policy "admin lit toutes les contributions" on content_items for select
  using (exists (select 1 from admins a where a.code = auth.uid()::text));

-- Validation/refus réservés aux administrateurs.
drop policy if exists "admin met à jour le statut des contributions" on content_items;
create policy "admin met à jour le statut des contributions" on content_items for update
  using (exists (select 1 from admins a where a.code = auth.uid()::text));

-- Seule porte d'entrée pour PROPOSER une contribution (clé publique
-- anon) : force toujours status='pending', quoi que le client envoie —
-- impossible de s'auto-approuver en contournant l'app.
create or replace function submit_content(
  p_language text, p_domain text, p_level int, p_kind text, p_payload jsonb,
  p_sources text, p_contributor_name text, p_contributor_contact text, p_contributor_note text
) returns bigint language plpgsql security definer set search_path = public as $$
declare
  v_id bigint;
begin
  if p_kind not in ('vocabulary','sentence','exercise') then
    raise exception 'kind invalide';
  end if;
  insert into content_items (
    language, domain, level, kind, payload, sources,
    contributor_name, contributor_contact, contributor_note, status
  ) values (
    p_language, p_domain, p_level, p_kind, p_payload, p_sources,
    p_contributor_name, p_contributor_contact, p_contributor_note, 'pending'
  ) returning id into v_id;
  return v_id;
end;
$$;

-- ---------------------------------------------------------------------
--  Tendances agrégées et anonymisées, pour signaler (jamais générer)
--  du contenu manquant à un·e administrateur·rice ou orthophoniste.
--  Pas de contenu inventé ici : uniquement des chiffres agrégés sur
--  TOUS les patients, sans jamais renvoyer un code ou un nom individuel
--  — impossible de remonter à une personne précise depuis ce résultat.
-- ---------------------------------------------------------------------
create or replace function get_admin_trends()
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_caller text := auth.uid()::text;
  v_error_categories jsonb;
  v_exercise_types jsonb;
begin
  if not exists (select 1 from admins a where a.code = v_caller)
     and not exists (select 1 from orthophonists o where o.code = v_caller) then
    raise exception 'accès réservé aux administrateurs et orthophonistes';
  end if;

  select coalesce(jsonb_object_agg(category, cnt), '{}'::jsonb) into v_error_categories
  from (
    select category, count(*) as cnt from error_events
    where at > now() - interval '30 days'
    group by category
  ) e;

  select coalesce(jsonb_object_agg(type, cnt), '{}'::jsonb) into v_exercise_types
  from (
    select type, count(*) as cnt from sessions
    where at > now() - interval '30 days'
    group by type
  ) s;

  return jsonb_build_object(
    'error_categories_30d', v_error_categories,
    'sessions_by_type_30d', v_exercise_types,
    'generated_at', now()
  );
end;
$$;
