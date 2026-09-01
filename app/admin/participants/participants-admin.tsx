"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import {
  createParticipant,
  deleteParticipant,
  sendInvite,
  updateParticipant,
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
} from "@/components/ui";
import type { Cohort, Participant } from "@/lib/types";

const IDLE: AdminState = { status: "idle" };

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

function CohortSelect({
  cohorts,
  value,
}: {
  cohorts: Cohort[];
  value?: string | null;
}) {
  return (
    <Select name="home_cohort_id" defaultValue={value ?? ""}>
      <option value="">— no cohort —</option>
      {cohorts.map((c) => (
        <option key={c.id} value={c.id}>
          {c.name}
        </option>
      ))}
    </Select>
  );
}

function AddForm({ cohorts }: { cohorts: Cohort[] }) {
  const [state, action] = useActionState(createParticipant, IDLE);

  return (
    <Card className="mb-8">
      <SectionTitle>Add a participant</SectionTitle>
      <form action={action} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Full name">
            <Input name="full_name" required />
          </Field>
          <Field label="Email">
            <Input name="email" type="email" required />
          </Field>
          <Field label="Company">
            <Input name="company_name" />
          </Field>
          <Field label="Home cohort">
            <CohortSelect cohorts={cohorts} />
          </Field>
          <Field label="Role" hint="Admins see every cohort and can edit everything.">
            <Select name="role" defaultValue="participant">
              <option value="participant">Participant</option>
              <option value="admin">Admin</option>
            </Select>
          </Field>
        </div>
        <Result state={state} />
        <Pending label="Add participant" busy="Adding…" />
      </form>
    </Card>
  );
}

function EditRow({
  person,
  cohorts,
}: {
  person: Participant;
  cohorts: Cohort[];
}) {
  const [editState, editAction] = useActionState(updateParticipant, IDLE);
  const [inviteState, inviteAction] = useActionState(sendInvite, IDLE);
  const [deleteState, deleteAction] = useActionState(deleteParticipant, IDLE);

  return (
    <details className="border-line group border-t">
      <summary className="hover:bg-paper flex cursor-pointer flex-wrap items-center gap-3 px-4 py-3">
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-medium">{person.full_name}</span>
          <span className="text-muted block text-xs">{person.email}</span>
        </span>
        {person.role === "admin" ? <Badge tone="accent">Admin</Badge> : null}
        {person.status === "alumni" ? <Badge>Alumni</Badge> : null}
        <span className="text-muted text-xs">
          {person.auth_user_id ? "Signed in before" : "Not yet signed in"}
        </span>
      </summary>

      <div className="bg-paper space-y-4 px-4 py-4">
        <form action={editAction} className="space-y-4">
          <input type="hidden" name="id" value={person.id} />
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Full name">
              <Input name="full_name" defaultValue={person.full_name} required />
            </Field>
            <Field label="Email">
              <Input name="email" type="email" defaultValue={person.email} required />
            </Field>
            <Field label="Company">
              <Input name="company_name" defaultValue={person.company_name ?? ""} />
            </Field>
            <Field label="Company website">
              <Input
                name="company_website"
                defaultValue={person.company_website ?? ""}
              />
            </Field>
            <Field label="Home cohort">
              <CohortSelect cohorts={cohorts} value={person.home_cohort_id} />
            </Field>
            <Field label="Role">
              <Select name="role" defaultValue={person.role}>
                <option value="participant">Participant</option>
                <option value="admin">Admin</option>
              </Select>
            </Field>
            <Field
              label="Status"
              hint="Alumni keep read access forever, but stop writing check-ins."
            >
              <Select name="status" defaultValue={person.status}>
                <option value="active">Active</option>
                <option value="alumni">Alumni</option>
              </Select>
            </Field>
          </div>
          <Result state={editState} />
          <Pending label="Save changes" busy="Saving…" />
        </form>

        <div className="border-line flex flex-wrap items-center gap-3 border-t pt-4">
          <form action={inviteAction}>
            <input type="hidden" name="email" value={person.email} />
            <Button type="submit" tone="secondary">
              Send invite email
            </Button>
          </form>
          <form action={deleteAction}>
            <input type="hidden" name="id" value={person.id} />
            <Button type="submit" tone="danger">
              Remove
            </Button>
          </form>
        </div>
        <Result state={inviteState} />
        <Result state={deleteState} />
      </div>
    </details>
  );
}

export default function ParticipantsAdmin({
  participants,
  cohorts,
}: {
  participants: Participant[];
  cohorts: Cohort[];
}) {
  return (
    <>
      <AddForm cohorts={cohorts} />

      <SectionTitle>All participants ({participants.length})</SectionTitle>
      <div className="border-line bg-surface overflow-hidden rounded-lg border">
        {participants.length === 0 ? (
          <p className="text-muted px-4 py-6 text-sm">Nobody added yet.</p>
        ) : (
          participants.map((person) => (
            <EditRow key={person.id} person={person} cohorts={cohorts} />
          ))
        )}
      </div>
    </>
  );
}
