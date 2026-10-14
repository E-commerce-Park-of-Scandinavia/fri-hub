"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/data";
import { createClient } from "@/lib/supabase/server";
import { normaliseUrl } from "@/lib/url";

export type AdminState = { status: "idle" | "ok" | "error"; message?: string };

/**
 * These touch one column each on purpose. The cohort and programme forms
 * elsewhere submit every field, so reusing them here would blank anything the
 * Community form does not show.
 */
export async function setSlackInvite(
  _prev: AdminState,
  formData: FormData,
): Promise<AdminState> {
  await requireAdmin();

  const supabase = await createClient();
  const { error } = await supabase
    .from("programs")
    .update({ slack_invite_url: normaliseUrl(String(formData.get("url") ?? "")) })
    .eq("id", String(formData.get("program_id") ?? ""));

  if (error) return { status: "error", message: error.message };

  revalidatePath("/admin/community");
  revalidatePath("/community");
  return { status: "ok", message: "Workspace invite saved." };
}

export async function setCohortChannel(
  _prev: AdminState,
  formData: FormData,
): Promise<AdminState> {
  await requireAdmin();

  const supabase = await createClient();
  const { error } = await supabase
    .from("cohorts")
    .update({ slack_channel_url: normaliseUrl(String(formData.get("url") ?? "")) })
    .eq("id", String(formData.get("cohort_id") ?? ""));

  if (error) return { status: "error", message: error.message };

  revalidatePath("/admin/community");
  revalidatePath("/community");
  return { status: "ok", message: "Channel link saved." };
}
