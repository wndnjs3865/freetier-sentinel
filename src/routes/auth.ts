import type { Env } from "../index";
import { sendMagicLinkEmail } from "../lib/email";
import { uuid } from "../lib/util";

const MAGIC_TTL = 60 * 15; // 15 min

export async function handleSignup(req: Request, env: Env): Promise<Response> {
  const form = await req.formData();
  const email = String(form.get("email") || "").trim().toLowerCase();
  if (!email || !/^[^@]+@[^@]+\.[^@]+$/.test(email)) {
    return new Response("Invalid email", { status: 400 });
  }
  const token = uuid();
  await env.KV.put(`mlink:${token}`, email, { expirationTtl: MAGIC_TTL });
  const link = `${env.APP_URL}/auth/${token}`;
  await sendMagicLinkEmail(env, email, link);
  return new Response("Check your inbox for the magic link.", {
    headers: { "content-type": "text/plain" },
  });
}

// GET /auth/{token} — show a "click to confirm" page.
// Token is NOT consumed on GET so email scanners (Gmail, Outlook) can't burn it.
export async function handleAuthToken(req: Request, env: Env): Promise<Response> {
  const url = new URL(req.url);
  const token = url.pathname.split("/").pop()!;
  const email = await env.KV.get(`mlink:${token}`);
  if (!email) {
    return new Response(`<!DOCTYPE html><html><body style="font-family:system-ui;max-width:480px;margin:3rem auto;padding:0 1rem;line-height:1.6">
<h1>Link expired</h1>
<p>This sign-in link is no longer valid. Magic links are valid for 15 minutes.</p>
<p><a href="/">Go back to request a new link</a></p>
</body></html>`, {
      status: 410,
      headers: { "content-type": "text/html; charset=utf-8" },
    });
  }
  return new Response(`<!DOCTYPE html><html><body style="font-family:system-ui;max-width:480px;margin:3rem auto;padding:0 1rem;line-height:1.6;text-align:center">
<h1>Sign in to FreeTier Sentinel</h1>
<p>Signed in as <strong>${email}</strong></p>
<form method="POST" action="/auth/${token}">
  <button type="submit" style="padding:.7rem 1.4rem;font-size:1.05rem;background:#0a66c2;color:#fff;border:0;border-radius:6px;cursor:pointer">Continue to dashboard</button>
</form>
<p style="color:#888;font-size:.85rem;margin-top:2rem">Click required so email scanners don't consume the link before you do.</p>
</body></html>`, {
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}

// POST /auth/{token} — actually consume token, issue session, redirect to /dash.
export async function handleAuthTokenConsume(req: Request, env: Env): Promise<Response> {
  const url = new URL(req.url);
  const token = url.pathname.split("/").pop()!;
  const email = await env.KV.get(`mlink:${token}`);
  if (!email) {
    return new Response("Link expired", { status: 410 });
  }
  await env.KV.delete(`mlink:${token}`);

  let user = await env.DB.prepare("SELECT id FROM users WHERE email = ?").bind(email).first();
  if (!user) {
    const id = uuid();
    await env.DB.prepare(
      "INSERT INTO users (id, email, plan, created_at) VALUES (?, ?, 'free', ?)"
    ).bind(id, email, Math.floor(Date.now() / 1000)).run();
    user = { id };
  }

  const sessionToken = uuid();
  await env.KV.put(`sess:${sessionToken}`, String(user.id), { expirationTtl: 60 * 60 * 24 * 30 });

  return new Response(null, {
    status: 302,
    headers: {
      "set-cookie": `s=${sessionToken}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${60 * 60 * 24 * 30}`,
      location: "/dash",
    },
  });
}

export async function getUserFromCookie(req: Request, env: Env): Promise<{ id: string; email: string; plan: string } | null> {
  const cookie = req.headers.get("cookie") || "";
  const m = cookie.match(/(?:^|;\s*)s=([^;]+)/);
  if (!m) return null;
  const userId = await env.KV.get(`sess:${m[1]}`);
  if (!userId) return null;
  const u = await env.DB.prepare("SELECT id, email, plan FROM users WHERE id = ?").bind(userId).first();
  return (u as any) || null;
}
