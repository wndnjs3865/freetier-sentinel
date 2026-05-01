import type { Env } from "../index";

const BASE_CSS = `
:root {
  --primary: #1e40af;
  --primary-dark: #1e3a8a;
  --primary-light: #dbeafe;
  --accent: #fb923c;
  --bg: #fafafa;
  --surface: #ffffff;
  --text: #0f172a;
  --muted: #64748b;
  --border: #e2e8f0;
  --border-strong: #cbd5e1;
  --shadow-sm: 0 1px 2px rgba(15, 23, 42, 0.05);
  --shadow-md: 0 4px 12px rgba(15, 23, 42, 0.08);
  --shadow-lg: 0 12px 40px rgba(15, 23, 42, 0.12);
  --radius: 8px;
  --radius-lg: 14px;
}
* { box-sizing: border-box; }
html { -webkit-text-size-adjust: 100%; }
body {
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
  font-feature-settings: 'cv02','cv03','cv04','cv11';
  background: var(--bg);
  color: var(--text);
  margin: 0;
  line-height: 1.6;
  -webkit-font-smoothing: antialiased;
}
a { color: var(--primary); text-decoration: none; }
a:hover { text-decoration: underline; }
.container { max-width: 1040px; margin: 0 auto; padding: 0 24px; }
.container-narrow { max-width: 720px; margin: 0 auto; padding: 0 24px; }

/* Nav */
.nav {
  padding: 18px 0;
  border-bottom: 1px solid var(--border);
  background: var(--surface);
  position: sticky; top: 0; z-index: 10;
  backdrop-filter: saturate(140%) blur(8px);
  background: rgba(255,255,255,0.85);
}
.nav-inner { display: flex; align-items: center; justify-content: space-between; }
.nav-brand { font-weight: 700; font-size: 17px; letter-spacing: -0.01em; color: var(--text); }
.nav-brand .dot { color: var(--accent); }
.nav-actions a { font-size: 14px; color: var(--muted); margin-left: 22px; font-weight: 500; }
.nav-actions a.btn-nav { color: var(--surface); background: var(--primary); padding: 8px 16px; border-radius: var(--radius); font-weight: 600; }
.nav-actions a.btn-nav:hover { background: var(--primary-dark); text-decoration: none; }

/* Hero */
.hero { padding: 88px 0 64px; text-align: center; }
.hero h1 {
  font-size: clamp(36px, 6vw, 56px);
  line-height: 1.1;
  letter-spacing: -0.025em;
  font-weight: 800;
  margin: 0 0 20px;
}
.hero h1 .accent { color: var(--primary); }
.hero .lede {
  font-size: 19px; color: var(--muted); max-width: 580px; margin: 0 auto 36px; line-height: 1.55;
}
.hero-form { display: flex; gap: 8px; max-width: 460px; margin: 0 auto; }
.hero-form input {
  flex: 1; padding: 14px 16px; font-size: 16px; font-family: inherit;
  border: 1px solid var(--border-strong); border-radius: var(--radius);
  background: var(--surface); color: var(--text);
  transition: border-color 120ms;
}
.hero-form input:focus { outline: none; border-color: var(--primary); box-shadow: 0 0 0 3px var(--primary-light); }
.hero-form button {
  padding: 14px 22px; font-size: 16px; font-family: inherit; font-weight: 600;
  border: 0; border-radius: var(--radius); background: var(--primary); color: white;
  cursor: pointer; transition: background 120ms;
}
.hero-form button:hover { background: var(--primary-dark); }
.hero .micro { margin-top: 16px; font-size: 13px; color: var(--muted); }
.hero .micro strong { color: var(--text); }

/* Logo strip */
.logo-strip { padding: 32px 0 16px; }
.logo-strip-label { text-align: center; font-size: 12px; text-transform: uppercase; letter-spacing: 0.08em; color: var(--muted); margin-bottom: 18px; font-weight: 600; }
.logo-strip-row {
  display: flex; flex-wrap: wrap; justify-content: center; gap: 14px 28px;
  font-size: 15px; font-weight: 600; color: var(--muted);
}
.logo-strip-row span { display: inline-block; }

/* Sections */
section { padding: 72px 0; }
section h2 {
  font-size: clamp(28px, 4vw, 38px); letter-spacing: -0.02em;
  font-weight: 700; line-height: 1.2; margin: 0 0 16px; text-align: center;
}
section .sub { text-align: center; color: var(--muted); font-size: 17px; margin: 0 0 48px; max-width: 580px; margin-left: auto; margin-right: auto; }

/* How it works */
.how-grid { display: grid; gap: 24px; grid-template-columns: 1fr; }
@media (min-width: 720px) { .how-grid { grid-template-columns: repeat(3, 1fr); } }
.how-card {
  background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-lg);
  padding: 28px; box-shadow: var(--shadow-sm);
}
.how-step { display: inline-flex; align-items: center; justify-content: center;
  width: 32px; height: 32px; border-radius: 50%; background: var(--primary-light);
  color: var(--primary); font-weight: 700; font-size: 14px; margin-bottom: 16px; }
.how-card h3 { font-size: 18px; margin: 0 0 8px; font-weight: 700; }
.how-card p { color: var(--muted); margin: 0; font-size: 15px; line-height: 1.55; }

/* Pricing */
.pricing { background: var(--surface); border-top: 1px solid var(--border); border-bottom: 1px solid var(--border); }
.tier-grid { display: grid; gap: 20px; grid-template-columns: 1fr; }
@media (min-width: 720px) { .tier-grid { grid-template-columns: 1fr 1fr; } }
.tier {
  background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-lg);
  padding: 32px;
}
.tier.pro { border: 2px solid var(--primary); position: relative; }
.tier.pro::before {
  content: 'Most popular'; position: absolute; top: -12px; right: 24px;
  background: var(--accent); color: white; font-size: 11px; font-weight: 700;
  padding: 4px 10px; border-radius: 999px; letter-spacing: 0.04em; text-transform: uppercase;
}
.tier h3 { font-size: 20px; margin: 0 0 4px; font-weight: 700; }
.tier .price { font-size: 36px; font-weight: 800; letter-spacing: -0.025em; margin: 8px 0 4px; }
.tier .price small { font-size: 16px; font-weight: 500; color: var(--muted); }
.tier .price-sub { color: var(--muted); font-size: 14px; margin: 0 0 20px; }
.tier ul { list-style: none; padding: 0; margin: 0 0 24px; }
.tier li { padding: 7px 0; font-size: 15px; color: var(--text); padding-left: 26px; position: relative; }
.tier li::before {
  content: ''; position: absolute; left: 0; top: 12px; width: 16px; height: 16px;
  background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%231e40af' stroke-width='3' stroke-linecap='round' stroke-linejoin='round'><polyline points='20 6 9 17 4 12'/></svg>");
  background-size: contain; background-repeat: no-repeat;
}
.tier .cta {
  display: block; text-align: center; padding: 12px; border-radius: var(--radius);
  background: var(--surface); border: 1px solid var(--border-strong); color: var(--text);
  font-weight: 600; font-size: 15px;
}
.tier.pro .cta { background: var(--primary); color: white; border: 0; }
.tier .cta:hover { text-decoration: none; }
.tier.pro .cta:hover { background: var(--primary-dark); }

/* Supported services */
.supported { background: var(--bg); }
.svc-grid {
  display: grid; gap: 12px; max-width: 720px; margin: 0 auto;
  grid-template-columns: repeat(2, 1fr);
}
@media (min-width: 720px) { .svc-grid { grid-template-columns: repeat(4, 1fr); } }
.svc-pill {
  background: var(--surface); border: 1px solid var(--border);
  padding: 14px 12px; border-radius: var(--radius); text-align: center;
  font-size: 14px; font-weight: 500; color: var(--text);
}

/* FAQ */
.faq { max-width: 720px; margin: 0 auto; }
.faq details {
  background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius);
  padding: 18px 20px; margin-bottom: 10px; cursor: pointer;
}
.faq summary { font-weight: 600; font-size: 16px; list-style: none; outline: none; }
.faq summary::after { content: '+'; float: right; color: var(--muted); font-weight: 300; font-size: 22px; line-height: 1; }
.faq details[open] summary::after { content: '−'; }
.faq details > p { margin: 12px 0 0; color: var(--muted); font-size: 15px; line-height: 1.6; }

/* CTA bottom */
.cta-bottom { text-align: center; padding: 80px 0; background: var(--primary); color: white; }
.cta-bottom h2 { color: white; margin-bottom: 20px; }
.cta-bottom p { color: rgba(255,255,255,0.8); font-size: 17px; margin: 0 0 28px; }
.cta-bottom .hero-form input { background: rgba(255,255,255,0.95); }
.cta-bottom .hero-form button { background: var(--accent); }
.cta-bottom .hero-form button:hover { background: #ea7c2c; }

/* Footer */
footer { padding: 40px 0; border-top: 1px solid var(--border); background: var(--surface); font-size: 14px; color: var(--muted); }
.foot-row { display: flex; justify-content: space-between; flex-wrap: wrap; gap: 12px; }
footer a { color: var(--muted); }
`;

