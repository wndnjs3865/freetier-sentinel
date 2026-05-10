import type { Env } from "../index";
import { getUserFromCookie } from "./auth";
import { analyticsHeads } from "../lib/analytics";

const CSS = String.raw`
:root {
  /* Indigo-leaning palette (matches root.ts top-1% upgrade). */
  --bg: #f6f8fc; --bg-mesh: #e9eef8; --surface: #fff; --surface-2: #eef2fa;
  --text: #0a0e1a; --text-2: #424b62; --muted: #64748b;
  --border: #dde3ee; --border-strong: #c4cdde;
  --primary: #14b8a6; --primary-2: #0d9488; --primary-3: #2dd4bf; --primary-soft: #ccfbf1;
  --accent: #22d3ee;
  --ok: #10b981; --warn: #f59e0b; --err: #f43f5e;
  --grad-1: linear-gradient(135deg,#0d9488,#14b8a6);
  --grad-pro: linear-gradient(135deg,#0d9488,#14b8a6,#22d3ee);
  --shadow-xs: 0 1px 2px rgba(20,184,166,.05);
  --shadow-sm: 0 1px 3px rgba(20,184,166,.06), 0 4px 12px rgba(20,184,166,.04);
  --shadow-md: 0 4px 12px rgba(20,184,166,.08), 0 16px 40px rgba(20,184,166,.06);
  --r-sm: 8px; --r-md: 12px; --r-lg: 16px;
  --t-fast: 140ms cubic-bezier(.4,0,.2,1);
}

@media (prefers-color-scheme: dark) {
  :root {
    --bg: #0a0e1a; --bg-mesh: #131a2c; --surface: #11172a; --surface-2: #161e34;
    --text: #ecf0f9; --text-2: #a3aec5; --muted: #6c7891;
    --border: #1f2940; --border-strong: #2c3853;
    --primary: #2dd4bf; --primary-2: #5eead4; --primary-3: #99f6e4; --primary-soft: rgba(20,184,166,.18);
    --shadow-xs: 0 1px 2px rgba(0,0,0,.30);
    --shadow-sm: 0 1px 3px rgba(0,0,0,.30), 0 4px 12px rgba(0,0,0,.20);
    --shadow-md: 0 4px 12px rgba(0,0,0,.40), 0 16px 40px rgba(0,0,0,.30);
  }
  /* Dashboard surfaces that have hardcoded white-bg references */
  .stat:hover { box-shadow: inset 0 1px 0 rgba(255,255,255,.04), 0 8px 24px -8px rgba(0,0,0,.40); }
  .stat { box-shadow: inset 0 1px 0 rgba(255,255,255,.04), var(--shadow-xs); }
  .bottom-nav { background: rgba(10,14,26,.92); }
  .hamburger, .mobile-menu .mm-close { background: var(--surface); }
  .add-form input:focus, .add-form select:focus { box-shadow: 0 0 0 4px rgba(45,212,191,.20); }
  .status-pill.ok   { color: #6ee7b7; }
  .status-pill.warn { color: #fcd34d; }
  .status-pill.err, .status-pill.critical { color: #fda4af; }
}
*{box-sizing:border-box}
body {
  font-family: 'Inter',-apple-system,system-ui,sans-serif;
  background: var(--bg); color: var(--text);
  margin: 0; line-height: 1.6;
  -webkit-font-smoothing: antialiased;
  font-feature-settings: 'cv02','cv03','cv11','ss01';
}
h1, h2, h3, h4 { font-family: 'Satoshi', 'Inter', system-ui, sans-serif; letter-spacing: -.02em; }
a{color:var(--primary);text-decoration:none}a:hover{color:var(--primary-2)}
button{font-family:inherit;cursor:pointer}

/* ──── LAYOUT ──── */
.app {
  display: grid;
  grid-template-columns: 1fr;
  min-height: 100vh;
}
@media (min-width: 880px) {
  .app { grid-template-columns: 256px 1fr; transition: grid-template-columns 220ms cubic-bezier(.4,0,.2,1); }
  .app.side-collapsed { grid-template-columns: 72px 1fr; }
}

/* ──── SIDEBAR (DESKTOP) ──── */
.side {
  display: none;
  background: var(--surface);
  border-right: 1px solid var(--border);
  padding: 24px 16px;             /* 8px grid */
  position: sticky;
  top: 0;
  height: 100vh;
  flex-direction: column;
  gap: 4px;                       /* tight default spacing between links */
  overflow: hidden;
  transition: padding 220ms cubic-bezier(.4,0,.2,1);
}
@media (min-width: 880px) { .side { display: flex; } }
.side .brand { margin: 0 4px 24px; font-size: 15px; line-height: 1.2; }
.side .brand-logo { flex-shrink: 0; }
.app.side-collapsed .side { padding: 24px 12px; }
.app.side-collapsed .side .brand .brand-text { display: none; }
.app.side-collapsed .side .side-section { font-size: 0; height: 0; margin: 8px 0 4px; opacity: 0; pointer-events: none; }
.app.side-collapsed .side-link { justify-content: center; padding: 10px 0; gap: 0; }
.app.side-collapsed .side-link .label,
.app.side-collapsed .side-link .count { opacity: 0; max-width: 0; overflow: hidden; margin: 0; }
.app.side-collapsed .side-foot,
.app.side-collapsed .side-user { display: none; }

/* Sidebar toggle button (desktop only) */
.side-toggle {
  margin-top: auto; margin-bottom: 4px;
  display: inline-flex; align-items: center; justify-content: center; gap: 8px;
  background: transparent; border: 1px solid var(--border);
  border-radius: 10px; padding: 8px;
  color: var(--text-2); cursor: pointer;
  transition: border-color var(--t-fast), background var(--t-fast), color var(--t-fast);
  font-family: inherit; font-size: 13px; font-weight: 500;
}
.side-toggle:hover { border-color: var(--border-strong); background: var(--surface-2); color: var(--text); }
.side-toggle svg { width: 16px; height: 16px; flex-shrink: 0; transition: transform 220ms cubic-bezier(.4,0,.2,1); }
.app.side-collapsed .side-toggle svg { transform: rotate(180deg); }
.app.side-collapsed .side-toggle .label { display: none; }
.brand { display: inline-flex; align-items: center; gap: 8px; font-weight: 700; font-size: 15px; letter-spacing: -.01em; color: var(--text); margin: 0 8px 24px; }
.brand-logo { width: 22px; height: 22px; border-radius: 6px; background: var(--grad-1); color: white; display: inline-flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 800; box-shadow: 0 1px 0 rgba(15,23,42,.06), inset 0 1px 0 rgba(255,255,255,.18); }
.side-section {
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: .14em;
  font-weight: 600;
  color: var(--muted);
  margin: 24px 12px 8px;        /* 8px grid spacing */
  padding-top: 16px;
  border-top: 1px solid var(--border);
}
.side-section:first-of-type {
  margin-top: 8px;
  padding-top: 0;
  border-top: 0;
}
.side-link {
  display: flex;
  align-items: center;          /* vertical center icon + label + count */
  gap: 12px;                    /* consistent spacing icon ↔ label */
  padding: 10px 12px;
  border-radius: 8px;
  font-size: 14.5px;
  font-weight: 500;
  color: var(--text-2);
  line-height: 1.2;             /* tight line-height keeps SVG centered */
  text-decoration: none;
  min-width: 0;
  transition: background 200ms cubic-bezier(.4,0,.2,1), color 200ms cubic-bezier(.4,0,.2,1);
}
.side-link:hover { background: var(--surface-2); color: var(--text); }
.side-link.active {
  background: var(--primary-soft);
  color: var(--primary);
  font-weight: 600;
  box-shadow: inset 3px 0 0 var(--primary);
}
.side-link svg {
  width: 18px;
  height: 18px;
  flex-shrink: 0;               /* never compress */
  display: block;               /* drop inline baseline gap */
  stroke-width: 2;              /* explicit — avoid stroke variance */
}
.side-link .label {
  flex: 1 1 auto;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  transition: opacity var(--t-fast);
}
.side-link .count {
  flex-shrink: 0;
  margin-left: auto;
  font-size: 12px;
  font-weight: 500;
  color: var(--muted);
  font-family: 'JetBrains Mono', ui-monospace, monospace;
  font-variant-numeric: tabular-nums;
  transition: opacity var(--t-fast);
}
.app.side-collapsed .side-link .count { opacity: 0; max-width: 0; overflow: hidden; }
.side-foot {
  margin-top: auto;
  padding: 16px 12px 8px;
  border-top: 1px solid var(--border);
  text-decoration: none;
  display: block;
  border-radius: 8px;
  transition: background 200ms cubic-bezier(.4,0,.2,1);
}
.side-foot:hover { background: var(--surface-2); }
.side-user { font-size: 13px; line-height: 1.4; min-width: 0; }
.side-user .em {
  color: var(--text); font-weight: 500;
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
  display: block; max-width: 100%;
}
.side-user .pl { color: var(--muted); margin-top: 4px; font-size: 12.5px; }

/* ──── MAIN ──── */
main {
  padding: 28px 24px 96px;
  max-width: 1080px;
  min-width: 0;                       /* prevent grid child collapse on narrow viewports */
  width: 100%;
  margin: 0 auto;
}
@media (min-width: 880px) { main { padding: 36px 36px 96px; } }
@media (max-width: 600px) { main { padding: 24px 18px 96px; } }
@media (max-width: 380px) { main { padding: 20px 14px 96px; } }

/* Topbar — desktop is row (sidebar visible, no compete); mobile is column to prevent
   .greeting from collapsing to 0px when siblings take all horizontal space. */
.topbar {
  display: grid;
  grid-template-columns: auto 1fr auto;        /* hamburger | brand | badge */
  grid-template-areas:
    "ham brand badge"
    "greet greet greet";
  align-items: center;
  gap: 12px 12px;
  margin-bottom: 24px;
  min-width: 0;
}
.topbar .hamburger        { grid-area: ham; }
.topbar-mobile-brand      { grid-area: brand; display: inline-flex; align-items: center; gap: 8px; font-weight: 600; font-size: 15px; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.topbar .greeting         { grid-area: greet; min-width: 0; width: 100%; }
.topbar > .badge          { grid-area: badge; flex-shrink: 0; }
@media (min-width: 880px) {
  /* Desktop: sidebar replaces brand; greeting fits inline next to badge. */
  .topbar {
    grid-template-columns: 1fr auto;
    grid-template-areas: "greet badge";
  }
  .topbar .hamburger, .topbar-mobile-brand { display: none; }
}
.greeting { min-width: 0; width: 100%; }
.greeting h1 {
  font-size: clamp(22px, 3.4vw, 28px);
  letter-spacing: -.02em;
  font-weight: 600;
  margin: 0 0 6px;
  line-height: 1.2;
  overflow-wrap: break-word;
  word-break: normal;
  text-wrap: balance;
}
.greeting p {
  color: var(--muted);
  margin: 0;
  font-size: 14px;
  line-height: 1.6;
  /* No flex here — plain block flow avoids the "1ch wide flex child" collapse trap.
     overflow-wrap: anywhere only kicks in for unbreakable strings (long emails). */
  overflow-wrap: anywhere;
  word-break: normal;
  hyphens: auto;
  min-width: 0;
}
.greeting p .greeting-email {
  font-family: 'JetBrains Mono', ui-monospace, monospace;
  font-size: 13px;
  color: var(--text-2);
  overflow-wrap: anywhere;
  word-break: normal;
}
.greeting p .greeting-sep { color: var(--border-strong); margin: 0 4px; }
.greeting p .greeting-meta { color: var(--muted); }
@media (max-width: 480px) {
  .greeting p .greeting-sep { display: none; }
  .greeting p .greeting-email { display: block; }
  .greeting p .greeting-meta { display: block; margin-top: 2px; }
}

.badge {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 5px 12px; border-radius: 999px;
  font-size: 12px; font-weight: 600; letter-spacing: .02em;
}
.badge.free { background: var(--surface-2); border: 1px solid var(--border); color: var(--muted); }
.badge.pro { background: var(--grad-pro); color: white; box-shadow: 0 4px 14px rgba(20,184,166,.3); }

/* ──── UPGRADE / PRO BANNER (glassmorphism on dark gradient) ──── */
.upgrade {
  margin: 20px 0 32px;
  background:
    linear-gradient(180deg, rgba(255,255,255,.04) 0%, rgba(255,255,255,0) 50%),
    linear-gradient(135deg, #0a0e1a 0%, #1e293b 50%, #1e1b4b 100%);
  color: #fff;
  border-radius: 24px;                                           /* rounded-3xl */
  padding: 28px 28px;                                            /* 8px grid */
  display: flex; justify-content: space-between; align-items: center;
  flex-wrap: wrap; gap: 20px;
  position: relative; overflow: hidden;
  /* Glass + dimensional shadow stack */
  box-shadow:
    inset 0 1px 0 rgba(255,255,255,.10),
    inset 0 0 0 1px rgba(255,255,255,.04),
    0 24px 48px -16px rgba(15,23,42,.40),
    0 8px 16px rgba(15,23,42,.16);
  backdrop-filter: blur(24px) saturate(180%);
  -webkit-backdrop-filter: blur(24px) saturate(180%);
}
@media (max-width: 720px) {
  .upgrade { padding: 22px 22px; flex-direction: column; align-items: stretch; gap: 16px; }
  .upgrade-actions { flex-direction: column; gap: 8px; }
  .upgrade-actions .btn-up, .upgrade-actions .btn-up-ghost { width: 100%; justify-content: center; padding: 12px 18px; }
}
.upgrade::before {
  content: ''; position: absolute; right: -80px; top: -80px;
  width: 260px; height: 260px; border-radius: 50%;
  background: radial-gradient(circle, rgba(34,211,238,.34), transparent 70%);
  pointer-events: none;
}
.upgrade.pro-active {
  background: linear-gradient(135deg, #f8fafc 0%, #fff 100%);
  color: var(--text);
  border: 1px solid var(--border);
  box-shadow: var(--shadow-xs);
}
.upgrade.pro-active::before {
  background: radial-gradient(circle, rgba(34,197,94,.12), transparent 70%);
}
.upgrade-text { position: relative; z-index: 1; min-width: 0; flex: 1; }
.upgrade-text h3 { margin: 0 0 6px; font-size: 18px; font-weight: 700; letter-spacing: -.015em; line-height: 1.3; display: flex; align-items: center; gap: 8px; }
.upgrade-text h3 .pro-pill { padding: 2px 8px; background: rgba(255,255,255,.15); border-radius: 999px; font-size: 11px; font-weight: 700; letter-spacing: .04em; text-transform: uppercase; }
.upgrade.pro-active .upgrade-text h3 .pro-pill { background: var(--ok); color: #fff; }
.upgrade-text p {
  margin: 0; color: rgba(255,255,255,.80);
  font-size: clamp(14px, 2.8vw, 16px);
  line-height: 1.55;                                /* user-spec exact 1.55 */
  overflow-wrap: anywhere; word-break: normal;
  text-wrap: pretty;
  hyphens: auto;
}
.upgrade.pro-active .upgrade-text p { color: var(--text-2); }
.upgrade-text .upgrade-feats { list-style: none; padding: 0; margin: 12px 0 0; display: flex; flex-wrap: wrap; gap: 6px 18px; font-size: 13px; color: rgba(255,255,255,.85); }
.upgrade-text .upgrade-feats li { display: inline-flex; align-items: center; gap: 6px; }
.upgrade-text .upgrade-feats svg { width: 13px; height: 13px; color: #60a5fa; flex-shrink: 0; }
.btn-up {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 12px 22px;
  background: #fff; color: var(--text);
  border-radius: 24px;                   /* rounded-3xl per spec */
  font-weight: 600; font-size: 14.5px;
  transition: transform 200ms cubic-bezier(.4,0,.2,1), box-shadow 200ms cubic-bezier(.4,0,.2,1), filter 200ms cubic-bezier(.4,0,.2,1);
  white-space: nowrap;
  position: relative; z-index: 1;
  box-shadow: inset 0 1px 0 rgba(255,255,255,.6), 0 4px 14px rgba(0,0,0,.18);
}
.btn-up:hover {
  transform: translateY(-1px) scale(1.02);
  color: var(--text);
  box-shadow: inset 0 1px 0 rgba(255,255,255,.6), 0 12px 24px rgba(0,0,0,.24), 0 0 0 4px rgba(255,255,255,.10);
  filter: brightness(1.04);
}
.btn-up:active { transform: translateY(0) scale(.98); filter: brightness(.96); }
.upgrade.pro-active .btn-up { background: var(--text); color: #fff; }
.upgrade.pro-active .btn-up:hover { color: #fff; background: #1e2939; }
.upgrade-actions { display: flex; gap: 10px; flex-shrink: 0; flex-wrap: wrap; }
.btn-up-ghost {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 11px 18px;
  background: transparent; color: rgba(255,255,255,.85);
  border: 1px solid rgba(255,255,255,.18);
  border-radius: var(--r-sm);
  font-weight: 600; font-size: 14px;
  transition: background 140ms, border-color 140ms, color 140ms;
  white-space: nowrap;
}
.btn-up-ghost:hover { background: rgba(255,255,255,.08); border-color: rgba(255,255,255,.3); color: #fff; }
.upgrade.pro-active .btn-up-ghost { color: var(--text-2); border-color: var(--border); }
.upgrade.pro-active .btn-up-ghost:hover { background: var(--surface-2); color: var(--text); border-color: var(--border-strong); }

/* ──── STAT CARDS ──── */
.stats { display: grid; gap: 14px; grid-template-columns: 1fr; margin-bottom: 36px; }
@media (min-width: 600px) { .stats { grid-template-columns: repeat(3, 1fr); } }
.stat {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 16px;                                           /* rounded-2xl per spec */
  padding: 24px;                                                  /* min 24px per spec */
  /* User-spec shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1) + glass inset */
  box-shadow:
    inset 0 1px 0 rgba(255,255,255,.5),
    0 10px 15px -3px rgba(15,23,42,.10),
    0 4px 6px -2px rgba(15,23,42,.05);
  transition: border-color 200ms cubic-bezier(.4,0,.2,1),
              transform 200ms cubic-bezier(.4,0,.2,1),
              box-shadow 200ms cubic-bezier(.4,0,.2,1);
  position: relative;
  overflow: hidden;
}
.stat::before {
  content: ''; position: absolute; left: 0; right: 0; top: 0; height: 1px;
  background: linear-gradient(90deg, transparent, rgba(20,184,166,.20), transparent);
  opacity: 0; transition: opacity var(--t-fast);
}
.stat:hover {
  border-color: var(--border-strong);
  transform: translateY(-4px);                                   /* user-spec -4px */
  box-shadow:
    inset 0 1px 0 rgba(255,255,255,.6),
    0 20px 32px -10px rgba(20,184,166,.20),
    0 8px 16px -4px rgba(20,184,166,.10);
}
.stat:hover::before { opacity: 1; }
.stat .label { font-size: 11px; color: var(--muted); text-transform: uppercase; letter-spacing: .12em; font-weight: 600; margin: 0 0 12px; }
.stat .value {
  font-family: 'JetBrains Mono', ui-monospace, monospace;
  font-variant-numeric: tabular-nums;
  font-size: clamp(32px, 5vw, 40px);   /* up to 2.5rem on desktop */
  font-weight: 600;
  letter-spacing: -.035em;
  color: var(--text); line-height: 1.05;
}
.stat .delta { font-size: 12.5px; color: var(--muted); margin-top: 10px; line-height: 1.5; overflow-wrap: anywhere; word-break: normal; }

/* ──── SECTION ──── */
.section { margin: 40px 0; }                                     /* 8px grid: 32→40 (section gap user-spec 40+) */
.section-head { display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 16px; gap: 16px; flex-wrap: wrap; }
.section-head h2 { font-size: 18px; font-weight: 600; letter-spacing: -.015em; margin: 0; }
.section-head .count { color: var(--muted); font-size: 13px; font-weight: 500; font-family: 'JetBrains Mono', ui-monospace, monospace; font-variant-numeric: tabular-nums; }

.card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 16px;                                           /* rounded-2xl */
  box-shadow:
    inset 0 1px 0 rgba(255,255,255,.5),
    0 1px 2px rgba(15,23,42,.05);
  overflow: hidden;
  transition: border-color 200ms cubic-bezier(.4,0,.2,1), box-shadow 200ms cubic-bezier(.4,0,.2,1);
}

/* ──── SERVICE LIST ──── */
.svc-list { list-style: none; margin: 0; padding: 0; }
.svc-list li {
  padding: 20px 24px;
  border-bottom: 1px solid var(--border);
  display: grid;
  gap: 12px 14px;
  grid-template-columns: auto 1fr auto;
  grid-template-areas:
    "logo name   status"
    "bar  bar    bar"
    "time time   actions";
  align-items: center;
  transition: background var(--t-fast);
  position: relative;
}
.svc-list li:hover { background: var(--surface-2); }
.svc-list li .svc-logo { grid-area: logo; flex-shrink: 0; }
.svc-list li .svc-name { grid-area: name; min-width: 0; }
.svc-list li .svc-status { grid-area: status; justify-self: end; }
.svc-list li .svc-bar-wrap { grid-area: bar; }
.svc-list li .svc-time { grid-area: time; font-size: 12px; }
.svc-list li .svc-actions { grid-area: actions; justify-self: end; opacity: 0; transition: opacity var(--t-fast); }
.svc-list li:hover .svc-actions, .svc-list li:focus-within .svc-actions { opacity: 1; }
@media (max-width: 600px) { .svc-list li .svc-actions { opacity: 1; } } /* always visible on touch */
@media (min-width: 720px) {
  .svc-list li {
    grid-template-columns: 32px 1.6fr 110px 1fr 100px 36px;
    grid-template-areas: none;
    padding: 20px 24px;
  }
  .svc-list li .svc-logo, .svc-list li .svc-name, .svc-list li .svc-status,
  .svc-list li .svc-bar-wrap, .svc-list li .svc-time, .svc-list li .svc-actions {
    grid-area: auto; justify-self: auto;
  }
  .svc-list li .svc-actions { justify-self: end; }
  .svc-list li .svc-time { font-size: 12.5px; }
}

/* Provider logo circle */
.svc-logo {
  width: 32px; height: 32px; border-radius: 9px;
  display: inline-flex; align-items: center; justify-content: center;
  font-size: 12px; font-weight: 700; letter-spacing: -.02em;
  color: #fff; flex-shrink: 0;
  box-shadow: inset 0 1px 0 rgba(255,255,255,.18), 0 1px 0 rgba(15,23,42,.06);
}
.svc-logo.cloudflare  { background: linear-gradient(135deg,#f6821f,#fbad41); }
.svc-logo.github      { background: linear-gradient(135deg,#0f172a,#334155); }
.svc-logo.vercel      { background: linear-gradient(135deg,#0a0e1a,#1e293b); }
.svc-logo.supabase    { background: linear-gradient(135deg,#10b981,#34d399); }
.svc-logo.resend      { background: linear-gradient(135deg,#0a0e1a,#374151); }
.svc-logo.neon        { background: linear-gradient(135deg,#22d3ee,#60a5fa); }
.svc-logo.r2          { background: linear-gradient(135deg,#f59e0b,#f97316); }

/* Service action button (delete) */
.svc-actions .btn-icon {
  width: 32px; height: 32px;
  display: inline-flex; align-items: center; justify-content: center;
  background: transparent; border: 1px solid transparent;
  border-radius: 8px;
  color: var(--muted); cursor: pointer;
  transition: background var(--t-fast), color var(--t-fast), border-color var(--t-fast);
}
.svc-actions .btn-icon:hover, .svc-actions .btn-icon:focus-visible {
  background: rgba(244,63,94,.10); color: var(--err); border-color: rgba(244,63,94,.18);
}
.svc-actions .btn-icon svg { width: 14px; height: 14px; }
.svc-list li:last-child { border-bottom: 0; }
.svc-name { font-weight: 600; font-size: 14.5px; }
.svc-name small { display: block; color: var(--muted); font-size: 12px; font-weight: 500; margin-top: 2px; text-transform: uppercase; letter-spacing: .04em; }
.svc-status { display: flex; gap: 6px; align-items: center; }
.status-pill {
  padding: 3px 10px; border-radius: 9999px;
  font-size: 10.5px; font-weight: 600;
  text-transform: uppercase; letter-spacing: .06em;
  display: inline-flex; align-items: center; gap: 5px;
  /* Soft glow uses currentColor — single source of truth per status. */
  box-shadow: 0 0 8px color-mix(in srgb, currentColor 30%, transparent),
              0 0 0 1px color-mix(in srgb, currentColor 22%, transparent);
}
.status-pill::before { content: ''; width: 5px; height: 5px; border-radius: 50%; background: currentColor; flex-shrink: 0; }
.status-pill.ok       { background: color-mix(in srgb, #10b981 12%, transparent); color: #047857; }
.status-pill.warn     { background: color-mix(in srgb, #f59e0b 14%, transparent); color: #b45309; }
.status-pill.err, .status-pill.critical {
  background: color-mix(in srgb, #f43f5e 14%, transparent); color: #be123c;
  animation: pill-pulse-err 1.5s ease-in-out infinite;
}
@keyframes pill-pulse-err {
  0%, 100% { box-shadow: 0 0 8px  color-mix(in srgb, currentColor 30%, transparent), 0 0 0 1px color-mix(in srgb, currentColor 28%, transparent); }
  50%      { box-shadow: 0 0 16px color-mix(in srgb, currentColor 50%, transparent), 0 0 0 1px color-mix(in srgb, currentColor 45%, transparent); }
}
.status-pill.pending {
  background: var(--surface-2); color: var(--muted);
  box-shadow: 0 0 0 1px var(--border);  /* no glow for pending */
}
.svc-bar-wrap { display: flex; align-items: center; gap: 12px; }
.svc-bar {
  flex: 1; height: 8px; min-width: 100px;
  background: var(--surface-2);
  border-radius: 999px;
  overflow: hidden;
  position: relative;
  box-shadow: inset 0 1px 2px rgba(15,23,42,.05);
}
.svc-bar > span {
  display: block; height: 100%;
  background: linear-gradient(90deg, var(--primary) 0%, var(--primary-2) 100%);
  border-radius: 999px;
  transition: width 540ms cubic-bezier(.4,0,.2,1);
  box-shadow: 0 0 8px rgba(20,184,166,.35);
  position: relative;
}
.svc-bar > span::after {
  content: ''; position: absolute; right: 0; top: 0; bottom: 0;
  width: 12px;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,.4));
  border-radius: 0 999px 999px 0;
}
.svc-bar.warn > span {
  background: linear-gradient(90deg, #f59e0b 0%, #fb923c 100%);
  box-shadow: 0 0 10px rgba(245,158,11,.45);
}
.svc-bar.crit > span {
  background: linear-gradient(90deg, #f43f5e 0%, #ef4444 100%);
  box-shadow: 0 0 12px rgba(244,63,94,.50);
  animation: bar-pulse-crit 2.4s ease-in-out infinite;
}
@keyframes bar-pulse-crit {
  0%, 100% { box-shadow: 0 0 8px rgba(244,63,94,.40); }
  50%      { box-shadow: 0 0 18px rgba(244,63,94,.65); }
}
.svc-bar-pct {
  font-size: 13px; font-weight: 600; color: var(--text);
  min-width: 48px; text-align: right;
  font-family: 'JetBrains Mono', ui-monospace, monospace;
  font-variant-numeric: tabular-nums;
  flex-shrink: 0;
}
.svc-bar-pct.warn { color: var(--warn); }
.svc-bar-pct.crit { color: var(--err); }
.svc-time {
  font-size: 12.5px;
  color: var(--muted);
  font-family: 'JetBrains Mono', ui-monospace, monospace;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* ──── EMPTY STATE ──── */
.empty {
  padding: 64px 24px 56px;          /* 8px grid + extra top breathing */
  text-align: center;
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 240px;
}
.empty-illu {
  width: 160px; height: 120px;
  margin: 0 auto 28px;
  position: relative;
  display: block;
}
.empty-illu svg { display: block; width: 100%; height: 100%; }
@keyframes empty-float-1 { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-4px); } }
@keyframes empty-float-2 { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-6px); } }
@keyframes empty-float-3 { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-3px); } }
@keyframes empty-pulse-ring {
  0%   { opacity: .9; transform: scale(.6); }
  80%  { opacity: 0;  transform: scale(1.6); }
  100% { opacity: 0;  transform: scale(1.6); }
}
.empty-illu .float-1 { animation: empty-float-1 3.6s ease-in-out infinite; transform-origin: center; }
.empty-illu .float-2 { animation: empty-float-2 4.2s ease-in-out infinite .3s; transform-origin: center; }
.empty-illu .float-3 { animation: empty-float-3 3.0s ease-in-out infinite .6s; transform-origin: center; }
.empty-illu .ring-1 { animation: empty-pulse-ring 2.8s ease-out infinite; transform-origin: 80px 60px; transform-box: fill-box; }
.empty-illu .ring-2 { animation: empty-pulse-ring 2.8s ease-out infinite 1s; transform-origin: 80px 60px; transform-box: fill-box; }
@media (prefers-reduced-motion: reduce) {
  .empty-illu .float-1, .empty-illu .float-2, .empty-illu .float-3,
  .empty-illu .ring-1, .empty-illu .ring-2 { animation: none; }
}
.empty h3 { font-size: 18px; font-weight: 600; margin: 0 0 10px; letter-spacing: -.01em; color: var(--text); }
.empty p { margin: 0 auto; color: var(--text-2); font-size: 14.5px; line-height: 1.7; max-width: 380px; overflow-wrap: anywhere; word-break: normal; }

/* ──── ADD FORM ──── */
.add-form {
  background: var(--surface-2);
  border-top: 1px solid var(--border);
  padding: 24px;
}
@media (max-width: 600px) { .add-form { padding: 20px 18px; } }
.add-form-grid {
  display: grid;
  gap: 14px;
  grid-template-columns: 1fr;
  align-items: end;
}
@media (min-width: 720px) {
  .add-form.svc-form .add-form-grid { grid-template-columns: 1.5fr 1fr 2fr 0.7fr auto; gap: 12px; }
  .add-form.alert-form .add-form-grid { grid-template-columns: 1fr 3fr auto; gap: 12px; }
}
.add-form .field {
  position: relative;
  min-width: 0;
}
.add-form input, .add-form select {
  padding: 22px 14px 8px;
  font-size: 16px; /* ≥16px iOS Safari no-zoom */
  font-family: inherit;
  border: 1px solid var(--border-strong);
  border-radius: 10px;
  background: var(--surface);
  color: var(--text);
  outline: none;
  width: 100%;
  min-width: 0;
  height: 52px;
  transition: border-color 200ms cubic-bezier(.4,0,.2,1), box-shadow 200ms cubic-bezier(.4,0,.2,1), background 200ms cubic-bezier(.4,0,.2,1);
  text-overflow: ellipsis;
  white-space: nowrap;
  overflow: hidden;
}
.add-form select {
  /* Custom chevron — preserves room for full provider name (Cloudflare not "Clo...") */
  appearance: none;
  -webkit-appearance: none;
  -moz-appearance: none;
  padding-right: 36px;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2364748b' stroke-width='2.25' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 14px center;
  background-size: 12px;
}
.add-form input::placeholder { color: transparent; }
.add-form input:focus::placeholder { color: var(--muted); }
@media (min-width: 720px) {
  .add-form input, .add-form select { font-size: 14px; padding: 20px 13px 6px; height: 48px; }
}
.add-form input:focus, .add-form select:focus {
  border-color: var(--primary);
  box-shadow: 0 0 0 4px rgba(20,184,166,.12);
  background: var(--surface);
}
.add-form input:hover, .add-form select:hover {
  border-color: color-mix(in srgb, var(--primary) 35%, var(--border-strong));
}

/* Floating label — label sits inside input when empty, lifts to top on focus or fill */
.add-form .field label {
  position: absolute;
  left: 14px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 14.5px;
  font-weight: 500;
  color: var(--muted);
  pointer-events: none;
  transition: top var(--t-fast), font-size var(--t-fast), color var(--t-fast), transform var(--t-fast);
  background: transparent;
  padding: 0;
  letter-spacing: 0;
  text-transform: none;
}
@media (min-width: 720px) { .add-form .field label { left: 13px; font-size: 13.5px; } }
.add-form .field input:focus + label,
.add-form .field input:not(:placeholder-shown) + label,
.add-form .field select + label {
  top: 10px;
  transform: translateY(0);
  font-size: 10.5px;
  font-weight: 600;
  color: var(--text-2);
  letter-spacing: .06em;
  text-transform: uppercase;
}
.add-form .field input:focus + label,
.add-form .field select:focus + label { color: var(--primary); }
@media (min-width: 720px) {
  .add-form .field input:focus + label,
  .add-form .field input:not(:placeholder-shown) + label,
  .add-form .field select + label {
    top: 8px; font-size: 10px;
  }
}
.add-form .field.no-label { /* button slot — no label needed */ }
.add-form .field.no-label > button { height: 52px; }
@media (min-width: 720px) { .add-form .field.no-label > button { height: 48px; } }

/* Error state — :user-invalid only triggers after user interaction (Chrome 119+, Firefox 88+) */
.add-form .field input:user-invalid,
.add-form .field select:user-invalid {
  border-color: var(--err);
  box-shadow: 0 0 0 4px rgba(244,63,94,.10);
}
.add-form .field input:user-invalid + label,
.add-form .field select:user-invalid ~ label {
  color: var(--err);
}
.add-form .field .err-msg {
  display: none;
  position: absolute; left: 14px; bottom: -20px;
  font-size: 11.5px; color: var(--err); font-weight: 500;
}
.add-form .field input:user-invalid ~ .err-msg,
.add-form .field select:user-invalid ~ .err-msg { display: block; }
@supports not selector(:user-invalid) {
  /* Safari 16-, fallback uses :invalid which fires on initial render too — only style when input touched */
  .add-form .field input:invalid:not(:placeholder-shown) {
    border-color: var(--err);
    box-shadow: 0 0 0 4px rgba(244,63,94,.10);
  }
}
.add-form button {
  padding: 12px 22px;
  font-size: 14px; font-weight: 600;
  letter-spacing: -.005em;
  background: linear-gradient(180deg, #1f2937 0%, var(--text) 100%);
  color: white;
  border: 0; border-radius: 24px;          /* rounded-3xl — user-spec exact (Add button big lift) */
  white-space: nowrap;
  cursor: pointer;
  box-shadow:
    inset 0 1px 0 rgba(255,255,255,.18),
    0 1px 2px rgba(15,23,42,.08),
    0 0 0 0 rgba(20,184,166,0);             /* prepared for hover glow */
  transition: transform 200ms cubic-bezier(.4,0,.2,1), box-shadow 200ms cubic-bezier(.4,0,.2,1), filter 200ms cubic-bezier(.4,0,.2,1);
}
.add-form button:hover {
  transform: translateY(-1px) scale(1.02);
  filter: brightness(1.10);
  box-shadow:
    inset 0 1px 0 rgba(255,255,255,.18),
    0 12px 24px rgba(15,23,42,.22),
    0 0 0 4px rgba(20,184,166,.15),               /* teal glow on hover (user-spec) */
    0 0 24px rgba(20,184,166,.25);
}
.add-form button:active { transform: translateY(0) scale(0.98); filter: brightness(.95); }
.add-form button:disabled { opacity: .65; cursor: not-allowed; transform: none; filter: none; box-shadow: inset 0 1px 0 rgba(255,255,255,.18), 0 1px 2px rgba(15,23,42,.08); }
.add-form button.is-loading { pointer-events: none; }
.add-form button.is-loading::before {
  content: ''; display: inline-block;
  width: 12px; height: 12px;
  border: 2px solid rgba(255,255,255,.3);
  border-top-color: #fff;
  border-radius: 50%;
  animation: btn-spin .7s linear infinite;
  margin-right: 8px;
  vertical-align: -2px;
}
@keyframes btn-spin { to { transform: rotate(360deg); } }
@media (prefers-reduced-motion: reduce) {
  .add-form button.is-loading::before { animation: none; border-top-color: rgba(255,255,255,.7); }
}

/* Inline action button (Check now / Send test alert) — same loading semantics */
.btn-inline {
  padding: 8px 14px;
  font-size: 13px; font-weight: 600;
  background: var(--surface); color: var(--text);
  border: 1px solid var(--border-strong);
  border-radius: 10px; cursor: pointer;
  font-family: inherit;
  transition: border-color 200ms cubic-bezier(.4,0,.2,1), background 200ms cubic-bezier(.4,0,.2,1), transform 200ms cubic-bezier(.4,0,.2,1);
  display: inline-flex; align-items: center; gap: 6px;
}
.btn-inline:hover { border-color: var(--text-2); background: var(--surface-2); transform: translateY(-1px); }
.btn-inline:active { transform: translateY(0); }
.btn-inline:disabled { opacity: .55; cursor: not-allowed; transform: none; }
.btn-inline.is-loading::before {
  content: ''; display: inline-block;
  width: 11px; height: 11px;
  border: 2px solid var(--border-strong); border-top-color: var(--primary);
  border-radius: 50%; animation: btn-spin .7s linear infinite;
}

/* ──── ALERT LIST ──── */
.alert-list { list-style: none; margin: 0; padding: 0; }
.alert-list li {
  padding: 18px 24px;
  border-bottom: 1px solid var(--border);
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 14px;
  flex-wrap: wrap;
  gap: 10px;
  transition: background var(--t-fast);
}
.alert-list li:hover { background: var(--surface-2); }
.alert-list li:last-child { border-bottom: 0; }
.alert-kind {
  font-weight: 600; text-transform: capitalize;
  display: inline-flex; align-items: center; gap: 8px;
}
.alert-kind::before {
  content: ''; width: 8px; height: 8px; border-radius: 50%; background: var(--ok);
}
.alert-target {
  color: var(--muted);
  font-family: 'JetBrains Mono', ui-monospace, monospace;
  font-size: 12.5px;
  overflow-wrap: anywhere;
  word-break: break-all;     /* mono URLs/emails — break-all OK (no natural word breaks) */
  min-width: 0;
}

/* ──── HAMBURGER (MOBILE) ──── */
.hamburger {
  display: none;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 8px;
  cursor: pointer;
  align-items: center; justify-content: center;
  transition: border-color var(--t-fast), background var(--t-fast);
  flex-shrink: 0;
}
.hamburger:hover { border-color: var(--border-strong); }
.hamburger svg { width: 20px; height: 20px; color: var(--text); display: block; }
@media (max-width: 879px) { .hamburger { display: inline-flex; } }

/* Mobile slide-in menu (replaces sidebar at <880px) */
.mobile-menu {
  position: fixed; inset: 0;
  background: color-mix(in srgb, var(--bg) 84%, transparent);
  backdrop-filter: blur(20px) saturate(180%);
  -webkit-backdrop-filter: blur(20px) saturate(180%);
  z-index: 100;
  display: flex; flex-direction: column;
  padding: 24px 22px calc(24px + env(safe-area-inset-bottom));
  opacity: 0; pointer-events: none;
  transition: opacity 220ms cubic-bezier(.4,0,.2,1);
}
.mobile-menu[aria-hidden="false"] { opacity: 1; pointer-events: auto; }
.mobile-menu .mm-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 28px; }
.mobile-menu .mm-close {
  background: var(--surface); border: 1px solid var(--border);
  border-radius: 10px; padding: 8px; cursor: pointer;
  display: inline-flex; align-items: center; justify-content: center;
  transition: border-color var(--t-fast);
}
.mobile-menu .mm-close:hover { border-color: var(--border-strong); }
.mobile-menu .mm-close svg { width: 20px; height: 20px; color: var(--text); display: block; }
.mobile-menu .mm-section { font-size: 11px; text-transform: uppercase; letter-spacing: .12em; font-weight: 600; color: var(--muted); margin: 18px 4px 8px; }
.mobile-menu .mm-link {
  display: flex; align-items: center; gap: 12px;
  padding: 12px 14px; border-radius: 10px;
  font-size: 15.5px; font-weight: 500; color: var(--text);
  transition: background var(--t-fast);
  text-decoration: none;
}
.mobile-menu .mm-link:hover, .mobile-menu .mm-link:focus-visible { background: var(--surface-2); }
.mobile-menu .mm-link.active { background: var(--primary-soft); color: var(--primary); }
.mobile-menu .mm-link svg { width: 20px; height: 20px; flex-shrink: 0; }
.mobile-menu .mm-link .mm-count { margin-left: auto; font-size: 13px; color: var(--muted); font-family: 'JetBrains Mono', ui-monospace, monospace; }
.mobile-menu .mm-foot { margin-top: auto; padding: 18px 14px 0; border-top: 1px solid var(--border); }
.mobile-menu .mm-user { font-size: 14px; }
.mobile-menu .mm-user .em { color: var(--text); font-weight: 500; overflow-wrap: anywhere; word-break: normal; }
.mobile-menu .mm-user .pl { color: var(--muted); margin-top: 4px; font-size: 13px; }
@media (min-width: 880px) { .mobile-menu { display: none; } }

/* Lock body scroll when menu open */
body.menu-open { overflow: hidden; }

/* ──── BOTTOM NAV (MOBILE) ──── */
.bottom-nav {
  position: fixed; bottom: 0; left: 0; right: 0;
  background: rgba(244,247,252,.92);
  backdrop-filter: saturate(180%) blur(12px);
  border-top: 1px solid var(--border);
  display: flex; justify-content: space-around;
  padding: 8px 0 calc(8px + env(safe-area-inset-bottom));
  z-index: 40;
}
@media (min-width: 880px) { .bottom-nav { display: none; } }
.bottom-nav a {
  flex: 1;
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  gap: 4px;
  padding: 8px 8px;
  min-height: 56px;                /* tap target ≥48px Apple HIG, with breathing room */
  font-size: 11px; font-weight: 500; color: var(--muted);
  text-decoration: none;
  transition: color 200ms cubic-bezier(.4,0,.2,1);
  -webkit-tap-highlight-color: transparent;
}
.bottom-nav a:hover, .bottom-nav a:focus-visible { color: var(--text); }
.bottom-nav a.active { color: var(--primary); }
.bottom-nav a.active::before {
  content: ''; position: absolute; top: 0; height: 2px; width: 24px;
  background: var(--primary); border-radius: 0 0 2px 2px;
}
.bottom-nav a { position: relative; }
.bottom-nav svg { width: 22px; height: 22px; display: block; flex-shrink: 0; }

/* ──── HELPERS ──── */
.muted { color: var(--muted); }
.mt-0 { margin-top: 0; }
`;

