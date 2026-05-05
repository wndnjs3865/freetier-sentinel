import type { Env } from "../index";
import { analyticsBeacon } from "../lib/analytics";

const CSS = String.raw`
* { box-sizing: border-box; }
body {
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, system-ui, sans-serif;
  font-feature-settings: 'cv02','cv03','cv11','ss01';
  background: #fff;
  color: #0a0e1a;
  margin: 0;
  line-height: 1.65;
  -webkit-font-smoothing: antialiased;
}
.container { max-width: 720px; margin: 0 auto; padding: 64px 24px 96px; }
@media (max-width: 600px) { .container { padding: 40px 18px 64px; } }
.brand {
  display: inline-flex; align-items: center; gap: 8px;
  font-weight: 700; font-size: 15px; color: #0a0e1a;
  text-decoration: none; margin-bottom: 32px;
}
.brand-logo {
  width: 22px; height: 22px;
  display: inline-flex; align-items: center; justify-content: center;
  border-radius: 6px;
  background: linear-gradient(135deg, #1e40af, #3b82f6);
  color: #fff; font-size: 12px; font-weight: 800;
}
h1 {
  font-size: clamp(28px, 4vw, 40px);
  letter-spacing: -.03em;
  font-weight: 800;
  margin: 0 0 8px;
  line-height: 1.15;
}
.updated {
  color: #64748b; font-size: 14px; margin: 0 0 40px;
}
h2 {
  font-size: 18px; letter-spacing: -.01em;
  font-weight: 700; margin: 36px 0 12px;
}
p, li {
  color: #334155; font-size: 15.5px;
  margin: 0 0 12px;
}
ul { padding-left: 20px; margin: 0 0 16px; }
li { margin-bottom: 6px; }
strong { color: #0a0e1a; font-weight: 600; }
a { color: #1e40af; text-decoration: none; }
a:hover { color: #2563eb; text-decoration: underline; }
code {
  font-family: 'JetBrains Mono', ui-monospace, monospace;
  font-size: 13.5px; background: #f8fafc; padding: 1px 6px;
  border-radius: 4px; color: #1e293b;
}
.back {
  display: inline-block; margin-top: 48px;
  font-size: 14px; color: #64748b;
}
.back:hover { color: #0a0e1a; }
`;

const HEADER = `<a href="/" class="brand"><span class="brand-logo">F</span> FreeTier Sentinel</a>`;
const FOOTER_NAV = `<a href="/" class="back">← Back to home</a>`;

