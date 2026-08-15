# Changelog

All notable changes to Escrowd. Dates are the day of the Cursor x Paymob Cairo Buildathon unless noted.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/). Versioning is informal until we ship a tagged release.

## Unreleased

### Fixed

- Studio `/dashboard` 500: hosted `orders` was Scope Guard again after `0004` was recorded as applied (`client_id`, `pending_payment`, no `brief`). Overview crashed on `order.brief.type`. [`0005_escrowd_orders_replace_third.sql`](../supabase/migrations/0005_escrowd_orders_replace_third.sql) restored the Escrowd table (two leftover test rows dropped). Studio reads now skip a missing brief instead of throwing.
- Brief submit 500 `null value in column "client_id"`: hosted `orders` had Scope Guard columns again after `0003` (`client_id` NOT NULL, status `pending_payment|paid`). [`0004_escrowd_orders_replace_again.sql`](../supabase/migrations/0004_escrowd_orders_replace_again.sql) dropped leftover tables and recreated the Escrowd shape. Three unpaid test rows were dropped.
- Intention 404 “Integration ID/Name does not exist”: `PAYMOB_INTEGRATION_IDS` was a card ID from a different Paymob account. This merchant’s test online card ID is `5853667` (same Test status as `egy_sk_test_…`).
- Production `next build` typecheck: `order-panel` used an undeclared `Brief` name. `Order.brief` is already that type, so the cast is gone.
- Stop the Vercel Turbopack build from treating `site-chrome` as a Client Component. `order-panel` imported `Price` from that file, which also uses `next/headers` for Nour’s session — so production `next build` failed. `Price` now lives in `src/components/price.tsx`.
- Remove `@next/swc-darwin-arm64` from `package.json`. It is a Mac-only optional binary; listing it as a required dependency made Vercel (`linux/x64`) fail `npm install` with `EBADPLATFORM`. Next installs the correct `@next/swc-*` package for the build machine.
- Stop 500 Internal Server Error on Vercel when Supabase env vars are unset (`.env.local` is not deployed). `proxy.ts` and the header skip session refresh instead of throwing. Add a root `src/app/layout.tsx` so a missed locale rewrite cannot crash `/`.

### Changed

