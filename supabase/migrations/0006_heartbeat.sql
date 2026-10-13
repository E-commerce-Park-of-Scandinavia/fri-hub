-- FRI Hub — heartbeat table for the keep-alive job
--
-- Reading the database three times a week did NOT stop Supabase pausing the
-- free project: it paused exactly 7 days after the last restore, despite
-- successful read pings on days 2, 5 and 7. This gives the keep-alive job
-- something to WRITE instead, which may register as activity where reads did not.
--
-- The table holds exactly one row and exactly one timestamp. Nothing else goes
-- in it, which is why it is safe to let anonymous callers update it: the worst
-- anyone can do with the public anon key is change a date that nothing depends on.

create table if not exists public.heartbeat (
  id         integer primary key default 1,
  pinged_at  timestamptz not null default now(),
  constraint heartbeat_is_a_single_row check (id = 1)
);

insert into public.heartbeat (id) values (1)
on conflict (id) do nothing;

alter table public.heartbeat enable row level security;

drop policy if exists heartbeat_anon_select on public.heartbeat;
drop policy if exists heartbeat_anon_update on public.heartbeat;

-- Deliberately open, and deliberately scoped to this one table only.
create policy heartbeat_anon_select on public.heartbeat
  for select to anon, authenticated using (true);

create policy heartbeat_anon_update on public.heartbeat
  for update to anon, authenticated using (true) with check (true);

select id, pinged_at from public.heartbeat;
