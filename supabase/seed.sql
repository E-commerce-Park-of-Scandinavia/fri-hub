-- FRI Hub v1 — seed data
-- Safe to re-run: it clears the FRI program first, then rebuilds it.
--
-- Two dates below are assumptions, not facts from the brief — correct them in
-- /admin/cohorts if they are wrong:
--   * Spring 2026 start_date (2026-01-13). The brief only fixes its END: it goes
--     alumni at the close of the Sept–Dec 2026 term.
--   * Autumn 2026 expected_end_date (2027-09-07), from "a one-year program".

begin;

delete from programs where slug = 'future-retail-incubator';

do $seed$
declare
  v_program  uuid;
  v_spring   uuid;
  v_autumn   uuid;
  v_session  uuid;
  v_loc      text := 'E-commerce Park of Scandinavia, Bredgatan 11, 252 25 Helsingborg — Mindpark building';

  -- A standard Lecture / Workshop Tuesday.
  v_standard jsonb := jsonb_build_array(
    jsonb_build_object('start_time','08:15','end_time','09:00','label','Breakfast & networking','description','Coffee, sandwiches and an unhurried start.'),
    jsonb_build_object('start_time','09:00','end_time','10:00','label','Plenary lecture','description','Guest expert on the theme of the day.'),
    jsonb_build_object('start_time','10:00','end_time','11:00','label','Q&A / workshop','description','Put the lecture to work on your own business.'),
    jsonb_build_object('start_time','11:00','end_time','12:00','label','Focus Circle','description','Look back, then commit to a focus for the next two weeks.'),
    jsonb_build_object('start_time','12:00','end_time','13:00','label','Lunch','description',null),
    jsonb_build_object('start_time','13:00','end_time','15:00','label','Workshop','description','Hands-on session.'),
    jsonb_build_object('start_time','15:00','end_time','15:30','label','Close','description','Wrap-up and what happens before we meet again.')
  );

  -- A co-working Tuesday: same room, no programme.
  v_coworking jsonb := jsonb_build_array(
    jsonb_build_object('start_time','08:15','end_time','09:00','label','Breakfast & networking','description',null),
    jsonb_build_object('start_time','09:00','end_time','12:00','label','Co-working','description','Work on your own business alongside the group.'),
    jsonb_build_object('start_time','12:00','end_time','13:00','label','Lunch','description',null),
    jsonb_build_object('start_time','13:00','end_time','16:00','label','Co-working','description','Sylvia is available for one-to-ones on request.')
  );

  -- Session rows: date, type, title, and whether a company visit is appended.
  v_rows jsonb := jsonb_build_array(
    jsonb_build_object('d','2026-09-08','t','lecture_workshop','title','Kickoff — Autumn 2026'),
    jsonb_build_object('d','2026-09-15','t','co_working',      'title','Co-working day'),
    jsonb_build_object('d','2026-09-22','t','company_visit',   'title','Company visit — Fotbutiken.se', 'visit','Fotbutiken.se'),
    jsonb_build_object('d','2026-09-29','t','co_working',      'title','Co-working day'),
    jsonb_build_object('d','2026-10-06','t','lecture_workshop','title','Lecture & workshop day'),
    jsonb_build_object('d','2026-10-13','t','co_working',      'title','Co-working day'),
    jsonb_build_object('d','2026-10-20','t','lecture_workshop','title','Lecture & workshop day'),
    jsonb_build_object('d','2026-10-27','t','co_working',      'title','Co-working day'),
    jsonb_build_object('d','2026-11-03','t','company_visit',   'title','Company visit', 'visit','Host to be confirmed'),
    jsonb_build_object('d','2026-11-10','t','co_working',      'title','Co-working day'),
    jsonb_build_object('d','2026-11-17','t','lecture_workshop','title','Lecture & workshop day'),
    jsonb_build_object('d','2026-11-24','t','co_working',      'title','Co-working day'),
    jsonb_build_object('d','2026-12-01','t','lecture_workshop','title','Lecture & workshop day'),
    jsonb_build_object('d','2026-12-08','t','co_working',      'title','Co-working day'),
    jsonb_build_object('d','2026-12-15','t','lecture_workshop','title','Final session of the term')
  );
  v_row jsonb;
  v_agenda jsonb;
