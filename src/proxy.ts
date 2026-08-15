import createIntlMiddleware from "next-intl/middleware";
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { routing } from "@/i18n/routing";
import { supabasePublicConfig } from "@/lib/supabase/env";

/**
 * Next.js 16 renamed `middleware` to `proxy`. Same job: runs before every
 * matched request.
 *
 * Two things happen here, in order:
 *   1. next-intl decides the locale and may redirect/rewrite (/ -> /ar)
 *   2. Supabase refreshes the auth cookies onto whatever response came out of 1
 */

const handleI18n = createIntlMiddleware(routing);

export async function proxy(request: NextRequest) {
  const response = handleI18n(request);

  const supabaseEnv = supabasePublicConfig();
  if (!supabaseEnv) {
    // Vercel has no .env.local. Missing keys must not 500 the whole site.
    console.error(
      "[escrowd] NEXT_PUBLIC_SUPABASE_URL / PUBLISHABLE_KEY unset — skipping session refresh",
    );
    return response;
  }

  try {
    const supabase = createServerClient(supabaseEnv.url, supabaseEnv.key, {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value);
            response.cookies.set(name, value, options);
          });
        },
      },
    });

    // Refreshes the session cookie. Without this, users get signed out at random.
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const protectedPaths = ["/dashboard", "/demo"];
    const pathname = request.nextUrl.pathname;
    const pathWithoutLocale =
      "/" + pathname.split("/").slice(2).join("/").replace(/\/$/, "");
    const locale = pathname.split("/")[1] || routing.defaultLocale;

    if (!user && protectedPaths.some((p) => pathWithoutLocale.startsWith(p))) {
      const signInUrl = new URL(`/${locale}/sign-in`, request.url);
      signInUrl.searchParams.set("next", pathname);
      return NextResponse.redirect(signInUrl);
    }
  } catch (error) {
    console.error("[escrowd] supabase session refresh failed", error);
  }

  return response;
}

export const config = {
  // Skip API routes (Paymob's webhook must not be redirected), static files
  // and images.
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};
