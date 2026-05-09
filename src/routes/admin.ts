/**
 * Mission Control dashboard at /admin.
 *
 * Visual workflow management with:
 *   - Priority-grouped checklist (P0/P1/P2) with progress bars
 *   - Live status (x402 endpoints, smoke tests, Bazaar indexing)
 *   - D-N countdown to PH launch (2026-05-12)
 *   - Quick action buttons (run smoke, digest, bazaar poll)
 *   - Recent alerts feed (last 20)
 *   - Notes / scratchpad
 *   - Memory file quick links
 *   - Auto-refresh every 60s
 *
 * Auth: existing magic-link session cookie + email matches ADMIN_EMAIL env.
 *
 * Tables auto-created on first GET. Initial seed from hardcoded priority list.
 */
import type { Env } from "../index";
import { getUserFromCookie } from "./auth";
import { runSmoke } from "../jobs/smoke";
import { runBazaarPoll } from "../jobs/bazaar";
import { runDailyDigest } from "../jobs/digest";
import { runHourlyMetrics } from "../jobs/metrics";
import {
  ensureMetricTables, recordMetric, getLatest, getSeries, sumInWindow, countInWindow,
} from "../lib/metrics";

const PH_LAUNCH = new Date("2026-05-12T00:00:00Z");

// ─────────────────────────────────────────────────────────────────────
// Auth + table init
// ─────────────────────────────────────────────────────────────────────
async function requireAdmin(req: Request, env: Env): Promise<Response | null> {
  const adminEmail = (env as any).ADMIN_EMAIL as string | undefined;
  if (!adminEmail) {
    return new Response("ADMIN_EMAIL not set. Run: wrangler secret put ADMIN_EMAIL", { status: 503 });
  }
  const u = await getUserFromCookie(req, env);
  if (!u) {
    return new Response(null, { status: 302, headers: { location: "/" } });
  }
  if (u.email.toLowerCase() !== adminEmail.toLowerCase()) {
    return new Response("Forbidden — operator only.", { status: 403 });
  }
  return null;
}

