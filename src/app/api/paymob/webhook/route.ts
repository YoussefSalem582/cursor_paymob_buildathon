import { NextResponse, type NextRequest } from "next/server";
import { applyPaymobTransaction } from "@/lib/apply-paymob-transaction";
import { verifyTransactionHmac, type PaymobTransaction } from "@/lib/paymob";

/**
 * Paymob Transaction Processed Callback. HMAC first. Never mark paid from redirect.
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
    return NextResponse.json({ ok: true, ignored: payload.type });
  }

  try {
    const result = await applyPaymobTransaction(payload.obj);
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    console.error("[paymob webhook] update failed", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Update failed" },
      { status: 500 },
    );
  }
}
