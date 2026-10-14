import KpiForm from "./kpi-form";
import { KpiDashboard } from "@/components/kpi-dashboard";
import { Notice, PageHeader } from "@/components/ui";
import { requireParticipant } from "@/lib/data";
import { createClient } from "@/lib/supabase/server";
import type { KpiEntry } from "@/lib/kpi";

export default async function KpisPage() {
  const participant = await requireParticipant();
  const supabase = await createClient();

  // Row Level Security limits this to the caller's own rows.
  const { data } = await supabase
    .from("kpi_entries")
    .select("*")
    .order("period", { ascending: true });

  const entries = (data as KpiEntry[] | null) ?? [];
  const currency = participant.kpi_currency ?? "SEK";

  return (
    <>
      <PageHeader
        title="My KPIs"
        lead="Three numbers a month. Conversion rate and average order value are calculated from them."
      />

      <div className="mb-8">
        <Notice>
          Only you and the programme team can see these figures — they are not
          visible to other participants.
        </Notice>
      </div>

      <section className="mb-10">
        <KpiDashboard entries={entries} currency={currency} />
      </section>

      <KpiForm entries={entries} currency={currency} />
    </>
  );
}