async function ensureTables(env: Env): Promise<void> {
  await env.DB.batch([
    env.DB.prepare(`CREATE TABLE IF NOT EXISTS tasks (
      id TEXT PRIMARY KEY,
      priority TEXT NOT NULL,
      title TEXT NOT NULL,
      done INTEGER NOT NULL DEFAULT 0,
      done_at INTEGER,
      ord INTEGER NOT NULL DEFAULT 0,
      category TEXT,
      due_at INTEGER,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    )`),
    env.DB.prepare(`CREATE TABLE IF NOT EXISTS notes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      body TEXT NOT NULL,
      updated_at INTEGER NOT NULL
    )`),
    env.DB.prepare(`CREATE TABLE IF NOT EXISTS alert_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      kind TEXT NOT NULL,
      message TEXT NOT NULL,
      created_at INTEGER NOT NULL
    )`),
    env.DB.prepare(`CREATE TABLE IF NOT EXISTS incidents (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      severity TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'open',
      description TEXT,
      rca TEXT,
      opened_at INTEGER NOT NULL,
      resolved_at INTEGER
    )`),
  ]);
  await ensureMetricTables(env);

  // Seed initial tasks if empty (from resume_queue 5/6 priorities)
  const count = await env.DB.prepare("SELECT COUNT(*) as n FROM tasks").first<{ n: number }>();
  if (count && count.n === 0) {
    const now = Math.floor(Date.now() / 1000);
    const seed: Array<[string, string, string, number, number]> = [
      // priority, title, category, ord, done(1=already done)
      ["p0", "사업자등록 처리 완료", "admin", 1, 1],
      ["p0", "Coinbase KYC + Base USDC 지갑", "admin", 2, 1],
      ["p0", "x402 paid endpoints LIVE (CDP migrated)", "dev", 3, 1],
      ["p0", "LS verification 답변 처리", "launch", 4, 0],
      ["p0", "PH 비주얼 #1 (Hero — 200 OK Lie)", "launch", 5, 0],
      ["p0", "PH 비주얼 #2 (Dashboard 스크린샷)", "launch", 6, 0],
      ["p0", "PH 비주얼 #3 (8 SaaS grid)", "launch", 7, 0],
      ["p0", "PH 비주얼 #4 (가격 비교)", "launch", 8, 0],
      ["p0", "Hunter 결정 (셀프 vs 섭외)", "launch", 9, 0],
      ["p0", "Demo GIF 30초 녹화", "launch", 10, 0],
      ["p1", "Amazon Associates 승인됨", "affiliate", 11, 1],
      ["p1", "Impact Radius 가입 (5분)", "affiliate", 12, 0],
      ["p1", "첫 USDC 결제 시뮬 (Bazaar 트리거)", "x402", 13, 0],
      ["p1", "Amazon Associates 한국 별도 가입", "affiliate", 14, 0],
      ["p1", "Resend 이메일 검증 디버깅", "dev", 15, 1],
      ["p2", "Korean Dev MCP 1개 (W2-3)", "future", 16, 0],
      ["p2", "Supabase 어댑터 추가", "future", 17, 0],
      ["p2", "Render 어댑터 추가", "future", 18, 0],
      ["p2", "Neon 어댑터 추가", "future", 19, 0],
      ["p2", "Resend / R2 어댑터 추가", "future", 20, 0],
      ["p2", "Cron Sentinel (백업 Plan C)", "future", 21, 0],
    ];
    for (const [priority, title, category, ord, done] of seed) {
      const id = crypto.randomUUID();
      await env.DB.prepare(
        `INSERT INTO tasks (id, priority, title, category, ord, done, done_at, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      ).bind(id, priority, title, category, ord, done, done ? now : null, now, now).run();
    }
  }
}

// ─────────────────────────────────────────────────────────────────────
// Live status probes
// ─────────────────────────────────────────────────────────────────────
/**
 * Aggregate business metrics for dashboard. Pulls from D1 metric_snapshots.
 */
async function getBusinessMetrics(env: Env): Promise<any> {
  const m: any = {};

  // Subscribers (from users table)
  try {
    const u = await env.DB.prepare(
      `SELECT
        COUNT(*) as total,
        SUM(CASE WHEN plan='pro' THEN 1 ELSE 0 END) as pro,
        SUM(CASE WHEN plan='free' THEN 1 ELSE 0 END) as free
      FROM users`,
    ).first<any>();
    m.users = { total: u?.total || 0, pro: u?.pro || 0, free: u?.free || 0 };
  } catch { m.users = { total: 0, pro: 0, free: 0 }; }

  // LS revenue
  m.ls = {
    mtd_usd: await sumInWindow(env, "revenue_usd", 30),     // last 30d as proxy for MTD
    week_usd: await sumInWindow(env, "revenue_usd", 7),
    payments_30d: await countInWindow(env, "payment_success", 30),
    refunds_30d: await sumInWindow(env, "refund_usd", 30),
    refund_count_30d: await countInWindow(env, "refund_count", 30),
    sub_created_30d: await countInWindow(env, "subscription_created", 30),
    sub_cancelled_30d: await countInWindow(env, "subscription_cancelled", 30),
  };

  // x402 revenue
  m.x402 = {
    revenue_30d: await sumInWindow(env, "x402_revenue_usdc", 30),
    revenue_7d: await sumInWindow(env, "x402_revenue_usdc", 7),
    settlements_30d: await countInWindow(env, "x402_settlements", 30),
    settlements_24h: await countInWindow(env, "x402_settlements", 1),
  };

  // GitHub
  m.github = {
    stars: (await getLatest(env, "github_stars"))?.value || 0,
    forks: (await getLatest(env, "github_forks"))?.value || 0,
    issues: (await getLatest(env, "github_issues"))?.value || 0,
  };

  // Marketing manual entries
  m.marketing = {
    ph_upvotes: (await getLatest(env, "ph_upvotes"))?.value || 0,
    twitter_followers: (await getLatest(env, "twitter_followers"))?.value || 0,
    affiliate_clicks_30d: await sumInWindow(env, "affiliate_clicks", 30),
    affiliate_revenue_30d: await sumInWindow(env, "affiliate_revenue_usd", 30),
  };

  return m;
}

async function getLiveStatus(env: Env): Promise<any> {
  const status: any = { x402: null, smoke: null, bazaar: null, services: null, cron: {} };

  // x402 health
  try {
    const r = await fetch(`${env.APP_URL}/v1/providers`, { signal: AbortSignal.timeout(5000) });
    if (r.ok) {
      const j = (await r.json()) as any;
      status.x402 = { ok: true, records: j.total_records || 0, providers: (j.providers || []).length };
    } else {
      status.x402 = { ok: false, status: r.status };
    }
  } catch (e: any) {
    status.x402 = { ok: false, error: e?.message || "network" };
  }

  // Smoke test results from KV
  const smokeTargets = ["landing", "health", "x402-providers", "docs-api", "openapi", "x402-paid-402"];
  let smokeOk = 0;
  let smokeFail = 0;
  let smokeStates: any[] = [];
  for (const t of smokeTargets) {
    const s = await env.KV.get(`smoke:${t}`);
    if (s) {
      const parsed = JSON.parse(s);
      if (parsed.status === "ok") smokeOk++;
      else smokeFail++;
      smokeStates.push({ target: t, ...parsed });
    } else {
      smokeStates.push({ target: t, status: "unknown" });
    }
  }
  status.smoke = { ok: smokeOk, fail: smokeFail, total: smokeTargets.length, states: smokeStates };

  // Bazaar
  const indexed = await env.KV.get("bazaar:indexed");
  status.bazaar = { indexed: indexed === "1" };

  // FT services count
  try {
    const rs = await env.DB.prepare("SELECT COUNT(*) as n, SUM(CASE WHEN last_status='ok' THEN 1 ELSE 0 END) as ok_n FROM services").first<any>();
    status.services = { total: rs?.n || 0, ok: rs?.ok_n || 0 };
  } catch { status.services = { total: 0, ok: 0 }; }

  // Cron last runs (if we tracked them in KV)
  for (const k of ["smoke", "bazaar", "digest", "services"]) {
    const ts = await env.KV.get(`cron:last:${k}`);
    status.cron[k] = ts ? parseInt(ts, 10) : null;
  }

  return status;
}

// ─────────────────────────────────────────────────────────────────────
// HTML rendering
// ─────────────────────────────────────────────────────────────────────
function html(strings: TemplateStringsArray, ...values: any[]): string {
  let out = "";
  strings.forEach((s, i) => {
    out += s + (values[i] !== undefined ? values[i] : "");
  });
  return out;
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));
}

function relTime(ts: number | null): string {
  if (!ts) return "—";
  const diff = Math.floor(Date.now() / 1000) - ts;
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function progressBar(done: number, total: number): string {
  if (total === 0) return `<div class="text-xs text-slate-500">no tasks</div>`;
  const pct = Math.round((done / total) * 100);
  const color = pct === 100 ? "bg-green-500" : pct >= 50 ? "bg-blue-500" : "bg-amber-500";
  return html`<div class="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
    <div class="${color} h-2 transition-all" style="width: ${pct}%"></div>
  </div>
  <div class="text-xs text-slate-400 mt-1">${done}/${total} done · ${pct}%</div>`;
}

function scheduleItem(title: string, dateStr: string, icon: string): string {
  const target = new Date(dateStr + "T00:00:00Z");
  const days = Math.ceil((target.getTime() - Date.now()) / 86400000);
  const dStr = days > 0 ? `D-${days}` : days === 0 ? "TODAY" : `+${-days}d`;
  const color = days <= 1 ? "text-red-400" : days <= 7 ? "text-amber-400" : days <= 30 ? "text-blue-400" : "text-slate-400";
  return html`<div class="flex justify-between items-center py-2 px-3 bg-slate-950 rounded border border-slate-800">
    <div class="flex items-center gap-3">
      <span>${icon}</span>
      <div>
        <div class="text-sm text-slate-200">${title}</div>
        <div class="text-xs text-slate-500 font-mono">${dateStr}</div>
      </div>
    </div>
    <span class="${color} font-mono font-bold">${dStr}</span>
  </div>`;
}

function fmtUsd(n: number): string {
  if (n === 0) return "$0";
  if (n < 1) return `$${n.toFixed(3)}`;
  if (n < 100) return `$${n.toFixed(2)}`;
  return `$${Math.round(n).toLocaleString()}`;
}

function renderDashboard(tasks: any[], status: any, notes: string, alerts: any[], biz: any): string {
  const today = new Date();
  const daysToLaunch = Math.ceil((PH_LAUNCH.getTime() - today.getTime()) / 86400000);
  const dStr = daysToLaunch > 0 ? `D-${daysToLaunch}` : daysToLaunch === 0 ? "🚀 LAUNCH DAY" : `+${-daysToLaunch} 후속`;

  const byPriority: Record<string, any[]> = { p0: [], p1: [], p2: [] };
  for (const t of tasks) {
    if (byPriority[t.priority]) byPriority[t.priority].push(t);
  }

  const priorityMeta: Record<string, { label: string; color: string; icon: string }> = {
    p0: { label: "P0 — Critical", color: "text-red-400", icon: "🔴" },
    p1: { label: "P1 — Important", color: "text-amber-400", icon: "🟡" },
    p2: { label: "P2 — Future", color: "text-emerald-400", icon: "🟢" },
  };

  const renderTaskList = (priority: string) => {
    const items = byPriority[priority] || [];
    const done = items.filter((t) => t.done).length;
    const meta = priorityMeta[priority];
    return html`
      <section class="bg-slate-900 rounded-lg p-4 border border-slate-800">
        <div class="flex items-baseline justify-between mb-3">
          <h2 class="text-lg font-semibold ${meta.color}">${meta.icon} ${meta.label}</h2>
          <span class="text-xs text-slate-400">${done}/${items.length}</span>
        </div>
        ${progressBar(done, items.length)}
        <ul class="mt-3 space-y-1.5">
          ${items
            .map(
              (t) => html`
            <li class="flex items-start gap-2 group hover:bg-slate-800/50 px-2 py-1 rounded">
              <input type="checkbox" data-task-id="${t.id}" ${t.done ? "checked" : ""}
                     class="task-toggle mt-1 w-4 h-4 cursor-pointer accent-blue-500">
              <span class="flex-1 text-sm ${t.done ? "line-through text-slate-500" : "text-slate-200"}">
                ${escapeHtml(t.title)}
                ${t.category ? `<span class="ml-2 text-xs text-slate-500">[${escapeHtml(t.category)}]</span>` : ""}
              </span>
              <button data-delete-id="${t.id}" class="task-delete opacity-0 group-hover:opacity-50 hover:opacity-100 text-xs text-slate-500 hover:text-red-400">✕</button>
            </li>`,
            )
            .join("")}
        </ul>
        <form data-add-form class="mt-3 flex gap-2">
          <input type="hidden" name="priority" value="${priority}">
          <input name="title" placeholder="Add task..." class="flex-1 bg-slate-800 border border-slate-700 rounded px-2 py-1 text-sm focus:outline-none focus:border-blue-500" required>
          <button class="text-xs bg-slate-800 hover:bg-slate-700 px-3 py-1 rounded border border-slate-700">Add</button>
        </form>
      </section>`;
  };

  // Status icons
  const statusIcon = (ok: boolean | null | undefined) => (ok === null || ok === undefined ? "⚪" : ok ? "🟢" : "🔴");
  const x402State = status.x402?.ok ? `${status.x402.records} recs · ${status.x402.providers} prov` : `down: ${status.x402?.error || status.x402?.status || "?"}`;
  const smokeBar = `${status.smoke.ok}/${status.smoke.total}`;
  const smokeIcons = status.smoke.states.map((s: any) => s.status === "ok" ? "✅" : s.status === "fail" ? "🔴" : "⚪").join("");

  return html`<!doctype html>
<html lang="ko" class="dark">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex">
<title>Mission Control · FreeTier Sentinel</title>
<script src="https://cdn.tailwindcss.com"></script>
<style>
  body { font-family: -apple-system, BlinkMacSystemFont, "Inter", "Pretendard", system-ui, sans-serif; }
  input[type="checkbox"]:checked { accent-color: #3b82f6; }
  .chapter-nav { position: sticky; top: 0; z-index: 50; background: rgba(2,6,23,0.85); backdrop-filter: blur(12px); border-bottom: 1px solid #1e293b; }
  .chapter-nav-inner { max-width: 80rem; margin: 0 auto; padding: 0 16px; display: flex; gap: 2px; overflow-x: auto; }
  .chapter-tab { display: inline-flex; align-items: center; gap: 6px; padding: 14px 14px 12px; font-size: 13px; font-weight: 500; color: #94a3b8; border-bottom: 2px solid transparent; text-decoration: none; white-space: nowrap; transition: color .15s, border-color .15s, background-color .15s; }
  .chapter-tab:hover { color: #e2e8f0; background: rgba(255,255,255,.03); }
  .chapter-tab.active { color: #f8fafc; border-bottom-color: #3b82f6; }
  .chapter-tab .badge { font-size: 10px; font-weight: 600; padding: 1px 6px; border-radius: 10px; background: #1e293b; color: #94a3b8; }
  .chapter-tab.coming { color: #475569; cursor: not-allowed; }
  .chapter-tab.coming:hover { color: #475569; background: transparent; }
</style>
</head>
<body class="bg-slate-950 text-slate-100 min-h-screen">

<!-- Chapter navigation (shared layout) -->
<nav class="chapter-nav">
  <div class="chapter-nav-inner">
    <a href="/admin" class="chapter-tab active">📋 Mission Control</a>
    <a href="/admin/architecture" class="chapter-tab">🗺️ Architecture</a>
    <a href="/admin/smoke" class="chapter-tab">🧪 Smoke <span class="badge">6</span></a>
    <a href="/admin/memory" class="chapter-tab">🧠 Memory <span class="badge">22</span></a>
    <a href="/admin/logs" class="chapter-tab">📜 Logs</a>
    <a href="/inbox" class="chapter-tab">📬 Inbox</a>
  </div>
</nav>

<div class="max-w-7xl mx-auto p-4 md:p-6">

  <!-- Header -->
  <header class="mb-6">
    <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
      <div>
        <h1 class="text-2xl md:text-3xl font-bold tracking-tight">
          🛰️ Mission Control
        </h1>
        <p class="text-sm text-slate-400 mt-1">FreeTier Sentinel · Operator Console</p>
      </div>
      <div class="flex items-center gap-4">
        <div class="text-right">
          <div class="text-xs text-slate-400">PH Launch (5/12)</div>
          <div class="text-2xl font-bold ${daysToLaunch <= 1 ? "text-red-400" : daysToLaunch <= 3 ? "text-amber-400" : "text-emerald-400"}">${dStr}</div>
        </div>
        <button onclick="location.reload()" class="bg-slate-800 hover:bg-slate-700 px-3 py-2 rounded border border-slate-700 text-sm" title="Refresh">↻</button>
      </div>
    </div>

    <!-- Status strip -->
    <div class="mt-4 grid grid-cols-2 md:grid-cols-5 gap-2 text-xs">
      <div class="bg-slate-900 border border-slate-800 rounded p-2">
        <div class="text-slate-400">x402</div>
        <div class="font-mono">${statusIcon(status.x402?.ok)} ${x402State}</div>
      </div>
      <div class="bg-slate-900 border border-slate-800 rounded p-2">
        <div class="text-slate-400">Smoke</div>
        <div class="font-mono">${smokeIcons} ${smokeBar}</div>
      </div>
      <div class="bg-slate-900 border border-slate-800 rounded p-2">
        <div class="text-slate-400">Bazaar</div>
        <div class="font-mono">${status.bazaar?.indexed ? "🟢 indexed" : "⏳ pending"}</div>
      </div>
      <div class="bg-slate-900 border border-slate-800 rounded p-2">
        <div class="text-slate-400">Services</div>
        <div class="font-mono">${status.services.ok}/${status.services.total} ok</div>
      </div>
      <div class="bg-slate-900 border border-slate-800 rounded p-2">
        <div class="text-slate-400">Last digest</div>
        <div class="font-mono">${relTime(status.cron?.digest)}</div>
      </div>
    </div>
  </header>

  <!-- Tab navigation -->
  <nav class="mb-4 flex gap-0.5 border-b border-slate-800 overflow-x-auto text-sm">
    <button data-tab-link="tasks"       class="tab-btn px-3 py-2 font-medium border-b-2 border-blue-500 text-blue-400 whitespace-nowrap">📋 업무</button>
    <button data-tab-link="payments"    class="tab-btn px-3 py-2 font-medium border-b-2 border-transparent text-slate-400 hover:text-slate-200 whitespace-nowrap">💰 결제</button>
    <button data-tab-link="marketing"   class="tab-btn px-3 py-2 font-medium border-b-2 border-transparent text-slate-400 hover:text-slate-200 whitespace-nowrap">📣 마케팅</button>
    <button data-tab-link="affiliate"   class="tab-btn px-3 py-2 font-medium border-b-2 border-transparent text-slate-400 hover:text-slate-200 whitespace-nowrap">🤝 어필리에이트</button>
    <button data-tab-link="analytics"   class="tab-btn px-3 py-2 font-medium border-b-2 border-transparent text-slate-400 hover:text-slate-200 whitespace-nowrap">📊 분석</button>
    <button data-tab-link="goals"       class="tab-btn px-3 py-2 font-medium border-b-2 border-transparent text-slate-400 hover:text-slate-200 whitespace-nowrap">🎯 목표</button>
    <button data-tab-link="schedule"    class="tab-btn px-3 py-2 font-medium border-b-2 border-transparent text-slate-400 hover:text-slate-200 whitespace-nowrap">📅 일정</button>
    <button data-tab-link="community"   class="tab-btn px-3 py-2 font-medium border-b-2 border-transparent text-slate-400 hover:text-slate-200 whitespace-nowrap">💬 커뮤니티</button>
    <button data-tab-link="experiments" class="tab-btn px-3 py-2 font-medium border-b-2 border-transparent text-slate-400 hover:text-slate-200 whitespace-nowrap">🧪 실험</button>
    <button data-tab-link="incidents"   class="tab-btn px-3 py-2 font-medium border-b-2 border-transparent text-slate-400 hover:text-slate-200 whitespace-nowrap">🚨 인시던트</button>
    <button data-tab-link="system"      class="tab-btn px-3 py-2 font-medium border-b-2 border-transparent text-slate-400 hover:text-slate-200 whitespace-nowrap">🛠️ 시스템</button>
    <button data-tab-link="misc"        class="tab-btn px-3 py-2 font-medium border-b-2 border-transparent text-slate-400 hover:text-slate-200 whitespace-nowrap">⚙️ 기타</button>
  </nav>

  <!-- TAB: 업무 (Tasks) -->
  <div data-tab-pane="tasks">
  <div class="grid grid-cols-1 lg:grid-cols-3 gap-4">

    <!-- Tasks (left 2/3) -->
    <div class="lg:col-span-2 space-y-4">

      <!-- 💰 Business panel (REMOVED — moved to Payments tab) -->
      <section class="hidden">
        <h2 class="text-lg font-semibold text-emerald-400 mb-3">💰 Revenue & Subscribers</h2>
        <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div class="bg-slate-950 rounded p-3 border border-slate-800">
            <div class="text-xs text-slate-400">Pro 구독자</div>
            <div class="text-2xl font-bold text-slate-100">${biz.users.pro}</div>
            <div class="text-xs text-slate-500">총 ${biz.users.total} (free ${biz.users.free})</div>
          </div>
          <div class="bg-slate-950 rounded p-3 border border-slate-800">
            <div class="text-xs text-slate-400">LS MRR (30d)</div>
            <div class="text-2xl font-bold text-emerald-400">${fmtUsd(biz.ls.mtd_usd)}</div>
            <div class="text-xs text-slate-500">${biz.ls.payments_30d}건 결제</div>
          </div>
          <div class="bg-slate-950 rounded p-3 border border-slate-800">
            <div class="text-xs text-slate-400">x402 (30d)</div>
            <div class="text-2xl font-bold text-blue-400">${fmtUsd(biz.x402.revenue_30d)}</div>
            <div class="text-xs text-slate-500">${biz.x402.settlements_30d}건 settle</div>
          </div>
          <div class="bg-slate-950 rounded p-3 border border-slate-800">
            <div class="text-xs text-slate-400">환불 (30d)</div>
            <div class="text-2xl font-bold text-red-400">${fmtUsd(biz.ls.refunds_30d)}</div>
            <div class="text-xs text-slate-500">${biz.ls.refund_count_30d}건</div>
          </div>
        </div>
        <div class="mt-3 grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
          <div class="text-slate-400">신규 구독 30d: <span class="text-slate-200">${biz.ls.sub_created_30d}</span></div>
          <div class="text-slate-400">취소 30d: <span class="text-slate-200">${biz.ls.sub_cancelled_30d}</span></div>
          <div class="text-slate-400">x402 7d: <span class="text-slate-200">${fmtUsd(biz.x402.revenue_7d)}</span></div>
          <div class="text-slate-400">x402 24h: <span class="text-slate-200">${biz.x402.settlements_24h}건</span></div>
        </div>
        ${biz.ls.mtd_usd === 0 && biz.ls.payments_30d === 0 ? `
        <div class="mt-3 text-xs text-amber-400 bg-amber-950/40 border border-amber-900 rounded px-2 py-1">
          ⏳ LS verification 대기 중. 승인 후 자동으로 데이터 수집 시작.
        </div>` : ""}
      </section>

      <!-- 📣 Marketing panel (REMOVED — moved to Marketing tab) -->
      <section class="hidden">
        <h2 class="text-lg font-semibold text-purple-400 mb-3">📣 Marketing</h2>
        <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div class="bg-slate-950 rounded p-3 border border-slate-800">
            <div class="text-xs text-slate-400">GitHub ⭐</div>
            <div class="text-2xl font-bold text-yellow-400">${biz.github.stars}</div>
            <div class="text-xs text-slate-500">${biz.github.forks} fork · ${biz.github.issues} issue</div>
          </div>
          <div class="bg-slate-950 rounded p-3 border border-slate-800">
            <div class="text-xs text-slate-400">PH upvotes</div>
            <div class="text-2xl font-bold text-orange-400">${biz.marketing.ph_upvotes || "—"}</div>
            <div class="text-xs text-slate-500">5/12 런치 후</div>
          </div>
          <div class="bg-slate-950 rounded p-3 border border-slate-800">
            <div class="text-xs text-slate-400">Twitter 팔로워</div>
            <div class="text-2xl font-bold text-sky-400">${biz.marketing.twitter_followers || "—"}</div>
            <div class="text-xs text-slate-500">@gangjuw79180262</div>
          </div>
          <div class="bg-slate-950 rounded p-3 border border-slate-800">
            <div class="text-xs text-slate-400">어필리에이트 (30d)</div>
            <div class="text-2xl font-bold text-pink-400">${fmtUsd(biz.marketing.affiliate_revenue_30d)}</div>
            <div class="text-xs text-slate-500">${biz.marketing.affiliate_clicks_30d || 0} 클릭</div>
          </div>
        </div>

        <!-- Manual metric entry -->
        <details class="mt-3">
          <summary class="text-xs text-slate-400 cursor-pointer hover:text-slate-200">📝 수동 메트릭 입력</summary>
          <form data-metric-form class="mt-2 grid grid-cols-1 md:grid-cols-3 gap-2">
            <select name="metric" class="bg-slate-950 border border-slate-700 rounded px-2 py-1 text-xs">
              <option value="ph_upvotes">PH upvotes</option>
              <option value="twitter_followers">Twitter 팔로워</option>
              <option value="affiliate_clicks">어필리에이트 클릭</option>
              <option value="affiliate_revenue_usd">어필리에이트 매출 USD</option>
              <option value="ih_engagement">IndieHackers engagement</option>
              <option value="reddit_karma">Reddit karma</option>
              <option value="disquiet_likes">Disquiet 좋아요</option>
              <option value="hn_points">Hacker News points</option>
            </select>
            <input name="value" type="number" step="0.01" placeholder="값" class="bg-slate-950 border border-slate-700 rounded px-2 py-1 text-xs" required>
            <button class="bg-slate-800 hover:bg-slate-700 px-3 py-1 rounded text-xs border border-slate-700">기록</button>
          </form>
          <div id="metric-status" class="text-xs text-slate-500 mt-1 hidden"></div>
        </details>
      </section>

      ${renderTaskList("p0")}
      ${renderTaskList("p1")}
      ${renderTaskList("p2")}
    </div>

    <!-- Right column (slim — 업무 focused) -->
    <aside class="space-y-4">

      <!-- Quick actions -->
      <section class="bg-slate-900 rounded-lg p-4 border border-slate-800">
        <h3 class="text-sm font-semibold text-slate-300 mb-3">⚡ Quick Actions</h3>
        <div class="grid grid-cols-2 gap-2">
          <button data-action="run-smoke" class="action-btn bg-slate-800 hover:bg-slate-700 px-3 py-2 rounded text-xs border border-slate-700">Run smoke</button>
          <button data-action="run-bazaar" class="action-btn bg-slate-800 hover:bg-slate-700 px-3 py-2 rounded text-xs border border-slate-700">Poll Bazaar</button>
          <button data-action="run-digest" class="action-btn bg-slate-800 hover:bg-slate-700 px-3 py-2 rounded text-xs border border-slate-700">Send digest</button>
          <button data-action="run-metrics" class="action-btn bg-slate-800 hover:bg-slate-700 px-3 py-2 rounded text-xs border border-slate-700">Refresh metrics</button>
        </div>
        <div id="action-status" class="text-xs text-slate-400 mt-2 hidden"></div>
        <div class="text-xs text-slate-500 mt-2">시스템 / 기타 탭에 상세 정보</div>
      </section>

      <!-- Notes -->
      <section class="bg-slate-900 rounded-lg p-4 border border-slate-800">
        <h3 class="text-sm font-semibold text-slate-300 mb-2">📝 Notes</h3>
        <textarea id="notes" class="w-full bg-slate-950 border border-slate-700 rounded p-2 text-sm h-32 focus:outline-none focus:border-blue-500" placeholder="Quick notes (auto-saved)...">${escapeHtml(notes)}</textarea>
        <div id="notes-status" class="text-xs text-slate-500 mt-1">saved</div>
      </section>

    </aside>
  </div>
  </div><!-- /tab tasks -->

  <!-- TAB: 결제 (Payments) -->
  <div data-tab-pane="payments" class="hidden">
    <div class="space-y-4">

      <!-- Top KPIs -->
      <section class="bg-slate-900 rounded-lg p-4 border border-slate-800">
        <h2 class="text-lg font-semibold text-emerald-400 mb-4">💰 결제 현황</h2>
        <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div class="bg-slate-950 rounded p-4 border border-slate-800">
            <div class="text-xs text-slate-400">Pro 구독자</div>
            <div class="text-3xl font-bold text-slate-100 mt-1">${biz.users.pro}</div>
            <div class="text-xs text-slate-500 mt-1">총 ${biz.users.total} (free ${biz.users.free})</div>
          </div>
          <div class="bg-slate-950 rounded p-4 border border-slate-800">
            <div class="text-xs text-slate-400">LS MRR (30d)</div>
            <div class="text-3xl font-bold text-emerald-400 mt-1">${fmtUsd(biz.ls.mtd_usd)}</div>
            <div class="text-xs text-slate-500 mt-1">${biz.ls.payments_30d} payments</div>
          </div>
          <div class="bg-slate-950 rounded p-4 border border-slate-800">
            <div class="text-xs text-slate-400">x402 (30d)</div>
            <div class="text-3xl font-bold text-blue-400 mt-1">${fmtUsd(biz.x402.revenue_30d)}</div>
            <div class="text-xs text-slate-500 mt-1">${biz.x402.settlements_30d} settlements</div>
          </div>
          <div class="bg-slate-950 rounded p-4 border border-slate-800">
            <div class="text-xs text-slate-400">환불 (30d)</div>
            <div class="text-3xl font-bold text-red-400 mt-1">${fmtUsd(biz.ls.refunds_30d)}</div>
            <div class="text-xs text-slate-500 mt-1">${biz.ls.refund_count_30d} refunds</div>
          </div>
        </div>
      </section>

      <!-- Subscription movement -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <section class="bg-slate-900 rounded-lg p-4 border border-slate-800">
          <h3 class="text-sm font-semibold text-slate-300 mb-3">📈 구독 변동 (30d)</h3>
          <div class="space-y-2 text-sm">
            <div class="flex justify-between">
              <span class="text-slate-400">신규 구독</span>
              <span class="text-emerald-400 font-mono">+${biz.ls.sub_created_30d}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-slate-400">취소</span>
              <span class="text-red-400 font-mono">-${biz.ls.sub_cancelled_30d}</span>
            </div>
            <div class="flex justify-between border-t border-slate-800 pt-2">
              <span class="text-slate-400">순증감</span>
              <span class="font-mono ${(biz.ls.sub_created_30d - biz.ls.sub_cancelled_30d) >= 0 ? 'text-emerald-400' : 'text-red-400'}">
                ${(biz.ls.sub_created_30d - biz.ls.sub_cancelled_30d) >= 0 ? '+' : ''}${biz.ls.sub_created_30d - biz.ls.sub_cancelled_30d}
              </span>
            </div>
          </div>
        </section>

        <section class="bg-slate-900 rounded-lg p-4 border border-slate-800">
          <h3 class="text-sm font-semibold text-slate-300 mb-3">⚡ x402 활동</h3>
          <div class="space-y-2 text-sm">
            <div class="flex justify-between">
              <span class="text-slate-400">7일 매출</span>
              <span class="font-mono">${fmtUsd(biz.x402.revenue_7d)}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-slate-400">24시간 settle</span>
              <span class="font-mono">${biz.x402.settlements_24h} 건</span>
            </div>
            <div class="flex justify-between">
              <span class="text-slate-400">Bazaar 인덱싱</span>
              <span class="font-mono">${status.bazaar?.indexed ? '✅ 활성' : '⏳ pending'}</span>
            </div>
          </div>
        </section>
      </div>

      <!-- Pro subscribers table -->
      <section class="bg-slate-900 rounded-lg p-4 border border-slate-800">
        <h3 class="text-sm font-semibold text-slate-300 mb-3">👥 Pro 구독자 (최근 20)</h3>
        ${biz.users.pro === 0 ? `
          <div class="text-xs text-slate-500 italic">아직 Pro 구독자 없음. LS verification 승인 후 첫 구독부터 자동 표시.</div>
        ` : `
          <div class="text-xs text-slate-400">${biz.users.pro}명 활성 — DB에서 직접 조회</div>
        `}
      </section>

      <!-- Recent settlements -->
      <section class="bg-slate-900 rounded-lg p-4 border border-slate-800">
        <h3 class="text-sm font-semibold text-slate-300 mb-3">💸 최근 x402 결제</h3>
        ${biz.x402.settlements_30d === 0 ? `
          <div class="text-xs text-slate-500 italic">아직 settlement 없음. 첫 USDC 결제 시 자동 기록 + Bazaar 인덱싱 트리거.</div>
        ` : `
          <div class="text-xs text-slate-400">${biz.x402.settlements_30d}건 (최근 30일) — D1 metric_snapshots 조회</div>
        `}
      </section>

      <!-- Status warnings -->
      ${biz.ls.mtd_usd === 0 && biz.ls.payments_30d === 0 ? `
      <section class="bg-amber-950/40 border border-amber-900 rounded-lg p-4">
        <h3 class="text-sm font-semibold text-amber-400 mb-2">⏳ LS Verification 대기 중</h3>
        <div class="text-xs text-amber-300 space-y-1">
          <div>• 5/6 메일 보냄, 응답 대기 (1-3일)</div>
          <div>• 승인 후 webhook → 이 패널 자동 활성화</div>
          <div>• 구독/매출/환불 데이터 자동 누적 시작</div>
        </div>
      </section>
      ` : ""}

    </div>
  </div><!-- /tab payments -->

  <!-- TAB: 마케팅 (Marketing) -->
  <div data-tab-pane="marketing" class="hidden">
    <div class="space-y-4">

      <!-- Top KPIs -->
      <section class="bg-slate-900 rounded-lg p-4 border border-slate-800">
        <h2 class="text-lg font-semibold text-purple-400 mb-4">📣 마케팅 현황</h2>
        <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div class="bg-slate-950 rounded p-4 border border-slate-800">
            <div class="text-xs text-slate-400">GitHub ⭐</div>
            <div class="text-3xl font-bold text-yellow-400 mt-1">${biz.github.stars}</div>
            <div class="text-xs text-slate-500 mt-1">${biz.github.forks} fork · ${biz.github.issues} issue</div>
          </div>
          <div class="bg-slate-950 rounded p-4 border border-slate-800">
            <div class="text-xs text-slate-400">PH upvotes</div>
            <div class="text-3xl font-bold text-orange-400 mt-1">${biz.marketing.ph_upvotes || "—"}</div>
            <div class="text-xs text-slate-500 mt-1">5/12 런치 후 입력</div>
          </div>
          <div class="bg-slate-950 rounded p-4 border border-slate-800">
            <div class="text-xs text-slate-400">Twitter 팔로워</div>
            <div class="text-3xl font-bold text-sky-400 mt-1">${biz.marketing.twitter_followers || "—"}</div>
            <div class="text-xs text-slate-500 mt-1">@gangjuw79180262</div>
          </div>
          <div class="bg-slate-950 rounded p-4 border border-slate-800">
            <div class="text-xs text-slate-400">Affiliate 매출 (30d)</div>
            <div class="text-3xl font-bold text-pink-400 mt-1">${fmtUsd(biz.marketing.affiliate_revenue_30d)}</div>
            <div class="text-xs text-slate-500 mt-1">${biz.marketing.affiliate_clicks_30d || 0} 클릭</div>
          </div>
        </div>
      </section>

      <!-- Channels grid -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <section class="bg-slate-900 rounded-lg p-4 border border-slate-800">
          <h3 class="text-sm font-semibold text-slate-300 mb-3">📰 콘텐츠 채널</h3>
          <ul class="text-sm space-y-2">
            <li class="flex justify-between"><span class="text-slate-400">IndieHackers</span><a href="https://www.indiehackers.com" target="_blank" class="text-blue-400 hover:underline text-xs">post →</a></li>
            <li class="flex justify-between"><span class="text-slate-400">Reddit r/indiehackers</span><a href="https://reddit.com/r/indiehackers" target="_blank" class="text-blue-400 hover:underline text-xs">post →</a></li>
            <li class="flex justify-between"><span class="text-slate-400">Hacker News</span><a href="https://news.ycombinator.com" target="_blank" class="text-blue-400 hover:underline text-xs">submit →</a></li>
            <li class="flex justify-between"><span class="text-slate-400">Disquiet (KR)</span><a href="https://disquiet.io" target="_blank" class="text-blue-400 hover:underline text-xs">profile →</a></li>
            <li class="flex justify-between"><span class="text-slate-400">Product Hunt</span><a href="https://producthunt.com/products/freetier-sentinel" target="_blank" class="text-blue-400 hover:underline text-xs">page →</a></li>
            <li class="flex justify-between"><span class="text-slate-400">Twitter/X</span><a href="https://x.com/gangjuw79180262" target="_blank" class="text-blue-400 hover:underline text-xs">profile →</a></li>
          </ul>
        </section>

        <section class="bg-slate-900 rounded-lg p-4 border border-slate-800">
          <h3 class="text-sm font-semibold text-slate-300 mb-3">🤝 어필리에이트 프로그램</h3>
          <ul class="text-sm space-y-2">
            <li class="flex justify-between"><span class="text-slate-400">Amazon Associates</span><span class="text-emerald-400 text-xs">✅ 승인 (juwon3865-20)</span></li>
            <li class="flex justify-between"><span class="text-slate-400">Buzzsprout</span><span class="text-emerald-400 text-xs">✅ 링크</span></li>
            <li class="flex justify-between"><span class="text-slate-400">PartnerStack</span><span class="text-red-400 text-xs">❌ 거절</span></li>
            <li class="flex justify-between"><span class="text-slate-400">Notion Affiliates</span><span class="text-amber-400 text-xs">⏳ 대기</span></li>
            <li class="flex justify-between"><span class="text-slate-400">Kit (ConvertKit)</span><span class="text-amber-400 text-xs">⏳ 대기</span></li>
            <li class="flex justify-between"><span class="text-slate-400">Buttondown</span><span class="text-amber-400 text-xs">⏳ 대기</span></li>
            <li class="flex justify-between"><span class="text-slate-400">Impact Radius</span><span class="text-slate-500 text-xs">미가입</span></li>
            <li class="flex justify-between"><span class="text-slate-400">Amazon KR</span><span class="text-slate-500 text-xs">미가입</span></li>
          </ul>
        </section>
      </div>

      <!-- Manual entry -->
      <section class="bg-slate-900 rounded-lg p-4 border border-slate-800">
        <h3 class="text-sm font-semibold text-slate-300 mb-3">📝 수동 메트릭 입력</h3>
        <p class="text-xs text-slate-500 mb-3">API 없는 메트릭 (PH/X/어필리에이트) 수동 기록. 시계열로 D1에 저장.</p>
        <form data-metric-form class="grid grid-cols-1 md:grid-cols-3 gap-2">
          <select name="metric" class="bg-slate-950 border border-slate-700 rounded px-2 py-2 text-sm">
            <option value="ph_upvotes">PH upvotes</option>
            <option value="ph_comments">PH comments</option>
            <option value="twitter_followers">Twitter 팔로워</option>
            <option value="twitter_impressions">Twitter impressions</option>
            <option value="affiliate_clicks">어필리에이트 클릭</option>
            <option value="affiliate_revenue_usd">어필리에이트 매출 USD</option>
            <option value="ih_engagement">IndieHackers engagement</option>
            <option value="reddit_karma">Reddit karma</option>
            <option value="reddit_post_score">Reddit post score</option>
            <option value="disquiet_likes">Disquiet 좋아요</option>
            <option value="hn_points">Hacker News points</option>
            <option value="newsletter_subs">Newsletter 구독자</option>
          </select>
          <input name="value" type="number" step="0.01" placeholder="값 입력" class="bg-slate-950 border border-slate-700 rounded px-2 py-2 text-sm" required>
          <button class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm font-medium">기록</button>
        </form>
        <div id="metric-status" class="text-xs text-slate-500 mt-2 hidden"></div>
      </section>

    </div>
  </div><!-- /tab marketing -->

  <!-- TAB: 어필리에이트 (Affiliate) -->
  <div data-tab-pane="affiliate" class="hidden">
    <div class="space-y-4">
      <section class="bg-slate-900 rounded-lg p-4 border border-slate-800">
        <h2 class="text-lg font-semibold text-pink-400 mb-3">🤝 어필리에이트 프로그램</h2>
        <p class="text-xs text-slate-500 mb-3">신청한 8개 프로그램 + 향후 추가. 매출은 수동 입력 (대부분 API 미공개).</p>
        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead class="text-xs text-slate-500 border-b border-slate-800">
              <tr>
                <th class="text-left py-2 px-2 font-normal">프로그램</th>
                <th class="text-left py-2 px-2 font-normal">상태</th>
                <th class="text-left py-2 px-2 font-normal">ID/링크</th>
                <th class="text-right py-2 px-2 font-normal">커미션</th>
                <th class="text-right py-2 px-2 font-normal">매출(30d)</th>
              </tr>
            </thead>
            <tbody class="text-slate-300">
              <tr class="border-b border-slate-800/50">
                <td class="py-2 px-2">Amazon Associates (US)</td>
                <td class="py-2 px-2"><span class="text-emerald-400 text-xs">✅ 승인</span></td>
                <td class="py-2 px-2 font-mono text-xs">juwon3865-20</td>
                <td class="text-right py-2 px-2 text-xs text-slate-400">1-10%</td>
                <td class="text-right py-2 px-2 font-mono">—</td>
              </tr>
              <tr class="border-b border-slate-800/50">
                <td class="py-2 px-2">Buzzsprout</td>
                <td class="py-2 px-2"><span class="text-emerald-400 text-xs">✅ 링크</span></td>
                <td class="py-2 px-2 text-xs"><a class="text-blue-400 hover:underline" href="https://www.buzzsprout.com/?referrer_id=2546776">referrer_id=2546776</a></td>
                <td class="text-right py-2 px-2 text-xs text-slate-400">$20/sub</td>
                <td class="text-right py-2 px-2 font-mono">—</td>
              </tr>
              <tr class="border-b border-slate-800/50">
                <td class="py-2 px-2">PartnerStack</td>
                <td class="py-2 px-2"><span class="text-red-400 text-xs">❌ 거절 (5/5)</span></td>
                <td class="py-2 px-2 text-xs text-slate-500">—</td>
                <td class="text-right py-2 px-2 text-xs text-slate-500">—</td>
                <td class="text-right py-2 px-2 text-slate-500">—</td>
              </tr>
              <tr class="border-b border-slate-800/50">
                <td class="py-2 px-2">Notion Affiliates</td>
                <td class="py-2 px-2"><span class="text-amber-400 text-xs">⏳ 검토</span></td>
                <td class="py-2 px-2 text-xs text-slate-500">신청 5/4</td>
                <td class="text-right py-2 px-2 text-xs text-slate-400">~50% 1Y</td>
                <td class="text-right py-2 px-2 text-slate-500">—</td>
              </tr>
              <tr class="border-b border-slate-800/50">
                <td class="py-2 px-2">Kit (ConvertKit)</td>
                <td class="py-2 px-2"><span class="text-amber-400 text-xs">⏳ 검토</span></td>
                <td class="py-2 px-2 text-xs text-slate-500">신청 5/4</td>
                <td class="text-right py-2 px-2 text-xs text-slate-400">30% 24mo</td>
                <td class="text-right py-2 px-2 text-slate-500">—</td>
              </tr>
              <tr class="border-b border-slate-800/50">
                <td class="py-2 px-2">Buttondown</td>
                <td class="py-2 px-2"><span class="text-amber-400 text-xs">⏳ 검토</span></td>
                <td class="py-2 px-2 text-xs text-slate-500">신청 5/4</td>
                <td class="text-right py-2 px-2 text-xs text-slate-400">—</td>
                <td class="text-right py-2 px-2 text-slate-500">—</td>
              </tr>
              <tr class="border-b border-slate-800/50">
                <td class="py-2 px-2">Impact Radius</td>
                <td class="py-2 px-2"><span class="text-slate-500 text-xs">⏸ 미가입</span></td>
                <td class="py-2 px-2 text-xs text-slate-500">PartnerStack 대안</td>
                <td class="text-right py-2 px-2 text-xs text-slate-400">varies</td>
                <td class="text-right py-2 px-2 text-slate-500">—</td>
              </tr>
              <tr class="border-b border-slate-800/50">
                <td class="py-2 px-2">Amazon Associates KR</td>
                <td class="py-2 px-2"><span class="text-slate-500 text-xs">⏸ 미가입</span></td>
                <td class="py-2 px-2 text-xs text-slate-500">한국 트래픽용</td>
                <td class="text-right py-2 px-2 text-xs text-slate-400">1-10%</td>
                <td class="text-right py-2 px-2 text-slate-500">—</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section class="bg-slate-900 rounded-lg p-4 border border-slate-800">
        <h3 class="text-sm font-semibold text-slate-300 mb-3">📝 프로그램별 매출 입력</h3>
        <p class="text-xs text-slate-500 mb-3">월별 또는 정산 도착 시 입력. 시계열로 D1에 누적.</p>
        <form data-affiliate-form class="grid grid-cols-1 md:grid-cols-3 gap-2">
          <select name="program" class="bg-slate-950 border border-slate-700 rounded px-2 py-2 text-sm">
            <option value="amazon_us">Amazon US</option>
            <option value="amazon_kr">Amazon KR</option>
            <option value="buzzsprout">Buzzsprout</option>
            <option value="notion">Notion</option>
            <option value="kit">Kit (ConvertKit)</option>
            <option value="buttondown">Buttondown</option>
            <option value="impact">Impact Radius</option>
            <option value="other">기타</option>
          </select>
          <input name="amount" type="number" step="0.01" placeholder="매출 USD" class="bg-slate-950 border border-slate-700 rounded px-2 py-2 text-sm" required>
          <button class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm font-medium">기록</button>
        </form>
        <div id="affiliate-status" class="text-xs text-slate-500 mt-2 hidden"></div>
      </section>

      <section class="bg-slate-900 rounded-lg p-4 border border-slate-800">
        <h3 class="text-sm font-semibold text-slate-300 mb-3">🔮 향후 추가 권장</h3>
        <ul class="text-xs space-y-1 text-slate-400">
          <li>• <strong>GitHub Sponsors</strong> — 너 OSS 활동 시</li>
          <li>• <strong>Gumroad / Lemon Squeezy 자체 어필리에이트</strong> — 프리미엄 가이드 PDF 판매 시</li>
          <li>• <strong>Cloudflare Partner</strong> — 인프라 추천</li>
          <li>• <strong>Stripe Partner</strong> — 결제 연동 추천</li>
        </ul>
      </section>
    </div>
  </div><!-- /tab affiliate -->

  <!-- TAB: 분석 (Analytics) -->
  <div data-tab-pane="analytics" class="hidden">
    <div class="space-y-4">
      <section class="bg-slate-900 rounded-lg p-4 border border-slate-800">
        <div class="flex items-center justify-between mb-3">
          <h2 class="text-lg font-semibold text-cyan-400">📊 트래픽 분석</h2>
          <span class="text-xs px-2 py-0.5 bg-amber-950/40 border border-amber-900 text-amber-400 rounded">Skeleton</span>
        </div>
        <p class="text-xs text-slate-500 mb-3">CF Web Analytics GraphQL API 통합 예정. 지금은 수동 입력.</p>
        <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div class="bg-slate-950 rounded p-4 border border-slate-800">
            <div class="text-xs text-slate-400">방문자 (24h)</div>
            <div class="text-3xl font-bold text-slate-100 mt-1">—</div>
            <div class="text-xs text-slate-500 mt-1">CF Analytics 대기</div>
          </div>
          <div class="bg-slate-950 rounded p-4 border border-slate-800">
            <div class="text-xs text-slate-400">PV (24h)</div>
            <div class="text-3xl font-bold text-slate-100 mt-1">—</div>
            <div class="text-xs text-slate-500 mt-1">CF Analytics 대기</div>
          </div>
          <div class="bg-slate-950 rounded p-4 border border-slate-800">
            <div class="text-xs text-slate-400">평균 LCP</div>
            <div class="text-3xl font-bold text-emerald-400 mt-1">—</div>
            <div class="text-xs text-slate-500 mt-1">Core Web Vitals</div>
          </div>
          <div class="bg-slate-950 rounded p-4 border border-slate-800">
            <div class="text-xs text-slate-400">전환율</div>
            <div class="text-3xl font-bold text-blue-400 mt-1">—</div>
            <div class="text-xs text-slate-500 mt-1">visit → signup</div>
          </div>
        </div>
      </section>

      <section class="bg-slate-900 rounded-lg p-4 border border-slate-800">
        <h3 class="text-sm font-semibold text-slate-300 mb-3">🚪 전환 Funnel (계획)</h3>
        <ol class="text-sm space-y-2">
          <li class="flex justify-between"><span class="text-slate-400">1. 랜딩 방문</span><span class="font-mono text-slate-500">—</span></li>
          <li class="flex justify-between"><span class="text-slate-400">2. /signup 폼 노출</span><span class="font-mono text-slate-500">—</span></li>
          <li class="flex justify-between"><span class="text-slate-400">3. 이메일 제출</span><span class="font-mono text-slate-500">—</span></li>
          <li class="flex justify-between"><span class="text-slate-400">4. 코드 인증 완료</span><span class="font-mono text-slate-500">—</span></li>
          <li class="flex justify-between"><span class="text-slate-400">5. 첫 서비스 추가</span><span class="font-mono text-slate-500">—</span></li>
          <li class="flex justify-between"><span class="text-slate-400">6. Pro 업그레이드</span><span class="font-mono text-slate-500">—</span></li>
        </ol>
      </section>

      <section class="bg-slate-900 rounded-lg p-4 border border-slate-800">
        <h3 class="text-sm font-semibold text-slate-300 mb-3">🌐 트래픽 소스 (계획)</h3>
        <p class="text-xs text-slate-500">Referrer 분석. PH 런치 후 데이터 누적 시작.</p>
        <ul class="text-xs space-y-1 mt-3 text-slate-500">
          <li>• Direct / 즐겨찾기</li>
          <li>• Product Hunt</li>
          <li>• Hacker News</li>
          <li>• Twitter/X</li>
          <li>• Reddit</li>
          <li>• IndieHackers</li>
          <li>• Disquiet</li>
          <li>• Google search</li>
        </ul>
      </section>

      <section class="bg-amber-950/30 border border-amber-900 rounded-lg p-4">
        <h3 class="text-sm font-semibold text-amber-400 mb-2">🚧 통합 TODO</h3>
        <ul class="text-xs text-amber-300 space-y-1">
          <li>1. Cloudflare API token 발급 (Analytics:Read)</li>
          <li>2. GraphQL Analytics API 연동 (tool/src/lib/cf-analytics.ts)</li>
          <li>3. 자동 폴링 cron (1시간)</li>
          <li>4. Funnel 이벤트 트래킹 — 회원가입 단계별 D1 기록</li>
        </ul>
      </section>
    </div>
  </div><!-- /tab analytics -->

  <!-- TAB: 목표 (Goals) -->
  <div data-tab-pane="goals" class="hidden">
    <div class="space-y-4">
      <section class="bg-slate-900 rounded-lg p-4 border border-slate-800">
        <h2 class="text-lg font-semibold text-emerald-400 mb-3">🎯 목표 & KPI</h2>

        <!-- Primary target -->
        <div class="bg-slate-950 rounded p-4 border border-slate-800 mb-4">
          <div class="flex justify-between items-baseline mb-2">
            <div>
              <div class="text-xs text-slate-400">Primary target (2026 EOY)</div>
              <div class="text-2xl font-bold text-emerald-400">$540 / 월 MRR</div>
              <div class="text-xs text-slate-500">≈ ₩750,000</div>
            </div>
            <div class="text-right">
              <div class="text-xs text-slate-400">현재</div>
              <div class="text-2xl font-bold text-slate-100">${fmtUsd(biz.ls.mtd_usd + biz.x402.revenue_30d)}</div>
              <div class="text-xs text-slate-500">$540 중 ${Math.round(((biz.ls.mtd_usd + biz.x402.revenue_30d) / 540) * 100)}%</div>
            </div>
          </div>
          <div class="w-full bg-slate-800 rounded-full h-3 overflow-hidden">
            <div class="bg-emerald-500 h-3 transition-all" style="width: ${Math.min(((biz.ls.mtd_usd + biz.x402.revenue_30d) / 540) * 100, 100)}%"></div>
          </div>
        </div>

        <!-- Stretch targets -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div class="bg-slate-950 rounded p-3 border border-slate-800">
            <div class="text-xs text-slate-400">Stretch (12mo)</div>
            <div class="text-xl font-bold text-blue-400">$1,500/mo</div>
            <div class="text-xs text-slate-500">새 합의 (5/6)</div>
          </div>
          <div class="bg-slate-950 rounded p-3 border border-slate-800">
            <div class="text-xs text-slate-400">Aggressive (12mo)</div>
            <div class="text-xl font-bold text-purple-400">$3,000/mo</div>
            <div class="text-xs text-slate-500">x402 portfolio 5-7개</div>
          </div>
          <div class="bg-slate-950 rounded * border border-slate-800">
            <div class="text-xs text-slate-400">Marc Lou tier</div>
            <div class="text-xl font-bold text-pink-400">$5,000/mo</div>
            <div class="text-xs text-slate-500">moonshot</div>
          </div>
        </div>
      </section>

      <!-- Milestones -->
      <section class="bg-slate-900 rounded-lg p-4 border border-slate-800">
        <h3 class="text-sm font-semibold text-slate-300 mb-3">🚀 마일스톤</h3>
        <ul class="space-y-2 text-sm">
          <li class="flex items-center gap-2"><span>${biz.users.total > 0 ? '✅' : '☐'}</span><span class="${biz.users.total > 0 ? 'text-slate-200' : 'text-slate-400'}">첫 가입자 1명</span></li>
          <li class="flex items-center gap-2"><span>${biz.users.total >= 10 ? '✅' : '☐'}</span><span class="${biz.users.total >= 10 ? 'text-slate-200' : 'text-slate-400'}">10명 가입</span></li>
          <li class="flex items-center gap-2"><span>${biz.users.total >= 50 ? '✅' : '☐'}</span><span class="${biz.users.total >= 50 ? 'text-slate-200' : 'text-slate-400'}">50명 가입</span></li>
          <li class="flex items-center gap-2"><span>${biz.users.pro >= 1 ? '✅' : '☐'}</span><span class="${biz.users.pro >= 1 ? 'text-slate-200' : 'text-slate-400'}">첫 Pro 구독</span></li>
          <li class="flex items-center gap-2"><span>${biz.users.pro >= 10 ? '✅' : '☐'}</span><span class="${biz.users.pro >= 10 ? 'text-slate-200' : 'text-slate-400'}">10 Pro 구독 ($50/mo)</span></li>
          <li class="flex items-center gap-2"><span>${(biz.ls.mtd_usd + biz.x402.revenue_30d) >= 100 ? '✅' : '☐'}</span><span>$100/mo 매출</span></li>
          <li class="flex items-center gap-2"><span>${(biz.ls.mtd_usd + biz.x402.revenue_30d) >= 540 ? '✅' : '☐'}</span><span>$540/mo (Primary target)</span></li>
          <li class="flex items-center gap-2"><span>${(biz.ls.mtd_usd + biz.x402.revenue_30d) >= 1500 ? '✅' : '☐'}</span><span>$1,500/mo (Stretch)</span></li>
          <li class="flex items-center gap-2"><span>${biz.x402.settlements_30d >= 1 ? '✅' : '☐'}</span><span>첫 x402 USDC 결제</span></li>
          <li class="flex items-center gap-2"><span>${status.bazaar?.indexed ? '✅' : '☐'}</span><span>Bazaar 인덱싱 완료</span></li>
          <li class="flex items-center gap-2"><span>☐</span><span class="text-slate-400">PH Top 5 (5/12)</span></li>
          <li class="flex items-center gap-2"><span>☐</span><span class="text-slate-400">HN front page</span></li>
          <li class="flex items-center gap-2"><span>${biz.github.stars >= 100 ? '✅' : '☐'}</span><span class="${biz.github.stars >= 100 ? 'text-slate-200' : 'text-slate-400'}">GitHub 100 ⭐</span></li>
          <li class="flex items-center gap-2"><span>${biz.github.stars >= 500 ? '✅' : '☐'}</span><span class="${biz.github.stars >= 500 ? 'text-slate-200' : 'text-slate-400'}">GitHub 500 ⭐</span></li>
        </ul>
      </section>

      <section class="bg-slate-900 rounded-lg p-4 border border-slate-800">
        <h3 class="text-sm font-semibold text-slate-300 mb-3">💡 매출 구성 (목표 $1,500/mo 가정)</h3>
        <ul class="text-xs space-y-1 text-slate-400">
          <li>• <strong>x402 paid endpoints (5-7개)</strong>: $750-1,000/mo (메인)</li>
          <li>• <strong>FT LS 구독 (~50명 × $5)</strong>: $250/mo</li>
          <li>• <strong>ICT passive 어필리에이트</strong>: $100-200/mo</li>
          <li>• 합계: $1,100-1,450/mo</li>
        </ul>
      </section>
    </div>
  </div><!-- /tab goals -->

  <!-- TAB: 일정 (Schedule) -->
  <div data-tab-pane="schedule" class="hidden">
    <div class="space-y-4">
      <section class="bg-slate-900 rounded-lg p-4 border border-slate-800">
        <h2 class="text-lg font-semibold text-amber-400 mb-3">📅 데드라인 캘린더</h2>
        <p class="text-xs text-slate-500 mb-3">자동 D-N 카운트. 데드라인 추가는 D1에 직접 또는 향후 폼.</p>
        <div class="space-y-2">
          ${scheduleItem("Product Hunt 런치", "2026-05-12", "🚀")}
          ${scheduleItem("LS verification 답변 마감", "2026-05-10", "⏳")}
          ${scheduleItem("PH 비주얼 4장 마감", "2026-05-11", "🎨")}
          ${scheduleItem("1차 부가세 신고 (반기)", "2026-07-25", "💰")}
          ${scheduleItem("2차 부가세 신고 (반기)", "2027-01-25", "💰")}
          ${scheduleItem("도메인 갱신", "2027-05-04", "🔄")}
          ${scheduleItem("CDP API key 만료 검토", "2027-05-06", "🔑")}
        </div>
      </section>

      <section class="bg-slate-900 rounded-lg p-4 border border-slate-800">
        <h3 class="text-sm font-semibold text-slate-300 mb-3">🗓️ 주간 루틴</h3>
        <ul class="text-sm space-y-2">
          <li class="flex justify-between"><span class="text-slate-400">매일 09:00 KST</span><span class="text-slate-300">Daily digest (Telegram)</span></li>
          <li class="flex justify-between"><span class="text-slate-400">매일 09:30 KST</span><span class="text-slate-300">Routine 갭 분석 (옵션)</span></li>
          <li class="flex justify-between"><span class="text-slate-400">매주 일 03:00 KST</span><span class="text-slate-300">Gmail cleanup</span></li>
          <li class="flex justify-between"><span class="text-slate-400">월 1회</span><span class="text-slate-300">어필리에이트 매출 입력</span></li>
          <li class="flex justify-between"><span class="text-slate-400">분기 1회</span><span class="text-slate-300">메모리 파일 정리</span></li>
        </ul>
      </section>

      <section class="bg-amber-950/30 border border-amber-900 rounded-lg p-4">
        <h3 class="text-sm font-semibold text-amber-400 mb-2">🚧 통합 TODO</h3>
        <ul class="text-xs text-amber-300 space-y-1">
          <li>1. D1 deadlines 테이블 (id, title, due_at, category, completed)</li>
          <li>2. Add deadline 폼</li>
          <li>3. D-N 자동 alert (D-3 / D-1 / D-Day)</li>
          <li>4. Google Calendar 양방향 동기화 (옵션, nopal 플러그인)</li>
        </ul>
      </section>
    </div>
  </div><!-- /tab schedule -->

  <!-- TAB: 커뮤니티 (Community) -->
  <div data-tab-pane="community" class="hidden">
    <div class="space-y-4">
      <section class="bg-slate-900 rounded-lg p-4 border border-slate-800">
        <div class="flex items-center justify-between mb-3">
          <h2 class="text-lg font-semibold text-purple-400">💬 커뮤니티 응대</h2>
          <span class="text-xs px-2 py-0.5 bg-amber-950/40 border border-amber-900 text-amber-400 rounded">Skeleton</span>
        </div>
        <p class="text-xs text-slate-500 mb-3">PH/HN/IH/Reddit/Disquiet 댓글 수집 + 미응답 트래킹. 런치 후 활용.</p>
        <div class="grid grid-cols-2 md:grid-cols-5 gap-3">
          <div class="bg-slate-950 rounded p-3 border border-slate-800 text-center">
            <div class="text-xs text-slate-400">PH</div>
            <div class="text-2xl font-bold text-orange-400">—</div>
            <div class="text-xs text-slate-500">comments</div>
          </div>
          <div class="bg-slate-950 rounded p-3 border border-slate-800 text-center">
            <div class="text-xs text-slate-400">HN</div>
            <div class="text-2xl font-bold text-orange-300">—</div>
            <div class="text-xs text-slate-500">replies</div>
          </div>
          <div class="bg-slate-950 rounded p-3 border border-slate-800 text-center">
            <div class="text-xs text-slate-400">IH</div>
            <div class="text-2xl font-bold text-blue-400">—</div>
            <div class="text-xs text-slate-500">replies</div>
          </div>
          <div class="bg-slate-950 rounded p-3 border border-slate-800 text-center">
            <div class="text-xs text-slate-400">Reddit</div>
            <div class="text-2xl font-bold text-red-400">—</div>
            <div class="text-xs text-slate-500">replies</div>
          </div>
          <div class="bg-slate-950 rounded p-3 border border-slate-800 text-center">
            <div class="text-xs text-slate-400">Disquiet</div>
            <div class="text-2xl font-bold text-pink-400">—</div>
            <div class="text-xs text-slate-500">comments</div>
          </div>
        </div>
      </section>

      <section class="bg-slate-900 rounded-lg p-4 border border-slate-800">
        <h3 class="text-sm font-semibold text-slate-300 mb-3">⏰ 미응답 알림 (계획)</h3>
        <p class="text-xs text-slate-500">댓글 도착 후 너 응답 안 한 거. 4시간 이상 미응답 시 Telegram 알림.</p>
        <ul class="text-xs space-y-1 mt-3 text-slate-500 italic">
          <li>(런치 후 데이터 채워짐)</li>
        </ul>
      </section>

      <section class="bg-amber-950/30 border border-amber-900 rounded-lg p-4">
        <h3 class="text-sm font-semibold text-amber-400 mb-2">🚧 통합 TODO</h3>
        <ul class="text-xs text-amber-300 space-y-1">
          <li>1. PH API 또는 RSS 폴링 (5/12 후)</li>
          <li>2. HN Algolia API (free) — 우리 product mention 검색</li>
          <li>3. Reddit RSS 또는 Pushshift API</li>
          <li>4. IH는 API 없음 — 수동 또는 RSS</li>
          <li>5. Disquiet — manual 또는 scrape (insane-search 플러그인)</li>
          <li>6. D1 community_threads 테이블</li>
          <li>7. 4시간 미응답 alert</li>
        </ul>
      </section>
    </div>
  </div><!-- /tab community -->

  <!-- TAB: 실험 (Experiments) -->
  <div data-tab-pane="experiments" class="hidden">
    <div class="space-y-4">
      <section class="bg-slate-900 rounded-lg p-4 border border-slate-800">
        <div class="flex items-center justify-between mb-3">
          <h2 class="text-lg font-semibold text-violet-400">🧪 A/B Tests & Feature Flags</h2>
          <span class="text-xs px-2 py-0.5 bg-amber-950/40 border border-amber-900 text-amber-400 rounded">Skeleton</span>
        </div>
        <p class="text-xs text-slate-500 mb-3">사용자 100명+ 모이면 활용. 그 전엔 의미 없음 (통계적으로).</p>
        <div class="text-xs text-slate-500 italic">실험 없음. 사용자 데이터 충분히 쌓이면 (~100명) 시작.</div>
      </section>

      <section class="bg-slate-900 rounded-lg p-4 border border-slate-800">
        <h3 class="text-sm font-semibold text-slate-300 mb-3">🎛️ Feature flags (수동)</h3>
        <ul class="text-sm space-y-2 font-mono">
          <li class="flex justify-between"><span class="text-slate-400">x402_paid_endpoints</span><span class="text-emerald-400 text-xs">✅ ON</span></li>
          <li class="flex justify-between"><span class="text-slate-400">cdp_facilitator</span><span class="text-emerald-400 text-xs">✅ ON</span></li>
          <li class="flex justify-between"><span class="text-slate-400">native_gmail_filters</span><span class="text-emerald-400 text-xs">✅ ON</span></li>
          <li class="flex justify-between"><span class="text-slate-400">gas_auto_actions</span><span class="text-emerald-400 text-xs">✅ ON</span></li>
          <li class="flex justify-between"><span class="text-slate-400">smoke_telegram_alerts</span><span class="text-emerald-400 text-xs">✅ ON</span></li>
          <li class="flex justify-between"><span class="text-slate-400">korean_mcp (W2-3)</span><span class="text-slate-500 text-xs">⏸ OFF</span></li>
          <li class="flex justify-between"><span class="text-slate-400">supabase_adapter (W3)</span><span class="text-slate-500 text-xs">⏸ OFF</span></li>
        </ul>
      </section>

      <section class="bg-slate-900 rounded-lg p-4 border border-slate-800">
        <h3 class="text-sm font-semibold text-slate-300 mb-3">💡 향후 실험 아이디어</h3>
        <ul class="text-xs space-y-1 text-slate-400">
          <li>• Pro 가격 $5 vs $7 vs $9 (런치 후 100명+ 시)</li>
          <li>• Free tier 3 services vs 5 services</li>
          <li>• 랜딩 hook A/B ("200 OK" vs "Datadog for free tiers")</li>
          <li>• Onboarding 단계 (3-step vs 5-step)</li>
          <li>• 이메일 알림 빈도</li>
          <li>• x402 가격 $0.005 vs $0.01</li>
        </ul>
      </section>
    </div>
  </div><!-- /tab experiments -->

  <!-- TAB: 인시던트 (Incidents) -->
  <div data-tab-pane="incidents" class="hidden">
    <div class="space-y-4">
      <section class="bg-slate-900 rounded-lg p-4 border border-slate-800">
        <div class="flex items-center justify-between mb-3">
          <h2 class="text-lg font-semibold text-red-400">🚨 인시던트 로그</h2>
          <span class="text-xs px-2 py-0.5 bg-emerald-950/40 border border-emerald-900 text-emerald-400 rounded">No active</span>
        </div>
        <p class="text-xs text-slate-500 mb-3">장애·복구·RCA 기록. 자동 (smoke fail) + 수동 입력.</p>
        <div class="text-xs text-slate-500 italic">활성 인시던트 없음. 마지막 smoke fail은 시스템 탭 확인.</div>
      </section>

      <section class="bg-slate-900 rounded-lg p-4 border border-slate-800">
        <h3 class="text-sm font-semibold text-slate-300 mb-3">📝 인시던트 추가</h3>
        <form data-incident-form class="grid grid-cols-1 md:grid-cols-2 gap-2">
          <input name="title" placeholder="제목 (예: x402 endpoint 30분 다운)" class="bg-slate-950 border border-slate-700 rounded px-2 py-2 text-sm" required>
          <select name="severity" class="bg-slate-950 border border-slate-700 rounded px-2 py-2 text-sm">
            <option value="low">Low (영향 적음)</option>
            <option value="medium">Medium (사용자 영향)</option>
            <option value="high">High (매출 영향)</option>
            <option value="critical">Critical (전면 다운)</option>
          </select>
          <textarea name="description" placeholder="원인 + 영향 + 조치" class="md:col-span-2 bg-slate-950 border border-slate-700 rounded px-2 py-2 text-sm h-20" required></textarea>
          <button class="md:col-span-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm font-medium">기록</button>
        </form>
        <div id="incident-status" class="text-xs text-slate-500 mt-2 hidden"></div>
      </section>

      <section class="bg-amber-950/30 border border-amber-900 rounded-lg p-4">
        <h3 class="text-sm font-semibold text-amber-400 mb-2">🚧 통합 TODO</h3>
        <ul class="text-xs text-amber-300 space-y-1">
          <li>1. D1 incidents 테이블 (id, title, severity, status, description, opened_at, resolved_at, rca)</li>
          <li>2. Smoke fail → 자동 인시던트 생성 (severity 매핑)</li>
          <li>3. Status 토글 (open/investigating/resolved)</li>
          <li>4. RCA 작성 폼</li>
          <li>5. status.freetier-sentinel.dev 공개 페이지 (선택)</li>
        </ul>
      </section>
    </div>
  </div><!-- /tab incidents -->

  <!-- TAB: 시스템 (System) -->
  <div data-tab-pane="system" class="hidden">
    <div class="space-y-4">

      <!-- Smoke detail -->
      <section class="bg-slate-900 rounded-lg p-4 border border-slate-800">
        <h2 class="text-lg font-semibold text-cyan-400 mb-3">🩺 Smoke Test Detail</h2>
        <p class="text-xs text-slate-500 mb-3">매 30분 자동 실행. 6개 endpoint 개별 상태.</p>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-2">
          ${status.smoke.states.map((s: any) => html`
            <div class="bg-slate-950 rounded p-3 border border-slate-800 flex justify-between items-center">
              <span class="font-mono text-sm text-slate-300">${s.target}</span>
              <span class="text-lg">${s.status === "ok" ? "🟢" : s.status === "fail" ? "🔴" : "⚪"}</span>
            </div>`).join("")}
        </div>
      </section>

      <!-- Cron schedule -->
      <section class="bg-slate-900 rounded-lg p-4 border border-slate-800">
        <h3 class="text-sm font-semibold text-slate-300 mb-3">⏰ Cron Schedule</h3>
        <table class="w-full text-xs">
          <thead class="text-slate-500">
            <tr><th class="text-left py-1 font-normal">Cron</th><th class="text-left py-1 font-normal">Job</th><th class="text-right py-1 font-normal">Last run</th></tr>
          </thead>
          <tbody class="font-mono">
            <tr class="border-t border-slate-800"><td class="py-2">*/30 * * * *</td><td>smoke test</td><td class="text-right text-slate-400">${relTime(status.cron?.smoke)}</td></tr>
            <tr class="border-t border-slate-800"><td class="py-2">0 * * * *</td><td>bazaar poll + metrics</td><td class="text-right text-slate-400">${relTime(status.cron?.bazaar)}</td></tr>
            <tr class="border-t border-slate-800"><td class="py-2">0 */6 * * *</td><td>FT services check</td><td class="text-right text-slate-400">${relTime(status.cron?.services)}</td></tr>
            <tr class="border-t border-slate-800"><td class="py-2">0 0 * * *</td><td>daily digest (09 KST)</td><td class="text-right text-slate-400">${relTime(status.cron?.digest)}</td></tr>
          </tbody>
        </table>
      </section>

      <!-- Recent alerts log -->
      <section class="bg-slate-900 rounded-lg p-4 border border-slate-800">
        <h3 class="text-sm font-semibold text-slate-300 mb-2">🔔 Recent Alerts (last 20)</h3>
        ${alerts.length === 0 ? `<div class="text-xs text-slate-500 italic">알림 없음 (시스템 안정)</div>` : html`
          <ul class="text-xs space-y-2 max-h-96 overflow-y-auto">
            ${alerts.map((a: any) => html`
              <li class="border-l-2 border-slate-700 pl-3 py-1">
                <div class="text-slate-400">${relTime(a.created_at)} · <span class="font-mono">${escapeHtml(a.kind)}</span></div>
                <div class="text-slate-200 break-words mt-0.5">${escapeHtml(a.message.slice(0, 200))}</div>
              </li>`).join("")}
          </ul>`}
      </section>

      <!-- Worker info -->
      <section class="bg-slate-900 rounded-lg p-4 border border-slate-800">
        <h3 class="text-sm font-semibold text-slate-300 mb-3">📦 Worker</h3>
        <ul class="text-xs space-y-1 font-mono text-slate-400">
          <li>Domain: <a href="https://freetier-sentinel.dev" class="text-blue-400 hover:underline">freetier-sentinel.dev</a></li>
          <li>Worker URL: <a href="https://freetier-sentinel.wndnjs3865.workers.dev" class="text-blue-400 hover:underline">freetier-sentinel.wndnjs3865.workers.dev</a></li>
          <li>D1 DB: bb5edd36-0557-4d91-861c-37146bfa8494</li>
          <li>KV: dd8a3f635fe24c5eb1d3cf8285f425a9</li>
          <li>Tables: users, services, alerts, alert_log, tasks, notes, metric_snapshots</li>
        </ul>
      </section>

      <!-- Plugin status -->
      <section class="bg-slate-900 rounded-lg p-4 border border-slate-800">
        <h3 class="text-sm font-semibold text-slate-300 mb-3">🧩 Active Plugins</h3>
        <ul class="text-xs space-y-1 text-slate-400">
          <li>✅ claude-mem (memory persistence)</li>
          <li>✅ insane-search (web bypass)</li>
          <li>✅ nopal (Google Workspace)</li>
          <li>✅ pumasi (parallel coding)</li>
          <li>✅ deep-research (multi-agent research)</li>
          <li>✅ vibe-sunsang (conversation analysis)</li>
        </ul>
      </section>

    </div>
  </div><!-- /tab system -->

  <!-- TAB: 기타 (Misc) -->
  <div data-tab-pane="misc" class="hidden">
    <div class="space-y-4">

      <!-- Memory files -->
      <section class="bg-slate-900 rounded-lg p-4 border border-slate-800">
        <h2 class="text-lg font-semibold text-slate-300 mb-3">📂 Memory Files</h2>
        <p class="text-xs text-slate-500 mb-3">claude-mem persistent memory at <code class="text-slate-300">/root/.claude/projects/-root/memory/</code></p>
        <ul class="text-xs space-y-1 font-mono text-slate-400">
          <li>• MEMORY.md (인덱스)</li>
          <li>• resume_queue_2026_05_06.md ⭐ master priority queue</li>
          <li>• freetier_sentinel_full_state.md</li>
          <li>• business_registration_decision.md</li>
          <li>• plan_c_x402_decision.md</li>
          <li>• affiliate_applications_status.md</li>
          <li>• ph_launch_5_12_assets.md</li>
          <li>• gmail_automation_live.md</li>
          <li>• autonomous_layer_2026_05_06.md</li>
          <li>• mission_control_dashboard.md</li>
          <li>• feedback_rigorous_analysis.md</li>
        </ul>
      </section>

      <!-- Reference IDs -->
      <section class="bg-slate-900 rounded-lg p-4 border border-slate-800">
        <h3 class="text-sm font-semibold text-slate-300 mb-3">🔑 Reference IDs</h3>
        <ul class="text-xs space-y-2 font-mono">
          <li><span class="text-slate-400">사업자번호:</span> <span class="text-slate-200">607-20-94796</span> <span class="text-slate-500">(일반과세자)</span></li>
          <li><span class="text-slate-400">상호:</span> <span class="text-slate-200">프리티어센티넬 (FreeTier Sentinel)</span></li>
          <li><span class="text-slate-400">대표자:</span> <span class="text-slate-200">강주원 / Kang Juwon</span></li>
          <li><span class="text-slate-400">사업장:</span> <span class="text-slate-200">서울 강서구 화곡로 39길 6 (07695)</span></li>
          <li><span class="text-slate-400">Base USDC 지갑:</span> <span class="text-slate-200">0x5337f4b5bed8e379412Abb6498EdC2ebC95bb088</span></li>
          <li><span class="text-slate-400">CDP API Key ID:</span> <span class="text-slate-200">106c1e04-8a6d-4cf5-9921-9a893c79bf6b</span></li>
          <li><span class="text-slate-400">Amazon Associates:</span> <span class="text-slate-200">juwon3865-20</span></li>
          <li><span class="text-slate-400">PH 접수:</span> <span class="text-slate-200">109-2026-2-505224706863</span></li>
        </ul>
      </section>

      <!-- External links -->
      <section class="bg-slate-900 rounded-lg p-4 border border-slate-800">
        <h3 class="text-sm font-semibold text-slate-300 mb-3">🔗 External Links</h3>
        <ul class="text-xs space-y-1.5">
          <li>📦 <a href="https://github.com/wndnjs3865/freetier-sentinel" class="text-blue-400 hover:underline">GitHub repo</a></li>
          <li>🚀 <a href="https://producthunt.com/products/freetier-sentinel" class="text-blue-400 hover:underline">Product Hunt page</a></li>
          <li>📡 <a href="/v1/providers" class="text-blue-400 hover:underline">/v1/providers (free x402 endpoint)</a></li>
          <li>📚 <a href="/docs/api" class="text-blue-400 hover:underline">/docs/api (HTML)</a></li>
          <li>🧬 <a href="/v1/openapi.json" class="text-blue-400 hover:underline">/v1/openapi.json</a></li>
          <li>🛒 <a href="https://app.lemonsqueezy.com" class="text-blue-400 hover:underline">LemonSqueezy admin</a></li>
          <li>💎 <a href="https://www.coinbase.com" class="text-blue-400 hover:underline">Coinbase</a></li>
          <li>🔧 <a href="https://portal.cdp.coinbase.com" class="text-blue-400 hover:underline">CDP portal</a></li>
          <li>📅 <a href="https://claude.ai/code/routines" class="text-blue-400 hover:underline">Claude Code Routines</a></li>
        </ul>
      </section>

      <!-- Marketing assets paths -->
      <section class="bg-slate-900 rounded-lg p-4 border border-slate-800">
        <h3 class="text-sm font-semibold text-slate-300 mb-3">📦 마케팅 자산 (파일 경로)</h3>
        <ul class="text-xs space-y-1 font-mono text-slate-400">
          <li>• /root/biz/marketing/01-indiehackers.md</li>
          <li>• /root/biz/marketing/02-twitter-thread.md</li>
          <li>• /root/biz/marketing/03-reddit.md</li>
          <li>• /root/biz/marketing/04-show-hn.md</li>
          <li>• /root/biz/marketing/05-ph-maker-comment.md</li>
          <li>• /root/biz/marketing/06-bazaar-submission.md</li>
        </ul>
      </section>

      <!-- Important deadlines -->
      <section class="bg-slate-900 rounded-lg p-4 border border-slate-800">
        <h3 class="text-sm font-semibold text-slate-300 mb-3">📅 주요 일정</h3>
        <ul class="text-xs space-y-2">
          <li class="flex justify-between"><span class="text-slate-400">Product Hunt 런치</span><span class="text-amber-400 font-mono">2026-05-12</span></li>
          <li class="flex justify-between"><span class="text-slate-400">1차 부가세 신고 (반기)</span><span class="text-slate-200 font-mono">2026-07-25</span></li>
          <li class="flex justify-between"><span class="text-slate-400">2차 부가세 신고 (반기)</span><span class="text-slate-200 font-mono">2027-01-25</span></li>
          <li class="flex justify-between"><span class="text-slate-400">도메인 갱신</span><span class="text-slate-200 font-mono">2027-05-04</span></li>
        </ul>
      </section>

      <!-- Future chapters roadmap -->
      <section class="bg-slate-900 rounded-lg p-4 border border-slate-800">
        <h3 class="text-sm font-semibold text-slate-300 mb-3">🚧 향후 추가 예정 챕터</h3>
        <ul class="text-xs space-y-1.5 text-slate-400">
          <li>📊 <strong class="text-slate-300">분석</strong> — CF Web Analytics 통합, 트래픽/전환 funnel</li>
          <li>📅 <strong class="text-slate-300">일정</strong> — 캘린더 + 데드라인 자동 추적</li>
          <li>💬 <strong class="text-slate-300">커뮤니티</strong> — PH/HN/IH/Reddit 댓글 트래킹</li>
          <li>🎯 <strong class="text-slate-300">목표</strong> — KPI/MRR target progress</li>
          <li>🤝 <strong class="text-slate-300">어필리에이트</strong> — 마케팅에서 분리, 프로그램별 detail</li>
          <li>🧪 <strong class="text-slate-300">실험</strong> — A/B 테스트, feature flags</li>
          <li>🚨 <strong class="text-slate-300">인시던트</strong> — 장애·복구·RCA 로그</li>
        </ul>
      </section>

    </div>
  </div><!-- /tab misc -->

  <footer class="mt-6 text-center text-xs text-slate-600">
    Auto-refresh every 60s · <a href="/dash" class="hover:text-slate-400">User dashboard</a>
  </footer>
</div>

<script>
// Tab navigation (URL hash-based for deep linking)
function activateTab(name) {
  document.querySelectorAll('[data-tab-pane]').forEach(p => {
    p.classList.toggle('hidden', p.dataset.tabPane !== name);
  });
  document.querySelectorAll('[data-tab-link]').forEach(b => {
    const active = b.dataset.tabLink === name;
    b.classList.toggle('border-blue-500', active);
    b.classList.toggle('text-blue-400', active);
    b.classList.toggle('border-transparent', !active);
    b.classList.toggle('text-slate-400', !active);
  });
  if (location.hash.slice(1) !== name) location.hash = '#' + name;
}
document.querySelectorAll('[data-tab-link]').forEach(b => {
  b.addEventListener('click', () => activateTab(b.dataset.tabLink));
});
// Initial tab from URL hash
const VALID_TABS = ['tasks', 'payments', 'marketing', 'affiliate', 'analytics', 'goals', 'schedule', 'community', 'experiments', 'incidents', 'system', 'misc'];
const initialTab = VALID_TABS.includes(location.hash.slice(1))
  ? location.hash.slice(1) : 'tasks';
activateTab(initialTab);

// Affiliate revenue entry
document.querySelectorAll('[data-affiliate-form]').forEach(form => {
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const fd = new FormData(form);
    const status = document.getElementById('affiliate-status');
    status.classList.remove('hidden');
    status.textContent = 'saving...';
    await fetch('/admin/api/metric/record', {
      method: 'POST',
      headers: {'content-type': 'application/json'},
      body: JSON.stringify({
        metric: 'affiliate_revenue_' + fd.get('program'),
        value: Number(fd.get('amount')),
      })
    });
    // Also record into total
    await fetch('/admin/api/metric/record', {
      method: 'POST',
      headers: {'content-type': 'application/json'},
      body: JSON.stringify({
        metric: 'affiliate_revenue_usd',
        value: Number(fd.get('amount')),
      })
    });
    status.textContent = 'saved · ' + new Date().toLocaleTimeString();
    setTimeout(() => location.reload(), 600);
  });
});

// Incident entry
document.querySelectorAll('[data-incident-form]').forEach(form => {
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const fd = new FormData(form);
    const status = document.getElementById('incident-status');
    status.classList.remove('hidden');
    status.textContent = 'saving...';
    await fetch('/admin/api/incident/add', {
      method: 'POST',
      headers: {'content-type': 'application/json'},
      body: JSON.stringify({
        title: fd.get('title'),
        severity: fd.get('severity'),
        description: fd.get('description'),
      })
    });
    status.textContent = 'saved · ' + new Date().toLocaleTimeString();
    form.reset();
  });
});

// Toggle task done state
document.querySelectorAll('.task-toggle').forEach(cb => {
  cb.addEventListener('change', async (e) => {
    const id = e.target.dataset.taskId;
    const done = e.target.checked ? 1 : 0;
    await fetch('/admin/api/task/toggle', {
      method: 'POST',
      headers: {'content-type': 'application/json'},
      body: JSON.stringify({ id, done })
    });
    setTimeout(() => location.reload(), 200);
  });
});

// Delete task
document.querySelectorAll('.task-delete').forEach(btn => {
  btn.addEventListener('click', async (e) => {
    if (!confirm('Delete this task?')) return;
    const id = e.target.dataset.deleteId;
    await fetch('/admin/api/task/delete', {
      method: 'POST',
      headers: {'content-type': 'application/json'},
      body: JSON.stringify({ id })
    });
    location.reload();
  });
});

// Add task
document.querySelectorAll('[data-add-form]').forEach(form => {
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const fd = new FormData(form);
    await fetch('/admin/api/task/add', {
      method: 'POST',
      headers: {'content-type': 'application/json'},
      body: JSON.stringify({
        priority: fd.get('priority'),
        title: fd.get('title')
      })
    });
    location.reload();
  });
});

// Notes auto-save (debounced)
let notesTimer;
const notesEl = document.getElementById('notes');
const notesStatus = document.getElementById('notes-status');
notesEl.addEventListener('input', () => {
  clearTimeout(notesTimer);
  notesStatus.textContent = 'saving...';
  notesTimer = setTimeout(async () => {
    await fetch('/admin/api/notes/save', {
      method: 'POST',
      headers: {'content-type': 'application/json'},
      body: JSON.stringify({ body: notesEl.value })
    });
    notesStatus.textContent = 'saved ' + new Date().toLocaleTimeString();
  }, 800);
});

// Quick actions
document.querySelectorAll('.action-btn').forEach(btn => {
  btn.addEventListener('click', async (e) => {
    const action = e.target.dataset.action;
    const statusEl = document.getElementById('action-status');
    statusEl.classList.remove('hidden');
    statusEl.textContent = 'running ' + action + '...';
    try {
      const r = await fetch('/admin/api/run/' + action.replace('run-', ''), { method: 'POST' });
      const j = await r.json();
      statusEl.textContent = JSON.stringify(j).slice(0, 200);
      setTimeout(() => location.reload(), 1500);
    } catch (err) {
      statusEl.textContent = 'failed: ' + err.message;
    }
  });
});

// Manual metric entry
document.querySelectorAll('[data-metric-form]').forEach(form => {
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const fd = new FormData(form);
    const status = document.getElementById('metric-status');
    status.classList.remove('hidden');
    status.textContent = 'saving...';
    await fetch('/admin/api/metric/record', {
      method: 'POST',
      headers: {'content-type': 'application/json'},
      body: JSON.stringify({
        metric: fd.get('metric'),
        value: Number(fd.get('value')),
      })
    });
    status.textContent = 'saved · ' + new Date().toLocaleTimeString();
    setTimeout(() => location.reload(), 600);
  });
});

// Auto-refresh every 60s (preserve scroll)
setTimeout(() => location.reload(), 60000);
</script>
</body>
</html>`;
}

// ─────────────────────────────────────────────────────────────────────
// Route handlers
// ─────────────────────────────────────────────────────────────────────
export async function handleAdmin(req: Request, env: Env): Promise<Response> {
  const url = new URL(req.url);
  const path = url.pathname;
  const method = req.method;

  const authFail = await requireAdmin(req, env);
  if (authFail) return authFail;

  await ensureTables(env);

  // Architecture mindmap (live)
  if (path === "/admin/architecture" && method === "GET") {
    const data = await getArchitectureData(env);
    const body = renderArchitecturePage(data);
    return new Response(body, { status: 200, headers: { "content-type": "text/html; charset=utf-8" } });
  }

  // Smoke detail (live KV + alert log)
  if (path === "/admin/smoke" && method === "GET") {
    const body = await renderSmokePage(env);
    return new Response(body, { status: 200, headers: { "content-type": "text/html; charset=utf-8" } });
  }

  // Memory chapter (hardcoded inventory + summary)
  if (path === "/admin/memory" && method === "GET") {
    const c = renderMemoryChapter();
    const body = chapterLayout("memory", c.title, c.subtitle, c.body, { memoryCount: 19 });
    return new Response(body, { status: 200, headers: { "content-type": "text/html; charset=utf-8" } });
  }

  // Logs chapter (live D1 alert_log)
  if (path === "/admin/logs" && method === "GET") {
    const c = await renderLogsChapter(env);
    const body = chapterLayout("logs", c.title, c.subtitle, c.body, { logsCount: c.logsCount });
    return new Response(body, { status: 200, headers: { "content-type": "text/html; charset=utf-8" } });
  }

  // Main dashboard
  if (path === "/admin" && method === "GET") {
    const tasks = await env.DB.prepare("SELECT * FROM tasks ORDER BY priority, ord, created_at").all<any>();
    const status = await getLiveStatus(env);
    const noteRow = await env.DB.prepare("SELECT body FROM notes ORDER BY id DESC LIMIT 1").first<any>();
    const notes = noteRow?.body || "";
    const alertRows = await env.DB.prepare("SELECT * FROM alert_log ORDER BY id DESC LIMIT 20").all<any>();
    const biz = await getBusinessMetrics(env);
    const body = renderDashboard(tasks.results || [], status, notes, alertRows.results || [], biz);
    return new Response(body, { status: 200, headers: { "content-type": "text/html; charset=utf-8" } });
  }

  // API: toggle task
  if (path === "/admin/api/task/toggle" && method === "POST") {
    const { id, done } = (await req.json()) as { id: string; done: number };
    const now = Math.floor(Date.now() / 1000);
    await env.DB.prepare("UPDATE tasks SET done=?, done_at=?, updated_at=? WHERE id=?")
      .bind(done, done ? now : null, now, id).run();
    return new Response(JSON.stringify({ ok: true }), { headers: { "content-type": "application/json" } });
  }

  // API: add task
  if (path === "/admin/api/task/add" && method === "POST") {
    const { priority, title, category } = (await req.json()) as any;
    if (!["p0", "p1", "p2"].includes(priority) || !title) {
      return new Response(JSON.stringify({ error: "invalid" }), { status: 400 });
    }
    const id = crypto.randomUUID();
    const now = Math.floor(Date.now() / 1000);
    const max = await env.DB.prepare("SELECT MAX(ord) as m FROM tasks WHERE priority=?").bind(priority).first<any>();
    const ord = (max?.m || 0) + 1;
    await env.DB.prepare(
      `INSERT INTO tasks (id, priority, title, category, ord, done, created_at, updated_at) VALUES (?, ?, ?, ?, ?, 0, ?, ?)`,
    ).bind(id, priority, title.slice(0, 200), category || null, ord, now, now).run();
    return new Response(JSON.stringify({ ok: true, id }), { headers: { "content-type": "application/json" } });
  }

  // API: delete task
  if (path === "/admin/api/task/delete" && method === "POST") {
    const { id } = (await req.json()) as { id: string };
    await env.DB.prepare("DELETE FROM tasks WHERE id=?").bind(id).run();
    return new Response(JSON.stringify({ ok: true }), { headers: { "content-type": "application/json" } });
  }

  // API: save notes
  if (path === "/admin/api/notes/save" && method === "POST") {
    const { body } = (await req.json()) as { body: string };
    const now = Math.floor(Date.now() / 1000);
    // Single-row pattern: keep only the latest note row
    await env.DB.prepare("DELETE FROM notes").run();
    await env.DB.prepare("INSERT INTO notes (body, updated_at) VALUES (?, ?)").bind(body.slice(0, 5000), now).run();
    return new Response(JSON.stringify({ ok: true }), { headers: { "content-type": "application/json" } });
  }

  // API: manual triggers
  if (path === "/admin/api/run/smoke" && method === "POST") {
    const stats = await runSmoke(env);
    await env.KV.put("cron:last:smoke", String(Math.floor(Date.now() / 1000)));
    return new Response(JSON.stringify({ ok: true, stats }), { headers: { "content-type": "application/json" } });
  }
  if (path === "/admin/api/run/bazaar" && method === "POST") {
    const r = await runBazaarPoll(env);
    await env.KV.put("cron:last:bazaar", String(Math.floor(Date.now() / 1000)));
    return new Response(JSON.stringify({ ok: true, ...r }), { headers: { "content-type": "application/json" } });
  }
  if (path === "/admin/api/run/digest" && method === "POST") {
    await runDailyDigest(env);
    await env.KV.put("cron:last:digest", String(Math.floor(Date.now() / 1000)));
    return new Response(JSON.stringify({ ok: true }), { headers: { "content-type": "application/json" } });
  }
  if (path === "/admin/api/run/metrics" && method === "POST") {
    const r = await runHourlyMetrics(env);
    await env.KV.put("cron:last:metrics", String(Math.floor(Date.now() / 1000)));
    return new Response(JSON.stringify({ ok: true, ...r }), { headers: { "content-type": "application/json" } });
  }

  // Add incident
  if (path === "/admin/api/incident/add" && method === "POST") {
    const { title, severity, description } = (await req.json()) as any;
    if (!title || !severity) return new Response(JSON.stringify({ error: "invalid" }), { status: 400 });
    const id = crypto.randomUUID();
    const now = Math.floor(Date.now() / 1000);
    await env.DB.prepare(
      `INSERT INTO incidents (id, title, severity, status, description, opened_at) VALUES (?, ?, ?, 'open', ?, ?)`,
    ).bind(id, title.slice(0, 200), severity, (description || "").slice(0, 2000), now).run();
    return new Response(JSON.stringify({ ok: true, id }), { headers: { "content-type": "application/json" } });
  }

  // Manual metric entry
  if (path === "/admin/api/metric/record" && method === "POST") {
    const { metric, value } = (await req.json()) as { metric: string; value: number };
    if (!metric || typeof value !== "number" || Number.isNaN(value)) {
      return new Response(JSON.stringify({ error: "invalid" }), { status: 400 });
    }
    await recordMetric(env, metric, value, "manual");
    return new Response(JSON.stringify({ ok: true }), { headers: { "content-type": "application/json" } });
  }

  return new Response("Not found", { status: 404 });
}

// ──────────────────────────────────────────────────────────────────────────
// Architecture mindmap (live)
// ──────────────────────────────────────────────────────────────────────────

async function getArchitectureData(env: Env): Promise<any> {
  const now = new Date();
  const daysToLaunch = Math.ceil((PH_LAUNCH.getTime() - now.getTime()) / 86400000);
  const dStr = daysToLaunch > 0 ? `D-${daysToLaunch}` : daysToLaunch === 0 ? "LAUNCH DAY" : `+${-daysToLaunch}`;

  // D1 row counts (parallel)
  const [users, services, alerts7d, incidents, tasksRow, recentDeploy] = await Promise.all([
    env.DB.prepare("SELECT COUNT(*) AS c FROM users").first<any>().catch(() => ({ c: 0 })),
    env.DB.prepare("SELECT COUNT(*) AS c FROM services").first<any>().catch(() => ({ c: 0 })),
    env.DB.prepare("SELECT COUNT(*) AS c FROM alert_log WHERE created_at > ?").bind(Math.floor(Date.now() / 1000) - 7 * 86400).first<any>().catch(() => ({ c: 0 })),
    env.DB.prepare("SELECT COUNT(*) AS c FROM incidents WHERE status='open'").first<any>().catch(() => ({ c: 0 })),
    env.DB.prepare("SELECT priority, COUNT(*) AS c, SUM(done) AS done FROM tasks GROUP BY priority").all<any>().catch(() => ({ results: [] })),
    env.KV.get("cron:last:smoke").catch(() => null),
  ]);

  // KV smoke status (6 endpoints)
  const smokeKeys = ["landing", "health", "x402-providers", "docs-api", "openapi", "x402-paid-402"];
  const smokeStates = await Promise.all(
    smokeKeys.map(async (k) => {
      const v = await env.KV.get(`smoke:${k}`).catch(() => null);
      try { return v ? { name: k, ...JSON.parse(v) } : { name: k, status: "unknown" }; }
      catch { return { name: k, status: "unknown" }; }
    }),
  );
  const smokeOk = smokeStates.filter((s) => s.status === "ok").length;

  // x402 records count via lightweight self-import (avoid HTTP self-fetch)
  let x402Records = 0;
  try {
    const limitsModule = await import("../data/limits");
    x402Records = (limitsModule as any).LIMITS?.length || 0;
  } catch { /* ignore */ }

  // Tasks rolled up
  const taskCounts: any = { p0: { total: 0, done: 0 }, p1: { total: 0, done: 0 }, p2: { total: 0, done: 0 } };
  for (const r of tasksRow.results || []) {
    if (taskCounts[r.priority]) {
      taskCounts[r.priority].total = r.c;
      taskCounts[r.priority].done = r.done || 0;
    }
  }

  return {
    daysToLaunch: dStr,
    users: users?.c || 0,
    services: services?.c || 0,
    alerts7d: alerts7d?.c || 0,
    incidents: incidents?.c || 0,
    smokeOk,
    smokeTotal: smokeStates.length,
    smokeStates,
    x402Records,
    taskCounts,
    lastSmokeRun: recentDeploy ? new Date(parseInt(recentDeploy) * 1000).toISOString().slice(0, 16) : "—",
    timestamp: now.toISOString().slice(0, 19),
  };
}

function renderArchitecturePage(d: any): string {
  const smokeIcon = d.smokeOk === d.smokeTotal ? "✅" : "⚠️";
  const incidentBadge = d.incidents === 0 ? "0 open" : `🚨 ${d.incidents} open`;
  const phaseDefs = buildPhaseDefs(d);
  const phaseCardsHtml = renderPhaseCards(phaseDefs);

  const stat = (label: string, value: string) => `
    <div class="bg-slate-900 border border-slate-800 rounded-lg p-4">
      <div class="text-[10px] uppercase tracking-wider font-semibold text-slate-500">${label}</div>
      <div class="mt-1.5 text-lg font-semibold font-mono text-slate-100">${value}</div>
    </div>`;

  const body = `
<div class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3 mb-6">
  ${stat("Users", String(d.users))}
  ${stat("Services", String(d.services))}
  ${stat("x402 records", String(d.x402Records))}
  ${stat("Smoke", `${smokeIcon} ${d.smokeOk}/${d.smokeTotal}`)}
  ${stat("Alerts 7d", String(d.alerts7d))}
  ${stat("Incidents", incidentBadge)}
  ${stat("P0·P1·P2", `${d.taskCounts.p0.done}/${d.taskCounts.p0.total} · ${d.taskCounts.p1.done}/${d.taskCounts.p1.total} · ${d.taskCounts.p2.done}/${d.taskCounts.p2.total}`)}
</div>

<section class="bg-slate-900 border border-slate-800 rounded-lg p-5 mb-6">
  <div class="flex items-center justify-between mb-4 flex-wrap gap-2">
    <div>
      <h2 class="text-base font-semibold text-slate-100">🗺️ AI Roadmap-style Architecture</h2>
      <p class="text-[11px] text-slate-500 mt-1">Inspired by <a href="https://roadmap.sh/ai-engineer" class="text-blue-400 hover:underline">roadmap.sh/ai-engineer</a> + <a href="https://github.com/PrinceSinghhub/Ultimate-AI-Engineer-Roadmap-2026" class="text-blue-400 hover:underline">PrinceSinghhub/Ultimate-AI-Engineer-Roadmap-2026</a> · ${phaseDefs.length} phases · ~100 components</p>
    </div>
    <div class="flex gap-2 text-[11px]">
      <span class="px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400">✅ LIVE</span>
      <span class="px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400">🚧 D-3</span>
      <span class="px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-400">📅 5/13+</span>
      <span class="px-2 py-0.5 rounded-full bg-rose-500/15 text-rose-400">🔒 secret</span>
      <span class="px-2 py-0.5 rounded-full bg-slate-700/30 text-slate-400">📦 archived</span>
    </div>
  </div>
  <div class="overflow-x-auto flex justify-center py-3">
<pre class="mermaid text-sm">
mindmap
  root(("FreeTier Sentinel<br/>+ AutoBiz<br/>${d.daysToLaunch}"))
    1 Foundation 🏗️
      CF Workers TS ~3.8k LOC
      D1 12 tables ${d.users}u ${d.services}s
      KV namespace
      Cron 4 schedules
    2 Identity 🔐
      Magic link Resend
      AES-256-GCM tokens
      ADMIN_EMAIL gate
      Auth 6 fix 5/8
    3 Routes 🛣️ 19
      Marketing i18n 5
      Auth 5
      Dashboard
      x402 paid 5
      Admin + 5 chapters
      Inbox dashboard
      Utility 10
    4 Cron Jobs ⏰
      Smoke 30min ${d.smokeOk}/${d.smokeTotal}
      Bazaar Poll 1h
      Hourly Metrics 1h
      Usage Check 6h
      Daily Digest 09 KST
    5 Billing 💳
      Polar MoR LIVE 5/8
      Stripe Connect KYC ✅
      PHFREE6MO 50 redemptions
      607-20-94796 일반과세자
      세금계산서 Hometax
    6 x402 Agent Economy 🪙
      ${d.x402Records} records Bazaar
      CDP facilitator Ed25519
      USDC Base mainnet
      $0.005 per call
      0x5337...088
    7 Marketing 📣
      PH 5/12 16:01 KST
      5 글 IH Twitter Reddit
      ShowHN 5/19 별도
      Maker comment v3
      Bazaar listing
      비주얼 4 + demo.mp4
      F5Bot 5 keywords
      ICT 30 posts
    8 Autonomous 🤖
      Smoke alert Telegram
      Gmail 3-tier
        Native filters 8
        GAS 5min
        Daemon 1h
      Inbox flag → Claude
      Telegram chat 8749437676
    9 AI Tooling 🧠
      claude-mem 13.0.0
      SessionStart hook
      UserPromptSubmit hook
      Stop hook 5/9 신규
      Evidence-first 통합
      Memory 19 active
      Memory 10 archive
    10 Observability 📊
      Mission Control + 5
      Microsoft Clarity
      CF Web Analytics
      D1 metric_snapshots
      KV metrics:hourly
      Incidents ${d.incidents} open
    11 Security 🛡️
      14 secrets cloud
      AES-256-GCM
      HSTS preload
      Frame/MIME headers
      feedback_no_guessing
    12 External 🌐
      Cloudflare
      Polar Stripe
      Coinbase CDP
      Resend Telegram
      Clarity Google F5Bot
      3 GitHub repos
</pre>
  </div>
</section>

${phaseCardsHtml}

<div class="text-center text-[11px] text-slate-500 mt-4 pb-2">
  Last fetched ${d.timestamp}Z · auto-refresh 60s · ${d.daysToLaunch}
</div>

<script src="https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.min.js"></script>
<script>
mermaid.initialize({
  startOnLoad: true,
  theme: 'dark',
  mindmap: { padding: 16, maxNodeWidth: 280 },
  themeVariables: {
    fontFamily: '-apple-system, system-ui, sans-serif',
    primaryColor: '#1e293b',
    primaryTextColor: '#e2e8f0',
    primaryBorderColor: '#334155',
    lineColor: '#475569',
  },
});
setTimeout(() => location.reload(), 60000);
</script>
`;

  return chapterLayout("architecture", "🗺️ Architecture", `Live structural map · auto-refresh 60s · ${d.daysToLaunch}`, body, { smokeOk: d.smokeOk, smokeTotal: d.smokeTotal, memoryCount: 19 });
}

// ──────────────────────────────────────────────────────────────────────────
// AI Roadmap-style phase definitions (12 phases, ~100 items)
// Inspired by roadmap.sh/ai-engineer + PrinceSinghhub/Ultimate-AI-Engineer-Roadmap-2026
// ──────────────────────────────────────────────────────────────────────────

type PhaseStatus = "live" | "wip" | "planned" | "archived" | "secret";
interface PhaseItem { name: string; note: string; status: PhaseStatus }
interface Phase { num: number; icon: string; title: string; subtitle: string; items: PhaseItem[] }

function buildPhaseDefs(d: any): Phase[] {
  return [
    { num: 1, icon: "🏗️", title: "Foundation", subtitle: "Compute · Storage · Runtime", items: [
      { name: "Cloudflare Workers", note: "TypeScript ~3,800 LOC · isolate runtime", status: "live" },
      { name: "Compatibility flags", note: "nodejs_compat · 2026-04-01 · workers_dev=true", status: "live" },
      { name: "D1 SQLite", note: `12 tables · ${d.users}u · ${d.services}s · ${d.alerts7d}a7d · 0 incidents`, status: "live" },
      { name: "KV namespace", note: "session/smoke/metrics/cron timestamps · expirationTtl 86400 for smoke", status: "live" },
      { name: "Cron Triggers (4)", note: "*/30 smoke · 0 * * * * bazaar+metrics · 0 */6 usage · 0 0 digest", status: "live" },
      { name: "wrangler.toml bindings", note: "DB + KV + 4 crons + APP_URL/RESEND_FROM vars", status: "live" },
    ]},
    { num: 2, icon: "🔐", title: "Identity & Auth", subtitle: "Magic link · Session · Admin gate", items: [
      { name: "Magic link sign-in", note: "Resend transactional · 6-digit code · no password", status: "live" },
      { name: "Token preview/consume split", note: "GET → preview · POST → consume (scanner-safe)", status: "live" },
      { name: "Session cookie", note: "AES-256-GCM in D1 · master key in Workers Secrets", status: "live" },
      { name: "ADMIN_EMAIL gate", note: "/admin only on email match · requireAdmin() guard", status: "live" },
      { name: "Auth 6 fix (5/8)", note: "single-fire guard · IP+email rate · inline resend · 5 split errors · deploy 99bb875a", status: "live" },
    ]},
    { num: 3, icon: "🛣️", title: "Routes (19 active)", subtitle: "User-facing + API + agent + admin + utility", items: [
      { name: "Marketing landing × 5 i18n", note: "/, /ko, /ja, /es, /de · 11/11/8/8/8 FAQ entries", status: "live" },
      { name: "Auth surface", note: "/signup · /verify GET+POST · /auth/:token GET+POST · /api/auth/{logout,resend}", status: "live" },
      { name: "User dashboard", note: "/dash · /account · /api/account/* · /api/billing/portal", status: "live" },
      { name: "API operations", note: "/api/services/* · /api/alerts · /api/check-now · /api/test-alert", status: "live" },
      { name: "Webhooks", note: "/webhooks/polar (LS+Paddle removed 5/9 · 235 dead lines)", status: "live" },
      { name: "x402 paid (5 endpoints)", note: "/v1/providers · /v1/cloud/:p · /v1/ai/:p · /v1/limits/:p · /v1/compare", status: "live" },
      { name: "x402 docs", note: "/v1/openapi.json · /docs/api", status: "live" },
      { name: "Marketing assets", note: "/launch/{hero,dashboard,alerts,thumbnail}.png · demo.mp4 · /vs/datadog · /security", status: "live" },
      { name: "Mission Control + 5 chapters", note: "/admin · /admin/{architecture,smoke,memory,logs} · /admin/api/*", status: "live" },
      { name: "Inbox dashboard", note: "/inbox · /api/inbox/{sync,list,:id/done}", status: "live" },
      { name: "Utility (10)", note: "/privacy · /terms · /sitemap.xml · /robots.txt · /favicon · /og.png · /llms.txt · /llms-full.txt · /status · /changelog", status: "live" },
      { name: "External notify", note: "/notify · NOTIFY_API_KEY shared secret", status: "live" },
    ]},
    { num: 4, icon: "⏰", title: "Cron Jobs (5)", subtitle: "Autonomous monitoring + maintenance", items: [
      { name: "Smoke (30min)", note: `${d.smokeOk}/${d.smokeTotal} OK · 6 endpoints · direct-handler 5/9 fix · last ${d.lastSmokeRun}`, status: "live" },
      { name: "Bazaar Poll (1h)", note: "indexing detector · paired with metrics · ⏸ until first paid call", status: "wip" },
      { name: "Hourly Metrics (1h)", note: "KV metrics:hourly:* snapshot · CF/Polar/x402 counts", status: "live" },
      { name: "Services Usage Check (6h)", note: "runScheduledCheck · alerts at 80% threshold (default)", status: "live" },
      { name: "Daily Digest (00:00 UTC = 09 KST)", note: "summary email to admin · Resend transactional", status: "live" },
    ]},
    { num: 5, icon: "💳", title: "Billing & Compliance", subtitle: "Polar MoR · 한국 사업자 · 세금계산서", items: [
      { name: "Polar.sh (Merchant of Record)", note: "5/8 webhook LIVE · standardwebhooks raw bytes signing", status: "live" },
      { name: "Stripe Connect Express", note: "KYC ✅ verified 5/9 · all 3 stages confirmed · ready", status: "live" },
      { name: "PHFREE6MO discount", note: "50 redemptions · 6mo Pro free · $5→$0 · 5/9 incognito verified", status: "live" },
      { name: "사업자등록번호", note: "607-20-94796 · 일반과세자 · 영세율 + 매입공제", status: "live" },
      { name: "한국 세금계산서", note: "Hometax 1일 이내 발급 · ko/en/ja/es/de FAQ 명시 (5/9)", status: "live" },
      { name: "부가세 신고", note: "반기 신고 · 7/25 첫 신고 · 1/25 두번째", status: "planned" },
      { name: "i18n FAQ full parity", note: "ja/es/de 8 → 11 entries (en/ko 매칭)", status: "planned" },
    ]},
    { num: 6, icon: "🪙", title: "Agent Economy (x402)", subtitle: "Paid API · USDC settlement · Bazaar indexed", items: [
      { name: "5 paid endpoints", note: "/v1/cloud/:p · /v1/ai/:p · /v1/limits/:p · /v1/providers · /v1/compare", status: "live" },
      { name: "CDP facilitator", note: "api.cdp.coinbase.com/platform/v2/x402 · Ed25519 JWT · race-condition-free", status: "live" },
      { name: "Coinbase Bazaar", note: `${d.x402Records} records · 20 providers · indexed within hours of deploy`, status: "live" },
      { name: "USDC settlement", note: "Base mainnet · ~1-2s e2e · no API keys, no signups", status: "live" },
      { name: "Pricing $0.005/call", note: "research-stage · Bazaar discoverability test", status: "wip" },
      { name: "Base USDC 지갑", note: "0x5337f4b5bed8e379412Abb6498EdC2ebC95bb088 (X402_RECEIVING_ADDRESS)", status: "live" },
      { name: "First USDC settle", note: "Bazaar trigger 24-48h after first agent purchase", status: "planned" },
    ]},
    { num: 7, icon: "📣", title: "Marketing & Distribution", subtitle: "PH 5/12 · 5+1 글 · ICT 30 posts", items: [
      { name: "PH self-hunt 5/12", note: `16:01 KST · 07:01 UTC · 00:01 PDT · ${d.daysToLaunch} from now`, status: "wip" },
      { name: "01 IndieHackers", note: "title + body · D-1 클립보드 prepare", status: "live" },
      { name: "02 Twitter thread", note: "8-tweet build-in-public · 7pm KST publish (T+3h)", status: "live" },
      { name: "03 Reddit r/indiehackers", note: "personal pain story · PH+4h publish (T+4h)", status: "live" },
      { name: "04 Show HN (5/19 별도)", note: "x402-first narrative · Tue 14:00 UTC peak window", status: "planned" },
      { name: "05 PH Maker comment v3", note: "Korean indie dev tone · b2b/세금계산서 ask 추가 (5/9)", status: "live" },
      { name: "06 Bazaar listing", note: "Coinbase Bazaar submission copy", status: "live" },
      { name: "비주얼 4 + demo.mp4", note: "/launch/{hero,dashboard,alerts,thumbnail}.png + demo.mp4 · KV serve", status: "live" },
      { name: "F5Bot mention monitoring", note: "5 keywords · freetier sentinel · wndnjs3865 · x402 paid api", status: "live" },
      { name: "ICT (indie-creator-toolkit)", note: "30 posts visual-rich · 5/7 founder override · standalone affiliate", status: "live" },
      { name: "Hometax 세금계산서 sandbox", note: "D-1 22:30 KST 모의 발급 연습 (사용자)", status: "wip" },
    ]},
    { num: 8, icon: "🤖", title: "Autonomous Operations", subtitle: "Smoke · Gmail 3-tier · Telegram · Inbox", items: [
      { name: "Smoke fail alert", note: "Telegram · 6h cooldown · recovery alert on transition", status: "live" },
      { name: "Gmail Tier 1 — Native filters", note: "8 filters · auto label/archive/star", status: "live" },
      { name: "Gmail Tier 2 — GAS triggers", note: "processInbox 5min · dailySummary 09 KST · weeklyCleanup Sun 03 KST", status: "live" },
      { name: "Gmail Tier 3 — PRoot daemon", note: "1h triage · /tmp/claude_inbox_pending.json flag", status: "live" },
      { name: "Inbox flag → Claude hook", note: "UserPromptSubmit surfaces critical mail next turn", status: "live" },
      { name: "Telegram bot alerts", note: "chat ID 8749437676 · MarkdownV2 formatting", status: "live" },
      { name: "/inbox dashboard", note: "1h synced view · mark-done · sync-now actions", status: "live" },
    ]},
    { num: 9, icon: "🧠", title: "AI Tooling — Memory & Hooks", subtitle: "claude-mem · 3 hooks · evidence-first guard", items: [
      { name: "claude-mem 13.0.0", note: "Apache-2.0 (5/9 relicense) · Server Beta · MCP search/observations/timeline/smart_search", status: "live" },
      { name: "SessionStart hook", note: "5/6 · D-N + identifiers + memory index + live x402 health", status: "live" },
      { name: "UserPromptSubmit hook", note: "5/8 inbox flag + 5/9 강화 · trigger keyword → memory grep auto-inject", status: "live" },
      { name: "Stop hook (5/9 신규)", note: "evidence-first self-verify · dual matching · stop_hook_active 가드 · 0 token cost · ~10-50ms latency", status: "live" },
      { name: "Evidence-first 통합 가드", note: "5/9 7→1 통합 · 메모리:/확인:/출처:/추측: 라벨 강제 · ROADMAP_INSPIRED", status: "live" },
      { name: "Memory inventory", note: "19 active (1 master + 1 guard + 17 state) + 10 archive (7 feedback + 3 legacy queues)", status: "live" },
      { name: "Anthropic Dreams API", note: "Managed Agents waitlist · 5/13+ integration backlog", status: "planned" },
    ]},
    { num: 10, icon: "📊", title: "Observability & Admin", subtitle: "Mission Control · Clarity · Web Analytics", items: [
      { name: "Mission Control + 6 chapters", note: "/admin · architecture (이 페이지) · smoke · memory · logs · inbox", status: "live" },
      { name: "Microsoft Clarity", note: "5/9 LIVE · heatmaps · session replay · 30-day TTL", status: "live" },
      { name: "Cloudflare Web Analytics", note: "CF_BEACON_TOKEN · privacy-first · no cookies", status: "live" },
      { name: "D1 metric_snapshots", note: "manual + automated metric recording", status: "live" },
      { name: "KV metrics:hourly:*", note: "rolling hourly counters · cron metrics job", status: "live" },
      { name: "Tasks (D1)", note: `P0 ${d.taskCounts.p0.done}/${d.taskCounts.p0.total} · P1 ${d.taskCounts.p1.done}/${d.taskCounts.p1.total} · P2 ${d.taskCounts.p2.done}/${d.taskCounts.p2.total}`, status: "live" },
      { name: "Incidents (D1)", note: `${d.incidents} open · /admin Mission Control feed`, status: "live" },
      { name: "Alert log (D1)", note: `${d.alerts7d} in last 7d · /admin/logs full feed (latest 100)`, status: "live" },
    ]},
    { num: 11, icon: "🛡️", title: "Security & Secrets", subtitle: "14 secrets · AES-GCM · CSP headers", items: [
      { name: "14 wrangler secrets (cloud)", note: "POLAR×5 · CDP×2 · RESEND · TELEGRAM×2 · CLARITY · MASTER_KEY · NOTIFY · ADMIN_EMAIL · X402_RECEIVING_ADDRESS", status: "secret" },
      { name: "AES-256-GCM (D1 tokens)", note: "MASTER_KEY in Workers Secrets · separate from D1", status: "live" },
      { name: "Read-only API tokens", note: "service tokens must be usage-scope · never write/admin", status: "live" },
      { name: "HSTS preload", note: "Strict-Transport-Security: max-age=63072000 includeSubDomains preload", status: "live" },
      { name: "Frame/MIME headers", note: "X-Frame-Options DENY · X-Content-Type-Options nosniff · Referrer-Policy strict-origin-when-cross-origin", status: "live" },
      { name: "Privacy & Terms pages", note: "/privacy · /terms (public)", status: "live" },
      { name: "Permissions-Policy", note: "geolocation=() camera=() microphone=()", status: "live" },
      { name: "feedback_no_guessing_user_identity", note: "사용자 정보 추측 금지 (archive — 5/9 통합)", status: "archived" },
    ]},
    { num: 12, icon: "🌐", title: "External & Repos", subtitle: "8 integrations · 3 GitHub repos", items: [
      { name: "Cloudflare", note: "Workers + D1 + KV + DNS + Web Analytics", status: "live" },
      { name: "Polar.sh", note: "MoR + Stripe Connect + checkout + webhook + invoice PDF", status: "live" },
      { name: "Coinbase CDP", note: "x402 facilitator · Ed25519 secret 등록 · Key ID 106c1e04...", status: "live" },
      { name: "Resend", note: "transactional email · domain verified · DKIM/SPF/DMARC", status: "live" },
      { name: "Telegram Bot API", note: "BotFather token · chat ID 8749437676", status: "live" },
      { name: "Microsoft Clarity", note: "free analytics · 30-day session replay TTL", status: "live" },
      { name: "Google Workspace", note: "Gmail GAS triggers · Drive · 3-tier filters", status: "live" },
      { name: "F5Bot", note: "free mention monitoring · 5 keywords", status: "live" },
      { name: "GitHub freetier-sentinel (public)", note: "tool main · 3 workflows (deploy/setup-cf/sync-secrets)", status: "live" },
      { name: "GitHub autobiz (private)", note: "marketing/gmail/brief · RESTORE.md disaster recovery", status: "live" },
      { name: "GitHub indie-creator-toolkit (public)", note: "ICT companion site · GitHub Pages", status: "live" },
    ]},
  ];
}

function statusPill(status: PhaseStatus): string {
  const map: Record<PhaseStatus, { bg: string; text: string; label: string }> = {
    live:     { bg: "bg-emerald-500/15", text: "text-emerald-400", label: "✅ LIVE" },
    wip:      { bg: "bg-amber-500/15",   text: "text-amber-400",   label: "🚧 D-3" },
    planned:  { bg: "bg-blue-500/15",    text: "text-blue-400",    label: "📅 5/13+" },
    archived: { bg: "bg-slate-700/30",   text: "text-slate-400",   label: "📦 archive" },
    secret:   { bg: "bg-rose-500/15",    text: "text-rose-400",    label: "🔒 secret" },
  };
  const s = map[status];
  return `<span class="shrink-0 text-[10px] font-medium px-2 py-0.5 rounded-full ${s.bg} ${s.text}">${s.label}</span>`;
}

function renderPhaseCards(phases: Phase[]): string {
  const card = (p: Phase) => {
    const liveCount = p.items.filter((i) => i.status === "live").length;
    const itemRows = p.items.map((it) => `
      <li class="flex items-start justify-between gap-3 py-2 border-b border-slate-800 last:border-0">
        <div class="min-w-0 flex-1">
          <div class="text-sm text-slate-200 font-medium truncate">${it.name}</div>
          <div class="text-[11px] text-slate-500 mt-0.5">${it.note}</div>
        </div>
        ${statusPill(it.status)}
      </li>`).join("");
    return `
      <section class="bg-slate-900 border border-slate-800 rounded-lg p-5 flex flex-col">
        <header class="flex items-start justify-between gap-2 mb-3 pb-3 border-b border-slate-800">
          <div>
            <div class="flex items-center gap-2">
              <span class="text-[10px] font-mono text-slate-500">PHASE ${String(p.num).padStart(2, "0")}</span>
              <span class="text-base">${p.icon}</span>
            </div>
            <h3 class="text-base font-semibold text-slate-100 mt-1">${p.title}</h3>
            <p class="text-[11px] text-slate-500 mt-0.5">${p.subtitle}</p>
          </div>
          <div class="text-right shrink-0">
            <div class="text-lg font-mono font-semibold text-emerald-400">${liveCount}</div>
            <div class="text-[10px] text-slate-500 uppercase tracking-wider">live</div>
          </div>
        </header>
        <ul class="flex-1">${itemRows}</ul>
      </section>`;
  };

  return `<section class="mb-6">
  <h2 class="text-base font-semibold text-slate-100 mb-3">📚 Phase Detail (every component, no gaps)</h2>
  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
    ${phases.map(card).join("")}
  </div>
</section>`;
}


function stateIcon(s: any): string {
  if (!s) return "❔";
  if (s.status === "ok") return "✅";
  if (s.status === "fail") return "🚨";
  return "❔";
}

// ──────────────────────────────────────────────────────────────────────────
// Shared chapter layout — Tailwind-based, matches Mission Control design
// ──────────────────────────────────────────────────────────────────────────

function chapterLayout(activeId: string, title: string, subtitle: string, body: string, opts: { extraHead?: string; smokeOk?: number; smokeTotal?: number; memoryCount?: number; logsCount?: number } = {}): string {
  const smokeBadge = opts.smokeOk !== undefined ? `<span class="ml-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-slate-800 text-slate-300">${opts.smokeOk}/${opts.smokeTotal}</span>` : "";
  const memoryBadge = opts.memoryCount !== undefined ? `<span class="ml-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-slate-800 text-slate-300">${opts.memoryCount}</span>` : "";
  const logsBadge = opts.logsCount !== undefined ? `<span class="ml-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-slate-800 text-slate-300">${opts.logsCount}</span>` : "";

  const tabs = [
    { id: "mission", href: "/admin", label: "📋 Mission Control", badge: "" },
    { id: "architecture", href: "/admin/architecture", label: "🗺️ Architecture", badge: "" },
    { id: "smoke", href: "/admin/smoke", label: "🧪 Smoke", badge: smokeBadge },
    { id: "memory", href: "/admin/memory", label: "🧠 Memory", badge: memoryBadge },
    { id: "logs", href: "/admin/logs", label: "📜 Logs", badge: logsBadge },
    { id: "inbox", href: "/inbox", label: "📬 Inbox", badge: "" },
  ];
  const tabBase = "inline-flex items-center gap-1 px-3.5 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap";
  const tabIdle = "text-slate-400 border-transparent hover:text-slate-200 hover:bg-white/5";
  const tabActive = "text-slate-50 border-blue-500";
  const navHtml = tabs.map((t) => `<a href="${t.href}" class="${tabBase} ${t.id === activeId ? tabActive : tabIdle}">${t.label}${t.badge}</a>`).join("");

  return `<!doctype html>
<html lang="ko" class="dark">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex">
<title>${title} · FreeTier Sentinel</title>
<script src="https://cdn.tailwindcss.com"></script>
<style>
  body { font-family: -apple-system, BlinkMacSystemFont, "Inter", "Pretendard", system-ui, sans-serif; }
</style>
${opts.extraHead || ""}
</head>
<body class="bg-slate-950 text-slate-100 min-h-screen">

<nav class="sticky top-0 z-50 bg-slate-950/85 backdrop-blur-md border-b border-slate-800">
  <div class="max-w-7xl mx-auto px-4 md:px-6 flex gap-1 overflow-x-auto">
    ${navHtml}
  </div>
</nav>

<div class="max-w-7xl mx-auto p-4 md:p-6">

  <header class="mb-6 flex items-end justify-between gap-4 flex-wrap">
    <div>
      <h1 class="text-2xl md:text-3xl font-bold tracking-tight">${title}</h1>
      <p class="text-sm text-slate-400 mt-1">${subtitle}</p>
    </div>
    <div class="text-xs text-slate-400 font-mono">${new Date().toISOString().slice(0, 19)}Z</div>
  </header>

  ${body}

</div>

</body>
</html>`;
}

async function renderSmokePage(env: Env): Promise<string> {
  const smokeKeys = ["landing", "health", "x402-providers", "docs-api", "openapi", "x402-paid-402"];
  const smokeStates = await Promise.all(
    smokeKeys.map(async (k) => {
      const v = await env.KV.get(`smoke:${k}`).catch(() => null);
      try { return v ? { name: k, ...JSON.parse(v) } : { name: k, status: "unknown" }; }
      catch { return { name: k, status: "unknown" }; }
    }),
  );
  const ok = smokeStates.filter((s) => s.status === "ok").length;
  const total = smokeStates.length;

  const alertRows = await env.DB.prepare(
    `SELECT * FROM alert_log WHERE source LIKE '%smoke%' OR message LIKE '%SMOKE%' OR message LIKE '%Recovery%' ORDER BY id DESC LIMIT 30`,
  ).all<any>().catch(() => ({ results: [] }));

  const cronLast = await env.KV.get("cron:last:smoke").catch(() => null);
  const lastRun = cronLast ? new Date(parseInt(cronLast) * 1000).toISOString().slice(0, 16) : "—";

  const stat = (label: string, value: string) => `
    <div class="bg-slate-900 border border-slate-800 rounded-lg p-4">
      <div class="text-[10px] uppercase tracking-wider font-semibold text-slate-500">${label}</div>
      <div class="mt-1.5 text-lg font-semibold font-mono text-slate-100">${value}</div>
    </div>`;

  const pillCls = (status: string) =>
    status === "ok" ? "bg-emerald-500/15 text-emerald-400" :
    status === "fail" ? "bg-red-500/15 text-red-400" :
    "bg-slate-700/30 text-slate-400";

  const targetRows = smokeStates.map((s) => {
    const lastAlertStr = s.lastAlert ? new Date(s.lastAlert * 1000).toISOString().slice(5, 16) : "—";
    return `<div class="flex items-center justify-between py-2.5 border-b border-slate-800 last:border-0 text-sm">
      <span class="font-mono text-slate-200">${s.name}</span>
      <span class="text-[11px] text-slate-500 font-mono">last alert ${lastAlertStr}</span>
      <span class="inline-block text-[11px] px-2.5 py-0.5 rounded-full font-medium ${pillCls(s.status)}">${s.status}</span>
    </div>`;
  }).join("");

  const alertList = (alertRows.results || []).slice(0, 30).map((a: any) => {
    const ts = a.created_at ? new Date(a.created_at * 1000).toISOString().slice(5, 16) : "—";
    return `<div class="flex items-center gap-3 py-2 border-b border-slate-800 last:border-0 text-sm">
      <span class="text-[11px] text-slate-500 font-mono shrink-0 w-24">${ts}</span>
      <span class="text-slate-300 truncate">${escapeHtml(a.message || "")}</span>
    </div>`;
  }).join("") || `<div class="text-center text-slate-500 text-sm py-8">No smoke-related alerts recorded.</div>`;

  const body = `
<div class="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
  ${stat("Endpoints OK", `${ok}/${total}`)}
  ${stat("Last cron run", lastRun)}
  ${stat("Alert cooldown", "6h")}
  ${stat("Probe mode", "direct handler")}
</div>

<section class="bg-slate-900 border border-slate-800 rounded-lg p-5 mb-4">
  <div class="flex items-center justify-between mb-3">
    <h2 class="text-base font-semibold text-slate-100">6 Endpoint States</h2>
    <span class="text-[11px] text-slate-500 font-mono">KV smoke:* · refresh 30 min</span>
  </div>
  ${targetRows}
</section>

<section class="bg-slate-900 border border-slate-800 rounded-lg p-5">
  <div class="flex items-center justify-between mb-3">
    <h2 class="text-base font-semibold text-slate-100">Recent smoke alerts (30)</h2>
    <span class="text-[11px] text-slate-500 font-mono">D1 alert_log · descending</span>
  </div>
  ${alertList}
</section>
`;
  return chapterLayout("smoke", "🧪 Smoke", "Self-monitoring · 6 endpoint health · 5/9 direct-handler fix", body, { smokeOk: ok, smokeTotal: total, memoryCount: 19 });
}

// Hardcoded memory inventory (CF Workers cannot read PRoot paths).
// Sync this manually when memory layout changes. Source: ls /root/.claude/projects/-root/memory/
const MEMORY_INVENTORY = {
  master: [
    { name: "MEMORY.md", note: "Index — 19 active entries" },
    { name: "resume_queue_2026_05_09.md", note: "5/9 priority queue (D-3)" },
  ],
  guards: [
    { name: "feedback_evidence_first.md", note: "통합 가드 (5/9, 7→1) · 메모리:/확인:/출처:/추측: 라벨 강제" },
  ],
  state: [
    { name: "freetier_sentinel_full_state.md", note: "stack + W0~W1 진행" },
    { name: "business_registration_decision.md", note: "사업자번호 607-20-94796 · 일반과세자 · 7/25 첫 신고" },
    { name: "plan_c_x402_decision.md", note: "x402 paid API 1순위 · CDP migrated · SEO 폐기" },
    { name: "affiliate_applications_status.md", note: "Amazon ✅ · Kit ✅ · Notion/Buttondown 대기" },
    { name: "ls_rejection_2026_05_07.md", note: "LS 거부 → Stripe → Polar 전환" },
    { name: "polar_webhook_signing_spec.md", note: "standardwebhooks raw bytes prefix · 5/8 LIVE 검증" },
    { name: "design_audit_2026_05_08.md", note: "18 sites + 16 HN threads · 라이트테마 통일" },
    { name: "auth_system_audit_2026_05_08.md", note: "6 fix · single-fire + rate-limit · 99bb875a" },
    { name: "ph_launch_5_12_assets.md", note: "5편 글 + 비주얼 + Maker comment + runbook 링크" },
    { name: "gmail_automation_live.md", note: "3-tier filters/GAS/daemon" },
    { name: "autonomous_layer_2026_05_06.md", note: "CF cron 4 + Skills + SessionStart Hook" },
    { name: "inbox_dashboard_system.md", note: "1h triage + Telegram + /inbox dashboard" },
    { name: "mission_control_dashboard.md", note: "/admin priority + 라이브 + Quick actions" },
    { name: "marketing_automation_postlaunch.md", note: "30+ 항목 5/13+ 재평가 backlog" },
    { name: "process_memory_curation_routine.md", note: "dream now/세션 종료 트리거 · Anthropic Dreams 아님" },
    { name: "claude_mem_13_upgrade_2026_05_09.md", note: "12.7.5→13.0.0 · Apache-2.0 · 5/9 활성화" },
  ],
  archive: {
    feedback: 7,
    feedback_files: [
      "feedback_no_guessing_user_identity.md",
      "feedback_proactive_completeness_check.md",
      "feedback_no_false_completion_and_clear_writing.md",
      "feedback_rigorous_analysis.md",
      "feedback_outcomes_first.md",
      "feedback_perf_multi_angle_measurement.md",
      "feedback_self_monitoring_pattern.md",
    ],
    legacy_queues: 3,
    legacy_queue_files: [
      "resume_queue_2026_05_06.md",
      "freetier_sentinel_resume_queue.md",
      "freetier_sentinel_status.md",
    ],
  },
};

function renderMemoryChapter(): { title: string; subtitle: string; body: string } {
  const totalActive = MEMORY_INVENTORY.master.length + MEMORY_INVENTORY.guards.length + MEMORY_INVENTORY.state.length;
  const archiveTotal = MEMORY_INVENTORY.archive.feedback + MEMORY_INVENTORY.archive.legacy_queues;

  const stat = (label: string, value: string) => `
    <div class="bg-slate-900 border border-slate-800 rounded-lg p-4">
      <div class="text-[10px] uppercase tracking-wider font-semibold text-slate-500">${label}</div>
      <div class="mt-1.5 text-lg font-semibold font-mono text-slate-100">${value}</div>
    </div>`;

  const fileRow = (f: { name: string; note: string }) => `
    <div class="flex items-center justify-between py-2.5 border-b border-slate-800 last:border-0 text-sm">
      <span class="font-mono text-slate-200">${f.name}</span>
      <span class="text-slate-500 text-[12px]">${f.note}</span>
    </div>`;

  const section = (title: string, files: any[]) => `
    <section class="bg-slate-900 border border-slate-800 rounded-lg p-5 mb-4">
      <div class="flex items-center justify-between mb-3">
        <h2 class="text-base font-semibold text-slate-100">${title}</h2>
        <span class="text-[11px] text-slate-500 font-mono">${files.length} file${files.length === 1 ? "" : "s"}</span>
      </div>
      ${files.map(fileRow).join("")}
    </section>`;

  const body = `
<div class="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
  ${stat("Active files", String(totalActive))}
  ${stat("Master / Index", String(MEMORY_INVENTORY.master.length))}
  ${stat("Guards (통합)", String(MEMORY_INVENTORY.guards.length))}
  ${stat("Archive total", String(archiveTotal))}
</div>

${section("📌 Master & Resume Queue", MEMORY_INVENTORY.master)}
${section("🛡️ Evidence-first 가드", MEMORY_INVENTORY.guards)}
${section("📚 Project state & decisions", MEMORY_INVENTORY.state)}

<section class="bg-slate-900 border border-slate-800 rounded-lg p-5">
  <div class="flex items-center justify-between mb-3">
    <h2 class="text-base font-semibold text-slate-100">📦 Archive</h2>
    <span class="text-[11px] text-slate-500 font-mono">/root/.claude/projects/-root/memory/archive/</span>
  </div>
  <div class="text-sm text-slate-300 space-y-1">
    <div><span class="font-mono text-slate-400">feedback/</span> · ${MEMORY_INVENTORY.archive.feedback} files (7개 분산 가드, 통합 후 보관)</div>
    <div><span class="font-mono text-slate-400">legacy_queues/</span> · ${MEMORY_INVENTORY.archive.legacy_queues} files (5/4 ~ 5/6 옛 resume queues)</div>
  </div>
  <p class="mt-4 text-[12px] text-slate-500">
    Inventory is hardcoded. CF Workers cannot read PRoot paths; sync this list when files move.
  </p>
</section>
`;
  return {
    title: "🧠 Memory",
    subtitle: `${totalActive} active · ${archiveTotal} archived · evidence-first 통합 가드 (5/9 LIVE)`,
    body,
  };
}

async function renderLogsChapter(env: Env): Promise<{ title: string; subtitle: string; body: string; logsCount: number }> {
  const rows = await env.DB.prepare(
    "SELECT * FROM alert_log ORDER BY id DESC LIMIT 100",
  ).all<any>().catch(() => ({ results: [] }));

  const totalRow = await env.DB.prepare("SELECT COUNT(*) AS c FROM alert_log").first<any>().catch(() => ({ c: 0 }));
  const logsCount = totalRow?.c || 0;

  const last24h = await env.DB.prepare(
    "SELECT COUNT(*) AS c FROM alert_log WHERE created_at > ?",
  ).bind(Math.floor(Date.now() / 1000) - 86400).first<any>().catch(() => ({ c: 0 }));

  const sevCounts = await env.DB.prepare(
    "SELECT severity, COUNT(*) AS c FROM alert_log WHERE created_at > ? GROUP BY severity",
  ).bind(Math.floor(Date.now() / 1000) - 7 * 86400).all<any>().catch(() => ({ results: [] }));
  const sevMap: Record<string, number> = {};
  for (const r of sevCounts.results || []) sevMap[r.severity || "info"] = r.c;

  const stat = (label: string, value: string) => `
    <div class="bg-slate-900 border border-slate-800 rounded-lg p-4">
      <div class="text-[10px] uppercase tracking-wider font-semibold text-slate-500">${label}</div>
      <div class="mt-1.5 text-lg font-semibold font-mono text-slate-100">${value}</div>
    </div>`;

  const sevPill = (sev: string) => {
    const cls = sev === "error" || sev === "critical" ? "bg-red-500/15 text-red-400" :
                sev === "warning" || sev === "warn" ? "bg-amber-500/15 text-amber-400" :
                sev === "info" ? "bg-blue-500/15 text-blue-400" :
                "bg-slate-700/30 text-slate-400";
    return `<span class="inline-block text-[10px] px-2 py-0.5 rounded-full font-medium ${cls}">${sev || "info"}</span>`;
  };

  const logRows = (rows.results || []).map((a: any) => {
    const ts = a.created_at ? new Date(a.created_at * 1000).toISOString().slice(5, 16) : "—";
    return `<div class="flex items-start gap-3 py-2 border-b border-slate-800 last:border-0 text-sm">
      <span class="text-[11px] text-slate-500 font-mono shrink-0 w-24 pt-0.5">${ts}</span>
      <span class="shrink-0 pt-0.5">${sevPill(a.severity || "info")}</span>
      <span class="text-[11px] text-slate-500 font-mono shrink-0">${escapeHtml(a.source || "—")}</span>
      <span class="text-slate-300 truncate flex-1">${escapeHtml(a.message || "")}</span>
    </div>`;
  }).join("") || `<div class="text-center text-slate-500 text-sm py-8">alert_log table is empty.</div>`;

  const body = `
<div class="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
  ${stat("Total rows", String(logsCount))}
  ${stat("Last 24h", String(last24h?.c || 0))}
  ${stat("error 7d", String(sevMap.error || 0))}
  ${stat("warning 7d", String(sevMap.warning || sevMap.warn || 0))}
  ${stat("info 7d", String(sevMap.info || 0))}
</div>

<section class="bg-slate-900 border border-slate-800 rounded-lg p-5">
  <div class="flex items-center justify-between mb-3">
    <h2 class="text-base font-semibold text-slate-100">Recent alerts (latest 100)</h2>
    <span class="text-[11px] text-slate-500 font-mono">D1 alert_log · descending</span>
  </div>
  ${logRows}
</section>
`;
  return {
    title: "📜 Logs",
    subtitle: `Alert log feed · ${logsCount} total rows · ${last24h?.c || 0} in last 24h`,
    body,
    logsCount,
  };
}
