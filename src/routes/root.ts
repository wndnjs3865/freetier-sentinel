import type { Env } from "../index";

const CSS = String.raw`
:root {
  --bg: #ffffff;
  --bg-soft: #fafafa;
  --bg-mesh: #f6f8fc;
  --surface: #ffffff;
  --surface-2: #f8fafc;
  --text: #0a0e1a;
  --text-2: #475569;
  --muted: #64748b;
  --border: #e6e8ee;
  --border-strong: #d4d8e0;
  --primary: #1e40af;
  --primary-2: #2563eb;
  --primary-3: #3b82f6;
  --primary-soft: #eff6ff;
  --grad-1: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%);
  --shadow-xs: 0 1px 2px rgba(15,23,42,.04);
  --shadow-sm: 0 1px 2px rgba(15,23,42,.04), 0 4px 12px rgba(15,23,42,.04);
  --shadow-md: 0 4px 12px rgba(15,23,42,.06), 0 16px 40px rgba(15,23,42,.08);
  --shadow-lg: 0 8px 24px rgba(15,23,42,.08), 0 32px 80px rgba(15,23,42,.12);
  --shadow-glow: 0 0 0 1px rgba(30,64,175,.08), 0 8px 32px rgba(30,64,175,.12);
  --r-sm: 8px;
  --r-md: 12px;
  --r-lg: 16px;
  --r-xl: 24px;
  --t-fast: 140ms cubic-bezier(.4,0,.2,1);
  --t-med: 220ms cubic-bezier(.4,0,.2,1);
}

* { box-sizing: border-box; }
html { -webkit-text-size-adjust: 100%; scroll-behavior: smooth; }
body {
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
  font-feature-settings: 'cv02','cv03','cv04','cv11','ss01','ss03';
  background: var(--bg);
  color: var(--text);
  margin: 0;
  line-height: 1.6;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-rendering: optimizeLegibility;
}
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
  background: rgba(255,255,255,.78);
  backdrop-filter: saturate(180%) blur(12px);
  -webkit-backdrop-filter: saturate(180%) blur(12px);
  border-bottom: 1px solid rgba(15,23,42,.06);
}
.nav-inner { display: flex; align-items: center; justify-content: space-between; padding: 14px 0; }
.brand { display: inline-flex; align-items: center; gap: 8px; font-weight: 700; font-size: 16px; letter-spacing: -.01em; color: var(--text); }
.brand-logo { width: 22px; height: 22px; display: inline-flex; align-items: center; justify-content: center;
  border-radius: 6px; background: var(--grad-1); color: white; font-size: 12px; font-weight: 800;
  box-shadow: 0 2px 8px rgba(30,64,175,.3);
}
.nav-links { display: none; gap: 28px; align-items: center; }
@media (min-width: 720px) { .nav-links { display: flex; } }
.nav-links a { color: var(--text-2); font-size: 14.5px; font-weight: 500; transition: color var(--t-fast); }
.nav-links a:hover { color: var(--text); }
.nav-cta {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 8px 16px; background: var(--text); color: white !important;
  border-radius: var(--r-sm); font-size: 14px; font-weight: 600;
  transition: background var(--t-fast), transform var(--t-fast);
}
.nav-cta:hover { background: #1e2939; transform: translateY(-1px); }

/* ───── HERO ───── */
.hero {
  position: relative;
  padding: 96px 0 80px;
  overflow: hidden;
  text-align: center;
}
.hero::before {
  content: ''; position: absolute; inset: 0;
  background: radial-gradient(ellipse 70% 50% at 50% 0%, rgba(59,130,246,.10), transparent 70%);
  pointer-events: none; z-index: -1;
}
@media (max-width: 600px) { .hero { padding: 64px 0 48px; } }

.eyebrow {
  display: inline-flex; align-items: center; gap: 8px;
  padding: 6px 14px;
  background: rgba(255,255,255,.7);
  backdrop-filter: blur(8px);
  border: 1px solid var(--border);
  border-radius: 999px;
  font-size: 13px; font-weight: 500; color: var(--text-2);
  margin-bottom: 24px;
  box-shadow: var(--shadow-xs);
}
.eyebrow .pulse { width: 6px; height: 6px; background: #22c55e; border-radius: 50%; box-shadow: 0 0 0 3px rgba(34,197,94,.18); }

.hero h1 {
  font-size: clamp(44px, 7vw, 84px);
  line-height: 1.02;
  letter-spacing: -.045em;
  font-weight: 800;
  margin: 0 0 22px;
  max-width: 920px; margin-left: auto; margin-right: auto;
}
.hero .lede {
  font-size: clamp(17px, 2vw, 20px);
  color: var(--text-2);
  max-width: 620px; margin: 0 auto 36px;
  line-height: 1.55;
  font-weight: 400;
}

.hero-form {
  display: flex; gap: 8px;
  max-width: 480px; margin: 0 auto;
  background: var(--surface);
  border: 1px solid var(--border-strong);
  border-radius: var(--r-md);
  padding: 6px;
  box-shadow: var(--shadow-md);
  transition: box-shadow var(--t-med), border-color var(--t-med);
}
.hero-form:focus-within { box-shadow: var(--shadow-glow); border-color: var(--primary-3); }
.hero-form input {
  flex: 1;
  padding: 12px 14px;
  font-size: 15px;
  font-family: inherit;
  border: 0; background: transparent;
  color: var(--text); outline: none;
}
.hero-form input::placeholder { color: var(--muted); }
.hero-form button {
  padding: 12px 22px;
  font-size: 14.5px;
  font-weight: 600;
  border: 0; border-radius: 8px;
  background: var(--text); color: white;
  cursor: pointer;
  transition: background var(--t-fast), transform var(--t-fast);
  white-space: nowrap;
}
.hero-form button:hover { background: #1e2939; transform: translateY(-1px); }
.hero .micro {
  margin-top: 18px;
  font-size: 13.5px;
  color: var(--muted);
  display: inline-flex; align-items: center; gap: 16px;
  flex-wrap: wrap; justify-content: center;
}
.hero .micro span { display: inline-flex; align-items: center; gap: 5px; }
.hero .micro svg { width: 14px; height: 14px; color: #22c55e; }

/* Product preview */
.preview {
  margin: 56px auto 0;
  max-width: 920px;
  padding: 0 24px;
}
.preview-frame {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--r-xl);
  box-shadow: var(--shadow-lg);
  overflow: hidden;
}
.preview-bar {
  display: flex; align-items: center; gap: 6px;
  padding: 12px 16px; border-bottom: 1px solid var(--border); background: var(--surface-2);
}
.preview-bar .dot { width: 11px; height: 11px; border-radius: 50%; background: var(--border-strong); }
.preview-bar .url {
  margin-left: 14px; padding: 4px 10px;
  background: var(--surface); border: 1px solid var(--border);
  border-radius: 6px; font-size: 12px; color: var(--muted);
  font-family: 'JetBrains Mono', ui-monospace, monospace;
}
.preview-body { padding: 28px; }
.preview-grid { display: grid; gap: 12px; grid-template-columns: 1fr; }
@media (min-width: 640px) { .preview-grid { grid-template-columns: 1fr 1fr; } }
@media (min-width: 880px) { .preview-grid { grid-template-columns: repeat(3, 1fr); } }

.svc-card {
  background: var(--surface-2);
  border: 1px solid var(--border);
  border-radius: var(--r-md);
  padding: 16px;
  text-align: left;
}
.svc-card .svc-label { display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; }
.svc-card .svc-name { font-weight: 600; font-size: 14px; color: var(--text); }
.svc-card .svc-pill { padding: 2px 8px; border-radius: 999px; font-size: 11px; font-weight: 600; }
.svc-card .svc-bar { height: 6px; background: var(--border); border-radius: 999px; overflow: hidden; margin-bottom: 8px; }
.svc-card .svc-bar > span { display: block; height: 100%; border-radius: 999px; background: var(--grad-1); }
.svc-card .svc-meta { font-size: 12px; color: var(--muted); display: flex; justify-content: space-between; }
.svc-card.warn .svc-pill { background: #fef3c7; color: #92400e; }
.svc-card.warn .svc-bar > span { background: linear-gradient(135deg,#f59e0b,#fb923c); }
.svc-card.ok .svc-pill { background: #dcfce7; color: #166534; }
.svc-card.crit .svc-pill { background: #fee2e2; color: #991b1b; }
.svc-card.crit .svc-bar > span { background: linear-gradient(135deg,#ef4444,#dc2626); }

/* ───── LOGO STRIP ───── */
.strip { padding: 56px 0 24px; }
.strip .label {
  text-align: center;
  font-size: 12px; text-transform: uppercase; letter-spacing: .12em;
  color: var(--muted); font-weight: 600;
  margin-bottom: 20px;
}
.strip-row {
  display: flex; flex-wrap: wrap; justify-content: center; gap: 14px 38px;
  font-size: 15px; font-weight: 600; color: var(--muted);
  opacity: .85;
}
@media (max-width: 600px) { .strip-row { gap: 12px 22px; font-size: 13.5px; } }

/* ───── SECTION HEADS ───── */
.section { padding: 96px 0; }
@media (max-width: 600px) { .section { padding: 64px 0; } }
.section-eyebrow {
  display: inline-block;
  font-size: 12.5px; text-transform: uppercase;
  letter-spacing: .14em; color: var(--primary);
  font-weight: 700; margin-bottom: 14px;
}
.section h2 {
  font-size: clamp(28px, 4vw, 44px);
  line-height: 1.1; letter-spacing: -.03em;
  font-weight: 800; margin: 0 0 16px;
  text-align: center;
}
.section .sub {
  text-align: center; color: var(--text-2);
  font-size: clamp(16px, 1.5vw, 18px); margin: 0 auto 56px;
  max-width: 600px; line-height: 1.6;
}

/* ───── FEATURES ───── */
.features-grid { display: grid; gap: 18px; grid-template-columns: 1fr; }
@media (min-width: 640px) { .features-grid { grid-template-columns: 1fr 1fr; } }
@media (min-width: 980px) { .features-grid { grid-template-columns: repeat(3, 1fr); } }
.feature {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--r-lg);
  padding: 28px;
  transition: transform var(--t-med), box-shadow var(--t-med), border-color var(--t-med);
}
.feature:hover { transform: translateY(-3px); box-shadow: var(--shadow-md); border-color: transparent; }
.feature-icon {
  width: 44px; height: 44px;
  background: var(--primary-soft);
  color: var(--primary);
  border-radius: 10px;
  display: inline-flex; align-items: center; justify-content: center;
  margin-bottom: 18px;
}
.feature-icon svg { width: 22px; height: 22px; }
.feature h3 {
  font-size: 18px; letter-spacing: -.01em;
  font-weight: 700; margin: 0 0 8px;
}
.feature p {
  margin: 0; color: var(--text-2);
  font-size: 15px; line-height: 1.62;
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
  padding: 30px;
  box-shadow: var(--shadow-xs);
}
.step-n {
  display: inline-flex; align-items: center; justify-content: center;
  width: 32px; height: 32px;
  border-radius: 999px;
  background: var(--text); color: white;
  font-weight: 700; font-size: 14px;
  margin-bottom: 18px;
}
.step h3 { font-size: 18px; letter-spacing: -.01em; font-weight: 700; margin: 0 0 8px; }
.step p { margin: 0; color: var(--text-2); font-size: 15px; line-height: 1.6; }

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
  padding: 32px;
  position: relative;
  transition: transform var(--t-med), box-shadow var(--t-med);
}
.tier:hover { transform: translateY(-3px); box-shadow: var(--shadow-md); }
.tier.pro {
  background: #0a0e1a;
  border: 1px solid #0a0e1a;
  color: #f8fafc;
  box-shadow: var(--shadow-lg);
}
.tier.pro h3 { color: rgba(255,255,255,.55); }
.tier.pro .price { color: #fff; }
.tier.pro .price small { color: rgba(255,255,255,.5); }
.tier.pro .price-sub { color: rgba(255,255,255,.6); }
.tier.pro li { color: #f1f5f9; }
.tier.pro li::before {
  background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%2360a5fa' stroke-width='3.5' stroke-linecap='round' stroke-linejoin='round'><polyline points='20 6 9 17 4 12'/></svg>");
}
.tier .badge-pop {
  position: absolute; top: -12px; right: 28px;
  padding: 5px 12px;
  background: #fff; color: var(--text);
  font-size: 11px; font-weight: 700; letter-spacing: .04em; text-transform: uppercase;
  border-radius: 999px;
  box-shadow: 0 2px 8px rgba(15,23,42,.15);
}
.tier h3 { font-size: 16px; letter-spacing: .01em; text-transform: uppercase; color: var(--text-2); font-weight: 700; margin: 0 0 8px; }
.tier .price { font-size: 48px; font-weight: 800; letter-spacing: -.025em; line-height: 1; margin: 12px 0 4px; }
.tier .price small { font-size: 18px; font-weight: 500; color: var(--muted); }
.tier .price-sub { color: var(--text-2); font-size: 14px; margin: 0 0 24px; }
.tier ul { list-style: none; padding: 0; margin: 0 0 28px; }
.tier li {
  padding: 8px 0 8px 28px;
  font-size: 15px;
  color: var(--text);
  position: relative;
}
.tier li::before {
  content: ''; position: absolute; left: 0; top: 14px;
  width: 14px; height: 14px;
  background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%231e40af' stroke-width='3.5' stroke-linecap='round' stroke-linejoin='round'><polyline points='20 6 9 17 4 12'/></svg>");
  background-size: contain; background-repeat: no-repeat;
}
.tier .cta {
  display: block; text-align: center; padding: 13px;
  border-radius: var(--r-md);
  background: var(--surface); border: 1px solid var(--border-strong); color: var(--text);
  font-weight: 600; font-size: 15px;
  transition: background var(--t-fast), transform var(--t-fast);
}
.tier .cta:hover { background: var(--surface-2); }
.tier.pro .cta { background: #fff; color: var(--text); border: 0; }
.tier.pro .cta:hover { background: rgba(255,255,255,.92); transform: translateY(-1px); }

/* ───── CODE BLOCK ───── */
.code-section { background: var(--bg-mesh); border-top: 1px solid var(--border); }
.code-grid { display: grid; gap: 36px; grid-template-columns: 1fr; align-items: center; max-width: 1100px; margin: 0 auto; }
@media (min-width: 880px) { .code-grid { grid-template-columns: 1fr 1.2fr; } }
.code-text h2 { text-align: left; font-size: clamp(24px, 3vw, 36px); margin-bottom: 12px; }
.code-text p { color: var(--text-2); font-size: 16px; margin: 0 0 12px; line-height: 1.6; }

.code-block {
  background: #0b1220;
  color: #e2e8f0;
  border-radius: var(--r-lg);
  padding: 24px 24px 24px 28px;
  font-family: 'JetBrains Mono', ui-monospace, monospace;
  font-size: 13px;
  line-height: 1.65;
  overflow-x: auto;
  box-shadow: var(--shadow-md);
  position: relative;
}
.code-block::before {
  content: ''; position: absolute; top: 0; left: 0; right: 0; height: 36px;
  background: rgba(255,255,255,.03);
  border-bottom: 1px solid rgba(255,255,255,.06);
  border-radius: var(--r-lg) var(--r-lg) 0 0;
}
.code-block pre { margin: 24px 0 0; }
.code-block .k { color: #93c5fd; }
.code-block .s { color: #86efac; }
.code-block .c { color: #64748b; font-style: italic; }
.code-block .n { color: #fbbf24; }

/* ───── FAQ ───── */
.faq { max-width: 760px; margin: 0 auto; }
.faq details {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--r-md);
  padding: 18px 24px;
  margin-bottom: 12px;
  cursor: pointer;
  transition: border-color var(--t-fast);
}
.faq details:hover { border-color: var(--border-strong); }
.faq details[open] { border-color: var(--primary); box-shadow: var(--shadow-xs); }
.faq summary { font-weight: 600; font-size: 16px; list-style: none; outline: none; display: flex; justify-content: space-between; align-items: center; }
.faq summary::-webkit-details-marker { display: none; }
.faq summary::after {
  content: '';
  width: 12px; height: 12px;
  border-right: 2px solid var(--muted);
  border-bottom: 2px solid var(--muted);
  transform: rotate(45deg);
  transition: transform var(--t-fast);
  margin-right: 4px; margin-bottom: 4px;
}
.faq details[open] summary::after { transform: rotate(-135deg); margin-bottom: 0; margin-top: 4px; }
.faq details > p { margin: 14px 0 0; color: var(--text-2); font-size: 15px; line-height: 1.65; }

/* ───── CTA BOTTOM ───── */
.cta-bottom {
  position: relative;
  text-align: center;
  padding: 112px 0;
  background: var(--text);
  color: white;
  overflow: hidden;
}
.cta-bottom::before {
  content: ''; position: absolute; inset: 0;
  background: radial-gradient(ellipse 60% 50% at 50% 100%, rgba(59,130,246,.22), transparent 70%);
  pointer-events: none;
}
.cta-bottom h2 { color: white; margin-bottom: 14px; font-size: clamp(28px, 4vw, 42px); }
.cta-bottom p { color: rgba(255,255,255,.72); font-size: 17px; margin: 0 0 32px; }
.cta-bottom .hero-form { background: rgba(255,255,255,.08); border: 1px solid rgba(255,255,255,.12); }
.cta-bottom .hero-form:focus-within { border-color: rgba(255,255,255,.4); }
.cta-bottom .hero-form input { color: white; }
.cta-bottom .hero-form input::placeholder { color: rgba(255,255,255,.5); }
.cta-bottom .hero-form button { background: white; color: var(--text); }
.cta-bottom .hero-form button:hover { background: rgba(255,255,255,.92); }

/* ───── FOOTER ───── */
footer {
  padding: 48px 0;
  border-top: 1px solid var(--border);
  background: var(--surface);
  font-size: 14px;
  color: var(--muted);
}
.foot-grid {
  display: grid; gap: 32px; grid-template-columns: 1fr;
}
@media (min-width: 720px) { .foot-grid { grid-template-columns: 2fr 1fr 1fr; } }
.foot-col h4 { font-size: 13px; text-transform: uppercase; letter-spacing: .08em; font-weight: 600; color: var(--text); margin: 0 0 14px; }
.foot-col ul { list-style: none; padding: 0; margin: 0; }
.foot-col li { padding: 4px 0; }
.foot-col a { color: var(--muted); transition: color var(--t-fast); }
.foot-col a:hover { color: var(--text); }
.foot-meta { color: var(--muted); font-size: 13px; line-height: 1.6; }
.foot-meta strong { color: var(--text); font-weight: 600; }
.foot-bottom { margin-top: 32px; padding-top: 24px; border-top: 1px solid var(--border); display: flex; justify-content: space-between; flex-wrap: wrap; gap: 12px; font-size: 13px; }
`;

