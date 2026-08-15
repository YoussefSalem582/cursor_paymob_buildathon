import { STATUS_ORDER, type OrderStatus } from "@/lib/orders";
import type { StudioDay, StudioStats, TypeBucket } from "@/lib/studio-stats";
import { cn } from "@/lib/utils";
import { Price } from "./price";

const STATUS_TONE: Record<OrderStatus, string> = {
  awaiting_deposit: "bg-line",
  in_progress: "bg-sage",
  ready_for_review: "bg-clay",
  awaiting_balance: "bg-clay-deep",
  delivered: "bg-ink",
};

export function StatusPipeline({
  stats,
  labels,
  caption,
}: {
  stats: StudioStats;
  labels: Record<OrderStatus, string>;
  caption: string;
}) {
  const segments = STATUS_ORDER.map((status) => ({
    status,
    count: stats.byStatus[status]?.count ?? 0,
  }));
  const total = segments.reduce((sum, row) => sum + row.count, 0) || 1;

  return (
    <figure>
      <div className="flex h-3 w-full overflow-hidden bg-line">
        {segments.map((row) =>
          row.count === 0 ? null : (
            <div
              key={row.status}
              className={STATUS_TONE[row.status]}
              style={{ width: `${(row.count / total) * 100}%` }}
              title={`${labels[row.status]}: ${row.count}`}
            />
          ),
        )}
      </div>
      <ul className="mt-3 grid gap-2 text-sm">
        {segments.map((row) => (
          <li key={row.status} className="flex items-start justify-between gap-3">
            <span className="flex min-w-0 items-start gap-2 text-muted">
              <span className={cn("mt-1.5 size-2 shrink-0", STATUS_TONE[row.status])} />
              <span className="leading-snug">{labels[row.status]}</span>
            </span>
            <span className="shrink-0 tabular-nums">{row.count}</span>
          </li>
        ))}
      </ul>
      <figcaption className="mt-3 text-xs text-muted">{caption}</figcaption>
    </figure>
  );
}

export function ActivityChart({
  days,
  locale,
  openedLabel,
  depositsLabel,
  balancesLabel,
  caption,
}: {
  days: StudioDay[];
  locale: string;
  openedLabel: string;
  depositsLabel: string;
  balancesLabel: string;
  caption: string;
}) {
  const max = Math.max(
    1,
    ...days.map((day) => Math.max(day.created, day.deposits, day.balances)),
  );
  const tick = new Intl.DateTimeFormat(locale === "ar" ? "ar-EG" : "en-GB", {
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  });

  return (
    <figure className="min-w-0">
      <div className="-mx-1 overflow-x-auto overscroll-x-contain">
        <div dir="ltr" className="flex h-40 min-w-[32rem] items-end gap-1 sm:min-w-0 sm:w-full">
        {days.map((day) => (
          <div key={day.date} className="flex min-w-0 flex-1 items-end justify-center gap-px">
            <span
              className="w-1/3 bg-ink"
              style={{ height: `${(day.created / max) * 100}%`, minHeight: day.created ? 2 : 0 }}
              title={`${day.date} ${openedLabel}: ${day.created}`}
            />
            <span
              className="w-1/3 bg-clay"
              style={{ height: `${(day.deposits / max) * 100}%`, minHeight: day.deposits ? 2 : 0 }}
              title={`${day.date} ${depositsLabel}: ${day.deposits}`}
            />
            <span
              className="w-1/3 bg-sage"
              style={{ height: `${(day.balances / max) * 100}%`, minHeight: day.balances ? 2 : 0 }}
              title={`${day.date} ${balancesLabel}: ${day.balances}`}
            />
          </div>
        ))}
        </div>
      </div>
      <div dir="ltr" className="mt-2 flex justify-between text-[11px] text-muted">
        <span>{tick.format(new Date(`${days[0]?.date ?? ""}T12:00:00Z`))}</span>
        <span>
          {tick.format(new Date(`${days[days.length - 1]?.date ?? ""}T12:00:00Z`))}
        </span>
      </div>
      <ul className="mt-3 flex flex-wrap gap-4 text-xs text-muted">
        <li className="flex items-center gap-2">
          <span className="size-2 bg-ink" />
          {openedLabel}
        </li>
        <li className="flex items-center gap-2">
          <span className="size-2 bg-clay" />
          {depositsLabel}
        </li>
        <li className="flex items-center gap-2">
          <span className="size-2 bg-sage" />
          {balancesLabel}
        </li>
      </ul>
      <figcaption className="mt-3 text-xs text-muted">{caption}</figcaption>
    </figure>
  );
}

export function TypeMix({
  rows,
  labels,
  caption,
}: {
  rows: TypeBucket[];
  labels: Record<string, string>;
  caption: string;
}) {
  const max = Math.max(1, ...rows.map((row) => row.totalPiastres));
  return (
    <figure>
      <ul className="grid gap-3">
        {rows.map((row) => (
          <li key={row.type}>
            <div className="mb-1 flex flex-wrap justify-between gap-x-3 gap-y-1 text-sm">
              <span>
                {labels[row.type] ?? row.type}
                <span className="text-muted"> · {row.count}</span>
              </span>
              <Price piastres={row.totalPiastres} />
            </div>
            <div className="h-2 bg-line">
              <div
                className="h-full bg-sage"
                style={{ width: `${(row.totalPiastres / max) * 100}%` }}
              />
            </div>
          </li>
        ))}
      </ul>
      <figcaption className="mt-3 text-xs text-muted">{caption}</figcaption>
    </figure>
  );
}
