/**
 * Bazaar indexing detector — every 1 hour.
 *
 * Polls Coinbase CDP x402 Bazaar Discovery API for our endpoints. Sends
 * Telegram alert when our service first appears in the catalog.
 *
 * Once detected, KV records the fact so we don't spam alerts.
 */
import type { Env } from "../index";
import { generateCDPJWT } from "../lib/cdp-auth";
import { sendTelegram } from "../lib/notify";

const BAZAAR_DISCOVERY_URL = "https://api.cdp.coinbase.com/platform/v2/x402/discovery/resources";
const KV_KEY = "bazaar:indexed";
const POLL_QUERIES = [
  "freetier",
  "freetier-sentinel.dev",
  "free tier",
];

export async function runBazaarPoll(env: Env): Promise<{ found: boolean; matched: string[] }> {
  if (!env.CDP_API_KEY_ID || !env.CDP_API_KEY_SECRET) {
    console.log("[bazaar] CDP credentials not set — skipping");
    return { found: false, matched: [] };
  }

  const alreadyIndexed = await env.KV.get(KV_KEY);
  if (alreadyIndexed === "1") {
    // Already detected — quiet poll just to keep checking but no alerting
    return { found: true, matched: [] };
  }

  const u = new URL(BAZAAR_DISCOVERY_URL);
  const matched: string[] = [];

  try {
    const jwt = await generateCDPJWT(env.CDP_API_KEY_ID, env.CDP_API_KEY_SECRET, {
      method: "GET",
      host: u.host,
      path: u.pathname,
    });
    const r = await fetch(BAZAAR_DISCOVERY_URL, {
      headers: { authorization: `Bearer ${jwt}` },
    });
    if (!r.ok) {
      console.log("[bazaar] discovery API", r.status, (await r.text()).slice(0, 200));
      return { found: false, matched: [] };
    }
    const json = (await r.json()) as { resources?: Array<{ url?: string; name?: string; description?: string }> };
    const resources = json.resources || [];

    for (const res of resources) {
      const haystack = `${res.url || ""} ${res.name || ""} ${res.description || ""}`.toLowerCase();
      for (const q of POLL_QUERIES) {
        if (haystack.includes(q)) {
          matched.push(res.url || res.name || "(unnamed)");
          break;
        }
      }
    }
  } catch (e: any) {
    console.error("[bazaar] error", e?.message);
    return { found: false, matched: [] };
  }

  if (matched.length > 0) {
    await env.KV.put(KV_KEY, "1", { expirationTtl: 30 * 86400 });
    const msg = [
      "🎉 BAZAAR INDEXED!",
      "",
      `FreeTier Sentinel x402 endpoints now discoverable in Coinbase CDP Bazaar.`,
      "",
      `Matched: ${matched.length} resource(s)`,
      ...matched.slice(0, 5).map((m) => `  • ${m}`),
      "",
      "AI agents can now discover and pay for your endpoints autonomously.",
    ].join("\n");
    await sendTelegram(env, msg);
    return { found: true, matched };
  }

  return { found: false, matched: [] };
}
