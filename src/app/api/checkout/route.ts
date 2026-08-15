import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  createIntention,
  splitName,
  type CheckoutKind,
} from "@/lib/paymob";
import { parseBrief, priceBrief } from "@/lib/pricing";
import { publicSiteUrl } from "@/lib/site-url";
import { routing } from "@/i18n/routing";
import type { Order } from "@/lib/orders";
import { parseCheckoutKind, parseOrderToken } from "@/lib/validate";

/**
 * Body `{ token, kind }`. Amount comes from the server price, never the client.
 * New Intention every click — client_secret is single-use.
 */
export async function POST(request: NextRequest) {
  try {
    const body = (await request.json().catch(() => ({}))) as {
      token?: string;
      kind?: CheckoutKind;
      locale?: string;
    };

    const token = parseOrderToken(body.token);
    const kind = parseCheckoutKind(body.kind);
    if (!token || !kind) {
      return NextResponse.json(
        { error: "Expected { token, kind: \"deposit\" | \"balance\" }" },
        { status: 400 },
      );
    }

    const locale = (routing.locales as readonly string[]).includes(body.locale ?? "")
      ? body.locale!
      : routing.defaultLocale;

    const admin = createAdminClient();
    const { data: row, error } = await admin
      .from("orders")
      .select("*")
      .eq("token", token)
      .maybeSingle();

    if (error || !row) {
      return NextResponse.json({ error: "Order not found." }, { status: 404 });
    }

    const order = row as Order;
    if (kind === "deposit" && order.status !== "awaiting_deposit") {
      return NextResponse.json(
        { error: "Deposit is only available while awaiting deposit." },
        { status: 409 },
      );
    }
    if (kind === "balance" && order.status !== "awaiting_balance") {
      return NextResponse.json(
        { error: "Balance is only available while awaiting the final payment." },
        { status: 409 },
      );
    }

    const brief = parseBrief(order.brief);
    if (!brief) {
      return NextResponse.json({ error: "Frozen brief is invalid." }, { status: 500 });
    }
    const priced = priceBrief(brief);
    const amount = kind === "deposit" ? priced.depositPiastres : priced.balancePiastres;
    const names = splitName(order.client_name);
    const attemptId = crypto.randomUUID();
    const specialReference = `${order.token}:${kind}:${attemptId}`;
    const siteUrl = publicSiteUrl();

    const itemName =
      kind === "deposit" ? "Escrowd deposit" : "Escrowd balance";

    const intention = await createIntention({
      amount,
      currency: "EGP",
      items: [
        {
          name: itemName,
          amount,
          description: specialReference,
          quantity: 1,
        },
      ],
      billingData: {
        ...names,
        email: order.client_email,
        phone_number: order.client_phone,
      },
      specialReference,
      notificationUrl: `${siteUrl}/api/paymob/webhook`,
      redirectionUrl: `${siteUrl}/api/paymob/redirect/${locale}`,
      extras: { token: order.token, kind, attemptId },
    });

    const referencePatch =
      kind === "deposit"
        ? {
            paymob_deposit_reference: specialReference,
            ...(intention.paymobOrderId
              ? { paymob_deposit_order_id: intention.paymobOrderId }
              : {}),
          }
        : {
            paymob_balance_reference: specialReference,
            ...(intention.paymobOrderId
              ? { paymob_balance_order_id: intention.paymobOrderId }
              : {}),
          };
    const { error: persistError } = await admin
      .from("orders")
      .update(referencePatch)
      .eq("token", token);
    if (persistError) {
      console.error("[checkout] could not persist special_reference", persistError);
    }

    return NextResponse.json({ checkoutUrl: intention.checkoutUrl });
  } catch (error) {
    console.error("[checkout]", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Checkout failed" },
      { status: 500 },
    );
  }
}
