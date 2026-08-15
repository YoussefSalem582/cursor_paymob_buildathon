import { NextResponse, type NextRequest } from "next/server";
import { reconcileEscrowdOrder } from "@/lib/apply-paymob-transaction";
import { createAdminClient } from "@/lib/supabase/admin";
import { publicOrder, type Order } from "@/lib/orders";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;
  const admin = createAdminClient();
  const { data: row, error } = await admin
    .from("orders")
    .select("*")
    .eq("token", token)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  if (!row) {
    return NextResponse.json({ error: "Order not found." }, { status: 404 });
  }

  let order = row as Order;
  if (request.nextUrl.searchParams.get("reconcile") === "1") {
    order = await reconcileEscrowdOrder(order);
  }

  return NextResponse.json({ order: publicOrder(order) });
}
