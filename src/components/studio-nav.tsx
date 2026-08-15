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
    <nav className="flex gap-1 lg:flex-col">
      <Link
        href="/dashboard"
        className={cn(
          "inline-flex min-h-11 items-center px-3 text-sm",
          onOverview ? "bg-ink text-paper" : "text-muted hover:text-ink",
        )}
      >
        {t("navOverview")}
      </Link>
      <Link
        href="/dashboard/orders"
        className={cn(
          "inline-flex min-h-11 items-center px-3 text-sm",
          onBoard ? "bg-ink text-paper" : "text-muted hover:text-ink",
        )}
      >
        {t("navBoard")}
      </Link>
    </nav>
  );
}
