/**
 * FreeTier Sentinel — Cloudflare Workers entry.
 *
 * Routes:
 *   GET  /                  marketing landing
 *   POST /signup            email -> magic link
 *   GET  /auth/:token       magic link verification
 *   GET  /dash              dashboard (HTML)
 *   POST /api/services      add service
 *   DELETE /api/services/:id
 *   POST /api/alerts        add alert channel
 *   POST /webhooks/lemonsqueezy   plan updates
 *
 * Scheduled: every 6h checks all services.
 */

export interface Env {
  DB: D1Database;
  KV: KVNamespace;
  APP_URL: string;
  RESEND_FROM: string;
  MASTER_KEY: string;
  RESEND_API_KEY: string;
  TELEGRAM_BOT_TOKEN: string;
  TELEGRAM_CHAT_ID: string;
  NOTIFY_API_KEY: string;
  LS_CHECKOUT_URL?: string;
  LS_API_KEY?: string;
  LS_WEBHOOK_SECRET?: string;
  // Polar (replaces LS post-5/7 rejection)
  POLAR_CHECKOUT_URL?: string;
  POLAR_PORTAL_URL?: string;
  POLAR_API_KEY?: string;
  POLAR_WEBHOOK_SECRET?: string;
  POLAR_WEBHOOK_BYPASS?: string;
  // Paddle backup MoR (only used if LS verification stuck past 5/9 stop-loss).
  // See routes/paddle.ts (skeleton, not wired in default flow).
  PADDLE_NOTIFICATION_SECRET?: string;
  PADDLE_API_KEY?: string;
  PADDLE_PRODUCT_ID_PRO?: string;
  PADDLE_CHECKOUT_URL?: string;
  CF_BEACON_TOKEN?: string;
  CLARITY_PROJECT_ID?: string;
  // x402 paid-API env
  X402_FACILITATOR_URL?: string;
  X402_RECEIVING_ADDRESS?: string;
  X402_NETWORK?: string;
  X402_USDC_ADDRESS?: string;
  // CDP Facilitator (production)
  CDP_API_KEY_ID?: string;
  CDP_API_KEY_SECRET?: string;
  CDP_FACILITATOR_URL?: string;
  // Mission Control admin
  ADMIN_EMAIL?: string;
}

import { handleRoot } from "./routes/root";
import { handleSignup, handleAuthToken, handleAuthTokenConsume, handleVerifyPage, handleVerifyConsume, handleLogout, handleResend } from "./routes/auth";
import { handleDash } from "./routes/dash";
import { handleApiServices, handleApiAlerts, handleCheckNow, handleTestAlert } from "./routes/api";
import { handleLsWebhook } from "./routes/lemonsqueezy";
import { handleNotify } from "./routes/notify";
import { handleInboxPage, handleInboxSync, handleInboxDone, handleInboxList } from "./routes/inbox";
import { handlePolarWebhook } from "./routes/polar";
import { handleVsDatadog } from "./routes/vs";
import { handleLaunchHero, handleLaunchDashboard, handleLaunchAlerts, handleLaunchPng, handleLaunchThumbnail, handleLaunchDemo } from "./routes/launch";
import { handleSecurity } from "./routes/security";
import { handleAccountPage, handleEmailChangeRequest, handleAccountDeleteRequest, handleBillingPortal } from "./routes/account";
import { handlePrivacy, handleTerms } from "./routes/legal";
import { handleSitemap, handleFavicon, handleOgImage } from "./routes/sitemap";
import { handleStatus } from "./routes/status";
import { handleChangelog } from "./routes/changelog";
import { handleLlmsTxt } from "./routes/llms";
import { handleProviders, handleProviderLimits, handleCloudLimits, handleAiLimits, handleCompare } from "./routes/x402";
import { handleApiDocs, handleOpenApiSpec } from "./routes/x402-docs";
import { handleAdmin } from "./routes/admin";
import { runScheduledCheck } from "./jobs/check";
import { runSmoke } from "./jobs/smoke";
import { runBazaarPoll } from "./jobs/bazaar";
import { runDailyDigest } from "./jobs/digest";
import { runHourlyMetrics } from "./jobs/metrics";

