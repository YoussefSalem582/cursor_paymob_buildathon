import { NextResponse, type NextRequest } from "next/server";
import { applyPaymobTransaction } from "@/lib/apply-paymob-transaction";
import {
  inquireTransaction,
  inquireTransactionById,
} from "@/lib/paymob";
import { parseMerchantOrderId, parsePositiveInt } from "@/lib/validate";

/**
 * Pull-based reconciliation when the webhook never arrived.
 * Does not replace HMAC on callbacks — Inquiry talks to Paymob with PAYMOB_API_KEY.
 *
 * POST { orderId?, paymobOrderId?, transactionId? }
 */
export async function POST(request: NextRequest) {
  try {
    const body = (await request.json().catch(() => ({}))) as {
      orderId?: unknown;
      paymobOrderId?: unknown;
      transactionId?: unknown;
    };

    const transactionId = parsePositiveInt(body.transactionId);
    const paymobOrderId = parsePositiveInt(body.paymobOrderId);
    const orderId = parseMerchantOrderId(body.orderId);

    if (!orderId && paymobOrderId == null && transactionId == null) {
      return NextResponse.json(
        { error: "Provide orderId, paymobOrderId, or transactionId" },
        { status: 400 },
      );
    }

    const transaction =
      transactionId != null
        ? await inquireTransactionById(transactionId)
        : await inquireTransaction({
            merchantOrderId: orderId,
            paymobOrderId,
          });

    const result = await applyPaymobTransaction(transaction);
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    console.error("[paymob inquiry]", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Inquiry failed",
      },
      { status: 500 },
    );
  }
}
