import Link from "next/link";
import { KpiDashboard } from "@/components/kpi-dashboard";
import { Badge, Card, EmptyState, PageHeader, SectionTitle } from "@/components/ui";
import { requireAdmin } from "@/lib/data";
import { createClient } from "@/lib/supabase/server";
import {
  currentPeriod,
  formatPeriodLong,
  KPI_METRICS,
  metricValue,
  previousPeriod,
  type KpiEntry,
} from "@/lib/kpi";
import type { Participant } from "@/lib/types";

export default async function AdminKpisPage({ searchParams }: PageProps<"/admin/kpis">) {
  await requireAdmin();
  const params = await searchParams;
  const focus = typeof params.participant === "string" ? params.participant : null;

  const supabase = await createClient();
  const [{ data: entries }, { data: people }] = await Promise.all([
    supabase.from("kpi_entries").select("*").order("period", { ascending: true }),
    supabase
      .from("participants")
      .select("*")
      .eq("role", "participant")
      .order("full_name"),
  ]);

  const all = (entries as KpiEntry[] | null) ?? [];
  const participants = (people as Participant[] | null) ?? [];

  const byParticipant = new Map<string, KpiEntry[]>();
  for (const entry of all) {
    const list = byParticipant.get(entry.participant_id);
    if (list) list.push(entry);
    else byParticipant.set(entry.participant_id, [entry]);
  }

  // The month people are reporting on is the one that has just finished.
  const reportingPeriod = previousPeriod(currentPeriod());
  const submitted = participants.filter((p) =>
    (byParticipant.get(p.id) ?? []).some((e) => e.period === reportingPeriod),
  );
  const missing = participants.filter((p) => !submitted.includes(p));

  const focused = focus ? participants.find((p) => p.id === focus) : null;

  if (focused) {
    return (
      <>
        <Link href="/admin/kpis" className="text-muted mb-6 inline-block text-sm underline">
          ← All participants
        </Link>
        <PageHeader
          title={focused.full_name}
          lead={`${focused.company_name ?? "—"} · reporting in ${focused.kpi_currency ?? "SEK"}`}
        />
        <KpiDashboard
          entries={byParticipant.get(focused.id) ?? []}
          currency={focused.kpi_currency ?? "SEK"}
        />
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="KPIs"
        lead={`Who has reported for ${formatPeriodLong(reportingPeriod)}, and how everyone is doing.`}
      />

      <div className="mb-8 grid gap-4 md:grid-cols-2">
        <Card>
          <SectionTitle>Still missing ({missing.length})</SectionTitle>
          {missing.length === 0 ? (
            <p className="text-sm">Everyone has reported. Nothing to chase.</p>
          ) : (
            <ul className="space-y-1 text-sm">
              {missing.map((p) => (
                <li key={p.id} className="flex items-center justify-between gap-3">
                  <span>{p.full_name}</span>
                  <a href={`mailto:${p.email}`} className="text-accent text-xs underline">
                    remind
                  </a>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card>
          <SectionTitle>Reported ({submitted.length})</SectionTitle>
          {submitted.length === 0 ? (
            <p className="text-muted text-sm">Nobody yet.</p>
          ) : (
            <ul className="space-y-1 text-sm">
              {submitted.map((p) => (
                <li key={p.id}>{p.full_name}</li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <SectionTitle>Everyone</SectionTitle>
      {participants.length === 0 ? (
        <EmptyState>No participants yet.</EmptyState>
      ) : (
        <div className="border-line bg-surface overflow-x-auto border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-line text-muted border-b text-left">
                <th className="px-4 py-2 font-semibold">Participant</th>
                <th className="px-4 py-2 font-semibold">Latest month</th>
                {KPI_METRICS.map((m) => (
                  <th key={m.key} className="px-4 py-2 text-right font-semibold">
                    {m.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {participants.map((person) => {
                const own = byParticipant.get(person.id) ?? [];
                const latest = own[own.length - 1] ?? null;
                const currency = person.kpi_currency ?? "SEK";

                return (
                  <tr key={person.id} className="border-line hover:bg-paper border-b">
                    <td className="px-4 py-2">
                      <Link
                        href={`/admin/kpis?participant=${person.id}`}
                        className="font-semibold underline"
                      >
                        {person.full_name}
                      </Link>
                      <span className="text-muted block text-xs">
                        {person.company_name ?? "—"}
                      </span>
                    </td>
                    <td className="px-4 py-2">
                      {latest ? (
                        latest.period === reportingPeriod ? (
                          <Badge tone="accent">{formatPeriodLong(latest.period)}</Badge>
                        ) : (
                          <Badge>{formatPeriodLong(latest.period)}</Badge>
                        )
                      ) : (
                        <span className="text-muted">nothing yet</span>
                      )}
                    </td>
                    {KPI_METRICS.map((m) => {
                      const value = latest ? metricValue(latest, m.key) : null;
                      return (
                        <td key={m.key} className="px-4 py-2 text-right tabular-nums">
                          {value === null ? (
                            <span className="text-muted">—</span>
                          ) : (
                            m.format(value, currency)
                          )}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <p className="text-muted mt-4 text-xs">
        Figures are reported in each participant&apos;s own currency, so the sales
        and AOV columns are not directly comparable between people.
      </p>
    </>
  );
}