const privacyHtml = (beacon: string) => `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Privacy Policy — FreeTier Sentinel</title>
<meta name="robots" content="index,follow">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
<style>${CSS}</style>
${beacon}
</head>
<body>
<div class="container">
${HEADER}
<h1>Privacy Policy</h1>
<p class="updated">Last updated: May 4, 2026</p>

<p>FreeTier Sentinel (operated by 강주원, contact <a href="mailto:wndnjs3865@gmail.com">wndnjs3865@gmail.com</a>) is a free-tier usage monitoring service. This policy explains what data we collect, why, and how to control it.</p>

<h2>What we collect</h2>
<ul>
  <li><strong>Email address</strong> — for sign-in (magic link / 6-digit code) and to send usage alerts.</li>
  <li><strong>API tokens you connect</strong> — read-only tokens for the SaaS services you choose to monitor (e.g. Cloudflare, GitHub Actions). Stored <strong>AES-256-GCM encrypted</strong> in Cloudflare D1; the master encryption key lives in Workers Secrets, separate from the database.</li>
  <li><strong>Usage data</strong> — the percentages we fetch from the SaaS APIs you connected, plus alert history (when threshold was crossed).</li>
  <li><strong>Payment data (Pro tier only)</strong> — handled entirely by <a href="https://stripe.com">Stripe</a>. We never see your card. We store only your Stripe customer ID and subscription status.</li>
  <li><strong>Operational logs</strong> — Cloudflare Workers automatically logs request metadata (IP, timestamp, status). Used for debugging and abuse prevention. Retained per Cloudflare's policy.</li>
</ul>

<h2>What we don't collect</h2>
<ul>
  <li>No third-party analytics, advertising trackers, or session recording.</li>
  <li>No tokens with write/provisioning/billing scopes — we explicitly require read-only/usage-scope tokens.</li>
  <li>No payment card details — Stripe handles all payment processing.</li>
</ul>

<h2>Where data lives</h2>
<p>Cloudflare Workers, D1 (SQLite at edge), and KV. Cloudflare's data centers are globally distributed. Stripe handles payment data per its own privacy policy. Resend handles transactional email delivery on our behalf.</p>

<h2>Retention</h2>
<ul>
  <li>Account data (email, services, alerts): retained until account deletion.</li>
  <li>Usage history: 7 days (Free) / 30 days (Pro), then automatically purged.</li>
  <li>Magic-link tokens: 15 minutes max, then deleted.</li>
  <li>Sessions: 30 days, then expire.</li>
</ul>

<h2>Your rights (GDPR / similar regimes)</h2>
<p>If you reside in the EU, UK, California, or any jurisdiction granting equivalent rights, you have:</p>
<ul>
  <li><strong>Access</strong> — request a copy of all data we hold on you.</li>
  <li><strong>Deletion</strong> — request full account + data deletion.</li>
  <li><strong>Correction</strong> — fix incorrect data (e.g. update email).</li>
  <li><strong>Portability</strong> — receive your data in a machine-readable format.</li>
  <li><strong>Withdraw consent</strong> — at any time, by deleting your account.</li>
</ul>
<p>To exercise any of these rights, email <a href="mailto:wndnjs3865@gmail.com">wndnjs3865@gmail.com</a>. We respond within 30 days.</p>

<h2>Subprocessors</h2>
<ul>
  <li><strong>Cloudflare</strong> — hosting, edge compute, database, KV. <a href="https://www.cloudflare.com/privacypolicy/">Privacy policy</a>.</li>
  <li><strong>Stripe</strong> — payment processing for Pro tier. <a href="https://stripe.com/privacy">Privacy policy</a>.</li>
  <li><strong>Resend</strong> — transactional email delivery. <a href="https://resend.com/legal/privacy-policy">Privacy policy</a>.</li>
  <li><strong>GitHub</strong> — source code hosting only. No user data sent to GitHub.</li>
</ul>

<h2>Cookies</h2>
<p>We set one cookie: a session cookie (<code>fts_session</code>) after sign-in, expiring after 30 days. No tracking or advertising cookies.</p>

<h2>Children</h2>
<p>This service is not directed at children under 16. Do not sign up if you're under 16.</p>

<h2>Changes</h2>
<p>If we materially change this policy, we'll email registered users at least 14 days before the change takes effect. The "Last updated" date at the top reflects the most recent revision.</p>

<h2>Contact</h2>
<p>Questions? Email <a href="mailto:wndnjs3865@gmail.com">wndnjs3865@gmail.com</a>.</p>

${FOOTER_NAV}
</div>
</body>
</html>`;

