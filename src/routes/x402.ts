/**
 * x402-paid API endpoints — agent economy revenue channel.
 *
 * Endpoints:
 *   GET /v1/cloud/{provider}/limits   — $0.005/call
 *   GET /v1/ai/{provider}/limits      — $0.005/call
 *   GET /v1/limits/{provider}         — $0.005/call (any category)
 *   GET /v1/compare?providers=a,b,c   — $0.01/call (multi-provider)
 *   GET /v1/providers                 — free, lists available providers
 *
 * AI agents discover via x402 Bazaar. Humans can also use with
 * Coinbase wallet or any x402-compatible client.
 */
import type { X402Env } from "../lib/x402";
import { x402Gate } from "../lib/x402";
import { LIMITS, BY_PROVIDER, PROVIDERS, type FreeTierLimit } from "../data/limits";

const PRICE_SINGLE = 0.005;
const PRICE_COMPARE = 0.01;

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body, null, 2), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" },
  });
}

/**
 * GET /v1/providers — free, no payment required.
 * Lists all providers we have curated data for, by category.
 */
export async function handleProviders(_req: Request, _env: X402Env): Promise<Response> {
  const byCat: Record<string, string[]> = {};
  for (const lim of LIMITS) {
    if (!byCat[lim.category]) byCat[lim.category] = [];
    if (!byCat[lim.category].includes(lim.provider)) byCat[lim.category].push(lim.provider);
  }
  return jsonResponse({
    providers: PROVIDERS,
    by_category: byCat,
    total_records: LIMITS.length,
    pricing: {
      single_lookup: `$${PRICE_SINGLE} USDC`,
      compare: `$${PRICE_COMPARE} USDC`,
      currency: "USDC on Base",
      protocol: "x402 v1",
    },
    docs: "https://freetier-sentinel.dev/docs/api",
  });
}

function findByProvider(provider: string, category?: string): FreeTierLimit[] {
  const rows = BY_PROVIDER[provider.toLowerCase()] || [];
  if (category) return rows.filter((r) => r.category === category);
  return rows;
}

/**
 * GET /v1/limits/:provider — paid lookup of all limits for a provider.
 */
export async function handleProviderLimits(req: Request, env: X402Env, provider: string): Promise<Response> {
  const rows = findByProvider(provider);
  if (rows.length === 0) {
    return jsonResponse(
      { error: "unknown_provider", provider, available: PROVIDERS },
      404,
    );
  }

  const gate = await x402Gate(req, env, {
    priceUsd: PRICE_SINGLE,
    description: `FreeTier Sentinel: limits for ${provider}`,
  });
  if (gate.response) return gate.response;

  // After verify, return data + fire settle in background
  const body = jsonResponse({
    provider,
    limits: rows,
    count: rows.length,
    schema_version: 1,
  });
  // Settle async — don't block response. Caller's ctx.waitUntil will handle.
  // We can't access ctx here, so settle fire-and-forget via promise.
  gate.afterRespond().catch((e) => console.error("[x402] settle bg fail", e));
  return body;
}

/**
 * GET /v1/cloud/:provider/limits — paid, category-filtered to "cloud".
 */
export async function handleCloudLimits(req: Request, env: X402Env, provider: string): Promise<Response> {
  const rows = findByProvider(provider, "cloud").concat(findByProvider(provider, "ci"));
  if (rows.length === 0) {
    return jsonResponse(
      { error: "no_cloud_data", provider, hint: "Try /v1/limits/" + provider },
      404,
    );
  }

  const gate = await x402Gate(req, env, {
    priceUsd: PRICE_SINGLE,
    description: `FreeTier Sentinel: cloud limits for ${provider}`,
  });
  if (gate.response) return gate.response;

  const body = jsonResponse({ provider, category: "cloud", limits: rows, count: rows.length });
  gate.afterRespond().catch((e) => console.error("[x402] settle bg fail", e));
  return body;
}

/**
 * GET /v1/ai/:provider/limits — paid, category-filtered to "ai".
 */
export async function handleAiLimits(req: Request, env: X402Env, provider: string): Promise<Response> {
  const rows = findByProvider(provider, "ai");
  if (rows.length === 0) {
    return jsonResponse(
      { error: "no_ai_data", provider, hint: "Try /v1/limits/" + provider },
      404,
    );
  }

  const gate = await x402Gate(req, env, {
    priceUsd: PRICE_SINGLE,
    description: `FreeTier Sentinel: AI/LLM limits for ${provider}`,
  });
  if (gate.response) return gate.response;

  const body = jsonResponse({ provider, category: "ai", limits: rows, count: rows.length });
  gate.afterRespond().catch((e) => console.error("[x402] settle bg fail", e));
  return body;
}

/**
 * GET /v1/compare?providers=a,b,c[&category=ai] — paid multi-provider compare.
 */
export async function handleCompare(req: Request, env: X402Env): Promise<Response> {
  const url = new URL(req.url);
  const raw = url.searchParams.get("providers") || "";
  const category = url.searchParams.get("category") || undefined;
  const providers = raw.split(",").map((s) => s.trim().toLowerCase()).filter(Boolean);

  if (providers.length < 2) {
    return jsonResponse(
      {
        error: "invalid_query",
        message: "?providers= must list at least 2 (comma-separated)",
        example: "/v1/compare?providers=cloudflare,vercel&category=cloud",
      },
      400,
    );
  }

  const gate = await x402Gate(req, env, {
    priceUsd: PRICE_COMPARE,
    description: `FreeTier Sentinel: compare ${providers.join(",")}`,
  });
  if (gate.response) return gate.response;

  const result: Record<string, FreeTierLimit[]> = {};
  for (const p of providers) {
    result[p] = findByProvider(p, category);
  }

  const body = jsonResponse({
    query: { providers, category },
    results: result,
    schema_version: 1,
  });
  gate.afterRespond().catch((e) => console.error("[x402] settle bg fail", e));
  return body;
}
