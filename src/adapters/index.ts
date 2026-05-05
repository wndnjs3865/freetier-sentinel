/**
 * Adapter dispatch — fetch usage % for each supported service kind.
 * MVP: cloudflare + github only. Others stubbed for week 5–6.
 */
import { fetchCloudflareUsage } from "./cloudflare";
import { fetchGitHubActionsUsage } from "./github";
import { fetchVercelUsage } from "./vercel";

export async function fetchUsage(kind: string, apiKey: string): Promise<number> {
  switch (kind) {
    case "cloudflare": return fetchCloudflareUsage(apiKey);
    case "github":     return fetchGitHubActionsUsage(apiKey);
    case "vercel":     return fetchVercelUsage(apiKey);
    case "supabase":
    case "render":
    case "neon":
    case "resend":
    case "r2":
      throw new Error(`adapter for ${kind} not yet implemented`);
    default:
      throw new Error(`unknown kind: ${kind}`);
  }
}
