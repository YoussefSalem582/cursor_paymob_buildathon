import { NextResponse } from "next/server";
import { presentStudioOrder } from "@/lib/delivery";
import { requireNour } from "@/lib/nour-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Order } from "@/lib/orders";

export async function GET() {
  if (!(await requireNour())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("orders")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  const orders = await Promise.all(
    ((data ?? []) as Order[]).map((row) => presentStudioOrder(row)),
  );
  return NextResponse.json({ orders });
}
