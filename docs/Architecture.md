# Escrowd architecture

Escrow for illustration commissions. Deposit starts work; balance unlocks the file. Product spec and build order: [`plan.md`](plan.md). Changelog: [`changelog.md`](changelog.md).

Agent files (keep in lockstep; always update docs in the same turn as code): [`../AGENTS.md`](../AGENTS.md), [`../CLAUDE.md`](../CLAUDE.md), [`../cursor.md`](../cursor.md), [`../grok.md`](../grok.md). Cursor rules include `docs-sync.mdc`.

This file is the system shape: trust boundaries, data, payments, and how the pieces talk. Deposit starts work; balance unlocks the file. HMAC lives in [`src/lib/paymob.ts`](../src/lib/paymob.ts) — do not rewrite it.

---

## Context

```mermaid
flowchart LR
  Client[Client browser] -->|brief and poll /o/token| App[Next.js on Vercel]
  Nour[Nour dashboard] -->|auth plus uploads| App
  App -->|service role| DB[(Supabase Postgres)]
  App -->|files| Storage[(Supabase Storage)]
  App -->|Intention Token SK| Paymob[Paymob Egypt]
  Client -->|hosted checkout| Paymob
  Paymob -->|HMAC webhook| App
```

Two human surfaces, one money rail:

| Who | Surface | Auth |
| --- | --- | --- |
| Client | Brief form, `/o/[token]` | None. Unguessable 12-char token |
| Nour | `/dashboard/*` | One admin (Supabase Auth) |
| Paymob | Hosted Unified Checkout | Paymob’s page. We never collect cards |

---

## Decisions that must not drift

1. **No client accounts.** Order page is `/o/[token]`. The starter’s “must be signed in to pay” path is leftover.
2. **Two payments, one integration.** Same `createIntention()` for `kind=deposit` and `kind=balance`. New Intention every click (`client_secret` is single-use).
3. **Webhook is the only paid signal.** Redirect query params, dashboard PATCH, and Paymob MCP `get_*` results cannot set `*_paid_at` or jump to `in_progress` / `delivered`. MCP is live account ops only ([`.cursor/mcp.json`](../.cursor/mcp.json)).
4. **Price is a server function.** The live calculator is display. Intention `amount` is recomputed from `brief`.
5. **One `orders` table.** No `clients`, `payments`, or `change_orders` tables today.
6. **Arabic-first RTL** via next-intl (`/` → `/ar`). Tailwind logical utilities, not a fake `dir` on a Latin layout.

---

## Stack (today)

| Layer | Choice | Notes |
| --- | --- | --- |
| App | Next.js 16 App Router, TypeScript | Locale prefix `[locale]` |
| UI | Tailwind 4, next-intl | Arabic default |
| Data | Supabase Postgres + Storage | Service role for writes; RLS: no browser insert/update |
| Pay | Paymob Intention + Unified Checkout | [`src/lib/paymob.ts`](../src/lib/paymob.ts) |
| Host | Vercel | Public URL required from hour 0 for webhooks |

---

## Trust and money

```mermaid
sequenceDiagram
  participant C as Client
  participant S as Next.js server
  participant P as Paymob
  participant D as Supabase

  C->>S: POST /api/orders (brief)
  S->>S: price on server
  S->>D: insert awaiting_deposit
  S-->>C: token
  C->>S: POST /api/checkout token kind
  S->>P: POST /v1/intention special_reference token:kind:attemptId
  P-->>S: client_secret
  S-->>C: checkoutUrl
  C->>P: Unified Checkout
  P->>S: POST /api/paymob/webhook hmac
  S->>S: verify HMAC then isPaid
  S->>D: set deposit_paid_at or balance_paid_at
  C->>S: poll GET /api/orders/token
  Note over C,S: Redirect is UX only. Poll until webhook lands.
```

**Paid fields** (`deposit_paid_at`, `balance_paid_at`, status `in_progress` / `delivered`) are written only in `applyPaymobTransaction` after HMAC (webhook) or a live Inquiry pull. HMAC mismatch → 401, no UPDATE. Redirect query params never write paid fields.

**Wallets:** Intention `notification_url` is documented as card-only. Also register `/api/paymob/webhook` on each Paymob dashboard integration (card and wallet). After return, `/o/[token]` polls. Do not skip HMAC; Inquiry is the fallback.

**Correlation:** `special_reference` = `{token}:{kind}:{attemptId}` (unique per Intention). `extras: { token, kind, attemptId }`. Webhook parses `obj.order.merchant_order_id`.

**File unlock:** `GET /api/orders/:token` omits `final_url` unless `balance_paid_at` is set. Preview may show earlier. No watermark pipeline — Nour uploads two files.

