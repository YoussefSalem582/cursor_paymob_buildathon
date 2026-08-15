import { NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { createAdminClient } from "@/lib/supabase/admin";
import { parseBrief, priceBrief } from "@/lib/pricing";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as {
    name?: string;
    email?: string;
    phone?: string;
    brief?: unknown;
  } | null;

  const name = String(body?.name ?? "").trim();
  const email = String(body?.email ?? "").trim();
  const phone = String(body?.phone ?? "").trim();
  const brief = parseBrief(body?.brief);

  if (!name || !email || !phone || !brief) {
    return NextResponse.json(
      { error: "Name, email, phone, and a valid brief are required." },
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
      client_name: name,
      client_email: email,
      client_phone: phone,
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
