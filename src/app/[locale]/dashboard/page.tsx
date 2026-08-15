import { setRequestLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { redirect } from "@/i18n/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireNour } from "@/lib/nour-auth";
import { Price } from "@/components/price";
import { STATUS_ORDER, type Order, type OrderStatus } from "@/lib/orders";

export const dynamic = "force-dynamic";

const STATUS_I18N: Record<OrderStatus, string> = {
  awaiting_deposit: "order.awaitingDeposit",
  in_progress: "order.inProgress",
  ready_for_review: "order.readyForReview",
  awaiting_balance: "order.awaitingBalance",
  delivered: "order.delivered",
};

export default async function DashboardPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const user = await requireNour();
  if (!user) redirect({ href: "/sign-in", locale });

  const admin = createAdminClient();
  const { data } = await admin
    .from("orders")
    .select("*")
    .order("created_at", { ascending: false });
  const orders = (data ?? []) as Order[];
  const t = await getTranslations();

  return (
    <main className="px-6 py-6 sm:px-10">
      <div className="mb-8 flex items-end justify-between gap-4">
        <div>
          <p className="text-[12px] uppercase tracking-[0.28em] text-clay">
            {t("dashboard.kicker")}
          </p>
          <h2 className="font-display text-4xl">{t("dashboard.title")}</h2>
          <p className="mt-2 text-sm text-muted">
            {t("dashboard.signedInAs", { email: user!.email ?? "" })}
          </p>
        </div>
        <p className="max-w-sm text-sm text-muted">{t("dashboard.subtitle")}</p>
      </div>
      <div className="grid gap-5 lg:grid-cols-5">
        {STATUS_ORDER.map((status) => {
          const items = orders.filter((o) => o.status === status);
          return (
            <section key={status}>
              <h3 className="mb-3 text-xs uppercase tracking-widest text-muted">
                {t(STATUS_I18N[status])}
              </h3>
              <ul className="grid gap-3">
                {items.length === 0 ? (
                  <li className="text-sm text-muted">{t("dashboard.empty")}</li>
                ) : null}
                {items.map((order) => (
                  <li key={order.id}>
                    <Link
                      href={`/dashboard/${order.id}`}
                      className="block border border-line p-3"
                    >
                      {order.preview_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={order.preview_url}
                          alt=""
                          className="mb-3 aspect-[4/5] w-full object-cover"
                        />
                      ) : (
                        <div className="mb-3 aspect-[4/5] bg-gradient-to-br from-clay to-ink" />
                      )}
                      <p className="font-display text-lg leading-tight">{order.client_name}</p>
                      <p className="mt-2 text-sm">
                        <Price piastres={order.price_total} />
                      </p>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          );
        })}
      </div>
    </main>
  );
}
