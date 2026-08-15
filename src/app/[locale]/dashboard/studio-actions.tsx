"use client";

import { useRouter } from "@/i18n/navigation";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { NOUR_TRANSITIONS, type Order } from "@/lib/orders";

export function StudioActions({ order }: { order: Order }) {
  const t = useTranslations("dashboard");
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const next = NOUR_TRANSITIONS[order.status];

  if (!next) return null;

  const kind = next === "ready_for_review" ? "preview" : "final";
  const label = kind === "preview" ? t("advancePreview") : t("advanceFinal");

  return (
    <form
      className="grid gap-3"
      onSubmit={async (event) => {
        event.preventDefault();
        setBusy(true);
        const form = new FormData(event.currentTarget);
        const upload = await fetch(`/api/dashboard/orders/${order.id}/${kind}`, {
          method: "POST",
          body: form,
        });
        if (!upload.ok) {
          setBusy(false);
          return;
        }
        await fetch(`/api/dashboard/orders/${order.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: next }),
        });
        setBusy(false);
        router.refresh();
      }}
    >
      <label className="text-sm">
        {label}
        <input
          className="mt-2 w-full border border-line px-3 py-3"
          type="file"
          name="file"
          accept="image/*"
          required
        />
      </label>
      <button type="submit" disabled={busy} className="min-h-11 bg-ink text-sm text-paper">
        {busy ? t("uploading") : label}
      </button>
    </form>
  );
}
