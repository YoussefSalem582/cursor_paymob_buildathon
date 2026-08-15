# Escrowd — canonical build plan

**Escrowd** is the product: escrow for illustration commissions. Deposit starts work; balance unlocks the file. System shape: [`Architecture.md`](Architecture.md). History: [`changelog.md`](changelog.md). Agents: [`../AGENTS.md`](../AGENTS.md), [`../CLAUDE.md`](../CLAUDE.md), [`../cursor.md`](../cursor.md), [`../grok.md`](../grok.md).

This is the **only** product spec for today. Do not implement Scope Guard, AI pricing, lead score, or change-order payments. Those live in the appendix as a pitch line, not as work.

The repo has Paymob Intention + HMAC in `src/lib/paymob.ts`, Unified Checkout, Arabic/RTL, and the Escrowd brief → deposit → dashboard → balance flow. **Do not rewrite HMAC from memory. Do not port Scope Guard.**

---

## One-line pitch

Escrowd: Nour puts one link in her Instagram bio. A client fills a brief, pays a deposit, and gets a page they can return to. Nour gets a dashboard. Payment is the gate at both ends — no deposit, no work; no final payment, no file.

## Judge line

Instagram DMs can carry a conversation. They cannot carry a transaction. **One mechanism, five problems — not five features.**

| Problem | Solved by |
| --- | --- |
| 1. No commitment before work starts | Deposit |
| 2. Scope never frozen | Brief locked at first payment |
| 3. Leverage inverts once the file exists | Balance unlocks the file |
| 4. Nour is a human price calculator | Public live-priced form |
| 5. “Is it ready?” is another DM | Secret order URL `/o/[token]` |

## Scope (lock this)

**In**

- Public Arabic-first RTL brief form with a live price calculator
- Order row created on submit as `awaiting_deposit`, **then** Paymob deposit checkout
- Nour studio (own chrome, not the public header): overview from `orders`, board, advance one stage, upload preview + final
- Client order page at `/o/[token]` — status, frozen brief, preview, pay-balance
- Paymob balance payment → `final_url` is returned only after `balance_paid_at`
- Real Paymob Unified Checkout + HMAC-verified webhook
- Server-side price recomputation (browser never decides the Intention amount)

**Out today (do not build)**

Chat. Client accounts. Multi-artist. Email. Revisions workflow. Client file uploads. Analytics product / extra tables (studio overview is derived from `orders`). Invoices. Websockets. AI pricing. Scope Guard. Lead score. Subscriptions. Fake card UI. ParkIt-style simulated checkout.

**Roadmap only (say it, don’t ship it):** paid change orders later.

## Adaptation rule (event forms teams and challenges on the day)

If you do not get Challenge 03, keep Paymob two-payment + webhook + secret status page. Swap the persona and form fields. Do not invent a third product.

---

## Architecture

**No client accounts.** `/o/[token]` with a unique 12-char token (`nanoid`). Auth exists only for Nour’s dashboard (one Supabase user, or env-gated login). The starter’s “must be signed in to pay” path is demo leftover — clients must check out without an account.

**Two payments, one integration.** Same `createIntention()` twice. Deposit starts work. Balance unlocks the file. `client_secret` is single-use: every pay click creates a **new** Intention.

**Webhook is the source of truth.** Never mark deposit or balance paid from the browser redirect. Dashboard cannot write `*_paid_at` or jump to `in_progress` / `delivered`.

**Deploy the public URL in hour 0.** Paymob cannot hit localhost. Set `NEXT_PUBLIC_SITE_URL` to the Vercel (or ngrok) origin with no trailing slash, then register that webhook.

**Watermarking:** do not write an image pipeline. Nour uploads two files. Preview is already marked in the file. Hide `final_url` until `balance_paid_at` is set. Prepare 2–3 seed artworks before the demo.

---

## Data model

One table. Resist a second.