- Arabic UI in `messages/ar.json` is spoken Cairene (white dialect), not MSA: `دلوقتي` / `معرفناش` / `بنفتح` / `الإيميل`, artwork captions like بتاع البلح, Nour’s studio stays feminine (`ارفعي`, `مستنياكي`). Product words stay: العربون، الباقي، البرايف، باي موب، فك الملف.
- Public storefront, studio login, and Nour’s studio are separate route groups. `/dashboard` no longer uses the marketing header/footer.
- Layouts fit a phone: compact public/studio headers, full-width CTAs, 16px inputs so iOS does not zoom, a fixed commission price + pay bar, a swipeable studio board, notch/home-indicator padding, and order status before the artwork on `/o/[token]`.
- Brand PNGs are transparent and trimmed to the artwork: `escrowd-mark.png` (815², kept square so `EscrowdLogo`'s `size` still holds) and `escrowd-lockup.png` (1381×481). The cream plate was unmixed into alpha rather than keyed out, so the anti-aliased stroke edges survive; stroke interiors are forced opaque so the ink does not go translucent off-paper. Palette quantization keeps all four brand PNGs near 71 KB total. Originals kept as `escrowd-{mark,lockup}-on-paper.png`, and the README banner points at the on-paper lockup because the black wordmark would vanish on GitHub's dark theme.
- `favicon.ico` (16/32/48, both copies) and `icon.png` are transparent, regenerated from the trimmed mark with a premultiplied resize so no cream fringe survives at 16px. `apple-icon.png` stays opaque — iOS composites touch icons onto black.
- Favicon is a tight crop of the lock mark (`favicon.ico`, `icon.png`, `apple-icon.png`) so the clay shackle reads in the tab. Linked from the locale layout.
- Form chrome: shared field/button primitives (`src/components/ui/`), labels with hints and errors, placeholders, LTR email/phone in Arabic, choice chips and steppers on the commission brief, sticky live price next to the deposit CTA, and a styled file picker in the studio.
- Home: hero is a framed study (not the logo), a three-step deposit / work / unlock band, an about section for Nour’s Garden City studio, a matted work wall with Arabic titles, and a closing commission CTA. Header is sticky and shares the page max-width; the site name is no longer an extra `h1`.
- Shared input validation (`src/lib/validate.ts`): Egyptian mobile stored as E.164, email/name checks, 12-char order tokens, PNG/JPEG/WebP uploads capped at 8 MB, Inquiry ids must be positive integers, and studio `next` cannot be a protocol-relative URL. The brief form shows field errors in the page language instead of the browser tooltip.

### Added

- Payment punctuality rating: 5 stars if the deposit webhook lands within 72 hours of `created_at`, otherwise 4. Client alert on the brief and on `/o/[token]` while the deposit is due. Studio board and order detail show the stars. Computed in `paymentStars()` — not a column, and late payment still checks out.
- Studio overview at `/dashboard`: order counts, webhook-only collected/outstanding totals, 14-day Cairo activity, status pipeline, type mix, and an attention queue. Board at `/dashboard/orders`. Order detail at `/dashboard/orders/[id]` (timeline + Paymob references). `/dashboard/[id]` redirects there.

- Dark-mode logo variants `public/brand/escrowd-{mark,lockup}-dark.png`: the near-black ink is repainted `--ink` cream and the clay shackle is left alone (split on lightness, ink ≤0.26 and clay ≥0.42). `EscrowdLogo` and `EscrowdLogoFrame` render both and swap with `dark:hidden` / `hidden dark:block`, so exactly one variant is in the layout and the accessibility tree.
- Production origin is `https://cursor-paymob-buildathon-five.vercel.app`. `NEXT_PUBLIC_SITE_URL` is set to that (Vercel Production/Preview + `.env.local`). Intention `notification_url` / `redirection_url` now point at a host Paymob can reach.
- Dark mode: `html.dark` class, blocking theme script, header toggle. Remembers light/dark; otherwise follows `prefers-color-scheme`.
- Checkout persists last `paymob_{kind}_reference` (`{token}:{kind}:{attemptId}`). `/o/[token]` poll calls `GET /api/orders/:token?reconcile=1` so Transaction Inquiry can recover a missed webhook.
- Brief submit starts deposit checkout immediately. Resume-from-link if Intention fails.
- Five-step status timeline on `/o/[token]`. Poll stops when status moves; after ~30s shows a trouble message.
- Dashboard: truncated brief on the list; localized status, full brief, and `*_paid_at` on detail. Upload/PATCH errors are visible.
- `supabase/migrations/0003_escrowd_orders_replace.sql` applied on the hosted project — leftover Scope Guard `orders` (and sibling tables) replaced with the Escrowd shape, including reference columns.
- Brand mark: lock whose shackle is a clay brush stroke, portrait held until the keyhole opens. PNG (`public/brand/`) in the header, footer, home, commission, studio login, empty artwork slots, and Open Graph.
- `.env.example` and gitignored `.env.local` for the Escrowd Supabase project.
- `src/lib/supabase/env.ts` reads `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (falls back to `NEXT_PUBLIC_SUPABASE_ANON_KEY`). Browser, server, and `proxy.ts` session refresh all use it.
- Admin client prefers `SUPABASE_SECRET_KEY` (`sb_secret_…`) and still accepts legacy `SUPABASE_SERVICE_ROLE_KEY`.
- Official Paymob AI agent skill under `.cursor/skills/paymob-integration/` (and `.agents/skills/paymob-integration/` plus Cursor commands `/paymob-test-cards`, `/paymob-explain-error`, `/paymob-check-hmac`). Source: [PaymobAccept/Paymob-AI-Integration-Skill](https://github.com/PaymobAccept/Paymob-AI-Integration-Skill).
- Transaction Inquiry client in `src/lib/paymob.ts` and `POST /api/paymob/inquiry` (API Key → auth token → lookup). Shared persist is `src/lib/apply-paymob-transaction.ts` (deposit/balance columns, not the demo `paid` status).
- Official Paymob MCP at `https://mcp.paymob.com/mcp` via [`.cursor/mcp.json`](../.cursor/mcp.json) and [`.mcp.json`](../.mcp.json). Credentials stay in-session (`set_api_credentials`); HMAC webhook remains the only paid signal.
- Paymob sandbox Secret/Public/HMAC/API keys plus this merchant’s test card Integration ID `5853667` in gitignored `.env.local` and Vercel (Production/Preview/Development). Values are not in git.
- Supabase agent skills under `.agents/skills/` (`npx skills add supabase/agent-skills`).
- Escrowd product surface from the teammate storefront (paper/ink/clay chrome) with this repo’s payment model: one `orders` table, live brief price, `/o/[token]`, Nour dashboard, deposit then balance. HMAC in `src/lib/paymob.ts` is unchanged. Did **not** port Scope Guard, lead score, AI quotes, or change-order payments.
- `supabase/migrations/0002_escrowd_orders.sql` is the canonical create (including `paymob_{kind}_reference`). Hosted project needed `0003` because a prior `escrowd_orders` migration left the Scope Guard column set in place.

### Changed

- Public `/sign-up` redirects to `/sign-in`. Nour already has an account.

### Planned

- Register `https://cursor-paymob-buildathon-five.vercel.app/api/paymob/webhook` on card **and** wallet integrations.

### Not planned (today)

- Scope Guard, AI pricing, lead score, change-order payments, chat, client accounts, fake Paymob UI.

## 2026-08-15

### Added

- Canonical product spec: Escrowd (escrow for illustration commissions). Deposit starts work; balance unlocks the file. See [`plan.md`](plan.md).
- Architecture: trust boundaries, status machine, Paymob correlation, target HTTP surface. See [`Architecture.md`](Architecture.md).
- Cursor rules for product lock, schema/status, Paymob, pricing, and docs-sync (`.cursor/rules/`).
- Agent files: `AGENTS.md` (canonical), `CLAUDE.md`, `cursor.md`, `grok.md` — same product lock; docs update in the same turn as code.
- `.gitignore` for `node_modules`, Next output, and env files.

### Changed

- `README.md` documents Escrowd instead of a one-line repo title.
- `docs/plan.md` replaces the Scope Guard / AI-pricing draft. Second payment is the **balance**, not a change order.
- `docs/problem_to_solve_and_build.md` is an origin note pointing at `plan.md` (HMAC is never skipped).
- App name in metadata and i18n strings is Escrowd.

### Paymob starter (in tree, not yet the product)

- Next.js 16, Tailwind 4, TypeScript, next-intl (Arabic default, real RTL).
- `src/lib/paymob.ts`: Intention API, Unified Checkout URL, SHA-512 HMAC, `billing_data` `"NA"` defaults, piastres helpers.
- HMAC tests (`src/lib/paymob.test.ts`).
- Demo `orders` table (`user_id`, `amount`, `pending | paid | failed`) and RLS (select-own; writes via service role).
- `POST /api/checkout` (signed-in demo; still trusts client `amountEgp`).
- `POST /api/paymob/webhook` (HMAC-verified; marks demo orders `paid`).
- Locale-prefixed landing, sign-in/up, dashboard, 100 EGP `/demo`, checkout success/failure.

### Removed

- Contradictory Scope Guard stream prompts from `plan.md` (kept only as a “not today” appendix).
