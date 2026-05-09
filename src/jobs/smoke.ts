/**
 * Smoke test — every 30 min. Validates each endpoint's handler returns the
 * expected status + body content.
 *
 * Implementation note (2026-05-09):
 *   Originally probed via `fetch(self_url)`. CF Workers block self-subrequests
 *   to URLs bound to the same worker (522). Both the custom domain and the
 *   workers.dev subdomain are bound to this worker, so external HTTP probing
 *   from inside the worker is not possible.
 *
 *   Switched to direct handler invocation: build a Request, call the handler,
 *   inspect the Response. Validates handler logic + response contract.
 *   Routing dispatch is covered by external monitoring (UptimeRobot etc.) when
 *   added; route table itself is small and stable.
 *
 * Alert policy:
 *   - First failure: send Telegram alert, mark KV state
 *   - Continued failure: 1 alert per 6h (avoid spam)
 *   - Recovery: send "back up" alert
 */
import type { Env } from "../index";
import { sendTelegram } from "../lib/notify";
import { handleRoot } from "../routes/root";
import { handleProviders, handleCloudLimits } from "../routes/x402";
import { handleApiDocs, handleOpenApiSpec } from "../routes/x402-docs";

interface ProbeTarget {
  name: string;
  path: string; // for display in alerts only
  expect: number;
  contains?: string;
  invoke: (req: Request, env: Env) => Promise<Response>;
}

const TARGETS: ProbeTarget[] = [
  { name: "landing",        path: "/",                              expect: 200, invoke: (req, env) => handleRoot(req, env) },
  { name: "health",         path: "/health",                        expect: 200, contains: "ok", invoke: async () => new Response("ok", { status: 200 }) },
  { name: "x402-providers", path: "/v1/providers",                  expect: 200, contains: "providers", invoke: (req, env) => handleProviders(req, env) },
  { name: "docs-api",       path: "/docs/api",                      expect: 200, contains: "FreeTier", invoke: (req, env) => handleApiDocs(req, env) },
  { name: "openapi",        path: "/v1/openapi.json",               expect: 200, contains: "openapi", invoke: (req, env) => handleOpenApiSpec(req, env) },
  { name: "x402-paid-402",  path: "/v1/cloud/cloudflare/limits",    expect: 402, contains: "x402Version", invoke: (req, env) => handleCloudLimits(req, env, "cloudflare") },
];

const ALERT_COOLDOWN_SEC = 6 * 3600; // 1 alert per target per 6h

export async function runSmoke(env: Env): Promise<{ ok: number; fail: number; alerts: number }> {
  const now = Math.floor(Date.now() / 1000);
  let okCount = 0;
  let failCount = 0;
  let alertCount = 0;

  for (const t of TARGETS) {
    const result = await probe(t, env);
    const stateKey = `smoke:${t.name}`;
    const lastState = await env.KV.get(stateKey);
    const last = lastState ? JSON.parse(lastState) : { status: "ok", lastAlert: 0 };

    if (result.ok) {
      okCount++;
      if (last.status === "fail") {
        await sendTelegram(env, `✅ Recovery: ${t.name} back up (${result.detail})`);
        alertCount++;
      }
      await env.KV.put(stateKey, JSON.stringify({ status: "ok", lastAlert: 0 }), { expirationTtl: 86400 });
    } else {
      failCount++;
      const sinceLastAlert = now - (last.lastAlert || 0);
      if (last.status === "ok" || sinceLastAlert > ALERT_COOLDOWN_SEC) {
        await sendTelegram(env, `🚨 SMOKE FAIL: ${t.name}\nhttps://freetier-sentinel.dev${t.path}\n${result.detail}`);
        alertCount++;
        await env.KV.put(stateKey, JSON.stringify({ status: "fail", lastAlert: now }), { expirationTtl: 86400 });
      } else {
        await env.KV.put(stateKey, JSON.stringify({ status: "fail", lastAlert: last.lastAlert }), { expirationTtl: 86400 });
      }
    }
  }

  return { ok: okCount, fail: failCount, alerts: alertCount };
}

async function probe(t: ProbeTarget, env: Env): Promise<{ ok: boolean; detail: string }> {
  try {
    const req = new Request(`https://freetier-sentinel.dev${t.path}`, { method: "GET" });
    const r = await t.invoke(req, env);
    if (r.status !== t.expect) {
      return { ok: false, detail: `status ${r.status} (expected ${t.expect})` };
    }
    if (t.contains) {
      const body = await r.text();
      if (!body.includes(t.contains)) {
        return { ok: false, detail: `body missing "${t.contains}"` };
      }
    }
    return { ok: true, detail: `${r.status} OK` };
  } catch (e: any) {
    return { ok: false, detail: `error: ${e?.message || String(e)}` };
  }
}