---

## Status machine

```mermaid
stateDiagram-v2
  [*] --> awaiting_deposit: POST /api/orders
  awaiting_deposit --> in_progress: webhook deposit
  in_progress --> ready_for_review: Nour plus preview_url
  ready_for_review --> awaiting_balance: Nour plus final_url
  awaiting_balance --> delivered: webhook balance
```

| Transition | Actor | Guard |
| --- | --- | --- |
| `awaiting_deposit → in_progress` | Webhook | `kind=deposit` and `isPaid` |
| `in_progress → ready_for_review` | Nour | `preview_url` set |
| `ready_for_review → awaiting_balance` | Nour | `final_url` set (still hidden from client) |
| `awaiting_balance → delivered` | Webhook | `kind=balance` and `isPaid` |

Nour cannot skip or go backwards. Duplicate webhooks: if the matching `*_paid_at` is already set, return 200. `success=false` does not flip status.

Kill switch at 4:00: single payment of `price_total` still uses the webhook as the only paid signal.

---

## Data

Target `orders` row (piastres are integers; no floats):

- Identity: `id`, `token` (unique nanoid), `created_at`
- Client: `client_name`, `client_email`, `client_phone`
- Frozen brief: `brief` jsonb (`type`, `subjects`, `detail_level`, `background`, `usage`, `revisions`)
- Money: `price_total`, `price_deposit`, `price_balance`
- Status + paid timestamps
- Last Intention `special_reference` per kind (`paymob_{deposit,balance}_reference`)
- Paymob ids per kind (order id + transaction id)
- `preview_url`, `final_url`

Writes go through the service-role key. Public read is by token on the server, not a wide-open select.

Demo starter / Scope Guard `orders` is replaced by [`supabase/migrations/0003_escrowd_orders_replace.sql`](../supabase/migrations/0003_escrowd_orders_replace.sql) (canonical create: [`0002_escrowd_orders.sql`](../supabase/migrations/0002_escrowd_orders.sql)).

---

## Pricing

One function, client (live UI) and server (Intention amount):

| Input | Effect |
| --- | --- |
| Type portrait / character / logo-mascot / menu-set | base 800 / 1200 / 3000 / 2500 EGP |
| Extra subjects | +60% of base each |
| Detail sketch / flat colour / full render | ×0.5 / ×1.0 / ×1.6 |
| Background none / simple / full scene | +0 / +300 / +900 |
| Usage personal / commercial | ×1.0 / ×3.0 |

`totalPiastres = round(egp * 100)`, `deposit = round(total / 2)`, `balance = total - deposit`.

---

## HTTP surface (target)

| Method | Path | Who | Does |
| --- | --- | --- | --- |
| POST | `/api/orders` | Client | Create `awaiting_deposit`, server price, return `{ token }` |
| GET | `/api/orders/:token` | Client | Order for `/o/[token]`; strip `final_url` until balance paid. `?reconcile=1` runs Inquiry then returns |
| POST | `/api/checkout` | Client | `{ token, kind }`; return hosted checkout URL |
| POST | `/api/paymob/webhook` | Paymob | HMAC, then paid fields |
| POST | `/api/paymob/inquiry` | Server / poll | Transaction Inquiry fallback; same `isPaid()` persist as webhook |
| GET | `/api/dashboard/orders` | Nour | List + status filter |
| PATCH | `/api/dashboard/orders/:id` | Nour | Advance one legal step |
| POST | `/api/dashboard/orders/:id/preview` | Nour | Set `preview_url` |
| POST | `/api/dashboard/orders/:id/final` | Nour | Set `final_url` (not exposed yet) |
| GET | `/api/health` | anyone | Liveness, no secrets |

Redirect from Paymob is `/api/paymob/redirect/[locale]` → `/o/[token]?checkout=returning` (poll only). Inquiry is the fallback when the webhook cannot reach the server.

---

## Code map

