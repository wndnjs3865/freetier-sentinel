import type { Env } from "../index";
import { sendSignInEmail } from "../lib/email";
import { uuid } from "../lib/util";

const TTL = 60 * 15; // 15 min
const SESSION_TTL = 60 * 60 * 24 * 30; // 30 days

const PAGE_CSS = `
:root{--text:#0a0e1a;--text-2:#475569;--muted:#64748b;--border:#e6e8ee;--border-strong:#d4d8e0;--primary:#1e40af;--primary-2:#2563eb;--primary-soft:#eff6ff;--accent:#fb923c;--bg:#fafafa;--surface:#fff;--err:#dc2626;--grad:linear-gradient(135deg,#1e40af,#3b82f6);--shadow:0 12px 40px rgba(15,23,42,.08);}
*{box-sizing:border-box}
html,body{height:100%}
body{font-family:'Inter',-apple-system,system-ui,sans-serif;background:var(--bg);color:var(--text);margin:0;display:flex;min-height:100vh;align-items:center;justify-content:center;padding:24px;-webkit-font-smoothing:antialiased;font-feature-settings:'cv02','cv03','ss01';position:relative;overflow-x:hidden}
body::before{content:'';position:absolute;inset:0;background:radial-gradient(ellipse 60% 40% at 50% 0%,rgba(59,130,246,.10),transparent 60%),radial-gradient(ellipse 40% 30% at 80% 80%,rgba(251,146,60,.08),transparent 60%);pointer-events:none;z-index:0}
.card{position:relative;z-index:1;background:var(--surface);border:1px solid var(--border);border-radius:18px;box-shadow:var(--shadow);padding:42px 36px;max-width:440px;width:100%;text-align:center}
.brand{display:inline-flex;align-items:center;gap:8px;font-weight:700;font-size:14.5px;color:var(--text);margin-bottom:24px;letter-spacing:-0.01em}
.brand-logo{width:24px;height:24px;border-radius:6px;background:var(--grad);color:white;display:inline-flex;align-items:center;justify-content:center;font-size:13px;font-weight:800;box-shadow:0 2px 8px rgba(30,64,175,.3)}
h1{font-size:24px;letter-spacing:-0.02em;font-weight:700;margin:0 0 6px;line-height:1.2}
.lede{color:var(--muted);font-size:15px;margin:0 0 24px;line-height:1.55}
.email-pill{display:inline-block;background:var(--primary-soft);color:var(--primary);padding:6px 14px;border-radius:999px;font-weight:600;font-size:13px;margin:6px 0 24px;word-break:break-all;font-family:'JetBrains Mono',ui-monospace,monospace}
.code-input{width:100%;padding:18px 16px;font-size:28px;font-weight:600;letter-spacing:0.4em;text-align:center;border:1.5px solid var(--border-strong);border-radius:12px;background:var(--surface);color:var(--text);font-family:'JetBrains Mono',ui-monospace,monospace;outline:none;transition:border-color 140ms,box-shadow 140ms}
.code-input::placeholder{letter-spacing:0.3em;color:var(--border-strong)}
.code-input:focus{border-color:var(--primary);box-shadow:0 0 0 4px var(--primary-soft)}
.code-input.err{border-color:var(--err);box-shadow:0 0 0 4px rgba(220,38,38,.1)}
.btn{display:inline-flex;align-items:center;justify-content:center;gap:6px;padding:13px 24px;font-size:15px;font-family:inherit;font-weight:600;background:var(--text);color:white;border:0;border-radius:10px;cursor:pointer;text-decoration:none;width:100%;margin-top:14px;transition:background 140ms,transform 100ms}
.btn:hover{background:#1e2939;transform:translateY(-1px);text-decoration:none;color:white}
.btn:disabled{opacity:.5;cursor:not-allowed;transform:none}
.errmsg{color:var(--err);font-size:13px;margin:10px 0 0;display:none}
.errmsg.show{display:block}
.note{color:var(--muted);font-size:13px;line-height:1.6;margin:24px 0 0;padding:14px;background:var(--bg);border-radius:10px;border:1px solid var(--border);text-align:left}
.note strong{color:var(--text);font-weight:600}
.alt-link{margin:18px 0 0;font-size:13px;color:var(--muted)}
.alt-link a{color:var(--primary);font-weight:500}
.expired-icon{display:inline-flex;align-items:center;justify-content:center;width:64px;height:64px;background:#fee2e2;color:#dc2626;border-radius:50%;margin:0 auto 14px;font-size:30px}
`;

const HEAD = `<!DOCTYPE html><html lang="en"><head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Sign in — FreeTier Sentinel</title>
<meta name="theme-color" content="#1e40af">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;700&display=swap" rel="stylesheet">
<style>${PAGE_CSS}</style></head><body>`;

