@AGENTS.md

# Escrowd — Cursor

Product: **Escrowd** (escrow for illustration commissions). Deposit starts work; balance unlocks the file. Do not build Scope Guard or AI pricing.

This file is for Cursor agents (including Composer). Canonical agent text is [`AGENTS.md`](AGENTS.md) **below** the Next.js `BEGIN`/`END` block — do not delete that block; `next dev` will put it back.

Then read [`docs/plan.md`](docs/plan.md), [`docs/Architecture.md`](docs/Architecture.md), and [`.cursor/rules/`](.cursor/rules/) (`escrowd.mdc`, `schema-status.mdc`, `paymob.mdc`, `pricing.mdc`, `docs-sync.mdc`). Official Paymob skill: [`.agents/skills/paymob-integration/SKILL.md`](.agents/skills/paymob-integration/SKILL.md). MCP: [`.cursor/mcp.json`](.cursor/mcp.json) (`https://mcp.paymob.com/mcp`, not the paid signal). Commands in [`.cursor/commands/`](.cursor/commands/). Changelog: [`docs/changelog.md`](docs/changelog.md).

Keep [`CLAUDE.md`](CLAUDE.md) and [`grok.md`](grok.md) in lockstep with this file when agent instructions change.

## Always update docs

Docs ship in the same turn as the code. If the change would make a doc lie, fix the doc before you stop.

| Change | Doc |
| --- | --- |
| Product contract | `docs/plan.md` |
| Architecture / HTTP / schema | `docs/Architecture.md` |
| Anything notable | `docs/changelog.md` → Unreleased |
| How to run | `README.md` |
| Agent behavior | `AGENTS.md` + `CLAUDE.md` + `cursor.md` + `grok.md` |
| Hard rules | `.cursor/rules/*.mdc` |

Reuse `src/lib/paymob.ts`. Never fake Paymob UI. Webhook is the only paid signal. Browser never chooses the Intention amount.
