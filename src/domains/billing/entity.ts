/**
 * Billing 도메인 — Entity (Ubiquitous Language)
 *
 * 비즈니스 용어 ↔ 코드 이름 1:1 매핑. 이 파일이 Billing의 사전(語典).
 *
 * 비즈니스 컨텍스트:
 *   - 메인 결제 채널: Polar.sh (Merchant of Record, D-009 채택)
 *   - 사업자: 일반과세자 607-20-94796 (D-008)
 *   - Pro tier: $5/mo (i18n.ts에 명시)
 *   - PHFREE6MO: PH 50명 한정 6개월 무료 (5/9 LIVE, D-009)
 *   - 한국 세금계산서: Hometax 발급 1일 이내
 *
 * 첫 도메인 패턴 — 다른 도메인 (agent-economy, monitoring)이 이 구조 복제.
 */

// ─── 핵심 Aggregate ──────────────────────────────────────────────

/** 구독 (Subscription) — Polar에서 관리되는 결제 사이클 */
export interface Subscription {
  id: string; // Polar subscription ID (subscription.id)
  user_id: string; // 내부 user ID (D1 users.id)
  customer_id: string; // Polar customer ID
  plan: Plan;
  status: SubscriptionStatus;

  // 결제 사이클
  current_period_start?: number; // Unix epoch
  current_period_end?: number;
  cancel_at_period_end?: boolean;

  // 비즈니스 컨텍스트
  source: SubscriptionSource;
  created_at: number;
  updated_at: number;
}

/** 결제 플랜 (Plan) — 사용자 권한 등급 */
export type Plan = "free" | "pro";

/** 구독 상태 (SubscriptionStatus) — Polar 표준 */
export type SubscriptionStatus =
  | "active" // 결제 진행 중
  | "trialing" // 무료 체험 (PHFREE6MO 6개월 포함)
  | "past_due" // 결제 실패 (재시도 중)
  | "canceled" // 사용자 취소 요청 (current_period_end까지 유지)
  | "expired" // 기간 종료
  | "uncanceled"; // 취소 철회 (Monetization: churn 회복)

/** 구독 출처 (SubscriptionSource) — Monetization 분석용 */
export type SubscriptionSource =
  | "phfree6mo" // PH 50 한정 promo
  | "standard" // 정가 결제
  | "comp" // OSS 메인테이너 free Pro
  | "team"; // Team tier (5/13+ 출시 예정)

// ─── 고객 (Customer) ─────────────────────────────────────────────

/** 고객 (Customer) — User 표상 + Polar 연결 */
export interface Customer {
  user_id: string;
  email: string;
  polar_customer_id?: string;

  // 한국 B2B 결제 (D-008 일반과세자 + 세금계산서)
  사업자등록번호?: string; // 한국 사업자번호 (10자리)
  company_name?: string;
  vat_number?: string; // EU VAT (Polar MoR이 자동 처리)
  billing_country?: string;
}

// ─── 한도 (Quota) ────────────────────────────────────────────────

/** 알림 채널 (AlertChannel) — Pro에서 unlock */
export type AlertChannel = "email" | "discord" | "telegram" | "slack";

/** 플랜별 한도 (PlanQuota) — 비즈니스 규칙 */
export interface PlanQuota {
  max_services: number;
  polling_interval_hours: number;
  alert_channels: AlertChannel[];
  history_days: number;
}

export const FREE_QUOTA: PlanQuota = {
  max_services: 3,
  polling_interval_hours: 12,
  alert_channels: ["email"],
  history_days: 7,
};

export const PRO_QUOTA: PlanQuota = {
  max_services: Number.POSITIVE_INFINITY,
  polling_interval_hours: 1,
  alert_channels: ["email", "discord", "telegram", "slack"],
  history_days: 30,
};

export const TEAM_QUOTA: PlanQuota = {
  // 5/13+ 출시 예정 ($25/mo · 5+ devs · webhook API · 15-min polling)
  max_services: Number.POSITIVE_INFINITY,
  polling_interval_hours: 0.25, // 15 min
  alert_channels: ["email", "discord", "telegram", "slack"],
  history_days: 90,
};

// ─── 한도 초과 (QuotaExhaustion) ─────────────────────────────────

/** 한도 초과 (QuotaExhaustion) — 비즈니스 이벤트 */
export interface QuotaExhaustion {
  user_id: string;
  resource: "services" | "channels" | "polling";
  current: number;
  limit: number;
  detected_at: number;
}

// ─── Churn 신호 (Monetization) ───────────────────────────────────

/** Churn 신호 (ChurnSignal) — 이탈 위험 데이터 */
export interface ChurnSignal {
  user_id: string;
  signal: ChurnSignalType;
  detected_at: number;
  metadata?: Record<string, unknown>;
}

export type ChurnSignalType =
  | "cancel_clicked" // 사용자 취소 버튼 클릭
  | "low_usage_30d" // 30일간 사용량 < 임계값
  | "no_alerts_7d" // 7일간 alert 0건 (사용자가 가치 못 받음)
  | "support_complaint" // 메일/Telegram 불만 접수
  | "downgrade_pro_to_free" // Pro → Free 다운그레이드
  | "card_failed_3x"; // 결제 카드 3회 연속 실패

// ─── Retention 제안 (Monetization) ───────────────────────────────

/** Retention 제안 (RetentionOffer) — Cancel 직전 노출 */
export interface RetentionOffer {
  type: RetentionOfferType;
  discount_pct?: number;
  expires_at: number;
}

export type RetentionOfferType =
  | "discount_30pct_3mo" // 3개월 30% 할인
  | "downgrade_pause" // 일시 정지 (1개월)
  | "annual_switch_2mo_free" // 연 결제 전환 시 2개월 무료
  | "team_upgrade_consideration"; // Team tier 5+ devs

// ─── Polar Webhook Events ────────────────────────────────────────

/** Polar webhook 활성화 이벤트 (사용자 → Pro) */
export const ACTIVATION_EVENTS: ReadonlySet<string> = new Set([
  "subscription.created",
  "subscription.active",
  "subscription.uncanceled",
  "subscription.updated",
]);

/** Polar webhook 비활성화 이벤트 (사용자 → Free) */
export const DEACTIVATION_EVENTS: ReadonlySet<string> = new Set([
  "subscription.canceled",
  "subscription.revoked",
  "subscription.expired",
]);
