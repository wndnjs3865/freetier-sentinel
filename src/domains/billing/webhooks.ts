/**
 * Billing 도메인 — Webhook handler (Polar)
 *
 * 영상 원칙: HTTP layer는 thin — service.ts에 위임.
 *
 * Endpoint: POST /webhooks/polar
 * Signing: standardwebhooks (Polar 공식 방식)
 *   - secret = POLAR_WEBHOOK_SECRET (raw UTF-8 bytes 그대로)
 *   - 자세한 내용: 메모리 polar_webhook_signing_spec.md (5/8 검증)
 */
import type { Env } from "../../index";
import { Webhook, WebhookVerificationError } from "standardwebhooks";
import { processSubscriptionEvent } from "./service";

export async function handlePolarWebhook(req: Request, env: Env): Promise<Response> {
  const secret = env.POLAR_WEBHOOK_SECRET;
  if (!secret) {
    return new Response(
      JSON.stringify({ ok: false, error: "POLAR_WEBHOOK_SECRET not configured" }),
      { status: 503, headers: { "content-type": "application/json" } },
    );
  }

  // standardwebhooks library — Polar 공식 방식 (raw UTF-8 bytes)
  const secretBytes = new TextEncoder().encode(secret);
  const body = await req.text();

  const headersObj: Record<string, string> = {};
  req.headers.forEach((v, k) => {
    headersObj[k.toLowerCase()] = v;
  });

  // 서명 검증
  let event: any;
  try {
    const wh = new Webhook(secretBytes, { format: "raw" });
    event = wh.verify(body, headersObj);
  } catch (e) {
    const reason = e instanceof WebhookVerificationError ? e.message : String(e);
    console.log("[billing.webhooks] verify failed:", reason);
    return new Response(JSON.stringify({ ok: false, error: reason }), {
      status: 401,
      headers: { "content-type": "application/json" },
    });
  }

  // service.ts에 위임 (비즈니스 규칙)
  const result = await processSubscriptionEvent(env, event);
  return new Response(JSON.stringify({ ok: true, ...result }), {
    headers: { "content-type": "application/json" },
  });
}
