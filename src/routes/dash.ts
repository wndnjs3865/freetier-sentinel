import type { Env } from "../index";
import { getUserFromCookie } from "./auth";

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

  const planBadge = user.plan === "pro" ? "★ Pro" : "Free";
  const upgradeBlock = user.plan === "free"
    ? `<a href="https://buy.stripe.com/REPLACE_LINK?prefilled_email=${encodeURIComponent(user.email)}" class="btn">Upgrade to Pro · $5/mo</a>`
    : "";

  const rows = ((services.results || []) as any[]).map(s =>
    `<tr><td>${s.label}</td><td>${s.kind}</td><td>${s.last_usage_pct ?? "—"}%</td><td>${s.last_status ?? "—"}</td><td>${s.last_check ? new Date(s.last_check * 1000).toISOString() : "—"}</td></tr>`
  ).join("");

  const chans = ((channels.results || []) as any[]).map(c =>
    `<li>${c.kind}: ${c.target}</li>`
  ).join("");

  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Dashboard</title>
<style>body{font-family:system-ui;max-width:760px;margin:2rem auto;padding:0 1rem}table{border-collapse:collapse;width:100%}th,td{border:1px solid #ddd;padding:.4rem .6rem}.btn{display:inline-block;padding:.5rem 1rem;background:#0a66c2;color:#fff;border-radius:6px;text-decoration:none}</style>
</head><body>
<h1>Dashboard <small>${planBadge}</small></h1>
<p>Hi ${user.email}.</p>
${upgradeBlock}
<h2>Services (${(services.results || []).length})</h2>
<table><thead><tr><th>Label</th><th>Kind</th><th>Usage</th><th>Status</th><th>Last check</th></tr></thead><tbody>${rows || "<tr><td colspan='5'>No services yet.</td></tr>"}</tbody></table>
<form method="POST" action="/api/services">
  <h3>Add a service</h3>
  <input name="label" placeholder="My Cloudflare account" required>
  <select name="kind">
    <option value="cloudflare">Cloudflare</option>
    <option value="github">GitHub Actions</option>
    <option value="vercel">Vercel</option>
    <option value="supabase">Supabase</option>
    <option value="resend">Resend</option>
  </select>
  <input name="api_key" placeholder="API token (read-only)" required>
  <input name="threshold" type="number" value="80" min="50" max="95">
  <button>Add</button>
</form>
<h2>Alert channels</h2>
<ul>${chans || "<li>None</li>"}</ul>
<form method="POST" action="/api/alerts">
  <select name="kind"><option value="email">Email</option><option value="discord">Discord webhook</option><option value="telegram">Telegram</option></select>
  <input name="target" placeholder="email or webhook URL" required>
  <button>Add channel</button>
</form>
</body></html>`;

  return new Response(html, { headers: { "content-type": "text/html; charset=utf-8" } });
}
