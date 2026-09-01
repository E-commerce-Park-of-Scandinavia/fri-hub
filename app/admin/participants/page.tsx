import ParticipantsAdmin from "./participants-admin";
import { PageHeader } from "@/components/ui";
import { requireAdmin } from "@/lib/data";
import { createClient } from "@/lib/supabase/server";
import type { Cohort, Participant } from "@/lib/types";

export default async function AdminParticipantsPage() {
  await requireAdmin();
  const supabase = await createClient();

  const [{ data: participants }, { data: cohorts }] = await Promise.all([
    supabase.from("participants").select("*").order("full_name"),
    supabase.from("cohorts").select("*").order("start_date", { ascending: false }),
  ]);

  return (
    <>
      <PageHeader
        title="Participants"
        lead="Adding someone here is what lets them sign in. There is no public sign-up."
      />
      <ParticipantsAdmin
        participants={(participants as Participant[] | null) ?? []}
        cohorts={(cohorts as Cohort[] | null) ?? []}
      />
    </>
  );
}
