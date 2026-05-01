import type { Env } from "../index";
import { decrypt } from "../lib/crypto";
import { sendUsageAlert } from "../lib/email";
import { fetchUsage } from "../adapters";

export interface CheckOpts {
  force?: boolean;       // bypass per-plan minimum interval (manual trigger)
  userId?: string;       // limit to a single user's services (manual trigger)
}

/**
 * Scheduled handler — checks active services.
 * Free plan: every 12h (cron runs every 6h, but skips users where last_check is recent).
 * Pro plan: every 1h (cron stays at 6h for now; tighten via per-plan cron later).
 *
 * Manual: pass { force:true, userId } to run regardless of interval.
 */
export async function runScheduledCheck(env: Env, opts: CheckOpts = {}): Promise<{ checked: number; results: any[] }> {
  const now = Math.floor(Date.now() / 1000);
  const log: any[] = [];

  let query = `SELECT s.id, s.user_id, s.kind, s.label, s.credentials_enc, s.threshold_pct,
           s.last_check, u.email, u.plan
    FROM services s JOIN users u ON s.user_id = u.id`;
  let stmt;
  if (opts.userId) {
    query += " WHERE s.user_id = ?";
    stmt = env.DB.prepare(query).bind(opts.userId);
  } else {
    stmt = env.DB.prepare(query);
  }
  const rs = await stmt.all<any>();

  let checked = 0;
  for (const s of rs.results || []) {
    if (!opts.force) {
      const minInterval = s.plan === "pro" ? 3600 : 43200; // 1h or 12h
      if (s.last_check && now - s.last_check < minInterval) continue;
    }

    let usagePct = -1;
    let status = "ok";
    try {
      const apiKey = await decrypt(s.credentials_enc, env.MASTER_KEY);
      usagePct = await fetchUsage(s.kind, apiKey);
    } catch (e: any) {
      status = "error";
      console.error("[check]", s.kind, s.label, e?.message);
    }

    if (usagePct >= s.threshold_pct) status = "warning";
    if (usagePct >= 95) status = "critical";

    await env.DB.prepare(
      "UPDATE services SET last_check=?, last_usage_pct=?, last_status=? WHERE id=?"
    ).bind(now, usagePct, status, s.id).run();

    await env.DB.prepare(
      "INSERT INTO events (service_id, usage_pct, status, created_at) VALUES (?, ?, ?, ?)"
    ).bind(s.id, usagePct, status, now).run();

    if (status === "warning" || status === "critical") {
      const subject = `[${status.toUpperCase()}] ${s.label}: ${usagePct}% used`;
      const msg = `Your ${s.kind} usage on "${s.label}" is at ${usagePct}% (threshold ${s.threshold_pct}%).`;
      await sendUsageAlert(env, s.email, subject, msg);
    }

    checked++;
    log.push({ id: s.id, kind: s.kind, label: s.label, usage_pct: usagePct, status });
  }

  return { checked, results: log };
}
