"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { sendMagicLink, type LoginState } from "./actions";
import { Button, Field, Input, Notice } from "@/components/ui";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="w-full">
      {pending ? "Sending…" : "Email me a sign-in link"}
    </Button>
  );
}

export default function LoginForm({ next }: { next: string }) {
  const [state, formAction] = useActionState<LoginState, FormData>(
    sendMagicLink,
    { status: "idle" },
  );

  if (state.status === "sent") {
    return (
      <Notice tone="success">
        Check your inbox. If your address is on the participant list, a sign-in
        link is on its way. The link works once and expires after an hour.
      </Notice>
    );
  }

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="next" value={next} />
      <Field label="Email address">
        <Input
          type="email"
          name="email"
          autoComplete="email"
          required
          placeholder="you@yourcompany.se"
        />
      </Field>
      {state.status === "error" && state.message ? (
        <Notice tone="error">{state.message}</Notice>
      ) : null}
      <SubmitButton />
    </form>
  );
}
