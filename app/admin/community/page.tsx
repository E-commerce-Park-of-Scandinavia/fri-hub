import CommunityAdmin from "./community-admin";
import { PageHeader } from "@/components/ui";
import { requireAdmin } from "@/lib/data";
import { createClient } from "@/lib/supabase/server";
import type { Cohort, Program } from "@/lib/types";

export default async function AdminCommunityPage() {
  await requireAdmin();
  const supabase = await createClient();

  const [{ data: programs }, { data: cohorts }] = await Promise.all([
    supabase.from("programs").select("*").order("name"),
    supabase.from("cohorts").select("*").order("start_date", { ascending: false }),
  ]);

  return (
    <>
      <PageHeader
        title="Community"
        lead="The two Slack links behind the participants' Community page."
      />
      <CommunityAdmin
        programs={(programs as Program[] | null) ?? []}
        cohorts={(cohorts as Cohort[] | null) ?? []}
      />
    </>
  );
}
