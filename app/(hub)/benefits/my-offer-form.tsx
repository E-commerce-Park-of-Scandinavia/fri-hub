"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { deleteMyBenefit, saveMyBenefit, type BenefitState } from "./actions";
import {
  Button,
  Card,
  Field,
  Input,
  Notice,
  SectionTitle,
  Textarea,
} from "@/components/ui";
import type { Benefit, Participant } from "@/lib/types";

const IDLE: BenefitState = { status: "idle" };

function SubmitButton({ editing }: { editing: boolean }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Saving…" : editing ? "Update my offer" : "Post my offer"}
    </Button>
  );
}

export default function MyOfferForm({
  participant,
  existing,
}: {
  participant: Participant;
  existing: Benefit[];
}) {
  const [editing, setEditing] = useState<Benefit | null>(null);
  const [state, formAction] = useActionState(saveMyBenefit, IDLE);
  const [deleteState, deleteAction] = useActionState(deleteMyBenefit, IDLE);

  return (
    <Card>
      <SectionTitle>
        {editing ? "Edit your offer" : "Offer something to the group"}
      </SectionTitle>
      <p className="text-muted mb-4 text-sm">
        A discount, early access, free advice — anything you can give the other
        founders. It appears for everyone in the programme straight away, and you
        can edit or remove it whenever you like.
      </p>

      <form action={formAction} className="space-y-4" key={editing?.id ?? "new"}>
        {editing ? <input type="hidden" name="id" value={editing.id} /> : null}

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Your company">
            <Input
              name="partner_name"
              required
              defaultValue={editing?.partner_name ?? participant.company_name ?? ""}
            />
          </Field>
          <Field label="Your website">
            <Input
              name="partner_url"
              placeholder="https://"
              defaultValue={editing?.partner_url ?? participant.company_website ?? ""}
            />
          </Field>
        </div>

        <Field label="The offer" hint="e.g. 20% off your first order">
          <Input name="title" required defaultValue={editing?.title ?? ""} />
        </Field>

        <Field label="Details" hint="Anything worth knowing — limits, how to claim it.">
          <Textarea name="description" rows={3} defaultValue={editing?.description ?? ""} />
        </Field>

        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Discount code" hint="Optional.">
            <Input name="discount_code" defaultValue={editing?.discount_code ?? ""} />
          </Field>
          <Field label="Link" hint="Where to use it.">
            <Input
              name="redeem_url"
              placeholder="https://"
              defaultValue={editing?.redeem_url ?? ""}
            />
          </Field>
          <Field label="Valid until" hint="Leave empty for no end date.">
            <Input type="date" name="valid_until" defaultValue={editing?.valid_until ?? ""} />
          </Field>
        </div>

        {state.status === "error" && state.message ? (
          <Notice tone="error">{state.message}</Notice>
        ) : null}
        {state.status === "saved" ? <Notice tone="success">Saved.</Notice> : null}
        {deleteState.status === "deleted" ? (
          <Notice tone="success">Offer removed.</Notice>
        ) : null}

        <div className="flex flex-wrap gap-3">
          <SubmitButton editing={editing !== null} />
          {editing ? (
            <Button type="button" tone="secondary" onClick={() => setEditing(null)}>
              Cancel
            </Button>
          ) : null}
        </div>
      </form>

      {existing.length > 0 ? (
        <div className="border-line mt-6 border-t pt-4">
          <SectionTitle>Your offers</SectionTitle>
          <ul className="space-y-2">
            {existing.map((benefit) => (
              <li
                key={benefit.id}
                className="flex flex-wrap items-center justify-between gap-3 text-sm"
              >
                <span className="font-semibold">{benefit.title}</span>
                <span className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setEditing(benefit)}
                    className="text-accent underline"
                  >
                    Edit
                  </button>
                  <form action={deleteAction}>
                    <input type="hidden" name="id" value={benefit.id} />
                    <button type="submit" className="text-red-700 underline">
                      Remove
                    </button>
                  </form>
                </span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </Card>
  );
}
