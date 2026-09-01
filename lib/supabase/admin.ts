import { createClient } from "@supabase/supabase-js";

/**
 * Service-role client. It bypasses Row Level Security completely, so it is only
 * ever used for one thing: sending Supabase invite emails, from a server action
 * that has already checked requireAdmin(). Never import this into a component.
 */
export function createAdminClient() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY is not set — invite emails cannot be sent.",
    );
  }
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
