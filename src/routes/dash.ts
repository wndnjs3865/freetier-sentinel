import type { Env } from "../index";
import { getUserFromCookie } from "./auth";

const DASH_CSS = `
:root{--primary:#1e40af;--primary-dark:#1e3a8a;--primary-light:#dbeafe;--accent:#fb923c;--bg:#fafafa;--surface:#fff;--text:#0f172a;--muted:#64748b;--border:#e2e8f0;--border-strong:#cbd5e1;--ok:#16a34a;--warn:#d97706;--err:#dc2626;--radius:8px;--radius-lg:14px;--shadow:0 1px 2px rgba(15,23,42,.05);}
*{box-sizing:border-box}
body{font-family:'Inter',-apple-system,BlinkMacSystemFont,system-ui,sans-serif;background:var(--bg);color:var(--text);margin:0;line-height:1.6;-webkit-font-smoothing:antialiased}
a{color:var(--primary);text-decoration:none}a:hover{text-decoration:underline}
.container{max-width:920px;margin:0 auto;padding:0 24px}
.nav{padding:18px 0;background:rgba(255,255,255,.85);backdrop-filter:saturate(140%) blur(8px);border-bottom:1px solid var(--border);position:sticky;top:0;z-index:10}
.nav-inner{display:flex;justify-content:space-between;align-items:center}
.brand{font-weight:700;letter-spacing:-0.01em;font-size:17px;color:var(--text)}
.brand .dot{color:var(--accent)}
.nav-actions{display:flex;align-items:center;gap:18px}
.nav-actions span{font-size:14px;color:var(--muted)}
.badge{display:inline-flex;align-items:center;padding:3px 10px;border-radius:999px;font-size:12px;font-weight:600;letter-spacing:.02em}
.badge.free{background:#f1f5f9;color:var(--muted)}
.badge.pro{background:linear-gradient(135deg,#1e40af,#3b82f6);color:white}
.page-head{padding:40px 0 12px}
.page-head h1{font-size:32px;letter-spacing:-0.025em;font-weight:700;margin:0 0 6px}
.page-head .greet{color:var(--muted);margin:0;font-size:15px}
.upgrade-card{margin:24px 0 8px;background:linear-gradient(135deg,#eef2ff,#dbeafe);border:1px solid var(--primary-light);border-radius:var(--radius-lg);padding:24px;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:14px}
.upgrade-card h3{margin:0 0 4px;font-size:18px;font-weight:700}
.upgrade-card p{margin:0;color:var(--muted);font-size:14px}
.btn{display:inline-flex;align-items:center;justify-content:center;padding:11px 20px;border-radius:var(--radius);font-weight:600;font-size:15px;border:0;cursor:pointer;font-family:inherit;transition:background 120ms,transform 80ms}
.btn-primary{background:var(--primary);color:white}
.btn-primary:hover{background:var(--primary-dark);text-decoration:none}
.btn-secondary{background:var(--surface);color:var(--text);border:1px solid var(--border-strong)}
.btn-secondary:hover{background:#f8fafc;text-decoration:none}
section{margin:32px 0}
.section-head{display:flex;justify-content:space-between;align-items:center;margin-bottom:14px}
.section-head h2{font-size:18px;font-weight:700;margin:0;letter-spacing:-0.01em}
.section-head .count{color:var(--muted);font-size:14px;font-weight:500}
.card{background:var(--surface);border:1px solid var(--border);border-radius:var(--radius-lg);box-shadow:var(--shadow);overflow:hidden}
.empty{padding:32px 24px;text-align:center;color:var(--muted);font-size:14px}
table{width:100%;border-collapse:collapse;font-size:14px}
th,td{padding:12px 16px;border-bottom:1px solid var(--border);text-align:left;vertical-align:middle}
th{background:#f8fafc;font-weight:600;color:var(--muted);font-size:12px;text-transform:uppercase;letter-spacing:.04em}
tr:last-child td{border-bottom:0}
.status-pill{display:inline-block;padding:2px 8px;border-radius:999px;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.04em}
.status-ok{background:#dcfce7;color:var(--ok)}
.status-warn{background:#fef3c7;color:var(--warn)}
.status-err{background:#fee2e2;color:var(--err)}
form.add-form{padding:20px 24px;border-top:1px solid var(--border);display:grid;gap:12px;grid-template-columns:1fr;background:#fafafa}
@media(min-width:680px){form.add-form{grid-template-columns:1.4fr 1fr 2fr 0.7fr auto}}
.add-form input,.add-form select{padding:10px 12px;font-size:14px;font-family:inherit;border:1px solid var(--border-strong);border-radius:var(--radius);background:var(--surface);color:var(--text)}
.add-form input:focus,.add-form select:focus{outline:none;border-color:var(--primary);box-shadow:0 0 0 3px var(--primary-light)}
.add-form button{padding:10px 18px;font-size:14px;font-weight:600;background:var(--primary);color:white;border:0;border-radius:var(--radius);cursor:pointer;font-family:inherit}
.add-form button:hover{background:var(--primary-dark)}
.alert-list{padding:8px 0}
.alert-list li{padding:10px 24px;border-bottom:1px solid var(--border);display:flex;justify-content:space-between;align-items:center;font-size:14px;list-style:none}
.alert-list li:last-child{border-bottom:0}
.alert-kind{font-weight:600}
.alert-target{color:var(--muted);font-family:'JetBrains Mono',ui-monospace,monospace;font-size:13px}
.muted{color:var(--muted)}
footer{padding:40px 0 60px;color:var(--muted);font-size:13px;text-align:center}
`;