export default {
  async fetch(req: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(req.url);
    const path = url.pathname;
    const method = req.method;

    try {
      // Treat HEAD as GET for routing; strip body before sending
      const m = method === "HEAD" ? "GET" : method;

      let res: Response | null = null;
      if ((path === "/" || path === "/ko" || path === "/ja" || path === "/es" || path === "/de") && m === "GET") res = await handleRoot(req, env);
      else if (path === "/health" && m === "GET") res = new Response("ok", { status: 200 });
      else if ((path === "/favicon.ico" || path === "/favicon.svg") && m === "GET") res = await handleFavicon(req, env);
      else if (path === "/robots.txt" && m === "GET") res = new Response([
        `User-agent: *`,
        `Allow: /`,
        ``,
        `# AI crawlers — explicitly allowed for GEO`,
        `User-agent: GPTBot`,
        `Allow: /`,
        `User-agent: ClaudeBot`,
        `Allow: /`,
        `User-agent: PerplexityBot`,
        `Allow: /`,
        `User-agent: Google-Extended`,
        `Allow: /`,
        `User-agent: ChatGPT-User`,
        `Allow: /`,
        `User-agent: CCBot`,
        `Allow: /`,
        ``,
        `Sitemap: ${env.APP_URL}/sitemap.xml`,
        `# AI summary: ${env.APP_URL}/llms.txt`,
        ``,
      ].join("\n"), { status: 200, headers: { "content-type": "text/plain" } });
      else if (path === "/sitemap.xml" && m === "GET") res = await handleSitemap(req, env);
      else if (path === "/og.png" && m === "GET") res = await handleOgImage(req, env);
      else if (path === "/status" && m === "GET") res = await handleStatus(req, env);
      else if (path === "/changelog" && m === "GET") res = await handleChangelog(req, env);
      else if ((path === "/llms.txt" || path === "/llms-full.txt") && m === "GET") res = await handleLlmsTxt(req, env);
      else if (path === "/signup" && method === "POST") res = await handleSignup(req, env);
      else if (path === "/verify" && m === "GET") res = await handleVerifyPage(req, env);
      else if (path === "/verify" && method === "POST") res = await handleVerifyConsume(req, env);
      else if (path.startsWith("/auth/") && m === "GET") res = await handleAuthToken(req, env);
      else if (path.startsWith("/auth/") && method === "POST") res = await handleAuthTokenConsume(req, env);
      else if (path === "/dash" && m === "GET") res = await handleDash(req, env);
      else if (path.startsWith("/api/services")) res = await handleApiServices(req, env);
      else if (path === "/api/alerts" && method === "POST") res = await handleApiAlerts(req, env);
      else if (path === "/api/check-now" && method === "POST") res = await handleCheckNow(req, env);
      else if (path === "/api/test-alert" && method === "POST") res = await handleTestAlert(req, env);
      else if (path === "/webhooks/lemonsqueezy" && method === "POST") res = await handleLsWebhook(req, env);
      else if (path === "/webhooks/polar" && method === "POST") res = await handlePolarWebhook(req, env);
      else if (path === "/vs/datadog" && m === "GET") res = await handleVsDatadog(req, env);
      else if (path === "/launch/hero" && m === "GET") res = await handleLaunchHero(req, env);
      else if (path === "/launch/dashboard" && m === "GET") res = await handleLaunchDashboard(req, env);
      else if (path === "/launch/alerts" && m === "GET") res = await handleLaunchAlerts(req, env);
      else if (path === "/launch/thumbnail" && m === "GET") res = await handleLaunchThumbnail(req, env);
      else if (path === "/launch/demo" && m === "GET") res = await handleLaunchDemo(req, env);
      else if (path === "/launch/demo.mp4" && m === "GET") res = await handleLaunchPng(req, env, "demo-mp4");
      else if (path === "/launch/hero.png" && m === "GET") res = await handleLaunchPng(req, env, "hero");
      else if (path === "/launch/dashboard.png" && m === "GET") res = await handleLaunchPng(req, env, "dashboard");
      else if (path === "/launch/alerts.png" && m === "GET") res = await handleLaunchPng(req, env, "alerts");
      else if (path === "/launch/thumbnail.png" && m === "GET") res = await handleLaunchPng(req, env, "thumbnail");
      else if (path === "/security" && m === "GET") res = await handleSecurity(req, env);
      else if (path === "/account" && m === "GET") res = await handleAccountPage(req, env);
      else if (path === "/api/account/email-change-request" && method === "POST") res = await handleEmailChangeRequest(req, env);
      else if (path === "/api/account/delete-request" && method === "POST") res = await handleAccountDeleteRequest(req, env);
      else if (path === "/api/billing/portal" && m === "GET") res = await handleBillingPortal(req, env);
      else if (path === "/api/auth/logout" && (m === "GET" || method === "POST")) res = await handleLogout(req, env);
      else if (path === "/api/auth/resend" && method === "POST") res = await handleResend(req, env);
      else if (path === "/notify" && method === "POST") res = await handleNotify(req, env);
      // Inbox dashboard (Gmail triage daemon view)
      else if (path === "/inbox" && m === "GET") res = await handleInboxPage(req, env);
      else if (path === "/api/inbox/sync" && method === "POST") res = await handleInboxSync(req, env);
      else if (path === "/api/inbox/list" && m === "GET") res = await handleInboxList(req, env);
      else if (path.startsWith("/api/inbox/") && path.endsWith("/done") && method === "POST") {
        const id = path.slice("/api/inbox/".length, -"/done".length);
        res = await handleInboxDone(req, env, id);
      }
      // x402 paid-API endpoints (agent economy)
      else if (path === "/v1/providers" && m === "GET") res = await handleProviders(req, env);
      else if (path === "/v1/openapi.json" && m === "GET") res = await handleOpenApiSpec(req, env);
      else if (path === "/docs/api" && m === "GET") res = await handleApiDocs(req, env);
      else if (path === "/v1/compare" && m === "GET") res = await handleCompare(req, env);
      else if (path.startsWith("/v1/cloud/") && path.endsWith("/limits") && m === "GET") {
        const provider = path.slice("/v1/cloud/".length, -"/limits".length);
        res = await handleCloudLimits(req, env, provider);
      }
      else if (path.startsWith("/v1/ai/") && path.endsWith("/limits") && m === "GET") {
        const provider = path.slice("/v1/ai/".length, -"/limits".length);
        res = await handleAiLimits(req, env, provider);
      }
      else if (path.startsWith("/v1/limits/") && m === "GET") {
        const provider = path.slice("/v1/limits/".length);
        res = await handleProviderLimits(req, env, provider);
      }
      // Mission Control (admin only)
      else if (path === "/admin" || path.startsWith("/admin/")) res = await handleAdmin(req, env);
      else if (path === "/privacy" && m === "GET") res = await handlePrivacy(req, env);
      else if (path === "/terms" && m === "GET") res = await handleTerms(req, env);

      if (!res) res = new Response("Not found", { status: 404 });

      // Security headers — applied to every response
      const headers = new Headers(res.headers);
      headers.set("Strict-Transport-Security", "max-age=63072000; includeSubDomains; preload");
      headers.set("X-Frame-Options", "DENY");
      headers.set("X-Content-Type-Options", "nosniff");
      headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
      headers.set("Permissions-Policy", "geolocation=(), camera=(), microphone=()");

      // For HEAD requests, return same headers but no body
      if (method === "HEAD") {
        return new Response(null, { status: res.status, headers });
      }
      return new Response(res.body, { status: res.status, headers });
    } catch (e: any) {
      console.error("[error]", e?.stack || e);
      return new Response("Internal error", { status: 500 });
    }
  },

  async scheduled(evt: ScheduledEvent, env: Env, ctx: ExecutionContext): Promise<void> {
    // Dispatch by cron pattern. Multiple crons configured in wrangler.toml:
    //   "0 */6 * * *"     → FT services usage check (existing)
    //   "*/30 * * * *"    → smoke test (every 30 min)
    //   "0 * * * *"       → bazaar indexing poll (every hour)
    //   "0 0 * * *"       → daily digest (00 UTC = 09 KST)
    const cron = (evt as any).cron as string | undefined;
    if (!cron) {
      // Fallback: behave like FT services check
      ctx.waitUntil(runScheduledCheck(env));
      return;
    }

    if (cron === "0 0 * * *") {
      ctx.waitUntil(runDailyDigest(env));
    } else if (cron === "0 */6 * * *") {
      ctx.waitUntil(runScheduledCheck(env));
    } else if (cron === "0 * * * *") {
      // Hourly: run both bazaar polling AND metrics collection in parallel
      ctx.waitUntil(Promise.all([runBazaarPoll(env), runHourlyMetrics(env)]));
    } else if (cron === "*/30 * * * *") {
      ctx.waitUntil(runSmoke(env));
    } else {
      // Unknown cron → log and run smoke as safest default
      console.log("[scheduled] unknown cron:", cron);
      ctx.waitUntil(runSmoke(env));
    }
  },
};
