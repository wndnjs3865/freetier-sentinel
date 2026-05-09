import type { Env } from "../index";
import { sendSignInEmail } from "../lib/email";
import { uuid } from "../lib/util";
import { checkRateLimit, getClientIP } from "../lib/ratelimit";
import { analyticsHeads } from "../lib/analytics";

const TTL = 60 * 15; // 15 min — code + magic link expiry
const SESSION_TTL = 60 * 60 * 24 * 30; // 30 days
// Rate limits — bumped after auth audit (5/8). Combined IP+email key reduces lockout
// from auto-submit double-fire and shared-NAT collisions while staying anti-brute-force.
const RL_SIGNUP = { limit: 6, windowSec: 600 } as const;        // /signup per IP
const RL_VERIFY = { limit: 20, windowSec: 600 } as const;       // /verify per IP+email

const PAGE_CSS = `
:root{--text:#0a0e1a;--text-2:#475569;--muted:#64748b;--border:#dde3ee;--border-strong:#c4cdde;--primary:#14b8a6;--primary-2:#0d9488;--primary-soft:#ccfbf1;--accent:#22d3ee;--bg:#f6f8fc;--surface:#fff;--err:#dc2626;--ok:#10b981;--grad:linear-gradient(135deg,#0d9488,#14b8a6,#22d3ee);--shadow:0 24px 48px -16px rgba(20,184,166,.18),0 1px 0 rgba(20,184,166,.06);}
@media (prefers-color-scheme: dark){:root{--text:#ecf0f9;--text-2:#a3aec5;--muted:#6c7891;--border:#1f2940;--border-strong:#2c3853;--primary:#2dd4bf;--primary-soft:rgba(20,184,166,.18);--bg:#0a0e1a;--surface:#11172a;--err:#fb7185;--shadow:0 24px 48px -16px rgba(0,0,0,.5);}}
*{box-sizing:border-box}
html,body{height:100%}
body{font-family:'Satoshi','Inter',-apple-system,system-ui,sans-serif;background:var(--bg);color:var(--text);margin:0;display:flex;min-height:100vh;align-items:center;justify-content:center;padding:24px;-webkit-font-smoothing:antialiased;font-feature-settings:'cv02','cv03','ss01';position:relative;overflow-x:hidden}
body::before{content:'';position:absolute;inset:0;background:radial-gradient(ellipse 60% 40% at 50% 0%,rgba(20,184,166,.10),transparent 60%),radial-gradient(ellipse 40% 30% at 80% 80%,rgba(34,211,238,.08),transparent 60%);pointer-events:none;z-index:0}
.card{position:relative;z-index:1;background:var(--surface);border:1px solid var(--border);border-radius:18px;box-shadow:var(--shadow);padding:42px 36px;max-width:440px;width:100%;text-align:center}
@media (max-width:480px){.card{padding:32px 24px;border-radius:16px}}
.brand{display:inline-flex;align-items:center;gap:8px;font-weight:600;font-size:14.5px;color:var(--text);margin-bottom:24px;letter-spacing:-0.01em;text-decoration:none}
.brand-logo{width:24px;height:24px;border-radius:6px;background:var(--grad);color:white;display:inline-flex;align-items:center;justify-content:center;font-size:13px;font-weight:800;box-shadow:inset 0 1px 0 rgba(255,255,255,.18),0 1px 0 rgba(15,23,42,.06)}
h1{font-family:'Satoshi','Inter',system-ui,sans-serif;font-size:24px;letter-spacing:-0.02em;font-weight:600;margin:0 0 6px;line-height:1.2}
.lede{color:var(--text-2);font-size:15px;margin:0 0 18px;line-height:1.55}
.email-pill{display:inline-block;background:var(--primary-soft);color:var(--primary);padding:7px 14px;border-radius:999px;font-weight:600;font-size:13px;margin:6px 0 24px;word-break:break-all;font-family:'JetBrains Mono',ui-monospace,monospace;max-width:100%;overflow-wrap:anywhere}
.code-input{width:100%;padding:18px 16px;font-size:28px;font-weight:600;letter-spacing:0.4em;text-align:center;border:1.5px solid var(--border-strong);border-radius:12px;background:var(--surface);color:var(--text);font-family:'JetBrains Mono',ui-monospace,monospace;outline:none;transition:border-color 140ms,box-shadow 140ms}
.code-input::placeholder{letter-spacing:0.3em;color:var(--border-strong)}
.code-input:focus{border-color:var(--primary);box-shadow:0 0 0 4px rgba(20,184,166,.12)}
.code-input.err{border-color:var(--err);box-shadow:0 0 0 4px rgba(220,38,38,.10);animation:shake .42s cubic-bezier(.36,.07,.19,.97)}
.code-input.busy{opacity:.65;pointer-events:none}
@keyframes shake{0%,100%{transform:translateX(0)}25%{transform:translateX(-6px)}50%{transform:translateX(6px)}75%{transform:translateX(-3px)}}
.btn{display:inline-flex;align-items:center;justify-content:center;gap:6px;padding:13px 24px;font-size:15px;font-family:inherit;font-weight:600;background:linear-gradient(180deg,#1f2937 0%,var(--text) 100%);color:white;border:0;border-radius:12px;cursor:pointer;text-decoration:none;width:100%;margin-top:14px;box-shadow:inset 0 1px 0 rgba(255,255,255,.18),0 1px 2px rgba(15,23,42,.08);transition:transform 140ms,box-shadow 140ms,filter 140ms}
.btn:hover{transform:translateY(-1px);filter:brightness(1.08);box-shadow:inset 0 1px 0 rgba(255,255,255,.18),0 8px 16px rgba(15,23,42,.18);text-decoration:none;color:white}
.btn:active{transform:translateY(0);filter:brightness(.95)}
.btn:disabled{opacity:.55;cursor:not-allowed;transform:none;filter:none}
.btn-ghost{background:transparent;color:var(--text-2);border:1px solid var(--border);box-shadow:none;font-weight:500;padding:11px 18px;font-size:14px}
.btn-ghost:hover{background:var(--bg);color:var(--text);transform:none;border-color:var(--border-strong);filter:none;box-shadow:none}
.errmsg{color:var(--err);font-size:13.5px;margin:12px 0 0;line-height:1.5;display:none;font-weight:500}
.errmsg.show{display:block}
.note{color:var(--text-2);font-size:13px;line-height:1.65;margin:24px 0 0;padding:14px 16px;background:var(--bg);border-radius:10px;border:1px solid var(--border);text-align:left}
.note strong{color:var(--text);font-weight:600}
.alt-link{margin:18px 0 0;font-size:13.5px;color:var(--muted)}
.alt-link a,.alt-link button.linkish{color:var(--primary);font-weight:500;background:none;border:0;padding:0;font:inherit;cursor:pointer;text-decoration:underline;text-underline-offset:2px}
.alt-link a:hover,.alt-link button.linkish:hover{color:var(--primary-2)}
.alt-link button.linkish:disabled{color:var(--muted);cursor:not-allowed;text-decoration:none}
.expired-icon{display:inline-flex;align-items:center;justify-content:center;width:64px;height:64px;background:rgba(220,38,38,.10);color:var(--err);border-radius:50%;margin:0 auto 14px;font-size:30px;box-shadow:0 0 0 1px rgba(220,38,38,.16),0 0 16px rgba(220,38,38,.18)}
.success-icon{display:inline-flex;align-items:center;justify-content:center;width:64px;height:64px;background:rgba(16,185,129,.12);color:var(--ok);border-radius:50%;margin:0 auto 14px;font-size:30px;box-shadow:0 0 0 1px rgba(16,185,129,.20),0 0 16px rgba(16,185,129,.22)}
.spinner{display:inline-block;width:14px;height:14px;border:2px solid rgba(255,255,255,.3);border-top-color:#fff;border-radius:50%;animation:spin .7s linear infinite;vertical-align:-2px}
@keyframes spin{to{transform:rotate(360deg)}}
.resend-status{margin-top:8px;font-size:12.5px;color:var(--ok);min-height:18px}
`;

