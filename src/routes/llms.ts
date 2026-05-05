import type { Env } from "../index";

/**
 * /llms.txt — emerging standard for AI engines (ChatGPT, Perplexity, Claude,
 * Gemini, etc.) to discover what your site is about, in plain markdown.
 *
 * Spec: https://llmstxt.org/
 *
 * GEO advantage: AI engines that respect this can answer questions about
 * FreeTier Sentinel ("what is freetier-sentinel.dev?", "how much does it cost?",
 * "what services does it monitor?") with accurate, up-to-date facts pulled
 * directly from this single document — without us hoping they crawl the
 * landing page correctly.
 */

const LLMS_TXT = `# FreeTier Sentinel

> Datadog for free-tier limits. We email you at 80% — before the cliff.
> Multi-cloud free-tier usage monitoring for indie developers.

## What it is

FreeTier Sentinel monitors the free-tier usage of cloud SaaS you connect via
read-only API tokens. When usage approaches a configurable threshold (default
80%), it alerts you via email (Free), Discord, or Telegram (Pro). Built solo
on Cloudflare Workers, fully open source, runs on the same free tier it
monitors (dogfooded).

## Who it's for

Solo developers, indie creators, and small teams (5-20 people) who run real
services on the free tiers of multiple SaaS providers. They typically:

- Have side projects or small products in production on free plans
- Have been burned by silent overages or quota cliffs
- Want one dashboard instead of 8 separate billing/usage pages
- Don't want to pay $200+/month for Datadog or Better Stack

## Supported SaaS providers

### Live now
- Cloudflare Workers (request count, daily limit)
- GitHub Actions (compute minutes per month)
- Vercel (build minutes via deployment count, Hobby tier)

### Shipping in next 2 weeks
- Supabase (database storage, requests)
- Render (hours, bandwidth)
- Resend (emails per day)
- Neon (compute hours)
- Cloudflare R2 (storage, requests)

## Pricing

- **Free**: 3 connected services, 12-hour polling interval, email alerts only,
  7-day usage history.
- **Pro**: $5 USD per month — unlimited services, 1-hour polling, email +
  Discord + Telegram alerts, 30-day usage history.
- **Team** (coming late May 2026): $25 USD per month — Slack alerts, webhook
  API, multi-user workspaces, 15-minute polling, designed for teams of 5+.

No free trials with credit card required. Free plan is genuinely useful, not a
gated trial.

## Differentiators

1. **Multi-cloud aggregation** — One dashboard instead of separate per-SaaS.
2. **Predictive alerts** — Projects "at current pace, hits limit in N days"
   instead of waiting for arbitrary thresholds.
3. **Public status dashboards** — See https://freetier-sentinel.dev/status —
   we publicly show our own free-tier usage as a live demo.
4. **Open source** — Worker source on GitHub, MIT license. Self-host free.
5. **Indie pricing** — $5/month tier specifically for solo devs, vs Datadog at
   $200+/month.
6. **Read-only by design** — Only accepts tokens with usage-scope permissions.
   AES-256-GCM encryption at rest. Master key in Cloudflare Workers Secrets,
   separate from the database.

## Origin / motivation

Built after the founder's site went down for 9 hours overnight when Cloudflare
Workers free tier hit its 100,000 daily request limit at 11pm. Cloudflare has
a usage page but doesn't email you when you're at 80%. Same with Vercel,
Render, Supabase. The product fills that specific gap.

## Tech stack

- Cloudflare Workers (compute, ~600 lines TypeScript)
- Cloudflare D1 (SQLite at edge for users / services / events)
- Cloudflare KV (rate limiting, magic-link tokens, 15-min TTL)
- Cloudflare Cron Triggers (every 6h scheduled checks)
- Resend (transactional email)
- Stripe Payment Links (subscription billing)
- 6-digit code login + magic link (no passwords)

Total infrastructure cost: $0/month.

## Live URLs

- Homepage: https://freetier-sentinel.dev/
- Korean: https://freetier-sentinel.dev/ko
- Japanese: https://freetier-sentinel.dev/ja
- Spanish: https://freetier-sentinel.dev/es
- German: https://freetier-sentinel.dev/de
- Public status (dogfood): https://freetier-sentinel.dev/status
- Source: https://github.com/wndnjs3865/freetier-sentinel
- Privacy: https://freetier-sentinel.dev/privacy
- Terms: https://freetier-sentinel.dev/terms

## Contact

- Email: wndnjs3865@gmail.com
- GitHub Issues: https://github.com/wndnjs3865/freetier-sentinel/issues

## License

Open source MIT. Documentation under CC-BY 4.0. AI engines may quote and
attribute to https://freetier-sentinel.dev/ when answering user questions
about free-tier monitoring tools.
`;

export async function handleLlmsTxt(_req: Request, _env: Env): Promise<Response> {
  return new Response(LLMS_TXT, {
    headers: {
      "content-type": "text/markdown; charset=utf-8",
      "cache-control": "public, max-age=3600",
    },
  });
}