const LANDING_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>FreeTier Sentinel — Stop blowing free-tier limits across Cloudflare, GitHub, Vercel</title>
<meta name="description" content="One dashboard for all your free-tier SaaS usage. Get email + Discord alerts before Cloudflare, GitHub Actions, Vercel, Supabase, Resend hit the cliff. Free for 3 services.">
<meta property="og:title" content="FreeTier Sentinel — Stop blowing free-tier limits">
<meta property="og:description" content="One dashboard for free-tier SaaS usage. Email + Discord alerts before the cliff.">
<meta property="og:type" content="website">
<meta name="twitter:card" content="summary_large_image">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<style>${BASE_CSS}</style>
</head>
<body>

<nav class="nav">
  <div class="container nav-inner">
    <a href="/" class="nav-brand">FreeTier<span class="dot">•</span>Sentinel</a>
    <div class="nav-actions">
      <a href="#pricing">Pricing</a>
      <a href="#faq">FAQ</a>
      <a href="/dash" class="btn-nav">Sign in</a>
    </div>
  </div>
</nav>

<header class="hero container">
  <h1>Stop blowing<br><span class="accent">free-tier limits.</span></h1>
  <p class="lede">Connect your Cloudflare, GitHub Actions, Vercel, Supabase, Resend. We watch the usage and email you before any one of them hits the cliff.</p>
  <form class="hero-form" method="POST" action="/signup">
    <input name="email" type="email" placeholder="you@example.com" required autocomplete="email">
    <button type="submit">Get magic link →</button>
  </form>
  <p class="micro"><strong>Free</strong> for up to 3 services · No credit card · Cancel anytime</p>
