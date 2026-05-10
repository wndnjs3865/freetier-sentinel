/**
 * /vs/datadog — comparison page positioning FreeTier Sentinel against Datadog.
 *
 * SEO + clear differentiation. Pattern adopted from Better Stack ("30x cheaper than Datadog")
 * and Plausible ("54x smaller than Google Analytics") — anchor against the enterprise
 * incumbent with a Without/With visual, then back it with a feature table.
 *
 * Tone: respect Datadog's enterprise strength, but explain why $5 indie tool is the right
 * answer for solo devs running on free tiers — not feature war, just honest positioning.
 */
import type { Env } from "../index";
import { analyticsHeads } from "../lib/analytics";

export async function handleVsDatadog(_req: Request, env: Env): Promise<Response> {
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>FreeTier Sentinel vs Datadog — which one for free-tier monitoring?</title>
<meta name="description" content="Datadog starts at $15/host/month. FreeTier Sentinel monitors free-tier usage limits across 8 cloud providers for $5/month flat. Honest comparison for indie devs.">
<meta name="robots" content="index, follow">
<meta name="theme-color" content="#14b8a6">
<meta property="og:title" content="FreeTier Sentinel vs Datadog — honest comparison">
<meta property="og:description" content="Datadog $15/host/month vs FreeTier Sentinel $5/month flat for 8 providers. Without/With visual + side-by-side feature table.">
<meta property="og:type" content="article">
<meta property="og:url" content="https://freetier-sentinel.dev/vs/datadog">
<meta property="og:image" content="https://freetier-sentinel.dev/og.png">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:image" content="https://freetier-sentinel.dev/og.png">
<link rel="canonical" href="https://freetier-sentinel.dev/vs/datadog">
<link rel="icon" type="image/svg+xml" href="/favicon.svg">
<link rel="preconnect" href="https://cdn.jsdelivr.net" crossorigin>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" as="style" crossorigin href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css">
<link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet">
<style>
  :root {
    /* Brand-aligned palette (matches root.ts) — subtle blue keying. */
    --bg: #f4f7fc; --bg-mesh: #ebf1f9; --surface: #fff; --surface-2: #eef3fa;
    --text: #0a0e1a; --text-2: #455167; --muted: #64748b;
    --border: #dde3ee; --border-strong: #c8d1de;
    --primary: #14b8a6; --primary-2: #0d9488; --primary-soft: #ccfbf1;
    --ok: #16a34a; --ok-soft: #dcfce7; --warn: #d97706; --warn-soft: #fef3c7; --crit: #dc2626; --crit-soft: #fee2e2;
    --r-sm: 8px; --r-md: 12px; --r-lg: 16px;
    --shadow-xs: 0 1px 2px rgba(20,184,166,.05);
    --shadow-md: 0 6px 24px -8px rgba(20,184,166,.10), 0 1px 0 rgba(20,184,166,.05);
    --t-fast: 140ms cubic-bezier(.4,0,.2,1);
  }
  * { box-sizing: border-box }
  body {
    margin: 0; background: var(--bg); color: var(--text);
    font-family: 'Pretendard Variable', Pretendard, -apple-system, BlinkMacSystemFont, system-ui, 'Segoe UI', 'Apple SD Gothic Neo', sans-serif;
    font-feature-settings: 'kern','liga','calt';
    font-size: 16px; line-height: 1.6;
    letter-spacing: -0.02em;
    -webkit-font-smoothing: antialiased;
  }
  h1, h2, h3, h4 { font-family: inherit; letter-spacing: -0.035em; line-height: 1.15; font-weight: 600; }
  h1 { letter-spacing: -0.045em; }
  a { color: var(--primary); text-decoration: none; }
  a:hover { color: var(--primary-2); }
  .num, code, .mono { font-family: 'JetBrains Mono', ui-monospace, monospace; font-variant-numeric: tabular-nums; }

  .crumbs { font-size: 13.5px; color: var(--muted); padding: 28px 24px 0; max-width: 920px; margin: 0 auto; display: flex; gap: 10px; align-items: center; }
  .crumbs a { color: var(--text-2); transition: color var(--t-fast); }
  .crumbs a:hover { color: var(--text); }
  .crumbs .sep { color: var(--border-strong); }

  .wrap { max-width: 920px; margin: 0 auto; padding: 24px 24px 100px; }

  .eyebrow { display: inline-flex; align-items: center; gap: 8px; padding: 5px 12px; background: var(--primary-soft); color: var(--primary); border-radius: 999px; font-size: 12px; font-weight: 700; letter-spacing: .04em; text-transform: uppercase; margin-bottom: 18px; }

  h1 { font-size: clamp(32px, 5vw, 48px); line-height: 1.1; letter-spacing: -.025em; margin: 0 0 18px; font-weight: 700; }
  h1 .strike { text-decoration: line-through; text-decoration-thickness: 2px; text-decoration-color: var(--crit); color: var(--text-2); }
  .lede { font-size: 18px; color: var(--text-2); margin: 0 0 40px; max-width: 640px; line-height: 1.55; }

  h2 { font-size: 26px; letter-spacing: -.02em; margin: 56px 0 18px; font-weight: 700; line-height: 1.2; }
  h2 + p, h2 + .compare { margin-top: 0; }
  p { color: var(--text-2); margin: 0 0 14px; line-height: 1.65; }
  p strong { color: var(--text); font-weight: 600; }

  /* Without/With 2-column visual */
  .compare {
    display: grid; gap: 16px;
    grid-template-columns: 1fr;
    margin: 28px 0 32px;
  }
  @media (min-width: 720px) { .compare { grid-template-columns: 1fr 1fr; } }
  .compare-side {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--r-lg);
    padding: 28px;
    box-shadow: var(--shadow-xs);
  }
  .compare-side.without { background: linear-gradient(180deg, #fffaf3 0%, var(--surface) 100%); border-color: #fcd34d; }
  .compare-side.with { background: linear-gradient(180deg, #f0fdf4 0%, var(--surface) 100%); border-color: #86efac; }
  .compare-side h3 {
    font-size: 12px; text-transform: uppercase; letter-spacing: .12em;
    font-weight: 700; margin: 0 0 18px;
    display: inline-flex; align-items: center; gap: 8px;
  }
  .compare-side.without h3 { color: var(--warn); }
  .compare-side.with h3 { color: var(--ok); }
  .compare-side h3::before {
    content: ''; width: 8px; height: 8px; border-radius: 50%; background: currentColor;
  }
  .compare-side ul { list-style: none; padding: 0; margin: 0; display: grid; gap: 12px; }
  .compare-side li {
    font-size: 14.5px; color: var(--text); line-height: 1.55;
    padding-left: 26px; position: relative;
  }
  .compare-side.without li::before {
    content: '×'; position: absolute; left: 0; top: -2px;
    color: var(--warn); font-weight: 700; font-size: 18px; line-height: 1;
    width: 18px; height: 18px; display: inline-flex; align-items: center; justify-content: center;
    background: var(--warn-soft); border-radius: 50%;
  }
  .compare-side.with li::before {
    content: '✓'; position: absolute; left: 0; top: -2px;
    color: var(--ok); font-weight: 700; font-size: 12px; line-height: 1;
    width: 18px; height: 18px; display: inline-flex; align-items: center; justify-content: center;
    background: var(--ok-soft); border-radius: 50%;
  }
  .compare-side .price-anchor {
    margin-top: 18px;
    padding-top: 18px;
    border-top: 1px dashed var(--border);
    font-size: 13.5px; color: var(--muted);
  }
  .compare-side .price-anchor strong {
    font-family: 'JetBrains Mono', ui-monospace, monospace;
    font-variant-numeric: tabular-nums;
    color: var(--text);
    font-weight: 600;
  }

  table { width: 100%; border-collapse: collapse; margin: 16px 0 24px; background: var(--surface); border: 1px solid var(--border); border-radius: var(--r-md); overflow: hidden; box-shadow: var(--shadow-xs); }
  th, td { padding: 14px 18px; text-align: left; border-bottom: 1px solid var(--border); font-size: 14.5px; vertical-align: top; }
  th { background: var(--surface-2); font-weight: 700; color: var(--text); font-size: 13px; text-transform: uppercase; letter-spacing: .04em; }
  td.fts { color: var(--text); font-weight: 500; background: rgba(220,252,231,.4); }
  td.fts strong { color: #166534; }
  td.dd { color: var(--text-2); }
  tr:last-child td { border-bottom: 0; }
  tr:hover td { background: var(--surface-2); }
  tr:hover td.fts { background: rgba(220,252,231,.6); }

  .quote {
    background: var(--surface);
    border: 1px solid var(--border);
    border-left: 3px solid var(--primary);
    padding: 20px 24px;
    margin: 32px 0;
    color: var(--text);
    font-size: 15.5px;
    border-radius: 0 var(--r-md) var(--r-md) 0;
    line-height: 1.65;
    box-shadow: var(--shadow-xs);
  }

  .cta-block {
    margin: 56px 0 0;
    padding: 32px 28px;
    background: linear-gradient(135deg, #0a0e1a 0%, #1e293b 100%);
    color: #fff;
    border-radius: var(--r-lg);
    display: flex; justify-content: space-between; align-items: center;
    flex-wrap: wrap; gap: 18px;
    position: relative; overflow: hidden;
  }
  .cta-block::before {
    content: ''; position: absolute; right: -80px; top: -80px;
    width: 260px; height: 260px; border-radius: 50%;
    background: radial-gradient(circle, rgba(59,130,246,.32), transparent 70%);
    pointer-events: none;
  }
  .cta-block .ct-text { position: relative; z-index: 1; }
  .cta-block h3 { margin: 0 0 4px; font-size: 20px; font-weight: 700; letter-spacing: -.015em; }
  .cta-block p { margin: 0; color: rgba(255,255,255,.78); font-size: 14.5px; }
  .cta-btn {
    display: inline-flex; align-items: center; gap: 6px;
    padding: 12px 22px;
    background: #fff; color: var(--text);
    border-radius: var(--r-sm);
    font-weight: 600; font-size: 14.5px;
    text-decoration: none;
    position: relative; z-index: 1;
    transition: transform var(--t-fast);
  }
  .cta-btn:hover { transform: translateY(-1px); color: var(--text); text-decoration: none; }

  ul.bullets { padding-left: 22px; margin: 14px 0 24px; }
  ul.bullets li { margin: 8px 0; color: var(--text-2); line-height: 1.6; }
  ul.bullets li strong { color: var(--text); }

  .footnote { font-size: 13px; color: var(--muted); margin-top: 56px; padding-top: 20px; border-top: 1px solid var(--border); line-height: 1.6; }

  @media (max-width: 600px) {
    h1 { font-size: 30px; }
    h2 { font-size: 22px; margin: 40px 0 14px; }
    .compare-side { padding: 22px 20px; }
    .cta-block { padding: 26px 22px; }
  }
</style>
${analyticsHeads(env)}
</head>
<body>

<div class="crumbs">
  <a href="/">FreeTier Sentinel</a>
  <span class="sep">/</span>
  <a href="/#features">Compare</a>
  <span class="sep">/</span>
  <span>Datadog</span>
</div>

<div class="wrap">
  <span class="eyebrow">Honest comparison · No fanboying</span>
  <h1>FreeTier Sentinel <span class="strike">$15/host</span> Datadog</h1>
  <p class="lede">Datadog is built for the enterprise SRE function. FreeTier Sentinel is for the rest of us — solo devs and indie teams running real things on free tiers, where one Cloudflare Workers cliff at 11pm is the difference between a quiet night and a 9-hour outage.</p>

  <h2>Without it vs. with it</h2>
  <p>Tomorrow at 11pm your AWS Lambda free tier hits 100%. The billing API still returns <code>200 OK</code>. Here's what each tool does about it.</p>
  <div class="compare">
    <div class="compare-side without">
      <h3>Without — the $4,200 pattern</h3>
      <ul>
        <li>You discover the cliff via a customer email at 8am</li>
        <li>You read 8 different cloud dashboards to find which limit tripped</li>
        <li>You find Cloudflare's billing API returned <code>200 OK</code> while the account was locked</li>
        <li>9-hour outage between hit and discovery</li>
        <li>No retroactive way to reconstruct the "approached 80% at X" timeline</li>
      </ul>
      <div class="price-anchor">Datadog free tier ends after <strong>14 days</strong>. Then <strong>$15/host/month</strong> base + add-ons.</div>
    </div>
    <div class="compare-side with">
      <h3>With FreeTier Sentinel</h3>
      <ul>
        <li>Email + Discord ping at 80% — usually 6-12 hours before the cliff</li>
        <li>One dashboard for all 8 providers, with the limit that's about to trip in red</li>
        <li>Catches "200 OK lies" — checks usage against published free-tier ceilings</li>
        <li>30-day usage history so the slow leaks become visible</li>
        <li>You get woken up <em>before</em> AWS sends the email, not after</li>
      </ul>
      <div class="price-anchor">Free for 3 services, polled every 12h. Pro is <strong>$5/month flat</strong> — unlimited services, hourly polling.</div>
    </div>
  </div>

  <h2>Side-by-side feature table</h2>
  <table>
    <thead><tr><th></th><th>FreeTier Sentinel</th><th>Datadog</th></tr></thead>
    <tbody>
      <tr><td>Free-tier limit monitoring (Cloudflare Workers, Vercel, Supabase, etc.)</td><td class="fts"><strong>First-class — the entire product</strong></td><td class="dd">Possible via custom metrics, not a default integration</td></tr>
      <tr><td>Pre-cliff alerts on usage thresholds</td><td class="fts">Default 80%, configurable per service</td><td class="dd">Requires custom monitor + threshold setup per service</td></tr>
      <tr><td>Pricing for solo devs</td><td class="fts"><strong>$0 free / $5 flat Pro</strong></td><td class="dd">$15+/host/month after 14-day trial</td></tr>
      <tr><td>Setup time</td><td class="fts">~5 minutes (paste read-only token, set threshold)</td><td class="dd">Hours to days for the equivalent monitor coverage</td></tr>
      <tr><td>Open source</td><td class="fts">Yes — <a href="https://github.com/wndnjs3865/freetier-sentinel">GitHub</a>, self-hostable</td><td class="dd">Closed source SaaS</td></tr>
      <tr><td>Surfaces "200 OK lies" (e.g. billing API still 200 when account locked)</td><td class="fts">Yes — that's literally why it exists</td><td class="dd">No, generic uptime checks miss this class of failure</td></tr>
      <tr><td>Discord + Telegram alerts</td><td class="fts">Pro tier, included flat</td><td class="dd">Available, configured per integration</td></tr>
      <tr><td>Polling cadence</td><td class="fts">Every 1h on Pro · every 12h on Free</td><td class="dd">Configurable, but polling cost adds up at scale</td></tr>
    </tbody>
  </table>

  <h2>When to pick Datadog instead</h2>
  <p>FreeTier Sentinel does not replace Datadog. If any of these apply, go with Datadog:</p>
  <ul class="bullets">
    <li>You have an SRE/ops team and need <strong>APM, log aggregation, and distributed tracing</strong> in one platform.</li>
    <li>You're at scale where <strong>per-host pricing is rounding error</strong> in your infra budget.</li>
    <li>You need <strong>SOC2-attested vendor</strong> and enterprise SSO/SAML on day one.</li>
    <li>Your infrastructure wouldn't fit in any cloud's free tier in the first place.</li>
  </ul>

  <h2>When FreeTier Sentinel is the right call</h2>
  <ul class="bullets">
    <li>You're <strong>solo or a small indie team</strong> running on free tiers across multiple SaaS providers.</li>
    <li>You want <strong>one alert before the cliff</strong>, not a query language to learn.</li>
    <li>You don't want to build dashboards just to know if Cloudflare Workers is about to lock you out.</li>
    <li>You want to <strong>read the source code</strong> before you pipe API tokens to anyone.</li>
  </ul>

  <div class="quote">
    "We built it for ourselves first — after losing 9 hours to a Cloudflare free-tier cliff at 11pm. The billing API still returned <code>200 OK</code> while requests were being rate-capped. Datadog wouldn't have caught this either; it's a class of failure unique to free-tier ceilings, and there's no incumbent monitoring it." — Open source on <a href="https://github.com/wndnjs3865/freetier-sentinel">GitHub</a>.
  </div>

  <div class="cta-block">
    <div class="ct-text">
      <h3>Try it free — 5 minutes to first alert</h3>
      <p>3 services free forever · No card · Pro is $5/month, cancel anytime, full refund within 7 days</p>
    </div>
    <a href="/" class="cta-btn">Start free →</a>
  </div>

  <p class="footnote">Datadog is a registered trademark of Datadog, Inc. This page is an honest comparison from a competitor at a different scale; we are not affiliated with Datadog. Pricing reflects publicly listed plans as of May 2026 and may change. Last updated: 2026-05-08.</p>
</div>

</body>
</html>`;
  return new Response(html, {
    status: 200,
    headers: { "content-type": "text/html; charset=utf-8", "cache-control": "public, max-age=3600" },
  });
}
