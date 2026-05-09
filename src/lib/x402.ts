/**
 * x402 — HTTP 402 Payment Required protocol middleware.
 *
 * Spec: https://github.com/coinbase/x402/blob/main/specs/x402-spec.md
 *
 * Flow:
 *   1. Client GETs /v1/... without X-PAYMENT header
 *   2. Worker returns 402 + accepts[] payment requirements
 *   3. Client signs USDC transfer on Base, base64-encodes it, retries with X-PAYMENT
 *   4. Worker calls Facilitator /verify → if valid, processes request
 *   5. After response, Worker calls Facilitator /settle (async, fire-and-forget)
 *
 * Facilitator routing:
 *   - If CDP_API_KEY_ID + CDP_API_KEY_SECRET are set → use CDP Facilitator
 *     (api.cdp.coinbase.com/platform/v2/x402, Bearer JWT auth, Bazaar
 *     auto-indexing, KYT/AML compliance, fixed Base race condition)
 *   - Else → fall back to public facilitator at X402_FACILITATOR_URL
 *     (https://x402.org/facilitator, no auth, no Bazaar)
 *
 * The CDP path is the production default as of 2026-05-06.
 */
import type { Env } from "../index";
import { cdpFetch } from "./cdp-auth";
import { recordMetric, ensureMetricTables } from "./metrics";

// USDC contract addresses (6 decimals)
export const USDC_BASE_MAINNET = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";
export const USDC_BASE_SEPOLIA = "0x036CbD53842c5426634e7929541eC2318f3dCF7e";

export interface X402EnvExtras {
  X402_FACILITATOR_URL?: string;   // public fallback (default: https://x402.org/facilitator)
  X402_RECEIVING_ADDRESS?: string; // user's Base wallet (set via wrangler secret put)
  X402_NETWORK?: string;           // "base" | "base-sepolia" (default: base)
  X402_USDC_ADDRESS?: string;      // override default USDC contract
  // CDP Facilitator (production path — preferred when set)
  CDP_API_KEY_ID?: string;
  CDP_API_KEY_SECRET?: string;     // base64 Ed25519 secret (64 bytes encoded)
  CDP_FACILITATOR_URL?: string;    // default: https://api.cdp.coinbase.com/platform/v2/x402
}

export type X402Env = Env & X402EnvExtras;

export interface PaymentRequirement {
  scheme: "exact";
  network: string;
  maxAmountRequired: string;    // smallest unit (USDC has 6 decimals)
  resource: string;             // URL agent is paying for
  description: string;
  mimeType: string;
  payTo: string;                // receiving address
  maxTimeoutSeconds: number;
  asset: string;                // USDC contract address
  outputSchema?: unknown;
  extra?: unknown;
}

export interface X402Response402 {
  x402Version: 1;
  error: string;
  accepts: PaymentRequirement[];
}

/**
 * Convert dollar amount (e.g. "0.005") to USDC base units string.
 * USDC has 6 decimals. $0.005 → "5000".
 */
export function usdToUsdcUnits(usd: number): string {
  return Math.round(usd * 1_000_000).toString();
}

/**
 * CAIP-2 network identifiers (CDP requires these; modern x402 v2 clients accept).
 */
const NETWORK_TO_CAIP2: Record<string, string> = {
  base: "eip155:8453",
  "base-sepolia": "eip155:84532",
  "eip155:8453": "eip155:8453",
  "eip155:84532": "eip155:84532",
};

function getNetwork(env: X402Env): { network: string; usdc: string } {
  const raw = env.X402_NETWORK || "base";
  const network = NETWORK_TO_CAIP2[raw] || raw;
  const usdc =
    env.X402_USDC_ADDRESS ||
    (network === "eip155:84532" ? USDC_BASE_SEPOLIA : USDC_BASE_MAINNET);
  return { network, usdc };
}

/**
 * Decode the X-PAYMENT header (base64-encoded JSON paymentPayload) into the
 * object CDP /verify and /settle expect under the `paymentPayload` field.
 */
function decodePaymentPayload(header: string): unknown {
  // Try base64 → JSON
  try {
    const bin = atob(header);
    const json = JSON.parse(bin);
    return json;
  } catch {
    // Some clients may send raw JSON or url-encoded base64
    try {
      return JSON.parse(header);
    } catch {
      return null;
    }
  }
}

