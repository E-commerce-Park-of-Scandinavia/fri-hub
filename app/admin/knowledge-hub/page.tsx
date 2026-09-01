import KnowledgeAdmin from "./knowledge-admin";
import { Notice, PageHeader } from "@/components/ui";
import { requireAdmin } from "@/lib/data";
import { createClient } from "@/lib/supabase/server";
import type { Cohort, KnowledgeHubItem, Program, Session } from "@/lib/types";

export default async function AdminKnowledgeHubPage() {
  await requireAdmin();
  const supabase = await createClient();

  const [{ data: items }, { data: cohorts }, { data: sessions }, { data: programs }] =
    await Promise.all([
      supabase
        .from("knowledge_hub_items")
        .select("*")
        .order("item_date", { ascending: false, nullsFirst: false }),
      supabase.from("cohorts").select("*").order("start_date", { ascending: false }),
      supabase.from("sessions").select("*").order("date", { ascending: false }),
      supabase.from("programs").select("*").order("name"),
    ]);

  const programList = (programs as Program[] | null) ?? [];

  return (
    <>
      <PageHeader
        title="Knowledge Hub"
        lead="Links to Google Drive. Nothing is stored here — Drive stays the single source of truth."
      />
      {programList.length === 0 ? (
        <Notice tone="error">Create a programme first.</Notice>
      ) : (
        <KnowledgeAdmin
          items={(items as KnowledgeHubItem[] | null) ?? []}
          cohorts={(cohorts as Cohort[] | null) ?? []}
          sessions={(sessions as Session[] | null) ?? []}
          programs={programList}
        />
      )}
    </>
  );
}
