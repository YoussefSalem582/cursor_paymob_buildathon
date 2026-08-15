import { createAdminClient } from "@/lib/supabase/admin";
import type { Order } from "@/lib/orders";
import { parseDeliveryFile, parseOrderId } from "@/lib/validate";

const BUCKET = "deliveries";

export async function uploadDelivery(
  id: string,
  file: unknown,
  kind: "preview" | "final",
) {
  const orderId = parseOrderId(id);
  if (!orderId) return { error: "Not found", status: 404 as const };

  const parsed = parseDeliveryFile(file);
  if (!parsed.ok) return { error: parsed.error, status: 400 as const };

  const admin = createAdminClient();
  const { data: row } = await admin.from("orders").select("*").eq("id", orderId).maybeSingle();
  if (!row) return { error: "Not found", status: 404 as const };
  const order = row as Order;

  if (kind === "preview" && order.status !== "in_progress") {
    return { error: "Preview only while in progress.", status: 409 as const };
  }
  if (kind === "final" && order.status !== "ready_for_review") {
    return { error: "Final file only while ready for review.", status: 409 as const };
  }

  const path = `${orderId}/${kind}-${crypto.randomUUID()}.${parsed.value.ext}`;
  const contentType =
    parsed.value.ext === "jpg"
      ? "image/jpeg"
      : parsed.value.ext === "png"
        ? "image/png"
        : "image/webp";
  const { error: uploadError } = await admin.storage
    .from(BUCKET)
    .upload(path, parsed.value.file, { contentType });
  if (uploadError) return { error: uploadError.message, status: 500 as const };

  const { data } = admin.storage.from(BUCKET).getPublicUrl(path);
  const column = kind === "preview" ? "preview_url" : "final_url";
  const { error } = await admin
    .from("orders")
    .update({ [column]: data.publicUrl })
    .eq("id", orderId);
  if (error) return { error: error.message, status: 500 as const };
  return { url: data.publicUrl };
}
