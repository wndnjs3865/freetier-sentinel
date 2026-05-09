import type { Env } from "../index";
import { analyticsHeads } from "../lib/analytics";

type Entry = {
  date: string;
  title: string;
  detail?: string;
  category: "feature" | "infra" | "ops" | "fix";
};

// Hand-curated, user-visible changes. Keep newest first.
// Do not log internal refactors / typo fixes — only what a user/dev would care about.
const ENTRIES: Entry[] = [
  {
    date: "2026-05-07",
    category: "infra",
    title: "Session replay analytics (Microsoft Clarity) live",
    detail: "Free, unlimited heatmap + recording on top of existing Cloudflare Web Analytics.",
  },
  {
    date: "2026-05-06",
    category: "feature",
    title: "x402 paid API live — 5 endpoints, indexed in Coinbase Bazaar",
    detail: "Same monitoring data exposed for AI agents to pay per request in USDC on Base. 35 records / 20 providers live. /x402 on the site.",
  },
  {
    date: "2026-05-06",
    category: "ops",
    title: "Korean business registration (general taxpayer)",
    detail: "Enables proper VAT handling, English invoices, and Korean 세금계산서 — solo Korean indie + global B2B in one entity.",
  },
  {
    date: "2026-05-06",
    category: "infra",
    title: "Migrated x402 facilitator: x402.org → Coinbase CDP",
    detail: "Hit concurrent-settlement races on the public facilitator; CDP migration cleared them.",
  },
  {
    date: "2026-05-04",
    category: "ops",
    title: "Product Hunt pre-launch dashboard 100% complete",
    detail: "Page live at producthunt.com/products/freetier-sentinel — full launch on May 12.",
  },
  {
    date: "2026-05-01",
    category: "feature",
    title: "Vercel adapter shipped",
    detail: "Bandwidth + functions usage monitored.",
  },
  {
    date: "2026-05-01",
    category: "infra",
    title: "Billing migrated to LemonSqueezy (Merchant of Record)",
    detail: "MoR handles VAT/sales tax across regions — solo founder no longer manually files in 50+ jurisdictions.",
  },
  {
    date: "2026-05-01",
    category: "infra",
    title: "Cloudflare Web Analytics beacon wired",
    detail: "Privacy-first analytics, no cookies, gated by env so the wiring shipped before the token existed.",
  },
  {
    date: "2026-04-15",
    category: "feature",
    title: "GitHub Actions adapter shipped",
    detail: "Monthly minutes usage monitored.",
  },
  {
    date: "2026-04-10",
    category: "feature",
    title: "Initial release — Cloudflare Workers adapter",
    detail: "First adapter. The product literally monitors its own free-tier usage from day one.",
  },
];

const PLANNED: { title: string; eta: string }[] = [
  { title: "Supabase adapter", eta: "next 2 weeks" },
  { title: "Render adapter", eta: "next 2 weeks" },
  { title: "Resend adapter", eta: "next 2 weeks" },
  { title: "Neon adapter", eta: "next 2 weeks" },
  { title: "Cloudflare R2 adapter", eta: "next 2 weeks" },
  { title: "AI-driven free-tier prediction (alert before usage spike)", eta: "post-launch experiment" },
];

const CATEGORY_LABEL: Record<Entry["category"], string> = {
  feature: "Feature",
  infra: "Infra",
  ops: "Ops",
  fix: "Fix",
};

const CATEGORY_COLOR: Record<Entry["category"], string> = {
  feature: "#14b8a6",
  infra: "#475569",
  ops: "#0891b2",
  fix: "#dc2626",
};

