-- FRI Hub — repair: the self-update guard was reverting the auth link
--
-- guard_participant_self_update() resets role / status / cohort / email /
-- auth_user_id unless the caller is an admin. But the auth-link trigger and
-- the service-role client have no signed-in user at all, so is_admin() was
-- false and the guard undid their writes too. A system context (auth.uid()
-- is null) must pass through: anonymous visitors cannot reach an UPDATE
-- anyway, because every RLS policy on participants needs a real auth.uid().

create or replace function public.guard_participant_self_update()
returns trigger language plpgsql security definer set search_path = public as $fn$
begin
  if auth.uid() is null or public.is_admin() then
    return new;
  end if;
  new.role           := old.role;
  new.status         := old.status;
  new.home_cohort_id := old.home_cohort_id;
  new.email          := old.email;
  new.auth_user_id   := old.auth_user_id;
  return new;
end;
$fn$;

-- Back-fill the login that already exists.
update public.participants p
   set auth_user_id = u.id
  from auth.users u
 where lower(u.email) = lower(p.email)
   and p.auth_user_id is null;

select email, role, (auth_user_id is not null) as linked
  from public.participants
 order by email;
