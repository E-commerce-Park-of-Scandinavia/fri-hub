"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { setCohortChannel, setSlackInvite, type AdminState } from "./actions";
import {
  Badge,
  Button,
  Card,
  Field,
  Input,
  Notice,
  SectionTitle,
} from "@/components/ui";
import type { Cohort, Program } from "@/lib/types";

const IDLE: AdminState = { status: "idle" };

function isPlaceholder(url: string | null) {
  return url === null || url.includes("REPLACE-ME");
}

function SaveButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Saving…" : "Save link"}
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

function InviteForm({ program }: { program: Program }) {
  const [state, action] = useActionState(setSlackInvite, IDLE);
  const unset = isPlaceholder(program.slack_invite_url);

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="program_id" value={program.id} />
      <Field
        label={`Workspace invite — ${program.name}`}
        hint="Shown to anyone not yet in the Slack workspace."
      >
        <Input
          name="url"
          placeholder="join.slack.com/t/…"
          defaultValue={unset ? "" : (program.slack_invite_url ?? "")}
        />
      </Field>
      {unset ? <Badge>Not set yet</Badge> : null}
      <Result state={state} />
      <SaveButton />
    </form>
  );
}

function ChannelForm({ cohort }: { cohort: Cohort }) {
  const [state, action] = useActionState(setCohortChannel, IDLE);
  const unset = isPlaceholder(cohort.slack_channel_url);

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="cohort_id" value={cohort.id} />
      <Field
        label={`Channel for ${cohort.name}`}
        hint="The private channel this cohort uses day to day."
      >
        <Input
          name="url"
          placeholder="app.slack.com/client/…"
          defaultValue={unset ? "" : (cohort.slack_channel_url ?? "")}
        />
      </Field>
      {unset ? <Badge>Not set yet</Badge> : null}
      <Result state={state} />
      <SaveButton />
    </form>
  );
}

export default function CommunityAdmin({
  programs,
  cohorts,
}: {
  programs: Program[];
  cohorts: Cohort[];
}) {
  return (
    <>
      <Card className="mb-6">
        <SectionTitle>Where to find a Slack link</SectionTitle>
        <ul className="text-muted list-disc space-y-1 pl-5 text-sm">
          <li>
            <strong className="text-ink">A channel:</strong> open it in Slack,
            click the channel name at the top, then <em>Copy link</em>.
          </li>
          <li>
            <strong className="text-ink">The workspace invite:</strong> in Slack,{" "}
            <em>Invite people</em> → <em>Share an invite link</em>. These expire,
            so you may need to refresh it between intakes.
          </li>
        </ul>
        <p className="text-muted mt-3 text-sm">
          You can paste a bare address — the <code>https://</code> is added for you.
          Leave a field empty to remove the link; participants then see a note
          telling them to email instead of a button that goes nowhere.
        </p>
      </Card>

      <Card className="mb-6">
        <SectionTitle>Workspace invite</SectionTitle>
        <div className="space-y-6">
          {programs.map((program) => (
            <InviteForm key={program.id} program={program} />
          ))}
        </div>
      </Card>

      <Card>
        <SectionTitle>Cohort channels</SectionTitle>
        <div className="space-y-8">
          {cohorts.map((cohort) => (
            <ChannelForm key={cohort.id} cohort={cohort} />
          ))}
        </div>
      </Card>
    </>
  );
}
