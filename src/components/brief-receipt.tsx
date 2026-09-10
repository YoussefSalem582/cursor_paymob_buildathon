"use client";

import { useLocale, useTranslations } from "next-intl";
import { Price } from "@/components/price";
import type { Order } from "@/lib/orders";
import type { Brief } from "@/lib/pricing";

function stampDate(value: string, locale: string) {
  return new Intl.DateTimeFormat(locale === "ar" ? "ar-EG" : "en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export function BriefReceipt({ order }: { order: Order }) {
  const t = useTranslations("receipt");
  const tb = useTranslations("brief");
  const locale = useLocale();
  const brief = order.brief as Brief;
  const lockedAt = order.deposit_paid_at ?? null;

  return (
    <section className="mt-8 border border-line p-4 sm:p-5" aria-labelledby="brief-receipt-title">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[12px] uppercase tracking-[0.28em] text-clay">{t("kicker")}</p>
          <h3 id="brief-receipt-title" className="mt-2 font-display text-2xl leading-none sm:text-3xl">
            {t("title")}
          </h3>
        </div>
        <p className="rounded-full border border-line px-3 py-1 text-[12px] text-muted">
          {lockedAt ? t("locked", { when: stampDate(lockedAt, locale) }) : t("pending")}
        </p>
      </div>

      <dl className="mt-6 grid gap-3 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-muted">{t("token")}</dt>
          <dd className="mt-1 font-mono text-[13px] tracking-wide" dir="ltr">
            {order.token}
          </dd>
        </div>
        <div>
          <dt className="text-muted">{t("opened")}</dt>
          <dd className="mt-1">{stampDate(order.created_at, locale)}</dd>
        </div>
        <div>
          <dt className="text-muted">{tb(brief.type)}</dt>
          <dd className="mt-1">
            {brief.subjects} · {tb(brief.detail_level)} · {tb(brief.background)}
          </dd>
        </div>
        <div>
          <dt className="text-muted">{tb(brief.usage)}</dt>
          <dd className="mt-1">{t("revisions", { count: brief.revisions })}</dd>
        </div>
        <div>
          <dt className="text-muted">{t("deposit")}</dt>
          <dd className="mt-1">
            <Price piastres={order.price_deposit} />
          </dd>
        </div>
        <div>
          <dt className="text-muted">{t("balance")}</dt>
          <dd className="mt-1">
            <Price piastres={order.price_balance} />
          </dd>
        </div>
      </dl>

      <p className="mt-5 font-display text-3xl">
        <Price piastres={order.price_total} />
      </p>
      <p className="mt-2 text-sm text-muted">{t("note")}</p>
    </section>
  );
}