const ICONS = {
  bell: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>',
  shield: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/></svg>',
  zap: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>',
  eye: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7z"/><circle cx="12" cy="12" r="3"/></svg>',
  cloud: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M17.5 19a4.5 4.5 0 1 0-3-7.9A6 6 0 0 0 3 12a4 4 0 0 0 4 4h10.5z"/></svg>',
  code: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>',
  check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>',
};

const HTML = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>FreeTier Sentinel — Datadog for free tiers</title>
<meta name="description" content="Like Datadog, but for free-tier limits. We email you at 80% — before the cliff. One dashboard for Cloudflare, GitHub Actions, Vercel, Supabase, Resend, and 4 more.">
<meta name="theme-color" content="#1e40af">
<meta property="og:title" content="FreeTier Sentinel — Datadog for free tiers">
<meta property="og:description" content="Like Datadog, but for free-tier limits. Email at 80%, before the cliff.">
<meta property="og:type" content="website">
<meta name="twitter:card" content="summary_large_image">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
<style>${CSS}</style>
</head>
<body>

<nav class="nav">
  <div class="container nav-inner">
    <a href="/" class="brand"><span class="brand-logo">F</span> FreeTier Sentinel</a>
    <div class="nav-links">
      <a href="#features">Features</a>
      <a href="#how">How it works</a>
      <a href="#pricing">Pricing</a>
      <a href="#faq">FAQ</a>
      <a href="/dash" class="nav-cta">Sign in →</a>
    </div>
  </div>
