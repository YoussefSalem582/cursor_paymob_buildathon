"use client";

import { useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import {
  BACKGROUNDS,
  BRIEF_TYPES,
  DETAIL_LEVELS,
  USAGES,
  priceBrief,
  type Brief,
} from "@/lib/pricing";
import { piastresToEgp } from "@/lib/paymob";

const field = "mt-2 w-full border border-line bg-paper px-3 py-3 text-ink";

export function CommissionForm() {
  const t = useTranslations("commission");
  const tb = useTranslations("brief");
  const locale = useLocale();
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [brief, setBrief] = useState<Brief>({
    type: "portrait",
    subjects: 1,
    detail_level: "full render",
    background: "simple",
    usage: "personal",
    revisions: 2,
  });

  const priced = useMemo(() => priceBrief(brief), [brief]);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    const form = new FormData(event.currentTarget);
    const res = await fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.get("name"),
        email: form.get("email"),
        phone: form.get("phone"),
        brief,
      }),
    });
    const data = (await res.json()) as { token?: string; error?: string };
    if (!res.ok || !data.token) {
      setBusy(false);
      setError(data.error ?? t("error"));
      return;
    }
    router.push(`/o/${data.token}`);
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-5">
      <label className="block text-sm">
        {t("name")}
        <input className={field} name="name" required autoComplete="name" />
      </label>
      <div className="grid gap-5 sm:grid-cols-2">
        <label className="block text-sm">
          {t("email")}
          <input className={field} name="email" type="email" required autoComplete="email" />
        </label>
        <label className="block text-sm">
          {t("phone")}
          <input className={field} name="phone" type="tel" required autoComplete="tel" />
        </label>
      </div>

      <label className="block text-sm">
        {t("type")}
        <select
          className={field}
          value={brief.type}
          onChange={(e) =>
            setBrief((b) => ({ ...b, type: e.target.value as Brief["type"] }))
          }
        >
          {BRIEF_TYPES.map((value) => (
            <option key={value} value={value}>
              {tb(value)}
            </option>
          ))}
        </select>
      </label>

      <label className="block text-sm">
        {t("subjects")}
        <input
          className={field}
          type="number"
          min={1}
          max={8}
          value={brief.subjects}
          onChange={(e) =>
            setBrief((b) => ({ ...b, subjects: Number(e.target.value) }))
          }
        />
      </label>

      <label className="block text-sm">
        {t("detail")}
        <select
          className={field}
          value={brief.detail_level}
          onChange={(e) =>
            setBrief((b) => ({
              ...b,
              detail_level: e.target.value as Brief["detail_level"],
            }))
          }
        >
          {DETAIL_LEVELS.map((value) => (
            <option key={value} value={value}>
              {tb(value)}
            </option>
          ))}
        </select>
      </label>

      <label className="block text-sm">
        {t("background")}
        <select
          className={field}
          value={brief.background}
          onChange={(e) =>
            setBrief((b) => ({
              ...b,
              background: e.target.value as Brief["background"],
            }))
          }
        >
          {BACKGROUNDS.map((value) => (
            <option key={value} value={value}>
              {tb(value)}
            </option>
          ))}
        </select>
      </label>

      <label className="block text-sm">
        {t("usage")}
        <select
          className={field}
          value={brief.usage}
          onChange={(e) =>
            setBrief((b) => ({ ...b, usage: e.target.value as Brief["usage"] }))
          }
        >
          {USAGES.map((value) => (
            <option key={value} value={value}>
              {tb(value)}
            </option>
          ))}
        </select>
      </label>

      <label className="block text-sm">
        {t("revisions")}
        <input
          className={field}
          type="number"
          min={0}
          max={6}
          value={brief.revisions}
          onChange={(e) =>
            setBrief((b) => ({ ...b, revisions: Number(e.target.value) }))
          }
        />
      </label>

      <div className="border border-line p-4">
        <p className="font-display text-3xl">
          {new Intl.NumberFormat(locale === "ar" ? "ar-EG" : "en-EG", {
            style: "currency",
            currency: "EGP",
            maximumFractionDigits: 0,
          }).format(priced.totalEgp)}
        </p>
        <p className="mt-2 text-sm text-muted">
          {t("deposit")}: {piastresToEgp(priced.depositPiastres)} · {t("balance")}:{" "}
          {piastresToEgp(priced.balancePiastres)}
        </p>
        {brief.usage === "commercial" ? (
          <p className="mt-2 text-sm text-clay-deep">{t("commercialNote")}</p>
        ) : null}
      </div>

      {error ? <p className="text-sm text-clay-deep">{error}</p> : null}
      <button
        type="submit"
        disabled={busy}
        className="min-h-11 bg-ink px-6 text-sm text-paper disabled:opacity-60"
      >
        {busy ? t("submitting") : t("submit")}
      </button>
    </form>
  );
}
