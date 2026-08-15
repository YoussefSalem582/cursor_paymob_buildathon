import { NextResponse } from "next/server";
import { requireNour } from "@/lib/nour-auth";
import { createAdminClient } from "@/lib/supabase/admin";

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
  return NextResponse.json({ orders: data ?? [] });
}