const ICONS = {
  home: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.25" stroke-linecap="round" stroke-linejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg>',
  bell: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.25" stroke-linecap="round" stroke-linejoin="round"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>',
  cloud: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.25" stroke-linecap="round" stroke-linejoin="round"><path d="M17.5 19a4.5 4.5 0 1 0-3-7.9A6 6 0 0 0 3 12a4 4 0 0 0 4 4h10.5z"/></svg>',
  settings: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.25" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/></svg>',
  zap: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.25" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>',
  plus: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.25" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>',
  menu: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.25" stroke-linecap="round" stroke-linejoin="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>',
  close: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.25" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>',
  logout: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.25" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>',
  chevronLeft: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.25" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>',
  trash: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.25" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>',
};

// Empty-state illustrations — inline SVG (no external assets, animation-friendly)
const ILLU_NO_SERVICES = `<svg viewBox="0 0 160 120" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
  <defs>
    <linearGradient id="cloud-grad" x1="0" x2="0" y1="0" y2="1">
      <stop offset="0" stop-color="#eef0ff"/>
      <stop offset="1" stop-color="#dde3ee"/>
    </linearGradient>
    <linearGradient id="brand-grad" x1="0" x2="1" y1="0" y2="1">
      <stop offset="0" stop-color="#14b8a6"/>
      <stop offset="1" stop-color="#22d3ee"/>
    </linearGradient>
    <filter id="soft-shadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="2" stdDeviation="3" flood-color="#14b8a6" flood-opacity=".18"/>
    </filter>
  </defs>
  <!-- Dotted base line -->
  <line x1="20" y1="100" x2="140" y2="100" stroke="#dde3ee" stroke-width="1.25" stroke-dasharray="2 4" stroke-linecap="round"/>
  <!-- Big cloud center -->
  <g class="float-1" filter="url(#soft-shadow)">
    <path d="M50 70 a18 18 0 0 1 36-2 a14 14 0 0 1 22 14 H50 a14 14 0 0 1 0-12 z"
          fill="url(#cloud-grad)" stroke="url(#brand-grad)" stroke-width="1.5"/>
    <circle cx="62" cy="66" r="2" fill="#14b8a6" opacity=".55"/>
    <circle cx="74" cy="66" r="2" fill="#14b8a6" opacity=".55"/>
    <circle cx="86" cy="66" r="2" fill="#14b8a6" opacity=".55"/>
  </g>
  <!-- Floating provider chips around the cloud -->
  <g class="float-2">
    <rect x="18" y="32" width="28" height="20" rx="6" fill="#fff" stroke="#dde3ee" stroke-width="1.25"/>
    <circle cx="26" cy="42" r="3" fill="#f38020"/>
    <rect x="32" y="40" width="10" height="2" rx="1" fill="#dde3ee"/>
    <rect x="32" y="44" width="7" height="2" rx="1" fill="#eef2fa"/>
  </g>
  <g class="float-3">
    <rect x="116" y="28" width="28" height="20" rx="6" fill="#fff" stroke="#dde3ee" stroke-width="1.25"/>
    <circle cx="124" cy="38" r="3" fill="#0a0e1a"/>
    <rect x="130" y="36" width="10" height="2" rx="1" fill="#dde3ee"/>
    <rect x="130" y="40" width="7" height="2" rx="1" fill="#eef2fa"/>
  </g>
  <g class="float-2">
    <rect x="120" y="58" width="28" height="20" rx="6" fill="#fff" stroke="#dde3ee" stroke-width="1.25"/>
    <circle cx="128" cy="68" r="3" fill="#22d3ee"/>
    <rect x="134" y="66" width="10" height="2" rx="1" fill="#dde3ee"/>
    <rect x="134" y="70" width="7" height="2" rx="1" fill="#eef2fa"/>
  </g>
  <!-- Subtle plus icon at top-left -->
  <g class="float-3" opacity=".7">
    <circle cx="24" cy="22" r="6" fill="#ccfbf1" stroke="#14b8a6" stroke-width="1.25" stroke-dasharray="2 1.5"/>
    <line x1="24" y1="19" x2="24" y2="25" stroke="#14b8a6" stroke-width="1.5" stroke-linecap="round"/>
    <line x1="21" y1="22" x2="27" y2="22" stroke="#14b8a6" stroke-width="1.5" stroke-linecap="round"/>
  </g>
</svg>`;

