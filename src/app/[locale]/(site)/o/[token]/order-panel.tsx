"use client";

import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Button, buttonBase, buttonVariants } from "@/components/ui/button";
import { FieldError } from "@/components/ui/field";
import { Price } from "@/components/price";
import {
  STATUS_ORDER,
  awaitingPayment,
  type Order,
  type OrderStatus,
} from "@/lib/orders";
import type { CheckoutKind } from "@/lib/paymob";
import type { Brief } from "@/lib/pricing";
import { cn } from "@/lib/utils";

const MAX_POLLS = 15;

function statusKey(status: OrderStatus) {
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
      setError(data.error ?? t("payError"));
      return;
    }
    window.location.href = data.checkoutUrl;
  }

  return (
    <div className="grid gap-3">
      <Button type="button" variant="clay" loading={busy} className="w-full" onClick={pay}>
        {busy ? t("opening") : label}
      </Button>
      {error ? <FieldError>{error}</FieldError> : null}
    </div>
  );
}

function Timeline({ current }: { current: OrderStatus }) {
  const t = useTranslations("order");
  const currentIndex = STATUS_ORDER.indexOf(current);
  return (
    <ol className="mt-8 grid gap-2 border-t border-line pt-6 text-sm">
      {STATUS_ORDER.map((status, index) => {
        const done = index < currentIndex;
        const active = index === currentIndex;
        return (
          <li
            key={status}
            className={`flex items-center gap-3 ${
              active ? "text-clay" : done ? "text-ink" : "text-muted"
            }`}
          >
            <span
              className={`flex size-6 shrink-0 items-center justify-center text-[11px] tabular-nums ${
                active
                  ? "bg-clay text-paper"
                  : done
                    ? "bg-ink text-paper"
                    : "border border-line"
              }`}
            >
              {index + 1}
            </span>
            {t(statusKey(status))}
          </li>
        );
      })}
    </ol>
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
  const [trouble, setTrouble] = useState(false);

  useEffect(() => {
    if (!returning) return;
    let cancelled = false;
    let ticks = 0;

    async function poll(reconcile: boolean) {
      try {
        const res = await fetch(
          `/api/orders/${initial.token}${reconcile ? "?reconcile=1" : ""}`,
        );
        if (!res.ok) throw new Error("status");
        const data = (await res.json()) as { order: Order };
        if (cancelled) return data.order;
        setOrder(data.order);
        setTrouble(false);
        if (!awaitingPayment(data.order) && interval) {
          clearInterval(interval);
        }
        return data.order;
      } catch {
        if (!cancelled) setTrouble(true);
        return null;
      }
    }

    const interval = setInterval(async () => {
      ticks += 1;
      if (ticks >= MAX_POLLS) {
        clearInterval(interval);
        const latest = await poll(true);
        if (!cancelled && (!latest || awaitingPayment(latest))) {
          setTrouble(true);
        }
        return;
      }
      await poll(false);
    }, 2000);
    poll(true);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [returning, initial.token]);

  const brief = order.brief as Brief;
  const waiting = returning && awaitingPayment(order);

  return (
    <main className="mx-auto grid w-full max-w-6xl gap-8 px-4 py-6 sm:gap-10 sm:px-10 sm:py-8 lg:grid-cols-[1.1fr_0.9fr]">
      <div className="order-2 min-w-0 lg:order-1">
        {order.preview_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={order.preview_url}
            alt=""
            className="max-h-[50vh] w-full object-cover lg:max-h-none"
          />
        ) : (
          <div className="aspect-[4/5] max-h-[50vh] bg-gradient-to-br from-sage to-ink lg:max-h-none" />
        )}
      </div>
      <div className="order-1 min-w-0 lg:order-2">
        <p className="text-[12px] uppercase tracking-[0.28em] text-clay">
          {waiting ? t("confirming") : t(statusKey(order.status))}
        </p>
        <h2 className="mt-3 font-display text-4xl leading-none sm:text-5xl">{t("frozen")}</h2>
        {waiting ? <p className="mt-4 text-muted">{t("confirmingBody")}</p> : null}
        {trouble ? <p className="mt-4 text-sm text-clay-deep">{t("trouble")}</p> : null}

        <Timeline current={order.status} />

        <dl className="mt-8 grid gap-3 border-t border-line pt-6 text-sm">
          <div className="flex flex-col gap-1 sm:flex-row sm:justify-between sm:gap-4">
            <dt className="text-muted">{tb(brief.type)}</dt>
            <dd className="min-w-0 sm:text-end">
              {brief.subjects} · {tb(brief.detail_level)} · {tb(brief.background)}
            </dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-muted">{tb(brief.usage)}</dt>
            <dd>{brief.revisions}</dd>
          </div>
        </dl>

        <p className="mt-8 font-display text-3xl sm:text-4xl">
          <Price piastres={order.price_total} />
        </p>
        <p className="mt-2 flex flex-col gap-1 text-sm text-muted sm:flex-row sm:gap-0">
          <span className="sm:me-3">
            {t("deposit")}: <Price piastres={order.price_deposit} />
          </span>
          <span>
            {t("balance")}: <Price piastres={order.price_balance} />
          </span>
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
          <a
            className={cn(buttonBase, buttonVariants.primary, "mt-8 w-full sm:w-auto")}
            href={order.final_url}
          >
            {t("download")}
          </a>
        ) : null}
      </div>
    </main>
  );
}
