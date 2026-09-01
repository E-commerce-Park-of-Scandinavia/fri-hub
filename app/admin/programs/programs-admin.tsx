"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import {
  createProgram,
  updateProgram,
  type AdminState,
} from "@/app/admin/cohorts/actions";
import {
  Button,
  Card,
  Field,
  Input,
  Notice,
  SectionTitle,
  Textarea,
} from "@/components/ui";
import type { Program } from "@/lib/types";

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

function ProgramFields({ program }: { program?: Program }) {
  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Name">
          <Input name="name" defaultValue={program?.name ?? ""} required />
        </Field>
        <Field label="Slug" hint="Lowercase, hyphenated. Used in URLs later.">
          <Input name="slug" defaultValue={program?.slug ?? ""} required />
        </Field>
      </div>
      <Field label="Description">
        <Textarea name="description" rows={3} defaultValue={program?.description ?? ""} />
      </Field>
      <Field
        label="Slack workspace invite link"
        hint="Shown on the Community page to anyone not yet in the workspace."
      >
        <Input
          name="slack_invite_url"
          placeholder="https://join.slack.com/…"
          defaultValue={program?.slack_invite_url ?? ""}
        />
      </Field>
    </>
  );
}

export default function ProgramsAdmin({ programs }: { programs: Program[] }) {
  const [addState, addAction] = useActionState(createProgram, IDLE);

  return (
    <>
      <Card className="mb-8">
        <SectionTitle>Add a programme</SectionTitle>
        <form action={addAction} className="space-y-4">
          <ProgramFields />
          <Result state={addState} />
          <Pending label="Create programme" busy="Creating…" />
        </form>
      </Card>

      <SectionTitle>All programmes ({programs.length})</SectionTitle>
      <div className="border-line bg-surface overflow-hidden rounded-lg border">
        {programs.length === 0 ? (
          <p className="text-muted px-4 py-6 text-sm">No programmes yet.</p>
        ) : (
          programs.map((program) => (
            <ProgramRow key={program.id} program={program} />
          ))
        )}
      </div>
    </>
  );
}

function ProgramRow({ program }: { program: Program }) {
  const [state, action] = useActionState(updateProgram, IDLE);

  return (
    <details className="border-line border-t">
      <summary className="hover:bg-paper flex cursor-pointer items-center gap-3 px-4 py-3">
        <span className="flex-1 text-sm font-medium">{program.name}</span>
        <span className="text-muted text-xs">{program.slug}</span>
      </summary>

      <form action={action} className="bg-paper space-y-4 px-4 py-4">
        <input type="hidden" name="id" value={program.id} />
        <ProgramFields program={program} />
        <Result state={state} />
        <Pending label="Save changes" busy="Saving…" />
      </form>
    </details>
  );
}