const ILLU_NO_ALERTS = `<svg viewBox="0 0 160 120" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
  <defs>
    <linearGradient id="bell-grad" x1="0" x2="0" y1="0" y2="1">
      <stop offset="0" stop-color="#eef0ff"/>
      <stop offset="1" stop-color="#dde3ee"/>
    </linearGradient>
    <linearGradient id="bell-stroke" x1="0" x2="1" y1="0" y2="1">
      <stop offset="0" stop-color="#14b8a6"/>
      <stop offset="1" stop-color="#22d3ee"/>
    </linearGradient>
    <filter id="bell-shadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="2" stdDeviation="3" flood-color="#14b8a6" flood-opacity=".20"/>
    </filter>
  </defs>
  <!-- Dotted base -->
  <line x1="20" y1="100" x2="140" y2="100" stroke="#dde3ee" stroke-width="1.25" stroke-dasharray="2 4" stroke-linecap="round"/>
  <!-- Pulse rings -->
  <circle class="ring-1" cx="80" cy="60" r="20" fill="none" stroke="#14b8a6" stroke-width="1.25" opacity=".5"/>
  <circle class="ring-2" cx="80" cy="60" r="20" fill="none" stroke="#14b8a6" stroke-width="1.25" opacity=".4"/>
  <!-- Bell -->
  <g class="float-1" filter="url(#bell-shadow)">
    <path d="M80 38 a4 4 0 0 1 4 4 v2 c8 1 14 8 14 16 v8 l4 6 H58 l4-6 v-8 c0-8 6-15 14-16 v-2 a4 4 0 0 1 4-4z"
          fill="url(#bell-grad)" stroke="url(#bell-stroke)" stroke-width="1.5" stroke-linejoin="round"/>
    <path d="M76 78 a4 4 0 0 0 8 0" fill="none" stroke="url(#bell-stroke)" stroke-width="1.5" stroke-linecap="round"/>
  </g>
  <!-- Floating notification chips -->
  <g class="float-2" opacity=".85">
    <rect x="22" y="32" width="34" height="14" rx="4" fill="#fff" stroke="#dde3ee" stroke-width="1.25"/>
    <circle cx="29" cy="39" r="2" fill="#10b981"/>
    <rect x="34" y="37" width="18" height="1.5" rx=".75" fill="#dde3ee"/>
    <rect x="34" y="40.5" width="12" height="1.5" rx=".75" fill="#eef2fa"/>
  </g>
  <g class="float-3" opacity=".85">
    <rect x="106" y="34" width="34" height="14" rx="4" fill="#fff" stroke="#dde3ee" stroke-width="1.25"/>
    <circle cx="113" cy="41" r="2" fill="#f59e0b"/>
    <rect x="118" y="39" width="18" height="1.5" rx=".75" fill="#dde3ee"/>
    <rect x="118" y="42.5" width="12" height="1.5" rx=".75" fill="#eef2fa"/>
  </g>
</svg>`;

