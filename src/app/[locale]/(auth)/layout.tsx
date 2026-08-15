import type { ReactNode } from "react";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { EscrowdLogo } from "@/components/escrowd-logo";
import { LocaleSwitcher } from "@/components/locale-switcher";
import { ThemeToggle } from "@/components/theme-toggle";

export default async function AuthLayout({ children }: { children: ReactNode }) {
  const t = await getTranslations();
  return (
    <div className="flex min-h-full flex-col">
      <header className="flex items-center justify-between gap-4 px-4 py-4 pt-[max(1rem,env(safe-area-inset-top))] sm:gap-6 sm:px-10 sm:py-6">
        <Link href="/" className="flex min-w-0 items-center gap-2 sm:gap-3">
          <EscrowdLogo size={80} className="size-9 shrink-0 sm:size-10" alt="" />
          <span className="truncate font-display text-xl leading-none sm:text-2xl">
            {t("app.name")}
            <span className="text-clay">.</span>
          </span>
        </Link>
        <div className="flex items-center gap-2">
          <LocaleSwitcher label={t("nav.language")} />
          <ThemeToggle label={t("nav.theme")} />
        </div>
      </header>
      {children}
    </div>
  );
}
