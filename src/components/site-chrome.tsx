import { getLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "@/lib/auth-actions";
import { EscrowdLogo } from "./escrowd-logo";
import { LocaleSwitcher } from "./locale-switcher";
import { ThemeToggle } from "./theme-toggle";

export async function SiteHeader() {
  const t = await getTranslations();
  const locale = await getLocale();
  let signedIn = false;
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    signedIn = Boolean(user);
  } catch (error) {
    const digest =
      error && typeof error === "object" && "digest" in error
        ? String((error as { digest?: string }).digest)
        : "";
    if (digest === "DYNAMIC_SERVER_USAGE") throw error;
    console.error("[escrowd] header auth skipped", error);
  }

  return (
    <header className="sticky top-0 z-20 border-b border-line/80 bg-paper/90 backdrop-blur-md">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-6 py-4 sm:px-10">
        <Link href="/" className="group flex min-w-0 items-center gap-3">
          <EscrowdLogo
            size={112}
            className="size-11 shrink-0 sm:size-12"
            priority
          />
          <span className="min-w-0">
            <p className="hidden text-[11px] uppercase tracking-[0.28em] text-muted sm:block">
              {t("app.tagline")}
            </p>
            <p className="font-display text-3xl leading-none tracking-tight sm:text-4xl">
              {t("app.name")}
              <span className="text-clay">.</span>
            </p>
          </span>
        </Link>
        <nav className="flex flex-wrap items-center justify-end gap-x-4 gap-y-2 text-sm text-muted sm:gap-x-5">
          <Link
            href="/#work"
            className="hidden min-h-11 items-center hover:text-ink sm:inline-flex"
          >
            {t("nav.work")}
          </Link>
          <Link href="/commission" className="inline-flex min-h-11 items-center hover:text-ink">
            {t("nav.commission")}
          </Link>
          {signedIn ? (
            <>
              <Link href="/dashboard" className="inline-flex min-h-11 items-center hover:text-ink">
                {t("nav.dashboard")}
              </Link>
              <form action={signOut}>
                <input type="hidden" name="locale" value={locale} />
                <button type="submit" className="inline-flex min-h-11 cursor-pointer items-center hover:text-ink">
                  {t("nav.signOut")}
                </button>
              </form>
            </>
          ) : (
            <Link href="/sign-in" className="inline-flex min-h-11 items-center hover:text-ink">
              {t("nav.studio")}
            </Link>
          )}
          <LocaleSwitcher label={t("nav.language")} />
          <ThemeToggle label={t("nav.theme")} />
        </nav>
      </div>
    </header>
  );
}

export async function SiteFooter() {
  const t = await getTranslations();
  return (
    <footer className="mt-auto border-t border-line">
      <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-4 px-6 py-8 sm:px-10">
        <div className="flex items-center gap-3">
          <EscrowdLogo size={80} className="size-10 shrink-0" />
          <p className="text-sm text-muted">{t("app.footer")}</p>
        </div>
        <Link
          href="/commission"
          className="text-sm text-muted hover:text-ink"
        >
          {t("nav.commission")}
        </Link>
      </div>
    </footer>
  );
}