</nav>

<header class="hero">
  <div class="container">
    <div class="eyebrow"><span class="pulse"></span> Watching 8 services. More coming weekly.</div>
    <h1>Watch every free tier.<br>Sleep at night.</h1>
    <p class="lede">Like Datadog, but for free-tier limits.<br>We email at 80% — before the cliff.</p>
    <form class="hero-form" method="POST" action="/signup">
      <input name="email" type="email" placeholder="you@example.com" required autocomplete="email">
      <button type="submit">Get started →</button>
    </form>
    <div class="micro">
      <span>${ICONS.check} Free for 3 services</span>
      <span>${ICONS.check} No credit card</span>
      <span>${ICONS.check} 60-second setup</span>
    </div>
  </div>

  <div class="preview">
    <div class="preview-frame">
      <div class="preview-bar">
        <span class="dot"></span><span class="dot"></span><span class="dot"></span>
        <span class="url">freetier-sentinel.workers.dev/dash</span>
      </div>
      <div class="preview-body">
        <div class="preview-grid">
          <div class="svc-card ok">
            <div class="svc-label"><span class="svc-name">Cloudflare Workers</span><span class="svc-pill">OK</span></div>
            <div class="svc-bar"><span style="width: 34%"></span></div>
            <div class="svc-meta"><span>34,012 / 100,000 req</span><span>34%</span></div>
          </div>
          <div class="svc-card warn">
            <div class="svc-label"><span class="svc-name">Vercel bandwidth</span><span class="svc-pill">WARN</span></div>
            <div class="svc-bar"><span style="width: 82%"></span></div>
            <div class="svc-meta"><span>82.4 / 100 GB</span><span>82%</span></div>
          </div>
          <div class="svc-card warn">
            <div class="svc-label"><span class="svc-name">Resend emails/day</span><span class="svc-pill">WARN</span></div>
            <div class="svc-bar"><span style="width: 73%"></span></div>
            <div class="svc-meta"><span>73 / 100 sent</span><span>73%</span></div>
          </div>
        </div>
      </div>
    </div>
  </div>