export async function handleDash(req: Request, env: Env): Promise<Response> {
  const user = await getUserFromCookie(req, env);
  if (!user) return new Response(null, { status: 302, headers: { location: "/" } });

  // Polar checkout success redirect handler — show confirmation banner.
  // Webhook will flip user.plan = 'pro' independently; this is just UX feedback.
  const url = new URL(req.url);
  const upgradeStatus = url.searchParams.get("upgrade");
  const checkoutId = url.searchParams.get("checkout_id");

  const services = await env.DB.prepare(
    "SELECT id, kind, label, threshold_pct, last_check, last_usage_pct, last_status FROM services WHERE user_id = ? ORDER BY created_at"
  ).bind(user.id).all();

  const channels = await env.DB.prepare(
    "SELECT id, kind, target FROM alert_channels WHERE user_id = ? AND enabled = 1"
  ).bind(user.id).all();

  const svcCount = (services.results || []).length;
  const chnCount = (channels.results || []).length;
  const okCount = ((services.results || []) as any[]).filter(s => (s.last_status || "pending") === "ok").length;

  const planBadge = user.plan === "pro"
    ? '<span class="badge pro">★ Pro</span>'
    : '<span class="badge free">Free plan</span>';

  // Pro upgrade / manage subscription — Polar (current) > Lemon Squeezy (legacy) > hidden.
  // Polar checkout URL preferred; LS_CHECKOUT_URL kept for backwards compatibility but unused post-5/7 rejection.
  const checkSvg = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>';
  const upgradeBlock = (() => {
    if (user.plan === "pro") {
      const portalEndpoint = env.POLAR_PORTAL_URL || "/api/billing/portal";
      return `<div class="upgrade pro-active">
        <div class="upgrade-text">
          <h3>You're on Pro <span class="pro-pill">Active</span></h3>
          <p>Unlimited services · hourly polling · all alert channels enabled. Subscription details and invoices are on your account page.</p>
          <ul class="upgrade-feats">
            <li>${checkSvg} Cancel anytime</li>
            <li>${checkSvg} Full refund within 7 days</li>
            <li>${checkSvg} Polar (Stripe Connect)</li>
          </ul>
        </div>
        <div class="upgrade-actions">
          <a href="${portalEndpoint}" target="_blank" rel="noopener" class="btn-up-ghost">Billing portal</a>
          <a href="/account" class="btn-up">Subscription details →</a>
        </div>
      </div>`;
    }

    if (env.POLAR_CHECKOUT_URL) {
      const params = new URLSearchParams({
        customer_email: user.email,
        "metadata[user_id]": String(user.id),
      });
      // shouldShowUpgradePrompt logic (billing/service.ts) — 한도 임박 강조
      const svcCount = (services.results || []).length;
      const quotaUrgent = svcCount >= 2;
      const headerCopy = quotaUrgent
        ? `You're on Free <span class="pro-pill">${svcCount}/3 services — 1 left</span>`
        : `You're on Free <span class="pro-pill">3 services · 12h polling</span>`;
      const subCopy = quotaUrgent
        ? `${svcCount}/3 services 사용 중 — 한 개 더 추가하면 한도 도달. 무제한 + hourly polling + Discord/Telegram alerts for $5/month.`
        : `Unlock unlimited services, hourly polling, and Discord + Telegram alerts for $5/month — less than one cup of coffee.`;
      return `<div class="upgrade">
        <div class="upgrade-text">
          <h3>${headerCopy}</h3>
          <p>${subCopy}</p>
          <ul class="upgrade-feats">
            <li>${checkSvg} Unlimited services</li>
            <li>${checkSvg} Hourly checks</li>
            <li>${checkSvg} 30-day history</li>
            <li>${checkSvg} Cancel anytime · 7-day refund</li>
          </ul>
          <div style="margin-top: 12px; padding: 8px 12px; background: rgba(245,158,11,0.1); border: 1px solid rgba(245,158,11,0.3); border-radius: 8px; font-size: 12px; color: #fbbf24;">
            🎟️ <strong>PH launch promo</strong>: code <code style="background: rgba(0,0,0,0.3); padding: 1px 5px; border-radius: 3px; font-family: ui-monospace, Menlo, monospace;">PHFREE6MO</code> — first 50 sign-ups get Pro free for 6 months.
          </div>
        </div>
        <div class="upgrade-actions">
          <a href="/account" class="btn-up-ghost">Compare plans</a>
          <a href="${env.POLAR_CHECKOUT_URL}?${params.toString()}" class="btn-up">Upgrade · $5/mo →</a>
        </div>
      </div>`;
    }
    return "";
  })();

  // Two-letter abbreviation for the provider chip (Cloudflare → CF, GitHub → GH).
  const providerAbbr = (kind: string): string => {
    const map: Record<string, string> = {
      cloudflare: "CF", github: "GH", vercel: "VR",
      supabase: "SB", resend: "RS", neon: "NE", r2: "R2",
    };
    return map[kind] || kind.slice(0, 2).toUpperCase();
  };

  const svcRows = ((services.results || []) as any[]).map(s => {
    const usage = typeof s.last_usage_pct === "number" ? s.last_usage_pct : null;
    const status = (s.last_status || "pending").toLowerCase();
    const barClass = status === "ok" ? "" : (status === "warning" || status === "warn" ? "warn" : (status === "critical" || status === "error" ? "crit" : ""));
    const barWidth = usage === null ? 0 : Math.min(100, Math.max(0, usage));
    const tsAttr = s.last_check ? ` data-ts="${s.last_check}"` : "";
    const tsText = s.last_check
      ? new Date(s.last_check * 1000).toISOString().slice(0, 16).replace("T", " ") + " UTC"
      : "Never";
    return `<li data-svc-id="${s.id}">
      <div class="svc-logo ${s.kind}" aria-hidden="true">${providerAbbr(s.kind)}</div>
      <div class="svc-name">${s.label}<small>${s.kind}</small></div>
      <div class="svc-status"><span class="status-pill ${status}">${status}</span></div>
      <div class="svc-bar-wrap">
        <div class="svc-bar ${barClass}"><span style="width:${barWidth}%"></span></div>
        <span class="svc-bar-pct ${barClass}">${usage === null ? "—" : usage + "%"}</span>
      </div>
      <time class="svc-time"${tsAttr}>${tsText}</time>
      <div class="svc-actions">
        <button type="button" class="btn-icon" data-svc-delete="${s.id}" aria-label="Delete ${s.label.replace(/"/g, "&quot;")}">${ICONS.trash}</button>
      </div>
    </li>`;
  }).join("");

  const chans = ((channels.results || []) as any[]).map(c =>
    `<li>
      <span class="alert-kind">${c.kind}</span>
      <span class="alert-target">${c.target}</span>
    </li>`
  ).join("");

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>Dashboard — FreeTier Sentinel</title>
<meta name="theme-color" content="#f6f8fc" media="(prefers-color-scheme: light)">
<meta name="theme-color" content="#0a0e1a" media="(prefers-color-scheme: dark)">
<meta name="color-scheme" content="light dark">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="preconnect" href="https://api.fontshare.com" crossorigin>
<link rel="preconnect" href="https://buy.polar.sh">
<link rel="preconnect" href="https://www.clarity.ms">
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
<link href="https://api.fontshare.com/v2/css?f[]=satoshi@500,600,700&display=swap" rel="stylesheet">
<style>${CSS}</style>
${analyticsHeads(env)}
</head>
<body>
<div class="app">

  <aside class="side">
    <a href="/" class="brand"><span class="brand-logo">F</span> <span class="brand-text">FreeTier Sentinel</span></a>
    <div class="side-section">Workspace</div>
    <a href="/dash" class="side-link active">${ICONS.home} <span class="label">Overview</span></a>
    <a href="#services" class="side-link">${ICONS.cloud} <span class="label">Services</span><span class="count">${svcCount}</span></a>
    <a href="#alerts" class="side-link">${ICONS.bell} <span class="label">Alerts</span><span class="count">${chnCount}</span></a>
    <div class="side-section">Account</div>
    <a href="/account" class="side-link">${ICONS.settings} <span class="label">Settings</span></a>
    <a href="/api/auth/logout" class="side-link">${ICONS.logout} <span class="label">Sign out</span></a>
    <a href="/account" class="side-foot" style="text-decoration:none;color:inherit">
      <div class="side-user" style="cursor:pointer;transition:background var(--t-fast);border-radius:8px">
        <div class="em">${user.email}</div>
        <div class="pl">${user.plan === "pro" ? "★ Pro plan" : "Free plan"} · Settings →</div>
      </div>
    </a>
    <button class="side-toggle" type="button" aria-label="Collapse sidebar" data-side-toggle>
      ${ICONS.chevronLeft}<span class="label">Collapse</span>
    </button>
  </aside>

  <main>
    <div class="topbar">
      <button class="hamburger" type="button" aria-label="Open menu" aria-expanded="false" aria-controls="mobile-menu">${ICONS.menu}</button>
      <a href="/" class="topbar-mobile-brand"><span class="brand-logo">F</span> FreeTier Sentinel</a>
      <div class="greeting">
        <h1>Welcome back</h1>
        <p><span class="greeting-email">${user.email}</span><span class="greeting-sep"> · </span><span class="greeting-meta">${svcCount} service${svcCount === 1 ? "" : "s"} monitored</span></p>
      </div>
      ${planBadge}
    </div>

    <div class="mobile-menu" id="mobile-menu" role="dialog" aria-modal="true" aria-label="Main menu" aria-hidden="true">
      <div class="mm-head">
        <a href="/" class="brand"><span class="brand-logo">F</span> FreeTier Sentinel</a>
        <button class="mm-close" type="button" aria-label="Close menu">${ICONS.close}</button>
      </div>
      <div class="mm-section">Workspace</div>
      <a href="/dash" class="mm-link active">${ICONS.home} <span>Overview</span></a>
      <a href="#services" class="mm-link" data-mm-close>${ICONS.cloud} <span>Services</span><span class="mm-count">${svcCount}</span></a>
      <a href="#alerts" class="mm-link" data-mm-close>${ICONS.bell} <span>Alerts</span><span class="mm-count">${chnCount}</span></a>
      <div class="mm-section">Account</div>
      <a href="/account" class="mm-link">${ICONS.settings} <span>Settings</span></a>
      <a href="/api/auth/logout" class="mm-link">${ICONS.logout} <span>Sign out</span></a>
      <div class="mm-foot">
        <div class="mm-user">
          <div class="em">${user.email}</div>
          <div class="pl">${user.plan === "pro" ? "★ Pro plan" : "Free plan"}</div>
        </div>
      </div>
    </div>

    ${upgradeStatus === "success" ? `
      <div style="background:var(--panel); border:1px solid var(--ok); border-radius:12px; padding:18px 22px; margin:0 0 20px 0; display:flex; align-items:center; gap:14px">
        <div style="font-size:24px">🎉</div>
        <div style="flex:1">
          <div style="font-weight:700; color:var(--ok); margin-bottom:4px; font-size:16px">Welcome to Pro</div>
          <div style="color:var(--text); font-size:14px; line-height:1.55">Your Pro plan is being activated. ${checkoutId ? `Order id: <code style="background:rgba(255,255,255,0.06);padding:1px 6px;border-radius:4px;color:var(--text-2);font-size:12px">${checkoutId.slice(0, 16)}...</code>. ` : ""}If the badge still shows Free, refresh in 30 seconds — webhooks usually arrive within a minute.</div>
        </div>
        <a href="/dash" style="color:var(--text-2); padding:6px 12px; border:1px solid var(--bd); border-radius:6px; text-decoration:none; font-size:13px">Dismiss</a>
      </div>
    ` : ""}
    ${upgradeBlock}

    <div class="stats">
      <div class="stat reveal">
        <p class="label">Services</p>
        <div class="value" data-count="${svcCount}">0</div>
        <div class="delta">${user.plan === "pro" ? "Unlimited on Pro" : `${svcCount}/3 on Free`}</div>
      </div>
      <div class="stat reveal">
        <p class="label">Healthy</p>
        <div class="value" data-count="${okCount}" style="color:var(--ok)">0</div>
        <div class="delta">${svcCount - okCount > 0 ? `${svcCount - okCount} need attention` : "All good"}</div>
      </div>
      <div class="stat reveal">
        <p class="label">Polling</p>
        <div class="value">${user.plan === "pro" ? "1h" : "12h"}</div>
        <div class="delta">${user.plan === "pro" ? "Hourly checks" : "Every 12 hours"}</div>
      </div>
    </div>

    ${(() => {
      const url = new URL(req.url);
      const checked = url.searchParams.get("checked");
      const alertSent = url.searchParams.get("alert_sent");
      if (checked !== null) {
        return `<div style="margin:0 0 18px;padding:12px 16px;background:#dcfce7;border:1px solid #86efac;border-radius:12px;color:#166534;font-size:14px">✓ Polled ${checked} service${checked === "1" ? "" : "s"} just now. Refresh to see updated usage.</div>`;
      }
      if (alertSent === "1") {
        return `<div style="margin:0 0 18px;padding:12px 16px;background:#dbeafe;border:1px solid #93c5fd;border-radius:12px;color:#1e3a8a;font-size:14px">✓ Test alert sent to ${user.email}. Check your inbox (and spam folder).</div>`;
      }
      return "";
    })()}

    <section class="section" id="services">
      <div class="section-head">
        <h2>Services</h2>
        <span style="display:flex;gap:10px;align-items:center">
          <span class="count">${svcCount} connected</span>
          ${svcCount > 0 ? `<form method="POST" action="/api/check-now" style="margin:0" data-loading><button type="submit" class="btn-inline" data-loading-label="Checking…">↻ Check now</button></form>` : ""}
        </span>
      </div>
      <div class="card">
        ${svcRows
          ? `<ul class="svc-list">${svcRows}</ul>`
          : `<div class="empty">
              <div class="empty-illu">${ILLU_NO_SERVICES}</div>
              <h3>No services yet</h3>
              <p>Connect your first SaaS below — Cloudflare, GitHub Actions, or Vercel — to start watching its free-tier usage.</p>
            </div>`}
        <form class="add-form svc-form" method="POST" action="/api/services" data-loading>
          <div class="add-form-grid">
            <div class="field">
              <input id="svc-label" name="label" placeholder=" " required minlength="2" maxlength="60">
              <label for="svc-label">Service label</label>
              <span class="err-msg">2–60 characters</span>
            </div>
            <div class="field">
              <select id="svc-kind" name="kind">
                <option value="cloudflare">Cloudflare</option>
                <option value="github">GitHub Actions</option>
                <option value="vercel">Vercel</option>
                <option value="supabase">Supabase (soon)</option>
                <option value="resend">Resend (soon)</option>
              </select>
              <label for="svc-kind">Provider</label>
            </div>
            <div class="field">
              <input id="svc-key" name="api_key" placeholder=" " required minlength="10">
              <label for="svc-key">API token (read-only)</label>
              <span class="err-msg">Token must be at least 10 characters</span>
            </div>
            <div class="field">
              <input id="svc-threshold" name="threshold" type="number" value="80" min="1" max="99" placeholder=" " required>
              <label for="svc-threshold">Alert at %</label>
              <span class="err-msg">Between 1 and 99</span>
            </div>
            <div class="field no-label">
              <button data-loading-label="Adding…">Add service</button>
            </div>
          </div>
        </form>
      </div>
    </section>

    <section class="section" id="alerts">
      <div class="section-head">
        <h2>Alert channels</h2>
        <span style="display:flex;gap:10px;align-items:center">
          <span class="count">${chnCount} active</span>
          <form method="POST" action="/api/test-alert" style="margin:0" data-loading><button type="submit" class="btn-inline" data-loading-label="Sending…">✉ Send test alert</button></form>
        </span>
      </div>
      <div class="card">
        ${chans
          ? `<ul class="alert-list">${chans}</ul>`
          : `<div class="empty">
              <div class="empty-illu">${ILLU_NO_ALERTS}</div>
              <h3>No alert channels</h3>
              <p>Add at least one channel below. We'll ping you the moment a service trips its threshold — before the cliff, not after.</p>
            </div>`}
        <form class="add-form alert-form" method="POST" action="/api/alerts" data-loading>
          <div class="add-form-grid">
            <div class="field">
              <select id="ch-kind" name="kind">
                <option value="email">Email</option>
                <option value="discord">Discord webhook</option>
                <option value="telegram">Telegram</option>
              </select>
              <label for="ch-kind">Channel</label>
            </div>
            <div class="field">
              <input id="ch-target" name="target" placeholder=" " required>
              <label for="ch-target">Address (email or webhook URL)</label>
              <span class="err-msg">Required</span>
            </div>
            <div class="field no-label">
              <button data-loading-label="Adding…">Add channel</button>
            </div>
          </div>
        </form>
      </div>
    </section>
  </main>

  <nav class="bottom-nav">
    <a href="/dash" class="active">${ICONS.home} Home</a>
    <a href="#services">${ICONS.cloud} Services</a>
    <a href="#alerts">${ICONS.bell} Alerts</a>
    <a href="/account">${ICONS.settings} Settings</a>
  </nav>

</div>
<script>
(function () {
  var ham = document.querySelector('.hamburger');
  var menu = document.getElementById('mobile-menu');
  var closeBtn = menu && menu.querySelector('.mm-close');
  if (!ham || !menu) return;
  function open() {
    menu.setAttribute('aria-hidden', 'false');
    ham.setAttribute('aria-expanded', 'true');
    document.body.classList.add('menu-open');
    setTimeout(function () { closeBtn && closeBtn.focus(); }, 50);
  }
  function close() {
    menu.setAttribute('aria-hidden', 'true');
    ham.setAttribute('aria-expanded', 'false');
    document.body.classList.remove('menu-open');
    ham.focus();
  }
  ham.addEventListener('click', open);
  closeBtn && closeBtn.addEventListener('click', close);
  // Close on ESC
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && menu.getAttribute('aria-hidden') === 'false') close();
  });
  // Close when clicking a section anchor or any link with data-mm-close
  menu.querySelectorAll('a[data-mm-close], a[href^="#"]').forEach(function (a) {
    a.addEventListener('click', close);
  });
})();

