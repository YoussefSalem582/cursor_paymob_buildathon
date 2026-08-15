import { NextResponse, type NextRequest } from "next/server";
import { applyPaymobTransaction } from "@/lib/apply-paymob-transaction";
import {
  inquireTransaction,
  inquireTransactionById,
} from "@/lib/paymob";

/**
 * Pull-based reconciliation when the webhook never arrived.
 * Does not replace HMAC on callbacks — Inquiry talks to Paymob with PAYMOB_API_KEY.
 *
 * POST { orderId?, paymobOrderId?, transactionId? }
 */
export async function POST(request: NextRequest) {
  try {
    const body = (await request.json().catch(() => ({}))) as {
      orderId?: string;
      paymobOrderId?: number | string;
      transactionId?: number | string;
    };

    const transactionId = Number(body.transactionId);
    const paymobOrderId = Number(body.paymobOrderId);
    const orderId = body.orderId?.trim() || undefined;

    if (
      !orderId &&
      !Number.isInteger(paymobOrderId) &&
      !Number.isInteger(transactionId)
    ) {
      return NextResponse.json(
        { error: "Provide orderId, paymobOrderId, or transactionId" },
        { status: 400 },
      );
    }

    const transaction = Number.isInteger(transactionId)
      ? await inquireTransactionById(transactionId)
      : await inquireTransaction({
          merchantOrderId: orderId,
          paymobOrderId: Number.isInteger(paymobOrderId)
            ? paymobOrderId
            : undefined,
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
