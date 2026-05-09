/**
 * /inbox dashboard — Gmail triage daemon's critical inbox view.
 *
 * Routes:
 *   GET  /inbox                    Dashboard page (ADMIN_EMAIL session auth)
 *   POST /api/inbox/sync           Daemon push of new P0/P1 items (x-api-key auth)
 *   POST /api/inbox/:id/done       Toggle item status to 'done' (ADMIN_EMAIL session auth)
 *   GET  /api/inbox/list           JSON list for client-side polling (ADMIN_EMAIL session auth)
 *
 * Source data: PRoot daemon at /root/biz/gmail/triage_daemon.sh pushes
 * critical mail (P0/P1) here after each hourly fire. Telegram push is sent
 * separately by the daemon via /notify.
 *
 * Separate from /admin Mission Control — different URL, simpler view focused
 * on time-sensitive inbox actions.
 */
import type { Env } from "../index";
import { getUserFromCookie } from "./auth";

const PH_LAUNCH = new Date("2026-05-12T00:00:00Z");

async function ensureInboxTable(env: Env): Promise<void> {
  await env.DB.prepare(`CREATE TABLE IF NOT EXISTS inbox_items (
    id TEXT PRIMARY KEY,
    priority TEXT NOT NULL,
    from_addr TEXT NOT NULL,
    subject TEXT NOT NULL,
    mail_date TEXT NOT NULL,
    inserted_at INTEGER NOT NULL,
    status TEXT NOT NULL DEFAULT 'open',
    done_at INTEGER
  )`).run();
  await env.DB.prepare(
    `CREATE INDEX IF NOT EXISTS idx_inbox_status_inserted ON inbox_items(status, inserted_at DESC)`,
  ).run();
}

async function requireAdmin(req: Request, env: Env): Promise<Response | null> {
  const adminEmail = (env as any).ADMIN_EMAIL as string | undefined;
  if (!adminEmail) {
    return new Response("ADMIN_EMAIL not set", { status: 503 });
  }
  const u = await getUserFromCookie(req, env);
  if (!u) return new Response(null, { status: 302, headers: { location: "/" } });
  if (u.email.toLowerCase() !== adminEmail.toLowerCase()) {
    return new Response("Forbidden", { status: 403 });
  }
  return null;
}

// ─────────────────────────────────────────────────────────────────────
// POST /api/inbox/sync — daemon push
// ─────────────────────────────────────────────────────────────────────
export async function handleInboxSync(req: Request, env: Env): Promise<Response> {
  const apiKey = req.headers.get("x-api-key");
  if (!apiKey || apiKey !== env.NOTIFY_API_KEY) {
    return new Response("unauthorized", { status: 401 });
  }
  let body: any;
  try {
    body = await req.json();
  } catch {
    return new Response("invalid json", { status: 400 });
  }

  const items: any[] = Array.isArray(body?.items) ? body.items : [];
  if (items.length === 0) {
    return new Response(JSON.stringify({ ok: true, inserted: 0 }), {
      headers: { "content-type": "application/json" },
    });
  }

  await ensureInboxTable(env);
  const now = Math.floor(Date.now() / 1000);
  let inserted = 0;
  for (const it of items) {
    const id = String(it.gmail_id ?? "").trim();
    const pri = String(it.priority ?? "").trim();
    if (!id || (pri !== "P0" && pri !== "P1")) continue;
    const r = await env.DB.prepare(
      `INSERT OR IGNORE INTO inbox_items (id, priority, from_addr, subject, mail_date, inserted_at, status)
       VALUES (?, ?, ?, ?, ?, ?, 'open')`,
    )
      .bind(
        id,
        pri,
        String(it.from ?? "").slice(0, 200),
        String(it.subject ?? "").slice(0, 500),
        String(it.mail_date ?? "").slice(0, 100),
        now,
      )
      .run();
    if ((r.meta?.changes ?? 0) > 0) inserted++;
  }
  return new Response(JSON.stringify({ ok: true, inserted }), {
    headers: { "content-type": "application/json" },
  });
}

// ─────────────────────────────────────────────────────────────────────
// POST /api/inbox/:id/done — mark as done
// ─────────────────────────────────────────────────────────────────────
export async function handleInboxDone(req: Request, env: Env, id: string): Promise<Response> {
  const auth = await requireAdmin(req, env);
  if (auth) return auth;
  await ensureInboxTable(env);

  // Read current status to toggle
  const cur = await env.DB.prepare("SELECT status FROM inbox_items WHERE id = ?").bind(id).first<{ status: string }>();
  if (!cur) return new Response("not found", { status: 404 });
  const newStatus = cur.status === "done" ? "open" : "done";
  const now = Math.floor(Date.now() / 1000);
  await env.DB.prepare(
    `UPDATE inbox_items SET status = ?, done_at = ? WHERE id = ?`,
  )
    .bind(newStatus, newStatus === "done" ? now : null, id)
    .run();
  return new Response(JSON.stringify({ ok: true, status: newStatus }), {
    headers: { "content-type": "application/json" },
  });
}