</header>

<section class="strip">
  <div class="container">
    <div class="label">Currently monitoring</div>
    <div class="strip-row">
      <span>Cloudflare</span>
      <span>GitHub Actions</span>
      <span>Vercel</span>
      <span>Render</span>
      <span>Supabase</span>
      <span>Neon</span>
      <span>Resend</span>
      <span>R2</span>
    </div>
  </div>
</section>

<section class="section" id="features">
  <div class="container">
    <p class="section-eyebrow center-flex" style="text-align:center;display:block">Why Sentinel</p>
    <h2>Built for indie devs<br>who run real things on free tiers.</h2>
    <p class="sub">Every cloud has a usage page. None of them email you before the cliff. We do.</p>
    <div class="features-grid">
      <div class="feature">
        <div class="feature-icon">${ICONS.bell}</div>
        <h3>Pre-cliff alerts</h3>
        <p>Default 80% threshold. Email immediately. Discord + Telegram on Pro. No more 11pm site-down emergencies.</p>
      </div>
      <div class="feature">
        <div class="feature-icon">${ICONS.shield}</div>
        <h3>Read-only by design</h3>
        <p>We require usage-scope tokens only. AES-256-GCM encryption at rest. Master key in Workers Secrets, never in DB.</p>
      </div>
      <div class="feature">
        <div class="feature-icon">${ICONS.zap}</div>
        <h3>Hourly polling</h3>
        <p>Free: every 12h. Pro: every 1h. Polling is the fastest you can know without webhooks (which most clouds don't expose).</p>
      </div>
      <div class="feature">
        <div class="feature-icon">${ICONS.cloud}</div>
        <h3>Multi-cloud aggregate</h3>
        <p>One dashboard for 8 services and growing. Each adapter ships in about a day. Want one we don't have? Open an issue.</p>
      </div>
      <div class="feature">
        <div class="feature-icon">${ICONS.eye}</div>
        <h3>Usage history</h3>
        <p>7-day rolling history on free, 30-day on Pro. Spot the slow leaks before they become billing surprises.</p>
      </div>
      <div class="feature">
        <div class="feature-icon">${ICONS.code}</div>
        <h3>Open source core</h3>
        <p>The Worker source is on GitHub. Self-host it for free, or pay $5/mo for the hosted version with hourly polling.</p>
      </div>
    </div>
  </div>
</section>

<section class="how section" id="how">
  <div class="container">
    <p class="section-eyebrow center-flex" style="text-align:center;display:block">How it works</p>
    <h2>Three steps. Zero late-night surprises.</h2>
    <p class="sub">From sign-up to first alert in under 60 seconds.</p>
    <div class="steps-grid">
      <div class="step">
        <div class="step-n">1</div>
        <h3>Connect a service</h3>
        <p>Paste a read-only API token from Cloudflare, GitHub Actions, Vercel, or any of the 8 supported SaaS. Tokens encrypted at rest.</p>
      </div>
      <div class="step">
        <div class="step-n">2</div>
        <h3>Set your threshold</h3>
        <p>Default is 80% of free-tier limit. Pick alert channels: email (free), Discord & Telegram (Pro). Multiple per account.</p>
      </div>
      <div class="step">
        <div class="step-n">3</div>
        <h3>Sleep at night</h3>
        <p>We poll every hour (Pro) and notify you the moment usage trips your threshold. Before the cliff, not after.</p>
      </div>
    </div>
  </div>
</section>

<section class="section" id="pricing">
  <div class="container">
    <p class="section-eyebrow center-flex" style="text-align:center;display:block">Pricing</p>
    <h2>Free tier you'll actually use.</h2>
    <p class="sub">Pro is a fair $5/month for 1-hour polling and multi-channel alerts.</p>

    <div class="tiers">
      <div class="tier">
        <h3>Free</h3>
        <div class="price">$0<small> / month</small></div>
        <p class="price-sub">For solo devs validating side projects.</p>
        <ul>
          <li>Up to 3 connected services</li>
          <li>Polling every 12 hours</li>
          <li>Email alerts</li>
          <li>7-day usage history</li>
          <li>Magic-link auth, no passwords</li>
        </ul>
        <a href="#" onclick="document.querySelector('.hero-form input').focus(); window.scrollTo({top:0,behavior:'smooth'}); return false;" class="cta">Start free</a>
      </div>
      <div class="tier pro">
        <span class="badge-pop">Most popular</span>
        <h3>Pro</h3>
        <div class="price">$5<small> / month</small></div>
        <p class="price-sub">For people running real things on free tiers.</p>
        <ul>
          <li>Unlimited connected services</li>
          <li>Polling every hour</li>
          <li>Email + Discord + Telegram alerts</li>
          <li>30-day usage history</li>
          <li>Priority response on bugs</li>
          <li>Self-host the open-source version</li>
        </ul>
        <a href="#" onclick="document.querySelector('.hero-form input').focus(); window.scrollTo({top:0,behavior:'smooth'}); return false;" class="cta">Start free, upgrade later</a>
      </div>
    </div>
  </div>
</section>

<section class="code-section section">
  <div class="container">
    <div class="code-grid">
      <div class="code-text">
        <p class="section-eyebrow">Built on Cloudflare</p>
        <h2>Runs on the same free tier it monitors.</h2>
        <p>Workers + D1 + KV + Cron Triggers. The whole product runs on the free tier of the cloud it's named for. The dogfood is built in.</p>
        <p>You can self-host the open-source version yourself, or pay $5/mo for the hosted version with hourly polling and multi-channel alerts.</p>
      </div>
      <div class="code-block">
<pre><span class="c">// runs every 6 hours on Cloudflare Cron Triggers</span>
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
};</pre>
      </div>
    </div>
  </div>
