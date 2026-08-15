"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { routing } from "@/i18n/routing";
import { parseEmail, safeInternalPath } from "@/lib/validate";

function localeFrom(formData: FormData) {
  const locale = String(formData.get("locale") ?? "");
  return (routing.locales as readonly string[]).includes(locale)
    ? locale
    : routing.defaultLocale;
}

export async function signIn(_prev: string | null, formData: FormData) {
  const email = parseEmail(formData.get("email"));
  const password = String(formData.get("password") ?? "");
  if (!email || password.length < 6) return "invalid";

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (error) return "invalid";

  const next = safeInternalPath(formData.get("next"));
  redirect(next ?? `/${localeFrom(formData)}/dashboard`);
}

export async function signUp() {
  return "Studio sign-up is closed.";
}

export async function signOut(formData: FormData) {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect(`/${localeFrom(formData)}`);
}
