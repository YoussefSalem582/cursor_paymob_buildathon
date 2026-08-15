import { createClient } from "@supabase/supabase-js";
import { supabaseSecretKey, supabaseUrl } from "@/lib/supabase/env";

/**
 * Privileged client. Bypasses RLS — server-only, never import from a
 * Client Component. Used for order writes (checkout + Paymob webhook), which
 * must not depend on a user session.
 *
 * Prefers `SUPABASE_SECRET_KEY` (`sb_secret_…`). Falls back to legacy
 * `SUPABASE_SERVICE_ROLE_KEY` (JWT).
 */
export function createAdminClient() {
  return createClient(supabaseUrl(), supabaseSecretKey(), {
    auth: { autoRefreshToken: false, persistSession: false },
    global: {
      fetch: (input, init) => fetch(input, { ...init, cache: "no-store" }),
    },
  });
}
