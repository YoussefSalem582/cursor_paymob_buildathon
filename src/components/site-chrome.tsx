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
    <header className="sticky top-0 z-20 border-b border-line/80 bg-paper/90 pt-[env(safe-area-inset-top)] backdrop-blur-md">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-2 px-4 py-3 sm:px-10 sm:py-4 lg:flex-row lg:items-center lg:justify-between lg:gap-4">
        <div className="flex items-center justify-between gap-3">
          <Link href="/" className="group flex min-w-0 items-center gap-2 sm:gap-3">
            <EscrowdLogo
              size={112}
              className="size-9 shrink-0 sm:size-12"
              priority
            />
            <span className="min-w-0">
              <p className="hidden text-[11px] uppercase tracking-[0.28em] text-muted sm:block">
                {t("app.tagline")}
              </p>
              <p className="font-display text-2xl leading-none tracking-tight sm:text-4xl">
                {t("app.name")}
                <span className="text-clay">.</span>
              </p>
            </span>
          </Link>
          <div className="flex shrink-0 items-center gap-2 lg:hidden">
            <LocaleSwitcher label={t("nav.language")} />
            <ThemeToggle label={t("nav.theme")} />
          </div>
        </div>
        <nav className="flex items-center gap-1 overflow-x-auto text-sm text-muted [-ms-overflow-style:none] [scrollbar-width:none] sm:gap-2 lg:gap-5 [&::-webkit-scrollbar]:hidden">
          <Link
            href="/#about"
            className="hidden min-h-11 items-center hover:text-ink sm:inline-flex"
          >
            {t("nav.about")}
          </Link>
          <Link
            href="/#work"
            className="hidden min-h-11 items-center hover:text-ink sm:inline-flex"
          >
            {t("nav.work")}
          </Link>
          <Link
            href="/commission"
            className="inline-flex min-h-11 shrink-0 items-center px-2 hover:text-ink sm:px-0"
          >
            {t("nav.commission")}
          </Link>
          {signedIn ? (
            <>
              <Link
                href="/dashboard"
                className="inline-flex min-h-11 shrink-0 items-center px-2 hover:text-ink sm:px-0"
              >
                {t("nav.dashboard")}
              </Link>
              <form action={signOut}>
                <input type="hidden" name="locale" value={locale} />
                <button
                  type="submit"
                  className="inline-flex min-h-11 shrink-0 cursor-pointer items-center px-2 hover:text-ink sm:px-0"
                >
                  {t("nav.signOut")}
                </button>
              </form>
            </>
          ) : (
            <Link
              href="/sign-in"
              className="inline-flex min-h-11 shrink-0 items-center px-2 hover:text-ink sm:px-0"
            >
              {t("nav.studio")}
            </Link>
          )}
          <span className="ms-auto hidden items-center gap-2 lg:flex">
            <LocaleSwitcher label={t("nav.language")} />
            <ThemeToggle label={t("nav.theme")} />
          </span>
        </nav>
      </div>
    </header>
  );
}

export async function SiteFooter() {
  const t = await getTranslations();
  return (
    <footer className="mt-auto border-t border-line pb-[env(safe-area-inset-bottom)]">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-3 px-4 py-8 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:gap-4 sm:px-10">
        <div className="flex min-w-0 items-center gap-3">
          <EscrowdLogo size={80} className="size-10 shrink-0" />
          <p className="min-w-0 text-sm text-muted">{t("app.footer")}</p>
        </div>
        <div className="flex flex-wrap items-center gap-x-5 gap-y-1">
          <Link
            href="/#about"
            className="inline-flex min-h-11 items-center text-sm text-muted hover:text-ink"
          >
            {t("nav.about")}
          </Link>
          <Link
            href="/commission"
            className="inline-flex min-h-11 items-center text-sm text-muted hover:text-ink"
          >
            {t("nav.commission")}
          </Link>
        </div>
      </div>
    </footer>
  );
}
