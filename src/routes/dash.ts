import type { Env } from "../index";
import { getUserFromCookie } from "./auth";
import { analyticsBeacon } from "../lib/analytics";

const CSS = String.raw`
:root {
  --bg: #fafafa; --bg-mesh: #f6f8fc; --surface: #fff; --surface-2: #f8fafc;
  --text: #0a0e1a; --text-2: #475569; --muted: #64748b;
  --border: #e6e8ee; --border-strong: #d4d8e0;
  --primary: #1e40af; --primary-2: #2563eb; --primary-3: #3b82f6; --primary-soft: #eff6ff;
  --accent: #fb923c;
  --ok: #16a34a; --warn: #d97706; --err: #dc2626;
  --grad-1: linear-gradient(135deg,#1e40af,#3b82f6);
  --grad-pro: linear-gradient(135deg,#1e40af,#3b82f6,#60a5fa);
  --shadow-xs: 0 1px 2px rgba(15,23,42,.04);
  --shadow-sm: 0 1px 3px rgba(15,23,42,.06), 0 4px 12px rgba(15,23,42,.04);
  --shadow-md: 0 4px 12px rgba(15,23,42,.06), 0 16px 40px rgba(15,23,42,.08);
  --r-sm: 8px; --r-md: 12px; --r-lg: 16px;
}
*{box-sizing:border-box}
body {
  font-family: 'Inter',-apple-system,system-ui,sans-serif;
  background: var(--bg); color: var(--text);
  margin: 0; line-height: 1.6;
  -webkit-font-smoothing: antialiased;
  font-feature-settings: 'cv02','cv03','cv11','ss01';
}
a{color:var(--primary);text-decoration:none}a:hover{color:var(--primary-2)}
button{font-family:inherit;cursor:pointer}

/* ──── LAYOUT ──── */
.app {
  display: grid;
  grid-template-columns: 1fr;
  min-height: 100vh;
}
@media (min-width: 880px) {
  .app { grid-template-columns: 240px 1fr; }
}

/* ──── SIDEBAR (DESKTOP) ──── */
.side {
  display: none;
  background: var(--surface);
  border-right: 1px solid var(--border);
  padding: 22px 16px;
  position: sticky; top: 0; height: 100vh;
  flex-direction: column;
}
@media (min-width: 880px) { .side { display: flex; } }
.brand { display: inline-flex; align-items: center; gap: 8px; font-weight: 700; font-size: 15px; letter-spacing: -.01em; color: var(--text); margin: 0 8px 24px; }
.brand-logo { width: 22px; height: 22px; border-radius: 6px; background: var(--grad-1); color: white; display: inline-flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 800; box-shadow: 0 2px 8px rgba(30,64,175,.3); }
.side-section { font-size: 11px; text-transform: uppercase; letter-spacing: .12em; font-weight: 600; color: var(--muted); margin: 18px 12px 6px; }
.side-link {
  display: flex; align-items: center; gap: 10px;
  padding: 9px 12px; border-radius: var(--r-sm);
  font-size: 14.5px; font-weight: 500; color: var(--text-2);
  transition: background 140ms, color 140ms;
}
.side-link:hover { background: var(--surface-2); color: var(--text); }
.side-link.active { background: var(--primary-soft); color: var(--primary); font-weight: 600; }
.side-link svg { width: 16px; height: 16px; flex-shrink: 0; }
.side-foot { margin-top: auto; padding: 16px 12px 0; border-top: 1px solid var(--border); }
.side-user { font-size: 13px; }
.side-user .em { color: var(--text); font-weight: 500; word-break: break-all; }
.side-user .pl { color: var(--muted); margin-top: 4px; }

/* ──── MAIN ──── */
main { padding: 28px 24px 80px; max-width: 1080px; }
@media (min-width: 880px) { main { padding: 36px 36px 80px; } }
@media (max-width: 600px) { main { padding: 24px 20px 80px; } }

.topbar { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 12px; margin-bottom: 22px; }
.topbar-mobile-brand { display: inline-flex; align-items: center; gap: 8px; font-weight: 700; font-size: 15px; }
@media (min-width: 880px) { .topbar-mobile-brand { display: none; } }
.greeting h1 { font-size: 26px; letter-spacing: -.02em; font-weight: 700; margin: 0 0 4px; }
@media (min-width: 720px) { .greeting h1 { font-size: 30px; } }
.greeting p { color: var(--muted); margin: 0; font-size: 14.5px; }

.badge {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 5px 12px; border-radius: 999px;
  font-size: 12px; font-weight: 600; letter-spacing: .02em;
}
.badge.free { background: var(--surface-2); border: 1px solid var(--border); color: var(--muted); }
.badge.pro { background: var(--grad-pro); color: white; box-shadow: 0 4px 14px rgba(30,64,175,.3); }

/* ──── UPGRADE BANNER ──── */
.upgrade {
  margin: 18px 0 28px;
  background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
  border: 1px solid #bfdbfe;
  border-radius: var(--r-lg);
  padding: 22px 24px;
  display: flex; justify-content: space-between; align-items: center;
  flex-wrap: wrap; gap: 16px;
  position: relative; overflow: hidden;
}
.upgrade::before {
  content: ''; position: absolute; right: -40px; top: -40px;
  width: 200px; height: 200px; border-radius: 50%;
  background: radial-gradient(circle, rgba(255,255,255,.4), transparent 70%);
  pointer-events: none;
}
.upgrade-text h3 { margin: 0 0 4px; font-size: 17px; font-weight: 700; letter-spacing: -.01em; }
.upgrade-text p { margin: 0; color: var(--text-2); font-size: 14px; }
.btn-up {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 11px 22px;
  background: var(--text); color: white;
  border-radius: var(--r-sm);
  font-weight: 600; font-size: 14.5px;
  transition: background 140ms, transform 100ms;
  white-space: nowrap;
}
.btn-up:hover { background: #1e2939; transform: translateY(-1px); color: white; }

/* ──── STAT CARDS ──── */
.stats { display: grid; gap: 12px; grid-template-columns: 1fr; margin-bottom: 32px; }
@media (min-width: 600px) { .stats { grid-template-columns: repeat(3, 1fr); } }
.stat {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--r-lg);
  padding: 18px 20px;
  box-shadow: var(--shadow-xs);
}
.stat .label { font-size: 12px; color: var(--muted); text-transform: uppercase; letter-spacing: .08em; font-weight: 600; margin: 0 0 8px; }
.stat .value { font-size: 28px; font-weight: 700; letter-spacing: -.02em; color: var(--text); line-height: 1.1; }
.stat .delta { font-size: 12px; color: var(--text-2); margin-top: 4px; }

/* ──── SECTION ──── */
.section { margin: 32px 0; }
.section-head { display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 14px; gap: 12px; flex-wrap: wrap; }
.section-head h2 { font-size: 18px; font-weight: 700; letter-spacing: -.01em; margin: 0; }
.section-head .count { color: var(--muted); font-size: 13px; font-weight: 500; }

.card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--r-lg);
  box-shadow: var(--shadow-xs);
  overflow: hidden;
}

/* ──── SERVICE LIST ──── */
.svc-list { list-style: none; margin: 0; padding: 0; }
.svc-list li {
  padding: 18px 22px;
  border-bottom: 1px solid var(--border);
  display: grid;
  gap: 8px 14px;
  grid-template-columns: 1fr;
  align-items: center;
}
@media (min-width: 720px) {
  .svc-list li { grid-template-columns: 1.6fr 110px 1fr 130px; }
}
.svc-list li:last-child { border-bottom: 0; }
.svc-name { font-weight: 600; font-size: 14.5px; }
.svc-name small { display: block; color: var(--muted); font-size: 12px; font-weight: 500; margin-top: 2px; text-transform: uppercase; letter-spacing: .04em; }
.svc-status { display: flex; gap: 6px; align-items: center; }
.status-pill { padding: 3px 10px; border-radius: 999px; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: .04em; }
.status-pill.ok { background: #dcfce7; color: var(--ok); }
.status-pill.warn { background: #fef3c7; color: var(--warn); }
.status-pill.err, .status-pill.critical { background: #fee2e2; color: var(--err); }
.status-pill.pending { background: var(--surface-2); color: var(--muted); }
.svc-bar-wrap { display: flex; align-items: center; gap: 10px; }
.svc-bar { flex: 1; height: 6px; background: var(--border); border-radius: 999px; overflow: hidden; min-width: 100px; }
.svc-bar > span { display: block; height: 100%; background: var(--grad-1); transition: width 200ms; }
.svc-bar.warn > span { background: linear-gradient(135deg,#f59e0b,#fb923c); }
.svc-bar.crit > span { background: linear-gradient(135deg,#ef4444,#dc2626); }
.svc-bar-pct { font-size: 13px; font-weight: 600; color: var(--text); min-width: 38px; text-align: right; font-family: 'JetBrains Mono', ui-monospace, monospace; }
.svc-time { font-size: 12.5px; color: var(--muted); font-family: 'JetBrains Mono', ui-monospace, monospace; }

/* ──── EMPTY STATE ──── */
.empty {
  padding: 48px 24px;
  text-align: center;
}
.empty-icon {
  width: 64px; height: 64px;
  background: var(--primary-soft);
  border-radius: 50%;
  display: inline-flex; align-items: center; justify-content: center;
  color: var(--primary);
  margin-bottom: 16px;
}
.empty h3 { font-size: 16px; font-weight: 700; margin: 0 0 6px; }
.empty p { margin: 0; color: var(--muted); font-size: 14px; max-width: 320px; margin-left: auto; margin-right: auto; }

/* ──── ADD FORM ──── */
.add-form {
  background: var(--surface-2);
  border-top: 1px solid var(--border);
  padding: 18px 22px;
}
.add-form-grid {
  display: grid;
  gap: 10px;
  grid-template-columns: 1fr;
}
@media (min-width: 720px) {
  .add-form.svc-form .add-form-grid { grid-template-columns: 1.5fr 1fr 2fr 0.6fr auto; }
  .add-form.alert-form .add-form-grid { grid-template-columns: 1fr 3fr auto; }
}
.add-form input, .add-form select {
  padding: 10px 13px;
  font-size: 14px;
  font-family: inherit;
  border: 1px solid var(--border-strong);
  border-radius: var(--r-sm);
  background: var(--surface);
  color: var(--text);
  outline: none;
  transition: border-color 140ms, box-shadow 140ms;
}
.add-form input:focus, .add-form select:focus {
  border-color: var(--primary-3);
  box-shadow: 0 0 0 3px var(--primary-soft);
}
.add-form button {
  padding: 10px 20px;
  font-size: 14px; font-weight: 600;
  background: var(--text); color: white;
  border: 0; border-radius: var(--r-sm);
  white-space: nowrap;
}
.add-form button:hover { background: #1e2939; }

/* ──── ALERT LIST ──── */
.alert-list { list-style: none; margin: 0; padding: 0; }
.alert-list li {
  padding: 14px 22px;
  border-bottom: 1px solid var(--border);
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 14px;
  flex-wrap: wrap;
  gap: 8px;
}
.alert-list li:last-child { border-bottom: 0; }
.alert-kind {
  font-weight: 600; text-transform: capitalize;
  display: inline-flex; align-items: center; gap: 8px;
}
.alert-kind::before {
  content: ''; width: 8px; height: 8px; border-radius: 50%; background: var(--ok);
}
.alert-target {
  color: var(--muted);
  font-family: 'JetBrains Mono', ui-monospace, monospace;
  font-size: 12.5px;
  word-break: break-all;
}

/* ──── BOTTOM NAV (MOBILE) ──── */
.bottom-nav {
  position: fixed; bottom: 0; left: 0; right: 0;
  background: rgba(255,255,255,.92);
  backdrop-filter: saturate(180%) blur(12px);
  border-top: 1px solid var(--border);
  display: flex; justify-content: space-around;
  padding: 8px 0 calc(8px + env(safe-area-inset-bottom));
  z-index: 40;
}
@media (min-width: 880px) { .bottom-nav { display: none; } }
.bottom-nav a {
  flex: 1;
  display: flex; flex-direction: column; align-items: center; gap: 2px;
  padding: 4px 8px;
  font-size: 11px; font-weight: 500; color: var(--muted);
}
.bottom-nav a.active { color: var(--primary); }
.bottom-nav svg { width: 20px; height: 20px; }

/* ──── HELPERS ──── */
.muted { color: var(--muted); }
.mt-0 { margin-top: 0; }
`;

