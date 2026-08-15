import { createAdminClient } from "@/lib/supabase/admin";
import type { Order } from "@/lib/orders";

const BUCKET = "deliveries";

export async function uploadDelivery(
  id: string,
  file: File,
  kind: "preview" | "final",
) {
  const admin = createAdminClient();
  const { data: row } = await admin.from("orders").select("*").eq("id", id).maybeSingle();
  if (!row) return { error: "Not found", status: 404 as const };
  const order = row as Order;

  if (kind === "preview" && order.status !== "in_progress") {
    return { error: "Preview only while in progress.", status: 409 as const };
  }
  if (kind === "final" && order.status !== "ready_for_review") {
    return { error: "Final file only while ready for review.", status: 409 as const };
  }

  const ext = file.name.split(".").pop() ?? "png";
  const path = `${id}/${kind}-${crypto.randomUUID()}.${ext}`;
  const { error: uploadError } = await admin.storage
    .from(BUCKET)
    .upload(path, file, { contentType: file.type || "application/octet-stream" });
  if (uploadError) return { error: uploadError.message, status: 500 as const };

  const { data } = admin.storage.from(BUCKET).getPublicUrl(path);
  const column = kind === "preview" ? "preview_url" : "final_url";
  const { error } = await admin
    .from("orders")
    .update({ [column]: data.publicUrl })
    .eq("id", id);
  if (error) return { error: error.message, status: 500 as const };
  return { url: data.publicUrl };
}
