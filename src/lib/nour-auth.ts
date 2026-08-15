import { createClient } from "@/lib/supabase/server";

/** Nour's dashboard is the only login. Returns the user or null. */
export async function getNourUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

export async function requireNour() {
  const user = await getNourUser();
  if (!user) return null;
  return user;
}
