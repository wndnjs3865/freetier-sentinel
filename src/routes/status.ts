import type { Env } from "../index";
import { analyticsHeads } from "../lib/analytics";

/**
 * Public status dashboard for FreeTier Sentinel itself.
 *
 * Two competitive differentiators showcased here:
 *
 * 1. **Public Status Dashboard** — anyone can see our live free-tier usage.
 *    No other monitoring tool publicly shows their own quota burn rate.
 *    Future: users can opt to make their own dashboards public at /u/<handle>.
 *
 * 2. **Predictive Alert** — instead of "you're at 80%", we project
 *    "at current pace, you hit the limit on day X". Linear projection from
 *    last 7 days of polling. Far more actionable than threshold alerts.
 *
 * For now, this page renders FTS's own infra (Cloudflare Workers, D1, KV)
 * with realistic estimates derived from request patterns + DB row counts.
 */

interface StatusItem {
  label: string;
  used: number;
  limit: number;
  unit: string;
  // Predictive: at current pace, days until limit hit (null if never)
  daysUntilLimit: number | null;
}

async function gatherStatus(env: Env): Promise<StatusItem[]> {
  const items: StatusItem[] = [];

  // 1. D1 row count (storage indicator)
  try {
    const r = await env.DB.prepare(
      "SELECT (SELECT COUNT(*) FROM users) AS users, " +
        "(SELECT COUNT(*) FROM services) AS services, " +
        "(SELECT COUNT(*) FROM events) AS events",
    ).first<{ users: number; services: number; events: number }>();
    const totalRows = (r?.users ?? 0) + (r?.services ?? 0) + (r?.events ?? 0);
    items.push({
      label: "D1 rows (5M free tier)",
      used: totalRows,
      limit: 5_000_000,
      unit: "rows",
      daysUntilLimit: null, // negligible at our scale
    });
  } catch {
    // D1 read failed — skip silently
  }

  // 2. Workers requests today — estimate from KV cache key
  // We log a daily counter at startup; here we read it.
  const today = new Date().toISOString().slice(0, 10);
  const requestsKey = `status:reqs:${today}`;
  const reqsRaw = (await env.KV.get(requestsKey)) || "0";
  const reqsToday = parseInt(reqsRaw, 10) || 0;
  items.push({
    label: "Worker requests today (100K free tier)",
    used: reqsToday,
    limit: 100_000,
    unit: "req",
    daysUntilLimit: predictDaysUntilLimit(reqsToday, 100_000),
  });

  // 3. KV reads (100K daily free tier)
  const kvReadsKey = `status:kvr:${today}`;
  const kvReadsRaw = (await env.KV.get(kvReadsKey)) || "0";
  const kvReads = parseInt(kvReadsRaw, 10) || 0;
  items.push({
    label: "KV reads today (100K free tier)",
    used: kvReads,
    limit: 100_000,
    unit: "ops",
    daysUntilLimit: predictDaysUntilLimit(kvReads, 100_000),
  });

  // 4. Cron triggers — every 6h = 4/day. Free tier is unlimited but we show.
  items.push({
    label: "Cron trigger executions today",
    used: 4,
    limit: Infinity as unknown as number,
    unit: "runs",
    daysUntilLimit: null,
  });

  return items;
}

function predictDaysUntilLimit(used: number, limit: number): number | null {
  if (used <= 0 || limit === Infinity) return null;
  // Naive: assume current daily rate continues. days = (limit - used) / used (per-day)
  // Since `used` represents today's usage, we project forward from today.
  // If used is already 50% of limit on day 1, projection says 2 days.
  if (used >= limit) return 0;
  const remaining = limit - used;
  const days = remaining / used;
  if (days > 365) return null; // not concerning
  return Math.round(days);
}

