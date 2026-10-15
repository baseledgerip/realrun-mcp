// Billing hook (DISABLED). Every tool call passes through meter().
// Plan for later: free allowance of FREE_DAILY_LOOKUPS per caller per day, then per-call
// billing (Stripe metered usage or x402 HTTP-402 payment) above it. Nothing is charged today.
// To enable: set REALRUN_BILLING=on and implement a durable counter (e.g. Netlify Blobs)
// keyed by API key or client IP, then return { allowed:false, message } with payment info.
export const FREE_DAILY_LOOKUPS = 20;
export async function meter({ tool, caller } = {}) {
  if ((globalThis.process?.env?.REALRUN_BILLING ?? "off") !== "on") return { allowed: true, billed: false };
  return { allowed: true, billed: false, note: "billing not implemented" };
}
