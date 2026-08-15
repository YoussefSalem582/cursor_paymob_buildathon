import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { publicOrder, type Order } from "@/lib/orders";
import { OrderPanel } from "./order-panel";

export const dynamic = "force-dynamic";

export default async function OrderPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string; token: string }>;
  searchParams: Promise<{ checkout?: string }>;
}) {
  const { locale, token } = await params;
  setRequestLocale(locale);
  const { checkout } = await searchParams;

  const admin = createAdminClient();
  const { data } = await admin.from("orders").select("*").eq("token", token).maybeSingle();
  if (!data) notFound();

  return (
    <OrderPanel
      initial={publicOrder(data as Order)}
      returning={checkout === "returning"}
    />
  );
}
