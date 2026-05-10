/**
 * /account — user account settings page.
 *
 * Renders Polar customer + subscription + orders data fetched server-side.
 * Light theme matched to root.ts / dash.ts (was dark — caused theme inconsistency
 * across navigation, flagged 5/8 as a major amateur signal).
 *
 * Sections:
 *   1. Subscription — plan, price, status, period, next-billing/cancel-at, manage button
 *   2. Identity — email + change request
 *   3. Activity — services monitored, user_id
 *   4. Billing history — Polar orders (Pro only)
 *   5. Danger zone — sign out, delete account
 *
 * Email change automation is post-launch — for now, support@ handles it manually
 * within a few hours. Verification flow (POST /api/account/email + GET
 * /verify-email/:token) is the next iteration.
 *
 * Also exposes /api/billing/portal — opens a Polar customer portal session
 * via Polar API (using POLAR_API_KEY) and 302-redirects. Falls back to the
 * static POLAR_PORTAL_URL or to a support mailto if API key isn't configured.
 */
import type { Env } from "../index";
import { getUserFromCookie } from "./auth";
import { analyticsHeads } from "../lib/analytics";

interface PolarSubscription {
  id: string;
  status: string;
  started_at?: string;
  current_period_start?: string;
  current_period_end?: string;
  cancel_at_period_end?: boolean;
  ended_at?: string | null;
  recurring_interval?: string;
  amount?: number;
  currency?: string;
  product?: { name?: string; description?: string };
}

interface PolarOrder {
  id: string;
  created_at?: string;
  status?: string;
  amount?: number;
  tax_amount?: number;
  net_amount?: number;
  currency?: string;
  billing_reason?: string;
  invoice_path?: string;
  invoice_url?: string;
}

interface PolarCustomer {
  id: string;
  email?: string;
  name?: string | null;
  billing_address?: { country?: string } | null;
}

async function fetchPolarUserData(env: Env, email: string): Promise<{
  customer: PolarCustomer | null;
  subscriptions: PolarSubscription[];
  orders: PolarOrder[];
}> {
  const empty = { customer: null, subscriptions: [], orders: [] };
  if (!env.POLAR_API_KEY) return empty;
  try {
    const lookupRes = await fetch(
      `https://api.polar.sh/v1/customers/?email=${encodeURIComponent(email)}`,
      { headers: { authorization: `Bearer ${env.POLAR_API_KEY}` } },
    );
    if (!lookupRes.ok) return empty;
    const lookupData: any = await lookupRes.json();
    const customer = lookupData?.items?.[0];
    if (!customer?.id) return empty;
    const [subsRes, ordersRes] = await Promise.all([
      fetch(`https://api.polar.sh/v1/subscriptions/?customer_id=${customer.id}&limit=10`, {
        headers: { authorization: `Bearer ${env.POLAR_API_KEY}` },
      }),
      fetch(`https://api.polar.sh/v1/orders/?customer_id=${customer.id}&limit=10`, {
        headers: { authorization: `Bearer ${env.POLAR_API_KEY}` },
      }),
    ]);
    const subscriptions = subsRes.ok ? ((await subsRes.json() as any)?.items || []) : [];
    const orders = ordersRes.ok ? ((await ordersRes.json() as any)?.items || []) : [];
    return { customer, subscriptions, orders };
  } catch {
    return empty;
  }
}

function fmtDate(iso?: string | null): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
  } catch {
    return "—";
  }
}

function fmtMoney(amount?: number, currency?: string): string {
  if (typeof amount !== "number" || !Number.isFinite(amount)) return "—";
  // Polar amounts are in cents
  return (amount / 100).toLocaleString("en-US", { style: "currency", currency: (currency || "USD").toUpperCase() });
}

function statusPill(status: string): string {
  const s = (status || "").toLowerCase();
  let cls = "pill";
  if (s === "active" || s === "trialing" || s === "paid" || s === "succeeded") cls = "pill ok";
  else if (s === "canceled" || s === "cancelled" || s === "pending") cls = "pill warn";
  else if (s === "revoked" || s === "expired" || s === "failed") cls = "pill crit";
  return `<span class="${cls}">${status || "—"}</span>`;
}

