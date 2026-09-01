-- FRI Hub v1 — schema
-- Multi-program by design: FRI is the only seeded program, but Kompetenslyftet
-- (or anything else) can be added later without a rebuild.

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------- enums

create type intake_season      as enum ('spring', 'autumn');
create type cohort_status      as enum ('active', 'alumni', 'closed');
create type participant_role   as enum ('participant', 'admin');
create type participant_status as enum ('active', 'alumni');
create type session_type       as enum ('lecture_workshop', 'co_working', 'company_visit', 'alumni_day', 'hackathon');
create type session_status     as enum ('draft', 'confirmed');
create type knowledge_category as enum ('session_materials', 'expert_briefs', 'program_plan', 'session_summaries', 'general');
create type questionnaire_type as enum ('intake', 'feedback', 'site_review', 'custom');

-- ---------------------------------------------------------------- programs

create table programs (
  id                uuid primary key default gen_random_uuid(),
  name              text not null,
  slug              text not null unique,
  description       text,
  -- One workspace-wide Slack invite link for people not yet in the workspace.
  slack_invite_url  text,
  created_at        timestamptz not null default now()
);

-- ---------------------------------------------------------------- cohorts

create table cohorts (
  id                 uuid primary key default gen_random_uuid(),
  program_id         uuid not null references programs(id) on delete cascade,
  name               text not null,              -- "Autumn 2026", "Spring 2026"
  intake_season      intake_season not null,
  start_date         date,
  expected_end_date  date,
  status             cohort_status not null default 'active',
  -- Direct link to this cohort's private Slack channel, e.g. #2026-autumn-incubator
  slack_channel_url  text,
  created_at         timestamptz not null default now(),
  unique (program_id, name)
);

create index cohorts_program_idx on cohorts(program_id);

-- ---------------------------------------------------------------- participants

create table participants (
  id             uuid primary key default gen_random_uuid(),
  -- Linked automatically the first time the invited person signs in (see trigger below).
  auth_user_id   uuid unique references auth.users(id) on delete set null,
  full_name      text not null,
  email          text not null,
  company_name      text,
  company_website   text,
  instagram_url     text,
  tiktok_url        text,
  facebook_url      text,
  photo_url         text,
  -- Nullable so an admin colleague can exist without belonging to a cohort.
  home_cohort_id uuid references cohorts(id) on delete set null,
  role           participant_role   not null default 'participant',
  status         participant_status not null default 'active',

  -- Replaces the per-participant tab in the old Google Doc.
  what_company_does      text,
  why_started            text,
  proud_of               text,
  biggest_challenge      text,
  good_at                text,
  hope_to_get_from_group text,

  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create index participants_cohort_idx on participants(home_cohort_id);
create index participants_auth_idx   on participants(auth_user_id);
create unique index participants_email_lower_idx on participants(lower(email));

-- ---------------------------------------------------------------- sessions

create table sessions (
  id            uuid primary key default gen_random_uuid(),
  program_id    uuid not null references programs(id) on delete cascade,
  date          date not null,
  session_type  session_type not null,
  title         text not null,
  speaker_name  text,
  speaker_bio   text,
  start_time    time,
  end_time      time,
  location      text,
  -- Google Slides "Publish to web" embed URL. Rendered in an iframe on the detail page.
  slides_url    text,
  status        session_status not null default 'draft',
  -- Ordered [{start_time, end_time, label, description}] so a normal Tuesday can hold
  -- breakfast / plenary / Q&A / lunch / workshop / Focus Circle without a rigid schema.
  agenda_blocks jsonb not null default '[]'::jsonb,
  created_at    timestamptz not null default now()
);

create index sessions_program_date_idx on sessions(program_id, date);

-- Two rows (one per cohort) is how "both cohorts attend this Tuesday together" is modeled.
create table session_cohorts (
  session_id uuid not null references sessions(id) on delete cascade,
  cohort_id  uuid not null references cohorts(id)  on delete cascade,
  primary key (session_id, cohort_id)
);

create index session_cohorts_cohort_idx on session_cohorts(cohort_id);

-- ---------------------------------------------------------------- knowledge hub

create table knowledge_hub_items (
  id          uuid primary key default gen_random_uuid(),
  program_id  uuid not null references programs(id) on delete cascade,
  -- null = program-wide, visible to every cohort in the program
  cohort_id   uuid references cohorts(id) on delete cascade,
  -- Optional: surfaces the item on that session's detail page.
  session_id  uuid references sessions(id) on delete set null,
  category    knowledge_category not null default 'general',
  title       text not null,                     -- convention: "DDMMMYYYY - [Topic]"
  drive_url   text not null,
  item_date   date,
  created_at  timestamptz not null default now()
);

create index knowledge_program_idx on knowledge_hub_items(program_id);
create index knowledge_cohort_idx  on knowledge_hub_items(cohort_id);
create index knowledge_session_idx on knowledge_hub_items(session_id);

-- ---------------------------------------------------------------- focus circle

create table focus_circle_checkins (
  id                     uuid primary key default gen_random_uuid(),
  participant_id         uuid not null references participants(id) on delete cascade,
  session_id             uuid not null references sessions(id) on delete cascade,
  look_back_notes        text,
  focus_next_two_weeks   text,
  committed_goal         text,
  submitted_at           timestamptz not null default now(),
  unique (participant_id, session_id)
);

create index checkins_session_idx     on focus_circle_checkins(session_id);
create index checkins_participant_idx on focus_circle_checkins(participant_id);

-- ---------------------------------------------------------------- questionnaires

create table questionnaires (
  id          uuid primary key default gen_random_uuid(),
  program_id  uuid not null references programs(id) on delete cascade,
  title       text not null,
  type        questionnaire_type not null default 'custom',
  -- [{key, label, type}] — admin edits this JSON directly in v1.
  questions   jsonb not null default '[]'::jsonb,
  is_open     boolean not null default true,
  created_at  timestamptz not null default now()
);

create table questionnaire_responses (
  id                uuid primary key default gen_random_uuid(),
  questionnaire_id  uuid not null references questionnaires(id) on delete cascade,
  participant_id    uuid not null references participants(id) on delete cascade,
  answers           jsonb not null default '{}'::jsonb,
  submitted_at      timestamptz not null default now(),
  unique (questionnaire_id, participant_id)
);

create index responses_questionnaire_idx on questionnaire_responses(questionnaire_id);
create index responses_participant_idx   on questionnaire_responses(participant_id);

-- ---------------------------------------------------------------- invite linking
-- Signup is invite-only. An admin creates the participants row, Supabase sends the
-- invite email, and the first time that person signs in we attach their auth user here.

create or replace function public.link_participant_to_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $fn$
begin
  update public.participants
     set auth_user_id = new.id,
         updated_at   = now()
   where lower(email) = lower(new.email)
     and auth_user_id is null;
  return new;
end;
$fn$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.link_participant_to_auth_user();

-- keep updated_at honest
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $fn$
begin
  new.updated_at = now();
  return new;
end;
$fn$;

create trigger participants_touch_updated_at
  before update on participants
  for each row execute function public.touch_updated_at();