export async function handleDash(req: Request, env: Env): Promise<Response> {
  const user = await getUserFromCookie(req, env);
  if (!user) {
    return new Response(null, { status: 302, headers: { location: "/" } });
  }

  const services = await env.DB.prepare(
    "SELECT id, kind, label, threshold_pct, last_check, last_usage_pct, last_status FROM services WHERE user_id = ? ORDER BY created_at"
  ).bind(user.id).all();

  const channels = await env.DB.prepare(
    "SELECT id, kind, target FROM alert_channels WHERE user_id = ? AND enabled = 1"
  ).bind(user.id).all();

  const planBadge = user.plan === "pro"
    ? '<span class="badge pro">★ Pro</span>'
    : '<span class="badge free">Free</span>';

  const upgradeBlock = user.plan === "free" && env.STRIPE_PAYMENT_LINK
    ? `<div class="upgrade-card">
         <div>
           <h3>Upgrade to Pro</h3>
           <p>Unlimited services · 1-hour checks · Discord + Telegram alerts · 30-day history</p>
         </div>
         <a href="${env.STRIPE_PAYMENT_LINK}?prefilled_email=${encodeURIComponent(user.email)}" class="btn btn-primary">Upgrade · $5/mo →</a>
       </div>`
    : "";

  const svcRows = ((services.results || []) as any[]).map(s => {
    const usage = s.last_usage_pct ?? "—";
    const lastCheck = s.last_check
      ? new Date(s.last_check * 1000).toUTCString().replace(/^\w+, /, "").replace(" GMT", " UTC")
      : "Never";
    const status = s.last_status || "pending";
    const statusClass = status === "ok" ? "status-ok" : (status === "critical" || status === "error" ? "status-err" : "status-warn");
    return `<tr>
      <td><strong>${s.label}</strong></td>
      <td><span class="muted">${s.kind}</span></td>
      <td><strong>${usage === "—" ? "—" : usage + "%"}</strong> <span class="muted" style="font-size:12px"> / ${s.threshold_pct}%</span></td>
      <td><span class="status-pill ${statusClass}">${status}</span></td>
      <td class="muted" style="font-size:13px">${lastCheck}</td>
    </tr>`;
  }).join("");

  const chans = ((channels.results || []) as any[]).map(c =>
    `<li><span class="alert-kind">${c.kind}</span> <span class="alert-target">${c.target}</span></li>`
  ).join("");

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Dashboard — FreeTier Sentinel</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400&display=swap" rel="stylesheet">
<style>${DASH_CSS}</style>
</head>
<body>

<nav class="nav">
  <div class="container nav-inner">
    <a href="/" class="brand">FreeTier<span class="dot">•</span>Sentinel</a>
    <div class="nav-actions">
      <span>${user.email}</span>
      ${planBadge}
    </div>
  </div>
</nav>

<div class="container">
  <div class="page-head">
    <h1>Dashboard</h1>
    <p class="greet">Monitoring ${(services.results || []).length} service${(services.results || []).length === 1 ? "" : "s"}.</p>
  </div>

  ${upgradeBlock}

  <section>
    <div class="section-head">
      <h2>Services</h2>
      <span class="count">${(services.results || []).length} connected</span>
    </div>
    <div class="card">
      ${svcRows
        ? `<table><thead><tr><th>Label</th><th>Kind</th><th>Usage</th><th>Status</th><th>Last check</th></tr></thead><tbody>${svcRows}</tbody></table>`
        : `<div class="empty">No services yet. Add one below to start monitoring.</div>`
      }
      <form class="add-form" method="POST" action="/api/services">
        <input name="label" placeholder="Label (e.g. My Cloudflare account)" required>
        <select name="kind">
          <option value="cloudflare">Cloudflare</option>
          <option value="github">GitHub Actions</option>
          <option value="vercel">Vercel (soon)</option>
          <option value="supabase">Supabase (soon)</option>
          <option value="resend">Resend (soon)</option>
        </select>
        <input name="api_key" placeholder="API token (read-only)" required>
        <input name="threshold" type="number" value="80" min="50" max="95" title="Alert threshold (%)">
        <button>Add service</button>
      </form>
    </div>
  </section>

  <section>
    <div class="section-head">
      <h2>Alert channels</h2>
      <span class="count">${(channels.results || []).length} active</span>
    </div>
    <div class="card">
      ${chans ? `<ul class="alert-list">${chans}</ul>` : `<div class="empty">No alert channels yet. Add one below.</div>`}
      <form class="add-form" method="POST" action="/api/alerts">
        <select name="kind">
          <option value="email">Email</option>
          <option value="discord">Discord webhook</option>
          <option value="telegram">Telegram</option>
        </select>
        <input name="target" placeholder="Email address or webhook URL" required style="grid-column:span 3">
        <button>Add channel</button>
      </form>
    </div>
  </section>
</div>

<footer>FreeTier Sentinel · <a href="https://github.com/wndnjs3865/freetier-sentinel">source</a></footer>

</body>
</html>`;

  return new Response(html, { headers: { "content-type": "text/html; charset=utf-8" } });
}
