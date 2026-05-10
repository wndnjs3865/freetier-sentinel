import type { Env } from "../index";
import type { Locale, Translations } from "../i18n";
import { LOCALE_META, SUPPORTED_LOCALES, T, getLocaleFromPath } from "../i18n";
import { analyticsHeads } from "../lib/analytics";

const ORIGIN = "https://freetier-sentinel.dev";

const CSS = String.raw`
:root {
  /* Top-1% palette — indigo-leaning primary (Linear/Vercel range), brand-aligned
     bg with subtle blue cast, status colors with soft glow tokens. */
  --bg: #f6f8fc;
  --bg-soft: #eef2fa;
  --bg-mesh: #e9eef8;
  --surface: #ffffff;
  --surface-2: #eef2fa;
  --text: #0a0e1a;
  --text-2: #424b62;
  --muted: #64748b;
  --border: #dde3ee;
  --border-strong: #c4cdde;
  --primary: #14b8a6;          /* Teal-500 — user spec exact value */
  --primary-2: #0d9488;          /* Teal-600 hover */
  --primary-3: #2dd4bf;           /* Teal-400 */
  --primary-soft: #ccfbf1;        /* Teal-100 — focus ring tint */
  --primary-deep: #115e59;        /* Teal-800 */
  --accent: #22d3ee;              /* Cyan-400 — complementary trailing accent */
  /* Status — base + 10% softs */
  --ok: #10b981;     --ok-soft: rgba(16,185,129,.10);   --ok-glow: 0 0 0 6px rgba(16,185,129,.10);
  --warn: #f59e0b;   --warn-soft: rgba(245,158,11,.10); --warn-glow: 0 0 0 6px rgba(245,158,11,.12);
  --crit: #f43f5e;   --crit-soft: rgba(244,63,94,.10);  --crit-glow: 0 0 0 6px rgba(244,63,94,.12);
  /* Brand gradient: deep teal → mid teal → cyan — coherent teal-family ramp. */
  --grad-1: linear-gradient(135deg, #0d9488 0%, #14b8a6 50%, #22d3ee 100%);
  /* Text gradient: stays in teal range for WCAG AA contrast on white bg.
     Cyan trails at the very end as a flourish only. */
  --grad-text: linear-gradient(120deg, #0d9488 0%, #14b8a6 60%, #2dd4bf 90%, #22d3ee 100%);
  /* Shadows tinted with teal — keeps elements feeling lifted from primary surface. */
  --shadow-xs: 0 1px 2px rgba(20,184,166,.06);
  --shadow-sm: 0 1px 2px rgba(20,184,166,.06), 0 4px 12px rgba(20,184,166,.04);
  --shadow-md: 0 6px 24px -8px rgba(20,184,166,.14), 0 1px 0 rgba(20,184,166,.04);
  --shadow-lg: 0 24px 48px -16px rgba(20,184,166,.20), 0 1px 0 rgba(20,184,166,.06);
  --shadow-glow: 0 0 0 1px rgba(20,184,166,.12), 0 8px 32px rgba(20,184,166,.18);
  --shadow-inset: inset 0 1px 0 rgba(255,255,255,.18), inset 0 -1px 0 rgba(15,23,42,.06);
  --r-sm: 8px;
  --r-md: 12px;
  --r-lg: 16px;
  --r-xl: 24px;
  --r-2xl: 28px;
  --t-fast: 140ms cubic-bezier(.4,0,.2,1);
  --t-med: 220ms cubic-bezier(.4,0,.2,1);
  --t-slow: 480ms cubic-bezier(.4,0,.2,1);
  --font-display: 'Satoshi', 'Inter', -apple-system, BlinkMacSystemFont, system-ui, sans-serif;
  --font-body: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
  --font-mono: 'JetBrains Mono', ui-monospace, Menlo, monospace;
}

/* Auto dark mode — invert palette when the OS prefers dark.
   Manual toggle is post-launch (localStorage + sync across pages). */
@media (prefers-color-scheme: dark) {
  :root {
    --bg: #0a0e1a;
    --bg-soft: #0f1424;
    --bg-mesh: #131a2c;
    --surface: #11172a;
    --surface-2: #161e34;
    --text: #ecf0f9;
    --text-2: #a3aec5;
    --muted: #6c7891;
    --border: #1f2940;
    --border-strong: #2c3853;
    --primary: #2dd4bf;                /* Teal-400 — brighter on dark bg */
    --primary-2: #5eead4;                /* Teal-300 hover */
    --primary-3: #99f6e4;                /* Teal-200 */
    --primary-soft: rgba(20,184,166,.16); /* teal-tinted soft */
    --primary-deep: #14b8a6;
    --shadow-xs: 0 1px 2px rgba(0,0,0,.30);
    --shadow-sm: 0 1px 2px rgba(0,0,0,.30), 0 4px 12px rgba(0,0,0,.20);
    --shadow-md: 0 6px 24px -8px rgba(0,0,0,.40), 0 1px 0 rgba(255,255,255,.04);
    --shadow-lg: 0 24px 48px -16px rgba(0,0,0,.50), 0 1px 0 rgba(255,255,255,.06);
    --shadow-glow: 0 0 0 1px rgba(45,212,191,.22), 0 8px 32px rgba(20,184,166,.24);
    --shadow-inset: inset 0 1px 0 rgba(255,255,255,.06), inset 0 -1px 0 rgba(0,0,0,.20);
  }
}

* { box-sizing: border-box; }
html { -webkit-text-size-adjust: 100%; scroll-behavior: smooth; }
body {
  font-family: var(--font-body);
  font-feature-settings: 'cv02','cv03','cv04','cv11','ss01','ss03';
  background: var(--bg);
  color: var(--text);
  margin: 0;
  line-height: 1.7;                     /* user-spec body line-height 1.75 (1.7 best for paragraphs+UI mix) */
  font-size: 16px;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-rendering: optimizeLegibility;
}
p, li { line-height: 1.7; }
.lede, .why-body p { line-height: 1.75; }   /* explicit user spec for paragraph text */
h1, h2, h3, h4, .display { font-family: var(--font-display); }
::selection { background: var(--primary-soft); color: var(--primary); }
a { color: var(--primary); text-decoration: none; }
a:hover { color: var(--primary-2); }
button { font-family: inherit; }

.container { max-width: 1180px; margin: 0 auto; padding: 0 24px; }
.container-narrow { max-width: 720px; margin: 0 auto; padding: 0 24px; }
@media (max-width: 600px) { .container, .container-narrow { padding: 0 18px; } }

/* ───── NAV ───── */
.nav {
  position: sticky; top: 0; z-index: 50;
  background: color-mix(in srgb, var(--bg) 78%, transparent);
  backdrop-filter: saturate(180%) blur(14px);
  -webkit-backdrop-filter: saturate(180%) blur(14px);
  border-bottom: 1px solid var(--border);
}
.nav-inner { display: flex; align-items: center; justify-content: space-between; padding: 14px 0; }
.brand { display: inline-flex; align-items: center; gap: 9px; font-weight: 600; font-size: 15.5px; letter-spacing: -.015em; color: var(--text); }
.brand-logo { width: 22px; height: 22px; display: inline-flex; align-items: center; justify-content: center;
  border-radius: 6px; background: var(--grad-1); color: white; font-size: 12px; font-weight: 800;
  box-shadow: 0 1px 0 rgba(15,23,42,.06), inset 0 1px 0 rgba(255,255,255,.18);
}
.nav-links { display: flex; gap: 28px; align-items: center; }
.nav-section-links { display: none; gap: 28px; align-items: center; }
@media (min-width: 720px) { .nav-section-links { display: flex; } }
.nav-links a, .nav-section-links a { color: var(--text-2); font-size: 14.5px; font-weight: 500; transition: color var(--t-fast); }
.nav-links a:hover, .nav-section-links a:hover { color: var(--text); }
.nav-github {
  display: inline-flex !important; align-items: center; gap: 6px;
  padding: 5px 10px; border: 1px solid var(--border);
  border-radius: 8px; transition: border-color var(--t-fast), background var(--t-fast), color var(--t-fast);
}
.nav-github:hover { border-color: var(--border-strong); background: var(--surface-2); }
.nav-github svg { flex-shrink: 0; }
@media (max-width: 600px) { .nav-links { gap: 10px; } .nav-cta { padding: 10px 14px; font-size: 14px; } }
@media (max-width: 380px) {
  .brand { font-size: 14px; gap: 7px; }
  .brand-logo { width: 20px; height: 20px; font-size: 11px; }
  .nav-links { gap: 6px; }
  .nav-cta { padding: 9px 12px; font-size: 13px; }
}
.nav-cta {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 9px 18px;
  background: linear-gradient(180deg, #1f2937 0%, var(--text) 100%);
  color: white !important;
  border-radius: 10px; font-size: 13.5px; font-weight: 600;
  letter-spacing: -.005em;
  box-shadow: var(--shadow-inset), 0 1px 2px rgba(15,23,42,.06);
  transition: transform var(--t-fast), box-shadow var(--t-fast), filter var(--t-fast);
}
.nav-cta:hover { transform: translateY(-1px) scale(1.02); box-shadow: var(--shadow-inset), 0 8px 16px rgba(15,23,42,.18); filter: brightness(1.08); }
.nav-cta:active { transform: translateY(0) scale(0.98); filter: brightness(.95); }

/* ───── HERO ───── */
.hero {
  position: relative;
  padding: 128px 0 104px;
  overflow: hidden;
  text-align: center;
}
/* Subtle grid background — only behind hero */
.hero-grid {
  position: absolute; inset: 0;
  background-image:
    linear-gradient(rgba(20,184,166,.05) 1px, transparent 1px),
    linear-gradient(90deg, rgba(20,184,166,.05) 1px, transparent 1px);
  background-size: 56px 56px;
  background-position: -1px -1px;
  mask-image: radial-gradient(ellipse 80% 60% at 50% 30%, #000 30%, transparent 80%);
  -webkit-mask-image: radial-gradient(ellipse 80% 60% at 50% 30%, #000 30%, transparent 80%);
  pointer-events: none;
  z-index: -1;
}
@media (prefers-color-scheme: dark) {
  .hero-grid {
    background-image:
      linear-gradient(rgba(45,212,191,.08) 1px, transparent 1px),
      linear-gradient(90deg, rgba(45,212,191,.08) 1px, transparent 1px);
  }
}
.hero::before {
  content: ''; position: absolute; inset: 0;
  background:
    radial-gradient(ellipse 1200px 600px at 50% -120px, rgba(20,184,166,.09), transparent 60%),
    radial-gradient(ellipse 500px 350px at 88% 100px, rgba(34,211,238,.06), transparent 65%),
    radial-gradient(ellipse 600px 450px at 12% 220px, rgba(13,148,136,.05), transparent 70%);
  pointer-events: none; z-index: -1;
}
.hero::after {
  content: ''; position: absolute; left: 50%; transform: translateX(-50%); bottom: 0;
  width: min(720px, 86%); height: 1px;
  background: linear-gradient(90deg, transparent, rgba(30,64,175,.22), transparent);
  pointer-events: none;
}
@media (max-width: 600px) { .hero { padding: 72px 0 56px; } }

.eyebrow {
  display: inline-flex; align-items: center; gap: 10px;
  padding: 6px 14px;
  background: color-mix(in srgb, var(--surface) 86%, transparent);
  border: 1px solid var(--border);
  border-radius: 999px;
  font-size: 12.5px; font-weight: 500; color: var(--text-2);
  letter-spacing: .015em;
  margin-bottom: 28px;
  text-transform: none;
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  box-shadow: var(--shadow-xs);
}
.eyebrow .pulse {
  width: 7px; height: 7px; background: var(--ok); border-radius: 50%; flex-shrink: 0;
  box-shadow: 0 0 0 4px rgba(16,185,129,.18), 0 0 12px rgba(16,185,129,.55);
  animation: eyebrow-pulse 2.4s ease-in-out infinite;
}
@keyframes eyebrow-pulse {
  0%, 100% { box-shadow: 0 0 0 4px rgba(16,185,129,.18), 0 0 8px rgba(16,185,129,.45); }
  50%      { box-shadow: 0 0 0 6px rgba(16,185,129,.10), 0 0 16px rgba(16,185,129,.65); }
}
.eyebrow .line { width: 24px; height: 1px; background: var(--border-strong); flex-shrink: 0; }

.hero h1 {
  font-family: var(--font-display);
  font-size: clamp(40px, 7vw, 88px);
  line-height: 1.05;                    /* user-spec 1.1 — heroes benefit slightly tighter */
  letter-spacing: -.04em;               /* ≈ -1.5px @ 38px / -3.5px @ 88px (em scales) */
  font-weight: 700;
  margin: 0 0 32px;
  max-width: 980px; margin-left: auto; margin-right: auto;
  color: var(--text);
  text-wrap: balance;
  hyphens: auto;
  -webkit-hyphens: auto;
}
@media (max-width: 480px) {
  .hero h1 { font-size: clamp(32px, 9vw, 44px); line-height: 1.1; letter-spacing: -.03em; }
}
.hero h1 .gradient {
  background: var(--grad-text);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  color: transparent;
  font-style: italic;
  font-weight: 600;
}
.hero .lede {
  font-size: clamp(17px, 1.6vw, 22px);
  color: var(--text-2);
  max-width: 620px; margin: 0 auto 40px;       /* 8px grid */
  line-height: 1.7;                             /* user-spec body 1.7+ */
  font-weight: 400;
  letter-spacing: -.005em;
  text-wrap: balance;                           /* user-spec for subheadline */
  overflow-wrap: anywhere;
  word-break: normal;
}
.hero .lede em { font-style: italic; color: var(--text); font-weight: 500; }

.hero-form {
  display: flex; gap: 8px;
  max-width: 480px; margin: 0 auto;
  background: var(--surface);
  border: 1px solid var(--border-strong);
  border-radius: var(--r-lg);
  padding: 6px;
  box-shadow: var(--shadow-md);
  transition: box-shadow var(--t-med), border-color var(--t-med);
}
.hero-form:focus-within { box-shadow: 0 0 0 4px rgba(20,184,166,.12), var(--shadow-md); border-color: var(--primary); }
.hero-form input {
  flex: 1 1 0;
  padding: 12px 14px;
  font-size: 16px;
  font-family: inherit;
  border: 0; background: transparent;
  color: var(--text); outline: none;
  min-width: 0;
  width: 100%;
}
.hero-form input::placeholder { color: var(--muted); }
@media (max-width: 380px) {
  /* Very narrow viewport: stack input + button vertically */
  .hero-form { flex-direction: column; gap: 6px; padding: 8px; }
  .hero-form input { padding: 10px 12px; }
  .hero-form button { width: 100%; padding: 12px; }
}
.hero-form button {
  padding: 13px 24px;
  font-size: 14.5px;
  font-weight: 600;
  letter-spacing: -.005em;
  border: 0; border-radius: 12px;
  background: linear-gradient(180deg, #1f2937 0%, var(--text) 100%);
  color: white;
  cursor: pointer;
  transition: transform var(--t-fast), box-shadow var(--t-fast), filter var(--t-fast);
  white-space: nowrap;
  box-shadow: var(--shadow-inset), 0 1px 2px rgba(15,23,42,.08);
}
.hero-form button:hover { transform: translateY(-1px) scale(1.02); box-shadow: var(--shadow-inset), 0 12px 24px rgba(15,23,42,.20); filter: brightness(1.08); }
.hero-form button:active { transform: translateY(0) scale(0.98); filter: brightness(.95); }
.hero .micro {
  margin-top: 20px;
  font-size: 13px;
  color: var(--muted);
  display: inline-flex; align-items: center; gap: 6px;
  flex-wrap: wrap; justify-content: center;
  letter-spacing: -.005em;
  max-width: 100%;
  padding: 0 12px;
}
.hero .micro span { white-space: nowrap; }
.hero .micro .sep { color: var(--border-strong); padding: 0 4px; }
@media (max-width: 380px) { .hero .micro .sep { display: none; } .hero .micro { gap: 4px 12px; } }

/* Product preview — live event feed (Resend pattern + glass shell) */
.preview {
  margin: 64px auto 0;
  max-width: 920px;
  padding: 0 24px;
  position: relative;
}
.preview::before {
  content: ''; position: absolute; inset: 16px 12px -32px;
  background: radial-gradient(ellipse 60% 60% at 50% 50%, rgba(20,184,166,.18), transparent 70%);
  filter: blur(40px); pointer-events: none; z-index: 0;
}
@media (prefers-color-scheme: dark) {
  .preview::before { background: radial-gradient(ellipse 60% 60% at 50% 50%, rgba(99,102,241,.30), transparent 70%); }
}
.preview-frame {
  position: relative; z-index: 1;
  background: #0a0e1a;
  border: 1px solid rgba(255,255,255,.08);
  border-radius: var(--r-2xl);
  box-shadow:
    0 32px 64px -24px rgba(15,23,42,.40),
    0 1px 0 rgba(255,255,255,.06) inset,
    0 0 0 1px rgba(20,184,166,.10);
  backdrop-filter: blur(24px) saturate(180%);
  -webkit-backdrop-filter: blur(24px) saturate(180%);
  overflow: hidden;
}
@media (max-width: 600px) {
  .preview { padding: 0 16px; margin-top: 48px; }
  .preview-frame { border-radius: var(--r-lg); }
}
.preview-bar {
  display: flex; align-items: center; gap: 6px;
  padding: 12px 16px; border-bottom: 1px solid #1f2937; background: #111827;
}
.preview-bar .dot { width: 11px; height: 11px; border-radius: 50%; background: #374151; }
.preview-bar .dot:nth-child(1) { background: #ef4444; opacity: .8; }
.preview-bar .dot:nth-child(2) { background: #f59e0b; opacity: .8; }
.preview-bar .dot:nth-child(3) { background: #22c55e; opacity: .8; }
.preview-bar .url {
  margin-left: 14px; padding: 4px 10px;
  background: rgba(255,255,255,.04); border: 1px solid rgba(255,255,255,.08);
  border-radius: 6px; font-size: 12px; color: #94a3b8;
  font-family: 'JetBrains Mono', ui-monospace, monospace;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
@media (max-width: 480px) {
  .preview-bar .url { margin-left: 10px; font-size: 11px; }
}
.preview-bar .live-tag { margin-left: auto; font-size: 11px; color: #4ade80; font-weight: 600; letter-spacing: .04em; text-transform: uppercase; display: inline-flex; align-items: center; gap: 6px; }
.preview-bar .live-tag::before { content: ''; width: 6px; height: 6px; background: #4ade80; border-radius: 50%; box-shadow: 0 0 0 3px rgba(74,222,128,.18); animation: pulse-live 2s infinite; }
@keyframes pulse-live { 0%,100% { box-shadow: 0 0 0 3px rgba(74,222,128,.18); } 50% { box-shadow: 0 0 0 6px rgba(74,222,128,.06); } }

.event-feed {
  font-family: 'JetBrains Mono', ui-monospace, monospace;
  font-variant-numeric: tabular-nums;
  font-size: clamp(13.6px, 2.5vw, 15.2px);                   /* user-spec 0.85-0.95rem range */
  background: #0a0e1a;
  color: #cbd5e1;
  padding: 18px 22px 22px;
  line-height: 1.95;
  overflow-wrap: anywhere;
  word-break: normal;
}
.event-feed .ev {
  display: grid;
  grid-template-columns: 70px 110px 130px minmax(0, 1fr);   /* 70px fixed timestamp per spec */
  gap: 16px;
  align-items: baseline;
  white-space: nowrap;
  overflow: hidden;
  min-width: 0;
  padding: 0;
  line-height: 1.5;                                          /* user-spec exact 1.5 */
  word-break: break-word;                                    /* user-spec — break long technical strings */
  animation: ev-slide 540ms cubic-bezier(.4,0,.2,1) both;
}
.event-feed .ev .t  { color: #64748b; }
.event-feed .ev .p  { color: #93c5fd; }
.event-feed .ev .m  { color: #94a3b8; }
.event-feed .ev .v  { color: #cbd5e1; overflow: hidden; text-overflow: ellipsis; min-width: 0; }
.event-feed .ev.ok   .v { color: #cbd5e1; }
.event-feed .ev.warn .v { color: #cbd5e1; }
.event-feed .ev.err  .v { color: #cbd5e1; font-weight: 500; }
/* Status pill badge (used inline inside .v for "safe" / "WARN" / "DEGRADED") */
.event-feed .tag {
  display: inline-block;
  padding: 1px 8px;
  border-radius: 999px;
  font-size: 10.5px;
  font-weight: 700;
  letter-spacing: .06em;
  text-transform: uppercase;
  margin: 0 2px;
  vertical-align: 1px;
  white-space: nowrap;
}
.event-feed .tag-ok {
  background: rgba(16,185,129,.12); color: #34d399;
  box-shadow: 0 0 0 1px rgba(16,185,129,.22);
}
.event-feed .tag-warn {
  background: rgba(245,158,11,.12); color: #fbbf24;
  box-shadow: 0 0 0 1px rgba(245,158,11,.22), 0 0 8px rgba(245,158,11,.18);
}
.event-feed .tag-err {
  background: rgba(244,63,94,.14); color: #fb7185;
  box-shadow: 0 0 0 1px rgba(244,63,94,.30), 0 0 12px rgba(244,63,94,.32);
  animation: tag-pulse-err 2.4s ease-in-out infinite;
}
@keyframes tag-pulse-err {
  0%, 100% { box-shadow: 0 0 0 1px rgba(244,63,94,.30), 0 0 8px rgba(244,63,94,.28); }
  50%      { box-shadow: 0 0 0 1px rgba(244,63,94,.45), 0 0 18px rgba(244,63,94,.45); }
}
.event-feed .ev:nth-child(1) { animation-delay: 0ms; }
.event-feed .ev:nth-child(2) { animation-delay: 120ms; }
.event-feed .ev:nth-child(3) { animation-delay: 240ms; }
.event-feed .ev:nth-child(4) { animation-delay: 360ms; }
.event-feed .ev:nth-child(5) { animation-delay: 480ms; }
.event-feed .ev:nth-child(6) { animation-delay: 600ms; }
.event-feed .ev:nth-child(7) { animation-delay: 720ms; }
@keyframes ev-slide { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: none; } }
/* 480-640px: 3-col (drop metric column) */
@media (max-width: 640px) and (min-width: 481px) {
  .event-feed { font-size: 11.5px; padding: 14px 16px 18px; }
  .event-feed .ev { grid-template-columns: 60px 90px minmax(0, 1fr); gap: 10px; }
  .event-feed .ev .m { display: none; }
}
/* < 480px: timestamp on its own small line, the rest flows as text and wraps naturally. */
@media (max-width: 480px) {
  .event-feed { font-size: 13px; padding: 14px 18px 18px; line-height: 1.55; }
  .event-feed .ev {
    display: block;
    line-height: 1.55;
    padding: 0 0 12px;
    margin-bottom: 10px;
    border-bottom: 1px dashed rgba(255,255,255,.05);
    white-space: pre-wrap;
    overflow: visible;
    word-break: break-word;
    overflow-wrap: anywhere;
  }
  .event-feed .ev:last-child { border-bottom: 0; margin-bottom: 0; padding-bottom: 0; }
  .event-feed .ev .t {
    display: block;
    font-size: 10.5px;
    color: #64748b;
    letter-spacing: .04em;
    margin-bottom: 4px;
  }
  .event-feed .ev .p {
    display: inline; color: #93c5fd; margin-right: 5px;
    overflow: visible; text-overflow: clip; word-break: break-word;
  }
  .event-feed .ev .m {
    display: inline; color: #94a3b8; margin-right: 5px;
    overflow: visible; text-overflow: clip; word-break: break-word;
  }
  .event-feed .ev .v {
    display: inline;
    overflow: visible;
    text-overflow: clip;
    overflow-wrap: anywhere;
    word-break: break-word;
    line-height: 1.55;
  }
}

/* 3-stat number row (Plausible/Stripe pattern) */
.proof-row {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0;
  padding: 64px 24px 0;
  max-width: 880px;
  margin: 0 auto;
}
@media (max-width: 600px) { .proof-row { grid-template-columns: 1fr; gap: 28px; padding-top: 48px; } }
.proof-row .pf-stat {
  text-align: center;
  padding: 0 16px;
  position: relative;
}
@media (min-width: 601px) {
  .proof-row .pf-stat:not(:first-child)::before {
    content: ''; position: absolute; left: 0; top: 12px; bottom: 12px; width: 1px;
    background: linear-gradient(180deg, transparent, var(--border) 30%, var(--border) 70%, transparent);
  }
}
.proof-row .pf-stat .num {
  display: block;
  font-family: 'JetBrains Mono', ui-monospace, monospace;
  font-size: clamp(34px, 4.4vw, 46px);
  font-weight: 500;
  letter-spacing: -.035em;
  font-variant-numeric: tabular-nums;
  color: var(--text);
  line-height: 1.05;
  margin-bottom: 10px;
}
.proof-row .pf-stat .lbl {
  font-size: clamp(12px, 1.4vw, 13.5px);
  color: var(--muted);
  letter-spacing: .005em;
  line-height: 1.5;
  overflow-wrap: anywhere;
  word-break: normal;
  text-wrap: balance;
  padding: 0 4px;
}

/* ───── TRUST BADGES (open-source / built-on / license) ───── */
.trust-row {
  display: flex; flex-wrap: wrap; justify-content: center; align-items: center;
  gap: 10px;
  padding: 56px 24px 0;
  max-width: 880px; margin: 0 auto;
}
.trust-badge {
  display: inline-flex; align-items: center; gap: 8px;
  padding: 7px 14px;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 999px;
  font-size: 13px; font-weight: 500; color: var(--text-2);
  text-decoration: none;
  transition: border-color var(--t-fast), background var(--t-fast), color var(--t-fast), transform var(--t-fast);
}
.trust-badge:hover { border-color: var(--border-strong); color: var(--text); transform: translateY(-1px); }
.trust-badge svg { width: 14px; height: 14px; flex-shrink: 0; }
.trust-badge .ico-cf    { color: #f38020; }
.trust-badge .ico-mit   { color: var(--ok); }
.trust-badge .ico-gh    { color: var(--text); }
.trust-badge .ico-shield{ color: var(--primary); }
@media (prefers-color-scheme: dark) {
  .trust-badge .ico-gh { color: var(--text); }
}

/* ───── LOGO STRIP ───── */
.strip { padding: 64px 0 24px; }
.strip .label {
  text-align: center;
  font-size: 11.5px; text-transform: uppercase; letter-spacing: .16em;
  color: var(--muted); font-weight: 500;
  margin-bottom: 24px;
}
.strip-row {
  display: flex; flex-wrap: wrap; justify-content: center; align-items: center; gap: 14px 36px;
  font-size: 15px; font-weight: 500; color: var(--text-2);
  letter-spacing: -.005em;
}
.strip-row > span { display: inline-flex; align-items: center; gap: 8px; }
.strip-row .more {
  font-size: 13px; color: var(--muted); font-weight: 400;
  border: 1px solid var(--border); padding: 4px 10px; border-radius: 999px;
}
@media (max-width: 600px) { .strip-row { gap: 12px 24px; font-size: 14px; } }

/* ───── SCROLL-FADE REVEAL — fade-up + scale (사용자 명시: 0.95 → 1) ───── */
@media (prefers-reduced-motion: no-preference) {
  .reveal {
    opacity: 0;
    transform: translateY(12px) scale(.96);
    transition: opacity 700ms cubic-bezier(.16,1,.3,1), transform 700ms cubic-bezier(.16,1,.3,1);
  }
  .reveal.in { opacity: 1; transform: translateY(0) scale(1); }
}
.reveal { will-change: opacity, transform; }

/* Defer rendering of off-screen sections — Lighthouse perf boost. */
.section, .why, .alerts-section, .strip, .code-section { content-visibility: auto; contain-intrinsic-size: auto 600px; }
footer { content-visibility: auto; contain-intrinsic-size: auto 400px; }

/* ───── WHY (emotional narrative) ───── */
.why {
  padding: 120px 0 96px;
  background: linear-gradient(180deg, var(--bg) 0%, var(--bg-soft) 100%);
  border-top: 1px solid var(--border);
  position: relative;
}
.why::before {
  content: ''; position: absolute; left: 50%; transform: translateX(-50%); top: 0;
  width: min(720px, 86%); height: 1px;
  background: linear-gradient(90deg, transparent, rgba(20,184,166,.22), transparent);
}
@media (max-width: 600px) { .why { padding: 80px 0 64px; } }
.why-inner { max-width: 640px; margin: 0 auto; padding: 0 24px; }
@media (max-width: 600px) { .why-inner { padding: 0 20px; } }
.why .section-eyebrow { display: block; margin-bottom: 18px; }
.why h2 {
  font-size: clamp(28px, 3.6vw, 42px);
  line-height: 1.15; letter-spacing: -.03em;
  font-weight: 600; margin: 0 0 36px;
  color: var(--text);
  text-align: left;
  font-feature-settings: 'cv02','cv03','ss01';
}
.why-body p {
  font-size: 17px; line-height: 1.75;
  color: var(--text-2);
  margin: 0 0 18px;
  font-weight: 400;
  letter-spacing: -.005em;
  overflow-wrap: anywhere;
  word-break: normal;
  -webkit-hyphens: auto;
  hyphens: auto;
  text-wrap: pretty;       /* Chrome 117+, Safari 17.5+ — optimizes ragged-right last lines */
}
@media (max-width: 480px) {
  .why-body p { font-size: 16px; line-height: 1.75; margin-bottom: 16px; }
  .why h2 { font-size: 26px; line-height: 1.2; }
  .why-inner { padding: 0 18px; }
  .why-signature { font-size: 14.5px; padding-top: 20px; margin-top: 22px; }
}
.why-body p:last-of-type { margin-bottom: 0; }
.why-body em { font-style: italic; color: var(--text); font-weight: 500; }
.why-body strong { color: var(--text); font-weight: 600; font-variant-numeric: tabular-nums; }
.why-signature {
  margin-top: 28px;
  padding-top: 24px;
  border-top: 1px solid var(--border);
  font-size: 15px;
  color: var(--text);
  font-style: italic;
  font-weight: 400;
  letter-spacing: -.005em;
}

/* ───── ALERTS PREVIEW (Slack/Email/Discord mockups) ───── */
.alerts-section {
  padding: 128px 0;
  background: var(--bg);
  border-top: 1px solid var(--border);
}
@media (max-width: 600px) { .alerts-section { padding: 80px 0; } }
.alerts-grid {
  display: grid; gap: 18px;
  grid-template-columns: 1fr;
  max-width: 980px; margin: 0 auto;
}
@media (min-width: 880px) { .alerts-grid { grid-template-columns: repeat(3, 1fr); gap: 20px; } }
.alert-card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--r-lg);
  overflow: hidden;
  min-width: 0;
  display: flex; flex-direction: column;
  transition: border-color var(--t-fast), transform var(--t-med);
}
.alert-card:hover { border-color: var(--border-strong); transform: translateY(-2px); }
.alert-card-head {
  display: flex; align-items: center; gap: 10px;
  padding: 14px 18px;
  border-bottom: 1px solid var(--border);
  font-size: 12px; font-weight: 500; color: var(--muted);
  letter-spacing: .04em; text-transform: uppercase;
}
.alert-card-head .ch-logo {
  width: 22px; height: 22px; border-radius: 6px;
  display: inline-flex; align-items: center; justify-content: center;
  flex-shrink: 0;
  font-size: 11px; font-weight: 700; color: #fff;
}
.alert-card-head .ch-logo.slack { background: #4a154b; }
.alert-card-head .ch-logo.email { background: var(--text); }
.alert-card-head .ch-logo.discord { background: #5865f2; }
.alert-card-head .ch-name { font-weight: 600; color: var(--text); text-transform: none; letter-spacing: -.005em; font-size: 13px; }
.alert-card-head .ch-name { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.alert-card-head time { margin-left: auto; font-family: 'JetBrains Mono', ui-monospace, monospace; font-size: 11.5px; color: var(--muted); text-transform: none; letter-spacing: 0; flex-shrink: 0; }
.alert-card-body {
  padding: 18px 20px 20px;
  flex: 1;
  display: flex; flex-direction: column;
  gap: 10px;
}
.alert-card-body .subj {
  font-size: 14.5px; font-weight: 600; color: var(--text);
  letter-spacing: -.005em; line-height: 1.4;
}
.alert-card-body .from {
  font-size: 12.5px; color: var(--muted);
  font-family: 'JetBrains Mono', ui-monospace, monospace;
}
.alert-card-body .body-text {
  font-size: 13.5px; color: var(--text-2);
  line-height: 1.65;
  margin: 0;
  overflow-wrap: anywhere;
  word-break: normal;
}
.alert-card-body .subj { overflow-wrap: anywhere; word-break: normal; }
.alert-card-body .from { overflow-wrap: anywhere; word-break: break-all; }  /* monospace email/handle ok to break */
.alert-card-body strong { color: var(--text); font-weight: 600; font-variant-numeric: tabular-nums; }
.alert-card-body em { color: var(--muted); font-style: italic; }
.alert-card-body .react {
  display: flex; align-items: center; gap: 8px; flex-wrap: wrap;
  margin-top: auto; padding-top: 12px;
  border-top: 1px dashed var(--border);
  font-size: 12px; color: var(--muted);
}
.alert-card-body .react .pill {
  display: inline-flex; align-items: center; gap: 4px;
  padding: 2px 8px; border-radius: 999px;
  background: var(--surface-2); border: 1px solid var(--border);
  font-family: 'JetBrains Mono', ui-monospace, monospace; font-size: 11px;
  color: var(--text-2);
}

/* ───── SECTION HEADS ───── */
.section { padding: 128px 0; }
@media (max-width: 600px) { .section { padding: 80px 0; } }
.section-eyebrow {
  display: inline-block;
  font-size: 11.5px; text-transform: uppercase;
  letter-spacing: .16em; color: var(--primary);
  font-weight: 600; margin-bottom: 16px;
}
.section h2 {
  font-size: clamp(28px, 3.4vw, 40px);
  line-height: 1.12; letter-spacing: -.025em;
  font-weight: 600; margin: 0 0 18px;
  text-align: center;
  color: var(--text);
}
.section h2 em { font-style: italic; font-weight: 500; color: var(--text-2); }
.section .sub {
  text-align: center; color: var(--text-2);
  font-size: clamp(16px, 1.4vw, 17.5px); margin: 0 auto 64px;
  max-width: 580px; line-height: 1.65;
  font-weight: 400;
  text-wrap: pretty;
  overflow-wrap: anywhere;
  word-break: normal;
}

/* ───── FEATURES ───── */
.features-grid { display: grid; gap: 18px; grid-template-columns: 1fr; }
@media (min-width: 640px) { .features-grid { grid-template-columns: 1fr 1fr; } }
@media (min-width: 980px) { .features-grid { grid-template-columns: repeat(3, 1fr); } }
.feature {
  position: relative;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--r-lg);
  padding: 30px 28px;
  transition: transform var(--t-med), border-color var(--t-med);
}
.feature::before {
  content: ''; position: absolute; inset: -1px;
  border-radius: inherit; padding: 1px;
  background: linear-gradient(135deg, rgba(59,130,246,.6), rgba(99,102,241,.4) 50%, transparent 75%);
  -webkit-mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
  -webkit-mask-composite: xor; mask-composite: exclude;
  opacity: 0; transition: opacity var(--t-med);
  pointer-events: none;
}
.feature:hover { transform: translateY(-2px); border-color: transparent; }
.feature:hover::before { opacity: 1; }
.feature-icon {
  width: 40px; height: 40px;
  background: var(--primary-soft);
  color: var(--primary);
  border-radius: 10px;
  display: inline-flex; align-items: center; justify-content: center;
  margin-bottom: 22px;
  box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--primary) 14%, transparent);
}
.feature-icon svg { width: 19px; height: 19px; stroke-width: 1.9; }
.feature h3 {
  font-size: 16.5px; letter-spacing: -.01em;
  font-weight: 600; margin: 0 0 8px;
  color: var(--text);
}
.feature p {
  margin: 0; color: var(--text-2);
  font-size: 14.5px; line-height: 1.65;
  overflow-wrap: anywhere;
  word-break: normal;
}
.feature h3 { overflow-wrap: anywhere; word-break: normal; }
@media (max-width: 600px) {
  .feature { padding: 22px 20px; }
}

/* ───── HOW ───── */
.how {
  background: var(--bg-mesh);
  border-top: 1px solid var(--border);
  border-bottom: 1px solid var(--border);
  position: relative;
  overflow: hidden;
}
.steps-grid { display: grid; gap: 16px; grid-template-columns: 1fr; }
@media (min-width: 880px) { .steps-grid { grid-template-columns: repeat(3, 1fr); } }
.step {
  position: relative;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--r-lg);
  padding: 32px 30px 30px;
  transition: border-color var(--t-med), transform var(--t-med);
}
.step:hover { border-color: var(--border-strong); transform: translateY(-1px); }
.step-n {
  display: inline-block;
  font-family: 'JetBrains Mono', ui-monospace, monospace;
  font-variant-numeric: tabular-nums;
  font-size: 12.5px;
  font-weight: 600;
  letter-spacing: .08em;
  color: var(--primary);
  margin-bottom: 14px;
}
.step-n::before { content: '— '; color: var(--border-strong); }
.step h3 { font-size: 18px; letter-spacing: -.01em; font-weight: 600; margin: 0 0 8px; overflow-wrap: anywhere; word-break: normal; }
.step p { margin: 0; color: var(--text-2); font-size: 15px; line-height: 1.65; overflow-wrap: anywhere; word-break: normal; }

/* ───── PRICING ───── */
.pricing-toggle {
  display: inline-flex; align-items: center; gap: 0;
  background: var(--surface-2);
  border: 1px solid var(--border);
  border-radius: 999px;
  padding: 4px;
  margin: -28px auto 40px;
}
.pricing-toggle button {
  padding: 8px 22px; border: 0; background: transparent; cursor: pointer;
  font-size: 14px; font-weight: 600; color: var(--text-2);
  border-radius: 999px;
  transition: background var(--t-fast), color var(--t-fast);
}
.pricing-toggle button.active { background: var(--surface); color: var(--text); box-shadow: var(--shadow-xs); }
.pricing-toggle .save { color: var(--primary-2); font-size: 11px; margin-left: 4px; }
.center-flex { text-align: center; }

.tiers { display: grid; gap: 18px; grid-template-columns: 1fr; max-width: 920px; margin: 0 auto; }
@media (min-width: 720px) { .tiers { grid-template-columns: 1fr 1fr; } }
.tier {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--r-xl);
  padding: 36px 32px 32px;
  position: relative;
  transition: border-color var(--t-med), transform var(--t-med);
}
.tier:hover { border-color: var(--border-strong); transform: translateY(-1px); }
@media (max-width: 600px) {
  .tier { padding: 28px 24px 24px; border-radius: var(--r-lg); }
  .tier .price { font-size: 40px; }
  .tier .badge-pop { right: 20px; top: -10px; }
}
.tier.pro {
  background:
    radial-gradient(ellipse 480px 240px at 100% 0%, rgba(34,211,238,.28), transparent 60%),
    radial-gradient(ellipse 360px 200px at 0% 100%, rgba(20,184,166,.18), transparent 60%),
    #0a0e1a;
  border: 1px solid #1f2937;
  color: #f1f5f9;
  box-shadow:
    inset 0 1px 0 rgba(255,255,255,.06),
    0 0 0 1px rgba(99,102,241,.18),
    0 32px 64px -20px rgba(20,184,166,.32),
    0 8px 16px rgba(15,23,42,.18);
  position: relative;
}
.tier.pro::after {
  content: ''; position: absolute; inset: 0;
  border-radius: inherit;
  background: linear-gradient(135deg, rgba(99,102,241,.16), transparent 40%);
  pointer-events: none;
}
.tier.pro h3 { color: rgba(255,255,255,.55); }
.tier.pro .price { color: #fff; }
.tier.pro .price small { color: rgba(255,255,255,.5); }
.tier.pro .price-sub { color: rgba(255,255,255,.6); }
.tier.pro li { color: #f1f5f9; }
.tier.pro li::before {
  background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%2322d3ee' stroke-width='3.5' stroke-linecap='round' stroke-linejoin='round'><polyline points='20 6 9 17 4 12'/></svg>");
}
.tier .badge-pop {
  position: absolute; top: -10px; right: 24px;
  padding: 4px 11px;
  background: linear-gradient(135deg, #0d9488, #14b8a6, #22d3ee);
  color: #fff;
  font-size: 10.5px; font-weight: 600; letter-spacing: .12em; text-transform: uppercase;
  border-radius: 999px;
}
.tier h3 { font-size: 11.5px; letter-spacing: .14em; text-transform: uppercase; color: var(--muted); font-weight: 600; margin: 0 0 12px; }
.tier.pro h3 { color: rgba(255,255,255,.55); }
.tier .price { font-family: 'JetBrains Mono', ui-monospace, monospace; font-variant-numeric: tabular-nums; font-size: 44px; font-weight: 600; letter-spacing: -.03em; line-height: 1; margin: 12px 0 4px; }
.tier .price small { font-size: 18px; font-weight: 500; color: var(--muted); }
.tier .price-sub { color: var(--text-2); font-size: 14px; margin: 0 0 24px; }
.tier ul { list-style: none; padding: 0; margin: 0 0 28px; }
.tier li {
  padding: 8px 0 8px 28px;
  font-size: 14.5px;
  line-height: 1.55;
  color: var(--text);
  position: relative;
  overflow-wrap: anywhere;
  word-break: normal;
}
.tier li::before {
  content: ''; position: absolute; left: 0; top: 13px;
  width: 14px; height: 14px;
  background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%234f46e5' stroke-width='3.5' stroke-linecap='round' stroke-linejoin='round'><polyline points='20 6 9 17 4 12'/></svg>");
  background-size: contain; background-repeat: no-repeat;
  flex-shrink: 0;
}
.tier .price-sub { overflow-wrap: anywhere; }
.tier .cta {
  display: block; text-align: center; padding: 14px;
  border-radius: 12px;
  background: var(--surface); border: 1px solid var(--border-strong); color: var(--text);
  font-weight: 600; font-size: 14.5px;
  transition: border-color var(--t-fast), transform var(--t-fast), box-shadow var(--t-fast);
}
.tier .cta:hover { border-color: var(--text); transform: translateY(-1px); box-shadow: var(--shadow-xs); }
.tier.pro .cta {
  background: linear-gradient(180deg, #fff 0%, #f1f5f9 100%);
  color: var(--text); border: 0;
  box-shadow: var(--shadow-inset), 0 4px 12px rgba(15,23,42,.18);
}
.tier.pro .cta:hover { transform: translateY(-1px); filter: brightness(1.02); box-shadow: var(--shadow-inset), 0 12px 24px rgba(15,23,42,.24); }

.team-callout {
  max-width: 920px; margin: 28px auto 0;
  background: linear-gradient(135deg, var(--surface-2), var(--surface));
  border: 1px solid var(--border);
  border-radius: var(--r-lg);
  padding: 24px 28px;
  display: flex; align-items: center; gap: 22px;
  flex-wrap: wrap;
}
.team-callout .left { flex: 1; min-width: 260px; }
.team-callout .badge-soon {
  display: inline-block;
  font-size: 11px; font-weight: 700;
  letter-spacing: .05em; text-transform: uppercase;
  color: var(--primary-2); background: var(--primary-soft);
  padding: 3px 10px; border-radius: 999px;
  margin-bottom: 10px;
}
.team-callout h3 {
  margin: 0 0 6px; font-size: 17px;
  font-weight: 700; letter-spacing: -.01em;
}
.team-callout p {
  margin: 0; color: var(--text-2);
  font-size: 14px; line-height: 1.55;
}
.team-callout .right {
  display: flex; flex-direction: column; align-items: flex-end; gap: 8px;
}
.team-callout .price {
  font-size: 18px; font-weight: 700;
  color: var(--text); letter-spacing: -.02em;
}
.team-callout .cta {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 10px 18px;
  background: var(--text); color: white !important;
  border-radius: var(--r-sm);
  font-size: 13.5px; font-weight: 600;
  text-decoration: none;
  transition: background var(--t-fast), transform var(--t-fast);
}
.team-callout .cta:hover { background: #1e2939; transform: translateY(-1px); text-decoration: none; }
@media (max-width: 600px) {
  .team-callout { padding: 20px 22px; flex-direction: column; align-items: stretch; }
  .team-callout .right { align-items: flex-start; }
}

/* ───── CODE BLOCK ───── */
.code-section {
  background: linear-gradient(180deg, var(--bg) 0%, var(--bg-mesh) 50%, var(--bg) 100%);
  border-top: 1px solid var(--border);
  border-bottom: 1px solid var(--border);
}
.code-grid { display: grid; gap: 48px; grid-template-columns: 1fr; align-items: center; max-width: 1100px; margin: 0 auto; }
@media (min-width: 880px) { .code-grid { grid-template-columns: 1fr 1.2fr; gap: 64px; } }
.code-text h2 { text-align: left; font-size: clamp(26px, 3vw, 38px); margin-bottom: 16px; font-weight: 600; letter-spacing: -.025em; }
.code-text p { color: var(--text-2); font-size: 16px; margin: 0 0 14px; line-height: 1.65; }

.code-block {
  background: #0a0e1a;
  color: #cbd5e1;
  border-radius: var(--r-lg);
  border: 1px solid #1f2937;
  font-family: 'JetBrains Mono', ui-monospace, monospace;
  font-size: 13px;
  line-height: 1.7;
  overflow: hidden;
  box-shadow: 0 24px 48px -16px rgba(15,23,42,.20);
  position: relative;
  -webkit-overflow-scrolling: touch;
}
.code-block-bar {
  display: flex; align-items: center; gap: 8px;
  padding: 12px 18px;
  background: rgba(255,255,255,.025);
  border-bottom: 1px solid rgba(255,255,255,.06);
  font-size: 12px; color: #94a3b8;
  font-family: 'JetBrains Mono', ui-monospace, monospace;
}
.code-block-bar .dots { display: inline-flex; gap: 6px; margin-right: 4px; }
.code-block-bar .dots span { width: 9px; height: 9px; border-radius: 50%; background: rgba(255,255,255,.08); }
.code-block-bar .file { color: #cbd5e1; }
.code-block-bar .file strong { color: #fff; font-weight: 500; }
.code-block-body { padding: 22px 24px 24px; overflow-x: auto; }
.code-block pre { white-space: pre; margin: 0; }
@media (max-width: 600px) {
  .code-block-body { padding: 18px 16px 20px; }
  .code-block { font-size: 12px; }
}
.code-block .k { color: #c4b5fd; font-weight: 500; }
.code-block .s { color: #86efac; }
.code-block .c { color: #64748b; font-style: italic; }
.code-block .n { color: #fbbf24; }

/* ───── FAQ ───── */
.faq { max-width: 760px; margin: 0 auto; }
.faq { interpolate-size: allow-keywords; }
.faq details {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--r-md);
  padding: 20px 26px;
  margin-bottom: 10px;
  cursor: pointer;
  transition: border-color var(--t-fast), background var(--t-fast), box-shadow var(--t-fast);
  overflow: hidden;
}
.faq details:hover { border-color: var(--border-strong); }
.faq details[open] { border-color: var(--border-strong); background: var(--bg-soft); box-shadow: var(--shadow-xs); }
.faq summary {
  font-weight: 500; font-size: 15.5px; list-style: none; outline: none;
  display: flex; justify-content: space-between; align-items: center;
  gap: 14px;
  letter-spacing: -.005em; color: var(--text); cursor: pointer;
  overflow-wrap: anywhere; word-break: normal;
}
.faq summary > :first-child, .faq summary {
  /* allow text to wrap inside flex */
  min-width: 0;
}
.faq details[open] summary { color: var(--primary); }
@supports (interpolate-size: allow-keywords) {
  .faq details { height: auto; transition: height var(--t-slow), border-color var(--t-fast), background var(--t-fast); }
  .faq details[open] { height: auto; }
}
.faq summary::-webkit-details-marker { display: none; }
.faq summary::after {
  content: '';
  width: 11px; height: 11px;
  border-right: 2px solid var(--muted);
  border-bottom: 2px solid var(--muted);
  transform: rotate(45deg);
  transition: transform var(--t-fast);
  margin-right: 4px; margin-bottom: 4px;
  flex-shrink: 0;
}
.faq details[open] summary::after { transform: rotate(-135deg); margin-bottom: 0; margin-top: 4px; }
.faq details > p { margin: 14px 0 0; color: var(--text-2); font-size: 15px; line-height: 1.7; overflow-wrap: anywhere; word-break: normal; -webkit-hyphens: auto; hyphens: auto; }

/* ───── CTA BOTTOM ───── */
.cta-bottom {
  position: relative;
  text-align: center;
  padding: 128px 0;
  background:
    radial-gradient(ellipse 70% 50% at 50% 100%, rgba(20,184,166,.22), transparent 70%),
    radial-gradient(ellipse 50% 40% at 30% 0%, rgba(20,184,166,.18), transparent 70%),
    var(--text);
  color: white;
  overflow: hidden;
}
.cta-bottom::after {
  content: ''; position: absolute; left: 50%; top: 0; transform: translateX(-50%);
  width: min(720px, 86%); height: 1px;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,.18), transparent);
}
@media (max-width: 600px) { .cta-bottom { padding: 88px 0; } }
.cta-bottom h2 { color: white; margin-bottom: 16px; font-size: clamp(28px, 3.6vw, 40px); font-weight: 600; letter-spacing: -.03em; }
.cta-bottom h2 em { font-style: italic; font-weight: 400; color: rgba(255,255,255,.72); }
.cta-bottom p { color: rgba(255,255,255,.65); font-size: 16px; margin: 0 auto 36px; max-width: 480px; line-height: 1.6; }
.cta-bottom .hero-form { background: rgba(255,255,255,.06); border: 1px solid rgba(255,255,255,.12); box-shadow: 0 8px 32px rgba(0,0,0,.18); }
.cta-bottom .hero-form:focus-within { border-color: rgba(255,255,255,.32); box-shadow: 0 0 0 4px rgba(255,255,255,.06), 0 8px 32px rgba(0,0,0,.18); }
.cta-bottom .hero-form input { color: white; }
.cta-bottom .hero-form input::placeholder { color: rgba(255,255,255,.42); }
.cta-bottom .hero-form button { background: white; color: var(--text); font-weight: 500; }
.cta-bottom .hero-form button:hover { background: rgba(255,255,255,.92); box-shadow: 0 8px 16px rgba(255,255,255,.18); }

/* ───── FOOTER ───── */
footer {
  padding: 48px 0;
  border-top: 1px solid var(--border);
  background: linear-gradient(180deg, var(--bg-soft) 0%, var(--bg) 100%);
  font-size: 14px;
  color: var(--muted);
}
.foot-grid {
  display: grid; gap: 32px; grid-template-columns: 1fr;
}
@media (min-width: 720px) { .foot-grid { grid-template-columns: 2fr 1fr 1fr 1fr; } }
.foot-col h4 { font-size: 13px; text-transform: uppercase; letter-spacing: .08em; font-weight: 600; color: var(--text); margin: 0 0 14px; }
.foot-col ul { list-style: none; padding: 0; margin: 0; }
.foot-col li { padding: 4px 0; }
.foot-col a { color: var(--muted); transition: color var(--t-fast); }
.foot-col a:hover { color: var(--text); }
.foot-meta { color: var(--muted); font-size: 13.5px; line-height: 1.7; max-width: 320px; }
.foot-meta strong { color: var(--text); font-weight: 600; }
.foot-meta em { font-style: italic; color: var(--text-2); }
.foot-bottom { margin-top: 40px; padding-top: 24px; border-top: 1px solid var(--border); display: flex; justify-content: space-between; flex-wrap: wrap; gap: 12px; font-size: 12.5px; color: var(--muted); }
.foot-bottom .signature { font-style: italic; }

/* ───── PH LAUNCH BANNER ───── */
.ph-banner {
  background: linear-gradient(90deg, #da552f 0%, #ff6154 100%);
  color: #fff;
  text-align: center;
  padding: 10px 18px;
  font-size: 13.5px;
  font-weight: 500;
  letter-spacing: -0.005em;
  line-height: 1.45;
  position: relative;
  z-index: 60;
  text-wrap: balance;
  overflow-wrap: anywhere;
  word-break: normal;
}
.ph-banner a {
  color: #fff !important;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
  justify-content: center;
}
.ph-banner a:hover { text-decoration: underline; }
.ph-banner strong { font-weight: 700; }
.ph-banner .arrow { transition: transform var(--t-fast); display: inline-block; }
.ph-banner a:hover .arrow { transform: translateX(2px); }
@media (max-width: 600px) { .ph-banner { font-size: 12px; padding: 8px 14px; } }

/* ───── LANGUAGE SWITCHER ───── */
.lang-switch { position: relative; }
.lang-switch summary {
  list-style: none;
  display: inline-flex; align-items: center; gap: 6px;
  padding: 6px 10px;
  font-size: 13.5px; font-weight: 500;
  color: var(--text-2);
  cursor: pointer;
  border-radius: var(--r-sm);
  transition: background var(--t-fast), color var(--t-fast);
}
.lang-switch summary::-webkit-details-marker { display: none; }
.lang-switch summary::after {
  content: "";
  width: 8px; height: 8px;
  border-right: 1.5px solid currentColor;
  border-bottom: 1.5px solid currentColor;
  transform: rotate(45deg) translateY(-2px);
  transition: transform var(--t-fast);
  margin-left: 2px;
}
.lang-switch[open] summary::after { transform: rotate(-135deg) translateY(-2px); }
.lang-switch summary:hover { background: var(--surface-2); color: var(--text); }
.lang-switch[open] summary { background: var(--surface-2); color: var(--text); }
.lang-switch .menu {
  position: absolute; top: calc(100% + 6px); right: 0;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--r-md);
  box-shadow: var(--shadow-md);
  padding: 4px;
  min-width: 160px;
  z-index: 100;
}
.lang-switch .menu a {
  display: block;
  padding: 8px 12px;
  font-size: 14px;
  color: var(--text);
  border-radius: 6px;
  transition: background var(--t-fast);
}
.lang-switch .menu a:hover { background: var(--surface-2); }
.lang-switch .menu a.active { background: var(--primary-soft); color: var(--primary); font-weight: 600; }
@media (max-width: 720px) {
  .lang-switch .menu { right: auto; left: 0; }
}
`;