```
orders
  id                          uuid pk
  token                       text unique, 12-char nanoid
  created_at                  timestamptz

  client_name, client_email, client_phone   text not null

  brief                       jsonb not null
    -- { type, subjects, detail_level, background, usage, revisions }

  price_total, price_deposit, price_balance   integer not null  -- piastres

  status                      text not null
    -- awaiting_deposit | in_progress | ready_for_review
    -- | awaiting_balance | delivered

  deposit_paid_at, balance_paid_at            timestamptz
  paymob_deposit_reference, paymob_balance_reference  text
    -- last {token}:{kind}:{attemptId} so Inquiry can look up a stuck checkout
  paymob_deposit_order_id, paymob_balance_order_id          text
  paymob_deposit_transaction_id, paymob_balance_transaction_id  text

  preview_url, final_url      text
```

Writes to paid fields and to `in_progress` / `delivered` happen only in the webhook handler (service role). RLS: no browser insert/update. Public read of an order is by token through a server route that strips `final_url` unless `balance_paid_at` is set.

---

## Status machine

```
awaiting_deposit  -- created on brief submit, unpaid
       |
       |  webhook: deposit success
       v
in_progress       -- Nour may work
       |
       |  Nour uploads preview, advances
       v
ready_for_review  -- client can see preview
       |
       |  Nour uploads final (hidden), advances
       v
awaiting_balance  -- pay-balance button visible
       |
       |  webhook: balance success
       v
delivered         -- final_url returned
```

Nour may advance **only** `in_progress → ready_for_review → awaiting_balance`. Reject skips and backwards moves. Require `preview_url` before `ready_for_review`. Require `final_url` before `awaiting_balance`.

Webhook may move **only** `awaiting_deposit → in_progress` (deposit) and `awaiting_balance → delivered` (balance). Failed / pending callbacks never flip those fields. Duplicate callbacks: if the matching `*_paid_at` is already set, return 200 and do nothing.

---

## Pricing (client for the demo, server for money)

Same function in both places. Intention `amount` comes **only** from the server result.

EGP, then `Math.round(egp * 100)` once at the end. No floats in the database.

| Input | Effect |
| --- | --- |
| Type: portrait / character / logo-mascot / menu-set | base 800 / 1200 / 3000 / 2500 |
| Extra subject (`max(0, subjects - 1)`) | +60% of base each |
| Detail: sketch / flat colour / full render | ×0.5 / ×1.0 / ×1.6 |
| Background: none / simple / full scene | +0 / +300 / +900 |
| Usage: personal / commercial | ×1.0 / ×3.0 |

```
deposit = round(totalPiastres / 2)
balance = totalPiastres - deposit     -- so they always sum
```

Say the commercial ×3 out loud in the demo. It is the dispute the brief freezes.

---

## Paymob contract

Do not guess field names. The starter in `src/lib/paymob.ts` is the implementation. This section is the product wiring on top of it.

### Intention

- `POST https://accept.paymob.com/v1/intention/`
- Header: `Authorization: Token <PAYMOB_SECRET_KEY>` (the word `Token`, not `Bearer`)
- `amount` integer **piastres**. `sum(items.amount * quantity) === amount` or Paymob 400s
- `items[].name` and `items[].amount` required
- `billing_data` fully populated; unused keys `"NA"` (`buildBillingData()` already does this). Always send `phone_number` from the brief.
- `payment_methods`: integer Integration IDs from `PAYMOB_INTEGRATION_IDS` (card **and** wallet if you have both)
- Checkout URL: `https://accept.paymob.com/unifiedcheckout/?publicKey={PAYMOB_PUBLIC_KEY}&clientSecret={client_secret}`
- New Intention on every attempt. Never reuse `client_secret`.

### Two payments must not be confused

`special_reference` must be unique per Intention (Paymob rejects duplicates).

```
{token}:{kind}:{attemptId}
```

`kind` is `deposit` or `balance`. `attemptId` is a uuid. Also send `extras: { token, kind, attemptId }`.

Webhook matching:

1. Parse `obj.order.merchant_order_id` (`special_reference`).
2. Load the order by `token`.
3. Apply `kind`.
4. Store `obj.order.id` on `paymob_{kind}_order_id` and `obj.id` on `paymob_{kind}_transaction_id`.

If `kind=deposit` and `isPaid`: set `deposit_paid_at`, status `in_progress` (only from `awaiting_deposit`).
If `kind=balance` and `isPaid`: set `balance_paid_at`, status `delivered` (only from `awaiting_balance`).
If `success=false`: leave status, do not set paid timestamps.