const CSS = String.raw`
* { box-sizing: border-box; }
html { -webkit-text-size-adjust: 100%; }
body {
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
  background: #f4f7fc;
  color: #0a0e1a;
  margin: 0;
  line-height: 1.6;
  -webkit-font-smoothing: antialiased;
}
a { color: #14b8a6; text-decoration: none; }
a:hover { color: #0d9488; text-decoration: underline; }
.container { max-width: 760px; margin: 0 auto; padding: 32px 24px 80px; }
@media (max-width: 600px) { .container { padding: 24px 18px 60px; } }
.back { color: #64748b; font-size: 14px; margin-bottom: 24px; display: inline-block; }
h1 { font-size: 32px; font-weight: 700; margin: 0 0 8px; letter-spacing: -0.02em; }
.lede { color: #64748b; font-size: 16px; margin: 0 0 36px; }
.lede a { font-weight: 500; }
h2 { font-size: 18px; font-weight: 600; margin: 36px 0 16px; padding-bottom: 8px; border-bottom: 1px solid #dde3ee; }
.entry {
  display: grid;
  grid-template-columns: 110px 1fr;
  gap: 16px;
  padding: 14px 0;
  border-bottom: 1px solid #f1f3f7;
}
.entry:last-child { border-bottom: 0; }
.entry-date { color: #64748b; font-size: 13px; font-variant-numeric: tabular-nums; padding-top: 2px; }
.entry-body { display: flex; flex-direction: column; gap: 4px; }
.entry-head { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
.cat {
  display: inline-block;
  font-size: 11px;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 999px;
  background: rgba(20,184,166,.08);
  color: #14b8a6;
  letter-spacing: 0.02em;
  text-transform: uppercase;
}
.entry-title { font-weight: 500; font-size: 15px; }
.entry-detail { color: #455167; font-size: 14px; }
.planned-item { padding: 10px 0; border-bottom: 1px solid #f1f3f7; display: flex; justify-content: space-between; gap: 16px; }
.planned-item:last-child { border-bottom: 0; }
.planned-eta { color: #64748b; font-size: 13px; white-space: nowrap; }
.cta {
  margin-top: 36px;
  padding: 18px 20px;
  background: #fff;
  border: 1px solid #dde3ee;
  border-radius: 12px;
  font-size: 14px;
  color: #455167;
  box-shadow: 0 1px 2px rgba(20,184,166,.05);
}
.cta strong { color: #0a0e1a; }
@media (max-width: 600px) {
  .entry { grid-template-columns: 1fr; gap: 4px; }
  .entry-date { font-size: 12px; }
}
`;

function entryHtml(e: Entry): string {
  const color = CATEGORY_COLOR[e.category];
  const detail = e.detail ? `<div class="entry-detail">${escapeHtml(e.detail)}</div>` : "";
  return `<div class="entry">
    <div class="entry-date">${e.date}</div>
    <div class="entry-body">
      <div class="entry-head">
        <span class="cat" style="background: ${color}14; color: ${color}">${CATEGORY_LABEL[e.category]}</span>
        <span class="entry-title">${escapeHtml(e.title)}</span>
      </div>
      ${detail}
    </div>
  </div>`;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export async function handleChangelog(req: Request, env: Env): Promise<Response> {
  const html = `<!DOCTYPE html><html lang="en"><head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Changelog — FreeTier Sentinel</title>
<meta name="description" content="Recent updates and patches to FreeTier Sentinel — adapter releases, infra changes, and what's coming next.">
<meta name="theme-color" content="#14b8a6">
<meta name="robots" content="index,follow">
<meta property="og:title" content="Changelog — FreeTier Sentinel">
<meta property="og:description" content="Recent updates and patches — adapter releases, infra changes, and what's coming next.">
<meta property="og:type" content="article">
<meta property="og:url" content="https://freetier-sentinel.dev/changelog">
<meta property="og:image" content="https://freetier-sentinel.dev/og.png">
<meta name="twitter:card" content="summary_large_image">
<link rel="canonical" href="https://freetier-sentinel.dev/changelog">
<link rel="icon" type="image/svg+xml" href="/favicon.svg">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
<style>${CSS}</style>${analyticsHeads(env)}</head><body>
<div class="container">
  <a href="/" class="back">← Back to home</a>
  <h1>Changelog</h1>
  <p class="lede">
    What we've shipped and what's coming next.
    Found a bug or want a feature? <a href="https://github.com/wndnjs3865/freetier-sentinel/issues">Open an issue on GitHub</a>.
  </p>

  <h2>Released</h2>
  ${ENTRIES.map(entryHtml).join("")}

  <h2>Coming next</h2>
  ${PLANNED.map(p => `<div class="planned-item">
    <span>${escapeHtml(p.title)}</span>
    <span class="planned-eta">${escapeHtml(p.eta)}</span>
  </div>`).join("")}

  <div class="cta">
    <strong>Building solo, weekends only.</strong> Want a specific cloud SaaS supported next, or hit a bug?
    <a href="https://github.com/wndnjs3865/freetier-sentinel/issues/new">File an issue</a> —
    rankings drive what gets built first.
  </div>
</div>
</body></html>`;
  return new Response(html, {
    headers: {
      "content-type": "text/html; charset=utf-8",
      "cache-control": "public, max-age=300",
    },
  });
}
