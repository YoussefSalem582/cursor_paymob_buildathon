"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Stars } from "@/components/stars";
import {
  paymentStars,
  paymentWindowRemaining,
  type Order,
  type PaymentStars,
} from "@/lib/orders";

function AlertBox({
  stars,
  children,
}: {
  stars: PaymentStars;
  children: string;
}) {
  return (
    <div
      role="alert"
      className="border border-clay-deep/40 bg-clay/10 px-3 py-3 text-sm leading-relaxed text-clay-deep"
    >
      <div className="mb-2">
        <Stars value={stars} />
      </div>
      <p>{children}</p>
    </div>
  );
}

/** Policy on the brief, before an order exists. */
export function BriefPaymentWindowAlert() {
  const t = useTranslations("order");
  return <AlertBox stars={5}>{t("windowRule")}</AlertBox>;
}

/** Live 72h window on `/o/[token]` while a deposit is still due. */
export function OrderPaymentWindowAlert({ order }: { order: Order }) {
  const t = useTranslations("order");
  const [, setTick] = useState(0);

  useEffect(() => {
    if (order.status !== "awaiting_deposit" || order.deposit_paid_at) return;
    const id = setInterval(() => setTick((n) => n + 1), 30_000);
    return () => clearInterval(id);
  }, [order.status, order.deposit_paid_at]);

  if (order.status !== "awaiting_deposit" || order.deposit_paid_at) return null;

  const stars = paymentStars(order);
  const left = paymentWindowRemaining(order.created_at);
  const body = left.expired
    ? t("windowClosed")
    : t("windowOpen", { hours: left.hours, minutes: left.minutes });

  return <AlertBox stars={stars}>{body}</AlertBox>;
}
