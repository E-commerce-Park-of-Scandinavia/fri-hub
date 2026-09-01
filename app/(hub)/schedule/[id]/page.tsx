import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge, Card, PageHeader, SectionTitle } from "@/components/ui";
import { getKnowledgeItemsForSession, getSession } from "@/lib/data";
import { formatSessionDate, formatTimeRange } from "@/lib/format";
import { KNOWLEDGE_CATEGORY_LABELS, SESSION_TYPE_LABELS } from "@/lib/types";

/**
 * Only ever frame a Google Slides "publish to web" URL. Anything else is shown
 * as a plain link — an arbitrary URL in an iframe is not worth the risk.
 */
function slidesEmbedUrl(raw: string | null) {
  if (!raw) return null;
  try {
    const url = new URL(raw);
    if (url.hostname !== "docs.google.com") return null;
    return url.toString();
  } catch {
    return null;
  }
}

export default async function SessionDetailPage({
  params,
}: PageProps<"/schedule/[id]">) {
  const { id } = await params;
  const session = await getSession(id);
  if (!session) notFound();

  const materials = await getKnowledgeItemsForSession(session.id);
  const embed = slidesEmbedUrl(session.slides_url);
  const agenda = session.agenda_blocks ?? [];

  return (
    <>
      <Link href="/schedule" className="text-muted mb-4 inline-block text-sm underline">
        ← Back to schedule
      </Link>

      <PageHeader
        title={session.title}
        lead={
          <>
            {formatSessionDate(session.date)} ·{" "}
            {formatTimeRange(session.start_time, session.end_time)}
            {session.location ? ` · ${session.location}` : ""}
          </>
        }
        action={<Badge tone="accent">{SESSION_TYPE_LABELS[session.session_type]}</Badge>}
      />

      <div className="grid gap-8 lg:grid-cols-[1.4fr_1fr]">
        <div className="space-y-8">
          <section>
            <SectionTitle>Agenda</SectionTitle>
            {agenda.length === 0 ? (
              <p className="text-muted text-sm">
                The agenda for this day has not been published yet.
              </p>
            ) : (
              <ol className="border-line bg-surface divide-line divide-y rounded-lg border">
                {agenda.map((block, i) => (
                  <li key={`${block.label}-${i}`} className="flex gap-4 px-4 py-3">
                    <span className="text-muted w-24 shrink-0 text-sm tabular-nums">
                      {formatTimeRange(block.start_time, block.end_time)}
                    </span>
                    <span>
                      <span className="block text-sm font-medium">{block.label}</span>
                      {block.description ? (
                        <span className="text-muted block text-sm">
                          {block.description}
                        </span>
                      ) : null}
                    </span>
                  </li>
                ))}
              </ol>
            )}
          </section>

          {embed ? (
            <section>
              <SectionTitle>Slides</SectionTitle>
              <div className="border-line overflow-hidden rounded-lg border">
                <iframe
                  src={embed}
                  title={`Slides for ${session.title}`}
                  className="aspect-video w-full"
                  allowFullScreen
                />
              </div>
            </section>
          ) : session.slides_url ? (
            <section>
              <SectionTitle>Slides</SectionTitle>
              <a
                href={session.slides_url}
                target="_blank"
                rel="noreferrer noopener"
                className="text-accent text-sm underline"
              >
                Open the slides
              </a>
            </section>
          ) : null}
        </div>

        <aside className="space-y-6">
          {session.speaker_name ? (
            <Card>
              <SectionTitle>Speaker</SectionTitle>
              <p className="font-medium">{session.speaker_name}</p>
              {session.speaker_bio ? (
                <p className="text-muted prose-plain mt-2 text-sm">
                  {session.speaker_bio}
                </p>
              ) : null}
            </Card>
          ) : null}

          <Card>
            <SectionTitle>Material for this session</SectionTitle>
            {materials.length === 0 ? (
              <p className="text-muted text-sm">Nothing attached yet.</p>
            ) : (
              <ul className="space-y-2">
                {materials.map((item) => (
                  <li key={item.id}>
                    <a
                      href={item.drive_url}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="text-accent text-sm underline"
                    >
                      {item.title}
                    </a>
                    <span className="text-muted block text-xs">
                      {KNOWLEDGE_CATEGORY_LABELS[item.category]}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </aside>
      </div>
    </>
  );
}
