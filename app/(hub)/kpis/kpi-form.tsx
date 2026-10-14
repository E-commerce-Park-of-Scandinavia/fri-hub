"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import {
  deleteKpiEntry,
  saveKpiEntry,
  setKpiCurrency,
  type KpiState,
} from "./actions";
import {
  Button,
  Card,
  Field,
  Input,
  Notice,
  SectionTitle,
  Select,
  Textarea,
} from "@/components/ui";
import {
  formatPeriodLong,
  KPI_METRICS,
  metricValue,
  selectablePeriods,
  type KpiEntry,
} from "@/lib/kpi";

const IDLE: KpiState = { status: "idle" };

function SaveButton({ editing }: { editing: boolean }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Saving…" : editing ? "Update this month" : "Save this month"}
    </Button>
  );
}

export default function KpiForm({
  entries,
  currency,
}: {
  entries: KpiEntry[];
  currency: string;
}) {
  const periods = selectablePeriods();
  const byPeriod = new Map(entries.map((e) => [e.period, e]));

  const firstEmpty = periods.find((p) => !byPeriod.has(p)) ?? periods[0];
  const [period, setPeriod] = useState(firstEmpty);
  const editing = byPeriod.get(period) ?? null;

  const [state, formAction] = useActionState(saveKpiEntry, IDLE);
  const [deleteState, deleteAction] = useActionState(deleteKpiEntry, IDLE);
  const [currencyState, currencyAction] = useActionState(setKpiCurrency, IDLE);

  return (
    <>
      <Card className="mb-8">
        <SectionTitle>
          {editing ? "Update a month" : "Add this month's numbers"}
        </SectionTitle>
        <p className="text-muted mb-4 text-sm">
          The core three. Conversion rate and average order value are worked out
          from them, so you never type those. Leave a box empty if you did not
          measure it — empty and zero are not the same thing.
        </p>

        <form action={formAction} className="space-y-4" key={period}>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Month">
              <Select
                name="period"
                value={period}
                onChange={(e) => setPeriod(e.target.value)}
              >
                {periods.map((p) => (
                  <option key={p} value={p}>
                    {formatPeriodLong(p)}
                    {byPeriod.has(p) ? " — already filled in" : ""}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label={`Total sales (${currency})`} hint="Including VAT and shipping, as your dashboard shows it.">
              <Input
                name="total_sales"
                inputMode="decimal"
                defaultValue={editing?.total_sales ?? ""}
              />
            </Field>
            <Field label="Orders" hint="Completed orders that month.">
              <Input name="orders" inputMode="numeric" defaultValue={editing?.orders ?? ""} />
            </Field>
            <Field label="Sessions" hint="Visits to your shop. Same source every month.">
              <Input
                name="sessions"
                inputMode="numeric"
                defaultValue={editing?.sessions ?? ""}
              />
            </Field>
          </div>

          <Field
            label="Notes"
            hint="Optional. If you changed where a number comes from, say so here."
          >
            <Textarea name="notes" rows={2} defaultValue={editing?.notes ?? ""} />
          </Field>

          {state.status === "error" && state.message ? (
            <Notice tone="error">{state.message}</Notice>
          ) : null}
          {state.status === "saved" ? <Notice tone="success">Saved.</Notice> : null}

          <SaveButton editing={editing !== null} />
        </form>
      </Card>

      <Card className="mb-8">
        <SectionTitle>Your months</SectionTitle>
        {entries.length === 0 ? (
          <p className="text-muted text-sm">Nothing recorded yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-line text-muted border-b text-left">
                  <th className="py-2 pr-4 font-semibold">Month</th>
                  {KPI_METRICS.map((m) => (
                    <th key={m.key} className="py-2 pr-4 text-right font-semibold">
                      {m.label}
                    </th>
                  ))}
                  <th className="py-2" />
                </tr>
              </thead>
              <tbody>
                {[...entries].reverse().map((entry) => (
                  <tr key={entry.id} className="border-line border-b">
                    <td className="py-2 pr-4 font-semibold">
                      {formatPeriodLong(entry.period)}
                    </td>
                    {KPI_METRICS.map((m) => {
                      const value = metricValue(entry, m.key);
                      return (
                        <td key={m.key} className="py-2 pr-4 text-right tabular-nums">
                          {value === null ? (
                            <span className="text-muted">—</span>
                          ) : (
                            m.format(value, currency)
                          )}
                        </td>
                      );
                    })}
                    <td className="py-2 text-right">
                      <button
                        type="button"
                        onClick={() => setPeriod(entry.period)}
                        className="text-accent underline"
                      >
                        Edit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {entries.length > 0 ? (
          <form action={deleteAction} className="border-line mt-4 border-t pt-4">
            <input type="hidden" name="id" value={byPeriod.get(period)?.id ?? ""} />
            {byPeriod.get(period) ? (
              <Button type="submit" tone="danger">
                Delete {formatPeriodLong(period)}
              </Button>
            ) : null}
            {deleteState.status === "deleted" ? (
              <Notice tone="success">Month removed.</Notice>
            ) : null}
          </form>
        ) : null}
      </Card>

      <Card>
        <SectionTitle>Currency</SectionTitle>
        <form action={currencyAction} className="flex flex-wrap items-end gap-3">
          <Field label="Your reporting currency" hint="Three-letter code. Keep it the same every month.">
            <Input name="kpi_currency" defaultValue={currency} className="w-32" />
          </Field>
          <Button type="submit">Save</Button>
          {currencyState.status === "error" && currencyState.message ? (
            <Notice tone="error">{currencyState.message}</Notice>
          ) : null}
        </form>
      </Card>
    </>
  );
}
