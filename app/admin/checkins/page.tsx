import { Badge, Card, EmptyState, PageHeader, SectionTitle } from "@/components/ui";
import { requireAdmin } from "@/lib/data";
import { formatDateTime, formatSessionDate } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";
import type {
  Cohort,
  FocusCircleCheckin,
  Participant,
  Questionnaire,
  QuestionnaireResponse,
  Session,
} from "@/lib/types";

/** Read-only by design: this is a window onto what people wrote, not an editor. */
export default async function AdminCheckinsPage() {
  await requireAdmin();
  const supabase = await createClient();

  const [
    { data: checkins },
    { data: participants },
    { data: sessions },
    { data: cohorts },
    { data: questionnaires },
    { data: responses },
  ] = await Promise.all([
    supabase
      .from("focus_circle_checkins")
      .select("*")
      .order("submitted_at", { ascending: false }),
    supabase.from("participants").select("*"),
    supabase.from("sessions").select("*"),
    supabase.from("cohorts").select("*"),
    supabase.from("questionnaires").select("*").order("title"),
    supabase
      .from("questionnaire_responses")
      .select("*")
      .order("submitted_at", { ascending: false }),
  ]);

  const peopleById = new Map(
    ((participants as Participant[] | null) ?? []).map((p) => [p.id, p]),
  );
  const sessionsById = new Map(
    ((sessions as Session[] | null) ?? []).map((s) => [s.id, s]),
  );
  const cohortsById = new Map(
    ((cohorts as Cohort[] | null) ?? []).map((c) => [c.id, c]),
  );
  const questionnairesById = new Map(
    ((questionnaires as Questionnaire[] | null) ?? []).map((q) => [q.id, q]),
  );

  const rows = (checkins as FocusCircleCheckin[] | null) ?? [];
  const answers = (responses as QuestionnaireResponse[] | null) ?? [];

  return (
    <>
      <PageHeader
        title="Check-ins & responses"
        lead="Everything participants have written, across every cohort."
      />

      <section className="mb-12">
        <SectionTitle>Focus Circle check-ins ({rows.length})</SectionTitle>
        {rows.length === 0 ? (
          <EmptyState>Nothing submitted yet.</EmptyState>
        ) : (
          <div className="space-y-4">
            {rows.map((checkin) => {
              const person = peopleById.get(checkin.participant_id);
              const session = sessionsById.get(checkin.session_id);
              const cohort = person?.home_cohort_id
                ? cohortsById.get(person.home_cohort_id)
                : null;

              return (
                <Card key={checkin.id}>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium">
                      {person?.full_name ?? "Unknown participant"}
                    </span>
                    {cohort ? <Badge>{cohort.name}</Badge> : null}
                    <span className="text-muted ml-auto text-xs">
                      {session
                        ? formatSessionDate(session.date)
                        : formatDateTime(checkin.submitted_at)}
                    </span>
                  </div>
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

      <section>
        <SectionTitle>Questionnaire responses ({answers.length})</SectionTitle>
        {answers.length === 0 ? (
          <EmptyState>No questionnaire responses yet.</EmptyState>
        ) : (
          <div className="space-y-4">
            {answers.map((response) => {
              const person = peopleById.get(response.participant_id);
              const questionnaire = questionnairesById.get(response.questionnaire_id);
              const labels = new Map(
                (questionnaire?.questions ?? []).map((q) => [q.key, q.label]),
              );

              return (
                <Card key={response.id}>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium">
                      {person?.full_name ?? "Unknown participant"}
                    </span>
                    <Badge tone="accent">{questionnaire?.title ?? "Questionnaire"}</Badge>
                    <span className="text-muted ml-auto text-xs">
                      {formatDateTime(response.submitted_at)}
                    </span>
                  </div>
                  <dl className="mt-3 space-y-3">
                    {Object.entries(response.answers ?? {}).map(([key, value]) => (
                      <Entry key={key} label={labels.get(key) ?? key} value={String(value)} />
                    ))}
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
