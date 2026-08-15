import { createAdminClient } from "@/lib/supabase/admin";
import type { Order } from "@/lib/orders";

export type StudioOrdersLoad = {
  orders: Order[];
  error: string | null;
};

/** Nour's studio reads. Missing env or a leftover schema must not 500 the page. */
export async function loadStudioOrders(): Promise<StudioOrdersLoad> {
  try {
    const admin = createAdminClient();
    const { data, error } = await admin
      .from("orders")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) {
      console.error("[escrowd] studio orders", error.message);
      return { orders: [], error: error.message };
    }
    return { orders: (data ?? []) as Order[], error: null };
  } catch (error) {
    console.error("[escrowd] studio orders", error);
    return { orders: [], error: "studio_load_failed" };
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
