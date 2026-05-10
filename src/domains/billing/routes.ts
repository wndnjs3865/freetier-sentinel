/**
 * Billing 도메인 — HTTP Routes (Webhook 외)
 *
 * 영상 원칙: thin HTTP layer. 모든 비즈니스 규칙은 service.ts.
 *
 * Endpoints:
 *   - GET /api/billing/portal  → Polar customer portal URL redirect
 *
 * Note: /account 페이지 (subscription view + cancel/upgrade UI)는 현재
 *       routes/account.ts에 inline. 5/13+ 이쪽으로 이전 예정.
 */
import type { Env } from "../../index";
import { getUserFromCookie } from "../../routes/auth";
import { fetchCustomerWithSubscriptions, createPortalSession } from "./repository";

/** GET /api/billing/portal — Polar customer portal session 생성 + redirect */
export async function handleBillingPortal(req: Request, env: Env): Promise<Response> {
  const user = await getUserFromCookie(req, env);
  if (!user) return Response.redirect(`${env.APP_URL}/`, 302);

  const data = await fetchCustomerWithSubscriptions(env, user.email);
  if (!data?.customer?.id) {
    // Polar customer 미존재 → 결제 페이지로 redirect
    const checkout = env.POLAR_CHECKOUT_URL;
    if (checkout) return Response.redirect(checkout, 302);
    return Response.redirect(`${env.APP_URL}/account`, 302);
  }

  const portalUrl = await createPortalSession(env, data.customer.id);
  if (portalUrl) return Response.redirect(portalUrl, 302);

  // Portal session 생성 실패 → /account로 fallback
  return Response.redirect(`${env.APP_URL}/account?portal_error=1`, 302);
}
