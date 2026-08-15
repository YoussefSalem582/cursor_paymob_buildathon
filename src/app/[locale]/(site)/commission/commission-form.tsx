"use client";

import { useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { ChoiceGroup } from "@/components/ui/choice-group";
import { BriefPaymentWindowAlert } from "@/components/payment-window-alert";
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
import {
  EMAIL_MAX,
  NAME_MAX,
  parseContact,
  type ContactError,
  type ContactField,
} from "@/lib/validate";

const CONTACT_I18N = {
  invalid_name: "invalidName",
  invalid_email: "invalidEmail",
  invalid_phone: "invalidPhone",
  invalid_brief: "invalidBrief",
} as const;

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
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<ContactField, string>>>({});
  const [brief, setBrief] = useState<Brief>({
    type: "portrait",
    subjects: 1,
    detail_level: "full render",
    background: "simple",
    usage: "personal",
    revisions: 2,
  });

  const priced = useMemo(() => priceBrief(brief), [brief]);

  function contactMessage(code: string) {
    if (code in CONTACT_I18N) {
      return t(CONTACT_I18N[code as ContactError | "invalid_brief"]);
    }
    return t("error");
  }

  function clearField(field: ContactField) {
    setFieldErrors((current) => {
      if (!current[field]) return current;
      const next = { ...current };
      delete next[field];
      return next;
    });
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    setFieldErrors({});
    const form = new FormData(event.currentTarget);
    const contact = parseContact({
      name: form.get("name"),
      email: form.get("email"),
      phone: form.get("phone"),
    });
    if (!contact.ok) {
      setBusy(false);
      const message = contactMessage(contact.error);
      setFieldErrors({ [contact.field!]: message });
      setError(message);
      return;
    }

    const res = await fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: contact.value.name,
        email: contact.value.email,
        phone: contact.value.phone,
        brief,
      }),
    });
    const data = (await res.json()) as {
      token?: string;
      error?: string;
      field?: ContactField | "brief";
    };
    if (!res.ok || !data.token) {
      setBusy(false);
      const message = data.error ? contactMessage(data.error) : t("error");
      if (data.field && data.field !== "brief") {
        setFieldErrors({ [data.field]: message });
      }
      setError(message);
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
    <form
      onSubmit={onSubmit}
      noValidate
      className="grid gap-8 max-lg:pb-52"
      aria-busy={busy || undefined}
    >
      <fieldset className="grid min-w-0 gap-5">
        <legend className="float-none w-full font-display text-2xl">{t("contactSection")}</legend>
        <Input
          label={t("name")}
          name="name"
          required
          autoComplete="name"
          autoCapitalize="words"
          maxLength={NAME_MAX}
          placeholder={t("namePlaceholder")}
          error={fieldErrors.name}
          onChange={() => clearField("name")}
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
            maxLength={EMAIL_MAX}
            placeholder={t("emailPlaceholder")}
            error={fieldErrors.email}
            onChange={() => clearField("email")}
          />
          <Input
            label={t("phone")}
            name="phone"
            type="tel"
            required
            autoComplete="tel"
            inputMode="tel"
            dir="ltr"
            maxLength={16}
            placeholder={t("phonePlaceholder")}
            hint={t("phoneHint")}
            error={fieldErrors.phone}
            onChange={() => clearField("phone")}
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

      <PriceSummary
        locale={locale}
        total={priced.totalEgp}
        deposit={piastresToEgp(priced.depositPiastres)}
        balance={piastresToEgp(priced.balancePiastres)}
        commercial={brief.usage === "commercial"}
        error={error}
        busy={busy}
        className="hidden lg:block"
      />
      <PriceSummary
        locale={locale}
        total={priced.totalEgp}
        deposit={piastresToEgp(priced.depositPiastres)}
        balance={piastresToEgp(priced.balancePiastres)}
        commercial={brief.usage === "commercial"}
        error={error}
        busy={busy}
        compact
        className="fixed inset-x-0 bottom-0 z-10 border-t border-line bg-paper/95 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pl-[max(1rem,env(safe-area-inset-left))] pr-[max(1rem,env(safe-area-inset-right))] backdrop-blur-sm lg:hidden"
      />
    </form>
  );
}

function PriceSummary({
  locale,
  total,
  deposit,
  balance,
  commercial,
  error,
  busy,
  compact = false,
  className,
}: {
  locale: string;
  total: number;
  deposit: number;
  balance: number;
  commercial: boolean;
  error: string | null;
  busy: boolean;
  compact?: boolean;
  className?: string;
}) {
  const t = useTranslations("commission");
  const to = useTranslations("order");
  return (
    <div className={className}>
      <div className={compact ? undefined : "border border-line p-4"}>
        <div className="flex items-baseline justify-between gap-3">
          <p className="text-[11px] uppercase tracking-[0.28em] text-clay sm:text-[12px]">
            {t("priceLive")}
          </p>
          <p
            className={compact ? "font-display text-2xl" : "font-display text-3xl"}
            aria-live="polite"
          >
            {money(locale, total)}
          </p>
        </div>
        {compact ? (
          <p className="mt-1 text-xs text-muted">
            {t("deposit")} {money(locale, deposit)}
            <span className="mx-2 text-line">·</span>
            {t("balance")} {money(locale, balance)}
          </p>
        ) : (
          <dl className="mt-3 grid gap-1 text-sm text-muted">
            <div className="flex justify-between gap-4">
              <dt>{t("deposit")}</dt>
              <dd className="text-ink tabular-nums">{money(locale, deposit)}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt>{t("balance")}</dt>
              <dd className="text-ink tabular-nums">{money(locale, balance)}</dd>
            </div>
          </dl>
        )}
        {compact ? null : (
          <p className="mt-3 text-xs leading-relaxed text-muted">{t("priceNote")}</p>
        )}
        {commercial ? (
          <p className="mt-2 text-sm text-clay-deep">{t("commercialNote")}</p>
        ) : null}
        {compact ? (
          <p className="mt-2 text-[11px] leading-snug text-clay-deep">
            {to("windowRule")}
          </p>
        ) : (
          <div className="mt-3">
            <BriefPaymentWindowAlert />
          </div>
        )}
        {error ? (
          <div className="mt-3">
            <FieldError>{error}</FieldError>
          </div>
        ) : null}
        <Button type="submit" loading={busy} className="mt-3 w-full">
          {busy ? t("submitting") : t("submit")}
        </Button>
      </div>
    </div>
  );
}