</section>

<section class="section" id="faq">
  <div class="container">
    <p class="section-eyebrow center-flex" style="text-align:center;display:block">FAQ</p>
    <h2>Common questions.</h2>
    <p class="sub">Reach out if yours isn't here.</p>

    <div class="faq">
      <details>
        <summary>How are my API tokens stored?</summary>
        <p>AES-256-GCM encrypted in Cloudflare D1. The master key lives in Workers Secrets, separately from the database. We require read-only/usage-scope tokens — never tokens with provisioning or write permissions. If you're paranoid, the source is open — read the code yourself.</p>
      </details>
      <details>
        <summary>Will FreeTier Sentinel monitor its own free tier?</summary>
        <p>Yes. The Worker monitors its own usage. If it ever wakes me up because <em>it</em> hit a Cloudflare limit, that means it's working AND people are using it.</p>
      </details>
      <details>
        <summary>Why $5/month instead of free forever?</summary>
        <p>Polling every hour for unlimited services + Discord/Telegram alerts costs real Worker compute and Resend email volume at scale. $5/month is the lowest sustainable price. The free tier is genuinely useful, not a trial.</p>
      </details>
      <details>
        <summary>Can I cancel anytime?</summary>
        <p>One click via the Stripe customer portal. No "contact us to cancel" nonsense. Refunds within 7 days, no questions asked.</p>
      </details>
      <details>
        <summary>What happens at 100%? Do you stop the request for me?</summary>
        <p>No. We don't have permission to control your services — that's by design. We notify you at 80% (default, configurable) so you can act: upgrade the service, optimize traffic, or accept the cliff.</p>
      </details>
      <details>
        <summary>Which SaaS are coming next?</summary>
        <p>Currently shipped: Cloudflare Workers, GitHub Actions. Coming in next 2 weeks: Vercel, Supabase, Render, Resend, Neon, Cloudflare R2. Want one we don't have? <a href="https://github.com/wndnjs3865/freetier-sentinel/issues">Open an issue</a>.</p>
      </details>
      <details>
        <summary>Is there an API or webhooks?</summary>
        <p>Not yet — the Pro plan focus is hourly polling. If you'd find a webhook for usage events useful, tell us in an issue. We'll add it if there's demand.</p>
      </details>
    </div>
  </div>
