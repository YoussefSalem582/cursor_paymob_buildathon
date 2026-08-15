import type { ReactNode } from "react";
import { notFound } from "next/navigation";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { EscrowdLogoFrame } from "@/components/escrowd-logo";
import { Price } from "@/components/price";
import { Stars } from "@/components/stars";
import { STATUS_I18N, paymentStars } from "@/lib/orders";
import type { Brief } from "@/lib/pricing";
import { loadStudioOrder } from "@/lib/studio-data";
import { formatStamp } from "@/lib/studio-stats";
import { StudioActions } from "../../studio-actions";

function stamp(value: string | null, locale: string, empty: string) {
  return formatStamp(value, locale) ?? empty;
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid gap-1 border-b border-line py-2 text-sm sm:flex sm:justify-between sm:gap-4">
      <dt className="text-muted">{label}</dt>
      <dd className="min-w-0 break-all sm:max-w-[70%] sm:text-end">{children}</dd>
    </div>
  );
}

export default async function StudioOrderPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  const order = await loadStudioOrder(id);
  if (!order) notFound();
  const brief = (order.brief ?? null) as Brief | null;
  const t = await getTranslations();
  const empty = t("dashboard.notYet");
  const stars = paymentStars(order);

  return (
    <main className="mx-auto grid w-full max-w-6xl gap-8 px-4 py-6 sm:gap-10 sm:px-10 sm:py-8 lg:grid-cols-2">
      <div className="grid gap-6">
        <div>
          <p className="mb-2 text-xs uppercase tracking-widest text-muted">
            {t("order.preview")}
          </p>
          {order.preview_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={order.preview_url} alt="" className="w-full object-cover" />
          ) : (
            <EscrowdLogoFrame className="aspect-[4/5] border border-line" />
          )}
        </div>
        <div>
          <p className="mb-2 text-xs uppercase tracking-widest text-muted">
            {t("dashboard.finalFile")}
          </p>
          {order.final_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={order.final_url} alt="" className="w-full object-cover" />
          ) : (
            <p className="border border-line px-3 py-4 text-sm text-muted">
              {t("dashboard.noFinal")}
            </p>
          )}
        </div>
      </div>
      <div>
        <Link href="/dashboard/orders" className="text-sm text-muted hover:text-ink">
          <span aria-hidden="true" className="me-1 inline-block ltr:rotate-180">
            →
          </span>
          {t("dashboard.back")}
        </Link>
        <p className="mt-4 text-[12px] uppercase tracking-[0.28em] text-clay">
          {t(STATUS_I18N[order.status])}
        </p>
        <h2 className="mt-2 break-words font-display text-4xl leading-none sm:text-5xl">
          {order.client_name}
        </h2>
        <p className="mt-2 grid gap-1 text-sm text-muted">
          <span className="break-all">{order.client_email}</span>
          <span dir="ltr">{order.client_phone}</span>
        </p>
        <p className="mt-2 text-sm">
          <Link href={`/o/${order.token}`} className="text-clay hover:text-clay-deep">
            /o/{order.token}
          </Link>
        </p>
        <div className="mt-6 border border-line p-3">
          <p className="text-xs uppercase tracking-widest text-muted">
            {t("dashboard.rating")}
          </p>
          <p className="mt-2">
            <Stars
              value={stars}
              label={t("dashboard.ratingStars", { stars })}
            />
          </p>
          <p className="mt-2 text-sm text-muted">
            {stars === 5 ? t("dashboard.ratingOnTime") : t("dashboard.ratingLate")}
          </p>
        </div>

        <h3 className="mt-8 font-display text-2xl">{t("order.frozen")}</h3>
        <dl className="mt-2">
          <Field label={t("commission.type")}>
            {brief?.type ? t(`brief.${brief.type}`) : empty}
          </Field>
          <Field label={t("commission.subjects")}>
            {brief?.subjects ?? empty}
          </Field>
          <Field label={t("commission.detail")}>
            {brief?.detail_level ? t(`brief.${brief.detail_level}`) : empty}
          </Field>
          <Field label={t("commission.background")}>
            {brief?.background ? t(`brief.${brief.background}`) : empty}
          </Field>
          <Field label={t("commission.usage")}>
            {brief?.usage ? t(`brief.${brief.usage}`) : empty}
          </Field>
          <Field label={t("commission.revisions")}>
            {brief?.revisions ?? empty}
          </Field>
        </dl>

        <h3 className="mt-8 font-display text-2xl">{t("dashboard.money")}</h3>
        <dl className="mt-2">
          <Field label={t("commission.total")}>
            <Price piastres={order.price_total} />
          </Field>
          <Field label={t("commission.deposit")}>
            <Price piastres={order.price_deposit} />
          </Field>
          <Field label={t("commission.balance")}>
            <Price piastres={order.price_balance} />
          </Field>
        </dl>

        <h3 className="mt-8 font-display text-2xl">{t("dashboard.timeline")}</h3>
        <dl className="mt-2">
          <Field label={t("dashboard.createdAt")}>
            {stamp(order.created_at, locale, empty)}
          </Field>
          <Field label={t("dashboard.depositPaid")}>
            {stamp(order.deposit_paid_at, locale, empty)}
          </Field>
          <Field label={t("dashboard.previewReady")}>
            {order.preview_url ? t("dashboard.uploaded") : empty}
          </Field>
          <Field label={t("dashboard.finalReady")}>
            {order.final_url ? t("dashboard.uploaded") : empty}
          </Field>
          <Field label={t("dashboard.balancePaid")}>
            {stamp(order.balance_paid_at, locale, empty)}
          </Field>
        </dl>

        <h3 className="mt-8 font-display text-2xl">{t("dashboard.paymob")}</h3>
        <dl className="mt-2">
          <Field label={t("dashboard.depositRef")}>
            {order.paymob_deposit_reference ?? empty}
          </Field>
          <Field label={t("dashboard.depositOrder")}>
            {order.paymob_deposit_order_id ?? empty}
          </Field>
          <Field label={t("dashboard.depositTxn")}>
            {order.paymob_deposit_transaction_id ?? empty}
          </Field>
          <Field label={t("dashboard.balanceRef")}>
            {order.paymob_balance_reference ?? empty}
          </Field>
          <Field label={t("dashboard.balanceOrder")}>
            {order.paymob_balance_order_id ?? empty}
          </Field>
          <Field label={t("dashboard.balanceTxn")}>
            {order.paymob_balance_transaction_id ?? empty}
          </Field>
        </dl>

        <div className="mt-8">
          <StudioActions order={order} />
        </div>
      </div>
    </main>
  );
}
