import ProgramsAdmin from "./programs-admin";
import { PageHeader } from "@/components/ui";
import { requireAdmin } from "@/lib/data";
import { createClient } from "@/lib/supabase/server";
import type { Program } from "@/lib/types";

export default async function AdminProgramsPage() {
  await requireAdmin();
  const supabase = await createClient();
  const { data } = await supabase.from("programs").select("*").order("name");

  return (
    <>
      <PageHeader
        title="Programmes"
        lead="FRI is the only one today. Kompetenslyftet can be added here without a rebuild."
      />
      <ProgramsAdmin programs={(data as Program[] | null) ?? []} />
    </>
  );
}
