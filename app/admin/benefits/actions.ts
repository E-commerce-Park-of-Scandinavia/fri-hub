"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/data";
import { createClient } from "@/lib/supabase/server";

export type AdminState = { status: "idle" | "ok" | "error"; message?: string };

function text(formData: FormData, key: string) {
  const value = String(formData.get(key) ?? "").trim();
  return value || null;
}

function partnerFields(formData: FormData) {
  return {
    cohort_id: text(formData, "cohort_id"),
    partner_name: text(formData, "partner_name"),
    partner_url: text(formData, "partner_url"),
    title: text(formData, "title"),
    description: text(formData, "description"),
    discount_code: text(formData, "discount_code"),
    redeem_url: text(formData, "redeem_url"),
    valid_from: text(formData, "valid_from"),
    valid_until: text(formData, "valid_until"),
    is_published: formData.get("is_published") === "on",
  };
}

export async function createPartnerBenefit(
  _prev: AdminState,
  formData: FormData,
): Promise<AdminState> {
  await requireAdmin();

  const fields = partnerFields(formData);
  const programId = text(formData, "program_id");
  if (!fields.partner_name || !fields.title || !programId) {
    return { status: "error", message: "Partner name and offer are both required." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("benefits").insert({
    ...fields,
    program_id: programId,
    kind: "partner",
    offered_by_participant_id: null,
  });

  if (error) return { status: "error", message: error.message };

  revalidatePath("/admin/benefits");
  revalidatePath("/benefits");
  return { status: "ok", message: "Benefit added." };
}

export async function updateBenefit(
  _prev: AdminState,
  formData: FormData,
): Promise<AdminState> {
  await requireAdmin();

  const supabase = await createClient();
  const { error } = await supabase
    .from("benefits")
    .update(partnerFields(formData))
    .eq("id", String(formData.get("id") ?? ""));

  if (error) return { status: "error", message: error.message };

  revalidatePath("/admin/benefits");
  revalidatePath("/benefits");
  return { status: "ok", message: "Saved." };
}

/** Hiding rather than deleting, so a peer offer can be taken down and restored. */
export async function setBenefitPublished(
  _prev: AdminState,
  formData: FormData,
): Promise<AdminState> {
  await requireAdmin();

  const supabase = await createClient();
  const { error } = await supabase
    .from("benefits")
    .update({ is_published: formData.get("publish") === "true" })
    .eq("id", String(formData.get("id") ?? ""));

  if (error) return { status: "error", message: error.message };

  revalidatePath("/admin/benefits");
  revalidatePath("/benefits");
  return { status: "ok", message: "Updated." };
}

export async function deleteBenefit(
  _prev: AdminState,
  formData: FormData,
): Promise<AdminState> {
  await requireAdmin();

  const supabase = await createClient();
  const { error } = await supabase
    .from("benefits")
    .delete()
    .eq("id", String(formData.get("id") ?? ""));

  if (error) return { status: "error", message: error.message };

  revalidatePath("/admin/benefits");
  revalidatePath("/benefits");
  return { status: "ok", message: "Deleted." };
}
