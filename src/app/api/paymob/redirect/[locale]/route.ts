import { NextResponse, type NextRequest } from "next/server";
import { routing } from "@/i18n/routing";
import { parseSpecialReference } from "@/lib/paymob";
import { parseOrderToken } from "@/lib/validate";

/**
 * Browser return from Paymob. Never marks paid. Sends the client to /o/[token]
 * which polls until the webhook moves status.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ locale: string }> },
) {
  const { locale: raw } = await params;
  const locale = (routing.locales as readonly string[]).includes(raw)
    ? raw
    : routing.defaultLocale;

  const query = request.nextUrl.searchParams;
  const merchant =
    query.get("merchant_order_id") ?? query.get("merchantOrderId") ?? "";
  const parsed = parseSpecialReference(merchant);
  const token = parseOrderToken(parsed?.token ?? query.get("token"));

  const path = token ? `/${locale}/o/${token}` : `/${locale}`;
  const target = new URL(path, request.nextUrl.origin);
  target.searchParams.set("checkout", "returning");
  return NextResponse.redirect(target);
}

export const POST = GET;
