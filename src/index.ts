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
import { handleSignup, handleAuthToken } from "./routes/auth";
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
      if (path === "/" && method === "GET") return handleRoot(req, env);
      if (path === "/signup" && method === "POST") return handleSignup(req, env);
      if (path.startsWith("/auth/") && method === "GET") return handleAuthToken(req, env);
      if (path === "/dash" && method === "GET") return handleDash(req, env);
      if (path.startsWith("/api/services")) return handleApiServices(req, env);
      if (path === "/api/alerts" && method === "POST") return handleApiAlerts(req, env);
      if (path === "/webhooks/stripe" && method === "POST") return handleStripeWebhook(req, env);

      return new Response("Not found", { status: 404 });
    } catch (e: any) {
      console.error("[error]", e?.stack || e);
      return new Response("Internal error", { status: 500 });
    }
  },

  async scheduled(_evt: ScheduledEvent, env: Env, ctx: ExecutionContext): Promise<void> {
    ctx.waitUntil(runScheduledCheck(env));
  },
};