const head = (beacon: string, title = "Sign in — FreeTier Sentinel") => `<!DOCTYPE html><html lang="en"><head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${title}</title>
<meta name="theme-color" content="#f6f8fc" media="(prefers-color-scheme: light)">
<meta name="theme-color" content="#0a0e1a" media="(prefers-color-scheme: dark)">
<meta name="color-scheme" content="light dark">
<meta name="robots" content="noindex,nofollow">
<link rel="icon" type="image/svg+xml" href="/favicon.svg">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="preconnect" href="https://api.fontshare.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;700&display=swap" rel="stylesheet">
<link href="https://api.fontshare.com/v2/css?f[]=satoshi@500,600,700&display=swap" rel="stylesheet">
<style>${PAGE_CSS}</style>${beacon}</head><body>`;

function genCode(): string {
  // Crypto-secure 6-digit code (000000-999999), uniformly distributed via rejection sampling.
  // Avoid modulo bias by rejecting values beyond the largest multiple of 1M ≤ 2^32.
  const MAX = Math.floor(0x100000000 / 1_000_000) * 1_000_000;
  const buf = new Uint32Array(1);
  while (true) {
    crypto.getRandomValues(buf);
    if (buf[0] < MAX) {
      return String(buf[0] % 1_000_000).padStart(6, "0");
    }
  }
}

