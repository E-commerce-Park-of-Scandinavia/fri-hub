"use server";

import { revalidatePath } from "next/cache";
import { getOpenCheckinSession, requireParticipant } from "@/lib/data";
import { createClient } from "@/lib/supabase/server";

export type CheckinState = { status: "idle" | "saved" | "error"; message?: string };

export async function saveCheckin(
  _prev: CheckinState,
  formData: FormData,
): Promise<CheckinState> {
  const participant = await requireParticipant();
  const sessionId = String(formData.get("session_id") ?? "");

  // Re-derive the open session server-side: a posted session_id is not a permission.
  const openSession = await getOpenCheckinSession();
  if (!openSession || openSession.id !== sessionId) {
    return {
      status: "error",
      message: "That Focus Circle is no longer open for check-ins.",
    };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("focus_circle_checkins").upsert(
    {
      participant_id: participant.id,
      session_id: sessionId,
      look_back_notes: String(formData.get("look_back_notes") ?? "").trim() || null,
      focus_next_two_weeks:
        String(formData.get("focus_next_two_weeks") ?? "").trim() || null,
      committed_goal: String(formData.get("committed_goal") ?? "").trim() || null,
      submitted_at: new Date().toISOString(),
    },
    { onConflict: "participant_id,session_id" },
  );

  if (error) return { status: "error", message: error.message };

  revalidatePath("/focus-circle");
  revalidatePath("/");
  return { status: "saved" };
}
