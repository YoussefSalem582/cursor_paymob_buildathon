import { notFound } from "next/navigation";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { Link, redirect } from "@/i18n/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireNour } from "@/lib/nour-auth";
import { EscrowdLogoFrame } from "@/components/escrowd-logo";
import { Price } from "@/components/price";
import { StudioActions } from "../studio-actions";
import { STATUS_I18N, type Order } from "@/lib/orders";
import type { Brief } from "@/lib/pricing";

export const dynamic = "force-dynamic";

function paidAt(value: string | null, locale: string) {
  if (!value) return "—";
  return new Intl.DateTimeFormat(locale === "ar" ? "ar-EG" : "en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export default async function DashboardOrderPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  const user = await requireNour();
  if (!user) redirect({ href: "/sign-in", locale });

  const admin = createAdminClient();
  const { data } = await admin.from("orders").select("*").eq("id", id).maybeSingle();
  if (!data) notFound();
  const order = data as Order;
  const brief = order.brief as Brief;
  const t = await getTranslations();

  return (
    <main className="mx-auto grid w-full max-w-6xl gap-10 px-6 py-8 sm:px-10 lg:grid-cols-2">
      <div>
        {order.preview_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={order.preview_url} alt="" className="w-full object-cover" />
        ) : (
          <EscrowdLogoFrame className="aspect-[4/5] border border-line" />
        )}
      </div>
      <div>
        <Link href="/dashboard" className="text-sm text-muted hover:text-ink">
          <span aria-hidden="true" className="me-1 inline-block ltr:rotate-180">
            →
          </span>
          {t("dashboard.back")}
        </Link>
        <p className="mt-4 text-[12px] uppercase tracking-[0.28em] text-clay">
          {t(STATUS_I18N[order.status])}
        </p>
        <h2 className="mt-2 font-display text-5xl leading-none">{order.client_name}</h2>
        <p className="mt-2 text-sm text-muted">
          {order.client_email} · {order.client_phone}
        </p>
        <dl className="mt-6 grid gap-2 text-sm">
          <div className="flex justify-between gap-4">
            <dt className="text-muted">{t("commission.type")}</dt>
            <dd>{t(`brief.${brief.type}`)}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-muted">{t("commission.subjects")}</dt>
            <dd>{brief.subjects}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-muted">{t("commission.detail")}</dt>
            <dd>{t(`brief.${brief.detail_level}`)}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-muted">{t("commission.background")}</dt>
            <dd>{t(`brief.${brief.background}`)}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-muted">{t("commission.usage")}</dt>
            <dd>{t(`brief.${brief.usage}`)}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-muted">{t("commission.revisions")}</dt>
            <dd>{brief.revisions}</dd>
          </div>
        </dl>
        <p className="mt-6 font-display text-3xl">
          <Price piastres={order.price_total} />
        </p>
        <p className="mt-2 text-sm text-muted">
          {t("commission.deposit")}: <Price piastres={order.price_deposit} />
          <span className="mx-2 text-line">·</span>
          {t("commission.balance")}: <Price piastres={order.price_balance} />
        </p>
        <p className="mt-4 text-sm text-muted">
          {t("dashboard.depositPaid")}: {paidAt(order.deposit_paid_at, locale)}
        </p>
        <p className="text-sm text-muted">
          {t("dashboard.balancePaid")}: {paidAt(order.balance_paid_at, locale)}
        </p>
        <p className="mt-2 text-sm text-muted">/o/{order.token}</p>
        <div className="mt-8">
          <StudioActions order={order} />
        </div>
      </div>
    </main>
  );
}
