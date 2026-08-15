# Escrowd TODO

As of 2026-08-15. Canonical spec: [`docs/plan.md`](docs/plan.md). Architecture: [`docs/Architecture.md`](docs/Architecture.md). History: [`docs/changelog.md`](docs/changelog.md).

**One mechanism:** deposit starts work; balance unlocks the file. Do not build Scope Guard, AI pricing, lead score, change-order payments, chat, or client accounts.

---

## Where the repo is right now

Local `main` (`e8fa413`) already has the Escrowd product. The working tree is **not** that tip:

- Detached HEAD, **rebasing `main` onto `origin/main`** (`ddbc28c` — Inquiry + Paymob skill).
- Stopped at **8 of 16**: `66445cc` *feat(api): apply HMAC deposit and balance, then poll order page*.
- **Conflict:** `src/app/api/paymob/webhook/route.ts` still has `<<<<<<<`. Incoming side is the Escrowd deposit/balance persist. `HEAD` side is the starter `applyPaymobTransaction` (`paid` / `pending` / `failed`).
- Remaining commits after the conflict: dashboard APIs, health, landing, commission, `/o/[token]`, studio wall, delete demo checkout, docs.

Finish this rebase before any new feature work. Keep the Escrowd webhook. Then retarget Inquiry (from `origin/main`) onto the Escrowd `orders` row — do not keep writing `paymob_order_id` / `status=paid`.

---

## Current product status (on `main`, after rebase)

The **screens and payment model are in the tree**. The **demo is not proven** on a public URL (two HMAC-verified sandbox payments on one order). That is the remaining risk.

| Layer | On `main` (`e8fa413`) | Gap |
| --- | --- | --- |
| Schema | `0002_escrowd_orders.sql` applied on the hosted project | Do not re-apply `0001_orders.sql` |
| Pricing | Shared `priceBrief()`; commercial ×3 test | — |
| Client | `/commission`, `/o/[token]` poll after return | Submit does not start checkout; no timeline; poll never times out |
| Nour | Gated `/dashboard` + uploads + one-step PATCH | Silent upload errors; no payment timestamps on detail |
| Paymob | Intention `{token}:{kind}:{attemptId}`, HMAC webhook deposit/balance, redirect is UX only | Webhook URL not confirmed on **wallet** integration |
| Inquiry | Skill docs only on `main`. Code exists on `origin/main` but persists the **demo** table | After rebase: same `isPaid()` rules as webhook; poll should call it |
| E2E | Not recorded | Kill switches in `docs/plan.md` still apply |

Starter leftovers removed on `main` (commit `d6f1dfd`): `/demo`, checkout success/failure, `pay-button`. They can reappear in the working tree until the rebase finishes.

---

## 0. Unblock the tree (do this first)

- [ ] Resolve `src/app/api/paymob/webhook/route.ts`: keep HMAC-first, `parseSpecialReference`, deposit → `in_progress`, balance → `delivered`, idempotent `*_paid_at`
- [ ] Continue the rebase through dashboard, UI, demo deletion, and docs (`git rebase --continue` until `main` is at the rewritten tip)
- [ ] After rebase: Inquiry (`src/lib/paymob.ts` + `POST /api/paymob/inquiry`) must call the **Escrowd** persist path, not `applyPaymobTransaction` against `paid\|pending\|failed`
- [ ] Do not skip HMAC. Inquiry is the fallback, not a replacement

---

## 1. Prove money (Stream 1 — blocking)

Without this, the rest is a storefront. Spec “done when”: two real sandbox payments on **one** order, both HMAC-verified.

- [ ] `NEXT_PUBLIC_SITE_URL` = deployed origin, no trailing slash (Paymob cannot hit localhost)
- [ ] Register `https://<origin>/api/paymob/webhook` as Transaction processed callback on **card and wallet** integrations
- [ ] `PAYMOB_INTEGRATION_IDS` includes wallet as well as card `5240449` (changelog only recorded the card id)
- [ ] Test-card **deposit** on the public URL → `awaiting_deposit → in_progress` and `deposit_paid_at` set
- [ ] **Kill switch 2:30:** if that has not happened, stop all other product work until it does
- [ ] Test-card **balance** on the same order → `awaiting_balance → delivered`, file unlocks on `/o/[token]`
- [ ] **Kill switch 4:00:** if the balance path is not live, one payment of `price_total`, still webhook-only

---

## 2. Wire Transaction Inquiry (Stream 1 — Planned on `main`)

Specified in `docs/plan.md`. After rebase, the client exists; it is not Escrowd-correct and `/o/[token]` does not call it.

- [ ] Persist last `special_reference` (or Paymob order id) per kind so Inquiry can look up `{token}:{kind}:{attemptId}` — checkout generates `attemptId` but does not store it
- [ ] `applyPaymobTransaction` (or a replacement) uses the same deposit/balance rules as the webhook
- [ ] `/o/[token]` poll (or a server reconcile) calls Inquiry when status is still `awaiting_deposit` / `awaiting_balance` after return
- [ ] Confirm the inquiry path against the event Postman collection if it 404s
- [ ] Still never mark paid from redirect query params

---

## 3. Client gaps vs Stream 2 “done when”

- [ ] Brief submit → `POST /api/orders` → **deposit checkout** (today: save, land on `/o/[token]`, click pay again). Resume-from-link can stay as the abandoned-checkout path
- [ ] Status **timeline** on `/o/[token]` (five-step machine, not a single status line)
- [ ] Poll: stop when status moves; after retries show “having trouble loading status”
- [ ] Loading / error / empty on every client screen

---

## 4. Dashboard gaps vs Stream 3 “done when”

- [ ] Visible errors when upload or PATCH fails (`studio-actions.tsx` swallows non-OK)
- [ ] Detail: `deposit_paid_at` / `balance_paid_at` and full frozen brief (background, revisions)
- [ ] List: truncated brief, not only name + price
- [ ] Localize the raw `order.status` string on the detail page
- [ ] After Nour’s account exists: disable public `/sign-up` (any authenticated user can open `/dashboard`)

---

## 5. Glue / freeze (Stream 4)

- [ ] Seed 2–3 orders plus 2–3 **already-watermarked** preview files and matching finals (no image pipeline)
- [ ] Arabic + RTL pass on phone-width
- [ ] Run the 90-second script **three times on the deployed URL**. Script is in `docs/plan.md` / `README.md`
- [ ] Assign who speaks: commercial ×3, wallets come free, unlock is the last shot
- [ ] After rebase: changelog Unreleased still says Inquiry is Planned — move it to Added once it persists Escrowd rows, and add a line for this TODO

---

## Explicitly out of scope today

Chat · client accounts · multi-artist · email · revisions workflow · client file uploads · analytics · invoices · websockets · AI pricing · Scope Guard · lead score · subscriptions · fake card UI · rewriting HMAC in `src/lib/paymob.ts`.

Roadmap one-liner for judges: paid change orders later.

---

## Quick commands

```bash
npm test          # HMAC + pricing — keep green
npm run dev       # local UI only; Paymob cannot hit localhost
npx vercel --prod # public URL required for webhooks
```

HMAC tester: https://wizard.paymob.com/  
Test cards: README (event cards win if they differ).
