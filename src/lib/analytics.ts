/**
 * Analytics beacons (Cloudflare Web Analytics + Microsoft Clarity).
 *
 * Tokens are injected via wrangler secrets and gracefully no-op when unset —
 * lets us ship the wiring before tokens exist, then flip on with `wrangler
 * secret put` (zero code change).
 *
 * Secrets:
 *   - CF_BEACON_TOKEN          Cloudflare Web Analytics
 *   - CLARITY_PROJECT_ID       Microsoft Clarity (10-char project ID)
 */

export function analyticsBeacon(token: string | undefined): string {
  if (!token) return "";
  return `<script defer src="https://static.cloudflareinsights.com/beacon.min.js" data-cf-beacon='{"token":"${token}"}'></script>`;
}

export function clarityBeacon(projectId: string | undefined): string {
  if (!projectId) return "";
  // Official Clarity snippet, inlined and minified. Async + non-blocking.
  return `<script>(function(c,l,a,r,i,t,y){c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);})(window,document,"clarity","script","${projectId}");</script>`;
}

/**
 * Combined head injection — call this from any route's <head>.
 * Returns "" until tokens are set, so safe to deploy before signup.
 */
export function analyticsHeads(env: { CF_BEACON_TOKEN?: string; CLARITY_PROJECT_ID?: string }): string {
  return analyticsBeacon(env.CF_BEACON_TOKEN) + clarityBeacon(env.CLARITY_PROJECT_ID);
}
