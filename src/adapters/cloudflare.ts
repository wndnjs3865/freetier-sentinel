/**
 * Cloudflare adapter — checks Workers daily request usage against free tier (100k/day).
 * Token needs Account Analytics:Read.
 */

const FREE_DAILY_REQUESTS = 100_000;

export async function fetchCloudflareUsage(apiKey: string): Promise<number> {
  // Find first account
  const accRes = await fetch("https://api.cloudflare.com/client/v4/accounts", {
    headers: { authorization: `Bearer ${apiKey}` },
  });
  if (!accRes.ok) throw new Error(`cf accounts ${accRes.status}`);
  const accJson: any = await accRes.json();
  const accountId = accJson.result?.[0]?.id;
  if (!accountId) throw new Error("no cloudflare account");

  // Use GraphQL Analytics API for total worker requests today
  const today = new Date().toISOString().slice(0, 10);
  const q = `query($acc:String!,$since:String!) {
    viewer { accounts(filter:{accountTag:$acc}) {
      workersInvocationsAdaptive(limit:1, filter:{datetimeHour_geq:$since}) {
        sum { requests }
      }
    } }
  }`;
  const r = await fetch("https://api.cloudflare.com/client/v4/graphql", {
    method: "POST",
    headers: {
      authorization: `Bearer ${apiKey}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({ query: q, variables: { acc: accountId, since: `${today}T00:00:00Z` } }),
  });
  if (!r.ok) throw new Error(`cf graphql ${r.status}`);
  const j: any = await r.json();
  const reqs = j?.data?.viewer?.accounts?.[0]?.workersInvocationsAdaptive?.[0]?.sum?.requests || 0;
  return Math.min(100, Math.round((reqs / FREE_DAILY_REQUESTS) * 100));
}
