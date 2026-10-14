"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import {
  createPartnerBenefit,
  deleteBenefit,
  setBenefitPublished,
  updateBenefit,
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
import { ImageUpload } from "@/components/image-upload";
import type { Benefit, Cohort, Program } from "@/lib/types";

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

function BenefitFields({
  benefit,
  cohorts,
}: {
  benefit?: Benefit;
  cohorts: Cohort[];
}) {
  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Partner name">
          <Input name="partner_name" required defaultValue={benefit?.partner_name ?? ""} />
        </Field>
        <Field label="Partner website">
          <Input
            name="partner_url"
            placeholder="https://"
            defaultValue={benefit?.partner_url ?? ""}
          />
        </Field>
      </div>

      <ImageUpload
        bucket="logos"
        pathPrefix="benefits"
        name="logo_url"
        initialUrl={benefit?.logo_url ?? null}
        label="Partner logo"
        hint="Optional. PNG, JPEG, WebP or SVG, up to 2 MB."
        accept={["image/png", "image/jpeg", "image/webp", "image/svg+xml"]}
      />

      <Field label="The offer" hint="e.g. 20% off your first order">
        <Input name="title" required defaultValue={benefit?.title ?? ""} />
      </Field>

      <Field label="Details">
        <Textarea name="description" rows={3} defaultValue={benefit?.description ?? ""} />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Discount code">
          <Input name="discount_code" defaultValue={benefit?.discount_code ?? ""} />
        </Field>
        <Field label="Link">
          <Input
            name="redeem_url"
            placeholder="https://"
            defaultValue={benefit?.redeem_url ?? ""}
          />
        </Field>
        <Field label="Valid from">
          <Input type="date" name="valid_from" defaultValue={benefit?.valid_from ?? ""} />
        </Field>
        <Field label="Valid until" hint="Leave empty for no end date.">
          <Input type="date" name="valid_until" defaultValue={benefit?.valid_until ?? ""} />
        </Field>
        <Field label="Visible to">
          <Select name="cohort_id" defaultValue={benefit?.cohort_id ?? ""}>
            <option value="">Everyone in the programme</option>
            {cohorts.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} only
              </option>
            ))}
          </Select>
        </Field>
      </div>

      <label className="flex items-center gap-2 text-sm font-medium">
        <input
          type="checkbox"
          name="is_published"
          defaultChecked={benefit?.is_published ?? true}
        />
        Visible to participants
      </label>
    </>
  );
}

export default function BenefitsAdmin({
  benefits,
  cohorts,
  programs,
  ownerNames,
}: {
  benefits: Benefit[];
  cohorts: Cohort[];
  programs: Program[];
  ownerNames: Record<string, string>;
}) {
  const [addState, addAction] = useActionState(createPartnerBenefit, IDLE);

  const partner = benefits.filter((b) => b.kind === "partner");
  const peer = benefits.filter((b) => b.kind === "peer");

  return (
    <>
      <Card className="mb-8">
        <SectionTitle>Add a partner benefit</SectionTitle>
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
          <BenefitFields cohorts={cohorts} />
          <Result state={addState} />
          <Pending label="Add benefit" busy="Adding…" />
        </form>
      </Card>

      <SectionTitle>Partner benefits ({partner.length})</SectionTitle>
      <div className="border-line bg-surface mb-8 overflow-hidden border">
        {partner.length === 0 ? (
          <p className="text-muted px-4 py-6 text-sm">None yet.</p>
        ) : (
          partner.map((b) => <Row key={b.id} benefit={b} cohorts={cohorts} />)
        )}
      </div>

      <SectionTitle>Posted by participants ({peer.length})</SectionTitle>
      <p className="text-muted mb-3 text-sm">
        These publish immediately. You can hide one without deleting it, which is
        reversible, or remove it for good.
      </p>
      <div className="border-line bg-surface overflow-hidden border">
        {peer.length === 0 ? (
          <p className="text-muted px-4 py-6 text-sm">None yet.</p>
        ) : (
          peer.map((b) => (
            <Row
              key={b.id}
              benefit={b}
              cohorts={cohorts}
              ownerName={
                b.offered_by_participant_id
                  ? ownerNames[b.offered_by_participant_id]
                  : undefined
              }
            />
          ))
        )}
      </div>
    </>
  );
}

function Row({
  benefit,
  cohorts,
  ownerName,
}: {
  benefit: Benefit;
  cohorts: Cohort[];
  ownerName?: string;
}) {
  const [editState, editAction] = useActionState(updateBenefit, IDLE);
  const [visibilityState, visibilityAction] = useActionState(setBenefitPublished, IDLE);
  const [deleteState, deleteAction] = useActionState(deleteBenefit, IDLE);

  return (
    <details className="border-line border-t">
      <summary className="hover:bg-paper flex cursor-pointer flex-wrap items-center gap-3 px-4 py-3">
        {benefit.logo_url ? (
          // eslint-disable-next-line @next/next/no-img-element -- storage URL
          <img src={benefit.logo_url} alt="" className="h-8 w-8 shrink-0 object-contain" />
        ) : (
          <span className="bg-accent-soft text-accent flex h-8 w-8 shrink-0 items-center justify-center text-sm font-extrabold">
            {benefit.partner_name.charAt(0)}
          </span>
        )}
        <span className="min-w-0 flex-1">
          <span className="block text-base font-extrabold">
            {benefit.partner_name}
            {ownerName ? <span className="text-muted font-normal"> · {ownerName}</span> : null}
          </span>
          <span className="text-muted block text-sm">{benefit.title}</span>
        </span>
        {benefit.is_published ? null : <Badge>Hidden</Badge>}
        {benefit.cohort_id ? <Badge tone="accent">One cohort</Badge> : null}
      </summary>

      <div className="bg-paper space-y-4 px-4 py-4">
        <form action={editAction} className="space-y-4">
          <input type="hidden" name="id" value={benefit.id} />
          <BenefitFields benefit={benefit} cohorts={cohorts} />
          <Result state={editState} />
          <Pending label="Save changes" busy="Saving…" />
        </form>

        <div className="border-line flex flex-wrap items-center gap-3 border-t pt-4">
          <form action={visibilityAction}>
            <input type="hidden" name="id" value={benefit.id} />
            <input
              type="hidden"
              name="publish"
              value={benefit.is_published ? "false" : "true"}
            />
            <Button type="submit" tone="secondary">
              {benefit.is_published ? "Hide from participants" : "Make visible again"}
            </Button>
          </form>
          <form action={deleteAction}>
            <input type="hidden" name="id" value={benefit.id} />
            <Button type="submit" tone="danger">
              Delete
            </Button>
          </form>
        </div>
        <Result state={visibilityState} />
        <Result state={deleteState} />
      </div>
    </details>
  );
}
