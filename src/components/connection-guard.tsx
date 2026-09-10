"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

export function useOnline() {
  const [online, setOnline] = useState(true);

  useEffect(() => {
    const sync = () => setOnline(navigator.onLine);
    sync();
    window.addEventListener("online", sync);
    window.addEventListener("offline", sync);
    return () => {
      window.removeEventListener("online", sync);
      window.removeEventListener("offline", sync);
    };
  }, []);

  return online;
}

export function ConnectionGuard({ className }: { className?: string }) {
  const online = useOnline();
  const t = useTranslations("connection");
  if (online) return null;
  return (
    <p
      role="status"
      className={cn(
        "border border-clay/40 bg-clay/10 px-3 py-2 text-sm text-clay-deep",
        className,
      )}
    >
      {t("offline")}
    </p>
  );
}