function genCode(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

// POST /signup — create code + token, send email, redirect to /verify
export async function handleSignup(req: Request, env: Env): Promise<Response> {
  const form = await req.formData();
  const email = String(form.get("email") || "").trim().toLowerCase();
  if (!email || !/^[^@]+@[^@]+\.[^@]+$/.test(email)) {
    return new Response("Invalid email", { status: 400 });
  }

  const code = genCode();
  const token = uuid();
  await env.KV.put(`mcode:${code}`, email, { expirationTtl: TTL });
  await env.KV.put(`mlink:${token}`, email, { expirationTtl: TTL });

  const link = `${env.APP_URL}/auth/${token}`;
  // Don't await — Resend can be slow, redirect first
  // (await is fine for our scale; trade-off: ensures email sent before redirect)
  await sendSignInEmail(env, email, code, link);

  // Redirect to verify page with email pre-filled
  return new Response(null, {
    status: 302,
    headers: { location: `/verify?e=${encodeURIComponent(email)}` },
  });
}

// GET /verify — show code input form
export async function handleVerifyPage(req: Request, _env: Env): Promise<Response> {
  const url = new URL(req.url);
  const email = url.searchParams.get("e") || "";
  const errParam = url.searchParams.get("err");

  return new Response(`${HEAD}
<div class="card">
  <div class="brand"><span class="brand-logo">F</span> FreeTier Sentinel</div>
  <h1>Check your email</h1>
  <p class="lede">We sent a 6-digit code to</p>
  <div class="email-pill">${email || "your email"}</div>
  <form method="POST" action="/verify" novalidate>
    <input type="hidden" name="email" value="${email}">
    <input
      class="code-input ${errParam ? 'err' : ''}"
      name="code"
      type="text"
      inputmode="numeric"
      pattern="[0-9]{6}"
      maxlength="6"
      placeholder="000000"
      autocomplete="one-time-code"
      autofocus
      required>
    <p class="errmsg ${errParam ? 'show' : ''}">${errParam === 'invalid' ? 'Invalid or expired code. Try again or request a new one.' : ''}</p>
    <button type="submit" class="btn">Sign in →</button>
  </form>
  <p class="alt-link">Didn't get the code? <a href="/">Try again</a> · or check spam folder</p>
  <div class="note">
    <strong>Tip:</strong> the code is also clickable as a link in the email — tap "Open sign-in link" if you'd rather not type it.
  </div>
</div>
<script>
// Auto-submit when 6 digits entered
const i = document.querySelector('.code-input');
const f = document.querySelector('form');
i.addEventListener('input', e => {
  e.target.value = e.target.value.replace(/\\D/g, '').slice(0, 6);
  if (e.target.value.length === 6) f.submit();
});
// Strip non-digits on paste
i.addEventListener('paste', e => {
  e.preventDefault();
  const t = (e.clipboardData || window.clipboardData).getData('text').replace(/\\D/g, '').slice(0, 6);
  i.value = t;
  if (t.length === 6) f.submit();
});
</script>
</body></html>`, {
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}

// POST /verify — validate code, create session, redirect to /dash
export async function handleVerifyConsume(req: Request, env: Env): Promise<Response> {
  const form = await req.formData();
  const email = String(form.get("email") || "").trim().toLowerCase();
  const code = String(form.get("code") || "").trim();

  if (!email || !/^\d{6}$/.test(code)) {
    return new Response(null, { status: 302, headers: { location: `/verify?e=${encodeURIComponent(email)}&err=invalid` } });
  }

  const stored = await env.KV.get(`mcode:${code}`);
  if (!stored || stored.toLowerCase() !== email) {
    return new Response(null, { status: 302, headers: { location: `/verify?e=${encodeURIComponent(email)}&err=invalid` } });
  }

  await env.KV.delete(`mcode:${code}`);
  return await issueSession(env, email);
}

// GET /auth/{token} — magic link preview page (clicked from email)
export async function handleAuthToken(req: Request, env: Env): Promise<Response> {
  const url = new URL(req.url);
  const token = url.pathname.split("/").pop()!;
  const email = await env.KV.get(`mlink:${token}`);

  if (!email) {
    return new Response(`${HEAD}
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

  return new Response(`${HEAD}
<div class="card">
  <div class="brand"><span class="brand-logo">F</span> FreeTier Sentinel</div>
  <h1>One more step</h1>
  <p class="lede">Signing in as</p>
  <div class="email-pill">${email}</div>
  <form method="POST" action="/auth/${token}">
    <button type="submit" class="btn">Continue to dashboard →</button>
  </form>
  <div class="note"><strong>Why this extra click?</strong> Email security scanners auto-visit links to check for phishing. The form prevents them from consuming your sign-in before you do.</div>
</div>
</body></html>`, {
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}

// POST /auth/{token} — actually consume token, issue session
export async function handleAuthTokenConsume(req: Request, env: Env): Promise<Response> {
  const url = new URL(req.url);
  const token = url.pathname.split("/").pop()!;
  const email = await env.KV.get(`mlink:${token}`);
  if (!email) return new Response("Link expired", { status: 410 });

  await env.KV.delete(`mlink:${token}`);
  return await issueSession(env, email);
}

async function issueSession(env: Env, email: string): Promise<Response> {
  let user = await env.DB.prepare("SELECT id FROM users WHERE email = ?").bind(email).first();
  if (!user) {
    const id = uuid();
    await env.DB.prepare(
      "INSERT INTO users (id, email, plan, created_at) VALUES (?, ?, 'free', ?)"
    ).bind(id, email, Math.floor(Date.now() / 1000)).run();
    user = { id };
  }

  const sessionToken = uuid();
  await env.KV.put(`sess:${sessionToken}`, String(user.id), { expirationTtl: SESSION_TTL });

  return new Response(null, {
    status: 302,
    headers: {
      "set-cookie": `s=${sessionToken}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${SESSION_TTL}`,
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
