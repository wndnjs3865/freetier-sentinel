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
 *   POST /webhooks/stripe   plan updates
 *
 * Scheduled: every 6h checks all services.
 */

export interface Env {
  DB: D1Database;
  KV: KVNamespace;
  APP_URL: string;
  STRIPE_PRICE_ID: string;
  RESEND_FROM: string;
  MASTER_KEY: string;
  STRIPE_SECRET_KEY: string;
  STRIPE_WEBHOOK_SECRET: string;
  RESEND_API_KEY: string;
}

import { handleRoot } from "./routes/root";
import { handleSignup, handleAuthToken, handleAuthTokenConsume } from "./routes/auth";
import { handleDash } from "./routes/dash";
import { handleApiServices, handleApiAlerts } from "./routes/api";
import { handleStripeWebhook } from "./routes/stripe";
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
      if (path === "/" && m === "GET") res = await handleRoot(req, env);
      else if (path === "/health" && m === "GET") res = new Response("ok", { status: 200 });
      else if (path === "/favicon.ico" && m === "GET") res = new Response(null, { status: 204 });
      else if (path === "/robots.txt" && m === "GET") res = new Response("User-agent: *\nAllow: /\n", { status: 200, headers: { "content-type": "text/plain" } });
      else if (path === "/signup" && method === "POST") res = await handleSignup(req, env);
      else if (path.startsWith("/auth/") && m === "GET") res = await handleAuthToken(req, env);
      else if (path.startsWith("/auth/") && method === "POST") res = await handleAuthTokenConsume(req, env);
      else if (path === "/dash" && m === "GET") res = await handleDash(req, env);
      else if (path.startsWith("/api/services")) res = await handleApiServices(req, env);
      else if (path === "/api/alerts" && method === "POST") res = await handleApiAlerts(req, env);
      else if (path === "/webhooks/stripe" && method === "POST") res = await handleStripeWebhook(req, env);

      if (!res) return new Response("Not found", { status: 404 });

      // For HEAD requests, return same headers but no body
      if (method === "HEAD") {
        return new Response(null, { status: res.status, headers: res.headers });
      }
      return res;
    } catch (e: any) {
      console.error("[error]", e?.stack || e);
      return new Response("Internal error", { status: 500 });
    }
  },

  async scheduled(_evt: ScheduledEvent, env: Env, ctx: ExecutionContext): Promise<void> {
    ctx.waitUntil(runScheduledCheck(env));
  },
};
