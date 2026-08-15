import type { ReactNode } from "react";
import { getLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { signOut } from "@/lib/auth-actions";
import { EscrowdLogo } from "./escrowd-logo";
import { LocaleSwitcher } from "./locale-switcher";
import { StudioNav } from "./studio-nav";
import { ThemeToggle } from "./theme-toggle";

export async function StudioChrome({
  email,
  children,
}: {
  email: string;
  children: ReactNode;
}) {
  const t = await getTranslations();
  const locale = await getLocale();

  return (
    <div className="flex min-h-full flex-col lg:flex-row">
      <aside className="sticky top-0 z-20 flex flex-col gap-3 border-b border-line bg-paper/90 px-4 py-3 pt-[max(0.75rem,env(safe-area-inset-top))] backdrop-blur-md lg:h-dvh lg:w-56 lg:shrink-0 lg:gap-6 lg:border-b-0 lg:border-e lg:bg-transparent lg:px-5 lg:py-6 lg:pt-6 lg:backdrop-blur-none">
        <div className="flex items-center justify-between gap-3">
          <Link href="/dashboard" className="flex min-w-0 items-center gap-2 sm:gap-3">
            <EscrowdLogo size={72} className="size-9 shrink-0 sm:size-10" alt="" />
            <span className="min-w-0">
              <p className="text-[11px] uppercase tracking-[0.28em] text-clay">
                {t("dashboard.overviewKicker")}
              </p>
              <p className="font-display text-xl leading-none">
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
        <div className="flex items-center gap-2 lg:min-h-0 lg:flex-1 lg:flex-col lg:items-stretch">
          <StudioNav />
          <form action={signOut} className="shrink-0 lg:hidden">
            <input type="hidden" name="locale" value={locale} />
            <button
              type="submit"
              className="inline-flex min-h-11 cursor-pointer items-center px-2 text-sm text-muted hover:text-ink"
            >
              {t("nav.signOut")}
            </button>
          </form>
          <div className="mt-auto hidden gap-3 text-sm lg:grid">
            <p className="break-all text-muted">{email}</p>
            <Link href="/" className="text-muted hover:text-ink">
              {t("dashboard.publicSite")}
            </Link>
            <form action={signOut}>
              <input type="hidden" name="locale" value={locale} />
              <button
                type="submit"
                className="inline-flex min-h-11 cursor-pointer items-center text-muted hover:text-ink"
              >
                {t("nav.signOut")}
              </button>
            </form>
            <div className="flex gap-2">
              <LocaleSwitcher label={t("nav.language")} />
              <ThemeToggle label={t("nav.theme")} />
            </div>
          </div>
        </div>
      </aside>
      <div className="min-w-0 flex-1 pb-[env(safe-area-inset-bottom)]">{children}</div>
    </div>
  );
}
