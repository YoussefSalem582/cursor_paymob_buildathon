import type { ReactNode } from "react";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { ActivityChart, StatusPipeline, TypeMix } from "@/components/studio-charts";
import { Price } from "@/components/price";
import { buttonBase, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { STATUS_I18N, STATUS_ORDER, type Order } from "@/lib/orders";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  formatStamp,
  studioStats,
  type AttentionKind,
} from "@/lib/studio-stats";

const ATTENTION_I18N: Record<AttentionKind, string> = {
  needs_preview: "dashboard.needsPreview",
  needs_final: "dashboard.needsFinal",
  waiting_balance: "dashboard.waitingBalance",
  waiting_deposit: "dashboard.waitingDeposit",
};

export default async function StudioOverviewPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const admin = createAdminClient();
  const { data } = await admin
    .from("orders")
    .select("*")
    .order("created_at", { ascending: false });
  const orders = (data ?? []) as Order[];
  const stats = studioStats(orders);
  const t = await getTranslations();
  const statusLabels = Object.fromEntries(
    STATUS_ORDER.map((status) => [status, t(STATUS_I18N[status])]),
  ) as Record<(typeof STATUS_ORDER)[number], string>;
  const typeLabels: Record<string, string> = {
    portrait: t("brief.portrait"),
    character: t("brief.character"),
    "logo-mascot": t("brief.logo-mascot"),
    "menu-set": t("brief.menu-set"),
  };

  return (
    <main className="px-6 py-6 sm:px-10">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[12px] uppercase tracking-[0.28em] text-clay">
            {t("dashboard.overviewKicker")}
          </p>
          <h2 className="font-display text-4xl">{t("dashboard.overviewTitle")}</h2>
          <p className="mt-2 max-w-xl text-sm text-muted">
            {t("dashboard.overviewSubtitle")}
          </p>
        </div>
        <Link
          href="/dashboard/orders"
          className={cn(buttonBase, buttonVariants.secondary)}
        >
          {t("dashboard.openBoard")}
        </Link>
      </div>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label={t("dashboard.ordersCount")} hint={t("dashboard.ordersHint")}>
          {stats.totalOrders}
        </Stat>
        <Stat label={t("dashboard.collected")} hint={t("dashboard.collectedHint")}>
          <Price piastres={stats.collected} />
        </Stat>
        <Stat
          label={t("dashboard.outstanding")}
          hint={t("dashboard.outstandingHint")}
        >
          <Price piastres={stats.outstanding} />
        </Stat>
        <Stat label={t("dashboard.needsNour")} hint={t("dashboard.needsNourHint")}>
          {stats.needsNour}
        </Stat>
      </section>
      <p className="mt-4 text-sm text-muted">
        {t("dashboard.escrowed")}: <Price piastres={stats.escrowed} />
        <span className="mx-2 text-line">·</span>
        {t("dashboard.escrowedHint")}
      </p>

      <div className="mt-8 grid gap-8 xl:grid-cols-[1.2fr_0.8fr]">
        <section className="border border-line p-5">
          <h3 className="mb-4 font-display text-2xl">{t("dashboard.activity")}</h3>
          <ActivityChart
            days={stats.days}
            locale={locale}
            openedLabel={t("dashboard.activityOpened")}
            depositsLabel={t("dashboard.activityDeposits")}
            balancesLabel={t("dashboard.activityBalances")}
            caption={t("dashboard.activityCaption")}
          />
        </section>
        <section className="border border-line p-5">
          <h3 className="mb-4 font-display text-2xl">{t("dashboard.pipeline")}</h3>
          <StatusPipeline
            stats={stats}
            labels={statusLabels}
            caption={t("dashboard.pipelineCaption")}
          />
        </section>
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-2">
        {stats.byType.length > 0 ? (
          <section className="border border-line p-5">
            <h3 className="mb-4 font-display text-2xl">{t("dashboard.byType")}</h3>
            <TypeMix
              rows={stats.byType}
              labels={typeLabels}
              caption={t("dashboard.byTypeCaption")}
            />
          </section>
        ) : null}
        <section className="border border-line p-5">
          <h3 className="mb-4 font-display text-2xl">{t("dashboard.attention")}</h3>
          {stats.attention.length === 0 ? (
            <p className="text-sm text-muted">{t("dashboard.emptyAttention")}</p>
          ) : (
            <ul className="grid gap-2">
              {stats.attention.map((item) => (
                <li key={item.id}>
                  <Link
                    href={`/dashboard/orders/${item.id}`}
                    className="flex flex-wrap items-baseline justify-between gap-2 border border-line px-3 py-3 text-sm hover:border-ink"
                  >
                    <span>
                      <span className="font-medium">{item.client_name}</span>
                      <span className="ms-2 text-muted">
                        {t(ATTENTION_I18N[item.kind])}
                      </span>
                    </span>
                    <span className="text-muted">
                      <Price piastres={item.price_total} />
                      <span className="ms-2">
                        {formatStamp(item.created_at, locale)}
                      </span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </main>
  );
}

function Stat({
  label,
  hint,
  children,
}: {
  label: string;
  hint: string;
  children: ReactNode;
}) {
  return (
    <div className="border border-line p-4">
      <p className="text-[11px] uppercase tracking-[0.2em] text-muted">{label}</p>
      <p className="mt-2 font-display text-3xl tabular-nums">{children}</p>
      <p className="mt-1 text-xs text-muted">{hint}</p>
    </div>
  );
}