/**
 * Convert our internal PaymentRequirement (x402 v1 shape used in the 402
 * response) into the minimal struct CDP /verify and /settle expect.
 */
function toCDPRequirements(req: PaymentRequirement): {
  scheme: string;
  network: string;
  asset: string;
  amount: string;
  payTo: string;
  maxTimeoutSeconds: number;
} {
  return {
    scheme: req.scheme,
    network: req.network,
    asset: req.asset,
    amount: req.maxAmountRequired,
    payTo: req.payTo,
    maxTimeoutSeconds: req.maxTimeoutSeconds,
  };
}

/**
 * Build a 402 response describing payment requirements.
 */
export function build402Response(
  env: X402Env,
  resourceUrl: string,
  priceUsd: number,
  description: string,
): Response {
  const { network, usdc } = getNetwork(env);
  const payTo = env.X402_RECEIVING_ADDRESS;

  if (!payTo) {
    return new Response(
      JSON.stringify({
        error: "x402_misconfigured",
        message:
          "X402_RECEIVING_ADDRESS not set. Operator must run: " +
          "npx wrangler secret put X402_RECEIVING_ADDRESS",
      }),
      { status: 503, headers: { "content-type": "application/json" } },
    );
  }

  const body: X402Response402 = {
    x402Version: 1,
    error: "X-PAYMENT header is required",
    accepts: [
      {
        scheme: "exact",
        network,
        maxAmountRequired: usdToUsdcUnits(priceUsd),
        resource: resourceUrl,
        description,
        mimeType: "application/json",
        payTo,
        maxTimeoutSeconds: 60,
        asset: usdc,
      },
    ],
  };

  return new Response(JSON.stringify(body), {
    status: 402,
    headers: {
      "content-type": "application/json",
      "x-payment-required": "1",
    },
  });
}

/**
 * Decide which facilitator path to use based on env.
 * CDP is preferred (production); public x402.org is fallback for dev/no-key.
 */
function facilitatorTarget(env: X402Env): { useCdp: boolean; url: string } {
  if (env.CDP_API_KEY_ID && env.CDP_API_KEY_SECRET) {
    return {
      useCdp: true,
      url: env.CDP_FACILITATOR_URL || "https://api.cdp.coinbase.com/platform/v2/x402",
    };
  }
  return {
    useCdp: false,
    url: env.X402_FACILITATOR_URL || "https://x402.org/facilitator",
  };
}

/**
 * Verify a submitted X-PAYMENT header against the Facilitator.
 * Returns { ok: true } if valid, { ok: false, reason } otherwise.
 */
export async function verifyPayment(
  env: X402Env,
  paymentHeader: string,
  requirement: PaymentRequirement,
): Promise<{ ok: true } | { ok: false; reason: string; status?: number }> {
  const target = facilitatorTarget(env);
  try {
    if (target.useCdp) {
      const paymentPayload = decodePaymentPayload(paymentHeader);
      if (!paymentPayload) {
        return { ok: false, reason: "invalid X-PAYMENT header (could not decode)" };
      }
      const cdpBody = JSON.stringify({
        x402Version: 1,
        paymentPayload,
        paymentRequirements: toCDPRequirements(requirement),
      });
      const json = await cdpFetch<{ isValid?: boolean; invalidReason?: string }>(
        env.CDP_API_KEY_ID!,
        env.CDP_API_KEY_SECRET!,
        `${target.url}/verify`,
        { method: "POST", body: cdpBody, headers: { "content-type": "application/json" } },
      );
      if (json.isValid) return { ok: true };
      return { ok: false, reason: json.invalidReason || "invalid payment" };
    }
    // Public facilitator fallback (older x402 v1 schema with paymentHeader string)
    const r = await fetch(`${target.url}/verify`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        x402Version: 1,
        paymentHeader,
        paymentRequirements: requirement,
      }),
    });
    if (!r.ok) {
      const text = await r.text().catch(() => "");
      return { ok: false, reason: `facilitator ${r.status}: ${text}`, status: r.status };
    }
    const json = (await r.json()) as { isValid?: boolean; invalidReason?: string };
    if (json.isValid) return { ok: true };
    return { ok: false, reason: json.invalidReason || "invalid payment" };
  } catch (e: any) {
    return { ok: false, reason: `verify error: ${e?.message || String(e)}` };
  }
}

