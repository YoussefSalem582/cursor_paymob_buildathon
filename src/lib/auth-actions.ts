"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { routing } from "@/i18n/routing";

function localeFrom(formData: FormData) {
  const locale = String(formData.get("locale") ?? "");
  return (routing.locales as readonly string[]).includes(locale)
    ? locale
    : routing.defaultLocale;
}

export async function signIn(_prev: string | null, formData: FormData) {
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: String(formData.get("email") ?? ""),
    password: String(formData.get("password") ?? ""),
  });
  if (error) return error.message;

  const next = String(formData.get("next") ?? "");
  redirect(next.startsWith("/") ? next : `/${localeFrom(formData)}/dashboard`);
}

export async function signUp() {
  return "Studio sign-up is closed.";
}

export async function signOut(formData: FormData) {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect(`/${localeFrom(formData)}`);
}