const CSS = String.raw`
:root {
  /* Brand-aligned palette (matches root.ts/dash.ts) — subtle blue tone keys
     the page to the logo gradient (#14b8a6 → #22d3ee). Cards stay pure white. */
  --bg: #f4f7fc; --bg-mesh: #ebf1f9; --surface: #fff; --surface-2: #eef3fa;
  --text: #0a0e1a; --text-2: #455167; --muted: #64748b;
  --border: #dde3ee; --border-strong: #c8d1de;
  --primary: #14b8a6; --primary-2: #0d9488; --primary-3: #2dd4bf; --primary-soft: #ccfbf1;
  --ok: #16a34a; --ok-soft: #dcfce7; --warn: #d97706; --warn-soft: #fef3c7; --crit: #dc2626; --crit-soft: #fee2e2;
  --grad-1: linear-gradient(135deg,#14b8a6,#22d3ee);
  --shadow-xs: 0 1px 2px rgba(20,184,166,.05);
  --shadow-sm: 0 1px 3px rgba(20,184,166,.06), 0 4px 12px rgba(20,184,166,.04);
  --shadow-md: 0 4px 12px rgba(20,184,166,.07), 0 16px 40px rgba(20,184,166,.06);
  --r-sm: 8px; --r-md: 12px; --r-lg: 16px;
  --t-fast: 140ms cubic-bezier(.4,0,.2,1);
}
* { box-sizing: border-box; }
html { -webkit-text-size-adjust: 100%; }
body {
  margin: 0; background: var(--bg); color: var(--text);
  font-family: 'Pretendard Variable', Pretendard, -apple-system, BlinkMacSystemFont, system-ui, 'Segoe UI', 'Apple SD Gothic Neo', sans-serif;
  font-feature-settings: 'kern','liga','calt';
  font-size: 15px; line-height: 1.6;
  letter-spacing: -0.02em;
  -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale;
}
a { color: var(--primary); text-decoration: none; transition: color 140ms; }
a:hover { color: var(--primary-2); }
button { font-family: inherit; cursor: pointer; letter-spacing: -0.012em; }
h1, h2, h3, h4 { font-family: inherit; letter-spacing: -0.035em; line-height: 1.15; font-weight: 600; }
h1 { letter-spacing: -0.045em; }

.wrap { max-width: 760px; margin: 0 auto; padding: 32px 22px 80px; }
.crumbs { font-size: 13.5px; color: var(--muted); margin-bottom: 22px; display: flex; gap: 10px; align-items: center; }
.crumbs a { color: var(--text-2); transition: color var(--t-fast); }
.crumbs a:hover { color: var(--text); }
.crumbs .sep { color: var(--border-strong); }

.header { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 28px; gap: 16px; flex-wrap: wrap; }
.header h1 { font-size: 28px; letter-spacing: -.025em; font-weight: 700; margin: 0 0 4px; line-height: 1.15; }
.header p { color: var(--muted); margin: 0; font-size: 14px; }
.header .badge {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 5px 12px; border-radius: 999px;
  font-size: 12px; font-weight: 600; letter-spacing: .01em;
}
.header .badge.pro { background: var(--primary); color: #fff; box-shadow: 0 2px 8px rgba(20,184,166,.25); }
.header .badge.free { background: var(--surface); border: 1px solid var(--border); color: var(--text-2); }
.header .badge .dot { width: 6px; height: 6px; border-radius: 50%; background: currentColor; opacity: .8; }

.card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--r-lg);
  margin-bottom: 16px;
  box-shadow: var(--shadow-xs);
  overflow: hidden;
}
.card-head {
  display: flex; justify-content: space-between; align-items: center;
  padding: 16px 22px;
  border-bottom: 1px solid var(--border);
}
.card-head h2 { font-size: 12px; text-transform: uppercase; letter-spacing: .12em; color: var(--text-2); margin: 0; font-weight: 700; }
.card-head .head-action { font-size: 13px; color: var(--text-2); display: inline-flex; align-items: center; gap: 6px; }

.row {
  display: flex; justify-content: space-between; align-items: center;
  padding: 14px 22px;
  border-bottom: 1px solid var(--border);
  gap: 16px;
}
.row:last-child { border-bottom: 0; }
.row-stack { flex-direction: column; align-items: stretch; padding: 0; }

.row-main { min-width: 0; flex: 1; }
.row-main .ttl { font-size: 14px; font-weight: 600; color: var(--text); margin: 0 0 2px; }
.row-main .sub { font-size: 13px; color: var(--muted); margin: 0; line-height: 1.5; }
.row-main .sub code { font-family: 'JetBrains Mono', ui-monospace, monospace; background: var(--surface-2); border: 1px solid var(--border); padding: 1px 6px; border-radius: 4px; font-size: 12px; color: var(--text-2); }
.row-aside { display: flex; align-items: center; gap: 10px; flex-shrink: 0; }
.row-aside .val { font-size: 14px; font-weight: 600; color: var(--text); text-align: right; }
.row-aside .val small { display: block; font-size: 12px; font-weight: 400; color: var(--muted); margin-top: 2px; }

.btn {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 8px 14px;
  background: var(--surface); color: var(--text);
  border: 1px solid var(--border-strong);
  border-radius: var(--r-sm);
  font-size: 13.5px; font-weight: 600;
  text-decoration: none;
  transition: background var(--t-fast), border-color var(--t-fast), transform var(--t-fast);
  white-space: nowrap;
}
.btn:hover { background: var(--surface-2); border-color: var(--text-2); color: var(--text); text-decoration: none; }
.btn-primary { background: var(--text); color: #fff !important; border-color: var(--text); }
.btn-primary:hover { background: #1e2939; transform: translateY(-1px); border-color: #1e2939; }
.btn-danger { color: var(--crit); border-color: var(--border); }
.btn-danger:hover { background: var(--crit-soft); border-color: var(--crit); color: var(--crit); }
.btn-ghost { background: transparent; border-color: transparent; color: var(--text-2); padding: 7px 10px; }
.btn-ghost:hover { background: var(--surface-2); color: var(--text); }

.pill { display: inline-flex; align-items: center; gap: 5px; padding: 3px 10px; border-radius: 999px; font-size: 11.5px; font-weight: 600; letter-spacing: .02em; text-transform: capitalize; }
.pill.ok { background: var(--ok-soft); color: #166534; }
.pill.warn { background: var(--warn-soft); color: #92400e; }
.pill.crit { background: var(--crit-soft); color: #991b1b; }
.pill::before { content: ''; width: 5px; height: 5px; border-radius: 50%; background: currentColor; }

/* Subscription summary block (top of plan card) */
.sub-summary { padding: 22px 22px 16px; }
.sub-summary .price-line { display: flex; align-items: baseline; gap: 8px; margin-bottom: 12px; }
.sub-summary .product { font-size: 18px; font-weight: 700; letter-spacing: -.01em; color: var(--text); }
.sub-summary .price { font-size: 18px; font-weight: 700; color: var(--text); }
.sub-summary .price small { font-size: 14px; font-weight: 500; color: var(--muted); }
.sub-summary .meta-grid {
  display: grid; gap: 14px;
  grid-template-columns: repeat(2, 1fr);
  margin-top: 14px;
}
@media (max-width: 600px) { .sub-summary .meta-grid { grid-template-columns: 1fr; gap: 10px; } }
.sub-summary .meta { }
.sub-summary .meta .lbl { font-size: 11px; text-transform: uppercase; letter-spacing: .1em; color: var(--muted); font-weight: 600; margin-bottom: 4px; }
.sub-summary .meta .v { font-size: 14px; font-weight: 600; color: var(--text); }
.sub-summary .meta .v small { display: block; font-weight: 400; color: var(--muted); font-size: 12.5px; margin-top: 2px; }

.cancel-banner {
  margin: 0 22px 16px;
  padding: 12px 14px;
  background: var(--warn-soft); border: 1px solid #fcd34d;
  border-radius: var(--r-sm); color: #92400e;
  font-size: 13px; line-height: 1.5;
  display: flex; gap: 10px; align-items: flex-start;
}
.cancel-banner svg { width: 16px; height: 16px; flex-shrink: 0; margin-top: 1px; }

.upgrade-card {
  background: linear-gradient(135deg, #0a0e1a 0%, #1e293b 100%);
  color: #fff;
  position: relative;
  overflow: hidden;
}
.upgrade-card::before {
  content: ''; position: absolute; right: -60px; top: -60px;
  width: 240px; height: 240px; border-radius: 50%;
  background: radial-gradient(circle, rgba(59,130,246,.35), transparent 70%);
  pointer-events: none;
}
.upgrade-card .card-head { border-color: rgba(255,255,255,.1); }
.upgrade-card .card-head h2 { color: rgba(255,255,255,.7); }
.upgrade-card .body { padding: 22px; position: relative; }
.upgrade-card h3 { font-size: 22px; letter-spacing: -.02em; margin: 0 0 8px; line-height: 1.2; }
.upgrade-card p { color: rgba(255,255,255,.75); font-size: 14px; line-height: 1.6; margin: 0 0 16px; }
.upgrade-card .feats { list-style: none; padding: 0; margin: 0 0 18px; display: grid; gap: 6px; }
.upgrade-card .feats li { font-size: 13.5px; color: rgba(255,255,255,.85); display: flex; align-items: center; gap: 8px; }
.upgrade-card .feats svg { width: 14px; height: 14px; color: #60a5fa; flex-shrink: 0; }
.upgrade-card .upgrade-cta {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 11px 22px;
  background: #fff; color: var(--text);
  border-radius: var(--r-sm);
  font-weight: 600; font-size: 14.5px;
  transition: transform var(--t-fast);
}
.upgrade-card .upgrade-cta:hover { transform: translateY(-1px); color: var(--text); }

/* Billing history table */
.invoices { width: 100%; border-collapse: collapse; }
.invoices thead th {
  text-align: left;
  padding: 12px 22px;
  font-size: 11px; text-transform: uppercase; letter-spacing: .1em;
  color: var(--muted); font-weight: 700;
  border-bottom: 1px solid var(--border);
  background: var(--surface-2);
}
.invoices thead th:last-child, .invoices tbody td:last-child { text-align: right; }
.invoices tbody td {
  padding: 14px 22px;
  font-size: 13.5px;
  border-bottom: 1px solid var(--border);
  color: var(--text);
  vertical-align: middle;
}
.invoices tbody tr:last-child td { border-bottom: 0; }
.invoices tbody tr:hover { background: var(--surface-2); }
.invoices .amt { font-weight: 600; font-variant-numeric: tabular-nums; }
.invoices .id { font-family: 'JetBrains Mono', ui-monospace, monospace; font-size: 12px; color: var(--muted); }
.invoices .receipt { color: var(--primary); font-weight: 500; }
.invoices .receipt:hover { color: var(--primary-2); }

.empty {
  padding: 40px 22px;
  text-align: center; color: var(--muted);
  font-size: 14px;
}
.empty svg { width: 36px; height: 36px; color: var(--border-strong); margin: 0 auto 12px; display: block; }
.empty p { margin: 0; }

.flash {
  padding: 12px 16px; border-radius: var(--r-md);
  margin-bottom: 16px; font-size: 14px; line-height: 1.55;
  display: flex; gap: 10px; align-items: flex-start;
}
.flash.ok { background: var(--ok-soft); border: 1px solid #86efac; color: #166534; }
.flash.warn { background: var(--warn-soft); border: 1px solid #fcd34d; color: #92400e; }
.flash svg { width: 18px; height: 18px; flex-shrink: 0; margin-top: 1px; }

@media (max-width: 600px) {
  .header h1 { font-size: 24px; }
  .row { flex-wrap: wrap; align-items: flex-start; }
  .row-aside { width: 100%; justify-content: flex-end; padding-top: 4px; }
  .invoices thead th, .invoices tbody td { padding: 12px 16px; }
  .invoices thead th:nth-child(3), .invoices tbody td:nth-child(3) { display: none; } /* hide order id col on mobile */
}
`;

