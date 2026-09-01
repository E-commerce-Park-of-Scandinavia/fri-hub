"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import {
  createSession,
  deleteSession,
  updateSession,
  type AdminState,
} from "./actions";
import {
  Badge,
  Button,
  Card,
  Field,
  Input,
  Notice,
  SectionTitle,
  Select,
  Textarea,
} from "@/components/ui";
import { formatSessionDate } from "@/lib/format";
import {
  SESSION_TYPE_LABELS,
  type Cohort,
  type Program,
  type Session,
  type SessionType,
} from "@/lib/types";

const IDLE: AdminState = { status: "idle" };
const TYPES = Object.keys(SESSION_TYPE_LABELS) as SessionType[];

export type SessionWithCohorts = Session & { cohort_ids: string[] };

function Pending({ label, busy }: { label: string; busy: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? busy : label}
    </Button>
  );
}

function Result({ state }: { state: AdminState }) {
  if (state.status === "idle" || !state.message) return null;
  return (
    <Notice tone={state.status === "error" ? "error" : "success"}>
      {state.message}
    </Notice>
  );
}

function SessionFields({
  session,
  cohorts,
}: {
  session?: SessionWithCohorts;
  cohorts: Cohort[];
}) {
  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Date">
          <Input type="date" name="date" defaultValue={session?.date ?? ""} required />
        </Field>
        <Field label="Title">
          <Input name="title" defaultValue={session?.title ?? ""} required />
        </Field>
        <Field label="Type">
          <Select
            name="session_type"
            defaultValue={session?.session_type ?? "lecture_workshop"}
          >
            {TYPES.map((type) => (
              <option key={type} value={type}>
                {SESSION_TYPE_LABELS[type]}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Status" hint="Drafts are invisible to participants.">
          <Select name="status" defaultValue={session?.status ?? "draft"}>
            <option value="draft">Draft</option>
            <option value="confirmed">Confirmed</option>
          </Select>
        </Field>
        <Field label="Start time">
          <Input
            type="time"
            name="start_time"
            defaultValue={session?.start_time?.slice(0, 5) ?? ""}
          />
        </Field>
        <Field label="End time">
          <Input
            type="time"
            name="end_time"
            defaultValue={session?.end_time?.slice(0, 5) ?? ""}
          />
        </Field>
        <Field label="Speaker name">
          <Input name="speaker_name" defaultValue={session?.speaker_name ?? ""} />
        </Field>
        <Field label="Location">
          <Input name="location" defaultValue={session?.location ?? ""} />
        </Field>
      </div>

      <Field label="Speaker bio">
        <Textarea name="speaker_bio" rows={3} defaultValue={session?.speaker_bio ?? ""} />
      </Field>

      <Field
        label="Slides URL"
        hint="Google Slides → File → Share → Publish to web → Embed. Paste the src URL."
      >
        <Input name="slides_url" defaultValue={session?.slides_url ?? ""} />
      </Field>

      <Field
        label="Agenda blocks (JSON)"
        hint='An array of {"start_time","end_time","label","description"}.'
      >
        <Textarea
          name="agenda_blocks"
          rows={8}
          className="font-mono text-xs"
          defaultValue={JSON.stringify(session?.agenda_blocks ?? [], null, 2)}
        />
      </Field>

      <fieldset>
        <legend className="mb-1 block text-sm font-medium">Cohorts attending</legend>
        <p className="text-muted mb-2 text-xs">
          Tick both when the two cohorts share the day.
        </p>
        <div className="flex flex-wrap gap-4">
          {cohorts.map((cohort) => (
            <label key={cohort.id} className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                name="cohort_ids"
                value={cohort.id}
                defaultChecked={session?.cohort_ids.includes(cohort.id) ?? false}
              />
              {cohort.name}
            </label>
          ))}
        </div>
      </fieldset>
    </>
  );
}

function AddForm({
  cohorts,
  programs,
}: {
  cohorts: Cohort[];
  programs: Program[];
}) {
  const [state, action] = useActionState(createSession, IDLE);

  return (
    <Card className="mb-8">
      <SectionTitle>Add a session</SectionTitle>
      <form action={action} className="space-y-4">
        {programs.length > 1 ? (
          <Field label="Programme">
            <Select name="program_id" defaultValue={programs[0]?.id}>
              {programs.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </Select>
          </Field>
        ) : (
          <input type="hidden" name="program_id" value={programs[0]?.id ?? ""} />
        )}
        <SessionFields cohorts={cohorts} />
        <Result state={state} />
        <Pending label="Create session" busy="Creating…" />
      </form>
    </Card>
  );
}

function EditRow({
  session,
  cohorts,
}: {
  session: SessionWithCohorts;
  cohorts: Cohort[];
}) {
  const [editState, editAction] = useActionState(updateSession, IDLE);
  const [deleteState, deleteAction] = useActionState(deleteSession, IDLE);

  return (
    <details className="border-line border-t">
      <summary className="hover:bg-paper flex cursor-pointer flex-wrap items-center gap-3 px-4 py-3">
        <span className="text-muted w-40 shrink-0 text-sm">
          {formatSessionDate(session.date)}
        </span>
        <span className="min-w-0 flex-1 text-sm font-medium">{session.title}</span>
        <Badge>{SESSION_TYPE_LABELS[session.session_type]}</Badge>
        {session.status === "draft" ? <Badge tone="accent">Draft</Badge> : null}
        <span className="text-muted text-xs">
          {session.cohort_ids.length} cohort
          {session.cohort_ids.length === 1 ? "" : "s"}
        </span>
      </summary>

      <div className="bg-paper space-y-4 px-4 py-4">
        <form action={editAction} className="space-y-4">
          <input type="hidden" name="id" value={session.id} />
          <SessionFields session={session} cohorts={cohorts} />
          <Result state={editState} />
          <Pending label="Save changes" busy="Saving…" />
        </form>

        <form action={deleteAction} className="border-line border-t pt-4">
          <input type="hidden" name="id" value={session.id} />
          <Button type="submit" tone="danger">
            Delete session
          </Button>
        </form>
        <Result state={deleteState} />
      </div>
    </details>
  );
}

export default function SessionsAdmin({
  sessions,
  cohorts,
  programs,
}: {
  sessions: SessionWithCohorts[];
  cohorts: Cohort[];
  programs: Program[];
}) {
  return (
    <>
      <AddForm cohorts={cohorts} programs={programs} />

      <SectionTitle>All sessions ({sessions.length})</SectionTitle>
      <div className="border-line bg-surface overflow-hidden rounded-lg border">
        {sessions.length === 0 ? (
          <p className="text-muted px-4 py-6 text-sm">No sessions yet.</p>
        ) : (
          sessions.map((session) => (
            <EditRow key={session.id} session={session} cohorts={cohorts} />
          ))
        )}
      </div>
    </>
  );
}
