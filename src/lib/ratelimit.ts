import type { Env } from "../index";

export interface RateLimitOpts {
  key: string;
  limit: number;
  windowSec: number;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetSec: number;
}

export async function checkRateLimit(env: Env, opts: RateLimitOpts): Promise<RateLimitResult> {
  const k = `rl:${opts.key}`;
  const raw = await env.KV.get(k);
  const now = Math.floor(Date.now() / 1000);
  let count = 0;
  let resetAt = now + opts.windowSec;

  if (raw) {
    const parsed = JSON.parse(raw) as { count: number; resetAt: number };
    if (parsed.resetAt > now) {
      count = parsed.count;
      resetAt = parsed.resetAt;
    }
  }

  count += 1;
  const allowed = count <= opts.limit;
  await env.KV.put(k, JSON.stringify({ count, resetAt }), {
    expirationTtl: Math.max(60, resetAt - now + 1),
  });

  return {
    allowed,
    remaining: Math.max(0, opts.limit - count),
    resetSec: resetAt - now,
  };
}

export function getClientIP(req: Request): string {
  return (
    req.headers.get("cf-connecting-ip") ||
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    "unknown"
  );
}
