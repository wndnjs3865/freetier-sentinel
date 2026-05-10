/**
 * Daily backup — D1 dump to KV with 30-day retention.
 *
 * Trigger: 12:00 UTC = 21:00 KST (daily)
 *
 * Why KV instead of R2: R2 requires CF Dashboard enable (user action).
 * KV is already wired and gives 1GB/namespace, 25MB/value. 12 tables
 * with current row counts fit comfortably (each table < 1MB).
 *
 * Restore procedure:
 *   1. Find timestamp: wrangler kv:key list --binding KV --prefix backup:
 *   2. Read table: wrangler kv:key get --binding KV --text "backup:YYYY-MM-DD:users"
 *   3. Re-insert into D1 via wrangler d1 execute --file restore.sql
 *
 * Future: when R2 is enabled, swap to env.BACKUPS.put() + retain 90 days.
 */
import type { Env } from "../index";
import { sendTelegram } from "../lib/notify";

const BACKUP_TABLES = [
  "users",
  "services",
  "alert_channels",
  "alert_log",
  "events",
  "inbox_items",
  "incidents",
  "metric_snapshots",
  "notes",
  "tasks",
];

const RETENTION_SEC = 30 * 86400; // 30 days

export async function runDailyBackup(env: Env): Promise<{ ok: number; fail: number; rows: number }> {
  const date = new Date().toISOString().slice(0, 10); // YYYY-MM-DD UTC
  let okCount = 0;
  let failCount = 0;
  let totalRows = 0;
  const sizes: Record<string, number> = {};

  for (const table of BACKUP_TABLES) {
    try {
      // SELECT * — table names are hardcoded above so no SQL injection vector
      const r = await env.DB.prepare(`SELECT * FROM ${table}`).all<any>();
      const rows = r.results || [];
      const json = JSON.stringify(rows);
      const key = `backup:${date}:${table}`;
      await env.KV.put(key, json, { expirationTtl: RETENTION_SEC });
      okCount++;
      totalRows += rows.length;
      sizes[table] = json.length;
    } catch (e: any) {
      failCount++;
      console.error(`[backup] table ${table} failed:`, e?.message || e);
    }
  }

  // Save manifest with timestamps + sizes for restore lookup
  const manifest = {
    date,
    timestamp: new Date().toISOString(),
    tables_ok: okCount,
    tables_fail: failCount,
    total_rows: totalRows,
    sizes_bytes: sizes,
    retention_days: 30,
  };
  await env.KV.put(`backup:${date}:_manifest`, JSON.stringify(manifest), { expirationTtl: RETENTION_SEC });

  // Telegram notification (low-noise: only failures + summary)
  const totalSize = Object.values(sizes).reduce((a, b) => a + b, 0);
  const sizeKB = (totalSize / 1024).toFixed(1);
  if (failCount > 0) {
    await sendTelegram(env, `⚠️ Backup ${date}: ${okCount}/${BACKUP_TABLES.length} OK, ${failCount} failed · ${totalRows} rows · ${sizeKB}KB → KV`);
  } else {
    await sendTelegram(env, `📦 Backup ${date} OK · ${totalRows} rows · ${sizeKB}KB · ${BACKUP_TABLES.length} tables → KV (30일 보존)`);
  }

  return { ok: okCount, fail: failCount, rows: totalRows };
}
