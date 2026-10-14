-- FRI Hub — monthly KPIs
--
-- The core three from the KPI tracker: total sales, orders, sessions. Conversion
-- rate and AOV are deliberately NOT stored — they are derived in one place in
-- the app, so everyone is compared on the same formula, which is exactly what
-- the tracker asks for.
--
-- The spreadsheet keeps everything the hub does not try to replace: the full
-- funnel menu, each person's three extra picks, and the guidance on where to
-- find each number.
--
-- Visibility is deliberately narrow: a founder sees their own figures, admins
-- see everyone, and nobody sees a peer's revenue. Widening this later is a
-- one-line policy change; un-sharing it would not be possible.

-- Currency belongs to the person, not the month — it does not change monthly.
alter table participants add column if not exists kpi_currency text not null default 'SEK';

create table kpi_entries (
  id              uuid primary key default gen_random_uuid(),
  participant_id  uuid not null references participants(id) on delete cascade,

  -- Always the first of the month; the month is the unit, not the day.
  period          date not null,

  -- All nullable on purpose: the tracker says to leave a number empty rather
  -- than type 0, because 0 and "did not measure" are different things.
  total_sales     numeric(14, 2),
  orders          integer,
  sessions        integer,
  notes           text,

  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),

  constraint kpi_period_is_first_of_month check (extract(day from period) = 1),
  constraint kpi_non_negative check (
    coalesce(total_sales, 0) >= 0 and coalesce(orders, 0) >= 0 and coalesce(sessions, 0) >= 0
  ),
  unique (participant_id, period)
);

create index kpi_participant_idx on kpi_entries(participant_id, period);

create trigger kpi_touch_updated_at
  before update on kpi_entries
  for each row execute function public.touch_updated_at();

-- ---------------------------------------------------------------- RLS

alter table kpi_entries enable row level security;

create policy kpi_read_own on kpi_entries for select to authenticated
  using (is_admin() or participant_id = current_participant_id());

create policy kpi_insert_own on kpi_entries for insert to authenticated
  with check (participant_id = current_participant_id());

create policy kpi_update_own on kpi_entries for update to authenticated
  using (participant_id = current_participant_id())
  with check (participant_id = current_participant_id());

create policy kpi_delete_own on kpi_entries for delete to authenticated
  using (participant_id = current_participant_id());

create policy kpi_admin_write on kpi_entries for all to authenticated
  using (is_admin()) with check (is_admin());
