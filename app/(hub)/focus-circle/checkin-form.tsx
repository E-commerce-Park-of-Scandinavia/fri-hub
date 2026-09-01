"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { saveCheckin, type CheckinState } from "./actions";
import { Button, Field, Notice, Textarea } from "@/components/ui";
import type { FocusCircleCheckin } from "@/lib/types";

function SubmitButton({ existing }: { existing: boolean }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Saving…" : existing ? "Update my check-in" : "Submit check-in"}
    </Button>
  );
}

export default function CheckinForm({
  sessionId,
  existing,
}: {
  sessionId: string;
  existing: FocusCircleCheckin | null;
}) {
  const [state, formAction] = useActionState<CheckinState, FormData>(saveCheckin, {
    status: "idle",
  });

  return (
    <form action={formAction} className="space-y-5">
      <input type="hidden" name="session_id" value={sessionId} />

      <Field
        label="Looking back"
        hint="What happened since the last Focus Circle? What did you actually get done?"
      >
        <Textarea
          name="look_back_notes"
          rows={4}
          defaultValue={existing?.look_back_notes ?? ""}
        />
      </Field>

      <Field
        label="Focus for the next two weeks"
        hint="Where your attention is going before we meet again."
      >
        <Textarea
          name="focus_next_two_weeks"
          rows={4}
          defaultValue={existing?.focus_next_two_weeks ?? ""}
        />
      </Field>

      <Field
        label="The goal you are committing to"
        hint="One sentence the group can hold you to."
      >
        <Textarea
          name="committed_goal"
          rows={2}
          defaultValue={existing?.committed_goal ?? ""}
        />
      </Field>

      {state.status === "error" && state.message ? (
        <Notice tone="error">{state.message}</Notice>
      ) : null}
      {state.status === "saved" ? <Notice tone="success">Saved.</Notice> : null}

      <SubmitButton existing={existing !== null} />
    </form>
  );
}
