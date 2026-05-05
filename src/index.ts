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
  CF_BEACON_TOKEN?: string;
}

import { handleRoot } from "./routes/root";
import { handleSignup, handleAuthToken, handleAuthTokenConsume, handleVerifyPage, handleVerifyConsume } from "./routes/auth";
import { handleDash } from "./routes/dash";
import { handleApiServices, handleApiAlerts, handleCheckNow, handleTestAlert } from "./routes/api";
import { handleLsWebhook } from "./routes/lemonsqueezy";
import { handleNotify } from "./routes/notify";
import { handlePrivacy, handleTerms } from "./routes/legal";
import { handleSitemap, handleFavicon, handleOgImage } from "./routes/sitemap";
import { handleStatus } from "./routes/status";
import { handleLlmsTxt } from "./routes/llms";
import { runScheduledCheck } from "./jobs/check";

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
      else if (path === "/notify" && method === "POST") res = await handleNotify(req, env);
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

  async scheduled(_evt: ScheduledEvent, env: Env, ctx: ExecutionContext): Promise<void> {
    ctx.waitUntil(runScheduledCheck(env));
  },
};
