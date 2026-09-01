"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { createCohort, updateCohort, type AdminState } from "./actions";
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
import type { Cohort, Program } from "@/lib/types";

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

function CohortFields({ cohort }: { cohort?: Cohort }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Field label="Name" hint='Naming convention: "Autumn 2026", "Spring 2026".'>
        <Input name="name" defaultValue={cohort?.name ?? ""} required />
      </Field>
      <Field label="Intake season">
        <Select name="intake_season" defaultValue={cohort?.intake_season ?? "autumn"}>
          <option value="spring">Spring</option>
          <option value="autumn">Autumn</option>
        </Select>
      </Field>
      <Field label="Start date">
        <Input type="date" name="start_date" defaultValue={cohort?.start_date ?? ""} />
      </Field>
      <Field label="Expected end date">
        <Input
          type="date"
          name="expected_end_date"
          defaultValue={cohort?.expected_end_date ?? ""}
        />
      </Field>
      <Field label="Status">
        <Select name="status" defaultValue={cohort?.status ?? "active"}>
          <option value="active">Active</option>
          <option value="alumni">Alumni</option>
          <option value="closed">Closed</option>
        </Select>
      </Field>
      <Field label="Slack channel link">
        <Input
          name="slack_channel_url"
          placeholder="https://app.slack.com/client/…"
          defaultValue={cohort?.slack_channel_url ?? ""}
        />
      </Field>
    </div>
  );
}

export default function CohortsAdmin({
  cohorts,
  programs,
}: {
  cohorts: Cohort[];
  programs: Program[];
}) {
  const [addState, addAction] = useActionState(createCohort, IDLE);

  return (
    <>
      <Card className="mb-8">
        <SectionTitle>Add a cohort</SectionTitle>
        <form action={addAction} className="space-y-4">
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
          <CohortFields />
          <Result state={addState} />
          <Pending label="Create cohort" busy="Creating…" />
        </form>
      </Card>

      <SectionTitle>All cohorts ({cohorts.length})</SectionTitle>
      <div className="border-line bg-surface overflow-hidden rounded-lg border">
        {cohorts.length === 0 ? (
          <p className="text-muted px-4 py-6 text-sm">No cohorts yet.</p>
        ) : (
          cohorts.map((cohort) => <CohortRow key={cohort.id} cohort={cohort} />)
        )}
      </div>
    </>
  );
}

function CohortRow({ cohort }: { cohort: Cohort }) {
  const [state, action] = useActionState(updateCohort, IDLE);

  return (
    <details className="border-line border-t">
      <summary className="hover:bg-paper flex cursor-pointer flex-wrap items-center gap-3 px-4 py-3">
        <span className="min-w-0 flex-1 text-sm font-medium">{cohort.name}</span>
        <Badge tone={cohort.status === "active" ? "accent" : "neutral"}>
          {cohort.status}
        </Badge>
        <span className="text-muted text-xs">
          {cohort.start_date ?? "—"} → {cohort.expected_end_date ?? "—"}
        </span>
      </summary>

      <form action={action} className="bg-paper space-y-4 px-4 py-4">
        <input type="hidden" name="id" value={cohort.id} />
        <CohortFields cohort={cohort} />
        <Result state={state} />
        <Pending label="Save changes" busy="Saving…" />
      </form>
    </details>
  );
}
