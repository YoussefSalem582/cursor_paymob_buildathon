import { NextResponse } from "next/server";
import { requireNour } from "@/lib/nour-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { NOUR_TRANSITIONS, type Order, type OrderStatus } from "@/lib/orders";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await requireNour())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = (await request.json().catch(() => ({}))) as { status?: OrderStatus };
  const next = body.status;
  const admin = createAdminClient();
  const { data: row } = await admin.from("orders").select("*").eq("id", id).maybeSingle();
  if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const order = row as Order;
  const allowed = NOUR_TRANSITIONS[order.status];
  if (!allowed || allowed !== next) {
    return NextResponse.json({ error: "Illegal status transition." }, { status: 409 });
  }

  if (next === "ready_for_review" && !order.preview_url) {
    return NextResponse.json({ error: "Upload a preview first." }, { status: 409 });
  }
  if (next === "awaiting_balance" && !order.final_url) {
    return NextResponse.json({ error: "Upload the final file first." }, { status: 409 });
  }

  const { error } = await admin.from("orders").update({ status: next }).eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ status: next });
}
