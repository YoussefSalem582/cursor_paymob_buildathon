import { NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { createAdminClient } from "@/lib/supabase/admin";
import { parseBrief, priceBrief } from "@/lib/pricing";
import { parseContact } from "@/lib/validate";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as {
    name?: unknown;
    email?: unknown;
    phone?: unknown;
    brief?: unknown;
  } | null;

  const contact = parseContact({
    name: body?.name,
    email: body?.email,
    phone: body?.phone,
  });
  if (!contact.ok) {
    return NextResponse.json(
      { error: contact.error, field: contact.field },
      { status: 400 },
    );
  }

  const brief = parseBrief(body?.brief);
  if (!brief) {
    return NextResponse.json(
      { error: "invalid_brief", field: "brief" },
      { status: 400 },
    );
  }

  const priced = priceBrief(brief);
  const token = nanoid(12);
  const admin = createAdminClient();
  const { data: order, error } = await admin
    .from("orders")
    .insert({
      token,
      client_name: contact.value.name,
      client_email: contact.value.email,
      client_phone: contact.value.phone,
      brief,
      price_total: priced.totalPiastres,
      price_deposit: priced.depositPiastres,
      price_balance: priced.balancePiastres,
      status: "awaiting_deposit",
    })
    .select("token")
    .single();

  if (error || !order) {
    return NextResponse.json(
      { error: error?.message ?? "Could not save the order." },
      { status: 500 },
    );
  }

  return NextResponse.json({ token: order.token });
}
