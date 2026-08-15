# Changelog

All notable changes to Escrowd. Dates are the day of the Cursor x Paymob Cairo Buildathon unless noted.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/). Versioning is informal until we ship a tagged release.

## Unreleased

### Fixed

- Remove `@next/swc-darwin-arm64` from `package.json`. It is a Mac-only optional binary; listing it as a required dependency made Vercel (`linux/x64`) fail `npm install` with `EBADPLATFORM`. Next installs the correct `@next/swc-*` package for the build machine.

### Added

- `.env.example` and gitignored `.env.local` for the Escrowd Supabase project.
- `src/lib/supabase/env.ts` reads `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (falls back to `NEXT_PUBLIC_SUPABASE_ANON_KEY`). Browser, server, and `proxy.ts` session refresh all use it.
- Supabase agent skills under `.agents/skills/` (`npx skills add supabase/agent-skills`).

### Planned

- Replace the demo `orders` table with the Escrowd schema (`token`, frozen `brief`, deposit/balance amounts and Paymob ids).
- Public brief with live price; create the row as `awaiting_deposit` before checkout.
- `POST /api/checkout` with `{ token, kind }` and server-side price (stop trusting `amountEgp`).
- Webhook distinguishes `deposit` vs `balance`; `/o/[token]` polls after redirect.
- Nour dashboard: one-step status advance, preview + final upload; hide `final_url` until `balance_paid_at`.
- Register the webhook on card **and** wallet integrations; Transaction Inquiry fallback if HMAC or the callback is slow.

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
