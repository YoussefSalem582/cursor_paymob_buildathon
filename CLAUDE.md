@AGENTS.md

# Escrowd — Claude Code

Product: **Escrowd** (escrow for illustration commissions). Deposit starts work; balance unlocks the file. Do not build Scope Guard or AI pricing.

Read in this order: [`AGENTS.md`](AGENTS.md) (below the Next.js block) → [`docs/plan.md`](docs/plan.md) → [`docs/Architecture.md`](docs/Architecture.md). Official Paymob skill: [`.agents/skills/paymob-integration/SKILL.md`](.agents/skills/paymob-integration/SKILL.md). MCP: [`.mcp.json`](.mcp.json) (`https://mcp.paymob.com/mcp`, not the paid signal). History: [`docs/changelog.md`](docs/changelog.md). Cursor rules: [`.cursor/rules/`](.cursor/rules/).

## Always update docs

Same turn as the code. Do not leave `docs/` stale.

- Spec / status machine / streams → `docs/plan.md`
- System shape / API / trust → `docs/Architecture.md`
- Every user- or agent-visible change → `docs/changelog.md` (Unreleased)
- Setup / env → `README.md`
- Agent instructions → `AGENTS.md`, `CLAUDE.md`, `cursor.md`, `grok.md` together (no one-file drift)
- Non-negotiables → `.cursor/rules/*.mdc`

Reuse `src/lib/paymob.ts`. Never fake checkout. Never mark paid from a redirect. Clients have no login.
