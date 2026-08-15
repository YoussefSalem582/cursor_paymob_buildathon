import { test } from "node:test";
import assert from "node:assert/strict";
import type { Order } from "./orders.ts";
import { cairoDay, studioStats } from "./studio-stats.ts";

function order(partial: Partial<Order>): Order {
  return {
    id: "1",
    token: "abcdefghijkl",
    created_at: "2026-08-15T12:00:00.000Z",
    client_name: "Ali",
    client_email: "a@b.com",
    client_phone: "01000000000",
    brief: {
      type: "portrait",
      subjects: 1,
      detail_level: "full render",
      background: "simple",
      usage: "personal",
      revisions: 2,
    },
    price_total: 10000,
    price_deposit: 5000,
    price_balance: 5000,
    status: "awaiting_deposit",
    deposit_paid_at: null,
    balance_paid_at: null,
    paymob_deposit_reference: null,
    paymob_balance_reference: null,
    paymob_deposit_order_id: null,
    paymob_balance_order_id: null,
    paymob_deposit_transaction_id: null,
    paymob_balance_transaction_id: null,
    preview_url: null,
    final_url: null,
    ...partial,
  };
}

const noonCairo = new Date("2026-08-15T12:00:00.000Z");

test("cairoDay buckets in Africa/Cairo", () => {
  assert.equal(cairoDay("2026-08-15T20:30:00.000Z"), "2026-08-15");
  assert.equal(cairoDay("2026-08-15T22:00:00.000Z"), "2026-08-16");
});

test("studioStats counts collected only from *_paid_at", () => {
  const stats = studioStats(
    [
      order({ id: "a", status: "awaiting_deposit" }),
      order({
        id: "b",
        status: "in_progress",
        deposit_paid_at: "2026-08-15T12:00:00.000Z",
      }),
      order({
        id: "c",
        status: "delivered",
        brief: {
          type: "character",
          subjects: 1,
          detail_level: "full render",
          background: "none",
          usage: "personal",
          revisions: 0,
        },
        price_total: 20000,
        price_deposit: 10000,
        price_balance: 10000,
        deposit_paid_at: "2026-08-14T12:00:00.000Z",
        balance_paid_at: "2026-08-15T12:00:00.000Z",
      }),
    ],
    noonCairo,
  );

  assert.equal(stats.totalOrders, 3);
  assert.equal(stats.collectedDeposit, 15000);
  assert.equal(stats.collectedBalance, 10000);
  assert.equal(stats.collected, 25000);
  assert.equal(stats.outstandingDeposit, 5000);
  assert.equal(stats.outstandingBalance, 5000);
  assert.equal(stats.escrowed, 5000);
  assert.equal(stats.needsNour, 1);
  assert.equal(stats.byStatus.awaiting_deposit.count, 1);
  assert.equal(stats.byType.find((row) => row.type === "character")?.count, 1);
  assert.deepEqual(
    stats.attention.map((row) => row.kind),
    ["needs_preview", "waiting_deposit"],
  );
});

test("studioStats activity falls on Cairo calendar days", () => {
  const stats = studioStats(
    [
      order({
        created_at: "2026-08-15T22:00:00.000Z",
        deposit_paid_at: "2026-08-15T22:00:00.000Z",
        status: "in_progress",
      }),
    ],
    new Date("2026-08-16T12:00:00.000Z"),
  );
  const fifteenth = stats.days.find((day) => day.date === "2026-08-15");
  const sixteenth = stats.days.find((day) => day.date === "2026-08-16");
  assert.equal(fifteenth?.created, 0);
  assert.equal(sixteenth?.created, 1);
  assert.equal(sixteenth?.deposits, 1);
});

test("studioStats does not throw when brief is missing", () => {
  const stats = studioStats(
    [
      order({
        brief: null as unknown as Order["brief"],
        price_total: undefined as unknown as number,
        price_deposit: undefined as unknown as number,
        price_balance: undefined as unknown as number,
      }),
    ],
    noonCairo,
  );
  assert.equal(stats.totalOrders, 1);
  assert.equal(stats.byType.length, 0);
  assert.equal(stats.outstanding, 0);
});