// Desktop sidebar collapse toggle (persists across reloads via localStorage)
(function () {
  var app = document.querySelector('.app');
  var btn = document.querySelector('[data-side-toggle]');
  if (!app || !btn) return;
  var KEY = 'fts.side.collapsed';
  try {
    if (localStorage.getItem(KEY) === '1') {
      app.classList.add('side-collapsed');
      btn.setAttribute('aria-label', 'Expand sidebar');
    }
  } catch (e) { /* localStorage may be blocked */ }
  btn.addEventListener('click', function () {
    var collapsed = app.classList.toggle('side-collapsed');
    btn.setAttribute('aria-label', collapsed ? 'Expand sidebar' : 'Collapse sidebar');
    try { localStorage.setItem(KEY, collapsed ? '1' : '0'); } catch (e) {}
  });
})();

// Relative-time formatting on <time data-ts="<unix-seconds>">
(function () {
  function rel(secs) {
    var diff = Math.max(0, Math.floor(Date.now() / 1000) - secs);
    if (diff < 60) return diff + 's ago';
    if (diff < 3600) return Math.floor(diff / 60) + 'm ago';
    if (diff < 86400) return Math.floor(diff / 3600) + 'h ago';
    if (diff < 2592000) return Math.floor(diff / 86400) + 'd ago';
    return Math.floor(diff / 2592000) + 'mo ago';
  }
  function update() {
    document.querySelectorAll('time[data-ts]').forEach(function (t) {
      var ts = parseInt(t.getAttribute('data-ts'), 10);
      if (!ts) return;
      t.textContent = rel(ts);
      t.setAttribute('datetime', new Date(ts * 1000).toISOString());
      t.setAttribute('title', new Date(ts * 1000).toUTCString());
    });
  }
  update();
  setInterval(update, 30000);
})();

