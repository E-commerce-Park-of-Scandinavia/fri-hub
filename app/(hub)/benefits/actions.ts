"use server";

import { normaliseUrl } from "@/lib/url";

import { revalidatePath } from "next/cache";
import { getCohort, requireParticipant } from "@/lib/data";
import { createClient } from "@/lib/supabase/server";

export type BenefitState = { status: "idle" | "saved" | "deleted" | "error"; message?: string };

function text(formData: FormData, key: string) {
  const value = String(formData.get(key) ?? "").trim();
  return value || null;
}

/**
 * A participant posting an offer from their own business. The row is always
 * stamped with their own participant id and their own programme — nothing the
 * form sends can change whose offer it is.
 */
export async function saveMyBenefit(
  _prev: BenefitState,
  formData: FormData,
): Promise<BenefitState> {
  const participant = await requireParticipant();
  const cohort = participant.home_cohort_id
    ? await getCohort(participant.home_cohort_id)
    : null;

  if (!cohort) {
    return {
      status: "error",
      message: "You need to belong to a cohort before posting an offer.",
    };
  }

  const title = text(formData, "title");
  const partner_name = text(formData, "partner_name") ?? participant.company_name;
  if (!title || !partner_name) {
    return { status: "error", message: "A company name and an offer are both required." };
  }

  const row = {
    program_id: cohort.program_id,
    cohort_id: null, // peer offers go to the whole programme, not one cohort
    offered_by_participant_id: participant.id,
    kind: "peer" as const,
    partner_name,
    partner_url: normaliseUrl(text(formData, "partner_url")),
    title,
    description: text(formData, "description"),
    discount_code: text(formData, "discount_code"),
    redeem_url: normaliseUrl(text(formData, "redeem_url")),
    valid_until: text(formData, "valid_until"),
    is_published: true,
  };

  const supabase = await createClient();
  const id = text(formData, "id");

  const { error } = id
    ? await supabase
        .from("benefits")
        .update(row)
        .eq("id", id)
        .eq("offered_by_participant_id", participant.id)
    : await supabase.from("benefits").insert(row);

  if (error) return { status: "error", message: error.message };

  revalidatePath("/benefits");
  return { status: "saved" };
}

export async function deleteMyBenefit(
  _prev: BenefitState,
  formData: FormData,
): Promise<BenefitState> {
  const participant = await requireParticipant();

  const supabase = await createClient();
  const { error } = await supabase
    .from("benefits")
    .delete()
    .eq("id", String(formData.get("id") ?? ""))
    .eq("offered_by_participant_id", participant.id);

  if (error) return { status: "error", message: error.message };

  revalidatePath("/benefits");
  return { status: "deleted" };
}
