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
      <aside className="flex flex-col gap-6 border-b border-line px-6 py-6 lg:sticky lg:top-0 lg:h-dvh lg:w-56 lg:shrink-0 lg:border-b-0 lg:border-e lg:px-5">
        <Link href="/dashboard" className="flex items-center gap-3">
          <EscrowdLogo size={72} className="size-10 shrink-0" alt="" />
          <span>
            <p className="text-[11px] uppercase tracking-[0.28em] text-clay">
              {t("dashboard.overviewKicker")}
            </p>
            <p className="font-display text-xl leading-none">
              {t("app.name")}
              <span className="text-clay">.</span>
            </p>
          </span>
        </Link>
        <StudioNav />
        <div className="mt-auto grid gap-3 text-sm">
          <p className="text-muted">{email}</p>
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
      </aside>
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
