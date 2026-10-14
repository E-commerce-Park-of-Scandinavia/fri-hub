import { KpiChart, type ChartPoint } from "@/components/kpi-chart";
import { Card } from "@/components/ui";
import {
  changeVsPrevious,
  KPI_METRICS,
  metricValue,
  type KpiEntry,
} from "@/lib/kpi";

/**
 * Five single-series charts rather than one chart with five scales. Each shows
 * its latest value as the headline, the month-on-month change beneath it, and
 * the line underneath for the shape over time.
 */
export function KpiDashboard({
  entries,
  currency,
}: {
  entries: KpiEntry[];
  currency: string;
}) {
  const ordered = [...entries].sort((a, b) => a.period.localeCompare(b.period));

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {KPI_METRICS.map((metric) => {
        const points: ChartPoint[] = ordered.map((e) => ({
          period: e.period,
          value: metricValue(e, metric.key),
        }));

        const withValues = points.filter((p) => p.value !== null);
        const latest = withValues[withValues.length - 1] ?? null;
        const change = changeVsPrevious(ordered, metric.key);

        return (
          <Card key={metric.key}>
            <h3 className="text-muted text-xs font-bold tracking-widest uppercase">
              {metric.label}
            </h3>

            <p className="mt-1 flex flex-wrap items-baseline gap-2">
              <span className="text-2xl font-extrabold">
                {latest ? metric.format(latest.value as number, currency) : "—"}
              </span>
              {change !== null ? (
                <span
                  className={`text-sm font-semibold ${
                    change >= 0 ? "text-accent" : "text-highlight"
                  }`}
                >
                  {change >= 0 ? "+" : ""}
                  {change.toFixed(1)}% vs last month
                </span>
              ) : null}
            </p>

            <div className="mt-3">
              <KpiChart metric={metric} points={points} currency={currency} />
            </div>

            <p className="text-muted mt-2 text-xs">{metric.help}</p>
          </Card>
        );
      })}
    </div>
  );
}
