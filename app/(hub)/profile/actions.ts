"use server";

import { revalidatePath } from "next/cache";
import { requireParticipant } from "@/lib/data";
import { createClient } from "@/lib/supabase/server";

export type ProfileState = { status: "idle" | "saved" | "error"; message?: string };

/**
 * Fields a participant may edit about themselves. Role, status, cohort and email
 * are absent on purpose, and the database trigger guard_participant_self_update
 * puts them back even if someone posts them anyway.
 */
const EDITABLE = [
  "full_name",
  "company_name",
  "company_website",
  "instagram_url",
  "tiktok_url",
  "facebook_url",
  "photo_url",
  "what_company_does",
  "why_started",
  "proud_of",
  "biggest_challenge",
  "good_at",
  "hope_to_get_from_group",
] as const;

export async function saveProfile(
  _prev: ProfileState,
  formData: FormData,
): Promise<ProfileState> {
  const participant = await requireParticipant();

  const patch: Record<string, string | null> = {};
  for (const field of EDITABLE) {
    const value = String(formData.get(field) ?? "").trim();
    patch[field] = value || null;
  }

  if (!patch.full_name) {
    return { status: "error", message: "Your name cannot be empty." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("participants")
    .update(patch)
    .eq("id", participant.id);

  if (error) return { status: "error", message: error.message };

  revalidatePath("/profile");
  revalidatePath("/directory");
  return { status: "saved" };
}