function isValidEmail(e: string): boolean {
  // RFC-light. Trim already done. Single @, no whitespace, has dot in domain.
  if (!e || e.length > 254 || e.length < 5) return false;
  const at = e.indexOf("@");
  if (at < 1 || at !== e.lastIndexOf("@") || at === e.length - 1) return false;
  const domain = e.slice(at + 1);
  if (!domain.includes(".") || domain.startsWith(".") || domain.endsWith(".")) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
}

// Issue a session cookie for the given email; create user if first time.
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

// Already-signed-in check used by /signup and /verify pages.
// If the request already carries a valid session cookie, skip auth UI and go to /dash.
async function alreadySignedIn(req: Request, env: Env): Promise<boolean> {
  const cookie = req.headers.get("cookie") || "";
  const m = cookie.match(/(?:^|;\s*)s=([^;]+)/);
  if (!m) return false;
  const userId = await env.KV.get(`sess:${m[1]}`);
  return !!userId;
}

// POST /signup — create code + token, send email, redirect to /verify
export async function handleSignup(req: Request, env: Env): Promise<Response> {
  // If already signed in, skip the auth dance.
  if (await alreadySignedIn(req, env)) {
    return new Response(null, { status: 302, headers: { location: "/dash" } });
  }

  const ip = getClientIP(req);
  const rl = await checkRateLimit(env, { key: `signup:${ip}`, limit: RL_SIGNUP.limit, windowSec: RL_SIGNUP.windowSec });
  if (!rl.allowed) {
    const mins = Math.ceil(rl.resetSec / 60);
    return new Response(null, {
      status: 302,
      headers: { location: `/?err=rate&retry=${mins}` },
    });
  }

  const form = await req.formData();
  const email = String(form.get("email") || "").trim().toLowerCase();
  if (!isValidEmail(email)) {
    return new Response(null, { status: 302, headers: { location: `/?err=email` } });
  }

  const code = genCode();
  const token = uuid();
  // Store under both code-key (for /verify form) and link-key (for magic link). Both expire together.
  await env.KV.put(`mcode:${code}`, email, { expirationTtl: TTL });
  await env.KV.put(`mlink:${token}`, email, { expirationTtl: TTL });

  const link = `${env.APP_URL}/auth/${token}`;
  // Awaited so we know whether the email actually went out — failed Resend = no fallback,
  // but we still redirect to /verify in all cases (user can ask for resend).
  try {
    await sendSignInEmail(env, email, code, link);
  } catch (e) {
    console.error("[signup] email send failed", e);
  }

  return new Response(null, {
    status: 302,
    headers: { location: `/verify?e=${encodeURIComponent(email)}` },
  });
}

// POST /api/auth/resend — re-issue code + magic link for the same email (used from /verify page).
// Same rate-limit envelope as /signup so abuse is identical.
export async function handleResend(req: Request, env: Env): Promise<Response> {
  const ip = getClientIP(req);
  const form = await req.formData();
  const email = String(form.get("email") || "").trim().toLowerCase();
  if (!isValidEmail(email)) {
    return new Response(JSON.stringify({ ok: false, err: "email" }), {
      status: 400, headers: { "content-type": "application/json" },
    });
  }

  // Combined IP+email key — protects against IP-only lockout from a NAT-shared peer.
  const rl = await checkRateLimit(env, { key: `resend:${ip}:${email}`, limit: 4, windowSec: 600 });
  if (!rl.allowed) {
    return new Response(JSON.stringify({ ok: false, err: "rate", retry: rl.resetSec }), {
      status: 429, headers: { "content-type": "application/json", "retry-after": String(rl.resetSec) },
    });
  }

  const code = genCode();
  const token = uuid();
  await env.KV.put(`mcode:${code}`, email, { expirationTtl: TTL });
  await env.KV.put(`mlink:${token}`, email, { expirationTtl: TTL });
  try {
    await sendSignInEmail(env, email, code, `${env.APP_URL}/auth/${token}`);
  } catch (e) {
    console.error("[resend] email send failed", e);
    return new Response(JSON.stringify({ ok: false, err: "send" }), {
      status: 502, headers: { "content-type": "application/json" },
    });
  }
  return new Response(JSON.stringify({ ok: true }), {
    headers: { "content-type": "application/json" },
  });
}