const ICONS = {
  alert: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>',
  check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>',
  receipt: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>',
  ext: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:11px;height:11px;margin-left:2px"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>',
};

export async function handleAccountPage(req: Request, env: Env): Promise<Response> {
  const user = await getUserFromCookie(req, env);
  if (!user) return new Response(null, { status: 302, headers: { location: "/" } });

  const [services, polar] = await Promise.all([
    env.DB.prepare("SELECT COUNT(*) as n FROM services WHERE user_id = ?").bind(user.id).first<{ n: number }>(),
    fetchPolarUserData(env, user.email),
  ]);

  const url = new URL(req.url);
  const flash = url.searchParams.get("flash") || "";
  const isPro = user.plan === "pro";

  // Pick the active subscription if any (most recent active, then any most recent)
  const activeSub: PolarSubscription | undefined =
    polar.subscriptions.find((s) => (s.status || "").toLowerCase() === "active") ||
    polar.subscriptions[0];

  const willCancel = activeSub?.cancel_at_period_end === true && (activeSub.status || "").toLowerCase() === "active";
  const productName = activeSub?.product?.name || "Pro";

  // Subscription summary block — only rendered for Pro users with a Polar subscription on file.
  const subSummary = isPro && activeSub ? `
    <div class="sub-summary">
      <div class="price-line">
        <span class="product">${productName}</span>
        <span class="price">${fmtMoney(activeSub.amount, activeSub.currency)}<small>/${activeSub.recurring_interval || "month"}</small></span>
      </div>
      <div class="meta-grid">
        <div class="meta">
          <div class="lbl">Status</div>
          <div class="v">${statusPill(activeSub.status || "")}</div>
        </div>
        <div class="meta">
          <div class="lbl">${willCancel ? "Cancels on" : "Next billing"}</div>
          <div class="v">${fmtDate(activeSub.current_period_end)}</div>
        </div>
        <div class="meta">
          <div class="lbl">Started</div>
          <div class="v">${fmtDate(activeSub.started_at)}</div>
        </div>
        <div class="meta">
          <div class="lbl">Current period</div>
          <div class="v" style="font-size:13px;font-weight:500">${fmtDate(activeSub.current_period_start)} → ${fmtDate(activeSub.current_period_end)}</div>
        </div>
      </div>
    </div>
    ${willCancel ? `
    <div class="cancel-banner">
      ${ICONS.alert}
      <div>Your subscription is set to cancel on <strong>${fmtDate(activeSub.current_period_end)}</strong>. You'll keep Pro access until then. Reactivate anytime from the billing portal.</div>
    </div>
    ` : ""}
  ` : "";

  // Plan/subscription card
  const planCard = isPro ? `
    <div class="card">
      <div class="card-head">
        <h2>Subscription</h2>
        <span class="head-action">Managed by Polar</span>
      </div>
      ${subSummary || `
        <div class="row">
          <div class="row-main">
            <p class="ttl">Pro plan active</p>
            <p class="sub">Subscription details will appear here once Polar finishes provisioning. Refresh in a moment if this is your first checkout.</p>
          </div>
        </div>
      `}
      <div class="row">
        <div class="row-main">
          <p class="ttl">Manage billing</p>
          <p class="sub">Update payment method, download invoices, change plan, or cancel — all in the secure Polar portal.</p>
        </div>
        <div class="row-aside">
          <a href="/api/billing/portal" target="_blank" rel="noopener" class="btn btn-primary">Open billing portal${ICONS.ext}</a>
        </div>
      </div>
    </div>
  ` : `
    <div class="card upgrade-card">
      <div class="card-head">
        <h2>Plan</h2>
        <span class="head-action" style="color:rgba(255,255,255,.65)">Free · 3 services</span>
      </div>
      <div class="body">
        <h3>Upgrade to Pro</h3>
        <p>Unlimited services, hourly polling, and Discord + Telegram alerts — for the cost of a single coffee.</p>
        <ul class="feats">
          <li>${ICONS.check} Unlimited services (Free is capped at 3)</li>
          <li>${ICONS.check} Hourly polling instead of every 12 hours</li>
          <li>${ICONS.check} Discord, Telegram, Slack alerts</li>
          <li>${ICONS.check} 30-day usage history</li>
          <li>${ICONS.check} Cancel anytime · 7-day full refund</li>
        </ul>
        ${env.POLAR_CHECKOUT_URL ? `
          <a href="${env.POLAR_CHECKOUT_URL}?customer_email=${encodeURIComponent(user.email)}&metadata%5Buser_id%5D=${user.id}" class="upgrade-cta">Upgrade · $5/mo →</a>
        ` : `
          <a href="/dash" class="upgrade-cta">Go to dashboard →</a>
        `}
      </div>
    </div>
  `;

  // Billing history (Pro only) — prefer Polar orders
  const billingHistoryCard = isPro ? `
    <div class="card">
      <div class="card-head">
        <h2>Billing history</h2>
        ${polar.orders.length > 0 ? `<span class="head-action">${polar.orders.length} ${polar.orders.length === 1 ? "invoice" : "invoices"}</span>` : ""}
      </div>
      ${polar.orders.length > 0 ? `
        <table class="invoices">
          <thead>
            <tr>
              <th>Date</th>
              <th>Amount</th>
              <th>Order</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            ${polar.orders.map((o) => `
              <tr>
                <td>${fmtDate(o.created_at)}</td>
                <td class="amt">${fmtMoney(o.amount, o.currency)}</td>
                <td class="id">${(o.id || "").slice(0, 12)}…</td>
                <td>${statusPill(o.status || "")}</td>
                <td><a href="/api/billing/portal" target="_blank" rel="noopener" class="receipt">Receipt${ICONS.ext}</a></td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      ` : `
        <div class="empty">
          ${ICONS.receipt}
          <p>Your invoices will appear here after your first billing cycle.</p>
        </div>
      `}
    </div>
  ` : "";

  // Identity card
  const identityCard = `
    <div class="card">
      <div class="card-head"><h2>Identity</h2></div>
      <div class="row">
        <div class="row-main">
          <p class="ttl">${user.email}</p>
          <p class="sub">Sign-in email · receives magic links and Polar invoices</p>
        </div>
        <div class="row-aside">
          <span class="pill ok">verified</span>
        </div>
      </div>
      <div class="row">
        <div class="row-main">
          <p class="ttl">Change email</p>
          <p class="sub">Solo dev manual review for now (auto verification flow ships post-launch). Replies within a few hours during KST business hours.</p>
        </div>
        <div class="row-aside">
          <form method="POST" action="/api/account/email-change-request" style="margin:0">
            <button type="submit" class="btn">Request change</button>
          </form>
        </div>
      </div>
    </div>
  `;

  // Activity card
  const activityCard = `
    <div class="card">
      <div class="card-head"><h2>Activity</h2></div>
      <div class="row">
        <div class="row-main">
          <p class="ttl">Services monitored</p>
          <p class="sub">${isPro ? "Pro · unlimited services" : "Free · up to 3 services"}</p>
        </div>
        <div class="row-aside">
          <div class="val">${services?.n ?? 0}<small>${isPro ? "no limit" : `of 3`}</small></div>
        </div>
      </div>
      <div class="row">
        <div class="row-main">
          <p class="ttl">User ID</p>
          <p class="sub">Reference this when contacting support · <code>${user.id}</code></p>
        </div>
      </div>
      ${polar.customer?.id ? `
      <div class="row">
        <div class="row-main">
          <p class="ttl">Polar customer ID</p>
          <p class="sub">For payment-related support · <code>${polar.customer.id}</code></p>
        </div>
      </div>
      ` : ""}
    </div>
  `;

  // Danger zone
  const dangerCard = `
    <div class="card">
      <div class="card-head"><h2>Danger zone</h2></div>
      <div class="row">
        <div class="row-main">
          <p class="ttl">Sign out</p>
          <p class="sub">End this session on this device. Magic-link sessions on other devices remain active.</p>
        </div>
        <div class="row-aside">
          <a href="/api/auth/logout" class="btn">Sign out</a>
        </div>
      </div>
      <div class="row">
        <div class="row-main">
          <p class="ttl">Delete account</p>
          <p class="sub">Permanently remove all services, alerts, history, and ${isPro ? "your Pro subscription" : "your free account"}. We process within a few hours and email you confirmation.</p>
        </div>
        <div class="row-aside">
          <form method="POST" action="/api/account/delete-request" style="margin:0">
            <button type="submit" class="btn btn-danger" onclick="return confirm('Permanently delete your account? This cannot be undone.${isPro ? ' Your Polar subscription will also be canceled.' : ''}')">Request deletion</button>
          </form>
        </div>
      </div>
    </div>
  `;

  // Flash messages
  const flashHTML = (() => {
    if (flash === "email_request") return `<div class="flash ok">${ICONS.check}<div>Email change request received — we'll process it within a few hours. Watch your inbox for the confirmation.</div></div>`;
    if (flash === "delete_request") return `<div class="flash warn">${ICONS.alert}<div>Account deletion request submitted. We'll send a confirmation email within a few hours and process your data per the privacy policy.</div></div>`;
    return "";
  })();

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Account · FreeTier Sentinel</title>
<meta name="theme-color" content="#14b8a6">
<link rel="icon" type="image/svg+xml" href="/favicon.svg">
<link rel="preconnect" href="https://cdn.jsdelivr.net" crossorigin>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" as="style" crossorigin href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css">
<link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
<style>${CSS}</style>
${analyticsHeads(env)}
</head>
<body>
<div class="wrap">

  <div class="crumbs">
    <a href="/dash">← Dashboard</a>
    <span class="sep">/</span>
    <span>Account</span>
  </div>

  <div class="header">
    <div>
      <h1>Account</h1>
      <p>${user.email}</p>
    </div>
    <span class="badge ${isPro ? "pro" : "free"}"><span class="dot"></span>${isPro ? "Pro plan" : "Free plan"}</span>
  </div>

  ${flashHTML}
  ${planCard}
  ${billingHistoryCard}
  ${identityCard}
  ${activityCard}
  ${dangerCard}

