import { NextResponse, type NextRequest } from "next/server";
import { applyPaymobTransaction } from "@/lib/apply-paymob-transaction";
import { verifyTransactionHmac, type PaymobTransaction } from "@/lib/paymob";

/**
 * Paymob "Transaction Processed Callback".
 *
 * THIS is the source of truth for payment success — not the browser redirect,
 * which a user can fake by typing the success URL.
 *
 * Paymob sends: { type: "TRANSACTION", obj: {...} } with ?hmac=... on the URL.
 */
export async function POST(request: NextRequest) {
  const payload = (await request.json().catch(() => null)) as {
    type?: string;
    obj?: PaymobTransaction;
    hmac?: string;
  } | null;

  if (!payload?.obj) {
    return NextResponse.json({ error: "Bad payload" }, { status: 400 });
  }

  const hmac = request.nextUrl.searchParams.get("hmac") ?? payload.hmac ?? null;
  if (!verifyTransactionHmac(payload.obj, hmac)) {
    console.warn("[paymob webhook] HMAC mismatch — ignoring callback");
    return NextResponse.json({ error: "Invalid HMAC" }, { status: 401 });
  }

  if (payload.type && payload.type !== "TRANSACTION") {
    // Card-token and delivery callbacks use a different HMAC field order.
    return NextResponse.json({ ok: true, ignored: payload.type });
  }

  try {
    const result = await applyPaymobTransaction(payload.obj);
    if (result.status === "paid") {
      console.log("[paymob webhook] paid", {
        orderId: result.orderId,
        paymobOrderId: result.paymobOrderId,
      });
    }
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    console.error("[paymob webhook] update failed", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Update failed" },
      { status: 500 },
    );
  }
}