// GET /verify — show code input form
export async function handleVerifyPage(req: Request, env: Env): Promise<Response> {
  if (await alreadySignedIn(req, env)) {
    return new Response(null, { status: 302, headers: { location: "/dash" } });
  }

  const url = new URL(req.url);
  const email = url.searchParams.get("e") || "";
  const errParam = url.searchParams.get("err") || "";
  const retryParam = url.searchParams.get("retry") || "";

  // Specific error messages — much better than generic "invalid".
  const errMsg = (() => {
    switch (errParam) {
      case "incorrect": return "That code didn't match. Double-check the email — codes look like 123456.";
      case "expired":   return "That code expired. Codes are valid for 15 minutes — request a new one below.";
      case "invalid":   return "That code wasn't recognized. Try again or request a new code below.";
      case "rate":      return `Too many attempts. Try again in ${retryParam || "10"} minute${retryParam === "1" ? "" : "s"}, or use the magic link in your email instead.`;
      case "format":    return "Codes are 6 digits — only numbers.";
      default: return "";
    }
  })();
  const showErr = !!errMsg;

  return new Response(`${head(analyticsHeads(env))}
<div class="card">
  <a href="/" class="brand"><span class="brand-logo">F</span> FreeTier Sentinel</a>
  <h1>Check your email</h1>
  <p class="lede">We sent a 6-digit code to</p>
  <div class="email-pill">${email || "your email"}</div>
  <form id="verify-form" method="POST" action="/verify" novalidate>
    <input type="hidden" name="email" value="${email}">
    <input
      class="code-input ${showErr ? 'err' : ''}"
      id="code-input"
      name="code"
      type="text"
      inputmode="numeric"
      pattern="[0-9]{6}"
      maxlength="6"
      placeholder="000000"
      autocomplete="one-time-code"
      autofocus
      required
      aria-label="6-digit verification code"
      aria-describedby="errmsg">
    <p class="errmsg ${showErr ? 'show' : ''}" id="errmsg" role="alert" aria-live="polite">${errMsg}</p>
    <button type="submit" class="btn" id="submit-btn">Sign in →</button>
  </form>
  <p class="alt-link">
    Didn't get the code?
    <button type="button" class="linkish" id="resend-btn" data-email="${email}">Resend</button>
    · <a href="/">use a different email</a>
  </p>
  <p class="resend-status" id="resend-status" role="status" aria-live="polite"></p>
  <div class="note">
    <strong>Tip:</strong> the email also includes a one-click sign-in link. If autofill caught it, just tap the field — iOS &amp; Android paste the code automatically.
  </div>
</div>
<script>
(function () {
  var input = document.getElementById('code-input');
  var form = document.getElementById('verify-form');
  var submitBtn = document.getElementById('submit-btn');
  var resendBtn = document.getElementById('resend-btn');
  var resendStatus = document.getElementById('resend-status');
  var errEl = document.getElementById('errmsg');
  if (!input || !form || !submitBtn) return;

  // Single-fire guard — paste + input both target the same submit, but we only want one.
  var submitted = false;
  function trySubmit() {
    if (submitted) return;
    submitted = true;
    input.classList.add('busy');
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span class="spinner"></span> Signing in…';
    form.submit();
  }
  function unlock() {
    submitted = false;
    input.classList.remove('busy');
    submitBtn.disabled = false;
    submitBtn.textContent = 'Sign in →';
  }

  // Sanitize & auto-submit on 6 digits typed
  input.addEventListener('input', function (e) {
    var v = (e.target.value || '').replace(/\\D/g, '').slice(0, 6);
    if (v !== e.target.value) e.target.value = v;
    if (errEl.classList.contains('show')) {
      errEl.classList.remove('show');
      input.classList.remove('err');
    }
    if (v.length === 6) trySubmit();
  });
  // Strip non-digits on paste, then submit.
  // We DON'T also set value here unless preventDefault — the input event covers normal paste.
  input.addEventListener('paste', function (e) {
    var data = (e.clipboardData || window.clipboardData);
    if (!data) return;
    var t = (data.getData('text') || '').replace(/\\D/g, '').slice(0, 6);
    if (t.length !== 6) return; // let normal paste happen, input handler sanitizes
    e.preventDefault();
    input.value = t;
    trySubmit();
  });
  // Clear stale error visual when user re-engages
  input.addEventListener('focus', function () {
    if (errEl.classList.contains('show')) {
      errEl.classList.remove('show');
      input.classList.remove('err');
    }
  });

  // Inline resend — POST /api/auth/resend
  if (resendBtn) {
    var cooldown = 0;
    function tick() {
      if (cooldown <= 0) {
        resendBtn.disabled = false;
        resendBtn.textContent = 'Resend';
        return;
      }
      resendBtn.textContent = 'Resend in ' + cooldown + 's';
      cooldown--;
      setTimeout(tick, 1000);
    }
    resendBtn.addEventListener('click', function () {
      var email = resendBtn.getAttribute('data-email') || '';
      if (!email) { resendStatus.textContent = ''; resendStatus.style.color = 'var(--err)'; resendStatus.textContent = 'Go back and re-enter your email.'; return; }
      resendBtn.disabled = true;
      resendBtn.textContent = 'Sending…';
      resendStatus.style.color = 'var(--text-2)';
      resendStatus.textContent = '';
      var fd = new FormData(); fd.append('email', email);
      fetch('/api/auth/resend', { method: 'POST', body: fd, credentials: 'same-origin' })
        .then(function (r) { return r.json().then(function (j) { return { status: r.status, json: j }; }); })
        .then(function (res) {
          if (res.json && res.json.ok) {
            resendStatus.style.color = 'var(--ok)';
            resendStatus.textContent = '✓ New code sent. Check your inbox.';
            cooldown = 30; tick(); // 30s cooldown UI guard
            unlock();
            input.value = ''; input.focus();
          } else {
            resendStatus.style.color = 'var(--err)';
            if (res.status === 429) {
              var sec = (res.json && res.json.retry) || 60;
              resendStatus.textContent = 'Too many resends. Try in ' + Math.ceil(sec / 60) + ' min or use the magic link.';
              cooldown = sec; tick();
            } else if (res.json && res.json.err === 'send') {
              resendStatus.textContent = 'Email service had a hiccup. Try once more in a moment.';
              resendBtn.disabled = false; resendBtn.textContent = 'Resend';
            } else {
              resendStatus.textContent = 'Could not send. Try again.';
              resendBtn.disabled = false; resendBtn.textContent = 'Resend';
            }
          }
        })
        .catch(function () {
          resendStatus.style.color = 'var(--err)';
          resendStatus.textContent = 'Network error. Check your connection and try again.';
          resendBtn.disabled = false; resendBtn.textContent = 'Resend';
        });
    });
  }
})();
</script>
</body></html>`, {
    headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" },
  });
}