const termsHtml = (beacon: string) => `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Terms of Service — FreeTier Sentinel</title>
<meta name="robots" content="index,follow">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
<style>${CSS}</style>
${beacon}
</head>
<body>
<div class="container">
${HEADER}
<h1>Terms of Service</h1>
<p class="updated">Last updated: May 4, 2026</p>

<p>By using FreeTier Sentinel ("the Service", operated by 강주원, contact <a href="mailto:wndnjs3865@gmail.com">wndnjs3865@gmail.com</a>), you agree to these terms. If you don't agree, don't use the Service.</p>

<h2>What the Service does</h2>
<p>FreeTier Sentinel polls the public APIs of SaaS providers you connect (using read-only tokens you provide), tracks your usage against the free-tier limits of those providers, and sends you email (Free) or email + Discord + Telegram (Pro) alerts when you approach a configurable threshold (default 80%).</p>

<h2>Accounts</h2>
<ul>
  <li>Sign-in is via email (magic link or 6-digit code). No passwords.</li>
  <li>You're responsible for the security of the email account you sign up with.</li>
  <li>One account per email. Sharing accounts is allowed but at your own risk.</li>
</ul>

<h2>Plans, payment, and refunds</h2>
<ul>
  <li><strong>Free tier</strong>: up to 3 connected services, 12-hour polling, email-only alerts, 7-day usage history. No card required.</li>
  <li><strong>Pro tier</strong>: $5 USD per month, billed via Stripe. Unlimited services, 1-hour polling, multi-channel alerts (email + Discord + Telegram), 30-day usage history.</li>
  <li><strong>Cancellation</strong>: one click via the Stripe customer portal. No "contact us to cancel" required.</li>
  <li><strong>Refunds</strong>: full refund within 7 days of any charge, no questions asked. After 7 days, no refund (you keep Pro until the end of the billing period).</li>
  <li><strong>Price changes</strong>: we'll email you at least 30 days before any price change for existing subscribers.</li>
</ul>

<h2>Acceptable use</h2>
<p>You will not:</p>
<ul>
  <li>Submit tokens with write, provisioning, or billing scopes — we require read-only tokens by design.</li>
  <li>Use the Service to monitor accounts you don't own or aren't authorized to monitor.</li>
  <li>Abuse the signup flow (e.g. mass-signup attacks, email-bombing). We rate-limit and may block.</li>
  <li>Reverse engineer, scrape, or attempt to extract data from other users' accounts.</li>
  <li>Use the Service for any unlawful purpose.</li>
</ul>

<h2>What we promise — and don't</h2>
<p><strong>Best-effort polling, not real-time guarantees.</strong> Polling intervals are 12 hours (Free) and 1 hour (Pro). The Service is provided as-is. We don't guarantee:</p>
<ul>
  <li>That every alert reaches you on time. Email/Discord/Telegram delivery depends on third-party providers.</li>
  <li>That a SaaS provider's API will remain available or that its usage data will be accurate.</li>
  <li>That the Service will be free of bugs or downtime. We aim for high availability, but the Service runs on Cloudflare's free tier (yes, really — see our landing page).</li>
</ul>
<p>You are ultimately responsible for monitoring your own services. FreeTier Sentinel is a backup safety net, not a primary monitoring system for production-critical workloads. If a missed alert leads to a service interruption or overage, that's between you and your SaaS provider; we are not liable.</p>

<h2>Limitation of liability</h2>
<p>To the maximum extent permitted by applicable law, our total liability for any claim arising from your use of the Service is limited to the amount you paid us in the 12 months preceding the claim (i.e., at most $60). We are not liable for any indirect, incidental, special, consequential, or punitive damages, including lost profits or lost data.</p>

<h2>Intellectual property</h2>
<p>The FreeTier Sentinel name and brand are owned by 강주원. The source code is open source and available at <a href="https://github.com/wndnjs3865/freetier-sentinel">github.com/wndnjs3865/freetier-sentinel</a> under its repository license.</p>

<h2>Termination</h2>
<p>You may cancel and delete your account at any time. We may suspend or terminate accounts that violate these terms or abuse the Service. We'll give you 14 days' notice for terminations not caused by abuse, and immediate termination for clear abuse (with refund of any unused Pro period).</p>

<h2>Changes to these terms</h2>
<p>We may update these terms. For material changes, we'll email registered users at least 14 days before the change. Continued use after the effective date constitutes acceptance.</p>

<h2>Governing law</h2>
<p>These terms are governed by the laws of the Republic of Korea. Disputes will be resolved in the courts of Seoul, Republic of Korea, except where mandatory consumer-protection laws of your jurisdiction apply.</p>

<h2>Contact</h2>
<p>Questions, concerns, or refund requests: <a href="mailto:wndnjs3865@gmail.com">wndnjs3865@gmail.com</a>.</p>

${FOOTER_NAV}
</div>
</body>
</html>`;

export async function handlePrivacy(_req: Request, env: Env): Promise<Response> {
  return new Response(privacyHtml(analyticsBeacon(env.CF_BEACON_TOKEN)), {
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}

export async function handleTerms(_req: Request, env: Env): Promise<Response> {
  return new Response(termsHtml(analyticsBeacon(env.CF_BEACON_TOKEN)), {
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}
