import type { Env } from "../index";

/**
 * LemonSqueezy webhook signature.
 * https://docs.lemonsqueezy.com/help/webhooks#signing-requests
 *
 * Header: X-Signature: <hmac-sha256(raw_body, secret) as hex>
 *
 * Different shape than Stripe's `t=...,v1=...` — flat hex digest.
 */
async function verifyLsSig(payload: string, sigHex: string, secret: string): Promise<boolean> {
  if (!sigHex) return false;
  const key = await crypto.subtle.importKey(
    "raw", new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" }, false, ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payload));
  const expected = Array.from(new Uint8Array(sig))
    .map(b => b.toString(16).padStart(2, "0")).join("");
  return timingSafeEqualHex(expected, sigHex.toLowerCase());
}

function timingSafeEqualHex(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let r = 0;
  for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return r === 0;
}

export async function handleLsWebhook(req: Request, env: Env): Promise<Response> {
  if (!env.LS_WEBHOOK_SECRET) {
    return new Response("ls webhook secret not configured", { status: 503 });
  }
  const sig = req.headers.get("x-signature") || "";
  const body = await req.text();
  const ok = await verifyLsSig(body, sig, env.LS_WEBHOOK_SECRET);
  if (!ok) return new Response("Bad signature", { status: 400 });

  const event = JSON.parse(body);
  const eventName = String(event.meta?.event_name || "");
  const attrs = event.data?.attributes || {};
  const subId = String(event.data?.id || "");
  const customerId = String(attrs.customer_id || "");
  const email = String(attrs.user_email || "").toLowerCase();
  const status = String(attrs.status || "");

  if (!email || !subId) return new Response("ok", { status: 200 });

  // Subscriptions only — we don't sell one-time products.
  if (eventName === "subscription_created") {
    await env.DB.prepare(
      "UPDATE users SET plan='pro', ls_customer_id=?, ls_subscription_id=? WHERE email=?"
    ).bind(customerId, subId, email).run();
  } else if (eventName === "subscription_updated" || eventName === "subscription_resumed") {
    // status: active | on_trial | paused | past_due | unpaid | cancelled | expired
    // 'cancelled' = user cancelled but still has access until current period ends.
    // Only downgrade on 'expired' or 'unpaid'.
    const downgrade = status === "expired" || status === "unpaid";
    await env.DB.prepare(
      `UPDATE users SET plan=?, ls_customer_id=?, ls_subscription_id=? WHERE email=?`
    ).bind(downgrade ? "free" : "pro", customerId, subId, email).run();
  } else if (eventName === "subscription_expired") {
    await env.DB.prepare(
      "UPDATE users SET plan='free', ls_subscription_id=NULL WHERE ls_subscription_id=?"
    ).bind(subId).run();
  }

  return new Response("ok", { status: 200 });
}