// POST /verify — validate code, create session, redirect to /dash
export async function handleVerifyConsume(req: Request, env: Env): Promise<Response> {
  const ip = getClientIP(req);
  const form = await req.formData();
  const email = String(form.get("email") || "").trim().toLowerCase();
  const code = String(form.get("code") || "").trim();

  // Format check FIRST — otherwise rate-limit gets eaten by garbled posts.
  if (!email || !isValidEmail(email)) {
    return new Response(null, { status: 302, headers: { location: `/verify?e=${encodeURIComponent(email)}&err=format` } });
  }
  if (!/^\d{6}$/.test(code)) {
    return new Response(null, { status: 302, headers: { location: `/verify?e=${encodeURIComponent(email)}&err=format` } });
  }

  // Combined IP+email key — accidental double-fire from a single user on shared NAT
  // doesn't lock out other users behind the same gateway.
  const rl = await checkRateLimit(env, { key: `verify:${ip}:${email}`, limit: RL_VERIFY.limit, windowSec: RL_VERIFY.windowSec });
  if (!rl.allowed) {
    const mins = Math.ceil(rl.resetSec / 60);
    return new Response(null, { status: 302, headers: { location: `/verify?e=${encodeURIComponent(email)}&err=rate&retry=${mins}` } });
  }

  const stored = await env.KV.get(`mcode:${code}`);

  // No record → either expired or never existed. Surface "expired" if more
  // ambiguous; we err on "invalid" in case caller mis-typed a similar code.
  if (!stored) {
    return new Response(null, { status: 302, headers: { location: `/verify?e=${encodeURIComponent(email)}&err=invalid` } });
  }
  if (stored.toLowerCase() !== email) {
    // Code exists but for a different email — don't leak that fact, just say invalid.
    return new Response(null, { status: 302, headers: { location: `/verify?e=${encodeURIComponent(email)}&err=incorrect` } });
  }

  // Single-use: delete on success so the same code can't be replayed.
  await env.KV.delete(`mcode:${code}`);
  return await issueSession(env, email);
}

