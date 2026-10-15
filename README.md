# RealRun MCP server

Read-only lookups over [RealRun](https://realrun.baseledgerip.com)'s published, independent tests of AI models on everyday tasks (inbox triage, meeting scheduling, receipts). It lets an agent ask "which model should I use for task X?" and get scores and safety warnings back.

## Connect (remote, no install)

Streamable HTTP endpoint: `https://realrun.baseledgerip.com/mcp`

```json
{ "mcpServers": { "realrun": { "url": "https://realrun.baseledgerip.com/mcp" } } }
```

Claude Code: `claude mcp add --transport http realrun https://realrun.baseledgerip.com/mcp`

## Run locally (stdio)

```
npx -y realrun-mcp
```
(once published to npm; from a checkout: `npm install && node src/stdio.mjs`)

## Tools

| Tool | Input | Returns |
|---|---|---|
| `list_tasks` | none | Tested tasks, item counts, dates, results pages, playbook prices |
| `get_scores` | `task` | Every model's headline score (best first), cost tier, metric definition |
| `recommend_model` | `task`, `priority` (`accuracy`/`cost`/`balanced`), `include_subscription` | One pick + 2 alternatives; never picks a model flagged not recommended |
| `get_warnings` | `task` | Not-recommended and caution flags (scam failures, invented data, inconsistency) |

Task ids: `inbox-triage`, `meeting-scheduling`, `receipts`.

All tools are read-only. The server stores nothing and has no auth. It is stateless, with JSON responses.

## Data

`src/data.json` holds only the published headline numbers. Full prompts and item-level results are in the paid playbooks ($29 each, links in `list_tasks`). Scores reflect our tests on the dates shown, not a guarantee.

## Billing (not active)

Every call passes through `src/metering.mjs`. The plan is a free allowance of about 20 lookups a day, then per-call billing via Stripe or x402. It is **off**: nobody is charged, and no payment objects exist.

## Test

`npm test` runs stdio end to end. `node test/smoke.mjs https://realrun.baseledgerip.com/mcp` tests the remote endpoint.

## Layout

- `src/server.mjs`: tools
- `src/stdio.mjs`: CLI
- `src/http.mjs`: exports for the HTTP function
- `../netlify/functions/mcp.mjs`: Netlify Function at `/mcp`
- `server.json`: official MCP registry metadata

License: MIT. © Base Ledger IP LLC.