</div>
</body>
</html>`;

  return new Response(html, {
    status: 200,
    headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" },
  });
}

// Email change request — sends a notification email via Resend / logs to alert_log.
// Manual processing for now; auto flow with verification token is post-launch.
export async function handleEmailChangeRequest(req: Request, env: Env): Promise<Response> {
  const user = await getUserFromCookie(req, env);
  if (!user) return new Response(null, { status: 302, headers: { location: "/" } });

  try {
    await env.DB.prepare(
      "INSERT INTO alert_log (kind, message, created_at) VALUES (?, ?, ?)"
    ).bind(
      "account.email_change_request",
      JSON.stringify({ user_id: user.id, current_email: user.email, ts: Date.now() }),
      Math.floor(Date.now() / 1000),
    ).run();
  } catch { /* alert_log table not yet created */ }

  if (env.RESEND_API_KEY && env.RESEND_FROM) {
    try {
      await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "authorization": `Bearer ${env.RESEND_API_KEY}`,
          "content-type": "application/json",
        },
        body: JSON.stringify({
          from: env.RESEND_FROM,
          to: ["wndnjs3865@gmail.com"],
          subject: `[FT] Email change request from user ${user.id}`,
          text: `User ${user.id} (current email: ${user.email}) requested an email change via /account.\n\nReply to them at ${user.email} to ask for the new address, then update users.email in D1.`,
        }),
      });
    } catch { /* best effort */ }
  }

  return new Response(null, { status: 302, headers: { location: "/account?flash=email_request" } });
}

export async function handleAccountDeleteRequest(req: Request, env: Env): Promise<Response> {
  const user = await getUserFromCookie(req, env);
  if (!user) return new Response(null, { status: 302, headers: { location: "/" } });

  try {
    await env.DB.prepare(
      "INSERT INTO alert_log (kind, message, created_at) VALUES (?, ?, ?)"
    ).bind(
      "account.delete_request",
      JSON.stringify({ user_id: user.id, email: user.email, plan: user.plan, ts: Date.now() }),
      Math.floor(Date.now() / 1000),
    ).run();
  } catch { /* */ }

  if (env.RESEND_API_KEY && env.RESEND_FROM) {
    try {
      await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "authorization": `Bearer ${env.RESEND_API_KEY}`,
          "content-type": "application/json",
        },
        body: JSON.stringify({
          from: env.RESEND_FROM,
          to: ["wndnjs3865@gmail.com"],
          subject: `[FT] ⚠️ Account deletion request from user ${user.id}`,
          text: `User ${user.id} (${user.email}, plan=${user.plan}) requested account deletion.\n\nIf they're Pro, cancel their Polar subscription first, then DELETE FROM users WHERE id=${user.id} (cascade will clean services + channels + sessions).`,
        }),
      });
    } catch { /* */ }
  }

  return new Response(null, { status: 302, headers: { location: "/account?flash=delete_request" } });
}

