/**
 * GitHub Actions adapter — checks monthly billable minutes against free tier.
 * Free tier: 2000 minutes/month for free public + private (varies).
 * Requires PAT with `read:org` or user-scope `actions:read`.
 */

const FREE_MONTHLY_MINUTES = 2000;

export async function fetchGitHubActionsUsage(apiKey: string): Promise<number> {
  // /user/settings/billing/actions
  const r = await fetch("https://api.github.com/user/settings/billing/actions", {
    headers: {
      authorization: `Bearer ${apiKey}`,
      "user-agent": "freetier-sentinel",
      accept: "application/vnd.github+json",
    },
  });
  if (!r.ok) throw new Error(`github billing ${r.status}`);
  const j: any = await r.json();
  const used = j?.total_minutes_used ?? 0;
  return Math.min(100, Math.round((used / FREE_MONTHLY_MINUTES) * 100));
}
