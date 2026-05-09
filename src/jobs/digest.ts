/**
 * Daily digest — 09:00 KST (= 00:00 UTC).
 *
 * Composes a state summary and sends to Telegram. Includes:
 *   - D-N to PH launch (2026-05-12)
 *   - x402 endpoints health (live counts)
 *   - FT services last-check status (any errors?)
 *   - Bazaar indexing status
 *   - Smoke test pass rate (last 24h via KV scan — best effort)
 *   - Top action items
 */
import type { Env } from "../index";
import { sendTelegram } from "../lib/notify";

const PH_LAUNCH = new Date("2026-05-12T00:00:00Z");

export async function runDailyDigest(env: Env): Promise<void> {
  const lines: string[] = [];

  // ── Header / D-N
  const today = new Date();
  const daysToLaunch = Math.ceil((PH_LAUNCH.getTime() - today.getTime()) / 86400000);
  const dStr =
    daysToLaunch > 0 ? `D-${daysToLaunch}` :
    daysToLaunch === 0 ? "🚀 LAUNCH DAY" :
    `+${-daysToLaunch} 후속`;
  lines.push(`📅 ${today.toISOString().slice(0, 10)} — PH ${dStr}`);
  lines.push("");

  // ── x402 health (live probe)
  try {
    const r = await fetch("https://freetier-sentinel.dev/v1/providers", { signal: AbortSignal.timeout(5000) });
    if (r.ok) {
      const j = (await r.json()) as { total_records?: number; providers?: string[] };
      lines.push(`✅ x402: ${j.total_records || 0} records / ${(j.providers || []).length} providers`);
    } else {
      lines.push(`⚠️ x402: HTTP ${r.status}`);
    }
  } catch (e: any) {
    lines.push(`🔴 x402: ${e?.message || "down"}`);
  }

  // ── FT services check status
  try {
    const rs = await env.DB.prepare(
      `SELECT
        COUNT(*) as total,
        SUM(CASE WHEN last_status='ok' THEN 1 ELSE 0 END) as ok_n,
        SUM(CASE WHEN last_status='warning' THEN 1 ELSE 0 END) as warn_n,
        SUM(CASE WHEN last_status='critical' THEN 1 ELSE 0 END) as crit_n,
        SUM(CASE WHEN last_status='error' THEN 1 ELSE 0 END) as err_n
      FROM services`
    ).first<any>();
    if (rs) {
      lines.push(`📊 FT services: ${rs.total || 0} total / ok ${rs.ok_n || 0} / warn ${rs.warn_n || 0} / crit ${rs.crit_n || 0} / err ${rs.err_n || 0}`);
    }
  } catch (e) { /* DB might be empty */ }

  // ── Bazaar status
  const bazaarIndexed = await env.KV.get("bazaar:indexed");
  lines.push(`📡 Bazaar: ${bazaarIndexed === "1" ? "✅ indexed" : "⏳ pending first settle"}`);

  // ── Smoke summary (recent state from KV)
  try {
    const targets = ["landing", "health", "x402-providers", "docs-api", "openapi", "x402-paid-402"];
    let okN = 0;
    let failN = 0;
    for (const t of targets) {
      const s = await env.KV.get(`smoke:${t}`);
      if (s) {
        const parsed = JSON.parse(s);
        if (parsed.status === "ok") okN++;
        else failN++;
      }
    }
    lines.push(`🩺 Smoke: ${okN} ok / ${failN} fail (of ${targets.length})`);
  } catch (e) { /* skip */ }

  // ── Action items based on D-N
  lines.push("");
  lines.push("🎯 우선순위:");
  if (daysToLaunch > 5) {
    lines.push("  • LS verification 답변 처리");
    lines.push("  • Impact Radius 가입 (5분)");
    lines.push("  • PH 비주얼 #1 (200 OK Lie hook) 시작");
  } else if (daysToLaunch > 2) {
    lines.push("  • PH 비주얼 4장 마무리");
    lines.push("  • Demo GIF 녹화");
    lines.push("  • Hunter 결정");
  } else if (daysToLaunch > 0) {
    lines.push("  • 🔥 마지막 점검: 모든 endpoint 라이브?");
    lines.push("  • 마케팅 글 4편 final review");
    lines.push("  • 런치 시간 알람");
  } else if (daysToLaunch === 0) {
    lines.push("  • 🚀 PH publish 즉시");
    lines.push("  • Maker comment 게시");
    lines.push("  • HN/Reddit/IH 동시 게시");
    lines.push("  • 댓글 응대");
  } else {
    lines.push("  • PH 댓글 응대");
    lines.push("  • 첫 USDC 결제 시뮬 (Bazaar 트리거)");
    lines.push("  • Korean Dev MCP W2 시작");
  }

  await sendTelegram(env, lines.join("\n"));
}
