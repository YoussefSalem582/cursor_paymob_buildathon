"use client";

import { useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { ChoiceGroup } from "@/components/ui/choice-group";
import { FieldError } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Stepper } from "@/components/ui/stepper";
import {
  BACKGROUNDS,
  BRIEF_TYPES,
  DETAIL_LEVELS,
  USAGES,
  priceBrief,
  type Brief,
} from "@/lib/pricing";
import { piastresToEgp } from "@/lib/paymob";

function money(locale: string, egp: number) {
  return new Intl.NumberFormat(locale === "ar" ? "ar-EG" : "en-EG", {
    style: "currency",
    currency: "EGP",
    maximumFractionDigits: 0,
  }).format(egp);
}

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

    const checkout = await fetch("/api/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: data.token, kind: "deposit", locale }),
    });
    const pay = (await checkout.json()) as { checkoutUrl?: string; error?: string };
    if (checkout.ok && pay.checkoutUrl) {
      window.location.href = pay.checkoutUrl;
      return;
    }
    setBusy(false);
    router.push(`/o/${data.token}`);
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-8" aria-busy={busy || undefined}>
      <fieldset className="grid min-w-0 gap-5">
        <legend className="float-none w-full font-display text-2xl">{t("contactSection")}</legend>
        <Input
          label={t("name")}
          name="name"
          required
          autoComplete="name"
          autoCapitalize="words"
          placeholder={t("namePlaceholder")}
        />
        <div className="grid gap-5 sm:grid-cols-2">
          <Input
            label={t("email")}
            name="email"
            type="email"
            required
            autoComplete="email"
            inputMode="email"
            spellCheck={false}
            dir="ltr"
            placeholder={t("emailPlaceholder")}
          />
          <Input
            label={t("phone")}
            name="phone"
            type="tel"
            required
            autoComplete="tel"
            inputMode="tel"
            dir="ltr"
            placeholder={t("phonePlaceholder")}
            hint={t("phoneHint")}
          />
        </div>
      </fieldset>

      <fieldset className="grid min-w-0 gap-5">
        <legend className="float-none w-full font-display text-2xl">{t("briefSection")}</legend>
        <ChoiceGroup
          legend={t("type")}
          columns={4}
          value={brief.type}
          onChange={(type) => setBrief((b) => ({ ...b, type }))}
          options={BRIEF_TYPES.map((value) => ({ value, label: tb(value) }))}
        />
        <Stepper
          label={t("subjects")}
          hint={t("subjectsHint")}
          value={brief.subjects}
          min={1}
          max={8}
          onChange={(subjects) => setBrief((b) => ({ ...b, subjects }))}
          decreaseLabel={t("decrease")}
          increaseLabel={t("increase")}
        />
        <ChoiceGroup
          legend={t("detail")}
          columns={3}
          value={brief.detail_level}
          onChange={(detail_level) => setBrief((b) => ({ ...b, detail_level }))}
          options={DETAIL_LEVELS.map((value) => ({ value, label: tb(value) }))}
        />
        <ChoiceGroup
          legend={t("background")}
          columns={3}
          value={brief.background}
          onChange={(background) => setBrief((b) => ({ ...b, background }))}
          options={BACKGROUNDS.map((value) => ({ value, label: tb(value) }))}
        />
        <ChoiceGroup
          legend={t("usage")}
          columns={2}
          value={brief.usage}
          onChange={(usage) => setBrief((b) => ({ ...b, usage }))}
          options={USAGES.map((value) => ({
            value,
            label: tb(value),
            accent: value === "commercial",
          }))}
        />
        <Stepper
          label={t("revisions")}
          hint={t("revisionsHint")}
          value={brief.revisions}
          min={0}
          max={6}
          onChange={(revisions) => setBrief((b) => ({ ...b, revisions }))}
          decreaseLabel={t("decrease")}
          increaseLabel={t("increase")}
        />
      </fieldset>

      <div className="sticky bottom-0 z-10 border border-line bg-paper/95 p-4 pb-[max(1rem,env(safe-area-inset-bottom))] backdrop-blur-sm lg:static lg:pb-4 lg:backdrop-blur-none">
        <p className="text-[12px] uppercase tracking-[0.28em] text-clay">
          {t("priceLive")}
        </p>
        <p className="mt-2 font-display text-3xl" aria-live="polite">
          {money(locale, priced.totalEgp)}
        </p>
        <dl className="mt-3 grid gap-1 text-sm text-muted">
          <div className="flex justify-between gap-4">
            <dt>{t("deposit")}</dt>
            <dd className="text-ink tabular-nums">
              {money(locale, piastresToEgp(priced.depositPiastres))}
            </dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt>{t("balance")}</dt>
            <dd className="text-ink tabular-nums">
              {money(locale, piastresToEgp(priced.balancePiastres))}
            </dd>
          </div>
        </dl>
        <p className="mt-3 text-xs leading-relaxed text-muted">{t("priceNote")}</p>
        {brief.usage === "commercial" ? (
          <p className="mt-2 text-sm text-clay-deep">{t("commercialNote")}</p>
        ) : null}
        {error ? (
          <div className="mt-4">
            <FieldError>{error}</FieldError>
          </div>
        ) : null}
        <Button type="submit" loading={busy} className="mt-4 w-full">
          {busy ? t("submitting") : t("submit")}
        </Button>
      </div>
    </form>
  );
}
