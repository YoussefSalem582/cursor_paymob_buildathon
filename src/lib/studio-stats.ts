import type { BriefType } from "./pricing";
import type { Order, OrderStatus } from "./orders";

export const STUDIO_TZ = "Africa/Cairo";
export const ACTIVITY_DAYS = 14;

export type AttentionKind =
  | "needs_preview"
  | "needs_final"
  | "waiting_balance"
  | "waiting_deposit";

export type StatusBucket = { count: number; totalPiastres: number };

export type TypeBucket = {
  type: BriefType;
  count: number;
  totalPiastres: number;
};

export type StudioDay = {
  date: string;
  created: number;
  deposits: number;
  balances: number;
};

export type AttentionItem = {
  id: string;
  kind: AttentionKind;
  client_name: string;
  price_total: number;
  created_at: string;
};

export type StudioStats = {
  totalOrders: number;
  needsNour: number;
  byStatus: Partial<Record<OrderStatus, StatusBucket>>;
  collectedDeposit: number;
  collectedBalance: number;
  collected: number;
  outstandingDeposit: number;
  outstandingBalance: number;
  outstanding: number;
  escrowed: number;
  byType: TypeBucket[];
  days: StudioDay[];
  attention: AttentionItem[];
};

const ATTENTION_RANK: Record<AttentionKind, number> = {
  needs_preview: 0,
  needs_final: 1,
  waiting_balance: 2,
  waiting_deposit: 3,
};

export function cairoDay(value: string | Date): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: STUDIO_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(typeof value === "string" ? new Date(value) : value);
}

export function formatStamp(iso: string | null, locale: string): string | null {
  if (!iso) return null;
  return new Intl.DateTimeFormat(locale === "ar" ? "ar-EG" : "en-GB", {
    timeZone: STUDIO_TZ,
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(iso));
}

export function attentionKind(order: Order): AttentionKind | null {
  switch (order.status) {
    case "in_progress":
      return "needs_preview";
    case "ready_for_review":
      return "needs_final";
    case "awaiting_balance":
      return "waiting_balance";
    case "awaiting_deposit":
      return "waiting_deposit";
    default:
      return null;
  }
}

function briefType(brief: Order["brief"] | null | undefined): BriefType | null {
  const type = brief && typeof brief === "object" ? brief.type : null;
  if (
    type === "portrait" ||
    type === "character" ||
    type === "logo-mascot" ||
    type === "menu-set"
  ) {
    return type;
  }
  return null;
}

function money(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function shiftCairoDay(yyyyMmDd: string, delta: number): string {
  const [year, month, day] = yyyyMmDd.split("-").map(Number);
  return cairoDay(new Date(Date.UTC(year, month - 1, day + delta, 12)));
}

function emptyDay(date: string): StudioDay {
  return { date, created: 0, deposits: 0, balances: 0 };
}

/** Operational totals from `orders`. Paid figures follow *_paid_at only. */
export function studioStats(orders: Order[], now = new Date()): StudioStats {
  const byStatus: Partial<Record<OrderStatus, StatusBucket>> = {};
  const typeMap = new Map<BriefType, TypeBucket>();
  const today = cairoDay(now);
  const days = Array.from({ length: ACTIVITY_DAYS }, (_, index) =>
    emptyDay(shiftCairoDay(today, index - (ACTIVITY_DAYS - 1))),
  );
  const dayIndex = new Map(days.map((day, index) => [day.date, index]));

  let collectedDeposit = 0;
  let collectedBalance = 0;
  let outstandingDeposit = 0;
  let outstandingBalance = 0;
  let escrowed = 0;
  const attention: AttentionItem[] = [];

  for (const order of orders) {
    const total = money(order.price_total);
    const deposit = money(order.price_deposit);
    const balance = money(order.price_balance);
    const statusBucket = (byStatus[order.status] ??= {
      count: 0,
      totalPiastres: 0,
    });
    statusBucket.count += 1;
    statusBucket.totalPiastres += total;
    const type = briefType(order.brief);
    if (type) {
      const typeBucket = typeMap.get(type) ?? {
        type,
        count: 0,
        totalPiastres: 0,
      };
      typeBucket.count += 1;
      typeBucket.totalPiastres += total;
      typeMap.set(type, typeBucket);
    }

    if (order.deposit_paid_at) collectedDeposit += deposit;
    else outstandingDeposit += deposit;

    if (order.balance_paid_at) collectedBalance += balance;
    else if (order.deposit_paid_at) outstandingBalance += balance;

    if (order.deposit_paid_at && !order.balance_paid_at) {
      escrowed += deposit;
    }

    const createdIndex = dayIndex.get(cairoDay(order.created_at));
    if (createdIndex != null) days[createdIndex].created += 1;
    if (order.deposit_paid_at) {
      const index = dayIndex.get(cairoDay(order.deposit_paid_at));
      if (index != null) days[index].deposits += 1;
    }
    if (order.balance_paid_at) {
      const index = dayIndex.get(cairoDay(order.balance_paid_at));
      if (index != null) days[index].balances += 1;
    }

    const kind = attentionKind(order);
    if (kind) {
      attention.push({
        id: order.id,
        kind,
        client_name: order.client_name,
        price_total: order.price_total,
        created_at: order.created_at,
      });
    }
  }

  attention.sort(
    (a, b) =>
      ATTENTION_RANK[a.kind] - ATTENTION_RANK[b.kind] ||
      a.created_at.localeCompare(b.created_at),
  );

  return {
    totalOrders: orders.length,
    needsNour:
      (byStatus.in_progress?.count ?? 0) +
      (byStatus.ready_for_review?.count ?? 0),
    byStatus,
    collectedDeposit,
    collectedBalance,
    collected: collectedDeposit + collectedBalance,
    outstandingDeposit,
    outstandingBalance,
    outstanding: outstandingDeposit + outstandingBalance,
    escrowed,
    byType: [...typeMap.values()].sort((a, b) => b.totalPiastres - a.totalPiastres),
    days,
    attention,
  };
}
