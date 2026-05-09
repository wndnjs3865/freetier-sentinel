/**
 * Public API documentation + machine-readable OpenAPI 3.1 spec.
 *
 * /docs/api          — human-readable HTML docs
 * /v1/openapi.json   — OpenAPI 3.1 spec for AI agent / SDK consumption
 */
import type { Env } from "../index";

const PRICE_SINGLE = 0.005;
const PRICE_COMPARE = 0.01;

export async function handleOpenApiSpec(_req: Request, env: Env): Promise<Response> {
  const baseUrl = env.APP_URL;
  const spec = {
    openapi: "3.1.0",
    info: {
      title: "FreeTier Sentinel API",
      version: "1.0.0",
      summary: "Curated free-tier limits for cloud, DB, AI APIs, email — paid per-call via x402 (USDC on Base).",
      description:
        "Machine-readable API for AI agents and developer tools that need accurate, " +
        "structured free-tier limit data. Paid endpoints accept x402 protocol payments " +
        "in USDC on Base. The /v1/providers endpoint is free.\n\n" +
        "Why this exists: AI agents building tooling (e.g., 'should I use Cloudflare or " +
        "Vercel for this workload?') need authoritative free-tier limit data. Scraping " +
        "is unreliable. This API is a curated, paid alternative.",
      contact: { name: "FreeTier Sentinel", url: "https://freetier-sentinel.dev" },
      license: { name: "Proprietary", url: "https://freetier-sentinel.dev/terms" },
    },
    servers: [{ url: baseUrl, description: "Production" }],
    "x-payment": {
      protocol: "x402",
      version: 1,
      network: "eip155:8453",
      networkAlias: "base",
      asset: "USDC",
      assetContract: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
      facilitator:
        (env as any).CDP_API_KEY_ID && (env as any).CDP_API_KEY_SECRET
          ? "https://api.cdp.coinbase.com/platform/v2/x402"
          : env.X402_FACILITATOR_URL || "https://x402.org/facilitator",
      bazaarIndexed: true,
    },
    paths: {
      "/v1/providers": {
        get: {
          summary: "List all providers (FREE)",
          description: "Returns providers we have curated data for, grouped by category. No payment required.",
          responses: {
            "200": {
              description: "Provider listing",
              content: { "application/json": { schema: { $ref: "#/components/schemas/ProvidersResponse" } } },
            },
          },
        },
      },
      "/v1/limits/{provider}": {
        get: {
          summary: "All free-tier limits for a provider (PAID)",
          parameters: [
            { name: "provider", in: "path", required: true, schema: { type: "string" }, description: "Provider name (e.g. cloudflare, aws, gcp)" },
          ],
          "x-x402-price": { amount: PRICE_SINGLE, currency: "USDC" },
          responses: {
            "200": { description: "All limits for the provider", content: { "application/json": { schema: { $ref: "#/components/schemas/LimitsResponse" } } } },
            "402": { description: "Payment required (see Link header for x402 details)" },
            "404": { description: "Unknown provider" },
          },
        },
      },
      "/v1/cloud/{provider}/limits": {
        get: {
          summary: "Cloud + CI limits for a provider (PAID)",
          parameters: [{ name: "provider", in: "path", required: true, schema: { type: "string" } }],
          "x-x402-price": { amount: PRICE_SINGLE, currency: "USDC" },
          responses: { "200": { description: "Cloud limits" }, "402": { description: "Payment required" }, "404": { description: "No data" } },
        },
      },
      "/v1/ai/{provider}/limits": {
        get: {
          summary: "AI/LLM API limits for a provider (PAID)",
          parameters: [{ name: "provider", in: "path", required: true, schema: { type: "string" } }],
          "x-x402-price": { amount: PRICE_SINGLE, currency: "USDC" },
          responses: { "200": { description: "AI limits" }, "402": { description: "Payment required" }, "404": { description: "No data" } },
        },
      },
      "/v1/compare": {
        get: {
          summary: "Multi-provider comparison (PAID)",
          parameters: [
            { name: "providers", in: "query", required: true, schema: { type: "string" }, description: "Comma-separated list (≥2)" },
            { name: "category", in: "query", required: false, schema: { type: "string", enum: ["cloud", "ai", "db", "email", "storage", "ci"] } },
          ],
          "x-x402-price": { amount: PRICE_COMPARE, currency: "USDC" },
          responses: { "200": { description: "Comparison" }, "402": { description: "Payment required" }, "400": { description: "Invalid query" } },
        },
      },
    },
    components: {
      schemas: {
        FreeTierLimit: {
          type: "object",
          required: ["provider", "service", "category", "metric", "limit", "unit", "period", "source_url", "as_of"],
          properties: {
            provider: { type: "string", example: "cloudflare" },
            service: { type: "string", example: "workers" },
            category: { type: "string", enum: ["cloud", "ai", "db", "email", "storage", "ci"] },
            metric: { type: "string", example: "requests" },
            limit: { oneOf: [{ type: "number" }, { type: "string" }], example: 100000 },
            unit: { type: "string", example: "requests" },
            period: { type: "string", enum: ["second", "minute", "hour", "day", "month", "lifetime"] },
            notes: { type: "string", nullable: true },
            source_url: { type: "string", format: "uri" },
            as_of: { type: "string", format: "date" },
          },
        },
        ProvidersResponse: {
          type: "object",
          properties: {
            providers: { type: "array", items: { type: "string" } },
            by_category: { type: "object" },
            total_records: { type: "integer" },
            pricing: { type: "object" },
          },
        },
        LimitsResponse: {
          type: "object",
          properties: {
            provider: { type: "string" },
            limits: { type: "array", items: { $ref: "#/components/schemas/FreeTierLimit" } },
            count: { type: "integer" },
            schema_version: { type: "integer" },
          },
        },
      },
    },
  };
  return new Response(JSON.stringify(spec, null, 2), {
    status: 200,
    headers: { "content-type": "application/json; charset=utf-8" },
  });
}

