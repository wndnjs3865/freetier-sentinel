/**
 * Vercel adapter — checks Hobby tier build minutes via deployment count.
 *
 * Vercel's Hobby (free) plan caps build execution at 6,000 minutes/month.
 * The detailed usage API is paid-tier only, so we use deployment count as
 * a proxy: average ~2 min build per deployment.
 *
 * Token requirement: Vercel "Read" scope (no write needed).
 * Create at: https://vercel.com/account/tokens
 *
 * Returns: usage % (0-100) of estimated monthly build-minute cap.
 */

const FREE_BUILD_MINUTES_PER_MONTH = 6000;
const AVG_BUILD_MINUTES_PER_DEPLOY = 2;

export async function fetchVercelUsage(apiKey: string): Promise<number> {
  // Month-start as Unix milliseconds
  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);
  const sinceMs = monthStart.getTime();

  // Fetch deployments since month start (limit 100 per page; paginate if needed)
  let totalDeployments = 0;
  let until: number | undefined;
  let pages = 0;
  const MAX_PAGES = 10; // hard cap to avoid runaway requests

  while (pages < MAX_PAGES) {
    const url = new URL("https://api.vercel.com/v6/deployments");
    url.searchParams.set("since", String(sinceMs));
    url.searchParams.set("limit", "100");
    if (until) url.searchParams.set("until", String(until));

    const r = await fetch(url.toString(), {
      headers: { authorization: `Bearer ${apiKey}` },
    });
    if (!r.ok) throw new Error(`vercel deployments ${r.status}`);
    const data = (await r.json()) as { deployments: Array<{ created: number }>; pagination?: { next?: number } };

    const list = data.deployments || [];
    totalDeployments += list.length;

    if (list.length < 100 || !data.pagination?.next) break;
    until = data.pagination.next;
    pages++;
  }

  // Estimate build minutes: deployment count × average minutes
  const estimatedMinutes = totalDeployments * AVG_BUILD_MINUTES_PER_DEPLOY;
  const pct = (estimatedMinutes / FREE_BUILD_MINUTES_PER_MONTH) * 100;
  return Math.min(100, Math.max(0, Math.round(pct)));
}