| Path | Role |
| --- | --- |
| [`src/lib/paymob.ts`](../src/lib/paymob.ts) | Intention, checkout URL, HMAC, `isPaid`, Inquiry, `parseSpecialReference` — **keep**. Field order: [`.agents/skills/paymob-integration/references/hmac-verification.md`](../.agents/skills/paymob-integration/references/hmac-verification.md) |
| [`src/lib/apply-paymob-transaction.ts`](../src/lib/apply-paymob-transaction.ts) | Shared deposit/balance persist after HMAC or Inquiry |
| [`src/lib/pricing.ts`](../src/lib/pricing.ts) | Shared brief price; live UI + server Intention |
| [`src/lib/orders.ts`](../src/lib/orders.ts) | Status machine; `publicOrder` hides `final_url`; `inquiryLookup` for reconcile |
| [`src/lib/theme-script.ts`](../src/lib/theme-script.ts) / [`src/components/theme-toggle.tsx`](../src/components/theme-toggle.tsx) | Blocking theme script + class-based dark mode (`html.dark`) |
| [`.cursor/mcp.json`](../.cursor/mcp.json) / [`.mcp.json`](../.mcp.json) | Paymob MCP URL only. Credentials via `set_api_credentials` in-session, never in git |
| [`src/app/api/paymob/webhook/route.ts`](../src/app/api/paymob/webhook/route.ts) | HMAC, then deposit or balance |
| [`src/app/api/paymob/inquiry/route.ts`](../src/app/api/paymob/inquiry/route.ts) | Pull-based fallback when the callback is slow |
| [`src/app/api/checkout/route.ts`](../src/app/api/checkout/route.ts) | `{ token, kind }`, no login, server price |
| [`src/app/[locale]/commission/`](../src/app/%5Blocale%5D/commission/) | Public brief + live price |
| [`src/app/[locale]/o/[token]/`](../src/app/%5Blocale%5D/o/%5Btoken%5D/) | Client status page; polls after Paymob return; `?reconcile=1` on first/last tick |
| [`src/components/price.tsx`](../src/components/price.tsx) | EGP display; safe to import from Client Components |
| [`src/components/ui/`](../src/components/ui/) | Shared field/button chrome: labels, hints, errors, choice chips, steppers, file picker |
| [`src/components/site-chrome.tsx`](../src/components/site-chrome.tsx) | Server header/footer (session via `cookies()`). Do not import from `"use client"` files |
| [`src/app/[locale]/dashboard/`](../src/app/%5Blocale%5D/dashboard/) | Nour wall + uploads |
| [`src/lib/supabase/`](../src/lib/supabase/) | Browser, cookie, and admin clients; `env.ts` for publishable key |
| [`src/proxy.ts`](../src/proxy.ts) | Locale + session. Skips Supabase if public env is missing so Vercel does not 500 |
| [`src/app/layout.tsx`](../src/app/layout.tsx) | Root pass-through; `html`/`body` live in `[locale]/layout` |
| [`src/app/[locale]/layout.tsx`](../src/app/%5Blocale%5D/layout.tsx) | Locale `html`/`body`; blocking theme script before paint |
| [`src/components/escrowd-logo.tsx`](../src/components/escrowd-logo.tsx) | PNG mark for chrome and empty artwork. Renders the light and dark marks together and swaps them with `dark:hidden` / `hidden dark:block` |
| [`public/brand/`](../public/brand/) | Illustrated mark and lockup. `escrowd-{mark,lockup}.png` are transparent, `*-dark.png` carry cream ink for dark mode, `*-on-paper.png` keep the cream plate for surfaces we do not control (GitHub, share cards) |
| [`src/app/favicon.ico`](../src/app/favicon.ico) / [`icon.png`](../src/app/icon.png) / [`apple-icon.png`](../src/app/apple-icon.png) | Tab and touch icons — cropped lock mark. First two transparent; `apple-icon` stays opaque because iOS composites on black |
| [`src/app/opengraph-image.png`](../src/app/opengraph-image.png) | Share image from the lockup |
| [`supabase/migrations/0002_escrowd_orders.sql`](../supabase/migrations/0002_escrowd_orders.sql) | Escrowd `orders` + `deliveries` bucket |
| [`supabase/migrations/0003_escrowd_orders_replace.sql`](../supabase/migrations/0003_escrowd_orders_replace.sql) | Replaces leftover Scope Guard `orders` on the hosted project |

Env: `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (or legacy `ANON_KEY`), `SUPABASE_SECRET_KEY` (`sb_secret_…`, or legacy `SUPABASE_SERVICE_ROLE_KEY`), `PAYMOB_SECRET_KEY`, `PAYMOB_PUBLIC_KEY`, `PAYMOB_HMAC_SECRET`, `PAYMOB_INTEGRATION_IDS`, optional `PAYMOB_API_KEY` for Inquiry. Secret key never in the client bundle (`NEXT_PUBLIC_`). Clients live in [`src/lib/supabase/`](../src/lib/supabase/) — session refresh is [`src/proxy.ts`](../src/proxy.ts) (Next.js 16), not a separate `middleware.ts`. Copy `.env.example` to `.env.local`; never commit real keys.

---

## Out of architecture today

Chat, client accounts, multi-artist, email, revision workflow, client uploads, websockets, AI pricing, Scope Guard, lead score, subscriptions, fake card UI. Roadmap only: paid change orders on the frozen brief.

If the event challenge is not 03: keep two-payment + webhook + secret status page; swap the form, not this payment model.