export async function handleApiDocs(_req: Request, env: Env): Promise<Response> {
  const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>FreeTier Sentinel API — Docs</title>
<meta name="description" content="x402-paid API for free-tier limits. AI agents pay per-call in USDC on Base. Curated data for Cloudflare, AWS, GCP, Azure, AI APIs and more.">
<style>
  :root { --bg:#0a0e1a; --fg:#e6e8ee; --muted:#94a3b8; --accent:#3b82f6; --code-bg:#0f172a; --border:#1e293b; }
  *{box-sizing:border-box}
  body{margin:0;background:var(--bg);color:var(--fg);font:15px/1.65 -apple-system,BlinkMacSystemFont,'Inter',system-ui,sans-serif;padding:0}
  .wrap{max-width:780px;margin:0 auto;padding:48px 24px 80px}
  h1{font-size:32px;letter-spacing:-0.02em;margin:0 0 8px}
  h2{font-size:20px;letter-spacing:-0.01em;margin:40px 0 12px;border-bottom:1px solid var(--border);padding-bottom:8px}
  h3{font-size:16px;margin:24px 0 8px;color:var(--accent);font-family:'JetBrains Mono',ui-monospace,monospace}
  p{color:var(--muted);margin:8px 0 16px}
  a{color:var(--accent);text-decoration:none}
  a:hover{text-decoration:underline}
  pre{background:var(--code-bg);border:1px solid var(--border);border-radius:8px;padding:14px 16px;overflow-x:auto;font:13px/1.5 'JetBrains Mono',ui-monospace,monospace;color:#cbd5e1}
  code{font:13px/1.5 'JetBrains Mono',ui-monospace,monospace;color:#cbd5e1;background:var(--code-bg);padding:2px 6px;border-radius:4px}
  .badge{display:inline-block;font-size:11px;padding:2px 8px;border-radius:4px;font-weight:600;font-family:'JetBrains Mono',monospace;letter-spacing:0.04em;margin-right:6px}
  .badge-free{background:#16a34a;color:#fff}
  .badge-paid{background:#3b82f6;color:#fff}
  .lede{font-size:17px;color:#cbd5e1;margin:0 0 32px}
  hr{border:0;border-top:1px solid var(--border);margin:32px 0}
  .nav{font-size:13px;color:var(--muted);margin-bottom:32px}
  .nav a{margin-right:14px}
</style>
</head>
<body>
<div class="wrap">
<div class="nav"><a href="/">← Home</a><a href="/v1/openapi.json">OpenAPI spec</a><a href="https://github.com/wndnjs3865/freetier-sentinel">GitHub</a></div>

<h1>FreeTier Sentinel API</h1>
<p class="lede">Curated free-tier limits, paid per-call by AI agents via the x402 protocol. USDC on Base. No accounts, no API keys.</p>

<h2>Quick start</h2>
<p>Free endpoint — list providers and pricing:</p>
<pre>curl ${env.APP_URL}/v1/providers</pre>

<p>Paid endpoint — call without payment, get HTTP 402 with payment requirements:</p>
<pre>curl -i ${env.APP_URL}/v1/cloud/cloudflare/limits</pre>

<p>Then a x402-compatible client (e.g. Coinbase's <code>@x402/fetch</code>) signs the USDC transfer, retries with the <code>X-PAYMENT</code> header, and gets the response.</p>

<h2>Endpoints</h2>

<h3><span class="badge badge-free">FREE</span> GET /v1/providers</h3>
<p>List all providers and categories we have data for. Use this to discover what's available before paying.</p>

<h3><span class="badge badge-paid">$0.005</span> GET /v1/limits/{provider}</h3>
<p>All limits for a provider, every category. Returns an array of structured limit records.</p>

<h3><span class="badge badge-paid">$0.005</span> GET /v1/cloud/{provider}/limits</h3>
<p>Cloud + CI limits for a provider. Filtered subset of <code>/v1/limits/{provider}</code>.</p>

<h3><span class="badge badge-paid">$0.005</span> GET /v1/ai/{provider}/limits</h3>
<p>AI/LLM API limits for a provider (Gemini, OpenAI, Groq, etc.).</p>

<h3><span class="badge badge-paid">$0.01</span> GET /v1/compare?providers=a,b,c</h3>
<p>Multi-provider comparison. Optional <code>&amp;category=cloud</code> to filter. Minimum 2 providers.</p>

<h2>Response schema</h2>
<pre>{
  "provider": "cloudflare",
  "limits": [
    {
      "provider": "cloudflare",
      "service": "workers",
      "category": "cloud",
      "metric": "requests",
      "limit": 100000,
      "unit": "requests",
      "period": "day",
      "notes": "Resets at 00:00 UTC...",
      "source_url": "https://developers.cloudflare.com/...",
      "as_of": "2026-05-06"
    }
  ],
  "count": 3,
  "schema_version": 1
}</pre>

<h2>x402 protocol</h2>
<p>This API uses <a href="https://x402.org">x402</a>, an open HTTP-based payment standard. AI agents (or anyone with a USDC wallet on Base) can pay per-call without subscriptions, accounts, or API keys.</p>
<ul>
  <li><strong>Network:</strong> Base mainnet</li>
  <li><strong>Asset:</strong> USDC (<code>0x8335...02913</code>)</li>
  <li><strong>Facilitator:</strong> <code>https://x402.org/facilitator</code></li>
  <li><strong>Spec:</strong> <a href="https://github.com/coinbase/x402">github.com/coinbase/x402</a></li>
  <li><strong>Discoverable on:</strong> x402 Bazaar (auto-indexed after first settlement)</li>
</ul>

<h2>OpenAPI spec</h2>
<p>Machine-readable spec for AI agents and SDK generation: <a href="/v1/openapi.json">/v1/openapi.json</a></p>

<h2>Updates</h2>
<p>Limit data is verified manually against provider docs. Each record has an <code>as_of</code> field. Contact <a href="mailto:support@freetier-sentinel.dev">support@freetier-sentinel.dev</a> if you find a stale entry.</p>

<hr>
<p style="font-size:12px;color:var(--muted)">Built solo by a Korean indie dev. <a href="https://freetier-sentinel.dev">freetier-sentinel.dev</a> · <a href="https://github.com/wndnjs3865/freetier-sentinel">Source</a></p>
</div>
</body>
</html>`;
  return new Response(html, {
    status: 200,
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}