// ─────────────────────────────────────────────────────────────────────
// GET /api/inbox/list — JSON for client polling
// ─────────────────────────────────────────────────────────────────────
export async function handleInboxList(req: Request, env: Env): Promise<Response> {
  const auth = await requireAdmin(req, env);
  if (auth) return auth;
  await ensureInboxTable(env);

  const rows = await env.DB.prepare(
    `SELECT id, priority, from_addr, subject, mail_date, inserted_at, status, done_at
     FROM inbox_items
     ORDER BY status ASC, inserted_at DESC
     LIMIT 200`,
  ).all();

  return new Response(JSON.stringify({ items: rows.results ?? [] }), {
    headers: { "content-type": "application/json" },
  });
}

// ─────────────────────────────────────────────────────────────────────
// GET /inbox — Dashboard page
// ─────────────────────────────────────────────────────────────────────
export async function handleInboxPage(req: Request, env: Env): Promise<Response> {
  const auth = await requireAdmin(req, env);
  if (auth) return auth;
  await ensureInboxTable(env);

  const rows = await env.DB.prepare(
    `SELECT id, priority, from_addr, subject, mail_date, inserted_at, status, done_at
     FROM inbox_items
     ORDER BY status ASC, inserted_at DESC
     LIMIT 200`,
  ).all();
  const items = (rows.results ?? []) as Array<{
    id: string; priority: string; from_addr: string; subject: string;
    mail_date: string; inserted_at: number; status: string; done_at: number | null;
  }>;

  const openP0 = items.filter(i => i.status === "open" && i.priority === "P0").length;
  const openP1 = items.filter(i => i.status === "open" && i.priority === "P1").length;
  const doneCount = items.filter(i => i.status === "done").length;

  // Daemon last fire indicator — derived from most recent inserted_at
  const lastSync = items.length > 0 ? items[0].inserted_at : 0;
  const minutesAgo = lastSync ? Math.floor((Date.now() / 1000 - lastSync) / 60) : -1;
  const daemonHealth = minutesAgo < 0
    ? { label: "no data", color: "text-slate-500" }
    : minutesAgo <= 70
      ? { label: `${minutesAgo}m ago`, color: "text-emerald-400" }
      : minutesAgo <= 120
        ? { label: `${minutesAgo}m ago (delayed)`, color: "text-amber-400" }
        : { label: `${minutesAgo}m ago (stale!)`, color: "text-red-400" };

  // D-N to PH launch
  const today = new Date(); today.setUTCHours(0, 0, 0, 0);
  const dDays = Math.ceil((PH_LAUNCH.getTime() - today.getTime()) / 86400000);
  const dLabel = dDays > 0 ? `D-${dDays}` : dDays === 0 ? "D-DAY" : `D+${Math.abs(dDays)}`;

  const itemRowHtml = (it: typeof items[0]) => {
    const isDone = it.status === "done";
    const priColor = it.priority === "P0" ? "bg-red-500" : "bg-amber-500";
    const insertedAgo = Math.floor((Date.now() / 1000 - it.inserted_at) / 60);
    const subjEsc = it.subject.replace(/[<>&"]/g, c => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", "\"": "&quot;" }[c]!));
    const fromEsc = it.from_addr.replace(/[<>&"]/g, c => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", "\"": "&quot;" }[c]!));
    return `
    <li class="flex items-start gap-3 p-3 rounded-lg ${isDone ? "bg-slate-900/40 opacity-60" : "bg-slate-800/60"} hover:bg-slate-800 transition" data-id="${it.id}">
      <span class="${priColor} text-white text-xs font-bold px-2 py-1 rounded shrink-0">${it.priority}</span>
      <div class="flex-1 min-w-0">
        <div class="${isDone ? "line-through text-slate-400" : "text-slate-100"} text-sm font-medium truncate">${subjEsc}</div>
        <div class="text-xs text-slate-400 mt-0.5 truncate">${fromEsc}</div>
        <div class="text-xs text-slate-500 mt-1">${insertedAgo}m ago · ${it.mail_date}</div>
      </div>
      <div class="flex flex-col gap-1 shrink-0">
        <a href="https://mail.google.com/mail/u/0/#inbox/${it.id}" target="_blank" class="text-xs text-sky-400 hover:underline">Open</a>
        <button class="text-xs ${isDone ? "text-slate-500 hover:text-slate-300" : "text-emerald-400 hover:text-emerald-300"}"
                onclick="toggleDone('${it.id}', this)">${isDone ? "↺ undo" : "✓ done"}</button>
      </div>
    </li>`;
  };

  const openItems = items.filter(i => i.status === "open");
  const doneItems = items.filter(i => i.status === "done");

  const openHtml = openItems.length === 0
    ? '<li class="text-slate-500 text-sm p-3">📭 No open critical items.</li>'
    : openItems.map(itemRowHtml).join("");
  const doneHtml = doneItems.length === 0
    ? '<li class="text-slate-500 text-sm p-3">No completed items yet.</li>'
    : doneItems.slice(0, 30).map(itemRowHtml).join("");

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex">
<title>Inbox · FreeTier Sentinel</title>
<script src="https://cdn.tailwindcss.com"></script>
<style>
  body { background: #0f172a; }
  .glow-red { box-shadow: 0 0 0 1px rgba(239,68,68,0.3); }
</style>
</head>
<body class="text-slate-100 min-h-screen">
<header class="border-b border-slate-800 bg-slate-900/80 backdrop-blur">
  <div class="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
    <div class="flex items-center gap-3">
      <h1 class="text-lg font-bold">📬 Inbox</h1>
      <span class="text-xs text-slate-500">FreeTier Sentinel · triage daemon</span>
    </div>
    <div class="flex items-center gap-4 text-sm">
      <span class="font-bold ${dDays <= 4 ? "text-red-400" : "text-slate-300"}">${dLabel}</span>
      <span class="${daemonHealth.color}" title="Last daemon sync">⏲ ${daemonHealth.label}</span>
      <a href="/admin" class="text-slate-400 hover:text-slate-200">/admin →</a>
    </div>
  </div>
</header>

<main class="max-w-5xl mx-auto px-4 py-6 space-y-6">

  <section class="grid grid-cols-3 gap-3">
    <div class="bg-red-950/40 border border-red-900/40 rounded-lg p-4 ${openP0 > 0 ? "glow-red" : ""}">
      <div class="text-xs text-red-300 uppercase tracking-wider">Open P0</div>
      <div class="text-3xl font-bold text-red-400">${openP0}</div>
    </div>
    <div class="bg-amber-950/40 border border-amber-900/40 rounded-lg p-4">
      <div class="text-xs text-amber-300 uppercase tracking-wider">Open P1</div>
      <div class="text-3xl font-bold text-amber-400">${openP1}</div>
    </div>
    <div class="bg-emerald-950/40 border border-emerald-900/40 rounded-lg p-4">
      <div class="text-xs text-emerald-300 uppercase tracking-wider">Done</div>
      <div class="text-3xl font-bold text-emerald-400">${doneCount}</div>
    </div>
  </section>

  <section>
    <h2 class="text-sm font-semibold text-slate-300 mb-3 flex items-center gap-2">
      <span>🔔 Open critical inbox</span>
      <span class="text-xs text-slate-500">(${openItems.length})</span>
    </h2>
    <ul class="space-y-2">${openHtml}</ul>
  </section>

  <section>
    <h2 class="text-sm font-semibold text-slate-300 mb-3 flex items-center gap-2">
      <span>✓ Recently done</span>
      <span class="text-xs text-slate-500">(${doneItems.length}, last 30)</span>
    </h2>
    <ul class="space-y-1">${doneHtml}</ul>
  </section>

  <footer class="pt-6 border-t border-slate-800 text-xs text-slate-500 flex items-center justify-between">
    <span>Auto-refresh every 60s. Daemon fires every hour at PRoot.</span>
    <a href="/inbox" class="hover:text-slate-300">↻ refresh now</a>
  </footer>
</main>

<script>
async function toggleDone(id, btnEl) {
  btnEl.disabled = true;
  btnEl.textContent = "...";
  try {
    const r = await fetch('/api/inbox/' + encodeURIComponent(id) + '/done', { method: 'POST' });
    if (r.ok) {
      // Soft reload after a tiny delay so animation feels nice
      setTimeout(() => location.reload(), 200);
    } else {
      btnEl.textContent = "err " + r.status;
      btnEl.disabled = false;
    }
  } catch (e) {
    btnEl.textContent = "err";
    btnEl.disabled = false;
  }
}
// Auto-refresh every 60s
setTimeout(() => location.reload(), 60_000);
</script>
</body>
</html>`;

  return new Response(html, {
    status: 200,
    headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" },
  });
}
