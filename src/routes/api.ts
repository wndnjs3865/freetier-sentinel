import type { Env } from "../index";
import { getUserFromCookie } from "./auth";
import { encrypt } from "../lib/crypto";
import { uuid } from "../lib/util";
import { runScheduledCheck } from "../jobs/check";

const FREE_LIMIT = 3;

// POST /api/check-now — force-poll all of current user's services right now (bypasses interval)
export async function handleCheckNow(req: Request, env: Env): Promise<Response> {
  const user = await getUserFromCookie(req, env);
  if (!user) return new Response("Unauthorized", { status: 401 });
  const result = await runScheduledCheck(env, { force: true, userId: user.id });
  const accept = req.headers.get("accept") || "";
  if (accept.includes("application/json")) {
    return new Response(JSON.stringify(result), { headers: { "content-type": "application/json" } });
  }
  return new Response(null, { status: 302, headers: { location: "/dash?checked=" + result.checked } });
}

// POST /api/test-alert — send a sample alert email to user (verifies alert delivery works)
export async function handleTestAlert(req: Request, env: Env): Promise<Response> {
  const user = await getUserFromCookie(req, env);
  if (!user) return new Response("Unauthorized", { status: 401 });

  const { sendUsageAlert } = await import("../lib/email");
  await sendUsageAlert(
    env,
    user.email,
    "[TEST] Sample alert — Cloudflare Workers at 87%",
    `This is a test alert to verify your alert delivery works.

If you received this email, your alert channel is correctly set up. When a real service crosses its threshold, you'll get a notification just like this.

Service: My Cloudflare (test sample)
Usage: 87% of free tier
Status: WARNING

— FreeTier Sentinel`
  );
  return new Response(null, { status: 302, headers: { location: "/dash?alert_sent=1" } });
}

export async function handleApiServices(req: Request, env: Env): Promise<Response> {
  const user = await getUserFromCookie(req, env);
  if (!user) return new Response("Unauthorized", { status: 401 });

  const url = new URL(req.url);

  if (req.method === "POST") {
    const form = await req.formData();
    const label = String(form.get("label") || "").trim();
    const kind = String(form.get("kind") || "");
    const apiKey = String(form.get("api_key") || "").trim();
    const threshold = parseInt(String(form.get("threshold") || "80"));
    if (!label || !kind || !apiKey) return new Response("Missing fields", { status: 400 });

    if (user.plan === "free") {
      const c = await env.DB.prepare("SELECT COUNT(*) AS n FROM services WHERE user_id = ?")
        .bind(user.id).first<{ n: number }>();
      if ((c?.n || 0) >= FREE_LIMIT) {
        return new Response("Free plan limited to 3 services. Upgrade to Pro.", { status: 402 });
      }
    }

    const enc = await encrypt(apiKey, env.MASTER_KEY);
    await env.DB.prepare(
      "INSERT INTO services (id, user_id, kind, label, credentials_enc, threshold_pct, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)"
    ).bind(uuid(), user.id, kind, label, enc, threshold, Math.floor(Date.now() / 1000)).run();

    return new Response(null, { status: 302, headers: { location: "/dash" } });
  }

  if (req.method === "DELETE") {
    const id = url.pathname.split("/").pop();
    await env.DB.prepare("DELETE FROM services WHERE id = ? AND user_id = ?")
      .bind(id, user.id).run();
    return new Response(null, { status: 204 });
  }

  return new Response("Method not allowed", { status: 405 });
}

export async function handleApiAlerts(req: Request, env: Env): Promise<Response> {
  const user = await getUserFromCookie(req, env);
  if (!user) return new Response("Unauthorized", { status: 401 });

  const form = await req.formData();
  const kind = String(form.get("kind") || "");
  const target = String(form.get("target") || "").trim();
  if (!kind || !target) return new Response("Missing fields", { status: 400 });

  if (user.plan === "free" && kind !== "email") {
    return new Response("Discord/Telegram alerts are Pro-only.", { status: 402 });
  }

  await env.DB.prepare(
    "INSERT INTO alert_channels (id, user_id, kind, target, enabled, created_at) VALUES (?, ?, ?, ?, 1, ?)"
  ).bind(uuid(), user.id, kind, target, Math.floor(Date.now() / 1000)).run();

  return new Response(null, { status: 302, headers: { location: "/dash" } });
}
