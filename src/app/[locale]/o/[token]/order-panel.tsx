"use client";

import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Price } from "@/components/site-chrome";
import type { Order } from "@/lib/orders";
import type { CheckoutKind } from "@/lib/paymob";
import type { Brief } from "@/lib/pricing";

function statusKey(status: Order["status"]) {
  switch (status) {
    case "awaiting_deposit":
      return "awaitingDeposit";
    case "in_progress":
      return "inProgress";
    case "ready_for_review":
      return "readyForReview";
    case "awaiting_balance":
      return "awaitingBalance";
    case "delivered":
      return "delivered";
  }
}

export function PayButton({
  token,
  kind,
  label,
}: {
  token: string;
  kind: CheckoutKind;
  label: string;
}) {
  const t = useTranslations("order");
  const locale = useLocale();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function pay() {
    setBusy(true);
    setError(null);
    const res = await fetch("/api/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, kind, locale }),
    });
    const data = (await res.json()) as { checkoutUrl?: string; error?: string };
    if (!res.ok || !data.checkoutUrl) {
      setBusy(false);
      setError(data.error ?? "Paymob checkout failed.");
      return;
    }
    window.location.href = data.checkoutUrl;
  }

  return (
    <div>
      <button
        type="button"
        onClick={pay}
        disabled={busy}
        className="min-h-11 bg-clay px-6 text-sm text-paper disabled:opacity-60"
      >
        {busy ? t("opening") : label}
      </button>
      {error ? <p className="mt-2 text-sm text-clay-deep">{error}</p> : null}
    </div>
  );
}

export function OrderPanel({
  initial,
  returning,
}: {
  initial: Order;
  returning: boolean;
}) {
  const t = useTranslations("order");
  const tb = useTranslations("brief");
  const [order, setOrder] = useState(initial);

  useEffect(() => {
    if (!returning) return;
    let cancelled = false;
    async function poll() {
      const res = await fetch(`/api/orders/${initial.token}`);
      if (!res.ok) return;
      const data = (await res.json()) as { order: Order };
      if (!cancelled) setOrder(data.order);
    }
    poll();
    const id = setInterval(poll, 2000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [returning, initial.token]);

  const brief = order.brief as Brief;
  const waiting =
    returning &&
    ((order.status === "awaiting_deposit" && !order.deposit_paid_at) ||
      (order.status === "awaiting_balance" && !order.balance_paid_at));

  return (
    <main className="mx-auto grid w-full max-w-6xl gap-10 px-6 py-8 sm:px-10 lg:grid-cols-[1.1fr_0.9fr]">
      <div>
        {order.preview_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={order.preview_url} alt="" className="w-full object-cover" />
        ) : (
          <div className="aspect-[4/5] bg-gradient-to-br from-sage to-ink" />
        )}
      </div>
      <div>
        <p className="text-[12px] uppercase tracking-[0.28em] text-clay">
          {waiting ? t("confirming") : t(statusKey(order.status))}
        </p>
        <h2 className="mt-3 font-display text-5xl leading-none">{t("frozen")}</h2>
        {waiting ? <p className="mt-4 text-muted">{t("confirmingBody")}</p> : null}

        <dl className="mt-8 grid gap-3 border-t border-line pt-6 text-sm">
          <div className="flex justify-between gap-4">
            <dt className="text-muted">{tb(brief.type)}</dt>
            <dd>
              {brief.subjects} · {tb(brief.detail_level)} · {tb(brief.background)}
            </dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-muted">{tb(brief.usage)}</dt>
            <dd>{brief.revisions}</dd>
          </div>
        </dl>

        <p className="mt-8 font-display text-4xl">
          <Price piastres={order.price_total} />
        </p>
        <p className="mt-2 text-sm text-muted">
          <Price piastres={order.price_deposit} /> / <Price piastres={order.price_balance} />
        </p>

        {order.status === "awaiting_deposit" && !waiting ? (
          <div className="mt-8">
            <PayButton token={order.token} kind="deposit" label={t("payDeposit")} />
          </div>
        ) : null}

        {order.status === "awaiting_balance" && !waiting ? (
          <div className="mt-8">
            <PayButton token={order.token} kind="balance" label={t("payBalance")} />
            <p className="mt-3 text-sm text-muted">{t("hiddenFinal")}</p>
          </div>
        ) : null}

        {order.status === "delivered" && order.final_url ? (
          <a className="mt-8 inline-block underline" href={order.final_url}>
            {t("download")}
          </a>
        ) : null}
      </div>
    </main>
  );
}