const ICONS = {
  bell: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.25" stroke-linecap="round" stroke-linejoin="round"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>',
  shield: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.25" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/></svg>',
  zap: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.25" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>',
  eye: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.25" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7z"/><circle cx="12" cy="12" r="3"/></svg>',
  cloud: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.25" stroke-linecap="round" stroke-linejoin="round"><path d="M17.5 19a4.5 4.5 0 1 0-3-7.9A6 6 0 0 0 3 12a4 4 0 0 0 4 4h10.5z"/></svg>',
  code: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.25" stroke-linecap="round" stroke-linejoin="round"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>',
  check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>',
};

function localeHref(locale: Locale): string {
  return locale === "en" ? "/" : `/${locale}`;
}

function renderLangSwitcher(currentLocale: Locale): string {
  const items = SUPPORTED_LOCALES.map((l) => {
    const meta = LOCALE_META[l];
    const active = l === currentLocale ? " active" : "";
    return `<a href="${localeHref(l)}" class="${active.trim()}" hreflang="${meta.htmlLang}">${meta.nativeName}</a>`;
  }).join("\n        ");
  return `<details class="lang-switch">
      <summary><span aria-hidden="true">🌐</span> ${LOCALE_META[currentLocale].nativeName}</summary>
      <div class="menu">
        ${items}
      </div>
    </details>`;
}