begin

  insert into programs (name, slug, description, slack_invite_url)
  values (
    'Future Retail Incubator',
    'future-retail-incubator',
    'A one-year incubator for retail and e-commerce founders, run by E-commerce Park of Scandinavia in Helsingborg. Two intakes a year.',
    'https://join.slack.com/t/REPLACE-ME/shared_invite/REPLACE-ME'
  )
  returning id into v_program;

  insert into cohorts (program_id, name, intake_season, start_date, expected_end_date, status, slack_channel_url)
  values (v_program, 'Spring 2026', 'spring', '2026-01-13', '2026-12-15', 'active',
          'https://app.slack.com/client/REPLACE-ME/REPLACE-ME')
  returning id into v_spring;

  insert into cohorts (program_id, name, intake_season, start_date, expected_end_date, status, slack_channel_url)
  values (v_program, 'Autumn 2026', 'autumn', '2026-09-08', '2027-09-07', 'active',
          'https://app.slack.com/client/REPLACE-ME/REPLACE-ME')
  returning id into v_autumn;

  for v_row in select * from jsonb_array_elements(v_rows)
  loop
    if v_row->>'t' = 'co_working' then
      v_agenda := v_coworking;
    elsif v_row->>'t' = 'company_visit' then
      -- Standard day, with the 15:00 close replaced by the visit itself.
      v_agenda := (
        select jsonb_agg(b) from jsonb_array_elements(v_standard) b
         where b->>'label' <> 'Close'
      ) || jsonb_build_array(
        jsonb_build_object('start_time','15:00','end_time','16:00','label',
          'Company visit — ' || (v_row->>'visit'), 'description','We travel together from Mindpark.')
      );
    else
      v_agenda := v_standard;
    end if;

    insert into sessions (program_id, date, session_type, title, start_time, end_time, location, status, agenda_blocks)
    values (
      v_program,
      (v_row->>'d')::date,
      (v_row->>'t')::session_type,
      v_row->>'title',
      '08:15',
      case when v_row->>'t' = 'lecture_workshop' then '15:30' else '16:00' end,
      v_loc,
      'confirmed',
      v_agenda
    )
    returning id into v_session;

    -- Both cohorts attend every session this term.
    insert into session_cohorts (session_id, cohort_id) values (v_session, v_spring), (v_session, v_autumn);
  end loop;

  -- A program-wide knowledge hub item (cohort_id null = every cohort sees it).
  insert into knowledge_hub_items (program_id, cohort_id, category, title, drive_url, item_date)
  values (v_program, null, 'program_plan', '08SEP2026 - Autumn term programme',
          'https://drive.google.com/REPLACE-ME', '2026-09-08');

  -- Example questionnaire. v1 edits the questions JSON directly in the admin UI.
  insert into questionnaires (program_id, title, type, questions)
  values (v_program, 'Session feedback', 'feedback', jsonb_build_array(
    jsonb_build_object('key','useful',    'label','What was the most useful thing today?', 'type','textarea'),
    jsonb_build_object('key','missing',   'label','What was missing?',                     'type','textarea'),
    jsonb_build_object('key','rating',    'label','Rate the day from 1 to 5',              'type','number')
  ));

  -- First admin. Replace this address with Sylvia's real @ecommercepark.se address
  -- before inviting anyone — without an admin row, nobody can reach /admin.
  insert into participants (full_name, email, role, status, home_cohort_id)
  values ('Sylvia Heuvelman', 'sylvia@ecommercepark.se', 'admin', 'active', v_autumn);

end;
$seed$;

commit;
