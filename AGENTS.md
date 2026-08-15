<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Escrowd

Canonical spec: [`docs/plan.md`](docs/plan.md). Architecture: [`docs/Architecture.md`](docs/Architecture.md). Changelog: [`docs/changelog.md`](docs/changelog.md). Human README: [`README.md`](README.md). Cursor rules: [`.cursor/rules/`](.cursor/rules/).

Same product lock for every agent file: [`CLAUDE.md`](CLAUDE.md), [`cursor.md`](cursor.md), [`grok.md`](grok.md). Do not let those files drift from this one.

You are building **Escrowd** (escrow for illustration commissions) for the Cursor x Paymob Cairo Buildathon — not the leftover 100 EGP demo, not Scope Guard.

Nour (illustrator) puts one link in her Instagram bio. Client fills a brief, pays a **deposit**, gets `/o/[token]`. Nour works from a dashboard. Client pays the **balance**; only then is `final_url` returned. One mechanism, five problems.

## Always update docs

Docs are part of the change, not a follow-up. In the **same turn** as any behavior, schema, API, payment, copy, or scope change, update every file that would otherwise lie:

| If you changed | Also update |
| --- | --- |
| Product scope, status machine, streams, kill switches | `docs/plan.md` |
| Trust boundaries, tables, HTTP surface, code map | `docs/Architecture.md` |
| Anything user- or agent-visible | `docs/changelog.md` (Unreleased, Keep a Changelog) |
| Setup, env, how to run | `README.md` |
| Agent rules | `AGENTS.md`, `CLAUDE.md`, `cursor.md`, `grok.md` together |
| Non-negotiables | `.cursor/rules/*.mdc` |

Do not ship a feature with stale docs. Do not add a table or route that exists only in code. If you are unsure which doc, update the changelog at minimum and the spec if the contract changed.

## Do not build

AI pricing, Scope Guard, lead score, change-order payments, chat, client accounts, fake/simulated Paymob UI, subscriptions, a second `orders` product table, rewriting HMAC in `src/lib/paymob.ts`.

If the event challenge is not 03: keep two-payment + webhook + secret status page; swap the form, not the payment model.

## Stack

Next.js App Router, TypeScript, Supabase, next-intl (Arabic default, real RTL), Vercel. Reuse `src/lib/paymob.ts`. Clients check out **without** login. Auth is Nour’s dashboard only.

## Schema (one table)

`orders`: `id`, `token` (12-char nanoid, unique), `client_name/email/phone`, `brief` jsonb, `price_total/deposit/balance` (integer piastres), `status`, `deposit_paid_at`, `balance_paid_at`, `paymob_{deposit,balance}_{order,transaction}_id`, `preview_url`, `final_url`.

Create the row as `awaiting_deposit` **before** Intention. No `clients` / `payments` / `change_orders` tables.

## Status machine

```
awaiting_deposit --webhook deposit--> in_progress
in_progress --Nour + preview_url--> ready_for_review
ready_for_review --Nour + final_url--> awaiting_balance
awaiting_balance --webhook balance--> delivered
```

Nour PATCH may only walk `in_progress → ready_for_review → awaiting_balance`. Dashboard must not write `*_paid_at` or set `in_progress` / `delivered`. Webhook is the only paid signal. Redirect query params are not. Idempotent: if the matching `*_paid_at` is set, 200 and stop. `GET` by token omits `final_url` unless `balance_paid_at` is set.

## Paymob

- Intention: `POST https://accept.paymob.com/v1/intention/`, header `Authorization: Token <PAYMOB_SECRET_KEY>`
- Amount from the **server** pricing function, integer piastres, `sum(items) === amount`
- `special_reference` = `{token}:{kind}:{attemptId}` (`deposit` | `balance`), plus `extras: { token, kind, attemptId }`
- New Intention every pay click (`client_secret` is single-use)
- Checkout `kind=deposit` only from `awaiting_deposit`; `kind=balance` only from `awaiting_balance`
- Webhook: `verifyTransactionHmac` **before** UPDATE. Never skip HMAC. Fallback is Transaction Inquiry, not trusting the payload
- Register `/api/paymob/webhook` on card **and** wallet integrations; `/o/[token]` polls after redirect

## Official Paymob agent skill (v3.3.0)

Installed from https://github.com/PaymobAccept/Paymob-AI-Integration-Skill (docs: https://developers.paymob.com/paymob-docs/ai-solutions/ai-agent-skill).

- Skill: [`.agents/skills/paymob-integration/SKILL.md`](.agents/skills/paymob-integration/SKILL.md) and `references/`
- Release ZIP: [`.agents/paymob-integration.zip`](.agents/paymob-integration.zip)
- Cursor commands: `.cursor/commands/paymob-test-cards.md`, `paymob-explain-error.md`, `paymob-check-hmac.md`
- Live MCP: `https://mcp.paymob.com/mcp` in [`.cursor/mcp.json`](.cursor/mcp.json) and [`.mcp.json`](.mcp.json). In-session credentials via `set_api_credentials` (test keys first). Does **not** replace the HMAC webhook; never mark `*_paid_at` from MCP results.

Authority: live Paymob docs win on field names; the skill wins on workflow; Escrowd `docs/plan.md` wins on deposit/balance product rules. Intention API only. HMAC SHA-512. Amounts in piastres. `Authorization: Token {secret_key}`.

## Pricing

One shared function (see `.cursor/rules/pricing.mdc`). Browser must not send the amount Paymob charges. `deposit = round(totalPiastres / 2)`, `balance = total - deposit`.

## Kill switches

2:30 no verified checkout → stop product work until one test-card payment flips a row. 4:00 no balance path → one payment of `price_total`, still webhook-only.

## Next.js block above

Keep the `BEGIN:nextjs-agent-rules` block at the top of this file. `next dev` re-adds it if you delete it. Put Escrowd instructions **below** the `END` marker.
