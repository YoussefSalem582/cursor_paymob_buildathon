# Changelog

All notable changes to Escrowd. Dates are the day of the Cursor x Paymob Cairo Buildathon unless noted.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/). Versioning is informal until we ship a tagged release.

## Unreleased

### Fixed

- Remove `@next/swc-darwin-arm64` from `package.json`. It is a Mac-only optional binary; listing it as a required dependency made Vercel (`linux/x64`) fail `npm install` with `EBADPLATFORM`. Next installs the correct `@next/swc-*` package for the build machine.
- Stop 500 Internal Server Error on Vercel when Supabase env vars are unset (`.env.local` is not deployed). `proxy.ts` and the header skip session refresh instead of throwing. Add a root `src/app/layout.tsx` so a missed locale rewrite cannot crash `/`.

### Added

- `.env.example` and gitignored `.env.local` for the Escrowd Supabase project.
- `src/lib/supabase/env.ts` reads `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (falls back to `NEXT_PUBLIC_SUPABASE_ANON_KEY`). Browser, server, and `proxy.ts` session refresh all use it.
- Admin client prefers `SUPABASE_SECRET_KEY` (`sb_secret_…`) and still accepts legacy `SUPABASE_SERVICE_ROLE_KEY`.
- Official Paymob AI agent skill under `.cursor/skills/paymob-integration/` (and `.agents/skills/paymob-integration/` plus Cursor commands `/paymob-test-cards`, `/paymob-explain-error`, `/paymob-check-hmac`). Source: [PaymobAccept/Paymob-AI-Integration-Skill](https://github.com/PaymobAccept/Paymob-AI-Integration-Skill).
- Transaction Inquiry client in `src/lib/paymob.ts` and `POST /api/paymob/inquiry` (API Key → auth token → lookup). Shared persist is `src/lib/apply-paymob-transaction.ts` (deposit/balance columns, not the demo `paid` status).
- Official Paymob MCP at `https://mcp.paymob.com/mcp` via [`.cursor/mcp.json`](../.cursor/mcp.json) and [`.mcp.json`](../.mcp.json). Credentials stay in-session (`set_api_credentials`); HMAC webhook remains the only paid signal.
- Paymob sandbox Secret/Public/HMAC/API keys plus card Integration ID `5240449` in gitignored `.env.local` and Vercel (Production/Preview/Development). Values are not in git.
- Supabase agent skills under `.agents/skills/` (`npx skills add supabase/agent-skills`).
- Escrowd product surface from the teammate storefront (paper/ink/clay chrome) with this repo’s payment model: one `orders` table, live brief price, `/o/[token]`, Nour dashboard, deposit then balance. HMAC in `src/lib/paymob.ts` is unchanged. Did **not** port Scope Guard, lead score, AI quotes, or change-order payments.
- `supabase/migrations/0002_escrowd_orders.sql` applied on the hosted project (replaces the demo `user_id` / `pending|paid|failed` table). Storage bucket `deliveries` for preview + final.

### Planned

- Register the webhook on card **and** wallet integrations.

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
