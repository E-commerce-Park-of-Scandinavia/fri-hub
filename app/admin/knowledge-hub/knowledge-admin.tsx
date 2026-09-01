"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import {
  createKnowledgeItem,
  deleteKnowledgeItem,
  updateKnowledgeItem,
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
import { formatSessionDate } from "@/lib/format";
import {
  KNOWLEDGE_CATEGORY_LABELS,
  type Cohort,
  type KnowledgeCategory,
  type KnowledgeHubItem,
  type Program,
  type Session,
} from "@/lib/types";

const IDLE: AdminState = { status: "idle" };
const CATEGORIES = Object.keys(KNOWLEDGE_CATEGORY_LABELS) as KnowledgeCategory[];

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

function ItemFields({
  item,
  cohorts,
  sessions,
}: {
  item?: KnowledgeHubItem;
  cohorts: Cohort[];
  sessions: Session[];
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Field label="Title" hint="Convention: DDMMMYYYY - Topic">
        <Input name="title" defaultValue={item?.title ?? ""} required />
      </Field>
      <Field label="Drive link" hint='Sharing set to "anyone with the link".'>
        <Input name="drive_url" defaultValue={item?.drive_url ?? ""} required />
      </Field>
      <Field label="Category">
        <Select name="category" defaultValue={item?.category ?? "general"}>
          {CATEGORIES.map((category) => (
            <option key={category} value={category}>
              {KNOWLEDGE_CATEGORY_LABELS[category]}
            </option>
          ))}
        </Select>
      </Field>
      <Field label="Date">
        <Input type="date" name="item_date" defaultValue={item?.item_date ?? ""} />
      </Field>
      <Field label="Visible to" hint="Leave on all cohorts unless it is cohort-specific.">
        <Select name="cohort_id" defaultValue={item?.cohort_id ?? ""}>
          <option value="">All cohorts in the programme</option>
          {cohorts.map((cohort) => (
            <option key={cohort.id} value={cohort.id}>
              {cohort.name} only
            </option>
          ))}
        </Select>
      </Field>
      <Field label="Attach to session" hint="Shows the item on that session's page.">
        <Select name="session_id" defaultValue={item?.session_id ?? ""}>
          <option value="">— not attached —</option>
          {sessions.map((session) => (
            <option key={session.id} value={session.id}>
              {formatSessionDate(session.date)} · {session.title}
            </option>
          ))}
        </Select>
      </Field>
    </div>
  );
}

export default function KnowledgeAdmin({
  items,
  cohorts,
  sessions,
  programs,
}: {
  items: KnowledgeHubItem[];
  cohorts: Cohort[];
  sessions: Session[];
  programs: Program[];
}) {
  const [addState, addAction] = useActionState(createKnowledgeItem, IDLE);

  return (
    <>
      <Card className="mb-8">
        <SectionTitle>Add an item</SectionTitle>
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
          <ItemFields cohorts={cohorts} sessions={sessions} />
          <Result state={addState} />
          <Pending label="Add item" busy="Adding…" />
        </form>
      </Card>

      <SectionTitle>All items ({items.length})</SectionTitle>
      <div className="border-line bg-surface overflow-hidden rounded-lg border">
        {items.length === 0 ? (
          <p className="text-muted px-4 py-6 text-sm">Nothing added yet.</p>
        ) : (
          items.map((item) => (
            <ItemRow
              key={item.id}
              item={item}
              cohorts={cohorts}
              sessions={sessions}
            />
          ))
        )}
      </div>
    </>
  );
}

function ItemRow({
  item,
  cohorts,
  sessions,
}: {
  item: KnowledgeHubItem;
  cohorts: Cohort[];
  sessions: Session[];
}) {
  const [editState, editAction] = useActionState(updateKnowledgeItem, IDLE);
  const [deleteState, deleteAction] = useActionState(deleteKnowledgeItem, IDLE);

  return (
    <details className="border-line border-t">
      <summary className="hover:bg-paper flex cursor-pointer flex-wrap items-center gap-3 px-4 py-3">
        <span className="min-w-0 flex-1 text-sm font-medium">{item.title}</span>
        {item.cohort_id === null ? <Badge>All cohorts</Badge> : null}
        <Badge tone="accent">{KNOWLEDGE_CATEGORY_LABELS[item.category]}</Badge>
      </summary>

      <div className="bg-paper space-y-4 px-4 py-4">
        <form action={editAction} className="space-y-4">
          <input type="hidden" name="id" value={item.id} />
          <ItemFields item={item} cohorts={cohorts} sessions={sessions} />
          <Result state={editState} />
          <Pending label="Save changes" busy="Saving…" />
        </form>

        <form action={deleteAction} className="border-line border-t pt-4">
          <input type="hidden" name="id" value={item.id} />
          <Button type="submit" tone="danger">
            Delete item
          </Button>
        </form>
        <Result state={deleteState} />
      </div>
    </details>
  );
}
