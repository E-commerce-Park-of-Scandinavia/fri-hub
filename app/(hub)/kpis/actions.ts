"use server";

import { revalidatePath } from "next/cache";
import { requireParticipant } from "@/lib/data";
import { createClient } from "@/lib/supabase/server";

export type KpiState = { status: "idle" | "saved" | "deleted" | "error"; message?: string };

/** Empty means "did not measure", which is not the same as zero. */
function numberOrNull(formData: FormData, key: string) {
  const raw = String(formData.get(key) ?? "").trim().replace(/\s/g, "").replace(",", ".");
  if (!raw) return null;
  const value = Number(raw);
  return Number.isFinite(value) && value >= 0 ? value : null;
}

export async function saveKpiEntry(
  _prev: KpiState,
  formData: FormData,
): Promise<KpiState> {
  const participant = await requireParticipant();

  const period = String(formData.get("period") ?? "");
  if (!/^\d{4}-\d{2}-01$/.test(period)) {
    return { status: "error", message: "Pick a month." };
  }

  const total_sales = numberOrNull(formData, "total_sales");
  const orders = numberOrNull(formData, "orders");
  const sessions = numberOrNull(formData, "sessions");

  if (total_sales === null && orders === null && sessions === null) {
    return { status: "error", message: "Fill in at least one number." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("kpi_entries").upsert(
    {
      participant_id: participant.id,
      period,
      total_sales,
      orders,
      sessions,
      notes: String(formData.get("notes") ?? "").trim() || null,
    },
    { onConflict: "participant_id,period" },
  );

  if (error) return { status: "error", message: error.message };

  revalidatePath("/kpis");
  return { status: "saved" };
}

export async function deleteKpiEntry(
  _prev: KpiState,
  formData: FormData,
): Promise<KpiState> {
  const participant = await requireParticipant();

  const supabase = await createClient();
  const { error } = await supabase
    .from("kpi_entries")
    .delete()
    .eq("id", String(formData.get("id") ?? ""))
    .eq("participant_id", participant.id);

  if (error) return { status: "error", message: error.message };

  revalidatePath("/kpis");
  return { status: "deleted" };
}

/** The currency lives on the profile, since it does not change month to month. */
export async function setKpiCurrency(
  _prev: KpiState,
  formData: FormData,
): Promise<KpiState> {
  const participant = await requireParticipant();
  const currency = String(formData.get("kpi_currency") ?? "SEK").trim().toUpperCase();

  if (!/^[A-Z]{3}$/.test(currency)) {
    return { status: "error", message: "Use a three-letter currency code, e.g. SEK." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("participants")
    .update({ kpi_currency: currency })
    .eq("id", participant.id);

  if (error) return { status: "error", message: error.message };

  revalidatePath("/kpis");
  return { status: "saved" };
}
