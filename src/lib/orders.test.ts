import { test } from "node:test";
import assert from "node:assert/strict";
import {
  awaitingPayment,
  inquiryLookup,
  paymentStars,
  paymentWindowRemaining,
  publicOrder,
  type Order,
} from "./orders.ts";

function order(partial: Partial<Order>): Order {
  return {
    id: "1",
    token: "abcdefghijkl",
    created_at: "2026-08-15T00:00:00.000Z",
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
    final_url: "https://secret.example/final.png",
    ...partial,
  };
}

test("publicOrder hides final_url until balance_paid_at", () => {
  assert.equal(publicOrder(order({})).final_url, null);
  assert.equal(
    publicOrder(order({ balance_paid_at: "2026-08-15T12:00:00.000Z" })).final_url,
    "https://secret.example/final.png",
  );
});

test("inquiryLookup uses last special_reference for the awaiting kind", () => {
  assert.equal(inquiryLookup(order({})), null);
  assert.deepEqual(
    inquiryLookup(
      order({
        paymob_deposit_reference: "abcdefghijkl:deposit:attempt-1",
        paymob_deposit_order_id: "555",
      }),
    ),
    {
      merchantOrderId: "abcdefghijkl:deposit:attempt-1",
      paymobOrderId: 555,
    },
  );
  assert.equal(
    inquiryLookup(
      order({
        status: "in_progress",
        deposit_paid_at: "2026-08-15T12:00:00.000Z",
        paymob_deposit_reference: "abcdefghijkl:deposit:attempt-1",
      }),
    ),
    null,
  );
  assert.deepEqual(
    inquiryLookup(
      order({
        status: "awaiting_balance",
        deposit_paid_at: "2026-08-15T12:00:00.000Z",
        paymob_balance_reference: "abcdefghijkl:balance:attempt-2",
      }),
    ),
    { merchantOrderId: "abcdefghijkl:balance:attempt-2", paymobOrderId: undefined },
  );
});

test("awaitingPayment is true only before the matching timestamp", () => {
  assert.equal(awaitingPayment(order({})), true);
  assert.equal(
    awaitingPayment(
      order({ status: "in_progress", deposit_paid_at: "2026-08-15T12:00:00.000Z" }),
    ),
    false,
  );
});

test("paymentStars is 5 inside 72h and 4 after", () => {
  const created = "2026-08-15T00:00:00.000Z";
  const inside = Date.parse("2026-08-17T23:00:00.000Z");
  const outside = Date.parse("2026-08-18T00:00:01.000Z");
  assert.equal(paymentStars(order({ created_at: created }), inside), 5);
  assert.equal(paymentStars(order({ created_at: created }), outside), 4);
  assert.equal(
    paymentStars(
      order({
        created_at: created,
        deposit_paid_at: "2026-08-17T12:00:00.000Z",
      }),
      outside,
    ),
    5,
  );
  assert.equal(
    paymentStars(
      order({
        created_at: created,
        deposit_paid_at: "2026-08-18T01:00:00.000Z",
      }),
      outside,
    ),
    4,
  );
});

test("paymentWindowRemaining expires at 72h", () => {
  const created = "2026-08-15T00:00:00.000Z";
  assert.deepEqual(
    paymentWindowRemaining(created, Date.parse("2026-08-15T10:30:00.000Z")),
    { hours: 61, minutes: 30, expired: false },
  );
  assert.deepEqual(
    paymentWindowRemaining(created, Date.parse("2026-08-18T00:00:00.000Z")),
    { hours: 0, minutes: 0, expired: true },
  );
});
