import type { Env } from "../index";

const LANDING_HTML = `<!DOCTYPE html>
<html lang="en"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>FreeTier Sentinel — Stop blowing free-tier limits</title>
<meta name="description" content="Get alerted before Cloudflare, GitHub Actions, Vercel, Supabase, and Resend free-tiers run out.">
<style>
body { font-family: ui-sans-serif, system-ui, sans-serif; max-width: 640px; margin: 3rem auto; padding: 0 1rem; line-height: 1.6; }
h1 { font-size: 2.4rem; margin-bottom: 0.5rem; }
.tagline { color: #555; font-size: 1.1rem; }
form { margin: 2rem 0; display: flex; gap: 0.5rem; }
input { flex: 1; padding: 0.6rem; border: 1px solid #bbb; border-radius: 6px; font-size: 1rem; }
button { padding: 0.6rem 1rem; border: 0; background: #0a66c2; color: #fff; border-radius: 6px; cursor: pointer; font-size: 1rem; }
.tier { border: 1px solid #ddd; padding: 1rem; border-radius: 8px; margin: 0.5rem 0; }
.pro { border-color: #0a66c2; background: #f0f7ff; }
ul { padding-left: 1.2rem; }
footer { margin-top: 3rem; color: #888; font-size: 0.9rem; }
</style></head><body>
<h1>Stop blowing free-tier limits.</h1>
<p class="tagline">Connect your Cloudflare, GitHub, Vercel, Supabase. We watch the usage. Alert before the cliff.</p>

<form method="POST" action="/signup">
  <input name="email" type="email" placeholder="you@example.com" required>
  <button type="submit">Get magic link</button>
</form>

<div class="tier">
  <h3>Free</h3>
  <ul>
    <li>Up to 3 services</li>
    <li>Checks every 12 hours</li>
    <li>Email alerts</li>
  </ul>
</div>
<div class="tier pro">
  <h3>Pro · $5 / month</h3>
  <ul>
    <li>Unlimited services</li>
    <li>Checks every hour</li>
    <li>Discord, Telegram, email alerts</li>
    <li>7-day usage history</li>
  </ul>
</div>

<p>Currently supported: Cloudflare Workers, GitHub Actions, Vercel, Render, Supabase, Neon, Resend, Cloudflare R2.</p>
<footer>Built with Cloudflare Workers · <a href="https://github.com">source</a></footer>
</body></html>`;

export async function handleRoot(_req: Request, _env: Env): Promise<Response> {
  return new Response(LANDING_HTML, {
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}
