import { setRequestLocale } from "next-intl/server";
import { redirect } from "@/i18n/navigation";

export default async function LegacyStudioOrderPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  redirect({ href: `/dashboard/orders/${id}`, locale });
}
