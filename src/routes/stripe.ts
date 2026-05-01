import type { Env } from "../index";

/**
 * Verify Stripe webhook signature (HMAC-SHA256).
 * https://stripe.com/docs/webhooks/signatures
 */
async function verifyStripeSig(payload: string, sigHeader: string, secret: string): Promise<boolean> {
  const parts = Object.fromEntries(sigHeader.split(",").map(p => p.split("=") as [string, string]));
  const t = parts["t"]; const v1 = parts["v1"];
  if (!t || !v1) return false;
  const data = `${t}.${payload}`;
  const key = await crypto.subtle.importKey(
    "raw", new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" }, false, ["sign"]
  );
  const sigBytes = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(data));
  const expected = Array.from(new Uint8Array(sigBytes))
    .map(b => b.toString(16).padStart(2, "0")).join("");
  return expected === v1;
}

export async function handleStripeWebhook(req: Request, env: Env): Promise<Response> {
  const sig = req.headers.get("stripe-signature") || "";
  const body = await req.text();
  const ok = await verifyStripeSig(body, sig, env.STRIPE_WEBHOOK_SECRET);
  if (!ok) return new Response("Bad signature", { status: 400 });

  const event = JSON.parse(body);
  const type = event.type as string;

  if (type === "checkout.session.completed") {
    const s = event.data.object;
    const email = s.customer_details?.email || s.customer_email;
    if (email) {
      await env.DB.prepare(
        "UPDATE users SET plan='pro', stripe_customer_id=?, stripe_subscription_id=? WHERE email=?"
      ).bind(s.customer, s.subscription, String(email).toLowerCase()).run();
    }
  } else if (type === "customer.subscription.deleted") {
    const sub = event.data.object;
    await env.DB.prepare(
      "UPDATE users SET plan='free', stripe_subscription_id=NULL WHERE stripe_subscription_id=?"
    ).bind(sub.id).run();
  }

  return new Response("ok", { status: 200 });
}
