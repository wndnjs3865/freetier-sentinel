/**
 * /security — security overview page.
 *
 * Restates the security posture from existing FAQ + terms in one auditable
 * doc. Pattern adopted from Healthchecks.io / Better Stack /security pages.
 * Light theme matched to root.ts (was dark — caused theme inconsistency).
 */
import type { Env } from "../index";
import { analyticsHeads } from "../lib/analytics";

export async function handleSecurity(_req: Request, env: Env): Promise<Response> {
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Security — FreeTier Sentinel</title>
<meta name="description" content="How FreeTier Sentinel handles your API tokens, payment data, and identity. Open source, AES-256-GCM, magic-link auth, PCI DSS Level 1 payments via Polar/Stripe.">
<meta name="robots" content="index, follow">
<meta name="theme-color" content="#14b8a6">
<meta property="og:title" content="Security — FreeTier Sentinel">
<meta property="og:description" content="Your cloud credentials never leave the bank vault. AES-256-GCM, read-only tokens, MIT-licensed, full subprocessor list.">
<meta property="og:type" content="article">
<meta property="og:url" content="https://freetier-sentinel.dev/security">
<meta property="og:image" content="https://freetier-sentinel.dev/og.png">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:image" content="https://freetier-sentinel.dev/og.png">
<link rel="canonical" href="https://freetier-sentinel.dev/security">
<link rel="icon" type="image/svg+xml" href="/favicon.svg">
<link rel="preconnect" href="https://cdn.jsdelivr.net" crossorigin>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" as="style" crossorigin href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css">
<link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
<style>
  :root {
    /* Brand-aligned palette (matches root.ts) — subtle blue keying. */
    --bg: #f4f7fc; --surface: #fff; --surface-2: #eef3fa;
    --text: #0a0e1a; --text-2: #455167; --muted: #64748b;
    --border: #dde3ee; --border-strong: #c8d1de;
    --primary: #14b8a6; --primary-2: #0d9488; --primary-soft: #ccfbf1;
    --ok: #16a34a; --ok-soft: #dcfce7; --warn: #d97706; --crit: #dc2626; --crit-soft: #fee2e2;
    --r-md: 12px; --r-lg: 16px;
    --shadow-xs: 0 1px 2px rgba(20,184,166,.05);
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
  code { background: var(--surface-2); border: 1px solid var(--border); padding: 1px 7px; border-radius: 5px; font-family: 'JetBrains Mono', ui-monospace, monospace; font-size: 13.5px; color: var(--text); }

  .crumbs { font-size: 13.5px; color: var(--muted); padding: 28px 24px 0; max-width: 760px; margin: 0 auto; display: flex; gap: 10px; align-items: center; }
  .crumbs a { color: var(--text-2); }
  .crumbs a:hover { color: var(--text); }
  .crumbs .sep { color: var(--border-strong); }

  .wrap { max-width: 760px; margin: 0 auto; padding: 24px 24px 100px; }

  .eyebrow { display: inline-flex; align-items: center; gap: 8px; padding: 5px 12px; background: var(--ok-soft); color: #166534; border-radius: 999px; font-size: 12px; font-weight: 700; letter-spacing: .04em; text-transform: uppercase; margin-bottom: 18px; }
  .eyebrow::before { content: ''; width: 6px; height: 6px; background: var(--ok); border-radius: 50%; }

  h1 { font-size: clamp(30px, 4.5vw, 40px); line-height: 1.15; letter-spacing: -.025em; margin: 0 0 16px; font-weight: 700; }
  .lede { font-size: 17px; color: var(--text-2); margin: 0 0 40px; max-width: 600px; line-height: 1.6; }

  h2 { font-size: 22px; letter-spacing: -.02em; margin: 48px 0 12px; font-weight: 700; line-height: 1.25; display: flex; gap: 12px; align-items: baseline; }
  h2 .num { font-family: 'JetBrains Mono', ui-monospace, monospace; font-size: 13px; color: var(--muted); font-weight: 600; letter-spacing: .04em; }
  p, li { color: var(--text-2); }
  p { margin: 0 0 12px; line-height: 1.7; }
  ul { padding-left: 22px; margin: 14px 0 18px; }
  li { margin: 8px 0; line-height: 1.65; }
  strong { color: var(--text); font-weight: 600; }

  /* 3-column trust pillars */
  .pillars {
    display: grid; gap: 14px; grid-template-columns: 1fr;
    margin: 24px 0 32px;
  }
  @media (min-width: 720px) { .pillars { grid-template-columns: repeat(3, 1fr); } }
  .pillar {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--r-md);
    padding: 22px 22px;
    box-shadow: var(--shadow-xs);
    transition: border-color var(--t-fast);
  }
  .pillar:hover { border-color: var(--border-strong); }
  .pillar .icon {
    width: 36px; height: 36px; border-radius: 9px;
    background: var(--primary-soft); color: var(--primary);
    display: inline-flex; align-items: center; justify-content: center;
    margin-bottom: 14px;
  }
  .pillar .icon svg { width: 18px; height: 18px; }
  .pillar h3 { font-size: 15px; font-weight: 700; margin: 0 0 6px; letter-spacing: -.005em; color: var(--text); }
  .pillar p { font-size: 13.5px; color: var(--text-2); margin: 0; line-height: 1.55; }
  .pillar p code { font-size: 12px; }

  .panel {
    background: var(--surface);
    border: 1px solid var(--border);
    border-left: 3px solid var(--primary);
    border-radius: 0 var(--r-md) var(--r-md) 0;
    padding: 18px 22px;
    margin: 18px 0;
    box-shadow: var(--shadow-xs);
  }
  .panel p { margin: 0; color: var(--text); }

  .subprocessors {
    width: 100%; border-collapse: collapse;
    margin: 16px 0 24px;
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--r-md);
    overflow: hidden;
    box-shadow: var(--shadow-xs);
  }
  .subprocessors th, .subprocessors td {
    padding: 12px 16px; text-align: left;
    border-bottom: 1px solid var(--border);
    font-size: 14px;
    vertical-align: top;
  }
  .subprocessors th { background: var(--surface-2); font-weight: 700; color: var(--text); font-size: 12px; text-transform: uppercase; letter-spacing: .06em; }
  .subprocessors tr:last-child td { border-bottom: 0; }
  .subprocessors td:first-child { font-weight: 600; color: var(--text); }
  .subprocessors td.purpose { color: var(--text-2); }
  .subprocessors td.region { font-family: 'JetBrains Mono', ui-monospace, monospace; font-size: 12.5px; color: var(--muted); }

  .footnote { font-size: 13px; color: var(--muted); margin-top: 56px; padding-top: 20px; border-top: 1px solid var(--border); line-height: 1.65; }
</style>
${analyticsHeads(env)}
</head>
<body>

<div class="crumbs">
  <a href="/">FreeTier Sentinel</a>
  <span class="sep">/</span>
  <span>Security</span>
</div>

<div class="wrap">
  <span class="eyebrow">Auditable · Open source · No bullshit</span>
  <h1>Your cloud credentials never leave the bank vault.</h1>
  <p class="lede">FreeTier Sentinel is a solo-built, fully open-source SaaS. Every line of code is auditable. This page summarizes how we handle the three things that actually matter — your API tokens, your payments, and your identity.</p>

  <div class="pillars">
    <div class="pillar">
      <div class="icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg></div>
      <h3>Encryption</h3>
      <p><strong>AES-256-GCM</strong> at rest. <strong>TLS 1.3</strong> in transit. Master key in Workers Secrets, never in DB.</p>
    </div>
    <div class="pillar">
      <div class="icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/></svg></div>
      <h3>Access</h3>
      <p>We require <strong>read-only</strong> usage-scope tokens only. Tokens with write or billing scopes are explicitly rejected.</p>
    </div>
    <div class="pillar">
      <div class="icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/></svg></div>
      <h3>Compliance</h3>
      <p><strong>GDPR-aligned</strong>, EU-Frankfurt deployable. SOC 2 in progress. <strong>MIT-licensed</strong>, fully self-hostable.</p>
    </div>
  </div>

  <h2><span class="num">01</span> Your API tokens</h2>
  <p>To monitor your free-tier usage, FreeTier Sentinel needs <strong>read-only / usage-scope tokens</strong> from the cloud SaaS providers you connect (Cloudflare, Vercel, GitHub Actions, etc.). We <em>never</em> request tokens with provisioning, billing, or write permissions.</p>
  <ul>
    <li><strong>At rest</strong>: AES-256-GCM encryption in Cloudflare D1. Each token has its own IV.</li>
    <li><strong>Master key</strong>: lives in Cloudflare Workers Secrets, separate from the database. Stolen DB without the key = unreadable ciphertext.</li>
    <li><strong>In transit</strong>: TLS 1.3 to all cloud SaaS APIs.</li>
    <li><strong>In code</strong>: open source — read it yourself: <a href="https://github.com/wndnjs3865/freetier-sentinel">github.com/wndnjs3865/freetier-sentinel</a>.</li>
  </ul>

  <div class="panel"><p><strong>The clearest version of this</strong>: we cannot see your AWS root credentials, your Cloudflare account password, your GitHub OAuth refresh token, or your Vercel team-admin scope. The tokens we hold can read usage counters and nothing else.</p></div>

  <h2><span class="num">02</span> Payments</h2>
  <p>Payments are processed by <strong>Polar</strong> via <strong>Stripe Connect</strong> (PCI DSS Level 1). FreeTier Sentinel never sees, stores, or transmits card details — only Polar/Stripe ever touch them. We receive a customer ID and a webhook event ("subscription.active") signed with HMAC-SHA256 (standardwebhooks).</p>
  <ul>
    <li><strong>Card data path</strong>: your browser → Polar checkout (polar.sh) → Stripe (PCI DSS Level 1). FreeTier Sentinel is not on this path.</li>
    <li><strong>What we receive</strong>: a webhook event with a customer ID and your email, nothing more.</li>
    <li><strong>Refunds</strong>: full refund within 7 days, no questions asked. Email <a href="mailto:wndnjs3865@gmail.com">support</a>.</li>
  </ul>

  <h2><span class="num">03</span> Authentication</h2>
  <p>FreeTier Sentinel uses <strong>magic-link auth</strong> — no passwords. We email you a 6-digit code with a short TTL. There's nothing to hash, nothing to leak in a breach.</p>
  <ul>
    <li>Magic-link codes are single-use and expire in 15 minutes.</li>
    <li>Sessions are HTTP-only, Secure, SameSite=Lax cookies signed with a server-side secret. 30-day default lifetime; sign out anywhere with one click.</li>
  </ul>

  <h2><span class="num">04</span> Subprocessors</h2>
  <p>Per Plausible-style disclosure, every third-party service that touches your data:</p>
  <table class="subprocessors">
    <thead><tr><th>Subprocessor</th><th>Purpose</th><th>Region</th></tr></thead>
    <tbody>
      <tr><td>Cloudflare Workers</td><td class="purpose">App runtime (compute)</td><td class="region">Global edge</td></tr>
      <tr><td>Cloudflare D1</td><td class="purpose">Relational database</td><td class="region">Configured per account</td></tr>
      <tr><td>Cloudflare KV</td><td class="purpose">Session + short-lived state</td><td class="region">Global edge</td></tr>
      <tr><td>Polar.sh</td><td class="purpose">Billing &amp; merchant of record</td><td class="region">EU / US</td></tr>
      <tr><td>Stripe Connect</td><td class="purpose">Card processing (via Polar)</td><td class="region">Global, PCI DSS L1</td></tr>
      <tr><td>Resend</td><td class="purpose">Transactional email (alerts, magic links)</td><td class="region">US / EU</td></tr>
    </tbody>
  </table>

  <h2><span class="num">05</span> Open source</h2>
  <p>All server-side and client-side code is on GitHub: <a href="https://github.com/wndnjs3865/freetier-sentinel">wndnjs3865/freetier-sentinel</a>. License: <strong>MIT</strong>. You can self-host it for free if you don't trust the hosted version — that's the whole point of an open-source indie SaaS.</p>

  <h2><span class="num">06</span> Reporting a vulnerability</h2>
  <div class="panel"><p>Email <a href="mailto:wndnjs3865@gmail.com">wndnjs3865@gmail.com</a> with the subject <code>[security]</code>. I read security mail before everything else. Solo dev — no formal bounty program (yet), but I'll credit you publicly with permission and fix in the open. Please give me a reasonable disclosure window before publishing details.</p></div>

  <h2><span class="num">07</span> What we don't do</h2>
  <ul>
    <li>We don't have a SOC 2 report. Solo SaaS, post-launch consideration.</li>
    <li>We don't sell your data. Ever. There's no funnel for that to even exist in.</li>
    <li>We don't track you across the web. Cookies are session + auth only.</li>
  </ul>

  <p class="footnote">Last updated: 2026-05-08. If you're a security researcher and something here looks weak, please write — I'd rather hear it from you than from an attacker.</p>
</div>

</body>
</html>`;
  return new Response(html, {
    status: 200,
    headers: { "content-type": "text/html; charset=utf-8", "cache-control": "public, max-age=3600" },
  });
}
