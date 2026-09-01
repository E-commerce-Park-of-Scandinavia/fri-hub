"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/data";
import { createClient } from "@/lib/supabase/server";

export type AdminState = { status: "idle" | "ok" | "error"; message?: string };

function text(formData: FormData, key: string) {
  const value = String(formData.get(key) ?? "").trim();
  return value || null;
}

function cohortFields(formData: FormData) {
  return {
    name: text(formData, "name"),
    intake_season: formData.get("intake_season") === "spring" ? "spring" : "autumn",
    start_date: text(formData, "start_date"),
    expected_end_date: text(formData, "expected_end_date"),
    status: String(formData.get("status") ?? "active"),
    slack_channel_url: text(formData, "slack_channel_url"),
  };
}

export async function createCohort(
  _prev: AdminState,
  formData: FormData,
): Promise<AdminState> {
  await requireAdmin();

  const fields = cohortFields(formData);
  const programId = text(formData, "program_id");
  if (!fields.name || !programId) {
    return { status: "error", message: "A name and a programme are required." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("cohorts")
    .insert({ ...fields, program_id: programId });

  if (error) return { status: "error", message: error.message };

  revalidatePath("/admin/cohorts");
  return { status: "ok", message: "Cohort created." };
}

export async function updateCohort(
  _prev: AdminState,
  formData: FormData,
): Promise<AdminState> {
  await requireAdmin();

  const supabase = await createClient();
  const { error } = await supabase
    .from("cohorts")
    .update(cohortFields(formData))
    .eq("id", String(formData.get("id") ?? ""));

  if (error) return { status: "error", message: error.message };

  revalidatePath("/admin/cohorts");
  revalidatePath("/community");
  return { status: "ok", message: "Saved." };
}

export async function createProgram(
  _prev: AdminState,
  formData: FormData,
): Promise<AdminState> {
  await requireAdmin();

  const name = text(formData, "name");
  const slug = text(formData, "slug");
  if (!name || !slug) {
    return { status: "error", message: "A name and a slug are required." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("programs").insert({
    name,
    slug,
    description: text(formData, "description"),
    slack_invite_url: text(formData, "slack_invite_url"),
  });

  if (error) return { status: "error", message: error.message };

  revalidatePath("/admin/programs");
  return { status: "ok", message: "Programme created." };
}

export async function updateProgram(
  _prev: AdminState,
  formData: FormData,
): Promise<AdminState> {
  await requireAdmin();

  const supabase = await createClient();
  const { error } = await supabase
    .from("programs")
    .update({
      name: text(formData, "name"),
      slug: text(formData, "slug"),
      description: text(formData, "description"),
      slack_invite_url: text(formData, "slack_invite_url"),
    })
    .eq("id", String(formData.get("id") ?? ""));

  if (error) return { status: "error", message: error.message };

  revalidatePath("/admin/programs");
  revalidatePath("/community");
  return { status: "ok", message: "Saved." };
}
