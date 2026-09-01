"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/data";
import { createClient } from "@/lib/supabase/server";

export type AdminState = { status: "idle" | "ok" | "error"; message?: string };

function text(formData: FormData, key: string) {
  const value = String(formData.get(key) ?? "").trim();
  return value || null;
}

function itemFields(formData: FormData) {
  return {
    // Empty string from the select means "all cohorts".
    cohort_id: text(formData, "cohort_id"),
    session_id: text(formData, "session_id"),
    category: String(formData.get("category") ?? "general"),
    title: text(formData, "title"),
    drive_url: text(formData, "drive_url"),
    item_date: text(formData, "item_date"),
  };
}

export async function createKnowledgeItem(
  _prev: AdminState,
  formData: FormData,
): Promise<AdminState> {
  await requireAdmin();

  const fields = itemFields(formData);
  const programId = text(formData, "program_id");
  if (!fields.title || !fields.drive_url || !programId) {
    return { status: "error", message: "Title, Drive link and programme are required." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("knowledge_hub_items")
    .insert({ ...fields, program_id: programId });

  if (error) return { status: "error", message: error.message };

  revalidatePath("/admin/knowledge-hub");
  revalidatePath("/knowledge-hub");
  return { status: "ok", message: "Item added." };
}

export async function updateKnowledgeItem(
  _prev: AdminState,
  formData: FormData,
): Promise<AdminState> {
  await requireAdmin();

  const supabase = await createClient();
  const { error } = await supabase
    .from("knowledge_hub_items")
    .update(itemFields(formData))
    .eq("id", String(formData.get("id") ?? ""));

  if (error) return { status: "error", message: error.message };

  revalidatePath("/admin/knowledge-hub");
  revalidatePath("/knowledge-hub");
  return { status: "ok", message: "Saved." };
}

export async function deleteKnowledgeItem(
  _prev: AdminState,
  formData: FormData,
): Promise<AdminState> {
  await requireAdmin();

  const supabase = await createClient();
  const { error } = await supabase
    .from("knowledge_hub_items")
    .delete()
    .eq("id", String(formData.get("id") ?? ""));

  if (error) return { status: "error", message: error.message };

  revalidatePath("/admin/knowledge-hub");
  revalidatePath("/knowledge-hub");
  return { status: "ok", message: "Deleted." };
}
