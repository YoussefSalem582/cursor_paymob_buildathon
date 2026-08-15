/**
 * Public Supabase credentials. The dashboard now issues a publishable key
 * (`sb_publishable_…`). Older docs called it the anon key — either env name works.
 */
export function supabasePublicConfig(): { url: string; key: string } | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return { url, key };
}

export function supabaseUrl(): string {
  const config = supabasePublicConfig();
  if (!config) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL (see .env.example)");
  }
  return config.url;
}

export function supabasePublishableKey(): string {
  const config = supabasePublicConfig();
  if (!config) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY (or NEXT_PUBLIC_SUPABASE_ANON_KEY)",
    );
  }
  return config.key;
}