`isPaid` (already in `src/lib/paymob.ts`): `success && !pending && !is_voided && !is_refunded && !error_occured`.

### HMAC (never skip)

Paymob POSTs `{ type, obj }` to `/api/paymob/webhook?hmac=...`. Verify **before** touching the row. SHA-512, secret `PAYMOB_HMAC_SECRET`, `crypto.timingSafeEqual`. Concatenate these fields **in this order**, no separators, booleans as `true`/`false`:

`amount_cents`, `created_at`, `currency`, `error_occured`, `has_parent_transaction`, `id`, `integration_id`, `is_3d_secure`, `is_auth`, `is_capture`, `is_refunded`, `is_standalone_payment`, `is_voided`, `order.id`, `owner`, `pending`, `source_data.pan`, `source_data.sub_type`, `source_data.type`, `success`

Mismatch → 401, log, **do not** mark paid. The Integration Wizard HMAC tester: https://wizard.paymob.com/

Card-token / delivery callbacks use a different field order. Ignore anything where `type !== "TRANSACTION"` (starter already does this).

**Do not “trust the payload for the demo” if HMAC fights you.** Paymob engineers will be in the room. Fallback is Transaction Inquiry, not skip-verify.

### Wallets vs `notification_url`

Intention `notification_url` is documented as card Integration IDs only. The demo line is wallets. Do all three:

1. Send `notification_url` on every Intention anyway (`${NEXT_PUBLIC_SITE_URL}/api/paymob/webhook`).
2. Also set the Transaction processed callback on **each** Paymob dashboard integration (card and wallet) to that same URL.
3. After redirect, `/o/[token]` polls the server every ~2s until status moves. Never show “paid” from query params.

### Transaction Inquiry fallback

If the row is still `awaiting_deposit` / `awaiting_balance` after checkout return, the server may pull Paymob:

- Auth: `PAYMOB_API_KEY` → short-lived token (`POST /api/auth/tokens`) — different from the Intention Secret Key
- Lookup by `merchant_order_id` (`POST /api/ecommerce/orders/transaction_inquiry`) using the last stored `paymob_{kind}_reference`
- App route: `GET /api/orders/:token?reconcile=1` (poll) or `POST /api/paymob/inquiry` with `{ orderId }`, `{ paymobOrderId }`, or `{ transactionId }`
- Apply the same `isPaid` + kind rules as the webhook. Still never trust the redirect.

Confirm the exact inquiry path against the event Postman collection if it 404s.

### Paymob MCP (not the paid signal)

Official MCP: `https://mcp.paymob.com/mcp` ([`.cursor/mcp.json`](../.cursor/mcp.json), [`.mcp.json`](../.mcp.json)). Use it to create **test** intentions, list transactions, and check balances. Credentials go in-session (`set_api_credentials`); never commit keys. Start with `is_live: false`. MCP output does **not** write `*_paid_at` — HMAC webhook (Inquiry fallback) remains the only paid signal.

### Redirect

`redirection_url` is UX only. Send the browser to `/o/[token]?checkout=returning`. The page says “confirming payment…” and polls. Anyone can type a success URL; that must not unlock the file.

---

## Env checklist

Copy from the starter, then add the inquiry key if you use fallback.

```
NEXT_PUBLIC_SITE_URL          # Vercel/ngrok origin, no trailing slash
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY  # sb_publishable_… (anon key still accepted)
SUPABASE_SECRET_KEY           # sb_secret_… server only, bypasses RLS (or SUPABASE_SERVICE_ROLE_KEY)
PAYMOB_SECRET_KEY             # egy_sk_test_…  server only
PAYMOB_PUBLIC_KEY             # egy_pk_test_…  safe in checkout URL
PAYMOB_HMAC_SECRET
PAYMOB_INTEGRATION_IDS        # comma-separated integers, card and wallet
PAYMOB_API_KEY                # inquiry fallback only
```

Test / Live of Secret Key, HMAC, and Integration IDs must match or Intention returns 404.

### Test credentials (sandbox keys only)

Event-provided cards win if they differ. Otherwise Paymob sandbox:

- Mastercard: `5123456789012346`, exp `01/39`, CVV `123`, name `Test Account`
- Visa (common Egypt sandbox): `4987654321098769`, exp `12/25`, CVV `123`
- Wallet: use the test msisdn / OTP from the Paymob dashboard or https://wizard.paymob.com/ — do not invent one

