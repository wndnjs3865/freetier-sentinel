# FreeTier Sentinel

> Stop blowing free-tier limits. Get alerted before Cloudflare, GitHub Actions, Vercel, Supabase, Resend (and more) lock you out.

**Free**: 3 services, 12-hour checks, email alerts.
**Pro $5/mo**: Unlimited services, 1-hour checks, Discord + Telegram alerts, 7-day history.

## Stack
- Cloudflare Workers + D1 + KV + Cron Triggers
- TypeScript + wrangler
- Stripe Payment Link

## Local dev
```bash
npm install
npx wrangler login
npx wrangler d1 create freetier-sentinel-db   # paste ID into wrangler.toml
npx wrangler d1 execute freetier-sentinel-db --file=src/db/schema.sql
npx wrangler dev
```

## Deploy
Push to `main`. Actions deploys via `CLOUDFLARE_API_TOKEN` secret.

## Roadmap
See [SPEC.md](./SPEC.md) for full architecture and 8-week schedule.
