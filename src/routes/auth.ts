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
:root{--text:#0a0e1a;--text-2:#475569;--muted:#64748b;--border:#e6e8ee;--border-strong:#d4d8e0;--primary:#1e40af;--primary-2:#2563eb;--primary-soft:#eff6ff;--accent:#fb923c;--bg:#fafafa;--surface:#fff;--grad:linear-gradient(135deg,#1e40af,#3b82f6);--shadow:0 12px 40px rgba(15,23,42,.08);}
*{box-sizing:border-box}
html,body{height:100%}
body{font-family:'Inter',-apple-system,system-ui,sans-serif;background:var(--bg);color:var(--text);margin:0;display:flex;min-height:100vh;align-items:center;justify-content:center;padding:24px;-webkit-font-smoothing:antialiased;font-feature-settings:'cv02','cv03','ss01';position:relative;overflow-x:hidden}
body::before{content:'';position:absolute;inset:0;background:radial-gradient(ellipse 60% 40% at 50% 0%,rgba(59,130,246,.10),transparent 60%),radial-gradient(ellipse 40% 30% at 80% 80%,rgba(251,146,60,.08),transparent 60%);pointer-events:none;z-index:0}
.card{position:relative;z-index:1;background:var(--surface);border:1px solid var(--border);border-radius:18px;box-shadow:var(--shadow);padding:42px 36px;max-width:440px;width:100%;text-align:center}
.brand{display:inline-flex;align-items:center;gap:8px;font-weight:700;font-size:14.5px;color:var(--text);margin-bottom:28px;letter-spacing:-0.01em}
.brand-logo{width:24px;height:24px;border-radius:6px;background:var(--grad);color:white;display:inline-flex;align-items:center;justify-content:center;font-size:13px;font-weight:800;box-shadow:0 2px 8px rgba(30,64,175,.3)}
h1{font-size:24px;letter-spacing:-0.02em;font-weight:700;margin:0 0 6px;line-height:1.2}
.email{display:inline-block;background:var(--primary-soft);color:var(--primary);padding:6px 14px;border-radius:999px;font-weight:600;font-size:13.5px;margin:6px 0 24px;word-break:break-all;font-family:'JetBrains Mono',ui-monospace,monospace}
.btn{display:inline-flex;align-items:center;justify-content:center;gap:6px;padding:13px 24px;font-size:15px;font-family:inherit;font-weight:600;background:var(--text);color:white;border:0;border-radius:10px;cursor:pointer;text-decoration:none;width:100%;transition:background 140ms,transform 100ms}
.btn:hover{background:#1e2939;transform:translateY(-1px);text-decoration:none;color:white}
.note{color:var(--muted);font-size:13px;line-height:1.6;margin:24px 0 0;padding:14px;background:var(--bg);border-radius:10px;border:1px solid var(--border)}
.expired-icon{display:inline-flex;align-items:center;justify-content:center;width:64px;height:64px;background:#fee2e2;color:#dc2626;border-radius:50%;margin-bottom:14px;font-size:30px}
.lede{color:var(--muted);font-size:15px;margin:0 0 24px;line-height:1.6}
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
  <div class="brand"><span class="brand-logo">F</span> FreeTier Sentinel</div>
  <div class="expired-icon">⏱</div>
  <h1>Link expired</h1>
  <p class="lede">This sign-in link is no longer valid. Magic links last 15 minutes and can only be used once.</p>
  <a href="/" class="btn">Request a new link →</a>
</div>
</body></html>`, {
      status: 410,
      headers: { "content-type": "text/html; charset=utf-8" },
    });
  }

  return new Response(`${head}
<div class="card">
  <div class="brand"><span class="brand-logo">F</span> FreeTier Sentinel</div>
  <h1>One more step</h1>
  <p style="color:var(--muted);font-size:14px;margin:6px 0 0">Signing in as</p>
  <div class="email">${email}</div>
  <form method="POST" action="/auth/${token}">
    <button type="submit" class="btn">Continue to dashboard →</button>
  </form>
  <p class="note">This extra click prevents email security scanners from consuming your link before you do.</p>
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
