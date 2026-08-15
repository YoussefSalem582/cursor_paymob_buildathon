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
    <header className="flex items-center justify-between gap-6 px-6 py-6 sm:px-10">
      <Link href="/" className="group flex items-center gap-3">
        <EscrowdLogo
          size={112}
          className="size-12 shrink-0 sm:size-14"
          priority
        />
        <span>
          <p className="text-[11px] uppercase tracking-[0.28em] text-muted">
            {t("app.tagline")}
          </p>
          <h1 className="font-display text-3xl leading-none tracking-tight sm:text-4xl">
            {t("app.name")}
            <span className="text-clay">.</span>
          </h1>
        </span>
      </Link>
      <nav className="flex flex-wrap items-center gap-5 text-sm text-muted">
        <Link href="/#work" className="hover:text-ink">
          {t("nav.work")}
        </Link>
        <Link href="/commission" className="hover:text-ink">
          {t("nav.commission")}
        </Link>
        {signedIn ? (
          <>
            <Link href="/dashboard" className="hover:text-ink">
              {t("nav.dashboard")}
            </Link>
            <form action={signOut}>
              <input type="hidden" name="locale" value={locale} />
              <button type="submit" className="hover:text-ink">
                {t("nav.signOut")}
              </button>
            </form>
          </>
        ) : (
          <Link href="/sign-in" className="hover:text-ink">
            {t("nav.studio")}
          </Link>
        )}
        <LocaleSwitcher label={t("nav.language")} />
        <ThemeToggle label={t("nav.theme")} />
      </nav>
    </header>
  );
}

export async function SiteFooter() {
  const t = await getTranslations();
  return (
    <footer className="mt-auto border-t border-line px-6 py-8 sm:px-10">
      <div className="flex items-center gap-3">
        <EscrowdLogo size={80} className="size-10 shrink-0" />
        <p className="text-sm text-muted">{t("app.footer")}</p>
      </div>
    </footer>
  );
}