</header>

<section class="logo-strip" style="padding-top:0">
  <div class="container">
    <div class="logo-strip-label">Currently monitoring</div>
    <div class="logo-strip-row">
      <span>Cloudflare</span><span>GitHub Actions</span><span>Vercel</span><span>Supabase</span><span>Render</span><span>Neon</span><span>Resend</span><span>R2</span>
    </div>
  </div>
</section>

<section>
  <div class="container">
    <h2>How it works</h2>
    <p class="sub">Three steps. One dashboard. Zero late-night surprises.</p>
    <div class="how-grid">
      <div class="how-card">
        <div class="how-step">1</div>
        <h3>Connect a service</h3>
        <p>Paste a read-only API token from Cloudflare, GitHub, Vercel, or any of the seven supported SaaS. Tokens encrypted at rest with AES-256.</p>
      </div>
      <div class="how-card">
        <div class="how-step">2</div>
        <h3>Set your threshold</h3>
        <p>Default is 80% of free-tier limit. Set tighter for critical services. Alert channels: email, Discord, Telegram.</p>
      </div>
      <div class="how-card">
        <div class="how-step">3</div>
        <h3>Sleep at night</h3>
        <p>We poll every 6 hours (free) or every hour (Pro). When usage trips your threshold, you get notified before it bites.</p>
      </div>
    </div>
  </div>
</section>

