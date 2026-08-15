import { notFound } from "next/navigation";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { Link, redirect } from "@/i18n/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireNour } from "@/lib/nour-auth";
import { Price } from "@/components/price";
import { StudioActions } from "../studio-actions";
import type { Order } from "@/lib/orders";
import type { Brief } from "@/lib/pricing";

export const dynamic = "force-dynamic";

export default async function DashboardOrderPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  const user = await requireNour();
  if (!user) redirect({ href: "/sign-in", locale });

  const admin = createAdminClient();
  const { data } = await admin.from("orders").select("*").eq("id", id).maybeSingle();
  if (!data) notFound();
  const order = data as Order;
  const brief = order.brief as Brief;
  const t = await getTranslations();

  return (
    <main className="mx-auto grid w-full max-w-6xl gap-10 px-6 py-8 sm:px-10 lg:grid-cols-2">
      <div>
        {order.preview_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={order.preview_url} alt="" className="w-full object-cover" />
        ) : (
          <div className="aspect-[4/5] bg-gradient-to-br from-ink to-clay" />
        )}
      </div>
      <div>
        <Link href="/dashboard" className="text-sm text-muted">
          ← {t("dashboard.back")}
        </Link>
        <p className="mt-4 text-[12px] uppercase tracking-[0.28em] text-clay">{order.status}</p>
        <h2 className="mt-2 font-display text-5xl leading-none">{order.client_name}</h2>
        <p className="mt-2 text-sm text-muted">
          {order.client_email} · {order.client_phone}
        </p>
        <p className="mt-6 text-sm">
          {t(`brief.${brief.type}`)} · {brief.subjects} · {t(`brief.${brief.detail_level}`)} ·{" "}
          {t(`brief.${brief.usage}`)}
        </p>
        <p className="mt-6 font-display text-3xl">
          <Price piastres={order.price_total} />
        </p>
        <p className="mt-2 text-sm text-muted">
          /o/{order.token}
        </p>
        <div className="mt-8">
          <StudioActions order={order} />
        </div>
      </div>
    </main>
  );
}
