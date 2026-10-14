-- FRI Hub — member benefits
--
-- Two kinds of offer live in one table, told apart by offered_by_participant_id:
--   null  = a partner benefit, added by an admin (E-commerce Park's partners)
--   set   = a peer offer, posted by a participant for the rest of the group
--
-- Peer offers publish immediately. A moderation queue would mean Sylvia has to
-- approve every one, and she runs this alone; admins can delete anything instead.

create type benefit_kind as enum ('partner', 'peer');

create table benefits (
  id            uuid primary key default gen_random_uuid(),
  program_id    uuid not null references programs(id) on delete cascade,
  -- null = visible to every cohort in the programme (the usual case)
  cohort_id     uuid references cohorts(id) on delete cascade,

  -- Who is offering. Null for partner benefits.
  offered_by_participant_id uuid references participants(id) on delete cascade,
  kind          benefit_kind not null default 'partner',

  partner_name  text not null,          -- the company behind the offer
  partner_url   text,
  title         text not null,          -- "20% off your first order"
  description   text,
  discount_code text,                   -- shown only to signed-in participants
  redeem_url    text,
  valid_from    date,
  valid_until   date,                   -- null = no end date
  is_published  boolean not null default true,

  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),

  -- A peer offer must name its participant; a partner benefit must not.
  constraint benefits_kind_matches_owner check (
    (kind = 'peer'    and offered_by_participant_id is not null) or
    (kind = 'partner' and offered_by_participant_id is null)
  )
);

create index benefits_program_idx on benefits(program_id);
create index benefits_cohort_idx  on benefits(cohort_id);
create index benefits_owner_idx   on benefits(offered_by_participant_id);

create trigger benefits_touch_updated_at
  before update on benefits
  for each row execute function public.touch_updated_at();

-- ---------------------------------------------------------------- RLS

alter table benefits enable row level security;

-- Same visibility rule as the knowledge hub: your cohort's, plus programme-wide.
create policy benefits_read on benefits for select to authenticated
  using (
    is_admin()
    or (
      is_published
      and (cohort_id = current_cohort_id()
           or (cohort_id is null and program_id = current_program_id()))
    )
  );

-- Any participant may post an offer from their own business — alumni included,
-- since a discount is not tied to a session and the network outlives the term.
create policy benefits_insert_own on benefits for insert to authenticated
  with check (
    kind = 'peer'
    and offered_by_participant_id = current_participant_id()
    and program_id = current_program_id()
  );

create policy benefits_update_own on benefits for update to authenticated
  using (offered_by_participant_id = current_participant_id())
  with check (
    kind = 'peer'
    and offered_by_participant_id = current_participant_id()
  );

create policy benefits_delete_own on benefits for delete to authenticated
  using (offered_by_participant_id = current_participant_id());

create policy benefits_admin_write on benefits for all to authenticated
  using (is_admin()) with check (is_admin());

-- ---------------------------------------------------------------- partner offers

-- The partner benefits as supplied. Descriptions are in English to match the
-- rest of the hub; partner names, codes and links are verbatim.
insert into benefits (program_id, kind, partner_name, partner_url, title, description, discount_code, redeem_url, is_published)
select p.id, 'partner', v.partner_name, v.partner_url, v.title, v.description, v.code, v.redeem, v.published
from programs p,
(values
  ('Fortnox', 'https://www.fortnox.se',
   'Free 30 minutes of practical start-up guidance',
   'Startsnack — talk to Fortnox and get straight answers to your questions about starting a company. Completely free.',
   null, 'https://www.fortnox.se/startsnack', true),

  ('Fortnox', 'https://www.fortnox.se',
   '50% off your first year on any package',
   'For new orders only. Effectively free for the first six months. Excludes transaction-based costs and add-on orders.',
   'ECOMPARK', 'https://www.fortnox.se/paket', true),

  ('Fortnox', 'https://www.fortnox.se',
   'Discount on a shelf company (lagerbolag)',
   'If you want to start an AB, Fortnox offer a discount on a ready-made company. Ask Sylvia and she will arrange it.',
   null, null, true),

  ('RosholmDell Advokatbyrå', 'https://www.rosholmdell.se',
   'Two hours of free legal advice, then 30% off',
   'Quick phone calls, two hours of free legal advice, a 30-minute one-to-one, and 30% off their standard rate. Contact Carolina Thoft — carolina.thoft@rdlaw.se, +46 705 55 66 79. Document templates are in the Drive folder linked below.',
   null, 'https://drive.google.com/drive/folders/17MTrHbUM5rIIuHSO6cdzD5g5lX9YPmUF?usp=sharing', true),

  ('Quickbutik', 'https://quickbutik.com',
   'Six months free on the Quickbutik platform',
   'For anyone not already using Quickbutik: try their e-commerce platform free for six months. Azddin, who founded it, went through this incubator ten years ago — today Quickbutik hosts around 5,000 shops turning over roughly 3.2 billion SEK.',
   null, 'https://quickbutik.com/sv?ref=ecompark-0122', true),

  ('Soul Factory', 'https://www.soulfactory.se/',
   '10% off', 'Contact: Filippa Hansson.',
   'ZLR0DMH', 'https://www.soulfactory.se/', true),

  ('Bodyguard', 'https://www.bodyguard.nu/',
   '20% off', 'Contact: Björn Hansson.',
   'ECOMPARK', 'https://www.bodyguard.nu/', true),

  ('Nybryggt', 'https://nybryggt.nu/',
   '10% off', 'Contact: Roosa Mannonnen.',
   'ECOMCOMMUNITY', 'https://nybryggt.nu/', true),

  -- Hidden until there is something concrete to offer.
  ('Resurs Bank', 'https://www.resursbank.se',
   'Offer in preparation',
   'Resurs Bank is a partner of E-commerce Park and is putting an offer together. They provide checkout and financing — worth knowing about for a later stage.',
   null, null, false)
) as v(partner_name, partner_url, title, description, code, redeem, published)
where p.slug = 'future-retail-incubator';
