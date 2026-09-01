"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/data";
import { createClient } from "@/lib/supabase/server";
import type { AgendaBlock } from "@/lib/types";

export type AdminState = { status: "idle" | "ok" | "error"; message?: string };

function text(formData: FormData, key: string) {
  const value = String(formData.get(key) ?? "").trim();
  return value || null;
}

/** The agenda is edited as raw JSON in v1 — small enough to be honest about. */
function parseAgenda(raw: string | null): AgendaBlock[] | { error: string } {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return { error: "Agenda blocks must be a JSON array." };
    }
    for (const block of parsed) {
      if (typeof block?.label !== "string") {
        return { error: 'Every agenda block needs a "label".' };
      }
    }
    return parsed as AgendaBlock[];
  } catch {
    return { error: "Agenda blocks are not valid JSON." };
  }
}

function sessionFields(formData: FormData) {
  return {
    date: text(formData, "date"),
    session_type: String(formData.get("session_type") ?? "lecture_workshop"),
    title: text(formData, "title"),
    speaker_name: text(formData, "speaker_name"),
    speaker_bio: text(formData, "speaker_bio"),
    start_time: text(formData, "start_time"),
    end_time: text(formData, "end_time"),
    location: text(formData, "location"),
    slides_url: text(formData, "slides_url"),
    status: formData.get("status") === "confirmed" ? "confirmed" : "draft",
  };
}

async function syncCohorts(sessionId: string, cohortIds: string[]) {
  const supabase = await createClient();
  await supabase.from("session_cohorts").delete().eq("session_id", sessionId);
  if (cohortIds.length > 0) {
    await supabase
      .from("session_cohorts")
      .insert(cohortIds.map((cohort_id) => ({ session_id: sessionId, cohort_id })));
  }
}

export async function createSession(
  _prev: AdminState,
  formData: FormData,
): Promise<AdminState> {
  await requireAdmin();

  const fields = sessionFields(formData);
  if (!fields.date || !fields.title) {
    return { status: "error", message: "A date and a title are required." };
  }

  const agenda = parseAgenda(text(formData, "agenda_blocks"));
  if ("error" in agenda) return { status: "error", message: agenda.error };

  const programId = text(formData, "program_id");
  if (!programId) {
    return { status: "error", message: "Create a programme first." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("sessions")
    .insert({ ...fields, program_id: programId, agenda_blocks: agenda })
    .select("id")
    .single();

  if (error) return { status: "error", message: error.message };

  await syncCohorts(data.id, formData.getAll("cohort_ids").map(String));

  revalidatePath("/admin/sessions");
  revalidatePath("/schedule");
  return { status: "ok", message: "Session created." };
}

export async function updateSession(
  _prev: AdminState,
  formData: FormData,
): Promise<AdminState> {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");

  const agenda = parseAgenda(text(formData, "agenda_blocks"));
  if ("error" in agenda) return { status: "error", message: agenda.error };

  const supabase = await createClient();
  const { error } = await supabase
    .from("sessions")
    .update({ ...sessionFields(formData), agenda_blocks: agenda })
    .eq("id", id);

  if (error) return { status: "error", message: error.message };

  await syncCohorts(id, formData.getAll("cohort_ids").map(String));

  revalidatePath("/admin/sessions");
  revalidatePath("/schedule");
  return { status: "ok", message: "Saved." };
}

export async function deleteSession(
  _prev: AdminState,
  formData: FormData,
): Promise<AdminState> {
  await requireAdmin();
  const supabase = await createClient();
  const { error } = await supabase
    .from("sessions")
    .delete()
    .eq("id", String(formData.get("id") ?? ""));

  if (error) return { status: "error", message: error.message };

  revalidatePath("/admin/sessions");
  revalidatePath("/schedule");
  return { status: "ok", message: "Session deleted." };
}
