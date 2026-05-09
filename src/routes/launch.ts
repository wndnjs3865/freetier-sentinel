/**
 * /launch/* — Product Hunt visual gallery mockups (5/12 PH launch).
 *
 * Each route renders a self-contained 1280×720 (16:9 PH-friendly) marketing
 * composition. Users open the page in a browser and capture a screenshot
 * (Cmd+Shift+4 / Snip / DevTools "Capture node screenshot") to upload to
 * the PH gallery.
 *
 * No headless-browser dependency required — these pages ARE the visual.
 */
import type { Env } from "../index";

const SHARED_HEAD = `<meta charset="utf-8">
<meta name="viewport" content="width=1280">
<meta name="robots" content="noindex,nofollow">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="preconnect" href="https://api.fontshare.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet">
<link href="https://api.fontshare.com/v2/css?f[]=satoshi@500,600,700&display=swap" rel="stylesheet">`;

const SHARED_CSS = `
:root {
  --bg: #f6f8fc; --surface: #fff; --surface-2: #eef2fa;
  --text: #0a0e1a; --text-2: #424b62; --muted: #64748b;
  --border: #dde3ee; --border-strong: #c4cdde;
  --primary: #14b8a6; --primary-2: #0d9488; --primary-3: #2dd4bf; --primary-soft: #ccfbf1;
  --accent: #22d3ee;
  --ok: #10b981; --warn: #f59e0b; --crit: #f43f5e;
  --grad-1: linear-gradient(135deg, #0d9488 0%, #14b8a6 50%, #22d3ee 100%);
  --grad-text: linear-gradient(120deg, #0d9488 0%, #14b8a6 60%, #2dd4bf 90%, #22d3ee 100%);
  --shadow-glass: 0 24px 48px -16px rgba(20,184,166,.20), 0 1px 0 rgba(20,184,166,.06);
  --font-display: 'Satoshi','Inter',-apple-system,system-ui,sans-serif;
  --font-body: 'Inter',-apple-system,system-ui,sans-serif;
  --font-mono: 'JetBrains Mono',ui-monospace,monospace;
}
* { box-sizing: border-box; margin: 0; padding: 0; }
html, body { width: 1280px; height: 720px; overflow: hidden; }
body {
  font-family: var(--font-body);
  background: var(--bg);
  color: var(--text);
  -webkit-font-smoothing: antialiased;
  font-feature-settings: 'cv02','cv03','cv11','ss01';
  position: relative;
}
body::before {
  content: ''; position: absolute; inset: 0;
  background:
    radial-gradient(ellipse 1100px 550px at 50% -120px, rgba(20,184,166,.10), transparent 60%),
    radial-gradient(ellipse 600px 400px at 88% 100px, rgba(34,211,238,.08), transparent 65%),
    radial-gradient(ellipse 700px 500px at 12% 220px, rgba(13,148,136,.06), transparent 70%);
  pointer-events: none;
}
.frame { position: relative; width: 1280px; height: 720px; padding: 64px; }
.brand { display: inline-flex; align-items: center; gap: 10px; font-weight: 600; font-size: 17px; letter-spacing: -.01em; color: var(--text); text-decoration: none; }
a.brand, a.brand:hover, a.brand:visited { color: var(--text); text-decoration: none; }
.brand-logo { width: 26px; height: 26px; border-radius: 7px; background: var(--grad-1); color: white; display: inline-flex; align-items: center; justify-content: center; font-size: 14px; font-weight: 800; box-shadow: inset 0 1px 0 rgba(255,255,255,.18); }
.eyebrow {
  display: inline-flex; align-items: center; gap: 10px;
  padding: 7px 14px;
  background: rgba(255,255,255,.86);
  border: 1px solid var(--border);
  border-radius: 999px;
  font-size: 12.5px; font-weight: 500; color: var(--text-2);
  letter-spacing: .015em;
  backdrop-filter: blur(8px);
  box-shadow: 0 1px 2px rgba(20,184,166,.05);
}
.eyebrow .pulse { width: 7px; height: 7px; background: var(--ok); border-radius: 50%; box-shadow: 0 0 0 4px rgba(16,185,129,.18), 0 0 12px rgba(16,185,129,.55); }
h1.headline { font-family: var(--font-display); font-size: 64px; font-weight: 700; letter-spacing: -.04em; line-height: 1.05; max-width: 720px; }
h1.headline .grad { background: var(--grad-text); -webkit-background-clip: text; background-clip: text; -webkit-text-fill-color: transparent; color: transparent; font-style: italic; font-weight: 600; }
.lede { color: var(--text-2); font-size: 19px; line-height: 1.55; max-width: 540px; margin-top: 20px; }
.lede em { color: var(--text); font-weight: 500; font-style: italic; }
.tag-row { display: inline-flex; gap: 8px; margin-top: 28px; }
.tag-row .tag {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 6px 12px;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 999px;
  font-size: 12.5px; font-weight: 500; color: var(--text-2);
}
.tag-row .tag svg { width: 13px; height: 13px; color: var(--primary); }
.url {
  position: absolute; bottom: 32px; right: 64px;
  font-family: var(--font-mono); font-size: 13px; color: var(--muted);
  letter-spacing: .04em;
}
`;

