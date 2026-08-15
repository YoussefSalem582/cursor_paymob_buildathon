# Escrowd TODO

As of 2026-08-15. Canonical spec: [`docs/plan.md`](docs/plan.md). Architecture: [`docs/Architecture.md`](docs/Architecture.md). History: [`docs/changelog.md`](docs/changelog.md).

**One mechanism:** deposit starts work; balance unlocks the file. Do not build Scope Guard, AI pricing, lead score, change-order payments, chat, or client accounts.

---

## Where the repo is right now

`main` is current. Rebase conflict is done. Hosted `orders` is the Escrowd shape (`0006_escrowd_orders_restore_fourth.sql`).

The **screens and payment model are in the tree**. The **demo is not proven** on a public URL (two HMAC-verified sandbox payments on one order). That is the remaining risk.

| Layer | In tree | Gap |
| --- | --- | --- |
| Schema | `0002` + `0003` + `0004` + `0005` + `0006` on the hosted project | Do not re-apply `0001_orders.sql`. Do not re-add `clients` / `client_id` |
| Pricing | Shared `priceBrief()`; commercial ×3 | — |
| Client | Brief submit starts deposit checkout; `/o/[token]` timeline + poll + Inquiry reconcile | Prove on the public URL |
| Nour | Gated `/dashboard` studio (own chrome): overview charts, board, uploads, Paymob ids on detail. Public Selected work is real studies. | Seed 2–3 orders with watermarked preview/final |
| Paymob | Intention `{token}:{kind}:{attemptId}` stored; HMAC webhook; Inquiry fallback | Paste webhook on **wallet** integration; two sandbox payments |
| Theme | Class-based dark mode | — |
| E2E | Not recorded | Kill switches in `docs/plan.md` still apply |

---

## 0. Unblock the tree

- [x] HMAC-first webhook, `parseSpecialReference`, deposit → `in_progress`, balance → `delivered`
- [x] Inquiry persists Escrowd rows (`applyPaymobTransaction`), not demo `paid`
- [x] Hosted `orders` is the Escrowd table (not Scope Guard columns)

---

## 1. Prove money (Stream 1 — blocking)

Without this, the rest is a storefront. Spec “done when”: two real sandbox payments on **one** order, both HMAC-verified.

- [x] `NEXT_PUBLIC_SITE_URL` = `https://cursor-paymob-buildathon-five.vercel.app` (no trailing slash)
- [ ] Register `https://cursor-paymob-buildathon-five.vercel.app/api/paymob/webhook` as Transaction processed callback on **card and wallet** integrations
- [x] `PAYMOB_INTEGRATION_IDS` is this merchant’s test card `5853667` (not an ID from another account)
- [ ] Add a wallet Integration ID to `PAYMOB_INTEGRATION_IDS` only if this merchant enables one in Test mode
- [ ] Test-card **deposit** on the public URL → `awaiting_deposit → in_progress` and `deposit_paid_at` set
- [ ] **Kill switch 2:30:** if that has not happened, stop all other product work until it does
- [ ] Test-card **balance** on the same order → `awaiting_balance → delivered`, file unlocks on `/o/[token]`
- [ ] **Kill switch 4:00:** if the balance path is not live, one payment of `price_total`, still webhook-only

---

## 2. Wire Transaction Inquiry

- [x] Persist last `special_reference` per kind (`paymob_{kind}_reference`)
- [x] Same deposit/balance rules as the webhook
- [x] `/o/[token]` poll calls `GET /api/orders/:token?reconcile=1` when returning
- [ ] Confirm the inquiry path against the event Postman collection if it 404s
- [x] Never mark paid from redirect query params

---

## 3. Client gaps vs Stream 2 “done when”

- [x] Brief submit → `POST /api/orders` → deposit checkout
- [x] Status timeline on `/o/[token]`
- [x] Poll: stop when status moves; after retries show trouble copy
- [x] Loading / error on commission, order, and Pay buttons

---

## 4. Dashboard gaps vs Stream 3 “done when”

- [x] Visible errors when upload or PATCH fails
- [x] Detail: `deposit_paid_at` / `balance_paid_at` and full frozen brief
- [x] List: truncated brief, not only name + price
- [x] Localize `order.status` on the detail page
- [x] Public `/sign-up` closed (redirects to `/sign-in`)

---

## 5. Glue / freeze (Stream 4)

- [x] Seed pipeline orders on hosted `orders` (awaiting_deposit → delivered)
- [ ] Seed 2–3 **already-watermarked** preview files and matching finals (no image pipeline)
- [x] Arabic + RTL pass on phone-width (logical CSS; header wraps)
- [x] Dark mode
- [ ] Run the 90-second script **three times on the deployed URL**. Script is in `docs/plan.md` / `README.md`
- [ ] Assign who speaks: commercial ×3, wallets come free, unlock is the last shot

---

## Explicitly out of scope today

Chat · client accounts · multi-artist · email · revisions workflow · client file uploads · analytics · invoices · websockets · AI pricing · Scope Guard · lead score · subscriptions · fake card UI · rewriting HMAC in `src/lib/paymob.ts`.

Roadmap one-liner for judges: paid change orders later.

---

## Quick commands

```bash
npm test          # HMAC + pricing + order helpers — keep green
npm run dev       # local UI only; Paymob cannot hit localhost
npx vercel --prod # public URL required for webhooks
```

HMAC tester: https://wizard.paymob.com/  
Test cards: README (event cards win if they differ).
