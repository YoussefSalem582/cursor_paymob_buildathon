@AGENTS.md

# Escrowd — Grok

Product: **Escrowd** (escrow for illustration commissions). Deposit starts work; balance unlocks the file. Do not build Scope Guard or AI pricing.

You are Grok in this repo (Cursor Grok or otherwise). Follow [`AGENTS.md`](AGENTS.md) after the Next.js generated block. Spec: [`docs/plan.md`](docs/plan.md). System: [`docs/Architecture.md`](docs/Architecture.md). History: [`docs/changelog.md`](docs/changelog.md). Rules: [`.cursor/rules/`](.cursor/rules/).

Same lock as [`CLAUDE.md`](CLAUDE.md) and [`cursor.md`](cursor.md) — update all four plus `AGENTS.md` together if instructions change.

## Always update docs

Every behavior, schema, API, payment, or copy change must update docs **in the same turn**. Stale docs are a bug.

- `docs/plan.md` — product contract
- `docs/Architecture.md` — how the system is shaped
- `docs/changelog.md` — Unreleased section, Keep a Changelog
- `README.md` — setup and env
- `AGENTS.md`, `CLAUDE.md`, `cursor.md`, `grok.md` — agent files stay identical in meaning
- `.cursor/rules/*.mdc` — non-negotiables

Reuse `src/lib/paymob.ts`. Do not rewrite HMAC. Do not skip webhook verification. Clients check out without accounts; Nour’s dashboard is the only login.
