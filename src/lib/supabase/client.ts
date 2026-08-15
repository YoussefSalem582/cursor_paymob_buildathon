import { createBrowserClient } from "@supabase/ssr";
import { supabasePublishableKey, supabaseUrl } from "@/lib/supabase/env";

/** Supabase client for Client Components. Only ever sees the publishable key. */
export function createClient() {
  return createBrowserClient(supabaseUrl(), supabasePublishableKey());
}
