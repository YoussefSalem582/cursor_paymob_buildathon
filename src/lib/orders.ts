import type { Brief } from "./pricing";

export type OrderStatus =
  | "awaiting_deposit"
  | "in_progress"
  | "ready_for_review"
  | "awaiting_balance"
  | "delivered";

export type Order = {
  id: string;
  token: string;
  created_at: string;
  client_name: string;
  client_email: string;
  client_phone: string;
  brief: Brief;
  price_total: number;
  price_deposit: number;
  price_balance: number;
  status: OrderStatus;
  deposit_paid_at: string | null;
  balance_paid_at: string | null;
  paymob_deposit_reference: string | null;
  paymob_balance_reference: string | null;
  paymob_deposit_order_id: string | null;
  paymob_balance_order_id: string | null;
  paymob_deposit_transaction_id: string | null;
  paymob_balance_transaction_id: string | null;
  preview_url: string | null;
  final_url: string | null;
};

/** Nour may walk only these two steps. Webhook owns in_progress and delivered. */
export const NOUR_TRANSITIONS: Record<OrderStatus, OrderStatus | null> = {
  awaiting_deposit: null,
  in_progress: "ready_for_review",
  ready_for_review: "awaiting_balance",
  awaiting_balance: null,
  delivered: null,
};

export const STATUS_ORDER: OrderStatus[] = [
  "awaiting_deposit",
  "in_progress",
  "ready_for_review",
  "awaiting_balance",
  "delivered",
];

export const STATUS_I18N: Record<OrderStatus, string> = {
  awaiting_deposit: "order.awaitingDeposit",
  in_progress: "order.inProgress",
  ready_for_review: "order.readyForReview",
  awaiting_balance: "order.awaitingBalance",
  delivered: "order.delivered",
};

export function publicOrder(order: Order): Order {
  if (order.balance_paid_at) return order;
  return { ...order, final_url: null };
}

export function awaitingPayment(order: Order): boolean {
  return (
    (order.status === "awaiting_deposit" && !order.deposit_paid_at) ||
    (order.status === "awaiting_balance" && !order.balance_paid_at)
  );
}

/** Deposit must land within this window of `created_at` to keep 5 stars. */
export const PAYMENT_WINDOW_MS = 72 * 60 * 60 * 1000;

export type PaymentStars = 4 | 5;

export type PaymentClock = Pick<Order, "created_at" | "deposit_paid_at">;

/** 5 if the verified deposit is inside 72h of `created_at`; otherwise 4. Unpaid past the window is already 4. */
export function paymentStars(order: PaymentClock, now = Date.now()): PaymentStars {
  const start = new Date(order.created_at).getTime();
  const paidAt = order.deposit_paid_at
    ? new Date(order.deposit_paid_at).getTime()
    : now;
  return paidAt - start > PAYMENT_WINDOW_MS ? 4 : 5;
}

export function paymentWindowRemaining(
  createdAt: string,
  now = Date.now(),
): { hours: number; minutes: number; expired: boolean } {
  const left = new Date(createdAt).getTime() + PAYMENT_WINDOW_MS - now;
  if (left <= 0) return { hours: 0, minutes: 0, expired: true };
  return {
    hours: Math.floor(left / 3_600_000),
    minutes: Math.floor((left % 3_600_000) / 60_000),
    expired: false,
  };
}

/** Last Intention correlation for Transaction Inquiry. Prefer special_reference. */
export function inquiryLookup(order: Order): {
  merchantOrderId?: string;
  paymobOrderId?: number;
} | null {
  const kind = awaitingPayment(order)
    ? order.status === "awaiting_deposit"
      ? "deposit"
      : "balance"
    : null;
  if (!kind) return null;
  const reference =
    kind === "deposit"
      ? order.paymob_deposit_reference
      : order.paymob_balance_reference;
  const paymobId =
    kind === "deposit"
      ? order.paymob_deposit_order_id
      : order.paymob_balance_order_id;
  const merchantOrderId = reference || undefined;
  const paymobOrderId =
    paymobId && /^\d+$/.test(paymobId) ? Number(paymobId) : undefined;
  if (!merchantOrderId && paymobOrderId == null) return null;
  return { merchantOrderId, paymobOrderId };
}
