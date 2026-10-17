# Installing the RealRun MCP server (for AI agents such as Cline)

RealRun is a **remote** MCP server. There is nothing to download, build or install, and no API key.

- Endpoint: `https://realrun.baseledgerip.com/mcp`
- Transport: Streamable HTTP
- Auth: none (free, read-only)

## Cline

Add this entry under `mcpServers` in Cline's MCP settings file (`cline_mcp_settings.json`; in the extension: MCP Servers icon > Configure > Configure MCP Servers; CLI: `~/.cline/data/settings/cline_mcp_settings.json`):

```json
{
  "mcpServers": {
    "realrun": {
      "type": "streamableHttp",
      "url": "https://realrun.baseledgerip.com/mcp",
      "disabled": false,
      "autoApprove": []
    }
  }
}
```

Important: keep `"type": "streamableHttp"`. If `type` is left out, Cline uses the legacy SSE transport, and this server will refuse the connection (HTTP 405).

Or use the UI: MCP Servers > Remote Servers, name `realrun`, URL `https://realrun.baseledgerip.com/mcp`, transport **Streamable HTTP**, then Add Server.

## Check it works

After saving, the server should show as connected with 4 tools: `list_tasks`, `get_scores`, `recommend_model`, `get_warnings`. A good first call is `list_tasks` (no arguments). Example: `recommend_model` with `{"task": "meeting-scheduling", "priority": "accuracy"}`.

Task ids: `inbox-triage`, `meeting-scheduling`, `receipts`, `finance`, `support-replies`.

## Other clients

- Claude Code: `claude mcp add --transport http realrun https://realrun.baseledgerip.com/mcp`
- Clients that accept a plain URL config: `{ "mcpServers": { "realrun": { "url": "https://realrun.baseledgerip.com/mcp" } } }` (the client must use Streamable HTTP, not SSE)
