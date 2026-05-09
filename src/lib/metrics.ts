/**
 * Metrics layer — time-series snapshots in D1 for revenue/subscribers/marketing.
 *
 * Schema (auto-created by ensureMetricTables):
 *   metric_snapshots(id, ts, metric, value, source, meta_json)
 *
 * Use record() to insert a snapshot. Queries:
 *   - getLatest(metric) → most recent value
 *   - getSeries(metric, days) → array of {ts, value} for sparkline
 *   - getDelta(metric, days) → percentage change vs N days ago
 */
import type { Env } from "../index";

export interface Snapshot {
  ts: number;
  metric: string;
  value: number;
  source?: string;
  meta?: any;
}

export async function ensureMetricTables(env: Env): Promise<void> {
  await env.DB.batch([
    env.DB.prepare(`CREATE TABLE IF NOT EXISTS metric_snapshots (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ts INTEGER NOT NULL,
      metric TEXT NOT NULL,
      value REAL NOT NULL,
      source TEXT,
      meta_json TEXT
    )`),
    env.DB.prepare(`CREATE INDEX IF NOT EXISTS idx_metric_ts
      ON metric_snapshots (metric, ts DESC)`),
  ]);
}

export async function recordMetric(
  env: Env,
  metric: string,
  value: number,
  source?: string,
  meta?: any,
): Promise<void> {
  try {
    await env.DB.prepare(
      `INSERT INTO metric_snapshots (ts, metric, value, source, meta_json) VALUES (?, ?, ?, ?, ?)`,
    ).bind(
      Math.floor(Date.now() / 1000),
      metric,
      value,
      source || null,
      meta ? JSON.stringify(meta) : null,
    ).run();
  } catch (e) {
    console.error("[metrics] record failed", metric, e);
  }
}

export async function getLatest(env: Env, metric: string): Promise<{ value: number; ts: number } | null> {
  const r = await env.DB.prepare(
    `SELECT value, ts FROM metric_snapshots WHERE metric=? ORDER BY ts DESC LIMIT 1`,
  ).bind(metric).first<any>();
  return r ? { value: r.value, ts: r.ts } : null;
}

export async function getSeries(env: Env, metric: string, days: number = 30): Promise<Array<{ ts: number; value: number }>> {
  const since = Math.floor(Date.now() / 1000) - days * 86400;
  const rs = await env.DB.prepare(
    `SELECT ts, value FROM metric_snapshots WHERE metric=? AND ts >= ? ORDER BY ts ASC`,
  ).bind(metric, since).all<any>();
  return (rs.results || []) as any;
}

/**
 * Percent delta vs same-time N days ago. Null if not enough data.
 */
export async function getDelta(env: Env, metric: string, days: number): Promise<number | null> {
  const latest = await getLatest(env, metric);
  if (!latest) return null;
  const target = Math.floor(Date.now() / 1000) - days * 86400;
  const past = await env.DB.prepare(
    `SELECT value FROM metric_snapshots WHERE metric=? AND ts <= ? ORDER BY ts DESC LIMIT 1`,
  ).bind(metric, target).first<any>();
  if (!past || past.value === 0) return null;
  return ((latest.value - past.value) / past.value) * 100;
}

/**
 * Sum across a window — useful for revenue (count payments, sum amounts).
 */
export async function sumInWindow(env: Env, metric: string, sinceDays: number): Promise<number> {
  const since = Math.floor(Date.now() / 1000) - sinceDays * 86400;
  const r = await env.DB.prepare(
    `SELECT SUM(value) as total FROM metric_snapshots WHERE metric=? AND ts >= ?`,
  ).bind(metric, since).first<any>();
  return r?.total || 0;
}

export async function countInWindow(env: Env, metric: string, sinceDays: number): Promise<number> {
  const since = Math.floor(Date.now() / 1000) - sinceDays * 86400;
  const r = await env.DB.prepare(
    `SELECT COUNT(*) as n FROM metric_snapshots WHERE metric=? AND ts >= ?`,
  ).bind(metric, since).first<any>();
  return r?.n || 0;
}