/**
 * Settle a verified payment. Fire-and-forget after response is sent.
 *
 * On the CDP path, settlement triggers Bazaar auto-indexing — the first
 * successful settle for an endpoint catalogs the service in the discovery
 * layer.
 */
export async function settlePayment(
  env: X402Env,
  paymentHeader: string,
  requirement: PaymentRequirement,
): Promise<void> {
  const target = facilitatorTarget(env);
  try {
    if (target.useCdp) {
      const paymentPayload = decodePaymentPayload(paymentHeader);
      if (!paymentPayload) {
        console.error("[x402] settle skipped: undecodable X-PAYMENT");
        return;
      }
      const cdpBody = JSON.stringify({
        x402Version: 1,
        paymentPayload,
        paymentRequirements: toCDPRequirements(requirement),
      });
      await cdpFetch(
        env.CDP_API_KEY_ID!,
        env.CDP_API_KEY_SECRET!,
        `${target.url}/settle`,
        { method: "POST", body: cdpBody, headers: { "content-type": "application/json" } },
      );
      // Track successful settlement → revenue metric
      try {
        await ensureMetricTables(env);
        const usdcAmount = parseInt(requirement.maxAmountRequired, 10) / 1_000_000; // USDC has 6 decimals
        await recordMetric(env, "x402_revenue_usdc", usdcAmount, "x402", { resource: requirement.resource });
        await recordMetric(env, "x402_settlements", 1, "x402");
      } catch (e) { console.error("[x402] metric record failed", e); }
      return;
    }
    await fetch(`${target.url}/settle`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        x402Version: 1,
        paymentHeader,
        paymentRequirements: requirement,
      }),
    });
  } catch (e) {
    console.error("[x402] settle failed", e);
  }
}

/**
 * High-level wrapper: verify-or-402 for a route.
 *
 * Usage:
 *   const gate = await x402Gate(req, env, { priceUsd: 0.005, description: "..." });
 *   if (gate.response) return gate.response; // 402 or error
 *   // ... run handler, build response, return it
 *   gate.afterRespond(); // fire settle in waitUntil
 */
export async function x402Gate(
  req: Request,
  env: X402Env,
  opts: { priceUsd: number; description: string },
): Promise<{
  response?: Response;
  requirement?: PaymentRequirement;
  paymentHeader?: string;
  afterRespond: () => Promise<void>;
}> {
  const paymentHeader = req.headers.get("X-PAYMENT") || req.headers.get("x-payment");
  const url = new URL(req.url);
  const resourceUrl = `${url.origin}${url.pathname}${url.search}`;

  // No payment → 402
  if (!paymentHeader) {
    return {
      response: build402Response(env, resourceUrl, opts.priceUsd, opts.description),
      afterRespond: async () => {},
    };
  }

  // Build requirement to match what we'd accept
  const { network, usdc } = getNetwork(env);
  const payTo = env.X402_RECEIVING_ADDRESS;
  if (!payTo) {
    return {
      response: new Response(
        JSON.stringify({ error: "x402_misconfigured" }),
        { status: 503, headers: { "content-type": "application/json" } },
      ),
      afterRespond: async () => {},
    };
  }

  const requirement: PaymentRequirement = {
    scheme: "exact",
    network,
    maxAmountRequired: usdToUsdcUnits(opts.priceUsd),
    resource: resourceUrl,
    description: opts.description,
    mimeType: "application/json",
    payTo,
    maxTimeoutSeconds: 60,
    asset: usdc,
  };

  const verify = await verifyPayment(env, paymentHeader, requirement);
  if (!verify.ok) {
    return {
      response: new Response(
        JSON.stringify({ error: "payment_invalid", reason: verify.reason }),
        { status: 402, headers: { "content-type": "application/json" } },
      ),
      afterRespond: async () => {},
    };
  }

  return {
    requirement,
    paymentHeader,
    afterRespond: async () => {
      await settlePayment(env, paymentHeader, requirement);
    },
  };
}
