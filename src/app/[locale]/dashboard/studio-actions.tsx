"use client";

import { useRouter } from "@/i18n/navigation";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { NOUR_TRANSITIONS, type Order } from "@/lib/orders";

export function StudioActions({ order }: { order: Order }) {
  const t = useTranslations("dashboard");
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
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
        setError(null);
        const form = new FormData(event.currentTarget);
        const upload = await fetch(`/api/dashboard/orders/${order.id}/${kind}`, {
          method: "POST",
          body: form,
        });
        const uploadData = (await upload.json().catch(() => ({}))) as {
          error?: string;
        };
        if (!upload.ok) {
          setBusy(false);
          setError(uploadData.error ?? t("uploadError"));
          return;
        }
        const patch = await fetch(`/api/dashboard/orders/${order.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: next }),
        });
        const patchData = (await patch.json().catch(() => ({}))) as {
          error?: string;
        };
        if (!patch.ok) {
          setBusy(false);
          setError(patchData.error ?? t("advanceError"));
          return;
        }
        setBusy(false);
        router.refresh();
      }}
    >
      <label className="text-sm">
        {label}
        <input
          className="mt-2 w-full border border-line bg-paper px-3 py-3"
          type="file"
          name="file"
          accept="image/*"
          required
        />
      </label>
      {error ? <p className="text-sm text-clay-deep">{error}</p> : null}
      <button
        type="submit"
        disabled={busy}
        className="min-h-11 bg-ink text-sm text-paper disabled:opacity-60"
      >
        {busy ? t("uploading") : label}
      </button>
    </form>
  );
}
