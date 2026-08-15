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
      <header className="flex items-center justify-between gap-6 px-6 py-6 sm:px-10">
        <Link href="/" className="flex items-center gap-3">
          <EscrowdLogo size={80} className="size-10" alt="" />
          <span className="font-display text-2xl leading-none">
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
