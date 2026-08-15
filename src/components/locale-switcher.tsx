"use client";

import { useTransition } from "react";
import { useLocale } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";

/** Swaps ar <-> en while staying on the same page. */
export function LocaleSwitcher({ label }: { label: string }) {
  const locale = useLocale() as Locale;
  const pathname = usePathname();
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const target: Locale = locale === "ar" ? "en" : "ar";

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() =>
        startTransition(() => router.replace(pathname, { locale: target }))
      }
      className="inline-flex min-h-11 cursor-pointer items-center border border-line px-3 text-sm hover:border-ink hover:text-ink disabled:opacity-60"
    >
      {label}
    </button>
  );
}
