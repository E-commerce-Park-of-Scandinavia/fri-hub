"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { saveProfile, type ProfileState } from "./actions";
import {
  Button,
  Card,
  Field,
  Input,
  Notice,
  SectionTitle,
  Textarea,
} from "@/components/ui";
import type { Participant } from "@/lib/types";

const STORY_FIELDS = [
  {
    name: "what_company_does",
    label: "What does your company do?",
    hint: "In plain language, as you would say it out loud.",
  },
  { name: "why_started", label: "Why did you start it?" },
  { name: "proud_of", label: "What are you proud of so far?" },
  {
    name: "biggest_challenge",
    label: "What is your biggest challenge right now?",
  },
  { name: "good_at", label: "What are you good at?" },
  {
    name: "hope_to_get_from_group",
    label: "What do you hope to get from the group?",
  },
] as const;

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Saving…" : "Save profile"}
    </Button>
  );
}

export default function ProfileForm({ participant }: { participant: Participant }) {
  const [state, formAction] = useActionState<ProfileState, FormData>(saveProfile, {
    status: "idle",
  });

  return (
    <form action={formAction} className="space-y-6">
      <Card>
        <SectionTitle>About you</SectionTitle>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Full name">
            <Input name="full_name" defaultValue={participant.full_name} required />
          </Field>
          <Field label="Company name">
            <Input name="company_name" defaultValue={participant.company_name ?? ""} />
          </Field>
          <Field label="Company website">
            <Input
              name="company_website"
              type="url"
              placeholder="https://"
              defaultValue={participant.company_website ?? ""}
            />
          </Field>
          <Field label="Photo URL" hint="A link to a photo of you. Optional.">
            <Input
              name="photo_url"
              type="url"
              placeholder="https://"
              defaultValue={participant.photo_url ?? ""}
            />
          </Field>
          <Field label="Instagram">
            <Input
              name="instagram_url"
              type="url"
              placeholder="https://"
              defaultValue={participant.instagram_url ?? ""}
            />
          </Field>
          <Field label="TikTok">
            <Input
              name="tiktok_url"
              type="url"
              placeholder="https://"
              defaultValue={participant.tiktok_url ?? ""}
            />
          </Field>
          <Field label="Facebook">
            <Input
              name="facebook_url"
              type="url"
              placeholder="https://"
              defaultValue={participant.facebook_url ?? ""}
            />
          </Field>
        </div>
      </Card>

      <Card>
        <SectionTitle>Your story</SectionTitle>
        <p className="text-muted mb-4 text-sm">
          This is what the rest of your cohort sees in the directory.
        </p>
        <div className="space-y-4">
          {STORY_FIELDS.map((field) => (
            <Field
              key={field.name}
              label={field.label}
              hint={"hint" in field ? field.hint : undefined}
            >
              <Textarea
                name={field.name}
                rows={3}
                defaultValue={participant[field.name] ?? ""}
              />
            </Field>
          ))}
        </div>
      </Card>

      {state.status === "error" && state.message ? (
        <Notice tone="error">{state.message}</Notice>
      ) : null}
      {state.status === "saved" ? <Notice tone="success">Profile saved.</Notice> : null}

      <SubmitButton />
    </form>
  );
}