</section>

<section class="cta-bottom">
  <div class="container-narrow">
    <h2>One dashboard. Zero late-night cliffs.</h2>
    <p>Solo devs lose hours to overages every month. You don't have to.</p>
    <form class="hero-form" method="POST" action="/signup">
      <input name="email" type="email" placeholder="you@example.com" required autocomplete="email">
      <button type="submit">Get magic link →</button>
    </form>
  </div>
</section>

<footer>
  <div class="container">
    <div class="foot-grid">
      <div class="foot-col">
        <p class="foot-meta"><strong>FreeTier Sentinel</strong> — One dashboard for every free-tier SaaS limit you care about. Built solo on Cloudflare Workers, fully open source.</p>
      </div>
      <div class="foot-col">
        <h4>Product</h4>
        <ul>
          <li><a href="#features">Features</a></li>
          <li><a href="#pricing">Pricing</a></li>
          <li><a href="#faq">FAQ</a></li>
          <li><a href="/dash">Sign in</a></li>
        </ul>
      </div>
      <div class="foot-col">
        <h4>Open source</h4>
        <ul>
          <li><a href="https://github.com/wndnjs3865/freetier-sentinel">GitHub</a></li>
          <li><a href="https://github.com/wndnjs3865/freetier-sentinel/issues">Issues</a></li>
        </ul>
      </div>
    </div>
    <div class="container foot-bottom">
      <span>© 2026 FreeTier Sentinel</span>
      <span>Built with Cloudflare Workers · D1 · KV</span>
    </div>
  </div>
</footer>

</body>
</html>`;

export async function handleRoot(_req: Request, _env: Env): Promise<Response> {
  return new Response(HTML, {
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}