const ICONS = {
  home: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg>',
  bell: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>',
  cloud: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M17.5 19a4.5 4.5 0 1 0-3-7.9A6 6 0 0 0 3 12a4 4 0 0 0 4 4h10.5z"/></svg>',
  settings: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/></svg>',
  zap: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>',
  plus: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>',
};

export async function handleDash(req: Request, env: Env): Promise<Response> {
  const user = await getUserFromCookie(req, env);
  if (!user) return new Response(null, { status: 302, headers: { location: "/" } });

  const services = await env.DB.prepare(
    "SELECT id, kind, label, threshold_pct, last_check, last_usage_pct, last_status FROM services WHERE user_id = ? ORDER BY created_at"
  ).bind(user.id).all();

  const channels = await env.DB.prepare(
    "SELECT id, kind, target FROM alert_channels WHERE user_id = ? AND enabled = 1"
  ).bind(user.id).all();

  const svcCount = (services.results || []).length;
  const chnCount = (channels.results || []).length;
  const okCount = ((services.results || []) as any[]).filter(s => (s.last_status || "pending") === "ok").length;

  const planBadge = user.plan === "pro"
    ? '<span class="badge pro">★ Pro</span>'
    : '<span class="badge free">Free plan</span>';

  const upgradeBlock = user.plan === "free" && env.LS_CHECKOUT_URL
    ? `<div class="upgrade">
        <div class="upgrade-text">
          <h3>You're on the Free plan</h3>
          <p>Upgrade to Pro for unlimited services, hourly polling, Discord + Telegram alerts, and 30-day history.</p>
        </div>
        <a href="${env.LS_CHECKOUT_URL}?checkout[email]=${encodeURIComponent(user.email)}&checkout[custom][user_id]=${user.id}" class="btn-up">Upgrade · $5/mo →</a>
      </div>`
    : "";

  const svcRows = ((services.results || []) as any[]).map(s => {
    const usage = typeof s.last_usage_pct === "number" ? s.last_usage_pct : null;
    const status = (s.last_status || "pending").toLowerCase();
    const barClass = status === "ok" ? "" : (status === "warning" || status === "warn" ? "warn" : (status === "critical" || status === "error" ? "crit" : ""));
    const barWidth = usage === null ? 0 : Math.min(100, Math.max(0, usage));
    const lastCheck = s.last_check
      ? new Date(s.last_check * 1000).toUTCString().replace(/^\w+, /, "").replace(" GMT", "")
      : "Never";
    return `<li>
      <div class="svc-name">${s.label}<small>${s.kind}</small></div>
      <div class="svc-status"><span class="status-pill ${status}">${status}</span></div>
      <div class="svc-bar-wrap">
        <div class="svc-bar ${barClass}"><span style="width:${barWidth}%"></span></div>
        <span class="svc-bar-pct">${usage === null ? "—" : usage + "%"}</span>
      </div>
      <div class="svc-time">${lastCheck}</div>
    </li>`;
  }).join("");

  const chans = ((channels.results || []) as any[]).map(c =>
    `<li>
      <span class="alert-kind">${c.kind}</span>
      <span class="alert-target">${c.target}</span>
    </li>`
  ).join("");

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Dashboard — FreeTier Sentinel</title>
<meta name="theme-color" content="#1e40af">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
<style>${CSS}</style>
${analyticsBeacon(env.CF_BEACON_TOKEN)}
</head>
<body>
<div class="app">

  <aside class="side">
    <a href="/" class="brand"><span class="brand-logo">F</span> FreeTier Sentinel</a>
    <div class="side-section">Workspace</div>
    <a href="/dash" class="side-link active">${ICONS.home} Overview</a>
    <a href="#services" class="side-link">${ICONS.cloud} Services <span style="margin-left:auto;font-size:12px;color:var(--muted)">${svcCount}</span></a>
    <a href="#alerts" class="side-link">${ICONS.bell} Alerts <span style="margin-left:auto;font-size:12px;color:var(--muted)">${chnCount}</span></a>
    <div class="side-section">Account</div>
    <a href="/" class="side-link">${ICONS.settings} Sign out</a>
    <div class="side-foot">
      <div class="side-user">
        <div class="em">${user.email}</div>
        <div class="pl">${user.plan === "pro" ? "★ Pro plan" : "Free plan"}</div>
      </div>
    </div>
  </aside>

  <main>
    <div class="topbar">
      <a href="/" class="topbar-mobile-brand"><span class="brand-logo">F</span> FreeTier Sentinel</a>
      <div class="greeting">
        <h1>Welcome back</h1>
        <p>${user.email} · ${svcCount} service${svcCount === 1 ? "" : "s"} monitored</p>
      </div>
      ${planBadge}
    </div>

    ${upgradeBlock}

    <div class="stats">
      <div class="stat">
        <p class="label">Services</p>
        <div class="value">${svcCount}</div>
        <div class="delta">${user.plan === "pro" ? "Unlimited on Pro" : `${svcCount}/3 on Free`}</div>
      </div>
      <div class="stat">
        <p class="label">Healthy</p>
        <div class="value" style="color:var(--ok)">${okCount}</div>
        <div class="delta">${svcCount - okCount > 0 ? `${svcCount - okCount} need attention` : "All good"}</div>
      </div>
      <div class="stat">
        <p class="label">Polling</p>
        <div class="value">${user.plan === "pro" ? "1h" : "12h"}</div>
        <div class="delta">${user.plan === "pro" ? "Hourly checks" : "Every 12 hours"}</div>
      </div>
    </div>

    ${(() => {
      const url = new URL(req.url);
      const checked = url.searchParams.get("checked");
      const alertSent = url.searchParams.get("alert_sent");
      if (checked !== null) {
        return `<div style="margin:0 0 18px;padding:12px 16px;background:#dcfce7;border:1px solid #86efac;border-radius:12px;color:#166534;font-size:14px">✓ Polled ${checked} service${checked === "1" ? "" : "s"} just now. Refresh to see updated usage.</div>`;
      }
      if (alertSent === "1") {
        return `<div style="margin:0 0 18px;padding:12px 16px;background:#dbeafe;border:1px solid #93c5fd;border-radius:12px;color:#1e3a8a;font-size:14px">✓ Test alert sent to ${user.email}. Check your inbox (and spam folder).</div>`;
      }
      return "";
    })()}

    <section class="section" id="services">
      <div class="section-head">
        <h2>Services</h2>
        <span style="display:flex;gap:10px;align-items:center">
          <span class="count">${svcCount} connected</span>
          ${svcCount > 0 ? `<form method="POST" action="/api/check-now" style="margin:0"><button type="submit" style="padding:7px 14px;font-size:13px;font-weight:600;background:var(--surface);color:var(--text);border:1px solid var(--border-strong);border-radius:8px;cursor:pointer;font-family:inherit">↻ Check now</button></form>` : ""}
        </span>
      </div>
      <div class="card">
        ${svcRows
          ? `<ul class="svc-list">${svcRows}</ul>`
          : `<div class="empty">
              <div class="empty-icon">${ICONS.cloud}</div>
              <h3>No services yet</h3>
              <p>Connect your first SaaS below to start monitoring its free-tier usage.</p>
            </div>`}
        <form class="add-form svc-form" method="POST" action="/api/services">
          <div class="add-form-grid">
            <input name="label" placeholder="Label (e.g. My Cloudflare account)" required>
            <select name="kind">
              <option value="cloudflare">Cloudflare</option>
              <option value="github">GitHub Actions</option>
              <option value="vercel">Vercel</option>
              <option value="supabase">Supabase (soon)</option>
              <option value="resend">Resend (soon)</option>
            </select>
            <input name="api_key" placeholder="Read-only API token" required>
            <input name="threshold" type="number" value="80" min="1" max="99" title="Alert threshold (%)">
            <button>Add</button>
          </div>
        </form>
      </div>
    </section>

    <section class="section" id="alerts">
      <div class="section-head">
        <h2>Alert channels</h2>
        <span style="display:flex;gap:10px;align-items:center">
          <span class="count">${chnCount} active</span>
          <form method="POST" action="/api/test-alert" style="margin:0"><button type="submit" style="padding:7px 14px;font-size:13px;font-weight:600;background:var(--surface);color:var(--text);border:1px solid var(--border-strong);border-radius:8px;cursor:pointer;font-family:inherit">✉ Send test alert</button></form>
        </span>
      </div>
      <div class="card">
        ${chans
          ? `<ul class="alert-list">${chans}</ul>`
          : `<div class="empty">
              <div class="empty-icon">${ICONS.bell}</div>
              <h3>No alert channels</h3>
              <p>Add at least one channel below — we'll send a notification when any service trips its threshold.</p>
            </div>`}
        <form class="add-form alert-form" method="POST" action="/api/alerts">
          <div class="add-form-grid">
            <select name="kind">
              <option value="email">Email</option>
              <option value="discord">Discord webhook</option>
              <option value="telegram">Telegram</option>
            </select>
            <input name="target" placeholder="Email address or webhook URL" required>
            <button>Add</button>
          </div>
        </form>
      </div>
    </section>
  </main>

  <nav class="bottom-nav">
    <a href="/dash" class="active">${ICONS.home} Home</a>
    <a href="#services">${ICONS.cloud} Services</a>
    <a href="#alerts">${ICONS.bell} Alerts</a>
    <a href="/">${ICONS.settings} Sign out</a>
  </nav>

</div>
</body></html>`;

  return new Response(html, { headers: { "content-type": "text/html; charset=utf-8" } });
}
