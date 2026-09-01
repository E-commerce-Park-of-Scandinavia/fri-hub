"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/data";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export type AdminState = { status: "idle" | "ok" | "error"; message?: string };

function text(formData: FormData, key: string) {
  const value = String(formData.get(key) ?? "").trim();
  return value || null;
}

/**
 * Creating the participants row is the whole signup flow: it is what makes the
 * address eligible for a magic link. The invite email is sent separately so a
 * typo can be fixed before anyone is emailed.
 */
export async function createParticipant(
  _prev: AdminState,
  formData: FormData,
): Promise<AdminState> {
  await requireAdmin();

  const full_name = text(formData, "full_name");
  const email = text(formData, "email")?.toLowerCase() ?? null;
  if (!full_name || !email) {
    return { status: "error", message: "Name and email are both required." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("participants").insert({
    full_name,
    email,
    company_name: text(formData, "company_name"),
    home_cohort_id: text(formData, "home_cohort_id"),
    role: formData.get("role") === "admin" ? "admin" : "participant",
    status: "active",
  });

  if (error) {
    return {
      status: "error",
      message: /duplicate key/i.test(error.message)
        ? "Someone with that email address already exists."
        : error.message,
    };
  }

  revalidatePath("/admin/participants");
  return { status: "ok", message: `${full_name} added. Send the invite when ready.` };
}

export async function updateParticipant(
  _prev: AdminState,
  formData: FormData,
): Promise<AdminState> {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");

  const supabase = await createClient();
  const { error } = await supabase
    .from("participants")
    .update({
      full_name: text(formData, "full_name"),
      email: text(formData, "email")?.toLowerCase(),
      company_name: text(formData, "company_name"),
      company_website: text(formData, "company_website"),
      home_cohort_id: text(formData, "home_cohort_id"),
      role: formData.get("role") === "admin" ? "admin" : "participant",
      status: formData.get("status") === "alumni" ? "alumni" : "active",
    })
    .eq("id", id);

  if (error) return { status: "error", message: error.message };

  revalidatePath("/admin/participants");
  return { status: "ok", message: "Saved." };
}

export async function deleteParticipant(
  _prev: AdminState,
  formData: FormData,
): Promise<AdminState> {
  const admin = await requireAdmin();
  const id = String(formData.get("id") ?? "");

  if (id === admin.id) {
    return { status: "error", message: "You cannot remove your own admin account." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("participants").delete().eq("id", id);
  if (error) return { status: "error", message: error.message };

  revalidatePath("/admin/participants");
  return { status: "ok", message: "Removed." };
}

/**
 * Sends the Supabase invite email. The link in it lands on /auth/confirm, which
 * signs them in; the on_auth_user_created trigger then attaches the auth user to
 * the participants row that already exists for this address.
 */
export async function sendInvite(
  _prev: AdminState,
  formData: FormData,
): Promise<AdminState> {
  await requireAdmin();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  if (!email) return { status: "error", message: "No email address on that row." };

  const site = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  try {
    const admin = createAdminClient();
    const { error } = await admin.auth.admin.inviteUserByEmail(email, {
      redirectTo: `${site}/auth/confirm`,
    });
    if (error) {
      // Already has a login: a plain magic link is the right thing to send.
      if (/already been registered|already exists/i.test(error.message)) {
        return {
          status: "ok",
          message: `${email} already has a login — they can sign in from the login page.`,
        };
      }
      return { status: "error", message: error.message };
    }
  } catch (err) {
    return { status: "error", message: (err as Error).message };
  }

  return { status: "ok", message: `Invite sent to ${email}.` };
}
