/**
 * Cloudflare Web Analytics beacon.
 *
 * Token is injected via wrangler secret CF_BEACON_TOKEN. When unset, returns
 * empty string — used so we can ship the wiring before the token exists, and
 * flip it on with `wrangler secret put` (zero code change).
 */
export function analyticsBeacon(token: string | undefined): string {
  if (!token) return "";
  return `<script defer src="https://static.cloudflareinsights.com/beacon.min.js" data-cf-beacon='{"token":"${token}"}'></script>`;
}
