"use client";

import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

export function StudioNav() {
  const pathname = usePathname();
  const t = useTranslations("dashboard");
  const onOverview = pathname === "/dashboard";
  const onBoard = pathname.startsWith("/dashboard/");

  return (
    <nav className="flex min-w-0 flex-1 gap-1 lg:flex-none lg:flex-col">
      <Link
        href="/dashboard"
        className={cn(
          "inline-flex min-h-11 flex-1 items-center justify-center px-3 text-sm lg:flex-none lg:justify-start",
          onOverview ? "bg-ink text-paper" : "text-muted hover:text-ink",
        )}
      >
        {t("navOverview")}
      </Link>
      <Link
        href="/dashboard/orders"
        className={cn(
          "inline-flex min-h-11 flex-1 items-center justify-center px-3 text-sm lg:flex-none lg:justify-start",
          onBoard ? "bg-ink text-paper" : "text-muted hover:text-ink",
        )}
      >
        {t("navBoard")}
      </Link>
    </nav>
  );
}
