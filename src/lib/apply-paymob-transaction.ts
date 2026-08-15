import { createAdminClient } from "@/lib/supabase/admin";
import {
  isPaid,
  parseSpecialReference,
  type CheckoutKind,
  type PaymobTransaction,
} from "@/lib/paymob";
import type { Order } from "@/lib/orders";

export type AppliedPaymobResult =
  | { outcome: "unmatched" }
  | { outcome: "unpaid" }
  | { outcome: "duplicate"; kind: CheckoutKind }
  | { outcome: "ignored"; kind: CheckoutKind; reason: "wrong_status" }
  | { outcome: "applied"; kind: CheckoutKind };

/**
 * Persist a verified Paymob transaction onto Escrowd deposit/balance columns.
 * Call only after HMAC verify (webhook) or a live Inquiry pull.
 */
export async function applyPaymobTransaction(
  transaction: PaymobTransaction,
): Promise<AppliedPaymobResult> {
  const ref = parseSpecialReference(transaction.order?.merchant_order_id);
  if (!ref) {
    console.warn("[paymob] unknown special_reference", {
      merchant_order_id: transaction.order?.merchant_order_id,
    });
    return { outcome: "unmatched" };
  }

  if (!isPaid(transaction)) {
    return { outcome: "unpaid" };
  }

  const admin = createAdminClient();
  const { data: row, error: loadError } = await admin
    .from("orders")
    .select("*")
    .eq("token", ref.token)
    .maybeSingle();

  if (loadError) {
    throw new Error(loadError.message);
  }
  if (!row) {
    return { outcome: "unmatched" };
  }

  const order = row as Order;
  const now = new Date().toISOString();
  const paymobOrderId =
    transaction.order?.id != null ? String(transaction.order.id) : null;
  const txnId = transaction.id != null ? String(transaction.id) : null;

  if (ref.kind === "deposit") {
    if (order.deposit_paid_at) {
      return { outcome: "duplicate", kind: "deposit" };
    }
    if (order.status !== "awaiting_deposit") {
      return { outcome: "ignored", kind: "deposit", reason: "wrong_status" };
    }
    const { error } = await admin
      .from("orders")
      .update({
        status: "in_progress",
        deposit_paid_at: now,
        paymob_deposit_order_id: paymobOrderId,
        paymob_deposit_transaction_id: txnId,
      })
      .eq("token", ref.token)
      .eq("status", "awaiting_deposit")
      .is("deposit_paid_at", null);
    if (error) {
      throw new Error(error.message);
    }
    return { outcome: "applied", kind: "deposit" };
  }

  if (order.balance_paid_at) {
    return { outcome: "duplicate", kind: "balance" };
  }
  if (order.status !== "awaiting_balance") {
    return { outcome: "ignored", kind: "balance", reason: "wrong_status" };
  }
  const { error } = await admin
    .from("orders")
    .update({
      status: "delivered",
      balance_paid_at: now,
      paymob_balance_order_id: paymobOrderId,
      paymob_balance_transaction_id: txnId,
    })
    .eq("token", ref.token)
    .eq("status", "awaiting_balance")
    .is("balance_paid_at", null);
  if (error) {
    throw new Error(error.message);
  }
  return { outcome: "applied", kind: "balance" };
}