// /launch/demo — 30-second animated narrative for PH gallery video slot.
// 6-scene sequencer:
//   0-2s   white fade-in
//   2-5s   Hero brand intro
//   5-14s  Live real-time monitoring (7 rows @ 1.1s + DEGRADED pulse)
//   14-20s Dashboard glance (73% bar fills)
//   20-27s Alert channels (3 cards stagger)
//   27-30s Outro (dark teal gradient + URL)
export async function handleLaunchDemo(_req: Request, _env: Env): Promise<Response> {
  const html = `<!DOCTYPE html><html lang="en"><head>${SHARED_HEAD}
<title>FreeTier Sentinel — 30s</title>
<style>${SHARED_CSS}
.scene { position: absolute; inset: 0; opacity: 0; transition: opacity 800ms cubic-bezier(.16,1,.3,1); display: flex; align-items: center; justify-content: center; will-change: opacity; }
.scene.in { opacity: 1; }

/* Scene 0 — Pure white fade-in (start state) */
#s0 { background: #ffffff; opacity: 1; }
#s0.out { opacity: 0; transition: opacity 1200ms cubic-bezier(.4,0,.2,1); }

/* Scene 1 — Hero brand intro (mint-tinted minimalist) */
/* IMPORTANT: do NOT override position here — base .scene is absolute inset:0. */
#s1 { background: linear-gradient(160deg, #ffffff 0%, #f0fdfa 50%, #ccfbf1 100%); flex-direction: column; gap: 28px; padding: 64px; }
#s1::before { content: ''; position: absolute; inset: 0; background: radial-gradient(ellipse 800px 500px at 50% 10%, rgba(20,184,166,.08), transparent 60%), radial-gradient(ellipse 500px 350px at 80% 90%, rgba(34,211,238,.06), transparent 60%); pointer-events: none; }
#s1 > * { position: relative; z-index: 1; }
#s1 .brand { font-size: 22px; opacity: 0; transform: translateY(-6px); transition: opacity 700ms cubic-bezier(.16,1,.3,1) 200ms, transform 700ms cubic-bezier(.16,1,.3,1) 200ms; }
#s1 .brand-logo { width: 36px; height: 36px; font-size: 18px; }
#s1 h1 { font-family: var(--font-display); font-size: 88px; font-weight: 700; letter-spacing: -.045em; line-height: 1.02; text-align: center; max-width: 1100px; opacity: 0; transform: translateY(8px); transition: opacity 800ms cubic-bezier(.16,1,.3,1) 500ms, transform 800ms cubic-bezier(.16,1,.3,1) 500ms; }
#s1 h1 .grad { background: var(--grad-text); -webkit-background-clip: text; background-clip: text; -webkit-text-fill-color: transparent; color: transparent; font-style: italic; font-weight: 600; }
#s1 .lede { font-size: 22px; color: var(--text-2); max-width: 720px; text-align: center; line-height: 1.55; opacity: 0; transform: translateY(8px); transition: opacity 700ms cubic-bezier(.16,1,.3,1) 900ms, transform 700ms cubic-bezier(.16,1,.3,1) 900ms; }
#s1 .lede em { color: var(--text); font-weight: 500; font-style: italic; }
#s1.in .brand, #s1.in h1, #s1.in .lede { opacity: 1; transform: translateY(0); }

/* Scene 2 — Live event feed populates row by row */
#s2 { background: linear-gradient(180deg, #f6f8fc 0%, #eef2fa 100%); flex-direction: column; padding: 56px 64px; gap: 28px; }
#s2 .header { display: flex; align-items: center; gap: 14px; }
#s2 .label { font-size: 13.5px; font-weight: 600; color: var(--primary); text-transform: uppercase; letter-spacing: .18em; display: inline-flex; align-items: center; gap: 10px; }
#s2 .label::before { content: ''; width: 7px; height: 7px; background: var(--primary); border-radius: 50%; box-shadow: 0 0 0 4px rgba(20,184,166,.16); animation: pulse-teal 2s infinite; }
@keyframes pulse-teal { 0%, 100% { box-shadow: 0 0 0 4px rgba(20,184,166,.18); } 50% { box-shadow: 0 0 0 8px rgba(20,184,166,.06); } }
#s2 .preview-frame { background: #0a0e1a; border-radius: 24px; border: 1px solid rgba(255,255,255,.08); width: 1080px; box-shadow: 0 32px 64px -24px rgba(20,184,166,.32), inset 0 1px 0 rgba(255,255,255,.06); overflow: hidden; }
#s2 .bar { display: flex; align-items: center; gap: 8px; padding: 14px 22px; background: #111827; border-bottom: 1px solid #1f2937; }
#s2 .bar .dots { display: inline-flex; gap: 6px; }
#s2 .bar .dot { width: 10px; height: 10px; border-radius: 50%; opacity: .7; }
#s2 .bar .dot:nth-child(1) { background: #ef4444; }
#s2 .bar .dot:nth-child(2) { background: #f59e0b; }
#s2 .bar .dot:nth-child(3) { background: #22c55e; }
#s2 .bar .url { margin-left: 14px; padding: 4px 10px; background: rgba(255,255,255,.04); border: 1px solid rgba(255,255,255,.08); border-radius: 6px; font-size: 12px; color: #94a3b8; font-family: var(--font-mono); }
#s2 .bar .live { margin-left: auto; font-size: 11px; color: #4ade80; font-weight: 600; letter-spacing: .04em; text-transform: uppercase; display: inline-flex; align-items: center; gap: 6px; }
#s2 .bar .live::before { content: ''; width: 6px; height: 6px; background: #4ade80; border-radius: 50%; box-shadow: 0 0 0 3px rgba(74,222,128,.18); animation: pulse-green 2s infinite; }
@keyframes pulse-green { 0%, 100% { box-shadow: 0 0 0 3px rgba(74,222,128,.20); } 50% { box-shadow: 0 0 0 6px rgba(74,222,128,.10); } }
#s2 .feed { padding: 24px 26px; font-family: var(--font-mono); font-variant-numeric: tabular-nums; font-size: 16px; color: #cbd5e1; line-height: 2; }
#s2 .ev { display: grid; grid-template-columns: 80px 110px 1fr auto; column-gap: 16px; align-items: baseline; opacity: 0; transform: translateY(6px); transition: opacity 380ms cubic-bezier(.16,1,.3,1), transform 380ms cubic-bezier(.16,1,.3,1); }
#s2 .ev.show { opacity: 1; transform: none; }
#s2 .ev .t { color: #64748b; }
#s2 .ev .p { color: #5eead4; }
#s2 .ev .m { color: #cbd5e1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
#s2 .ev .v { display: inline-flex; align-items: center; gap: 8px; }
#s2 .tag { display: inline-block; padding: 1px 9px; border-radius: 999px; font-size: 11.5px; font-weight: 700; letter-spacing: .06em; text-transform: uppercase; }
#s2 .tag-ok { background: rgba(16,185,129,.14); color: #34d399; box-shadow: 0 0 0 1px rgba(16,185,129,.28); }
#s2 .tag-warn { background: rgba(245,158,11,.14); color: #fbbf24; box-shadow: 0 0 0 1px rgba(245,158,11,.28), 0 0 8px rgba(245,158,11,.20); }
#s2 .tag-err { background: rgba(244,63,94,.16); color: #fb7185; box-shadow: 0 0 0 1px rgba(244,63,94,.36), 0 0 14px rgba(244,63,94,.45); animation: pulse-err 1.5s ease-in-out infinite; }
@keyframes pulse-err { 0%, 100% { box-shadow: 0 0 0 1px rgba(244,63,94,.36), 0 0 12px rgba(244,63,94,.40); } 50% { box-shadow: 0 0 0 1px rgba(244,63,94,.55), 0 0 22px rgba(244,63,94,.60); } }

/* Scene 3 — Dashboard glance */
#s3 { background: #f6f8fc; flex-direction: column; padding: 56px 64px; align-items: stretch; gap: 24px; }
#s3 .top { display: flex; justify-content: space-between; align-items: center; }
#s3 h2 { font-family: var(--font-display); font-size: 32px; font-weight: 600; letter-spacing: -.02em; }
#s3 .sub { color: var(--muted); font-size: 16px; margin-top: 4px; }
#s3 .stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 18px; }
#s3 .stat { background: #fff; border: 1px solid var(--border); border-radius: 16px; padding: 24px; box-shadow: inset 0 1px 0 rgba(255,255,255,.5), 0 10px 15px -3px rgba(15,23,42,.10); }
#s3 .stat .lbl { font-size: 12px; color: var(--muted); text-transform: uppercase; letter-spacing: .14em; font-weight: 600; margin-bottom: 14px; }
#s3 .stat .val { font-family: var(--font-mono); font-variant-numeric: tabular-nums; font-size: 56px; font-weight: 600; letter-spacing: -.035em; line-height: 1; color: var(--text); }
#s3 .stat .delta { color: var(--muted); font-size: 13px; margin-top: 12px; }
#s3 .svc { background: #fff; border: 1px solid var(--border); border-radius: 16px; padding: 22px 26px; display: grid; grid-template-columns: 36px 1.5fr auto 1fr 80px; column-gap: 18px; align-items: center; box-shadow: inset 0 1px 0 rgba(255,255,255,.5), 0 4px 8px -2px rgba(15,23,42,.06); }
#s3 .svc-logo { width: 36px; height: 36px; border-radius: 10px; background: linear-gradient(135deg, #f6821f, #fbad41); display: inline-flex; align-items: center; justify-content: center; color: #fff; font-weight: 700; font-size: 13px; }
#s3 .svc-name { font-weight: 600; font-size: 16px; }
#s3 .svc-name small { display: block; color: var(--muted); font-size: 11.5px; text-transform: uppercase; letter-spacing: .04em; margin-top: 2px; }
#s3 .pill-warn { padding: 4px 11px; border-radius: 999px; font-size: 11.5px; font-weight: 600; text-transform: uppercase; letter-spacing: .06em; background: rgba(245,158,11,.14); color: #b45309; box-shadow: 0 0 8px rgba(245,158,11,.25), 0 0 0 1px rgba(245,158,11,.25); display: inline-flex; align-items: center; gap: 5px; }
#s3 .pill-warn::before { content: ''; width: 5px; height: 5px; border-radius: 50%; background: currentColor; }
#s3 .bar-wrap { display: flex; align-items: center; gap: 12px; }
#s3 .bar-track { flex: 1; height: 10px; background: var(--surface-2); border-radius: 999px; overflow: hidden; box-shadow: inset 0 1px 2px rgba(15,23,42,.05); }
#s3 .bar-fill { display: block; height: 100%; width: 0; background: linear-gradient(90deg, #f59e0b, #fb923c); border-radius: 999px; transition: width 1400ms cubic-bezier(.16,1,.3,1); box-shadow: 0 0 12px rgba(245,158,11,.45); }
#s3 .bar-pct { font-family: var(--font-mono); font-variant-numeric: tabular-nums; font-size: 17px; font-weight: 600; color: var(--warn); min-width: 50px; text-align: right; }
#s3 .time { font-family: var(--font-mono); font-size: 13px; color: var(--muted); }

/* Scene 4 — Alert ping */
#s4 { background: linear-gradient(135deg, #f6f8fc 0%, #eef2fa 100%); flex-direction: column; padding: 56px 64px; gap: 24px; align-items: stretch; justify-content: flex-start; }
#s4 .header { display: flex; align-items: center; gap: 14px; }
#s4 .label { font-size: 13.5px; font-weight: 600; color: var(--primary); text-transform: uppercase; letter-spacing: .18em; display: inline-flex; align-items: center; gap: 10px; }
#s4 .label::before { content: ''; width: 7px; height: 7px; background: var(--primary); border-radius: 50%; box-shadow: 0 0 0 4px rgba(20,184,166,.16); animation: pulse-teal 2s infinite; }
#s4 h2 { font-family: var(--font-display); font-size: 44px; font-weight: 700; letter-spacing: -.025em; line-height: 1.1; max-width: 900px; }
#s4 h2 em { background: var(--grad-text); -webkit-background-clip: text; background-clip: text; -webkit-text-fill-color: transparent; color: transparent; font-style: italic; font-weight: 600; }
#s4 .grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 22px; max-width: 1150px; }
#s4 .card { background: #fff; border: 1px solid var(--border); border-radius: 18px; overflow: hidden; box-shadow: 0 16px 28px -12px rgba(20,184,166,.16), inset 0 1px 0 rgba(255,255,255,.6); opacity: 0; transform: translateY(12px); transition: opacity 480ms cubic-bezier(.16,1,.3,1), transform 480ms cubic-bezier(.16,1,.3,1); }
#s4 .card.show { opacity: 1; transform: none; }
#s4 .head { display: flex; align-items: center; gap: 11px; padding: 16px 20px; border-bottom: 1px solid var(--border); font-size: 12px; font-weight: 500; color: var(--muted); letter-spacing: .04em; text-transform: uppercase; }
#s4 .ch-logo { width: 26px; height: 26px; border-radius: 7px; display: inline-flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 700; color: #fff; }
#s4 .ch-logo.email { background: var(--text); }
#s4 .ch-logo.slack { background: #4a154b; }
#s4 .ch-logo.discord { background: #5865f2; }
#s4 .ch-name { font-weight: 600; color: var(--text); text-transform: none; letter-spacing: -.005em; font-size: 13px; }
#s4 time { margin-left: auto; font-family: var(--font-mono); font-size: 12px; color: var(--muted); text-transform: none; }
#s4 .body { padding: 20px 22px; min-height: 180px; display: flex; flex-direction: column; gap: 10px; }
#s4 .from { font-size: 12.5px; color: var(--muted); font-family: var(--font-mono); }
#s4 .subj { font-size: 15px; font-weight: 600; color: var(--text); line-height: 1.4; }
#s4 .body-text { font-size: 14px; color: var(--text-2); line-height: 1.6; }
#s4 .body-text strong { color: var(--text); font-variant-numeric: tabular-nums; }
#s4 .body-text em { color: var(--muted); font-style: italic; }
#s4 .react { display: flex; flex-wrap: wrap; gap: 8px; margin-top: auto; padding-top: 12px; border-top: 1px dashed var(--border); }
#s4 .pill-mono { padding: 3px 10px; border-radius: 999px; background: var(--surface-2); border: 1px solid var(--border); font-family: var(--font-mono); font-size: 11.5px; color: var(--text-2); }
#s4 .tag-err-inline { display: inline-block; padding: 1px 9px; border-radius: 999px; font-size: 10.5px; font-weight: 700; letter-spacing: .06em; text-transform: uppercase; background: rgba(244,63,94,.14); color: #be123c; box-shadow: 0 0 12px rgba(244,63,94,.32), 0 0 0 1px rgba(244,63,94,.30); }

/* Scene 5 — Outro brand (deep teal premium) */
#s5 {
  background:
    radial-gradient(ellipse 1200px 800px at 75% 20%, rgba(34,211,238,.22), transparent 55%),
    radial-gradient(ellipse 900px 600px at 25% 80%, rgba(20,184,166,.18), transparent 55%),
    linear-gradient(135deg, #04211f 0%, #0a3030 35%, #0d9488 100%);
  color: #fff;
  flex-direction: column;
  gap: 36px;
}
#s5::before { content: ''; position: absolute; inset: 0; background: radial-gradient(circle at 50% 30%, rgba(255,255,255,.04), transparent 50%); pointer-events: none; }
#s5::after { content: ''; position: absolute; left: 50%; transform: translateX(-50%); top: 0; width: min(720px, 60%); height: 1px; background: linear-gradient(90deg, transparent, rgba(94,234,212,.28), transparent); }
#s5 .brand { font-size: 24px; color: #fff; opacity: 0; transform: translateY(-6px); transition: opacity 700ms cubic-bezier(.16,1,.3,1) 200ms, transform 700ms cubic-bezier(.16,1,.3,1) 200ms; }
#s5 .brand-logo { width: 40px; height: 40px; font-size: 19px; box-shadow: inset 0 1px 0 rgba(255,255,255,.18), 0 8px 24px rgba(20,184,166,.40); }
#s5 h2 {
  font-family: var(--font-display);
  font-size: 80px; font-weight: 700;
  letter-spacing: -.04em; line-height: 1.04;
  text-align: center; max-width: 1000px;
  position: relative; z-index: 1;
  opacity: 0; transform: translateY(8px);
  transition: opacity 800ms cubic-bezier(.16,1,.3,1) 500ms, transform 800ms cubic-bezier(.16,1,.3,1) 500ms;
  text-shadow: 0 8px 32px rgba(0,0,0,.32);
}
#s5 h2 .grad { background: linear-gradient(120deg, #5eead4 0%, #2dd4bf 50%, #22d3ee 100%); -webkit-background-clip: text; background-clip: text; -webkit-text-fill-color: transparent; color: transparent; font-style: italic; font-weight: 600; filter: drop-shadow(0 0 24px rgba(34,211,238,.45)); }
#s5 .url-line {
  font-family: var(--font-mono); font-size: 20px;
  color: #5eead4; letter-spacing: .12em;
  position: relative; z-index: 1;
  opacity: 0; transform: translateY(6px);
  transition: opacity 700ms cubic-bezier(.16,1,.3,1) 1000ms, transform 700ms cubic-bezier(.16,1,.3,1) 1000ms;
  text-shadow: 0 0 20px rgba(34,211,238,.45);
}
#s5.in .brand, #s5.in h2, #s5.in .url-line { opacity: 1; transform: translateY(0); }
</style></head>
<body>

<!-- Scene 0 — White fade-in (0–2s) — covers everything until s1 takes over -->
<div class="scene" id="s0"></div>

<!-- Scene 1 — Hero (2–5s) -->
<div class="scene" id="s1">
  <div class="brand"><span class="brand-logo">F</span> FreeTier Sentinel</div>
  <h1>Watch every free tier. <span class="grad">Sleep at night.</span></h1>
  <p class="lede">Like Datadog, but for free-tier limits. We email you at <em>80%</em> — before the cliff.</p>
</div>

<!-- Scene 2 — Live event feed (5–14s) -->
<div class="scene" id="s2">
  <div class="header"><span class="label">Live · Real-time monitoring</span></div>
  <div class="preview-frame">
    <div class="bar">
      <span class="dots"><span class="dot"></span><span class="dot"></span><span class="dot"></span></span>
      <span class="url">freetier-sentinel.dev/events</span>
      <span class="live">Live</span>
    </div>
    <div class="feed" id="feed">
      <div class="ev"><span class="t">14:02:31</span><span class="p">cloudflare</span><span class="m">workers · 34k / 100k</span><span class="v"><span class="tag tag-ok">safe</span></span></div>
      <div class="ev"><span class="t">14:02:28</span><span class="p">github</span><span class="m">actions · 412 / 2,000</span><span class="v"><span class="tag tag-ok">safe</span></span></div>
      <div class="ev"><span class="t">14:02:14</span><span class="p">vercel</span><span class="m">bandwidth · 82 / 100 GB</span><span class="v"><span class="tag tag-warn">warn</span></span></div>
      <div class="ev"><span class="t">14:02:02</span><span class="p">resend</span><span class="m">emails · 73 / 100</span><span class="v"><span class="tag tag-warn">80%</span></span></div>
      <div class="ev"><span class="t">14:01:58</span><span class="p">supabase</span><span class="m">db · 128 / 500 MB</span><span class="v"><span class="tag tag-ok">safe</span></span></div>
      <div class="ev"><span class="t">14:01:46</span><span class="p">cf.workers</span><span class="m">requests · 10M / 10M</span><span class="v"><span class="tag tag-err">degraded</span></span></div>
      <div class="ev"><span class="t">14:01:31</span><span class="p">neon</span><span class="m">compute · 61 / 191 hrs</span><span class="v"><span class="tag tag-ok">safe</span></span></div>
    </div>
  </div>
</div>

<!-- Scene 3 — Dashboard glance (14–20s) -->
<div class="scene" id="s3">
  <div class="top">
    <div>
      <h2>Welcome back</h2>
      <div class="sub">wndnjs3865@gmail.com · 1 service monitored</div>
    </div>
  </div>
  <div class="stats">
    <div class="stat"><div class="lbl">Services</div><div class="val">1</div><div class="delta">1 / 3 on Free</div></div>
    <div class="stat"><div class="lbl">Healthy</div><div class="val" style="color: var(--ok)">0</div><div class="delta">1 needs attention</div></div>
    <div class="stat"><div class="lbl">Polling</div><div class="val">12h</div><div class="delta">Every 12 hours</div></div>
  </div>
  <div class="svc">
    <span class="svc-logo">CF</span>
    <div class="svc-name">My Cloudflare<small>cloudflare</small></div>
    <span class="pill-warn">warn</span>
    <div class="bar-wrap">
      <div class="bar-track"><span class="bar-fill" id="bar-fill"></span></div>
      <span class="bar-pct">73%</span>
    </div>
    <span class="time">14m ago</span>
  </div>
</div>

<!-- Scene 4 — Alert ping (20–27s) -->
<div class="scene" id="s4">
  <div class="header"><span class="label">Alerts that get noticed</span></div>
  <h2>Three channels — the <em>one you check</em> pings first.</h2>
  <div class="grid">
    <div class="card" id="c1">
      <div class="head"><span class="ch-logo email">F</span><span class="ch-name">Email</span><time>14:02</time></div>
      <div class="body">
        <div class="from">noreply@freetier-sentinel.dev</div>
        <div class="subj">⚠ Vercel bandwidth at 82% — 18% headroom</div>
        <div class="body-text">Crossed 80% of monthly free-tier bandwidth (<strong>82.4 / 100 GB</strong>). At current pace you hit the cliff in <strong>~38 hours</strong>.</div>
        <div class="react"><span class="pill-mono">vercel.bandwidth</span><span class="pill-mono">82.4 / 100 GB</span></div>
      </div>
    </div>
    <div class="card" id="c2">
      <div class="head"><span class="ch-logo slack">S</span><span class="ch-name">Slack · #alerts</span><time>14:02</time></div>
      <div class="body">
        <div class="from">FreeTier Sentinel APP</div>
        <div class="body-text"><strong>Cloudflare Workers</strong> requests <strong>10M / 10M</strong> — <span class="tag-err-inline">degraded</span>. Account is rate-capped. <em>Triggered 14 min ago.</em></div>
        <div class="react"><span class="pill-mono">cf.workers.req</span><span class="pill-mono">10M / 10M</span></div>
      </div>
    </div>
    <div class="card" id="c3">
      <div class="head"><span class="ch-logo discord">D</span><span class="ch-name">Discord · #ops</span><time>14:02</time></div>
      <div class="body">
        <div class="from">FreeTier Sentinel BOT</div>
        <div class="body-text"><strong>@everyone</strong> Resend free tier hit 100/100. Email delivery paused until midnight UTC.</div>
        <div class="react"><span class="pill-mono">resend.emails.day</span><span class="pill-mono">100 / 100</span></div>
      </div>
    </div>
  </div>
</div>

<!-- Scene 5 — Outro (27–30s) -->
<div class="scene" id="s5">
  <div class="brand"><span class="brand-logo">F</span> FreeTier Sentinel</div>
  <h2>Watch every free tier. <span class="grad">Sleep at night.</span></h2>
  <div class="url-line">freetier-sentinel.dev</div>
</div>

<script>
// Narrative table sequencer (exact spec):
//   0.0 – 2.0s  → s0 white (initial), s1 pre-fade prepares
//   2.0 – 5.0s  → s1 hero (3s hold)
//   5.0 – 14.0s → s2 live feed, 7 rows @ 1.1s intervals
//   14.0 – 20.0s → s3 dashboard, bar fill kicks in @ +600ms
//   20.0 – 27.0s → s4 alerts, 3 cards @ 0/+800/+1600ms
//   27.0 – 30.0s → s5 outro (dark teal gradient)
function show(id) {
  document.querySelectorAll('.scene').forEach(s => { s.classList.remove('in'); s.classList.remove('out'); });
  document.getElementById(id).classList.add('in');
}
function reset() {
  document.querySelectorAll('#feed .ev').forEach(e => e.classList.remove('show'));
  document.querySelectorAll('#s4 .card').forEach(c => c.classList.remove('show'));
  var bar = document.getElementById('bar-fill'); if (bar) bar.style.width = '0%';
}
function showRow(idx) {
  var evs = document.querySelectorAll('#feed .ev');
  if (evs[idx]) evs[idx].classList.add('show');
}
function start() {
  reset();
  // Scene 0: white starts visible by default (#s0 has opacity: 1)
  // Scene 1: Hero — fade in at 2.0s, white fades out simultaneously
  setTimeout(function () {
    document.getElementById('s0').classList.add('out');
    show('s1');
  }, 2000);
  // Scene 2: Live feed at 5.0s, 7 rows at 1.1s intervals (5.4, 6.5, 7.6, 8.7, 9.8, 10.9, 12.0)
  setTimeout(function () { show('s2'); }, 5000);
  for (var i = 0; i < 7; i++) {
    setTimeout((function (k) { return function () { showRow(k); }; })(i), 5400 + i * 1100);
  }
  // Scene 3: Dashboard at 14.0s, bar fills at 14.6s
  setTimeout(function () {
    show('s3');
    setTimeout(function () { var b = document.getElementById('bar-fill'); if (b) b.style.width = '73%'; }, 600);
  }, 14000);
  // Scene 4: Alerts at 20.0s, 3 cards stagger @ 20.4 / 21.2 / 22.0
  setTimeout(function () { show('s4'); }, 20000);
  setTimeout(function () { document.getElementById('c1').classList.add('show'); }, 20400);
  setTimeout(function () { document.getElementById('c2').classList.add('show'); }, 21200);
  setTimeout(function () { document.getElementById('c3').classList.add('show'); }, 22000);
  // Scene 5: Outro at 27.0s
  setTimeout(function () { show('s5'); }, 27000);
}
// Auto-init: wait for fonts to finish loading + a 600ms paint settle, then trigger.
// Recorder can also call window.startDemo() if it wants precise sync.
window.__demoStarted = false;
function startNow() {
  if (window.__demoStarted) return;
  window.__demoStarted = true;
  start();
}
window.startDemo = startNow;
(async function () {
  try { if (document.fonts && document.fonts.ready) await document.fonts.ready; } catch (e) {}
  await new Promise(function (r) { setTimeout(r, 600); });
  startNow();
})();
</script>
</body></html>`;
  return new Response(html, { headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" } });
}

// /launch/thumbnail — 240×240 square brand mark for PH "Product thumbnail" field.
export async function handleLaunchThumbnail(_req: Request, _env: Env): Promise<Response> {
  const html = `<!DOCTYPE html><html lang="en"><head>${SHARED_HEAD}
<title>FT Sentinel · 240</title>
<style>
:root { --primary: #14b8a6; --primary-2: #0d9488; --primary-3: #2dd4bf; --accent: #22d3ee; }
* { box-sizing: border-box; margin: 0; padding: 0; }
html, body { width: 240px; height: 240px; overflow: hidden; }
body {
  width: 240px; height: 240px;
  display: flex; align-items: center; justify-content: center;
  position: relative;
  background:
    radial-gradient(ellipse 200px 200px at 80% 20%, rgba(34,211,238,.45), transparent 70%),
    radial-gradient(ellipse 180px 180px at 20% 80%, rgba(20,184,166,.55), transparent 70%),
    linear-gradient(135deg, #0d9488 0%, #14b8a6 50%, #115e59 100%);
}
body::before {
  content: ''; position: absolute; inset: 0;
  background: radial-gradient(circle at 30% 25%, rgba(255,255,255,.18), transparent 50%);
  pointer-events: none;
}
.mark {
  position: relative; z-index: 1;
  font-family: 'Satoshi','Inter',sans-serif;
  font-size: 138px; font-weight: 800; letter-spacing: -.06em;
  color: #fff;
  line-height: 1;
  text-shadow: 0 8px 24px rgba(0,0,0,.32), 0 1px 0 rgba(255,255,255,.18);
  filter: drop-shadow(0 0 24px rgba(34,211,238,.35));
}
/* tiny 'sentinel' eye accent under the F */
.dot {
  position: absolute; bottom: 32px; left: 50%; transform: translateX(-50%);
  width: 56px; height: 6px; border-radius: 999px;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,.85), transparent);
  z-index: 1;
}
</style></head>
<body>
<span class="mark">F</span>
<span class="dot"></span>
</body></html>`;
  return new Response(html, { headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" } });
}

// Serve PNG captures of the launch mockups directly from KV.
// Mobile users tap these URLs → "Save image" → upload to PH manually,
// OR PH "Paste a URL" option accepts these directly.
export async function handleLaunchPng(_req: Request, env: Env, slug: string): Promise<Response> {
  const isMp4 = slug === "demo-mp4";
  const validImg = ["hero", "dashboard", "alerts", "thumbnail"].includes(slug);
  if (!isMp4 && !validImg) {
    return new Response("Not found", { status: 404 });
  }
  const kvKey = isMp4 ? "launch-img:demo-mp4" : `launch-img:${slug}`;
  const data = await env.KV.get(kvKey, "arrayBuffer");
  if (!data) return new Response("Asset missing — KV not populated", { status: 500 });
  const contentType = isMp4 ? "video/mp4" : "image/png";
  const ext = isMp4 ? "mp4" : "png";
  return new Response(data, {
    headers: {
      "content-type": contentType,
      "cache-control": "public, max-age=86400, immutable",
      "content-disposition": `inline; filename="ft-sentinel-${slug}.${ext}"`,
    },
  });
}

export async function handleLaunchHero(_req: Request, _env: Env): Promise<Response> {
  const html = `<!DOCTYPE html><html lang="en"><head>${SHARED_HEAD}
<title>FreeTier Sentinel — Watch every free tier</title>
<style>${SHARED_CSS}
.frame { display: grid; grid-template-columns: 1fr 1fr; gap: 48px; align-items: center; padding: 72px; }
.left { padding-right: 8px; }
.left .brand { margin-bottom: 28px; }
.left .eyebrow { margin-bottom: 24px; }
.right { position: relative; }

.preview-frame {
  background: #0a0e1a;
  border-radius: 24px;
  border: 1px solid rgba(255,255,255,.08);
  box-shadow:
    0 32px 64px -24px rgba(15,23,42,.40),
    0 1px 0 rgba(255,255,255,.06) inset,
    0 0 0 1px rgba(20,184,166,.16);
  overflow: hidden;
  position: relative;
  z-index: 1;
}
.preview-frame::before {
  content: ''; position: absolute; inset: -40px;
  background: radial-gradient(ellipse 60% 60% at 50% 50%, rgba(20,184,166,.30), transparent 70%);
  filter: blur(50px); z-index: -1; pointer-events: none;
}
.preview-bar {
  display: flex; align-items: center; gap: 10px;
  padding: 14px 20px;
  background: #111827;
  border-bottom: 1px solid #1f2937;
}
.preview-bar .dots { display: inline-flex; gap: 7px; }
.preview-bar .dot { width: 11px; height: 11px; border-radius: 50%; }
.preview-bar .dot:nth-child(1) { background: #ef4444; opacity: .7; }
.preview-bar .dot:nth-child(2) { background: #f59e0b; opacity: .7; }
.preview-bar .dot:nth-child(3) { background: #22c55e; opacity: .7; }
.preview-bar .url-bar {
  margin-left: 14px; padding: 5px 12px;
  background: rgba(255,255,255,.04); border: 1px solid rgba(255,255,255,.08);
  border-radius: 6px; font-size: 12px; color: #94a3b8;
  font-family: var(--font-mono);
}
.preview-bar .live-tag { margin-left: auto; font-size: 11px; color: #4ade80; font-weight: 600; letter-spacing: .04em; text-transform: uppercase; display: inline-flex; align-items: center; gap: 6px; }
.preview-bar .live-tag::before { content: ''; width: 6px; height: 6px; background: #4ade80; border-radius: 50%; box-shadow: 0 0 0 3px rgba(74,222,128,.18); }

.event-feed {
  font-family: var(--font-mono);
  font-variant-numeric: tabular-nums;
  font-size: 12.5px;
  background: #0a0e1a;
  color: #cbd5e1;
  padding: 18px 22px;
  line-height: 1.95;
}
/* No fixed grid — keep flex flow so status pill is always visible (right-aligned). */
.event-feed .ev {
  display: grid;
  grid-template-columns: 60px 90px 1fr auto;       /* time | provider | metric+number | tag (auto) */
  column-gap: 14px;
  align-items: baseline;
  white-space: nowrap;
  overflow: visible;                                /* never clip — show pills */
}
.event-feed .ev .t { color: #64748b; }
.event-feed .ev .p { color: #5eead4; }
.event-feed .ev .m { color: #cbd5e1; overflow: hidden; text-overflow: ellipsis; }
.event-feed .ev .v {
  color: #cbd5e1;
  display: inline-flex; align-items: center; gap: 8px;
  justify-self: end;
  white-space: nowrap;
}
.event-feed .ev.err .v { font-weight: 500; }

.tag {
  display: inline-block;
  padding: 1px 9px;
  border-radius: 999px;
  font-size: 10.5px; font-weight: 700; letter-spacing: .06em; text-transform: uppercase;
  margin: 0 2px; vertical-align: 1px;
}
.tag-ok   { background: rgba(16,185,129,.12); color: #34d399; box-shadow: 0 0 0 1px rgba(16,185,129,.25); }
.tag-warn { background: rgba(245,158,11,.12); color: #fbbf24; box-shadow: 0 0 0 1px rgba(245,158,11,.25), 0 0 8px rgba(245,158,11,.20); }
.tag-err  { background: rgba(244,63,94,.14);  color: #fb7185; box-shadow: 0 0 0 1px rgba(244,63,94,.32), 0 0 14px rgba(244,63,94,.40); }
</style></head>
<body>
<div class="frame">
  <div class="left">
    <div class="brand"><span class="brand-logo">F</span> FreeTier Sentinel</div>
    <div class="eyebrow"><span class="pulse"></span> Cloudflare, GitHub, Vercel live · 5 more in 2 weeks</div>
    <h1 class="headline">Watch every free tier. <span class="grad">Sleep at night.</span></h1>
    <p class="lede">Like Datadog, but for free-tier limits. We email you at <em>80%</em> — before the cliff. Cloudflare, GitHub Actions, Vercel live now.</p>
    <div class="tag-row">
      <span class="tag"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>Free for 3 services</span>
      <span class="tag"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>No credit card</span>
      <span class="tag"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>Open source</span>
    </div>
  </div>
  <div class="right">
    <div class="preview-frame">
      <div class="preview-bar">
        <span class="dots"><span class="dot"></span><span class="dot"></span><span class="dot"></span></span>
        <span class="url-bar">freetier-sentinel.dev/events</span>
        <span class="live-tag">Live</span>
      </div>
      <div class="event-feed">
        <div class="ev"><span class="t">14:02:31</span><span class="p">cloudflare</span><span class="m">workers · 34k / 100k</span><span class="v"><span class="tag tag-ok">safe</span></span></div>
        <div class="ev"><span class="t">14:02:28</span><span class="p">github</span><span class="m">actions · 412 / 2,000</span><span class="v"><span class="tag tag-ok">safe</span></span></div>
        <div class="ev"><span class="t">14:02:14</span><span class="p">vercel</span><span class="m">bandwidth · 82 / 100 GB</span><span class="v"><span class="tag tag-warn">warn</span></span></div>
        <div class="ev"><span class="t">14:02:02</span><span class="p">resend</span><span class="m">emails · 73 / 100</span><span class="v"><span class="tag tag-warn">80%</span></span></div>
        <div class="ev"><span class="t">14:01:58</span><span class="p">supabase</span><span class="m">db · 128 / 500 MB</span><span class="v"><span class="tag tag-ok">safe</span></span></div>
        <div class="ev err"><span class="t">14:01:46</span><span class="p">cf.workers</span><span class="m">requests · 10M / 10M</span><span class="v"><span class="tag tag-err">degraded</span></span></div>
        <div class="ev"><span class="t">14:01:31</span><span class="p">neon</span><span class="m">compute · 61 / 191 hrs</span><span class="v"><span class="tag tag-ok">safe</span></span></div>
      </div>
    </div>
  </div>
</div>
<div class="url">freetier-sentinel.dev</div>
</body></html>`;
  return new Response(html, { headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" } });
}

export async function handleLaunchDashboard(_req: Request, _env: Env): Promise<Response> {
  const html = `<!DOCTYPE html><html lang="en"><head>${SHARED_HEAD}
<title>FreeTier Sentinel — Dashboard</title>
<style>${SHARED_CSS}
body { background: #f6f8fc; }
body::before { display: none; }
.frame { padding: 0; display: grid; grid-template-columns: 256px 1fr; height: 720px; }
.side {
  background: #fff; border-right: 1px solid var(--border);
  padding: 28px 16px; display: flex; flex-direction: column; gap: 4px;
}
.side .brand { margin: 0 4px 28px; }
.side-section { font-size: 11px; text-transform: uppercase; letter-spacing: .14em; font-weight: 600; color: var(--muted); margin: 24px 12px 8px; padding-top: 16px; border-top: 1px solid var(--border); }
.side-section:first-of-type { margin-top: 4px; padding-top: 0; border-top: 0; }
.side-link {
  display: flex; align-items: center; gap: 12px;
  padding: 10px 12px; border-radius: 8px;
  font-size: 14.5px; font-weight: 500; color: var(--text-2);
  text-decoration: none;
}
.side-link svg { width: 18px; height: 18px; flex-shrink: 0; display: block; }
.side-link.active { background: var(--primary-soft); color: var(--primary); font-weight: 600; box-shadow: inset 3px 0 0 var(--primary); }
.side-link .count { margin-left: auto; font-family: var(--font-mono); font-size: 12px; color: var(--muted); }

main { padding: 36px 40px; max-width: 100%; min-width: 0; }
.topbar { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 32px; }
.greeting h1 { font-family: var(--font-display); font-size: 28px; font-weight: 600; letter-spacing: -.02em; margin-bottom: 6px; line-height: 1.2; }
.greeting p { color: var(--muted); font-size: 14px; }
.greeting p .em { font-family: var(--font-mono); color: var(--text-2); }
.badge.free { padding: 5px 12px; background: var(--surface); border: 1px solid var(--border); border-radius: 999px; font-size: 12px; font-weight: 600; color: var(--muted); display: inline-flex; align-items: center; gap: 6px; }
.badge.free::before { content: ''; width: 6px; height: 6px; background: var(--muted); border-radius: 50%; }

.upgrade {
  margin-bottom: 32px;
  background:
    linear-gradient(180deg, rgba(255,255,255,.04) 0%, rgba(255,255,255,0) 50%),
    linear-gradient(135deg, #0a0e1a 0%, #134e4a 50%, #115e59 100%);
  color: #fff; border-radius: 24px; padding: 24px 28px;
  display: flex; justify-content: space-between; align-items: center;
  position: relative; overflow: hidden;
  box-shadow: inset 0 1px 0 rgba(255,255,255,.10), 0 16px 32px -12px rgba(20,184,166,.30);
}
.upgrade::before {
  content: ''; position: absolute; right: -80px; top: -80px;
  width: 260px; height: 260px; border-radius: 50%;
  background: radial-gradient(circle, rgba(34,211,238,.36), transparent 70%);
  pointer-events: none;
}
.upgrade-text { position: relative; z-index: 1; }
.upgrade h3 { font-size: 18px; font-weight: 700; letter-spacing: -.015em; margin-bottom: 6px; display: flex; align-items: center; gap: 10px; }
.upgrade h3 .pro-pill { padding: 2px 10px; background: rgba(255,255,255,.16); border-radius: 999px; font-size: 11px; font-weight: 700; letter-spacing: .04em; text-transform: uppercase; }
.upgrade p { color: rgba(255,255,255,.78); font-size: 14.5px; line-height: 1.55; max-width: 540px; }
.btn-up {
  padding: 12px 22px; background: #fff; color: var(--text);
  border-radius: 24px; font-weight: 600; font-size: 14.5px;
  text-decoration: none; box-shadow: 0 4px 14px rgba(0,0,0,.18);
  position: relative; z-index: 1;
}

.stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; margin-bottom: 36px; }
.stat {
  background: #fff; border: 1px solid var(--border);
  border-radius: 16px; padding: 24px;
  box-shadow: inset 0 1px 0 rgba(255,255,255,.5), 0 10px 15px -3px rgba(15,23,42,.10), 0 4px 6px -2px rgba(15,23,42,.05);
}
.stat .label { font-size: 11px; color: var(--muted); text-transform: uppercase; letter-spacing: .12em; font-weight: 600; margin-bottom: 12px; }
.stat .value {
  font-family: var(--font-mono); font-variant-numeric: tabular-nums;
  font-size: 40px; font-weight: 600; letter-spacing: -.035em;
  color: var(--text); line-height: 1.05;
}
.stat .delta { font-size: 12.5px; color: var(--muted); margin-top: 10px; }

.section-head { display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 16px; }
.section-head h2 { font-family: var(--font-display); font-size: 18px; font-weight: 600; letter-spacing: -.015em; }
.section-head .count { color: var(--muted); font-size: 13px; font-family: var(--font-mono); }

.card {
  background: #fff; border: 1px solid var(--border);
  border-radius: 16px; overflow: hidden;
  box-shadow: inset 0 1px 0 rgba(255,255,255,.5), 0 1px 2px rgba(15,23,42,.05);
}
.svc-list li {
  list-style: none;
  padding: 20px 24px;
  display: grid;
  grid-template-columns: 32px 1.6fr 110px 1fr 100px 36px;
  gap: 14px; align-items: center;
  border-bottom: 1px solid var(--border);
}
.svc-list li:last-child { border-bottom: 0; }
.svc-logo {
  width: 32px; height: 32px; border-radius: 9px;
  display: inline-flex; align-items: center; justify-content: center;
  font-size: 12px; font-weight: 700; color: #fff;
  background: linear-gradient(135deg, #f6821f, #fbad41);
  box-shadow: inset 0 1px 0 rgba(255,255,255,.18);
}
.svc-name { font-weight: 600; font-size: 14.5px; }
.svc-name small { display: block; color: var(--muted); font-size: 12px; text-transform: uppercase; letter-spacing: .04em; margin-top: 2px; }
.status-pill {
  padding: 3px 10px; border-radius: 999px;
  font-size: 10.5px; font-weight: 600; text-transform: uppercase; letter-spacing: .06em;
  display: inline-flex; align-items: center; gap: 5px;
  background: rgba(245,158,11,.14); color: #b45309;
  box-shadow: 0 0 8px rgba(245,158,11,.25), 0 0 0 1px rgba(245,158,11,.22);
}
.status-pill::before { content: ''; width: 5px; height: 5px; border-radius: 50%; background: currentColor; }
.svc-bar-wrap { display: flex; align-items: center; gap: 12px; }
.svc-bar { flex: 1; height: 8px; background: var(--surface-2); border-radius: 999px; overflow: hidden; box-shadow: inset 0 1px 2px rgba(15,23,42,.05); }
.svc-bar > span { display: block; height: 100%; width: 73%; background: linear-gradient(90deg, #f59e0b 0%, #fb923c 100%); border-radius: 999px; box-shadow: 0 0 10px rgba(245,158,11,.45); }
.svc-bar-pct { font-family: var(--font-mono); font-variant-numeric: tabular-nums; font-size: 13px; font-weight: 600; color: var(--warn); min-width: 48px; text-align: right; }
.svc-time { font-family: var(--font-mono); font-size: 12.5px; color: var(--muted); white-space: nowrap; }
.svc-actions {
  width: 32px; height: 32px; display: inline-flex; align-items: center; justify-content: center;
  border: 1px solid transparent; border-radius: 8px; color: var(--muted);
}
</style></head>
<body>
<div class="frame">
  <aside class="side">
    <a class="brand" href="#"><span class="brand-logo">F</span> FreeTier Sentinel</a>
    <div class="side-section">Workspace</div>
    <a class="side-link active" href="#"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.25" stroke-linecap="round" stroke-linejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg><span>Overview</span></a>
    <a class="side-link" href="#"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.25" stroke-linecap="round" stroke-linejoin="round"><path d="M17.5 19a4.5 4.5 0 1 0-3-7.9A6 6 0 0 0 3 12a4 4 0 0 0 4 4h10.5z"/></svg><span>Services</span><span class="count">1</span></a>
    <a class="side-link" href="#"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.25" stroke-linecap="round" stroke-linejoin="round"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg><span>Alerts</span><span class="count">0</span></a>
    <div class="side-section">Account</div>
    <a class="side-link" href="#"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.25" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8 2 2 0 1 1-2.8 2.8 1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0 1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3 2 2 0 1 1-2.8-2.8 1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4 1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8 2 2 0 1 1 2.8-2.8 1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0 1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3 2 2 0 1 1 2.8 2.8 1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4 1.7 1.7 0 0 0-1.5 1z"/></svg><span>Settings</span></a>
  </aside>
  <main>
    <div class="topbar">
      <div class="greeting">
        <h1>Welcome back</h1>
        <p><span class="em">wndnjs3865@gmail.com</span> · 1 service monitored</p>
      </div>
      <span class="badge free">Free plan</span>
    </div>
    <div class="upgrade">
      <div class="upgrade-text">
        <h3>You're on Free <span class="pro-pill">3 services · 12h polling</span></h3>
        <p>Unlock unlimited services, hourly polling, and Discord + Telegram alerts for $5/month — less than one cup of coffee.</p>
      </div>
      <a class="btn-up" href="#">Upgrade · $5/mo →</a>
    </div>
    <div class="stats">
      <div class="stat">
        <div class="label">Services</div>
        <div class="value">1</div>
        <div class="delta">1 / 3 on Free</div>
      </div>
      <div class="stat">
        <div class="label">Healthy</div>
        <div class="value" style="color: var(--ok)">0</div>
        <div class="delta">1 needs attention</div>
      </div>
      <div class="stat">
        <div class="label">Polling</div>
        <div class="value">12h</div>
        <div class="delta">Every 12 hours</div>
      </div>
    </div>
    <div class="section-head">
      <h2>Services</h2>
      <span class="count">1 connected</span>
    </div>
    <div class="card">
      <ul class="svc-list">
        <li>
          <span class="svc-logo">CF</span>
          <div class="svc-name">My Cloudflare<small>cloudflare</small></div>
          <span class="status-pill">warn</span>
          <div class="svc-bar-wrap">
            <div class="svc-bar"><span></span></div>
            <span class="svc-bar-pct">73%</span>
          </div>
          <span class="svc-time">14m ago</span>
          <span class="svc-actions"></span>
        </li>
      </ul>
    </div>
  </main>
</div>
</body></html>`;
  return new Response(html, { headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" } });
}

export async function handleLaunchAlerts(_req: Request, _env: Env): Promise<Response> {
  const html = `<!DOCTYPE html><html lang="en"><head>${SHARED_HEAD}
<title>FreeTier Sentinel — Alerts</title>
<style>${SHARED_CSS}
.frame { padding: 64px 72px; }
.head { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 56px; }
.head .left .brand { margin-bottom: 24px; }
.head .left h2 { font-family: var(--font-display); font-size: 44px; font-weight: 700; letter-spacing: -.025em; line-height: 1.1; max-width: 720px; }
.head .left h2 em { background: var(--grad-text); -webkit-background-clip: text; background-clip: text; -webkit-text-fill-color: transparent; color: transparent; font-style: italic; font-weight: 600; }
.head .left p { color: var(--text-2); font-size: 16px; line-height: 1.6; max-width: 560px; margin-top: 14px; }
.head .right { padding-top: 32px; }

.alerts-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 22px; }
.alert-card {
  background: #fff;
  border: 1px solid var(--border);
  border-radius: 18px;
  overflow: hidden;
  box-shadow: 0 16px 28px -12px rgba(20,184,166,.14), inset 0 1px 0 rgba(255,255,255,.6);
}
.alert-card-head {
  display: flex; align-items: center; gap: 11px;
  padding: 16px 22px;
  border-bottom: 1px solid var(--border);
  font-size: 12px; font-weight: 500; color: var(--muted);
  letter-spacing: .04em; text-transform: uppercase;
}
.alert-card-head .ch-logo {
  width: 26px; height: 26px; border-radius: 7px;
  display: inline-flex; align-items: center; justify-content: center;
  font-size: 12px; font-weight: 700; color: #fff;
}
.alert-card-head .ch-logo.email   { background: var(--text); }
.alert-card-head .ch-logo.slack   { background: #4a154b; }
.alert-card-head .ch-logo.discord { background: #5865f2; }
.alert-card-head .ch-name { font-weight: 600; color: var(--text); text-transform: none; letter-spacing: -.005em; font-size: 13px; }
.alert-card-head time { margin-left: auto; font-family: var(--font-mono); font-size: 12px; color: var(--muted); text-transform: none; letter-spacing: 0; }
.alert-card-body { padding: 22px 24px; display: flex; flex-direction: column; gap: 12px; min-height: 220px; }
.alert-card-body .from { font-size: 12.5px; color: var(--muted); font-family: var(--font-mono); }
.alert-card-body .subj { font-size: 15px; font-weight: 600; color: var(--text); letter-spacing: -.005em; line-height: 1.4; }
.alert-card-body .body-text { font-size: 14px; color: var(--text-2); line-height: 1.65; margin: 0; }
.alert-card-body .body-text strong { color: var(--text); font-variant-numeric: tabular-nums; }
.alert-card-body .body-text em { color: var(--muted); font-style: italic; }
.alert-card-body .react {
  display: flex; flex-wrap: wrap; gap: 8px;
  margin-top: auto; padding-top: 14px;
  border-top: 1px dashed var(--border);
}
.alert-card-body .react .pill {
  display: inline-flex; align-items: center;
  padding: 3px 10px; border-radius: 999px;
  background: var(--surface-2); border: 1px solid var(--border);
  font-family: var(--font-mono); font-size: 11.5px;
  color: var(--text-2);
}

.tag {
  display: inline-block; padding: 1px 9px; border-radius: 999px;
  font-size: 10.5px; font-weight: 700; letter-spacing: .06em; text-transform: uppercase;
  background: rgba(245,158,11,.14); color: #b45309;
  box-shadow: 0 0 8px rgba(245,158,11,.20), 0 0 0 1px rgba(245,158,11,.22);
  vertical-align: 1px;
}
.tag-err { background: rgba(244,63,94,.14); color: #be123c; box-shadow: 0 0 12px rgba(244,63,94,.32), 0 0 0 1px rgba(244,63,94,.30); }
</style></head>
<body>
<div class="frame">
  <div class="head">
    <div class="left">
      <div class="brand"><span class="brand-logo">F</span> FreeTier Sentinel</div>
      <h2>Alerts that <em>get noticed.</em></h2>
      <p>Email by default. Discord, Telegram, and Slack on Pro. Three channels — the one you actually check pings you first.</p>
    </div>
    <div class="right">
      <span class="eyebrow"><span class="pulse"></span> Live alert demo</span>
    </div>
  </div>

  <div class="alerts-grid">
    <div class="alert-card">
      <div class="alert-card-head">
        <span class="ch-logo email">F</span>
        <span class="ch-name">Email</span>
        <time>14:02</time>
      </div>
      <div class="alert-card-body">
        <div class="from">noreply@freetier-sentinel.dev</div>
        <div class="subj">⚠ Vercel bandwidth at 82% — 18% headroom</div>
        <p class="body-text">Hey, your <strong>Vercel</strong> account just crossed 80% of the free-tier monthly bandwidth limit (82.4 GB / 100 GB).<br><br>At your current pace, you'll hit the cliff in <strong>~38 hours</strong>. Reply if you'd like FreeTier Sentinel to throttle the project for you.</p>
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
        <p class="body-text"><strong>Cloudflare Workers</strong> requests at <strong>10,000,000 / 10,000,000</strong> — <span class="tag tag-err">degraded</span>. Account is rate-capped. <em>Triggered 14 min ago.</em></p>
        <div class="react">
          <span class="pill">cf.workers.req</span>
          <span class="pill">10M / 10M</span>
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
        <p class="body-text"><strong>@everyone</strong> Resend free tier hit 100 sent / 100. Email delivery is paused until midnight UTC. Upgrade your Resend plan, or pause your campaign.</p>
        <div class="react">
          <span class="pill">resend.emails.day</span>
          <span class="pill">100 / 100</span>
        </div>
      </div>
    </div>
  </div>
</div>
<div class="url">freetier-sentinel.dev</div>
</body></html>`;
  return new Response(html, { headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" } });
}