// GET /auth/{token} — magic link landing
// Behavior:
//   - If link expired: render "expired" page (410).
//   - If real browser: auto-submit the consume form via JS after a short delay
//     (real users see "Signing in…" briefly, then land on /dash).
//   - If email scanner / link-preview bot (no JS): they see the preview page
//     but never submit, so the token is preserved for the actual user.
export async function handleAuthToken(req: Request, env: Env): Promise<Response> {
  // Already signed in? Just consume + go to dash.
  if (await alreadySignedIn(req, env)) {
    return new Response(null, { status: 302, headers: { location: "/dash" } });
  }

  const url = new URL(req.url);
  const token = url.pathname.split("/").pop()!;
  const email = await env.KV.get(`mlink:${token}`);

  if (!email) {
    return new Response(`${head(analyticsHeads(env), "Link expired — FreeTier Sentinel")}
<div class="card">
  <a href="/" class="brand"><span class="brand-logo">F</span> FreeTier Sentinel</a>
  <div class="expired-icon" aria-hidden="true">⏱</div>
  <h1>Link expired</h1>
  <p class="lede">This sign-in link is no longer valid. Magic links last 15 minutes and can only be used once.</p>
  <a href="/" class="btn">Request a new link →</a>
</div>
</body></html>`, {
      status: 410,
      headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" },
    });
  }

  return new Response(`${head(analyticsHeads(env), "Signing in — FreeTier Sentinel")}
<div class="card">
  <a href="/" class="brand"><span class="brand-logo">F</span> FreeTier Sentinel</a>
  <div class="success-icon" aria-hidden="true">✓</div>
  <h1>Signing you in</h1>
  <p class="lede">As <span style="font-family:'JetBrains Mono',ui-monospace,monospace;color:var(--text);font-weight:500">${email}</span>…</p>
  <form id="auth-form" method="POST" action="/auth/${token}">
    <button type="submit" class="btn" id="auth-btn"><span class="spinner"></span> Continue to dashboard →</button>
  </form>
  <div class="note"><strong>Why an extra click?</strong> Email scanners visit links to check for phishing — without that step, your sign-in could be consumed before you arrive. Real browsers continue automatically.</div>
</div>
<script>
// Real browsers proceed automatically after a brief beat (link-preview bots without JS see the form but never submit).
(function () {
  var form = document.getElementById('auth-form');
  var btn = document.getElementById('auth-btn');
  if (!form || !btn) return;
  // Start after a short paint frame so the user sees feedback.
  setTimeout(function () {
    btn.disabled = true;
    form.submit();
  }, 600);
})();
</script>
</body></html>`, {
    headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" },
  });
}

// POST /auth/{token} — actually consume token, issue session
export async function handleAuthTokenConsume(req: Request, env: Env): Promise<Response> {
  const url = new URL(req.url);
  const token = url.pathname.split("/").pop()!;
  const email = await env.KV.get(`mlink:${token}`);
  if (!email) {
    return new Response(null, { status: 302, headers: { location: "/?err=expired" } });
  }
  await env.KV.delete(`mlink:${token}`);
  return await issueSession(env, email);
}

// POST /api/auth/logout (also accepts GET for simple <a> tag usage from /account)
// — invalidate session in KV, clear cookie, redirect home.
export async function handleLogout(req: Request, env: Env): Promise<Response> {
  const cookie = req.headers.get("cookie") || "";
  const m = cookie.match(/(?:^|;\s*)s=([^;]+)/);
  if (m) {
    try { await env.KV.delete(`sess:${m[1]}`); } catch { /* best effort */ }
  }
  return new Response(null, {
    status: 302,
    headers: {
      "set-cookie": "s=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0",
      location: "/?logged_out=1",
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
