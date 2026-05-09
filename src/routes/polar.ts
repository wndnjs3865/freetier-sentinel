/**
 * Polar webhook handler — /webhooks/polar
 *
 * Uses the official `standardwebhooks` library which is the reference
 * implementation Polar's signing follows. This avoids reverse-engineering
 * details (secret padding, body byte handling, signature encoding).
 *
 * Subscription lifecycle events handled:
 *   subscription.created / subscription.active / subscription.uncanceled  → user.plan = 'pro'
 *   subscription.canceled / subscription.revoked / subscription.expired   → user.plan = 'free'
 *
 * User mapping: prefer metadata.user_id (set at checkout), fallback to email lookup.
 */
import type { Env } from "../index";
import { Webhook, WebhookVerificationError } from "standardwebhooks";

const ACTIVATION_EVENTS = new Set([
  "subscription.created",
  "subscription.active",
  "subscription.uncanceled",
  "subscription.updated",
]);

const DEACTIVATION_EVENTS = new Set([
  "subscription.canceled",
  "subscription.revoked",
  "subscription.expired",
]);

async function resolveUserId(env: Env, payload: any): Promise<string | null> {
  const data = payload?.data ?? payload;

  // Path 1: explicit metadata.user_id (set at checkout via URL param)
  const metaUid = data?.metadata?.user_id ?? data?.subscription?.metadata?.user_id ?? data?.checkout?.metadata?.user_id;
  if (metaUid) return String(metaUid);

  // Path 2: customer email fallback
  const email = data?.customer?.email
    ?? data?.user?.email
    ?? data?.subscription?.customer?.email
    ?? data?.checkout?.customer_email;
  if (email) {
    const row = await env.DB.prepare("SELECT id FROM users WHERE email = ?").bind(String(email).toLowerCase()).first<{ id: string }>();
    if (row?.id) return row.id;
  }

  return null;
}

export async function handlePolarWebhook(req: Request, env: Env): Promise<Response> {
  const secret = env.POLAR_WEBHOOK_SECRET;
  if (!secret) {
    return new Response(JSON.stringify({ ok: false, error: "POLAR_WEBHOOK_SECRET not configured" }), {
      status: 503,
      headers: { "content-type": "application/json" },
    });
  }

  // Polar's actual signing convention (verified from polarsource/polar source):
  //   b64secret = base64.b64encode(secret.encode("utf-8")).decode("utf-8")
  //   StandardWebhook(b64secret).sign(id, ts, body)
  // i.e. the FULL secret string ("polar_whs_..." prefix included) is base64-encoded
  // and passed to standardwebhooks. The library then base64-decodes it back to the
  // original UTF-8 bytes which become the HMAC key.
  // Equivalent: pass raw UTF-8 bytes directly via {format: "raw"} option.
  const secretBytes = new TextEncoder().encode(secret);

  const body = await req.text();

  const headersObj: Record<string, string> = {};
  req.headers.forEach((v, k) => { headersObj[k.toLowerCase()] = v; });

  let event: any;
  try {
    const wh = new Webhook(secretBytes, { format: "raw" });
    event = wh.verify(body, headersObj);
  } catch (e) {
    const reason = e instanceof WebhookVerificationError ? e.message : String(e);
    console.log("[polar webhook] verify failed:", reason);
    return new Response(JSON.stringify({ ok: false, error: reason }), {
      status: 401,
      headers: { "content-type": "application/json" },
    });
  }

  const type = String(event?.type ?? "");
  if (!type) return new Response("missing type", { status: 400 });

  const userId = await resolveUserId(env, event);
  const meta = { type, user_id: userId, polar_id: event?.data?.id ?? null };

  // Activation
  if (ACTIVATION_EVENTS.has(type)) {
    if (type === "subscription.updated") {
      const status = String(event?.data?.status ?? "").toLowerCase();
      if (status !== "active" && status !== "trialing") {
        return new Response(JSON.stringify({ ok: true, action: "noop", reason: `status=${status}` }), {
          headers: { "content-type": "application/json" },
        });
      }
    }
    if (userId !== null) {
      await env.DB.prepare("UPDATE users SET plan = 'pro' WHERE id = ?").bind(userId).run();
    }
    await logAlert(env, "polar.activate", JSON.stringify(meta));
    return new Response(JSON.stringify({ ok: true, action: "activate", user_id: userId }), {
      headers: { "content-type": "application/json" },
    });
  }

  // Deactivation
  if (DEACTIVATION_EVENTS.has(type)) {
    if (userId !== null) {
      await env.DB.prepare("UPDATE users SET plan = 'free' WHERE id = ?").bind(userId).run();
    }
    await logAlert(env, "polar.deactivate", JSON.stringify(meta));
    return new Response(JSON.stringify({ ok: true, action: "deactivate", user_id: userId }), {
      headers: { "content-type": "application/json" },
    });
  }

  // Other events (order.*, refund.*, etc) — log only
  await logAlert(env, "polar.other", JSON.stringify(meta));
  return new Response(JSON.stringify({ ok: true, action: "logged", type }), {
    headers: { "content-type": "application/json" },
  });
}

async function logAlert(env: Env, kind: string, message: string): Promise<void> {
  try {
    await env.DB.prepare(
      "INSERT INTO alert_log (kind, message, created_at) VALUES (?, ?, ?)",
    )
      .bind(kind, message.slice(0, 1000), Math.floor(Date.now() / 1000))
      .run();
  } catch { /* alert_log table may not exist yet */ }
}
