import type { Env } from "../index";
import { recordMetric, ensureMetricTables } from "../lib/metrics";

/**
 * Paddle Billing webhook — DRAFT skeleton (NOT wired into index.ts).
 *
 * Activate only if LS verification fails by 5/9 stop-loss.
 * Migration plan: see /root/biz/marketing/external/payment-contingency.md
 *
 * Paddle Billing v2 signature:
 *   Header: paddle-signature: ts=<unix>;h1=<hex>
 *   HMAC SHA-256 over `${ts}:${body}` with PADDLE_NOTIFICATION_SECRET.
 *
 * Different shape than LS's flat hex; this is Stripe-style with timestamp.
 *
 * Email source: Paddle webhooks do NOT include customer email by default.
 * Pass `custom_data: { email }` at checkout create time → webhook reads
 * `event.data.custom_data.email`.
 */
async function verifyPaddleSig(
  payload: string,
  sigHeader: string,
  secret: string,
): Promise<{ ok: boolean; reason?: string }> {
  if (!sigHeader) return { ok: false, reason: "missing signature header" };

  // Parse `ts=<unix>;h1=<hex>` (order may vary).
  const parts = Object.fromEntries(
    sigHeader.split(";").map((p) => {
      const [k, ...v] = p.trim().split("=");
      return [k, v.join("=")];
    }),
  );
  const ts = parts.ts;
  const sig = parts.h1;
  if (!ts || !sig) return { ok: false, reason: "malformed signature" };

  // Replay window: 5 minutes
  const tsNum = Number(ts);
  if (!Number.isFinite(tsNum)) return { ok: false, reason: "non-numeric ts" };
  const ageSec = Math.abs(Math.floor(Date.now() / 1000) - tsNum);
  if (ageSec > 300) return { ok: false, reason: `timestamp too old: ${ageSec}s` };

  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signed = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(`${ts}:${payload}`),
  );
  const expected = Array.from(new Uint8Array(signed))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  return { ok: timingSafeEqualHex(expected, sig.toLowerCase()) };
}

function timingSafeEqualHex(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let r = 0;
  for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return r === 0;
}

export async function handlePaddleWebhook(req: Request, env: Env): Promise<Response> {
  if (!env.PADDLE_NOTIFICATION_SECRET) {
    return new Response("paddle webhook secret not configured", { status: 503 });
  }
  const sig = req.headers.get("paddle-signature") || "";
  const body = await req.text();
  const result = await verifyPaddleSig(body, sig, env.PADDLE_NOTIFICATION_SECRET);
  if (!result.ok) return new Response(`Bad signature: ${result.reason || ""}`, { status: 400 });

  const event = JSON.parse(body);
  const eventType = String(event.event_type || "");
  const data = event.data || {};
  const subId = String(data.id || "");
  const customerId = String(data.customer_id || "");
  const email = String(data.custom_data?.email || "").toLowerCase();
  const status = String(data.status || "");

  if (!email || !subId) return new Response("ok", { status: 200 });

  await ensureMetricTables(env);

  // ── Metric tracking (parallel to LS path; tagged provider="paddle")
  if (eventType === "subscription.created") {
    await recordMetric(env, "subscription_created", 1, "paddle", { email, subId });
  } else if (eventType === "subscription.canceled") {
    await recordMetric(env, "subscription_cancelled", 1, "paddle", { email, subId });
  } else if (eventType === "transaction.completed") {
    // Paddle: data.details.totals.total in minor units of currency_code
    const totalCents = Number(data.details?.totals?.total) || 0;
    const totalUsd = totalCents / 100; // Paddle uses minor units like LS
    await recordMetric(env, "revenue_usd", totalUsd, "paddle", { email, subId });
    await recordMetric(env, "payment_success", 1, "paddle");
  } else if (eventType === "transaction.payment_failed") {
    await recordMetric(env, "payment_failed", 1, "paddle", { email, subId });
  } else if (eventType === "adjustment.created") {
    // Refund-style adjustment
    const action = String(data.action || "");
    if (action === "refund" || action === "credit") {
      const totalCents = Number(data.totals?.total) || 0;
      const totalUsd = totalCents / 100;
      await recordMetric(env, "refund_usd", totalUsd, "paddle", { email, subId });
      await recordMetric(env, "refund_count", 1, "paddle");
    }
  }

  // ── Plan state mutations
  if (eventType === "subscription.created") {
    await env.DB.prepare(
      "UPDATE users SET plan='pro', paddle_customer_id=?, paddle_subscription_id=? WHERE email=?",
    )
      .bind(customerId, subId, email)
      .run();
  } else if (eventType === "subscription.updated") {
    // Paddle status: active, trialing, paused, past_due, canceled
    // 'canceled' in Paddle = user-initiated cancel but still active until period end.
    // Downgrade only when fully expired (Paddle doesn't have a separate "expired" — past_due/paused → manual).
    const downgrade = status === "past_due" || status === "paused";
    await env.DB.prepare(
      `UPDATE users SET plan=?, paddle_customer_id=?, paddle_subscription_id=? WHERE email=?`,
    )
      .bind(downgrade ? "free" : "pro", customerId, subId, email)
      .run();
  } else if (eventType === "subscription.canceled") {
    // Paddle "canceled" with status=canceled means terminal end of period
    if (status === "canceled") {
      await env.DB.prepare(
        "UPDATE users SET plan='free', paddle_subscription_id=NULL WHERE paddle_subscription_id=?",
      )
        .bind(subId)
        .run();
    }
  }

  return new Response("ok", { status: 200 });
}
