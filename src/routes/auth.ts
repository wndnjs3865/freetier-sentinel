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

const AUTH_PAGE_CSS = `
*{box-sizing:border-box}
body{font-family:'Inter',-apple-system,system-ui,sans-serif;background:#fafafa;color:#0f172a;margin:0;display:flex;min-height:100vh;align-items:center;justify-content:center;padding:24px;-webkit-font-smoothing:antialiased}
.card{background:#fff;border:1px solid #e2e8f0;border-radius:14px;box-shadow:0 12px 40px rgba(15,23,42,.08);padding:40px;max-width:440px;width:100%;text-align:center}
.brand{font-weight:700;font-size:15px;color:#64748b;margin-bottom:24px;letter-spacing:-0.01em}
.brand .dot{color:#fb923c}
h1{font-size:24px;letter-spacing:-0.02em;font-weight:700;margin:0 0 8px;line-height:1.25}
.email{font-weight:600;color:#1e40af;font-size:15px;margin:0 0 24px;word-break:break-all}
.btn{display:inline-block;padding:12px 24px;font-size:15px;font-family:inherit;font-weight:600;background:#1e40af;color:white;border:0;border-radius:8px;cursor:pointer;text-decoration:none;width:100%;transition:background 120ms}
.btn:hover{background:#1e3a8a}
.btn-secondary{background:#fff;color:#0f172a;border:1px solid #cbd5e1}
.btn-secondary:hover{background:#f8fafc}
.note{color:#64748b;font-size:13px;line-height:1.55;margin:20px 0 0}
.expired-icon{font-size:36px;margin-bottom:12px}
.lede{color:#64748b;font-size:15px;margin:0 0 24px;line-height:1.55}
`;

// GET /auth/{token} — show a "click to confirm" page.
// Token is NOT consumed on GET so email scanners (Gmail, Outlook) can't burn it.
export async function handleAuthToken(req: Request, env: Env): Promise<Response> {
  const url = new URL(req.url);
  const token = url.pathname.split("/").pop()!;
  const email = await env.KV.get(`mlink:${token}`);

  const head = `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Sign in — FreeTier Sentinel</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
<style>${AUTH_PAGE_CSS}</style></head><body>`;

  if (!email) {
    return new Response(`${head}
<div class="card">
  <div class="brand">FreeTier<span class="dot">•</span>Sentinel</div>
  <div class="expired-icon">⏱</div>
  <h1>Link expired</h1>
  <p class="lede">This sign-in link is no longer valid. Magic links are valid for 15 minutes and used at most once.</p>
  <a href="/" class="btn">Request a new link</a>
</div>
</body></html>`, {
      status: 410,
      headers: { "content-type": "text/html; charset=utf-8" },
    });
  }

  return new Response(`${head}
<div class="card">
  <div class="brand">FreeTier<span class="dot">•</span>Sentinel</div>
  <h1>Almost there</h1>
  <p class="email">${email}</p>
  <form method="POST" action="/auth/${token}">
    <button type="submit" class="btn">Continue to dashboard →</button>
  </form>
  <p class="note">This extra click prevents email security scanners from consuming your sign-in link before you do.</p>
</div>
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
