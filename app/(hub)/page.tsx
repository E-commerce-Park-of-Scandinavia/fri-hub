import Link from "next/link";
import { SessionCard } from "@/components/session-card";
import {
  ButtonLink,
  Card,
  EmptyState,
  PageHeader,
  SectionTitle,
} from "@/components/ui";
import {
  getKnowledgeHubItems,
  getMyCheckins,
  getMySessions,
  getOpenCheckinSession,
  requireParticipant,
  splitSessionsByDate,
} from "@/lib/data";
import { formatSessionDate } from "@/lib/format";
import { KNOWLEDGE_CATEGORY_LABELS } from "@/lib/types";

export default async function HomePage() {
  const participant = await requireParticipant();
  const [sessions, openSession, checkins, knowledge] = await Promise.all([
    getMySessions(),
    getOpenCheckinSession(),
    getMyCheckins(),
    getKnowledgeHubItems(),
  ]);

  const { next } = splitSessionsByDate(sessions);
  const alreadyCheckedIn =
    openSession !== null &&
    checkins.some((c) => c.session_id === openSession.id);
  const showCheckinPrompt =
    openSession !== null && !alreadyCheckedIn && participant.status === "active";

  const firstName = participant.full_name.split(" ")[0];

  return (
    <>
      <PageHeader
        title={`Hello, ${firstName}`}
        lead="Everything that needs your attention right now."
      />

      {showCheckinPrompt ? (
        <Card className="border-accent/30 bg-accent-soft mb-8">
          <SectionTitle>Focus Circle is open</SectionTitle>
          <p className="text-sm">
            Your check-in for{" "}
            <strong>{formatSessionDate(openSession.date)}</strong> has not been
            submitted yet.
          </p>
          <div className="mt-4">
            <ButtonLink href="/focus-circle">Write my check-in</ButtonLink>
          </div>
        </Card>
      ) : null}

      <section className="mb-10">
        <SectionTitle>Next session</SectionTitle>
        {next ? (
          <SessionCard session={next} highlight />
        ) : (
          <EmptyState>
            No sessions scheduled yet. When Sylvia confirms the next term it will
            appear here.
          </EmptyState>
        )}
      </section>

      <section>
        <div className="mb-3 flex items-baseline justify-between">
          <SectionTitle>Recently added to the Knowledge Hub</SectionTitle>
          <Link href="/knowledge-hub" className="text-accent text-sm underline">
            See all
          </Link>
        </div>
        {knowledge.length === 0 ? (
          <EmptyState>Nothing has been added yet.</EmptyState>
        ) : (
          <ul className="border-line bg-surface divide-line divide-y rounded-lg border">
            {knowledge.slice(0, 5).map((item) => (
              <li key={item.id}>
                <a
                  href={item.drive_url}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="hover:bg-paper flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-sm"
                >
                  <span className="font-medium">{item.title}</span>
                  <span className="text-muted text-xs">
                    {KNOWLEDGE_CATEGORY_LABELS[item.category]}
                  </span>
                </a>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
