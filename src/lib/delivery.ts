import { createAdminClient } from "@/lib/supabase/admin";
import { publicOrder, type Order } from "@/lib/orders";
import { DELIVERIES_BUCKET, deliveriesObjectPath } from "@/lib/delivery-path";

export { DELIVERIES_BUCKET, deliveriesObjectPath } from "@/lib/delivery-path";

export const SIGNED_URL_TTL_SEC = 60 * 60;

export async function signDeliveryUrl(
  urlOrPath: string | null | undefined,
  options: { download?: boolean } = {},
): Promise<string | null> {
  if (!urlOrPath) return null;
  const path = deliveriesObjectPath(urlOrPath);
  if (!path) {
    if (/\/storage\/v1\/object\//.test(urlOrPath)) return null;
    return urlOrPath;
  }

  try {
    const admin = createAdminClient();
    const filename = path.split("/").pop();
    const { data, error } = await admin.storage
      .from(DELIVERIES_BUCKET)
      .createSignedUrl(
        path,
        SIGNED_URL_TTL_SEC,
        options.download && filename ? { download: filename } : undefined,
      );
    if (error || !data?.signedUrl) return null;
    return data.signedUrl;
  } catch {
    return null;
  }
}

/** Client projection: hide unpaid finals, then mint time-limited URLs. */
export async function presentPublicOrder(order: Order): Promise<Order> {
  const visible = publicOrder(order);
  const [preview_url, final_url] = await Promise.all([
    signDeliveryUrl(visible.preview_url),
    signDeliveryUrl(visible.final_url, { download: true }),
  ]);
  return { ...visible, preview_url, final_url };
}

/** Studio projection: Nour sees both files; still signed, never a public URL. */
export async function presentStudioOrder(order: Order): Promise<Order> {
  const [preview_url, final_url] = await Promise.all([
    signDeliveryUrl(order.preview_url),
    signDeliveryUrl(order.final_url),
  ]);
  return { ...order, preview_url, final_url };
}
