export type KpiEntry = {
  id: string;
  participant_id: string;
  period: string; // always the first of the month
  total_sales: number | null;
  orders: number | null;
  sessions: number | null;
  notes: string | null;
};

export type KpiMetric = {
  key: "total_sales" | "orders" | "sessions" | "conversion_rate" | "aov";
  label: string;
  help: string;
  derived: boolean;
  format: (value: number, currency: string) => string;
};

const number = (value: number) =>
  value.toLocaleString("en-GB", { maximumFractionDigits: 0 });

const money = (value: number, currency: string) =>
  `${value.toLocaleString("en-GB", { maximumFractionDigits: 0 })} ${currency}`;

export const KPI_METRICS: KpiMetric[] = [
  {
    key: "total_sales",
    label: "Total sales",
    help: "Sales for the calendar month as your shop dashboard shows it. Keep the same definition every month.",
    derived: false,
    format: money,
  },
  {
    key: "orders",
    label: "Orders",
    help: "Completed orders in that month.",
    derived: false,
    format: number,
  },
  {
    key: "sessions",
    label: "Sessions",
    help: "Visits to your webshop in that month. Use the same source every month — GA4 is best.",
    derived: false,
    format: number,
  },
  {
    key: "conversion_rate",
    label: "Conversion rate",
    help: "Orders divided by sessions. Calculated — one formula for everyone, so the group can compare.",
    derived: true,
    format: (value) => `${value.toFixed(2)}%`,
  },
  {
    key: "aov",
    label: "Average order value",
    help: "Total sales divided by orders. Calculated.",
    derived: true,
    format: money,
  },
];

/**
 * Derived values are computed here and nowhere else, so every founder's
 * conversion rate and AOV mean the same thing. A missing input gives null
 * rather than zero — the tracker is explicit that empty and zero differ.
 */
export function metricValue(entry: KpiEntry, key: KpiMetric["key"]): number | null {
  switch (key) {
    case "conversion_rate":
      return entry.orders !== null && entry.sessions
        ? (entry.orders / entry.sessions) * 100
        : null;
    case "aov":
      return entry.total_sales !== null && entry.orders
        ? entry.total_sales / entry.orders
        : null;
    default:
      return entry[key];
  }
}

/** "2026-09-01" → "Sep 2026" */
export function formatPeriod(period: string) {
  return new Date(`${period}T00:00:00`).toLocaleDateString("en-GB", {
    month: "short",
    year: "numeric",
  });
}

/** "2026-09-01" → "September 2026" */
export function formatPeriodLong(period: string) {
  return new Date(`${period}T00:00:00`).toLocaleDateString("en-GB", {
    month: "long",
    year: "numeric",
  });
}

/** First of the current month, as the date column stores it. */
export function currentPeriod() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
}

/** The month before a given period. */
export function previousPeriod(period: string) {
  const d = new Date(`${period}T00:00:00`);
  d.setMonth(d.getMonth() - 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
}

/**
 * Every month from September 2026 (the first month founders report) up to the
 * current one — so the form offers real choices rather than a free-text date.
 */
export function selectablePeriods(from = "2026-09-01") {
  const periods: string[] = [];
  const end = new Date(`${currentPeriod()}T00:00:00`);
  const cursor = new Date(`${from}T00:00:00`);
  while (cursor <= end) {
    periods.push(
      `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, "0")}-01`,
    );
    cursor.setMonth(cursor.getMonth() + 1);
  }
  return periods.reverse();
}

/** Month-on-month change, as a percentage, or null when it cannot be computed. */
export function changeVsPrevious(
  entries: KpiEntry[],
  key: KpiMetric["key"],
): number | null {
  if (entries.length < 2) return null;
  const latest = metricValue(entries[entries.length - 1], key);
  const before = metricValue(entries[entries.length - 2], key);
  if (latest === null || before === null || before === 0) return null;
  return ((latest - before) / before) * 100;
}
