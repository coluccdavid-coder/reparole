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
                                            --      (broca | wernicke | anomique | globale | dysarthrie | none)
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
alter table reports              enable row level security;
alter table notes                enable row level security;

-- Par défaut, avec RLS activé et AUCUNE policy, personne (à part le
-- rôle "service_role", réservé au backend) ne peut rien lire ni écrire.
-- On rouvre seulement ce qui est nécessaire, et rien de plus :

-- --- Orthophonistes : chacun voit/modifie uniquement sa propre ligne ---
create policy "ortho lit son propre compte" on orthophonists for select
  using (code = auth.uid()::text);
create policy "ortho met à jour son propre compte" on orthophonists for update
  using (code = auth.uid()::text);
create policy "ortho crée son propre compte" on orthophonists for insert
  with check (code = auth.uid()::text);

-- --- Rattachements : un ortho authentifié gère ses propres rattachements ---
create policy "ortho lit ses rattachements" on patient_assignments for select
  using (ortho_code = auth.uid()::text);
create policy "ortho crée ses rattachements" on patient_assignments for insert
  with check (ortho_code = auth.uid()::text);
create policy "ortho supprime ses rattachements" on patient_assignments for delete
  using (ortho_code = auth.uid()::text);

-- --- Patients : un ortho authentifié voit/modifie SEULEMENT ses patients ---
create policy "ortho lit ses patients" on patients for select
  using (exists (
    select 1 from patient_assignments pa
    where pa.patient_code = patients.code and pa.ortho_code = auth.uid()::text
  ));
create policy "ortho modifie ses patients" on patients for update
  using (exists (
    select 1 from patient_assignments pa
    where pa.patient_code = patients.code and pa.ortho_code = auth.uid()::text
  ));

-- --- Séances / erreurs / photos : lecture ortho limitée à ses patients ---
create policy "ortho lit les séances de ses patients" on sessions for select
  using (exists (
    select 1 from patient_assignments pa
    where pa.patient_code = sessions.code and pa.ortho_code = auth.uid()::text
  ));
create policy "ortho lit les erreurs de ses patients" on error_events for select
  using (exists (
    select 1 from patient_assignments pa
    where pa.patient_code = error_events.code and pa.ortho_code = auth.uid()::text
  ));
create policy "ortho lit les photos de ses patients" on patient_media for select
  using (exists (
    select 1 from patient_assignments pa
    where pa.patient_code = patient_media.code and pa.ortho_code = auth.uid()::text
  ));

-- --- Rapports & notes : entièrement réservés à l'orthophoniste concerné ---
create policy "ortho gère les rapports de ses patients" on reports for all
  using (exists (
    select 1 from patient_assignments pa
    where pa.patient_code = reports.code and pa.ortho_code = auth.uid()::text
  ));
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
