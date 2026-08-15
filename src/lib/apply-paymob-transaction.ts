import { createAdminClient } from "@/lib/supabase/admin";
import { isPaid, type PaymobTransaction } from "@/lib/paymob";

export type AppliedPaymobResult = {
  status: "paid" | "pending" | "failed";
  orderId: string | null;
  paymobOrderId: string | null;
  matched: number;
};

/**
 * Persist a Paymob transaction onto the demo `orders` row.
 * Call this only after HMAC verify (webhook) or a live Inquiry pull.
 */
export async function applyPaymobTransaction(
  transaction: PaymobTransaction,
): Promise<AppliedPaymobResult> {
  const status = isPaid(transaction)
    ? "paid"
    : transaction.pending
      ? "pending"
      : "failed";

  const orderId = transaction.order?.merchant_order_id ?? null;
  const paymobOrderId =
    transaction.order?.id != null ? String(transaction.order.id) : null;

  const admin = createAdminClient();
  const query = admin
    .from("orders")
    .update({ status, paymob_order_id: paymobOrderId });

  const { data, error } = orderId
    ? await query.eq("id", orderId).select("id")
    : await query.eq("paymob_order_id", paymobOrderId).select("id");

  if (error) {
    throw new Error(error.message);
  }

  return {
    status,
    orderId,
    paymobOrderId,
    matched: data?.length ?? 0,
  };
}
