import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { EscrowdLogoFrame } from "@/components/escrowd-logo";
import { Price } from "@/components/price";
import { createAdminClient } from "@/lib/supabase/admin";
import { STATUS_I18N, STATUS_ORDER, type Order } from "@/lib/orders";
import type { Brief } from "@/lib/pricing";

export default async function StudioBoardPage() {
  const admin = createAdminClient();
  const { data } = await admin
    .from("orders")
    .select("*")
    .order("created_at", { ascending: false });
  const orders = (data ?? []) as Order[];
  const t = await getTranslations();

  return (
    <main className="px-6 py-6 sm:px-10">
      <div className="mb-8">
        <p className="text-[12px] uppercase tracking-[0.28em] text-clay">
          {t("dashboard.kicker")}
        </p>
        <h2 className="font-display text-4xl">{t("dashboard.boardTitle")}</h2>
        <p className="mt-2 max-w-xl text-sm text-muted">
          {t("dashboard.boardSubtitle")}
        </p>
      </div>
      <div className="grid gap-5 lg:grid-cols-5">
        {STATUS_ORDER.map((status) => {
          const items = orders.filter((order) => order.status === status);
          const total = items.reduce((sum, order) => sum + order.price_total, 0);
          return (
            <section key={status}>
              <h3 className="mb-1 text-xs uppercase tracking-widest text-muted">
                {t(STATUS_I18N[status])}
              </h3>
              <p className="mb-3 text-xs text-muted">
                {items.length} · <Price piastres={total} />
              </p>
              <ul className="grid gap-3">
                {items.length === 0 ? (
                  <li className="text-sm text-muted">{t("dashboard.empty")}</li>
                ) : null}
                {items.map((order) => {
                  const brief = order.brief as Brief;
                  return (
                    <li key={order.id}>
                      <Link
                        href={`/dashboard/orders/${order.id}`}
                        className="block border border-line p-3 transition-colors hover:border-ink"
                      >
                        {order.preview_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={order.preview_url}
                            alt=""
                            className="mb-3 aspect-[4/5] w-full object-cover"
                          />
                        ) : (
                          <EscrowdLogoFrame className="mb-3 aspect-[4/5]" />
                        )}
                        <p className="font-display text-lg leading-tight">
                          {order.client_name}
                        </p>
                        <p className="mt-1 line-clamp-2 text-sm text-muted">
                          {t(`brief.${brief.type}`)} · {brief.subjects} ·{" "}
                          {t(`brief.${brief.detail_level}`)}
                        </p>
                        <p className="mt-2 text-sm">
                          <Price piastres={order.price_total} />
                        </p>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </section>
          );
        })}
      </div>
    </main>
  );
}
