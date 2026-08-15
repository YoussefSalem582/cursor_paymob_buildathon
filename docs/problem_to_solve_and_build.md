# Commission Flow — 6-Hour Build Plan

## The one-line pitch

Nour puts one link in her Instagram bio. A client fills a brief, pays a deposit, and gets a page they can return to. Nour gets a dashboard. Payment is the gate at both ends — no deposit, no work; no final payment, no file.

## Scope (lock this and don't move it)

**In:**

- Public brief form with live price calculation
- Paymob deposit (50%) → order created
- Nour's dashboard: list of orders, move status forward, upload preview + final
- Client order page at a secret URL — status, preview, pay-balance button
- Paymob balance payment → final file unlocks
- Arabic-first, RTL

**Out, permanently:**
Chat. Client accounts. Multi-artist support. Email notifications. Revisions system. File uploads from client. Analytics. Invoices. Anything real-time.

## Key architectural decisions

**No client accounts.** Order page is `/o/[token]` with a random 12-char token. Auth exists only for Nour, and it can be a single hardcoded account. This deletes roughly a quarter of the work and nobody notices.

**Two payments, one flow.** Deposit unlocks the work starting. Balance unlocks the delivery. Same Paymob integration called twice — the integration is the product, not a bolt-on.

**Webhook is the source of truth.** Never mark an order paid from the browser redirect. Deploy to Vercel first thing so the webhook has a real URL from minute one.

## Data model

```
orders
  id, token, created_at
  client_name, client_email, client_phone
  brief (jsonb: type, subjects, detail_level, background, usage, revisions)
  price_total, price_deposit, price_balance   -- piastres
  status                -- awaiting_deposit | in_progress | ready_for_review
                        -- | awaiting_balance | delivered
  deposit_paid_at, balance_paid_at
  paymob_deposit_order_id, paymob_balance_order_id
  preview_url, final_url
```

One table. Resist adding a second.

## Pricing logic

Base by type, multiplied and added:

| Input | Effect |
| --- | --- |
| Type: portrait / character / logo-mascot / menu-set | base 800 / 1200 / 3000 / 2500 |
| Extra subject | +60% of base each |
| Detail: sketch / flat colour / full render | ×0.5 / ×1.0 / ×1.6 |
| Background: none / simple / full scene | +0 / +300 / +900 |
| Usage: personal / commercial | ×1.0 / ×3.0 |

The commercial multiplier is the interesting one — say it out loud in the demo. It's the single biggest source of freelancer disputes and the brief freezes it at payment.

## The build order

**Hour 0–1 · Foundation, all hands**
Scaffold Next.js + Tailwind + Supabase, deploy to Vercel immediately, create the orders table. One person does nothing but get `POST /v1/intention/` returning a `client_secret` from a server route — that's the highest-risk item, so it gets started first.

**Hour 1–2 · Split**

- Brief form + pricing calculator, client side
- Checkout route + redirect to Unified Checkout URL
- Webhook route: verify HMAC, flip status, store Paymob order id

Milestone at hour 2: submitting the brief takes you to a real Paymob page and paying flips a row in the database. If this isn't done by 2:30, drop the balance payment and ship a single-payment version.

**Hour 2–4 · The two surfaces**

- `/o/[token]` — status timeline, brief summary, preview when available, pay-balance button
- `/dashboard` — order list, status advance buttons, upload preview, upload final

**Hour 4–5 · Close the loop**
Balance payment reuses the same checkout code with a different amount. Watermarked preview shows before payment; final file link appears only when `balance_paid_at` is set. Arabic copy, RTL check, mobile check.

**Hour 5–6 · Freeze**
Stop building. Seed two or three realistic orders. Run the demo end to end at least three times on the deployed URL. Write the 90-second script and decide who says what.

## The demo

Two windows side by side — client on the left, Nour on the right.

Client picks *portrait, 2 subjects, full render, commercial*, watches the price move, pays the deposit. Order appears on Nour's side. She advances it, uploads a watermarked preview. Client refreshes, sees the preview, pays the balance. The full-resolution file unlocks.

The moment that lands is the unlock. Build toward it.

## Things to say to the judges

The mobile wallets come free with Unified Checkout — half of Nour's Instagram clients don't have cards, and that's the difference between a payment flow that works in Egypt and one that doesn't.

The brief is frozen at the moment of payment, so scope stops being an argument and becomes a record.

## Failure modes to pre-empt

Amounts are in **piastres** — 100 EGP is 10000. `billing_data` must be fully populated or the intention is rejected; default unused fields to `"NA"`. Keep the secret key server-side only; a judge may well ask. And if the HMAC verification fights you, log the payload, trust it for the demo, and mark it TODO — losing an hour to signature debugging is how teams fail to demo at all.
