import BenefitsAdmin from "./benefits-admin";
import { Notice, PageHeader } from "@/components/ui";
import { requireAdmin } from "@/lib/data";
import { createClient } from "@/lib/supabase/server";
import type { Benefit, Cohort, Participant, Program } from "@/lib/types";

export default async function AdminBenefitsPage() {
  await requireAdmin();
  const supabase = await createClient();

  const [{ data: benefits }, { data: cohorts }, { data: programs }, { data: people }] =
    await Promise.all([
      supabase
        .from("benefits")
        .select("*")
        .order("kind")
        .order("created_at", { ascending: false }),
      supabase.from("cohorts").select("*").order("start_date", { ascending: false }),
      supabase.from("programs").select("*").order("name"),
      supabase.from("participants").select("id, full_name"),
    ]);

  const ownerNames = Object.fromEntries(
    ((people as Pick<Participant, "id" | "full_name">[] | null) ?? []).map((p) => [
      p.id,
      p.full_name,
    ]),
  );

  const programList = (programs as Program[] | null) ?? [];

  return (
    <>
      <PageHeader
        title="Member benefits"
        lead="Partner offers you add, and offers participants post for each other."
      />
      {programList.length === 0 ? (
        <Notice tone="error">Create a programme first.</Notice>
      ) : (
        <BenefitsAdmin
          benefits={(benefits as Benefit[] | null) ?? []}
          cohorts={(cohorts as Cohort[] | null) ?? []}
          programs={programList}
          ownerNames={ownerNames}
        />
      )}
    </>
  );
}