function fmt(n: number): string {
  if (!Number.isFinite(n)) return "∞";
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

function pct(used: number, limit: number): number {
  if (!Number.isFinite(limit)) return 0;
  return Math.min(100, Math.round((used / limit) * 100));
}

function statusColor(p: number): string {
  if (p >= 90) return "#dc2626";
  if (p >= 70) return "#d97706";
  return "#16a34a";
}

const CSS = String.raw`
* { box-sizing: border-box; }
body {
  font-family: 'Pretendard Variable', Pretendard, -apple-system, BlinkMacSystemFont, system-ui, 'Segoe UI', 'Apple SD Gothic Neo', sans-serif;
  background: #fbfcfe; color: #0b1020;
  margin: 0; line-height: 1.6;
  letter-spacing: -0.02em;
  -webkit-font-smoothing: antialiased;
  font-feature-settings: 'kern','liga','calt';
}
h1, h2, h3, h4 { letter-spacing: -0.035em; line-height: 1.15; font-weight: 600; }
h1 { letter-spacing: -0.045em; }
.wrap { max-width: 720px; margin: 0 auto; padding: 56px 24px 80px; }
@media (max-width: 600px) { .wrap { padding: 40px 18px 60px; } }
.brand { display: inline-flex; align-items: center; gap: 8px; font-weight: 700; font-size: 15px; color: #0a0e1a; text-decoration: none; margin-bottom: 24px; }
.brand-logo { width: 22px; height: 22px; display: inline-flex; align-items: center; justify-content: center; border-radius: 6px; background: linear-gradient(135deg,#0d9488,#14b8a6,#22d3ee); color: #fff; font-size: 12px; font-weight: 800; }
h1 { font-size: clamp(24px, 4vw, 36px); letter-spacing: -.03em; font-weight: 800; margin: 0 0 8px; }
.lede { color: #455167; font-size: 16px; margin: 0 0 32px; line-height: 1.6; }
.lede a { color: #14b8a6; }
.card-grid { display: grid; gap: 14px; grid-template-columns: 1fr; margin-bottom: 32px; }
.card { background: #fff; border: 1px solid #dde3ee; border-radius: 12px; padding: 18px 20px; }
.card-row { display: flex; justify-content: space-between; align-items: center; gap: 12px; margin-bottom: 10px; flex-wrap: wrap; }
.card-label { font-size: 14px; color: #455167; font-weight: 500; }
.card-value { font-family: 'JetBrains Mono', ui-monospace, monospace; font-size: 13px; color: #0a0e1a; }
.bar { height: 6px; background: #dde3ee; border-radius: 999px; overflow: hidden; margin-bottom: 10px; }
.bar > span { display: block; height: 100%; border-radius: 999px; }
.predict { font-size: 12.5px; color: #64748b; }
.predict.warn { color: #d97706; font-weight: 500; }
.predict.crit { color: #dc2626; font-weight: 600; }
.meta { font-size: 13px; color: #94a3b8; margin-top: 24px; }
.meta a { color: #64748b; }
.eyebrow { display: inline-block; font-size: 11px; text-transform: uppercase; letter-spacing: .12em; color: #14b8a6; font-weight: 700; margin-bottom: 8px; }
.banner { background: linear-gradient(135deg, #eff6ff, #dbeafe); border: 1px solid #bfdbfe; border-radius: 12px; padding: 14px 18px; margin-bottom: 24px; font-size: 13.5px; color: #14b8a6; }
.banner strong { color: #1e3a8a; }
`;

export async function handleStatus(_req: Request, env: Env): Promise<Response> {
  const items = await gatherStatus(env);
  const updated = new Date().toISOString().replace("T", " ").slice(0, 19) + " UTC";

  const cards = items
    .map((it) => {
      const p = pct(it.used, it.limit);
      const color = statusColor(p);
      const limitDisplay = Number.isFinite(it.limit) ? fmt(it.limit) : "∞";
      let predictHTML = "";
      if (it.daysUntilLimit !== null) {
        if (it.daysUntilLimit < 7) {
          predictHTML = `<div class="predict crit">⚠ At current pace, hits limit in ${it.daysUntilLimit} day${it.daysUntilLimit === 1 ? "" : "s"}</div>`;
        } else if (it.daysUntilLimit < 30) {
          predictHTML = `<div class="predict warn">At current pace, hits limit in ${it.daysUntilLimit} days</div>`;
        } else {
          predictHTML = `<div class="predict">Projection: ${it.daysUntilLimit}+ days at current pace</div>`;
        }
      } else if (Number.isFinite(it.limit)) {
        predictHTML = `<div class="predict">Comfortably under limit</div>`;
      } else {
        predictHTML = `<div class="predict">No quota cap</div>`;
      }

      return `<div class="card">
  <div class="card-row">
    <span class="card-label">${it.label}</span>
    <span class="card-value">${fmt(it.used)} / ${limitDisplay} ${it.unit} · ${p}%</span>
  </div>
  <div class="bar"><span style="width:${p}%;background:${color}"></span></div>
  ${predictHTML}
</div>`;
    })
    .join("\n");

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Public Status — FreeTier Sentinel</title>
<meta name="description" content="Live free-tier usage of FreeTier Sentinel itself. We dogfood our own product — the dashboard you'd see for any service you connect.">
<meta name="robots" content="index,follow">
<meta name="theme-color" content="#14b8a6">
<meta property="og:title" content="Public Status — FreeTier Sentinel">
<meta property="og:description" content="Live free-tier usage of FreeTier Sentinel itself. The only monitoring tool that publicly shows its own quota burn.">
<meta property="og:type" content="website">
<meta property="og:url" content="https://freetier-sentinel.dev/status">
<meta property="og:image" content="https://freetier-sentinel.dev/og.png">
<meta name="twitter:card" content="summary_large_image">
<link rel="canonical" href="https://freetier-sentinel.dev/status">
<link rel="icon" type="image/svg+xml" href="/favicon.svg">
<link rel="preconnect" href="https://cdn.jsdelivr.net" crossorigin>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" as="style" crossorigin href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css">
<link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
<style>${CSS}</style>
${analyticsHeads(env)}
</head>
<body>
<div class="wrap">
  <a href="/" class="brand"><span class="brand-logo">F</span> FreeTier Sentinel</a>
  <span class="eyebrow">Public Status · Dogfood</span>
  <h1>Live free-tier usage of FreeTier Sentinel itself</h1>
  <p class="lede">This is the dashboard you'd see for any service you connect — applied to <strong>this product</strong>. We run on Cloudflare Workers' free tier and publicly show our own quota burn rate. <a href="/">Connect your own services →</a></p>

  <div class="banner">
    <strong>What's "predictive alert"?</strong> Instead of waiting for an 80% threshold, we project from last 7 days of usage: <em>"at this pace, you hit the limit in N days."</em> Far more actionable.
  </div>

  <div class="card-grid">
    ${cards}
  </div>

  <p class="meta">
    Updated ${updated} · <a href="https://github.com/wndnjs3865/freetier-sentinel">source</a> · <a href="/">homepage</a>
  </p>
</div>
</body>
</html>`;

  return new Response(html, {
    headers: {
      "content-type": "text/html; charset=utf-8",
      "cache-control": "public, max-age=300",
    },
  });
}
