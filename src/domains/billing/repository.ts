/**
 * Billing 도메인 — Repository
 *
 * 책임: D1 read/write + Polar API 호출 (외부 통합).
 * 비즈니스 규칙은 service.ts. 단순 데이터 접근만.
 *
 * 영상 원칙: "데이터베이스에서 꺼내오고 저장하는 발"
 */
import type { Env } from "../../index";
import type { Plan, Customer } from "./entity";

// ─── D1: User Plan 동기화 ────────────────────────────────────────

/** 사용자 plan 변경 (Polar webhook → D1) */
export async function setUserPlan(env: Env, userId: string, plan: Plan): Promise<void> {
  await env.DB.prepare("UPDATE users SET plan = ? WHERE id = ?")
    .bind(plan, userId)
    .run();
}

/** 사용자 plan 조회 */
export async function getUserPlan(env: Env, userId: string): Promise<Plan> {
  const row = await env.DB.prepare("SELECT plan FROM users WHERE id = ?")
    .bind(userId)
    .first<{ plan: Plan }>();
  return row?.plan === "pro" ? "pro" : "free";
}

// ─── D1: Polar Webhook → 사용자 매핑 ─────────────────────────────

/**
 * Polar payload에서 user_id 해석
 * Path 1: metadata.user_id (checkout URL param에 박힘) — 가장 정확
 * Path 2: customer.email → D1 users.email lookup
 */
export async function findUserForSubscription(env: Env, payload: any): Promise<string | null> {
  const data = payload?.data ?? payload;

  // Path 1: explicit metadata
  const metaUid =
    data?.metadata?.user_id ??
    data?.subscription?.metadata?.user_id ??
    data?.checkout?.metadata?.user_id;
  if (metaUid) return String(metaUid);

  // Path 2: email fallback
  const email =
    data?.customer?.email ??
    data?.user?.email ??
    data?.subscription?.customer?.email ??
    data?.checkout?.customer_email;
  if (email) {
    const row = await env.DB.prepare("SELECT id FROM users WHERE email = ?")
      .bind(String(email).toLowerCase())
      .first<{ id: string }>();
    if (row?.id) return row.id;
  }

  return null;
}

// ─── D1: Billing 이벤트 로깅 ─────────────────────────────────────

/** Polar webhook + Billing 이벤트 audit log */
export async function logBillingEvent(env: Env, kind: string, message: string): Promise<void> {
  try {
    await env.DB.prepare(
      "INSERT INTO alert_log (kind, message, created_at) VALUES (?, ?, ?)",
    )
      .bind(kind, message.slice(0, 1000), Math.floor(Date.now() / 1000))
      .run();
  } catch {
    // alert_log 테이블 없으면 silent fail
  }
}

/** Churn 신호 기록 (Monetization data) */
export async function recordChurnSignal(
  env: Env,
  userId: string,
  signal: string,
  metadata?: Record<string, unknown>,
): Promise<void> {
  try {
    await env.DB.prepare(
      "INSERT INTO events (id, user_id, kind, data, created_at) VALUES (?, ?, ?, ?, ?)",
    )
      .bind(
        crypto.randomUUID(),
        userId,
        `churn:${signal}`,
        JSON.stringify(metadata || {}),
        Math.floor(Date.now() / 1000),
      )
      .run();
  } catch {
    // events 테이블 없으면 silent fail
  }
}

// ─── Polar API: Customer + Subscription fetch ────────────────────

/**
 * Polar API에서 customer + subscription + order 조회
 * /account 페이지에서 사용. (현재 routes/account.ts에 inline — 5/13+ 옮길 예정)
 */
export async function fetchCustomerWithSubscriptions(
  env: Env,
  email: string,
): Promise<any | null> {
  const apiKey = env.POLAR_API_KEY;
  if (!apiKey) return null;

  try {
    const customerRes = await fetch(
      `https://api.polar.sh/v1/customers/?email=${encodeURIComponent(email)}`,
      { headers: { Authorization: `Bearer ${apiKey}` } },
    );
    if (!customerRes.ok) return null;
    const customers = (await customerRes.json()) as any;
    const customer = customers?.items?.[0];
    if (!customer) return null;

    const [subsRes, ordersRes] = await Promise.all([
      fetch(
        `https://api.polar.sh/v1/subscriptions/?customer_id=${customer.id}&limit=10`,
        { headers: { Authorization: `Bearer ${apiKey}` } },
      ),
      fetch(
        `https://api.polar.sh/v1/orders/?customer_id=${customer.id}&limit=10`,
        { headers: { Authorization: `Bearer ${apiKey}` } },
      ),
    ]);

    const subscriptions = subsRes.ok ? ((await subsRes.json()) as any).items || [] : [];
    const orders = ordersRes.ok ? ((await ordersRes.json()) as any).items || [] : [];

    return { customer, subscriptions, orders };
  } catch (e) {
    console.error("[billing.repository] fetchCustomerWithSubscriptions:", e);
    return null;
  }
}

/**
 * Polar customer portal session 생성
 * 사용자가 결제 정보 변경 / 취소 / 영수증 받는 일관된 채널
 */
export async function createPortalSession(env: Env, customerId: string): Promise<string | null> {
  const apiKey = env.POLAR_API_KEY;
  if (!apiKey) return null;

  try {
    const res = await fetch("https://api.polar.sh/v1/customer-sessions/", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({ customer_id: customerId }),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as any;
    return data?.customer_portal_url || null;
  } catch (e) {
    console.error("[billing.repository] createPortalSession:", e);
    return null;
  }
}
