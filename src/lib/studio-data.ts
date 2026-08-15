import { createAdminClient } from "@/lib/supabase/admin";
import type { Order } from "@/lib/orders";

/** Nour's studio reads. Missing env or a leftover schema must not 500 the page. */
export async function loadStudioOrders(): Promise<Order[]> {
  try {
    const admin = createAdminClient();
    const { data, error } = await admin
      .from("orders")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) {
      console.error("[escrowd] studio orders", error.message);
      return [];
    }
    return (data ?? []) as Order[];
  } catch (error) {
    console.error("[escrowd] studio orders", error);
    return [];
  }
}

export async function loadStudioOrder(id: string): Promise<Order | null> {
  try {
    const admin = createAdminClient();
    const { data, error } = await admin
      .from("orders")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (error) {
      console.error("[escrowd] studio order", error.message);
      return null;
    }
    return (data as Order | null) ?? null;
  } catch (error) {
    console.error("[escrowd] studio order", error);
    return null;
  }
}