Pay a **deposit** and a **balance** at least once on the deployed URL before the demo slot.

---

## Build order (maps to risk)

The starter already has Next.js, Tailwind, next-intl RTL, Supabase clients, and Paymob. Hour 0 is **deploy + schema swap**, not `create-next-app`.

**Hour 0–1 · All hands**

- Fill env, deploy to Vercel, paste `NEXT_PUBLIC_SITE_URL` into Paymob dashboard callbacks
- Replace `orders` with the Escrowd table (migration, not a second product table)
- One person: Intention for a dummy `awaiting_deposit` row returns `client_secret` and hosted checkout opens

**Hour 1–2 · Split**

- Brief form + live calculator (client)
- `POST /api/orders` then `POST /api/checkout` with `kind=deposit` (server price)
- Webhook distinguishes deposit vs balance

**Milestone ~hour 2:** brief → real Paymob page → paying flips `deposit_paid_at`. If this is not done by **2:30**, drop the balance payment (kill switch A).

**Hour 2–4 · Two surfaces**

- `/o/[token]` — timeline, frozen brief, preview, confirming-payment poll, pay-balance
- `/dashboard` — Nour studio overview (orders-derived charts); `/dashboard/orders` board; `/dashboard/orders/[id]` detail. Login at `/sign-in` (no marketing chrome).

**Hour 4–5 · Close the loop**

- Balance Intention (`kind=balance`, amount `price_balance`)
- Hide `final_url` until `balance_paid_at`
- Arabic copy, RTL, mobile

**Hour 5–6 · Freeze**

Stop building. Seed 2–3 orders. Run the demo **three times on the deployed URL**. Write the 90-second script and who speaks.

### Kill switches

- **2:30 — no verified checkout:** drop everything else until one test-card payment flips a row.
- **4:00 — no balance path:** single payment of `price_total`. Webhook still the only paid signal. Unlock the file on that one payment. Weaker story, still a demo.
- **HMAC not verifying:** do not skip. Log `transactionHmacPayload(obj)`, confirm `PAYMOB_HMAC_SECRET`, use wizard tester, then Inquiry. Spending an hour inventing a new signer is how teams fail.

---

## Demo (90 seconds)

Two windows: client left, Nour right. Deployed URL only.

1. Client picks **portrait, 2 subjects, full render, commercial**. Price jumps ×3. Say it.
2. Pays deposit on real Unified Checkout (mention wallets come free — half her Instagram clients have no card).
3. Order appears on Nour’s dashboard. She advances, uploads preview.
4. Client sees preview, pays balance.
5. Full file unlocks.

Last beat is the unlock. Brief is frozen at deposit, so scope is a record, not an argument.

---

## API surface (keep it small)

| Method | Path | Who | Does |
| --- | --- | --- | --- |
| POST | `/api/orders` | client | Create `awaiting_deposit`. Server prices. Returns `{ token }`. |
| GET | `/api/orders/:token` | client | Order for `/o/[token]`. Strip `final_url` unless balance paid. `?reconcile=1` runs Transaction Inquiry then returns. |
| POST | `/api/checkout` | client | Body `{ token, kind: "deposit" \| "balance" }`. Server amount. Returns `{ checkoutUrl }`. |
| POST | `/api/paymob/webhook` | Paymob | HMAC, then paid fields. |
| GET | `/api/dashboard/orders` | Nour | List + status filter. |
| PATCH | `/api/dashboard/orders/:id` | Nour | Advance one allowed step only. |
| POST | `/api/dashboard/orders/:id/preview` | Nour | Set `preview_url`. |
| POST | `/api/dashboard/orders/:id/final` | Nour | Set `final_url` (not exposed to client yet). |

No client route may set status to `in_progress` or `delivered`.

---

## Streams (hand these to whoever the event assigns)

Names in older drafts (Rehab / Youssef / Abdullah / Mahmoud) do not apply. Teams are formed on the day. If you are three people, Glue merges into Paymob + Client.

Paste `.cursor/rules` is already in the repo — read it before generating code.

---

### Stream 1 — Paymob

