import { setRequestLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { EscrowdLogoFrame } from "@/components/escrowd-logo";
import { Price } from "@/components/price";
import { STATUS_I18N, STATUS_ORDER } from "@/lib/orders";
import type { Brief } from "@/lib/pricing";
import { loadStudioOrders } from "@/lib/studio-data";

export default async function StudioBoardPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const orders = await loadStudioOrders();
  const t = await getTranslations();

  return (
    <main className="px-4 py-5 sm:px-10 sm:py-6">
      <div className="mb-8">
        <p className="text-[12px] uppercase tracking-[0.28em] text-clay">
          {t("dashboard.kicker")}
        </p>
        <h2 className="font-display text-3xl sm:text-4xl">{t("dashboard.boardTitle")}</h2>
        <p className="mt-2 max-w-xl text-sm text-muted">
          {t("dashboard.boardSubtitle")}
        </p>
      </div>
      <div className="-mx-4 overflow-x-auto overscroll-x-contain px-4 pb-2 snap-x snap-mandatory sm:-mx-10 sm:px-10 lg:mx-0 lg:overflow-visible lg:px-0 lg:pb-0 lg:snap-none">
        <div className="flex gap-4 lg:grid lg:grid-cols-5">
        {STATUS_ORDER.map((status) => {
          const items = orders.filter((order) => order.status === status);
          const total = items.reduce(
            (sum, order) =>
              sum + (typeof order.price_total === "number" ? order.price_total : 0),
            0,
          );
          return (
            <section
              key={status}
              className="w-[min(80vw,17.5rem)] shrink-0 snap-start lg:w-auto"
            >
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
                  const brief = order.brief as Brief | null;
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
                          {brief?.type ? t(`brief.${brief.type}`) : "—"}
                          {brief ? ` · ${brief.subjects} · ${t(`brief.${brief.detail_level}`)}` : null}
                        </p>
                        <p className="mt-2 text-sm">
                          <Price piastres={order.price_total ?? 0} />
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
      </div>
    </main>
  );
}
