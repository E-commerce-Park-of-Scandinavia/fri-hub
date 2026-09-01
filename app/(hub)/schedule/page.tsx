import { SessionCard } from "@/components/session-card";
import { EmptyState, PageHeader, SectionTitle } from "@/components/ui";
import {
  getCohort,
  getMySessions,
  groupSessionsByMonth,
  requireParticipant,
} from "@/lib/data";
import { formatMonth, todayIso } from "@/lib/format";

export default async function SchedulePage() {
  const participant = await requireParticipant();
  const cohort = participant.home_cohort_id
    ? await getCohort(participant.home_cohort_id)
    : null;
  const sessions = await getMySessions();
  const groups = groupSessionsByMonth(sessions);
  const today = todayIso();

  return (
    <>
      <PageHeader
        title="Schedule"
        lead={
          cohort
            ? `Every session ${cohort.name} attends, including the ones shared with the other cohort.`
            : "Your sessions."
        }
      />

      {groups.length === 0 ? (
        <EmptyState>No sessions have been published for your cohort yet.</EmptyState>
      ) : (
        <div className="space-y-8">
          {groups.map(({ month, items }) => (
            <section key={month}>
              <SectionTitle>{formatMonth(`${month}-01`)}</SectionTitle>
              <div className="grid gap-3 sm:grid-cols-2">
                {items.map((session) => (
                  <SessionCard
                    key={session.id}
                    session={session}
                    highlight={session.date === today}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </>
  );
}
