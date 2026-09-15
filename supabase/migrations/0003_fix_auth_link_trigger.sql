-- FRI Hub — repair: link auth users to participant rows
--
-- The trigger on auth.users from 0001 was not firing on the hosted project.
-- This recreates it defensively, adds a manual backfill for any logins that
-- already exist, and reports what the trigger looks like afterwards.

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

-- The auth schema is owned by supabase_auth_admin; the function must be
-- callable by that role for the trigger to run when Supabase inserts a user.
grant usage  on schema public to supabase_auth_admin;
grant execute on function public.link_participant_to_auth_user() to supabase_auth_admin;
grant select, update on public.participants to supabase_auth_admin;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.link_participant_to_auth_user();

-- Back-fill: any login that already exists but is not yet attached.
update public.participants p
   set auth_user_id = u.id,
       updated_at   = now()
  from auth.users u
 where lower(u.email) = lower(p.email)
   and p.auth_user_id is null;

-- Report.
select
  (select count(*) from pg_trigger where tgrelid = 'auth.users'::regclass and tgname = 'on_auth_user_created') as trigger_present,
  (select count(*) from public.participants where auth_user_id is not null) as participants_linked;
