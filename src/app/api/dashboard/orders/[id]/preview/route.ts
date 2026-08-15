import { NextResponse } from "next/server";
import { requireNour } from "@/lib/nour-auth";
import { uploadDelivery } from "@/lib/delivery-upload";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await requireNour())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  const form = await request.formData();
  const result = await uploadDelivery(id, form.get("file"), "preview");
  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }
  return NextResponse.json(result);
}
