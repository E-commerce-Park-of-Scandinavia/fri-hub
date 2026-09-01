import CheckinForm from "./checkin-form";
import { Card, EmptyState, Notice, PageHeader, SectionTitle } from "@/components/ui";
import {
  getMyCheckins,
  getMySessions,
  getOpenCheckinSession,
  requireParticipant,
} from "@/lib/data";
import { formatDateTime, formatSessionDate } from "@/lib/format";
import type { FocusCircleCheckin } from "@/lib/types";

export default async function FocusCirclePage() {
  const participant = await requireParticipant();
  const [openSession, checkins, sessions] = await Promise.all([
    getOpenCheckinSession(),
    getMyCheckins() as Promise<FocusCircleCheckin[]>,
    getMySessions(),
  ]);

  const sessionDates = new Map(sessions.map((s) => [s.id, s]));
  const existing = openSession
    ? (checkins.find((c) => c.session_id === openSession.id) ?? null)
    : null;
  const history = checkins.filter((c) => c.id !== existing?.id);

  return (
    <>
      <PageHeader
        title="Focus Circle"
        lead="Look back, then commit to a focus for the next two weeks."
      />

      <section className="mb-12">
        <SectionTitle>This round</SectionTitle>
        {participant.status === "alumni" ? (
          <Notice>
            As an alumni you keep access to all your past check-ins, but there are
            no further sessions to check into.
          </Notice>
        ) : openSession ? (
          <Card>
            <p className="text-muted mb-5 text-sm">
              {formatSessionDate(openSession.date)} · {openSession.title}
            </p>
            <CheckinForm sessionId={openSession.id} existing={existing} />
          </Card>
        ) : (
          <EmptyState>
            No Focus Circle is open right now. The form opens on the day of a
            session that holds one, and stays open for a week afterwards.
          </EmptyState>
        )}
      </section>

      <section>
        <SectionTitle>Your past check-ins</SectionTitle>
        {history.length === 0 ? (
          <EmptyState>You have not submitted a check-in yet.</EmptyState>
        ) : (
          <div className="space-y-4">
            {history.map((checkin) => {
              const session = sessionDates.get(checkin.session_id);
              return (
                <Card key={checkin.id}>
                  <p className="text-muted text-sm">
                    {session
                      ? `${formatSessionDate(session.date)} · ${session.title}`
                      : formatDateTime(checkin.submitted_at)}
                  </p>
                  <dl className="mt-3 space-y-3">
                    <Entry label="Looking back" value={checkin.look_back_notes} />
                    <Entry
                      label="Focus for the next two weeks"
                      value={checkin.focus_next_two_weeks}
                    />
                    <Entry label="Committed goal" value={checkin.committed_goal} />
                  </dl>
                </Card>
              );
            })}
          </div>
        )}
      </section>
    </>
  );
}

function Entry({ label, value }: { label: string; value: string | null }) {
  if (!value) return null;
  return (
    <div>
      <dt className="text-muted text-xs font-semibold tracking-wide uppercase">
        {label}
      </dt>
      <dd className="prose-plain mt-0.5 text-sm">{value}</dd>
    </div>
  );
}