**OWNS:** Intention creation, checkout URL, HMAC webhook, deposit vs balance correlation, Vercel `NEXT_PUBLIC_SITE_URL`, dashboard callback registration, Inquiry fallback.

**DOES NOT OWN:** brief UI, dashboard UI, pricing formula (calls the shared function).

**Build first, in this order:**

1. Keep `src/lib/paymob.ts`. Do not rewrite HMAC.
2. `POST /api/checkout` `{ token, kind }` — load order, recompute price, refuse wrong status (`deposit` only from `awaiting_deposit`, `balance` only from `awaiting_balance`), `special_reference = ${token}:${kind}:${attemptId}`, extras `{ token, kind, attemptId }`, return hosted checkout URL.
3. Webhook: verify HMAC → parse kind → idempotent paid timestamps → status moves in the machine above.
4. Deploy. Register webhook on **card and wallet** integrations.
5. Test card deposit **and** balance on the public URL before touching other product work.

**Edge cases:** webhook before or after redirect; abandoned checkout leaves `awaiting_deposit`; HMAC fail = 401; retry Intention on each pay click; `success=false` does not pay.

**Done when:** two real sandbox payments on one order, both HMAC-verified, row shows both timestamps. Inquiry can recover a stuck row without trusting the redirect.

---

### Stream 2 — Client surface

**OWNS:** every screen a client sees. Polls the server. Never writes paid fields. Never builds a card form.

**DOES NOT OWN:** webhook, dashboard, Intention internals. Calls `/api/checkout` and redirects to the URL it returns.

**Screens:**

1. **Brief (landing)** — editorial, illustration-forward, Arabic-first RTL. Fields: name, email, phone, type, subjects, detail, background, usage. Live price from the shared calculator. Submit → `POST /api/orders` → `POST /api/checkout` deposit → hosted Paymob. If checkout fails after the row exists, land on `/o/[token]` (resume-from-link). Loading state on submit.
2. **`/o/[token]`** — frozen brief + price breakdown, five-step status timeline, preview when set. After Paymob return: “confirming payment…” and poll `GET /api/orders/:token` (first and last ticks use `?reconcile=1`). Pay-balance only in `awaiting_balance`. Download final only when `balance_paid_at` is set. Resume later from the same link if they abandoned checkout.

**Edge cases:** poll retries then “having trouble loading status”; empty token 404; never show paid/unlocked from `?success=` query params.

**Done when:** brief → real Paymob → poll shows in_progress after webhook; second checkout for balance; file hidden until then; loading/error/empty on every screen.

---

### Stream 3 — Nour dashboard

**OWNS:** `/dashboard/*` (studio chrome). Functional over polished.

**DOES NOT OWN:** Paymob, client pages. Do not add routes that write `*_paid_at`.

**Screens:**

1. Login — one admin, genuinely gated; auth chrome only (no public Work/Commission nav).
2. Overview (`/dashboard`) — counts and money from `orders`; collected follows `*_paid_at` only; 14-day activity, status pipeline, type mix, attention queue.
3. Board (`/dashboard/orders`) — one column per status. Name, truncated brief, prices.
4. Detail (`/dashboard/orders/:id`) — full brief, money, timeline, Paymob references, preview/final, **one** “advance” button for the next legal step only. `/dashboard/:id` redirects here.

**Edge cases:** empty filter; advance without preview/final blocked with a visible error; cannot skip.

**Done when:** login required; one-step advances only; uploads are real Storage URLs; empty/loading/error handled.

---

### Stream 4 — Glue (if four people; otherwise split across 1–3)

**OWNS:** schema migration, env on Vercel, Arabic copy, seed orders, 90-second script, one E2E pass on the deployed URL, merge conflicts.

**DOES NOT OWN:** inventing features. If someone starts Scope Guard or AI pricing, stop them.

**Done when:** the demo script has been run three times on Vercel without touching localhost, and everyone knows who speaks.

---

## Appendix — not today (Scope Guard)

An older draft priced free-text briefs with an LLM, detected out-of-scope DMs, and charged a change-order payment. That is a decent later product. It is the **wrong second payment** for this brief (the second payment is the balance that restores leverage), it needs a chat channel we are not building, and it puts a model on the money path.

If a judge asks “what’s next?”: paid change orders on top of the frozen brief. Do not write those tables today.
