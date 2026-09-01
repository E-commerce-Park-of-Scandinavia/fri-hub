import Link from "next/link";
import { Badge } from "@/components/ui";
import { formatSessionDate, formatTimeRange } from "@/lib/format";
import { SESSION_TYPE_LABELS, type Session } from "@/lib/types";

export function SessionCard({
  session,
  highlight = false,
}: {
  session: Session;
  highlight?: boolean;
}) {
  return (
    <Link
      href={`/schedule/${session.id}`}
      className={`border-line bg-surface hover:border-accent/40 block rounded-lg border p-4 transition-colors ${
        highlight ? "ring-accent/20 ring-2" : ""
      }`}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-muted text-sm">{formatSessionDate(session.date)}</p>
        <Badge tone={highlight ? "accent" : "neutral"}>
          {SESSION_TYPE_LABELS[session.session_type]}
        </Badge>
      </div>
      <h3 className="mt-1 font-medium">{session.title}</h3>
      <p className="text-muted mt-1 text-sm">
        {formatTimeRange(session.start_time, session.end_time)}
        {session.speaker_name ? ` · ${session.speaker_name}` : ""}
      </p>
    </Link>
  );
}
