// RealRun MCP server: read-only lookups over RealRun's published AI test results.
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import data from "./data.json" with { type: "json" };
import { meter } from "./metering.mjs";

export const VERSION = "0.1.0";
const TASK_IDS = data.tasks.map((t) => t.id);
const COST_RANK = { low: 0, medium: 1, subscription: 1, high: 3 };

function findTask(id) {
  const t = data.tasks.find((x) => x.id === id);
  if (!t) throw new Error(`Unknown task '${id}'. Use one of: ${TASK_IDS.join(", ")}`);
  return t;
}
const out = (obj) => ({ content: [{ type: "text", text: JSON.stringify(obj, null, 2) }], structuredContent: obj });

export function recommend(task, priority = "balanced", includeSubscription = true) {
  const t = findTask(task);
  const bad = new Set(t.warnings.filter((w) => w.level === "not_recommended").map((w) => w.model));
  const caution = new Set(t.warnings.filter((w) => w.level === "caution").map((w) => w.model));
  let pool = t.scores.filter((s) => !bad.has(s.model) && (includeSubscription || s.cost_tier !== "subscription"));
  const key = {
    accuracy: (s) => s.headline - (caution.has(s.model) ? 0.5 : 0),
    cost: (s) => -COST_RANK[s.cost_tier] * 100 + s.headline - (caution.has(s.model) ? 150 : 0),
    balanced: (s) => s.headline - COST_RANK[s.cost_tier] * 1.5 - (caution.has(s.model) ? 3 : 0),
  }[priority];
  pool = [...pool].sort((a, b) => key(b) - key(a));
  return {
    task: t.id, priority, include_subscription: includeSubscription,
    recommendation: pool[0] ?? null,
    alternatives: pool.slice(1, 3),
    excluded_not_recommended: [...bad],
    cautions: t.warnings.filter((w) => w.level === "caution" && pool.slice(0, 3).some((p) => p.model === w.model)),
    method: "Excludes not-recommended models; ranks by headline score with cost-tier and caution adjustments. Heuristic over published scores, not a guarantee.",
    results_url: t.results_url, playbook: t.playbook, source: data.source, updated: data.updated,
  };
}

export function createServer(ctx = {}) {
  const server = new McpServer({ name: "realrun", version: VERSION });
  const guard = async (tool, fn) => {
    const m = await meter({ tool, ...ctx });
    if (!m.allowed) return { isError: true, content: [{ type: "text", text: m.message }] };
    return fn();
  };
  const ro = { readOnlyHint: true, openWorldHint: false };
  const taskArg = z.enum(TASK_IDS).describe("Task id, e.g. 'receipts'. See list_tasks.");

  server.registerTool("list_tasks", {
    title: "List tested tasks",
    description: "List the everyday tasks RealRun has tested AI models on, with item counts, test dates, results pages and playbook prices.",
    inputSchema: {}, annotations: ro,
  }, () => guard("list_tasks", () => out({
    source: data.source, updated: data.updated,
    tasks: data.tasks.map(({ id, name, tested, items, items_detail, models, graded_answers, results_url, playbook }) =>
      ({ id, name, tested, items, items_detail, models, graded_answers, results_url, playbook })),
  })));

  server.registerTool("get_scores", {
    title: "Get model scores for a task",
    description: "Headline scores for every model RealRun tested on a task, best first, with cost tier and the metric definition.",
    inputSchema: { task: taskArg }, annotations: ro,
  }, ({ task }) => guard("get_scores", () => {
    const t = findTask(task);
    return out({ task: t.id, name: t.name, headline_metric: t.headline_metric, items: t.items_detail, passes: t.passes,
      scores: t.scores, notes: t.notes ?? [], note: data.note, results_url: t.results_url, updated: data.updated });
  }));

  server.registerTool("recommend_model", {
    title: "Recommend a model for a task",
    description: "Recommend which AI model to use for a task given a priority: 'accuracy', 'cost' or 'balanced'. Never recommends models RealRun flagged as not recommended.",
    inputSchema: {
      task: taskArg,
      priority: z.enum(["accuracy", "cost", "balanced"]).default("balanced").describe("What matters most."),
      include_subscription: z.boolean().default(true).describe("Include Claude models (tested on a subscription, no metered cost)."),
    }, annotations: ro,
  }, ({ task, priority, include_subscription }) => guard("recommend_model", () => out(recommend(task, priority, include_subscription))));

  server.registerTool("get_warnings", {
    title: "Get safety warnings for a task",
    description: "Models RealRun flagged as not recommended or needing caution on a task (scam failures, invented data, inconsistency).",
    inputSchema: { task: taskArg }, annotations: ro,
  }, ({ task }) => guard("get_warnings", () => {
    const t = findTask(task);
    return out({ task: t.id, warnings: t.warnings, results_url: t.results_url, updated: data.updated });
  }));

  return server;
}
