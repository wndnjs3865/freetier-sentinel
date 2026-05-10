/**
 * Billing 도메인 — Service (비즈니스 규칙)
 *
 * 영상 원칙: "실제 비즈니스 규칙을 처리하는 발"
 *
 * 책임:
 *   - Polar webhook event → Plan 변경
 *   - 한도 enforcement (Free 3 services / Pro 무제한)
 *   - Churn 신호 감지 + Retention 제안
 *   - Upsell 결정 로직
 */
import type { Env } from "../../index";
import {
  ACTIVATION_EVENTS,
  DEACTIVATION_EVENTS,
  FREE_QUOTA,
  PRO_QUOTA,
  type AlertChannel,
  type Plan,
  type RetentionOffer,
  type SubscriptionStatus,
} from "./entity";
import {
  setUserPlan,
  findUserForSubscription,
  logBillingEvent,
  recordChurnSignal,
} from "./repository";
import { sendTelegram } from "../../lib/notify";

// ─── Polar webhook event 처리 ────────────────────────────────────

/**
 * Polar 구독 lifecycle event 처리.
 * @returns action 결과 (activate/deactivate/noop/logged)
 */
export async function processSubscriptionEvent(
  env: Env,
  event: any,
): Promise<{ action: string; user_id: string | null; reason?: string }> {
  const type = String(event?.type ?? "");
  if (!type) return { action: "invalid", user_id: null, reason: "missing type" };

  const userId = await findUserForSubscription(env, event);
  const polarId = event?.data?.id ?? null;
  const meta = { type, user_id: userId, polar_id: polarId };

  // 활성화 (Pro 권한 부여)
  if (ACTIVATION_EVENTS.has(type)) {
    // subscription.updated는 status가 active/trialing일 때만 활성화
    if (type === "subscription.updated") {
      const status = String(event?.data?.status ?? "").toLowerCase();
      if (status !== "active" && status !== "trialing") {
        return { action: "noop", user_id: userId, reason: `status=${status}` };
      }
    }
    if (userId !== null) {
      await setUserPlan(env, userId, "pro");
      // Monetization: cancel 후 재활성화는 churn recovery
      if (type === "subscription.uncanceled") {
        await sendTelegram(env, `🎉 Churn recovery — user ${userId} 취소 철회 (uncanceled)`);
      } else {
        await sendTelegram(env, `🆙 Pro 활성화 — user ${userId} via ${type}`);
      }
    }
    await logBillingEvent(env, "polar.activate", JSON.stringify(meta));
    return { action: "activate", user_id: userId };
  }

  // 비활성화 (Free 다운그레이드)
  if (DEACTIVATION_EVENTS.has(type)) {
    if (userId !== null) {
      await setUserPlan(env, userId, "free");
      // Monetization: 사용자 취소는 churn signal
      const churnType =
        type === "subscription.canceled"
          ? "cancel_clicked"
          : type === "subscription.expired"
          ? "low_usage_30d"
          : "downgrade_pro_to_free";
      await recordChurnSignal(env, userId, churnType, { polar_id: polarId, polar_event: type });
      await sendTelegram(env, `👋 Pro → Free — user ${userId} via ${type} (churn signal: ${churnType})`);
    }
    await logBillingEvent(env, "polar.deactivate", JSON.stringify(meta));
    return { action: "deactivate", user_id: userId };
  }

  // 기타 event (order.*, refund.*) — 로그만
  await logBillingEvent(env, "polar.other", JSON.stringify(meta));
  return { action: "logged", user_id: userId };
}

// ─── 한도 enforcement ────────────────────────────────────────────

/** Quota 결과 (한도 검사 응답) */
export interface QuotaCheckResult {
  ok: boolean;
  reason?: string;
  upgradeUrl?: string;
  retentionOffer?: RetentionOffer;
}

/**
 * 서비스 추가 시 plan 한도 검사
 * 사용처: routes/api.ts의 handleApiServices
 */
export function canAddService(plan: Plan, currentServiceCount: number): QuotaCheckResult {
  const quota = plan === "pro" ? PRO_QUOTA : FREE_QUOTA;
  if (currentServiceCount >= quota.max_services) {
    return {
      ok: false,
      reason: `Free plan limited to ${FREE_QUOTA.max_services} services. Upgrade to Pro for unlimited.`,
      upgradeUrl: "/account#upgrade",
    };
  }
  return { ok: true };
}

/**
 * Alert 채널 추가 시 plan 한도 검사
 * Free: email only / Pro: email + discord + telegram + slack
 */
export function canAddChannel(plan: Plan, channelKind: AlertChannel): QuotaCheckResult {
  const quota = plan === "pro" ? PRO_QUOTA : FREE_QUOTA;
  if (!quota.alert_channels.includes(channelKind)) {
    return {
      ok: false,
      reason: `${channelKind} alerts require Pro. Free plan supports email only.`,
      upgradeUrl: "/account#upgrade",
    };
  }
  return { ok: true };
}

// ─── Monetization: Retention Offer ───────────────────────────────

/**
 * 사용자 cancel 직전 표시할 retention offer 결정
 * (현재 hardcoded — 5/13+ 데이터 기반 personalization)
 */
export function suggestRetentionOffer(
  _userId: string,
  subscriptionAgeMonths: number,
  status: SubscriptionStatus,
): RetentionOffer | null {
  if (status !== "active") return null;

  const expiresAt = Math.floor(Date.now() / 1000) + 7 * 86400; // 7일 유효

  // 6개월 미만 → 30% 할인 3개월
  if (subscriptionAgeMonths < 6) {
    return {
      type: "discount_30pct_3mo",
      discount_pct: 30,
      expires_at: expiresAt,
    };
  }

  // 6-12개월 → annual 전환 시 2개월 무료
  if (subscriptionAgeMonths < 12) {
    return {
      type: "annual_switch_2mo_free",
      expires_at: expiresAt,
    };
  }

  // 12개월 이상 → pause 1개월 옵션
  return {
    type: "downgrade_pause",
    expires_at: expiresAt,
  };
}

// ─── Monetization: Upsell 결정 ───────────────────────────────────

/**
 * Free 사용자에게 Pro upgrade prompt 표시 여부 결정
 * 사용처: /dash 페이지 hero card
 */
export function shouldShowUpgradePrompt(
  plan: Plan,
  serviceCount: number,
  alertCount30d: number,
): { show: boolean; reason?: string } {
  if (plan !== "free") return { show: false };

  // 1. 한도 임박 (3 services 중 2 이상)
  if (serviceCount >= 2) {
    return {
      show: true,
      reason: `${serviceCount}/${FREE_QUOTA.max_services} services 사용 중. 무제한 추가하려면 Pro 업그레이드.`,
    };
  }

  // 2. 활발히 사용 (30일 alert 3+ 받음)
  if (alertCount30d >= 3) {
    return {
      show: true,
      reason: "지난 30일 alerts 잘 받고 있어요. Pro로 hourly polling + Discord/Telegram 추가하세요.",
    };
  }

  return { show: false };
}

/**
 * Team tier ($25/mo) 추천 조건
 * Pro 사용자가 5+ services 이상 사용 시
 */
export function shouldSuggestTeamTier(plan: Plan, serviceCount: number): boolean {
  return plan === "pro" && serviceCount >= 5;
}