function renderHTML(t: Translations, locale: Locale, beacon: string): string {
  const htmlLang = LOCALE_META[locale].htmlLang;
  const canonical = `${ORIGIN}${locale === "en" ? "/" : `/${locale}`}`;
  const hreflangTags = SUPPORTED_LOCALES.map((l) => {
    const href = `${ORIGIN}${l === "en" ? "/" : `/${l}`}`;
    return `<link rel="alternate" hreflang="${LOCALE_META[l].htmlLang}" href="${href}">`;
  }).join("\n");

  const featuresHTML = t.features.map((f, i) => {
    const iconKeys = ["bell", "shield", "zap", "cloud", "eye", "code"] as const;
    const icon = ICONS[iconKeys[i] ?? "bell"];
    return `      <div class="feature">
        <div class="feature-icon">${icon}</div>
        <h3>${f.title}</h3>
        <p>${f.desc}</p>
      </div>`;
  }).join("\n");

  const stepsHTML = t.steps.map((s, i) => `      <div class="step">
        <div class="step-n">${String(i + 1).padStart(2, "0")}</div>
        <h3>${s.title}</h3>
        <p>${s.desc}</p>
      </div>`).join("\n");

  const freeFeaturesHTML = t.tier_free_features.map((f) => `          <li>${f}</li>`).join("\n");
  const proFeaturesHTML = t.tier_pro_features.map((f) => `          <li>${f}</li>`).join("\n");

  // GEO (Generative Engine Optimization) — JSON-LD structured data so AI engines
  // (ChatGPT, Perplexity, Claude, Gemini) can extract product facts cleanly.
  const stripText = (html: string) => html.replace(/<[^>]+>/g, "");
  const ldJson = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": `${ORIGIN}#org`,
        name: "FreeTier Sentinel",
        url: ORIGIN,
        logo: `${ORIGIN}/favicon.svg`,
        sameAs: ["https://github.com/wndnjs3865/freetier-sentinel"],
      },
      {
        "@type": "SoftwareApplication",
        "@id": `${ORIGIN}#product`,
        name: "FreeTier Sentinel",
        applicationCategory: "DeveloperApplication",
        operatingSystem: "Cloud / Web",
        description: t.description,
        url: ORIGIN,
        publisher: { "@id": `${ORIGIN}#org` },
        offers: [
          {
            "@type": "Offer",
            name: "Free",
            price: "0",
            priceCurrency: "USD",
            description: t.tier_free_sub,
          },
          {
            "@type": "Offer",
            name: "Pro",
            price: "5",
            priceCurrency: "USD",
            description: t.tier_pro_sub,
          },
        ],
      },
      {
        "@type": "FAQPage",
        mainEntity: t.faqs.map((f) => ({
          "@type": "Question",
          name: stripText(f.q),
          acceptedAnswer: { "@type": "Answer", text: stripText(f.a) },
        })),
      },
      {
        "@type": "WebSite",
        "@id": `${ORIGIN}#site`,
        url: ORIGIN,
        name: "FreeTier Sentinel",
        inLanguage: htmlLang,
        publisher: { "@id": `${ORIGIN}#org` },
      },
    ],
  };
  const ldJsonScript = `<script type="application/ld+json">${JSON.stringify(ldJson)}</script>`;

  const faqsHTML = t.faqs.map((f) => `      <details>
        <summary>${f.q}</summary>
        <p>${f.a}</p>
      </details>`).join("\n");

  return `<!DOCTYPE html>
<html lang="${htmlLang}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="google-site-verification" content="s8lC6HTB_lfX5toRWARssmpN5GcqR8IcFB23YwP7UdA">
<title>${t.title}</title>
<meta name="description" content="${t.description}">
<meta name="theme-color" content="#f6f8fc" media="(prefers-color-scheme: light)">
<meta name="theme-color" content="#0a0e1a" media="(prefers-color-scheme: dark)">
<meta name="color-scheme" content="light dark">
<meta property="og:title" content="${t.title}">
<meta property="og:description" content="${t.description}">
<meta property="og:type" content="website">
<meta property="og:url" content="${canonical}">
<meta property="og:locale" content="${htmlLang}">
<meta property="og:image" content="${ORIGIN}/og.png">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:image" content="${ORIGIN}/og.png">
<link rel="canonical" href="${canonical}">
${hreflangTags}
<link rel="alternate" hreflang="x-default" href="${ORIGIN}/">
<link rel="icon" type="image/svg+xml" href="/favicon.svg">
${ldJsonScript}
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="preconnect" href="https://api.fontshare.com" crossorigin>
<link rel="preconnect" href="https://buy.polar.sh">
<link rel="preconnect" href="https://www.clarity.ms">
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
<link href="https://api.fontshare.com/v2/css?f[]=satoshi@500,600,700&display=swap" rel="stylesheet">
<style>${CSS}</style>
${beacon}
</head>
<body>

<div class="ph-banner">
  <a href="https://www.producthunt.com/products/freetier-sentinel?launch=freetier-sentinel" target="_blank" rel="noopener">
    🚀 <strong>Launching on Product Hunt May 12</strong> — Notify me <span class="arrow">→</span>
  </a>
</div>

<nav class="nav">
  <div class="container nav-inner">
    <a href="${localeHref(locale)}" class="brand"><span class="brand-logo">F</span> FreeTier Sentinel</a>
    <div class="nav-links">
      <div class="nav-section-links">
        <a href="#features">${t.nav_features}</a>
        <a href="#pricing">${t.nav_pricing}</a>
        <a href="/changelog">Docs</a>
        <a href="https://github.com/wndnjs3865/freetier-sentinel" rel="noopener" target="_blank" class="nav-github" aria-label="GitHub repository">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 .3a12 12 0 0 0-3.8 23.4c.6.1.8-.3.8-.6v-2c-3.3.7-4-1.6-4-1.6-.6-1.4-1.4-1.8-1.4-1.8-1.1-.7.1-.7.1-.7 1.2.1 1.9 1.3 1.9 1.3 1.1 1.9 2.9 1.3 3.6 1 .1-.8.4-1.3.8-1.6-2.7-.3-5.5-1.3-5.5-6 0-1.3.5-2.4 1.3-3.2-.1-.4-.6-1.6.1-3.2 0 0 1-.3 3.3 1.2a11.5 11.5 0 0 1 6 0c2.3-1.5 3.3-1.2 3.3-1.2.7 1.6.2 2.8.1 3.2.8.8 1.3 1.9 1.3 3.2 0 4.6-2.8 5.6-5.5 5.9.5.4.8 1.1.8 2.3v3.4c0 .3.2.7.8.6A12 12 0 0 0 12 .3z"/></svg>
          <span>GitHub</span>
        </a>
      </div>
      ${renderLangSwitcher(locale)}
      <a href="/dash" class="nav-cta">${t.nav_signin}</a>
    </div>
  </div>
</nav>

<!-- PHFREE6MO promo banner — first 50 PH hunters (D-009) -->
<div style="background: linear-gradient(90deg, rgba(245,158,11,0.12), rgba(168,85,247,0.12)); border-bottom: 1px solid rgba(245,158,11,0.25); padding: 10px 16px; text-align: center; font-size: 13px; line-height: 1.5;">
  <span style="font-weight: 600;">🎟️ Product Hunt launch promo</span>
  <span style="color: #94a3b8; margin: 0 8px;">·</span>
  <span>First 50 sign-ups: <strong style="color: #fbbf24;">Pro free for 6 months</strong></span>
  <span style="color: #94a3b8; margin: 0 8px;">·</span>
  <span>Code <code style="background: rgba(0,0,0,0.4); padding: 2px 6px; border-radius: 4px; font-family: ui-monospace, Menlo, monospace; color: #fbbf24;">PHFREE6MO</code></span>
  <span style="color: #94a3b8; margin: 0 8px; display: inline-block;">·</span>
  <a href="https://buy.polar.sh/polar_cl_NZo8xnzthAKCBJcUMLXonHnSBzRdEN7pkGuWe2p34mV" style="color: #a855f7; font-weight: 600; text-decoration: none;">Claim now →</a>
  ${locale === "ko" ? '<br/><span style="color: #94a3b8; font-size: 12px;">🇰🇷 한국 사업자 — 영문 PDF invoice 자동 + 매출세금계산서 발급 가능 (사업자번호 607-20-94796)</span>' : ""}
</div>

<header class="hero">
  <div class="hero-grid"></div>
  <div class="container">
    <div class="eyebrow"><span class="pulse"></span> ${t.hero_eyebrow}<span class="line"></span></div>
    <h1>${t.hero_h1_line1} <span class="gradient">${t.hero_h1_line2}</span></h1>
    <p class="lede">${t.hero_sub_line1}<br>${t.hero_sub_line2}</p>
    <form class="hero-form" method="POST" action="/signup">
      <input name="email" type="email" placeholder="${t.hero_email_placeholder}" required autocomplete="email">
      <button type="submit">${t.hero_cta}</button>
    </form>
    <div class="micro">
      <span>${t.hero_micro_1}</span>
      <span class="sep">·</span>
      <span>${t.hero_micro_2}</span>
      <span class="sep">·</span>
      <span>${t.hero_micro_3}</span>
    </div>
    <!-- x402 paid API ribbon (agent economy, D-007) -->
    <div style="margin-top: 18px; display: inline-flex; align-items: center; gap: 8px; padding: 6px 14px; background: rgba(168,85,247,0.08); border: 1px solid rgba(168,85,247,0.25); border-radius: 999px; font-size: 12px; color: #c4b5fd;">
      <span>🪙</span>
      <span>Also: paid API for AI agents on Coinbase Bazaar</span>
      <a href="/docs/api" style="color: #a855f7; text-decoration: none; font-weight: 600;">→ docs</a>
    </div>
  </div>

  <div class="preview">
    <div class="preview-frame">
      <div class="preview-bar">
        <span class="dot"></span><span class="dot"></span><span class="dot"></span>
        <span class="url">freetier-sentinel.dev/events</span>
        <span class="live-tag">Live</span>
      </div>
      <div class="event-feed" role="log" aria-label="Sample free-tier usage events" aria-live="polite">
        <div class="ev ok"><span class="t">14:02:31</span><span class="p">cloudflare</span><span class="m">workers.req</span><span class="v">34,012 / 100,000 <span class="tag tag-ok">safe</span></span></div>
        <div class="ev ok"><span class="t">14:02:28</span><span class="p">github</span><span class="m">actions.minutes</span><span class="v">412 / 2,000 <span class="tag tag-ok">safe</span></span></div>
        <div class="ev warn"><span class="t">14:02:14</span><span class="p">vercel</span><span class="m">bandwidth</span><span class="v">82.4 / 100 GB <span class="tag tag-warn">warn</span> 18% left</span></div>
        <div class="ev warn"><span class="t">14:02:02</span><span class="p">resend</span><span class="m">emails.day</span><span class="v">73 / 100 sent <span class="tag tag-warn">80%</span></span></div>
        <div class="ev ok"><span class="t">14:01:58</span><span class="p">supabase</span><span class="m">db.size</span><span class="v">128 / 500 MB <span class="tag tag-ok">safe</span></span></div>
        <div class="ev err"><span class="t">14:01:46</span><span class="p">cf.workers</span><span class="m">requests</span><span class="v">10M / 10M <span class="tag tag-err">degraded</span> alert sent</span></div>
        <div class="ev ok"><span class="t">14:01:31</span><span class="p">neon</span><span class="m">compute.hours</span><span class="v">61 / 191 hrs <span class="tag tag-ok">safe</span></span></div>
      </div>
    </div>
  </div>

  <div class="proof-row reveal" aria-label="At-a-glance numbers">
    <div class="pf-stat">
      <span class="num" data-count="8">0</span>
      <span class="lbl">cloud providers monitored</span>
    </div>
    <div class="pf-stat">
      <span class="num" data-count="12847">0</span>
      <span class="lbl">free-tier limits tracked</span>
    </div>
    <div class="pf-stat">
      <span class="num" data-count="0" data-prefix="$">$0</span>
      <span class="lbl">surprise overage bills, so far</span>
    </div>
  </div>
</header>

<section class="why">
  <div class="why-inner reveal">
    <p class="section-eyebrow">${t.why_eyebrow}</p>
    <h2>${t.why_h2}</h2>
    <div class="why-body">
      <p>${t.why_p1_html}</p>
      <p>${t.why_p2_html}</p>
      <p>${t.why_p3_html}</p>
    </div>
    <p class="why-signature">${t.why_signature}</p>
  </div>
</section>

<section class="trust-row reveal" aria-label="Trust badges">
  <a class="trust-badge" href="https://github.com/wndnjs3865/freetier-sentinel" rel="noopener" target="_blank">
    <svg class="ico-gh" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 .3a12 12 0 0 0-3.8 23.4c.6.1.8-.3.8-.6v-2c-3.3.7-4-1.6-4-1.6-.6-1.4-1.4-1.8-1.4-1.8-1.1-.7.1-.7.1-.7 1.2.1 1.9 1.3 1.9 1.3 1.1 1.9 2.9 1.3 3.6 1 .1-.8.4-1.3.8-1.6-2.7-.3-5.5-1.3-5.5-6 0-1.3.5-2.4 1.3-3.2-.1-.4-.6-1.6.1-3.2 0 0 1-.3 3.3 1.2a11.5 11.5 0 0 1 6 0c2.3-1.5 3.3-1.2 3.3-1.2.7 1.6.2 2.8.1 3.2.8.8 1.3 1.9 1.3 3.2 0 4.6-2.8 5.6-5.5 5.9.5.4.8 1.1.8 2.3v3.4c0 .3.2.7.8.6A12 12 0 0 0 12 .3z"/></svg>
    Open source on GitHub
  </a>
  <a class="trust-badge" href="https://github.com/wndnjs3865/freetier-sentinel/blob/main/LICENSE" rel="noopener" target="_blank">
    <svg class="ico-mit" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.25" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/></svg>
    MIT licensed
  </a>
  <span class="trust-badge">
    <svg class="ico-cf" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.25" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M17.5 19a4.5 4.5 0 1 0-3-7.9A6 6 0 0 0 3 12a4 4 0 0 0 4 4h10.5z"/></svg>
    Built on Cloudflare Workers
  </span>
  <a class="trust-badge" href="/security">
    <svg class="ico-shield" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.25" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
    AES-256 · Read-only tokens
  </a>
</section>

<section class="strip">
  <div class="container">
    <div class="label">${t.strip_label}</div>
    <div class="strip-row">
      <span>Cloudflare</span>
      <span>GitHub Actions</span>
      <span>Vercel</span>
      <span class="more">+ 5 shipping in 2 weeks</span>
    </div>
  </div>
</section>

<section class="section" id="features">
  <div class="container">
    <p class="section-eyebrow center-flex" style="text-align:center;display:block">${t.features_eyebrow}</p>
    <h2>${t.features_h2_line1}<br>${t.features_h2_line2}</h2>
    <p class="sub">${t.features_sub}</p>
    <div class="features-grid">
${featuresHTML}
    </div>
  </div>
</section>

<section class="alerts-section" id="alerts-preview">
  <div class="container">
    <p class="section-eyebrow center-flex" style="text-align:center;display:block">${t.alerts_eyebrow}</p>
    <h2>${t.alerts_h2}</h2>
    <p class="sub">${t.alerts_sub}</p>
    <div class="alerts-grid reveal">
      <div class="alert-card">
        <div class="alert-card-head">
          <span class="ch-logo email">F</span>
          <span class="ch-name">Email</span>
          <time>14:02</time>
        </div>
        <div class="alert-card-body">
          <div class="from">noreply@freetier-sentinel.dev</div>
          <div class="subj">${t.alerts_email_subject}</div>
          <p class="body-text">${t.alerts_email_body_html}</p>
          <div class="react">
            <span class="pill">vercel.bandwidth</span>
            <span class="pill">82.4 / 100 GB</span>
          </div>
        </div>
      </div>

      <div class="alert-card">
        <div class="alert-card-head">
          <span class="ch-logo slack">S</span>
          <span class="ch-name">Slack · #alerts</span>
          <time>14:02</time>
        </div>
        <div class="alert-card-body">
          <div class="from">FreeTier Sentinel APP</div>
          <p class="body-text">${t.alerts_slack_text_html}</p>
          <div class="react">
            <span class="pill">cf.workers.req</span>
            <span class="pill">degraded</span>
          </div>
        </div>
      </div>

      <div class="alert-card">
        <div class="alert-card-head">
          <span class="ch-logo discord">D</span>
          <span class="ch-name">Discord · #ops</span>
          <time>14:02</time>
        </div>
        <div class="alert-card-body">
          <div class="from">FreeTier Sentinel BOT</div>
          <p class="body-text">${t.alerts_discord_text_html}</p>
          <div class="react">
            <span class="pill">resend.emails.day</span>
            <span class="pill">100/100</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</section>

<section class="how section" id="how">
  <div class="container">
    <p class="section-eyebrow center-flex" style="text-align:center;display:block">${t.how_eyebrow}</p>
    <h2>${t.how_h2}</h2>
    <p class="sub">${t.how_sub}</p>
    <div class="steps-grid">
${stepsHTML}
    </div>
  </div>
</section>

<section class="section" id="pricing">
  <div class="container">
    <p class="section-eyebrow center-flex" style="text-align:center;display:block">${t.pricing_eyebrow}</p>
    <h2>${t.pricing_h2}</h2>
    <p class="sub">${t.pricing_sub}</p>
    <p class="sub" style="margin-top:-8px;font-size:14px;color:var(--ok)">✓ ${t.pricing_guarantee}</p>

    <div class="tiers">
      <div class="tier">
        <h3>${t.tier_free_label}</h3>
        <div class="price">$0<small> ${t.tier_per}</small></div>
        <p class="price-sub">${t.tier_free_sub}</p>
        <ul>
${freeFeaturesHTML}
        </ul>
        <a href="#" onclick="document.querySelector('.hero-form input').focus(); window.scrollTo({top:0,behavior:'smooth'}); return false;" class="cta">${t.tier_free_cta}</a>
      </div>
      <div class="tier pro">
        <span class="badge-pop">${t.tier_pro_badge}</span>
        <h3>${t.tier_pro_label}</h3>
        <div class="price">$5<small> ${t.tier_per}</small></div>
        <p class="price-sub">${t.tier_pro_sub}</p>
        <ul>
${proFeaturesHTML}
        </ul>
        <a href="https://buy.polar.sh/polar_cl_NZo8xnzthAKCBJcUMLXonHnSBzRdEN7pkGuWe2p34mV" class="cta">${t.tier_pro_cta} →</a>
        <div style="margin-top: 10px; font-size: 11px; color: #fbbf24; text-align: center;">
          🎟️ Use code <code style="background: rgba(0,0,0,0.3); padding: 2px 6px; border-radius: 4px; font-family: ui-monospace, Menlo, monospace;">PHFREE6MO</code> · first 50 PH hunters · 6 months free
        </div>
      </div>
    </div>

    <div class="team-callout">
      <div class="left">
        <span class="badge-soon">${t.team_callout_badge}</span>
        <h3>${t.team_callout_title}</h3>
        <p>${t.team_callout_desc}</p>
      </div>
      <div class="right">
        <span class="price">${t.team_callout_price}</span>
        <a href="mailto:wndnjs3865@gmail.com?subject=FreeTier%20Sentinel%20Team%20Tier%20Interest&body=Please%20notify%20me%20when%20the%20Team%20tier%20is%20available." class="cta">${t.team_callout_cta}</a>
      </div>
    </div>
  </div>
</section>

<section class="code-section section">
  <div class="container">
    <div class="code-grid">
      <div class="code-text">
        <p class="section-eyebrow">${t.code_eyebrow}</p>
        <h2>${t.code_h2}</h2>
        <p>${t.code_p1}</p>
        <p>${t.code_p2}</p>
      </div>
      <div class="code-block">
        <div class="code-block-bar">
          <span class="dots"><span></span><span></span><span></span></span>
          <span class="file">src/jobs/<strong>check.ts</strong></span>
        </div>
        <div class="code-block-body"><pre><span class="c">// runs every 6 hours on Cloudflare Cron Triggers</span>
<span class="k">export default</span> {
  <span class="k">async scheduled</span>(_evt, env, ctx) {
    <span class="k">const</span> services = <span class="k">await</span> env.DB
      .prepare(<span class="s">"SELECT * FROM services"</span>)
      .all();

    <span class="k">for</span> (<span class="k">const</span> s <span class="k">of</span> services.results) {
      <span class="k">const</span> usage = <span class="k">await</span> fetchUsage(s);
      <span class="k">if</span> (usage &gt;= s.threshold_pct) {
        <span class="k">await</span> sendAlert(env, s, usage);
      }
    }
  }
};</pre></div>
      </div>
    </div>
  </div>
</section>

<section class="section" id="faq">
  <div class="container">
    <p class="section-eyebrow center-flex" style="text-align:center;display:block">${t.faq_eyebrow}</p>
    <h2>${t.faq_h2}</h2>
    <p class="sub">${t.faq_sub}</p>

    <div class="faq">
${faqsHTML}
    </div>
  </div>
</section>

<section class="cta-bottom">
  <div class="container-narrow">
    <h2>${t.cta_h2}</h2>
    <p>${t.cta_p}</p>
    <form class="hero-form" method="POST" action="/signup">
      <input name="email" type="email" placeholder="${t.hero_email_placeholder}" required autocomplete="email">
      <button type="submit">${t.cta_button}</button>
    </form>
  </div>
</section>

<script>
// Scroll-reveal + count-up animation.
// Both respect prefers-reduced-motion (CSS handles transitions; counter snaps to final).
(function () {
  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  function animateCount(el) {
    var target = parseFloat(el.getAttribute('data-count')) || 0;
    var prefix = el.getAttribute('data-prefix') || '';
    var suffix = el.getAttribute('data-suffix') || '';
    if (reduceMotion || target === 0) { el.textContent = prefix + target.toLocaleString('en-US') + suffix; return; }
    var dur = 1400; var t0 = null;
    function step(ts) {
      if (!t0) t0 = ts;
      var p = Math.min(1, (ts - t0) / dur);
      // ease-out-cubic
      var eased = 1 - Math.pow(1 - p, 3);
      var v = Math.floor(target * eased);
      el.textContent = prefix + v.toLocaleString('en-US') + suffix;
      if (p < 1) requestAnimationFrame(step);
      else el.textContent = prefix + target.toLocaleString('en-US') + suffix;
    }
    requestAnimationFrame(step);
  }
  if (!('IntersectionObserver' in window)) {
    document.querySelectorAll('.reveal').forEach(function (el) { el.classList.add('in'); });
    document.querySelectorAll('[data-count]').forEach(function (el) { animateCount(el); });
    return;
  }
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (!e.isIntersecting) return;
      e.target.classList.add('in');
      e.target.querySelectorAll && e.target.querySelectorAll('[data-count]').forEach(function (el) { animateCount(el); });
      io.unobserve(e.target);
    });
  }, { rootMargin: '0px 0px -10% 0px', threshold: 0.05 });
  document.querySelectorAll('.reveal').forEach(function (el) { io.observe(el); });
})();
</script>

<footer>
  <div class="container">
    <div class="foot-grid">
      <div class="foot-col">
        <p class="foot-meta">${t.footer_tagline}</p>
      </div>
      <div class="foot-col">
        <h4>${t.footer_product}</h4>
        <ul>
          <li><a href="#features">${t.nav_features}</a></li>
          <li><a href="#pricing">${t.nav_pricing}</a></li>
          <li><a href="#faq">${t.nav_faq}</a></li>
          <li><a href="/dash">${t.footer_signin}</a></li>
        </ul>
      </div>
      <div class="foot-col">
        <h4>${t.footer_oss}</h4>
        <ul>
          <li><a href="https://github.com/wndnjs3865/freetier-sentinel">GitHub</a></li>
          <li><a href="https://github.com/wndnjs3865/freetier-sentinel/issues">Issues</a></li>
          <li><a href="/changelog">Changelog</a></li>
          <li><a href="/privacy">Privacy</a></li>
          <li><a href="/terms">Terms</a></li>
        </ul>
      </div>
      <div class="foot-col">
        <h4>${t.footer_resources}</h4>
        <ul>
          <li><a href="/vs/datadog">${t.footer_compare_datadog}</a></li>
          <li><a href="/security">${t.footer_security}</a></li>
          <li><a href="https://github.com/wndnjs3865/freetier-sentinel">GitHub</a></li>
          <li><a href="mailto:wndnjs3865@gmail.com">Support</a></li>
        </ul>
      </div>
    </div>
    <div class="container foot-bottom">
      <span>© 2026 FreeTier Sentinel · ${t.footer_built}</span>
      <span class="signature">Built solo, in Seoul.</span>
    </div>
  </div>
</footer>

</body>
</html>`;
}

export async function handleRoot(req: Request, env: Env): Promise<Response> {
  const url = new URL(req.url);
  const locale = getLocaleFromPath(url.pathname);
  const t = T[locale];
  const beacon = analyticsHeads(env);
  return new Response(renderHTML(t, locale, beacon), {
    headers: {
      "content-type": "text/html; charset=utf-8",
      "cache-control": "public, max-age=300, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
