import SessionsAdmin, { type SessionWithCohorts } from "./sessions-admin";
import { Notice, PageHeader } from "@/components/ui";
import { requireAdmin } from "@/lib/data";
import { createClient } from "@/lib/supabase/server";
import type { Cohort, Program, Session } from "@/lib/types";

export default async function AdminSessionsPage() {
  await requireAdmin();
  const supabase = await createClient();

  const [{ data: sessions }, { data: cohorts }, { data: programs }, { data: links }] =
    await Promise.all([
      supabase.from("sessions").select("*").order("date", { ascending: true }),
      supabase.from("cohorts").select("*").order("start_date", { ascending: false }),
      supabase.from("programs").select("*").order("name"),
      supabase.from("session_cohorts").select("session_id, cohort_id"),
    ]);

  const byCohort = new Map<string, string[]>();
  for (const link of links ?? []) {
    const list = byCohort.get(link.session_id);
    if (list) list.push(link.cohort_id);
    else byCohort.set(link.session_id, [link.cohort_id]);
  }

  const withCohorts: SessionWithCohorts[] = ((sessions as Session[] | null) ?? []).map(
    (session) => ({ ...session, cohort_ids: byCohort.get(session.id) ?? [] }),
  );

  const programList = (programs as Program[] | null) ?? [];

  return (
    <>
      <PageHeader
        title="Sessions"
        lead="Link a session to both cohorts when they attend the same day together."
      />
      {programList.length === 0 ? (
        <Notice tone="error">
          There is no programme yet. Create one under Programmes before adding sessions.
        </Notice>
      ) : (
        <SessionsAdmin
          sessions={withCohorts}
          cohorts={(cohorts as Cohort[] | null) ?? []}
          programs={programList}
        />
      )}
    </>
  );
}
