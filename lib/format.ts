const DATE_LOCALE = "en-GB";

/** "Tue 8 Sept 2026" */
export function formatSessionDate(iso: string) {
  return new Date(`${iso}T00:00:00`).toLocaleDateString(DATE_LOCALE, {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/** "September 2026" — the heading the schedule groups under. */
export function formatMonth(iso: string) {
  return new Date(`${iso}T00:00:00`).toLocaleDateString(DATE_LOCALE, {
    month: "long",
    year: "numeric",
  });
}

/** Postgres time values arrive as "08:15:00"; nobody wants to read the seconds. */
export function formatTime(value: string | null) {
  if (!value) return null;
  return value.slice(0, 5);
}

export function formatTimeRange(start: string | null, end: string | null) {
  const from = formatTime(start);
  const to = formatTime(end);
  if (from && to) return `${from}–${to}`;
  return from ?? to ?? "";
}

export function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString(DATE_LOCALE, {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** Today in the local calendar, as the YYYY-MM-DD that Postgres date columns use. */
export function todayIso() {
  const now = new Date();
  const offset = now.getTimezoneOffset() * 60_000;
  return new Date(now.getTime() - offset).toISOString().slice(0, 10);
}

export function daysBetween(fromIso: string, toIso: string) {
  const a = new Date(`${fromIso}T00:00:00`).getTime();
  const b = new Date(`${toIso}T00:00:00`).getTime();
  return Math.round((b - a) / 86_400_000);
}
