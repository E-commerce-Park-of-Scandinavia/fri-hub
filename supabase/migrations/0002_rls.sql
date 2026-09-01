-- FRI Hub v1 — Row Level Security
--
-- The access rules live here, in the database, not in the app's UI conditionals.
-- Every helper below is SECURITY DEFINER: it runs as the table owner, so it does
-- not re-trigger the policies that call it (no infinite recursion on participants).

-- ---------------------------------------------------------------- helpers

create or replace function public.current_participant_id()
returns uuid language sql stable security definer set search_path = public as $fn$
  select id from participants where auth_user_id = auth.uid() limit 1;
$fn$;

create or replace function public.current_cohort_id()
returns uuid language sql stable security definer set search_path = public as $fn$
  select home_cohort_id from participants where auth_user_id = auth.uid() limit 1;
$fn$;

create or replace function public.current_program_id()
returns uuid language sql stable security definer set search_path = public as $fn$
  select c.program_id
    from participants p
    join cohorts c on c.id = p.home_cohort_id
   where p.auth_user_id = auth.uid()
   limit 1;
$fn$;

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $fn$
  select coalesce(
    (select role = 'admin' from participants where auth_user_id = auth.uid() limit 1),
    false
  );
$fn$;

-- Alumni keep every read right, permanently. They lose writes tied to a future
-- session, because their cohort has none left to check into.
create or replace function public.is_active_participant()
returns boolean language sql stable security definer set search_path = public as $fn$
  select coalesce(
    (select status = 'active' from participants where auth_user_id = auth.uid() limit 1),
    false
  );
$fn$;

-- A session is readable when it is linked to the caller's home cohort. This is what
-- lets both cohorts see a jointly-attended Tuesday without seeing each other's people.
create or replace function public.can_read_session(p_session uuid)
returns boolean language sql stable security definer set search_path = public as $fn$
  select public.is_admin() or exists (
    select 1
      from session_cohorts sc
      join sessions s on s.id = sc.session_id
     where sc.session_id = p_session
       and sc.cohort_id  = public.current_cohort_id()
       and s.status = 'confirmed'
  );
$fn$;

grant execute on function
  public.current_participant_id(),
  public.current_cohort_id(),
  public.current_program_id(),
  public.is_admin(),
  public.is_active_participant(),
  public.can_read_session(uuid)
to authenticated;

-- ---------------------------------------------------------------- enable RLS

alter table programs                enable row level security;
alter table cohorts                 enable row level security;
alter table participants            enable row level security;
alter table sessions                enable row level security;
alter table session_cohorts         enable row level security;
alter table knowledge_hub_items     enable row level security;
alter table focus_circle_checkins   enable row level security;
alter table questionnaires          enable row level security;
alter table questionnaire_responses enable row level security;

-- ---------------------------------------------------------------- programs

create policy programs_read on programs for select to authenticated
  using (is_admin() or id = current_program_id());

create policy programs_admin_write on programs for all to authenticated
  using (is_admin()) with check (is_admin());

-- ---------------------------------------------------------------- cohorts

create policy cohorts_read on cohorts for select to authenticated
  using (is_admin() or id = current_cohort_id());

create policy cohorts_admin_write on cohorts for all to authenticated
  using (is_admin()) with check (is_admin());

-- ---------------------------------------------------------------- participants
-- Own row, plus everyone sharing your home_cohort_id. Never another cohort's people,
-- even one you sit in a joint session with.

create policy participants_read on participants for select to authenticated
  using (
    is_admin()
    or auth_user_id = auth.uid()
    or (home_cohort_id is not null and home_cohort_id = current_cohort_id())
  );

-- A participant may edit their own profile. Cohort, role and status are locked down
-- by the trigger below so self-promotion to admin is impossible.
create policy participants_update_self on participants for update to authenticated
  using (auth_user_id = auth.uid())
  with check (auth_user_id = auth.uid());

create policy participants_admin_write on participants for all to authenticated
  using (is_admin()) with check (is_admin());

create or replace function public.guard_participant_self_update()
returns trigger language plpgsql security definer set search_path = public as $fn$
begin
  if public.is_admin() then
    return new;
  end if;
  -- Non-admins may not change who they are, where they belong, or what they may do.
  new.role           := old.role;
  new.status         := old.status;
  new.home_cohort_id := old.home_cohort_id;
  new.email          := old.email;
  new.auth_user_id   := old.auth_user_id;
  return new;
end;
$fn$;

create trigger participants_guard_self_update
  before update on participants
  for each row execute function public.guard_participant_self_update();

-- ---------------------------------------------------------------- sessions

create policy sessions_read on sessions for select to authenticated
  using (can_read_session(id));

create policy sessions_admin_write on sessions for all to authenticated
  using (is_admin()) with check (is_admin());

create policy session_cohorts_read on session_cohorts for select to authenticated
  using (is_admin() or cohort_id = current_cohort_id());

create policy session_cohorts_admin_write on session_cohorts for all to authenticated
  using (is_admin()) with check (is_admin());

-- ---------------------------------------------------------------- knowledge hub
-- Your cohort's items, plus program-wide items (cohort_id is null).

create policy knowledge_read on knowledge_hub_items for select to authenticated
  using (
    is_admin()
    or cohort_id = current_cohort_id()
    or (cohort_id is null and program_id = current_program_id())
  );

create policy knowledge_admin_write on knowledge_hub_items for all to authenticated
  using (is_admin()) with check (is_admin());

-- ---------------------------------------------------------------- focus circle
-- Read and write your own check-ins only. Admins read everything.

create policy checkins_read_own on focus_circle_checkins for select to authenticated
  using (is_admin() or participant_id = current_participant_id());

create policy checkins_insert_own on focus_circle_checkins for insert to authenticated
  with check (
    participant_id = current_participant_id()
    and is_active_participant()
    and can_read_session(session_id)
  );

create policy checkins_update_own on focus_circle_checkins for update to authenticated
  using (participant_id = current_participant_id() and is_active_participant())
  with check (participant_id = current_participant_id() and is_active_participant());

create policy checkins_admin_write on focus_circle_checkins for all to authenticated
  using (is_admin()) with check (is_admin());

-- ---------------------------------------------------------------- questionnaires

create policy questionnaires_read on questionnaires for select to authenticated
  using (is_admin() or program_id = current_program_id());

create policy questionnaires_admin_write on questionnaires for all to authenticated
  using (is_admin()) with check (is_admin());

create policy responses_read_own on questionnaire_responses for select to authenticated
  using (is_admin() or participant_id = current_participant_id());

create policy responses_insert_own on questionnaire_responses for insert to authenticated
  with check (participant_id = current_participant_id());

create policy responses_update_own on questionnaire_responses for update to authenticated
  using (participant_id = current_participant_id())
  with check (participant_id = current_participant_id());

create policy responses_admin_write on questionnaire_responses for all to authenticated
  using (is_admin()) with check (is_admin());