<section class="pricing" id="pricing">
  <div class="container">
    <h2>Honest pricing</h2>
    <p class="sub">Free is genuinely free. Pro is for people who'd rather pay $5 than wake up to a downed site.</p>
    <div class="tier-grid">
      <div class="tier">
        <h3>Free</h3>
        <div class="price">$0<small>/month</small></div>
        <p class="price-sub">For solo devs validating side projects.</p>
        <ul>
          <li>Up to 3 connected services</li>
          <li>Checks every 12 hours</li>
          <li>Email alerts</li>
          <li>7-day usage history</li>
        </ul>
        <a href="#" onclick="document.querySelector('.hero-form input').focus(); return false;" class="cta">Start free</a>
      </div>
      <div class="tier pro">
        <h3>Pro</h3>
        <div class="price">$5<small>/month</small></div>
        <p class="price-sub">For people running real things on free tiers.</p>
        <ul>
          <li>Unlimited connected services</li>
          <li>Checks every hour</li>
          <li>Email + Discord + Telegram alerts</li>
          <li>30-day usage history</li>
          <li>Priority response on bugs</li>
        </ul>
        <a href="#" onclick="document.querySelector('.hero-form input').focus(); return false;" class="cta">Start free, upgrade later</a>
      </div>
    </div>
  </div>
</section>

<section class="supported">
  <div class="container">
    <h2>Eight services. Growing weekly.</h2>
    <p class="sub">Adapter for any SaaS with a usage API takes us about a day.</p>
    <div class="svc-grid">
      <div class="svc-pill">Cloudflare Workers</div>
      <div class="svc-pill">GitHub Actions</div>
      <div class="svc-pill">Vercel</div>
      <div class="svc-pill">Render</div>
      <div class="svc-pill">Supabase</div>
      <div class="svc-pill">Neon</div>
      <div class="svc-pill">Resend</div>
      <div class="svc-pill">Cloudflare R2</div>
    </div>
  </div>
</section>

<section id="faq">
  <div class="container">
    <h2>FAQ</h2>
    <div class="faq">
      <details>
        <summary>How do you store my API tokens?</summary>
        <p>AES-256-GCM encrypted in Cloudflare D1. The master key lives in Workers Secrets and never touches the database. We require read-only/usage-scope tokens — never tokens with provisioning or write permissions.</p>
      </details>
      <details>
        <summary>Will this monitor my own free tier of FreeTier Sentinel?</summary>
        <p>Yes. We dogfood the product on our own infrastructure. The Worker monitors its own free-tier usage of itself.</p>
      </details>
      <details>
        <summary>Why Pro at $5/month instead of free forever?</summary>
        <p>Polling more frequently and supporting Discord + Telegram costs money to operate at scale. $5/month is the lowest sustainable price. The free tier is genuinely useful, not a trial.</p>
      </details>
      <details>
        <summary>Can I cancel anytime?</summary>
        <p>Yes — one click via the Stripe customer portal. No "contact us to cancel" nonsense.</p>
      </details>
      <details>
        <summary>What happens at 100%? Do you stop the request for me?</summary>
        <p>No. We don't have permission to control your services. We notify you at 80% (default) so you can act — upgrade the service, optimize traffic, or accept the cliff.</p>
      </details>
      <details>
        <summary>Is this open source?</summary>
        <p>Yes. The Worker source is on <a href="https://github.com/wndnjs3865/freetier-sentinel">GitHub</a>. The hosted product takes a small fee for the operational burden.</p>
      </details>
    </div>
  </div>
</section>

<section class="cta-bottom">
  <div class="container-narrow">
    <h2>One dashboard. Zero surprises.</h2>
    <p>Solo devs lose hours to free-tier overages every month. You don't have to.</p>
    <form class="hero-form" method="POST" action="/signup">
      <input name="email" type="email" placeholder="you@example.com" required autocomplete="email">
      <button type="submit">Get magic link →</button>
    </form>
  </div>
</section>

<footer>
  <div class="container foot-row">
    <span>FreeTier Sentinel · Built with Cloudflare Workers</span>
    <span><a href="https://github.com/wndnjs3865/freetier-sentinel">GitHub</a> · <a href="/dash">Sign in</a></span>
  </div>
</footer>

</body>
</html>`;

export async function handleRoot(_req: Request, _env: Env): Promise<Response> {
  return new Response(LANDING_HTML, {
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}