// Polar customer portal session — opens a fresh portal URL via Polar API.
// Two-step: lookup customer by email → create customer session by customer_id.
// Falls back to env.POLAR_PORTAL_URL if API key not configured, or mailto if neither.
export async function handleBillingPortal(req: Request, env: Env): Promise<Response> {
  const user = await getUserFromCookie(req, env);
  if (!user) return new Response(null, { status: 302, headers: { location: "/" } });

  if (env.POLAR_API_KEY) {
    try {
      const lookup = await fetch(
        `https://api.polar.sh/v1/customers/?email=${encodeURIComponent(user.email)}`,
        {
          headers: {
            "authorization": `Bearer ${env.POLAR_API_KEY}`,
          },
        },
      );
      if (lookup.ok) {
        const lookupData: any = await lookup.json();
        const customerId = lookupData?.items?.[0]?.id;
        if (customerId) {
          const session = await fetch("https://api.polar.sh/v1/customer-sessions/", {
            method: "POST",
            headers: {
              "authorization": `Bearer ${env.POLAR_API_KEY}`,
              "content-type": "application/json",
            },
            body: JSON.stringify({ customer_id: customerId }),
          });
          if (session.ok) {
            const sessionData: any = await session.json();
            const portalUrl = sessionData?.customer_portal_url || sessionData?.url;
            if (portalUrl) {
              return new Response(null, { status: 302, headers: { location: portalUrl } });
            }
            console.log("polar customer session: no portal URL in response", sessionData);
          } else {
            const errBody = await session.text();
            console.log("polar customer session failed:", session.status, errBody);
          }
        } else {
          console.log("polar customer lookup: no customer for email", user.email);
        }
      } else {
        const errBody = await lookup.text();
        console.log("polar customer lookup failed:", lookup.status, errBody);
      }
    } catch (e) {
      console.log("polar portal session error:", e);
    }
  }

  if (env.POLAR_PORTAL_URL) {
    return new Response(null, { status: 302, headers: { location: env.POLAR_PORTAL_URL } });
  }

  const subject = encodeURIComponent("FreeTier Sentinel Pro — billing portal link");
  const body = encodeURIComponent(`Hi,\n\nPlease send me a fresh Polar customer portal link for my Pro subscription.\n\nAccount email: ${user.email}\nUser ID: ${user.id}\n\nThanks.`);
  return new Response(null, {
    status: 302,
    headers: { location: `mailto:wndnjs3865@gmail.com?subject=${subject}&body=${body}` },
  });
}
