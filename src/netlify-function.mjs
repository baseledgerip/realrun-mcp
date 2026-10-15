// Remote MCP endpoint (Streamable HTTP, stateless) on Netlify Functions: /mcp
import { createServer, WebStandardStreamableHTTPServerTransport } from "./http.mjs";

const CORS = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Accept, Mcp-Session-Id, Mcp-Protocol-Version, Authorization",
  "Access-Control-Expose-Headers": "Mcp-Session-Id" };

export default async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: CORS });
  if (req.method === "GET" && !(req.headers.get("accept") || "").includes("text/event-stream"))
    return new Response(JSON.stringify({ name: "realrun", transport: "streamable-http", endpoint: "/mcp",
      docs: "https://realrun.baseledgerip.com/llms.txt" }), { headers: { "Content-Type": "application/json", ...CORS } });
  if (req.method !== "POST") return new Response(JSON.stringify({ jsonrpc: "2.0", error: { code: -32000, message: "Method not allowed (stateless server: use POST)" }, id: null }), { status: 405, headers: { "Content-Type": "application/json", ...CORS } });
  const server = createServer({ transport: "http", caller: req.headers.get("x-nf-client-connection-ip") });
  const transport = new WebStandardStreamableHTTPServerTransport({ sessionIdGenerator: undefined, enableJsonResponse: true });
  await server.connect(transport);
  const res = await transport.handleRequest(req);
  const h = new Headers(res.headers); for (const [k, v] of Object.entries(CORS)) h.set(k, v);
  return new Response(res.body, { status: res.status, headers: h });
};
export const config = { path: "/mcp" };
