import CohortsAdmin from "./cohorts-admin";
import { Notice, PageHeader } from "@/components/ui";
import { requireAdmin } from "@/lib/data";
import { createClient } from "@/lib/supabase/server";
import type { Cohort, Program } from "@/lib/types";

export default async function AdminCohortsPage() {
  await requireAdmin();
  const supabase = await createClient();

  const [{ data: cohorts }, { data: programs }] = await Promise.all([
    supabase.from("cohorts").select("*").order("start_date", { ascending: false }),
    supabase.from("programs").select("*").order("name"),
  ]);

  const programList = (programs as Program[] | null) ?? [];

  return (
    <>
      <PageHeader
        title="Cohorts"
        lead="A participant belongs to exactly one cohort — their intake term — for their whole time in the programme."
      />
      {programList.length === 0 ? (
        <Notice tone="error">Create a programme first.</Notice>
      ) : (
        <CohortsAdmin
          cohorts={(cohorts as Cohort[] | null) ?? []}
          programs={programList}
        />
      )}
    </>
  );
}
