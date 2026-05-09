/**
 * Hourly metric polling — light-touch external data fetch.
 *
 * Fires from cron `0 * * * *` (every hour, alongside bazaar polling).
 * Records snapshots that the dashboard renders into trend charts.
 */
import type { Env } from "../index";
import { recordMetric, ensureMetricTables } from "../lib/metrics";

export async function runHourlyMetrics(env: Env): Promise<{ recorded: string[] }> {
  await ensureMetricTables(env);
  const recorded: string[] = [];

  // ── GitHub repo stats (public API, no auth)
  try {
    const r = await fetch("https://api.github.com/repos/wndnjs3865/freetier-sentinel", {
      headers: { "user-agent": "FreeTier-Sentinel-Bot" },
      signal: AbortSignal.timeout(5000),
    });
    if (r.ok) {
      const j = (await r.json()) as any;
      await recordMetric(env, "github_stars", j.stargazers_count || 0, "github");
      await recordMetric(env, "github_forks", j.forks_count || 0, "github");
      await recordMetric(env, "github_issues", j.open_issues_count || 0, "github");
      recorded.push("github_stars", "github_forks", "github_issues");
    }
  } catch (e) { console.error("[metrics] github failed", e); }

  // ── User counts (D1 — solo SaaS, fast query)
  try {
    const rs = await env.DB.prepare(
      `SELECT
        COUNT(*) as total,
        SUM(CASE WHEN plan='pro' THEN 1 ELSE 0 END) as pro_n,
        SUM(CASE WHEN plan='free' THEN 1 ELSE 0 END) as free_n
      FROM users`,
    ).first<any>();
    if (rs) {
      await recordMetric(env, "users_total", rs.total || 0, "d1");
      await recordMetric(env, "users_pro", rs.pro_n || 0, "d1");
      await recordMetric(env, "users_free", rs.free_n || 0, "d1");
      recorded.push("users_total", "users_pro", "users_free");
    }
  } catch (e) { console.error("[metrics] users failed", e); }

  // ── Active services count
  try {
    const rs = await env.DB.prepare(`SELECT COUNT(*) as n FROM services`).first<any>();
    if (rs) {
      await recordMetric(env, "services_total", rs.n || 0, "d1");
      recorded.push("services_total");
    }
  } catch (e) { /* table might not exist yet */ }

  return { recorded };
}