// Stat counter — animates 0 → target on viewport entry (Plausible/Stripe pattern).
(function () {
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  function animate(el) {
    var target = parseInt(el.getAttribute('data-count'), 10);
    if (isNaN(target)) return;
    if (reduce || target === 0) { el.textContent = String(target); return; }
    var dur = 900; var t0 = null;
    function step(ts) {
      if (!t0) t0 = ts;
      var p = Math.min(1, (ts - t0) / dur);
      var eased = 1 - Math.pow(1 - p, 3); // ease-out-cubic
      el.textContent = String(Math.floor(target * eased));
      if (p < 1) requestAnimationFrame(step);
      else el.textContent = String(target);
    }
    requestAnimationFrame(step);
  }
  if (!('IntersectionObserver' in window)) {
    document.querySelectorAll('[data-count]').forEach(animate);
    return;
  }
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (!e.isIntersecting) return;
      animate(e.target);
      io.unobserve(e.target);
    });
  }, { threshold: 0.4 });
  document.querySelectorAll('[data-count]').forEach(function (el) { io.observe(el); });
})();

// Form loading state — any <form data-loading> swaps its submit button into spinner+disabled
// when submitted. Prevents double-submission and gives instant visual feedback.
(function () {
  document.querySelectorAll('form[data-loading]').forEach(function (form) {
    form.addEventListener('submit', function () {
      var btns = form.querySelectorAll('button[type="submit"], button:not([type])');
      btns.forEach(function (btn) {
        var loadingLabel = btn.getAttribute('data-loading-label');
        if (loadingLabel) { btn.setAttribute('data-original-label', btn.textContent || ''); btn.textContent = loadingLabel; }
        btn.disabled = true;
        btn.classList.add('is-loading');
      });
    });
  });
})();

// Service delete with confirm + DELETE fetch
(function () {
  document.querySelectorAll('[data-svc-delete]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var id = btn.getAttribute('data-svc-delete');
      if (!id) return;
      var li = btn.closest('li');
      var label = li ? (li.querySelector('.svc-name') || {}).childNodes[0] : null;
      var name = label ? (label.textContent || '').trim() : 'this service';
      if (!confirm('Delete ' + name + '? This cannot be undone.')) return;
      btn.disabled = true; btn.style.opacity = '.5';
      fetch('/api/services/' + encodeURIComponent(id), { method: 'DELETE', credentials: 'same-origin' })
        .then(function (r) {
          if (r.status === 204 || r.ok) { location.reload(); }
          else { alert('Delete failed (' + r.status + '). Please try again.'); btn.disabled = false; btn.style.opacity = ''; }
        })
        .catch(function () { alert('Network error. Please try again.'); btn.disabled = false; btn.style.opacity = ''; });
    });
  });
})();
</script>
</body></html>`;

  return new Response(html, { headers: { "content-type": "text/html; charset=utf-8" } });
}
