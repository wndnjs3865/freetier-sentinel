# Ubiquitous Language Glossary

> 비즈니스 용어 ↔ 코드 이름 1:1 매핑.
> 영상 원칙 (`youtu.be/7GjRM2uv-6E`):
> "비즈니스 사람들이 쓰는 말과 코드 이름을 완전히 일치시키는 거예요."
>
> 영문 코드 식별자는 영어, 한국 비즈니스 용어는 한글 그대로 (한글 식별자 사용 가능 — `entity.ts`의 `사업자등록번호` 참고).

## 작성 원칙

1. **비즈니스 용어가 root** — 코드가 이름을 따라감 (반대 X)
2. **영어/한국어 동시 표기** — 한국 비즈니스 용어는 한국어 root, 코드는 영문 식별자 (예: 구독 → Subscription)
3. **Aggregate / Value Object / Entity / Service** 분류 (DDD 표준)
4. **출처 명시** — DECISIONS / 메모리 / 비즈니스 정책 어디서 왔는지

---

## 🟢 Billing 도메인 (`src/domains/billing/`)

### Aggregate / Entity

| 비즈니스 용어 | 코드 이름 | 설명 | 출처 |
|---|---|---|---|
| **구독** | `Subscription` | Polar에서 관리되는 결제 사이클 (id, customer, plan, status, period) | D-009 |
| **고객** | `Customer` | User + Polar customer ID + 한국 사업자 정보 | D-008, D-009 |
| **플랜** | `Plan` (`free` \| `pro`) | 사용자 권한 등급 — i18n.ts FAQ에 명시 | D-003 |

### Value Objects

| 비즈니스 용어 | 코드 이름 | 설명 |
|---|---|---|
| **구독 상태** | `SubscriptionStatus` (`active`/`trialing`/`past_due`/`canceled`/`expired`/`uncanceled`) | Polar 표준 |
| **구독 출처** | `SubscriptionSource` (`phfree6mo`/`standard`/`comp`/`team`) | Monetization 분석용 |
| **플랜 한도** | `PlanQuota` | services / channels / polling / history |
| **알림 채널** | `AlertChannel` (`email`/`discord`/`telegram`/`slack`) | Pro에서 unlock |

### Domain Events / Signals

| 비즈니스 용어 | 코드 이름 | 설명 |
|---|---|---|
| **이탈 신호** | `ChurnSignal` | 사용자 이탈 위험 데이터 (cancel_clicked, low_usage_30d, etc) |
| **유지 제안** | `RetentionOffer` | Cancel 직전 표시할 retention (할인/pause/annual) |
| **한도 초과** | `QuotaExhaustion` | Free 한도 도달 이벤트 |

### 한국 컴플라이언스 (D-008)

| 비즈니스 용어 | 코드 이름 | 설명 |
|---|---|---|
| **사업자등록번호** | `사업자등록번호` (한글 그대로) | 607-20-94796 |
| **세금계산서** | (코드 X — Hometax 직접 발급) | 1일 이내 발급 (i18n FAQ ko/en/ja/es/de) |
| **일반과세자** | (정책 — 코드 영향 X) | 영세율 + 매입공제 |

### Service 함수 (비즈니스 규칙)

| 비즈니스 동작 | 함수명 | 위치 |
|---|---|---|
| 구독 이벤트 처리 | `processSubscriptionEvent()` | `service.ts` |
| 서비스 추가 가능 여부 | `canAddService()` | `service.ts` |
| 알림 채널 추가 가능 여부 | `canAddChannel()` | `service.ts` |
| 유지 제안 추천 | `suggestRetentionOffer()` | `service.ts` |
| 업그레이드 prompt 표시 | `shouldShowUpgradePrompt()` | `service.ts` |
| Team tier 추천 | `shouldSuggestTeamTier()` | `service.ts` |

### Repository 함수 (데이터 접근)

| 동작 | 함수명 |
|---|---|
| 사용자 plan 변경 | `setUserPlan()` |
| 사용자 plan 조회 | `getUserPlan()` |
| Polar payload → user_id 해석 | `findUserForSubscription()` |
| Billing 이벤트 audit log | `logBillingEvent()` |
| Churn 신호 기록 | `recordChurnSignal()` |
| Polar customer + subscription 조회 | `fetchCustomerWithSubscriptions()` |
| Polar portal session 생성 | `createPortalSession()` |

---

## 🟡 향후 도메인 (5/13+ 작업 예정)

### Agent Economy 도메인 (`src/domains/agent-economy/`)

| 비즈니스 용어 | 코드 이름 | 출처 |
|---|---|---|
| **유료 API endpoint** | `PaidEndpoint` | D-007 |
| **x402 Facilitator** | `Facilitator` (CDP) | D-010 |
| **Bazaar 등록** | `BazaarListing` | D-007 |
| **USDC 정산** | `USDCSettlement` | D-007 |
| **호출당 가격** | `priceUSD` (단위: USD) | $0.005/call |

### Monitoring 도메인 (`src/domains/monitoring/`)

| 비즈니스 용어 | 코드 이름 | 설명 |
|---|---|---|
| **서비스** | `Service` | 사용자가 등록한 cloud SaaS (Cloudflare/Vercel/etc) |
| **사용량** | `Usage` | 측정값 (request count, GB 등) |
| **임계값** | `Threshold` | 알림 발송 시점 (default 80%) |
| **한도 초과** | `QuotaExhaustion` | Service quota 100% 도달 |
| **사용량 어댑터** | `UsageAdapter` | 각 SaaS별 API 클라이언트 |

### Identity 도메인 (`src/domains/identity/`)

| 비즈니스 용어 | 코드 이름 | 출처 |
|---|---|---|
| **매직링크** | `MagicLink` | D-012 |
| **세션** | `Session` | AES-256-GCM in D1 |
| **관리자 게이트** | `AdminGate` | ADMIN_EMAIL match |

### Inbox 도메인 (`src/domains/inbox/`)

| 비즈니스 용어 | 코드 이름 |
|---|---|
| **트리아지 (Triage)** | `Triage` |
| **중요 메일 신호** | `CriticalSignal` |
| **자동 분류 규칙** | `TriageRule` |

### Admin 도메인 (`src/domains/admin/`)

| 비즈니스 용어 | 코드 이름 |
|---|---|
| **Mission Control** | `MissionControl` |
| **챕터** | `Chapter` (Architecture/Smoke/Memory/Logs) |
| **NORTH STAR** | `NorthStar` (Objective/Audience/Success Signal) |
| **Phase Framework** | `PhaseFramework` (THE FOUNDATION/THE GATE/etc) |

### Marketing 도메인 (`src/domains/marketing/`)

| 비즈니스 용어 | 코드 이름 |
|---|---|
| **PH 런치** | `ProductHuntLaunch` |
| **PHFREE6MO** | `LaunchPromoCode` |
| **F5Bot 멘션** | `BrandMention` |

---

## 🔧 Cross-cutting (도메인 X)

### Infrastructure

| 비즈니스 용어 | 코드 이름 | 위치 |
|---|---|---|
| **Telegram 알림** | `sendTelegram()` | `lib/notify.ts` |
| **CDP JWT 인증** | `signCdpJwt()` | `lib/cdp-auth.ts` |
| **Web Analytics** | (CF Beacon) | `lib/analytics.ts` |

### Shared

| 비즈니스 용어 | 코드 이름 |
|---|---|
| **i18n locale** | `Locale` (`en`/`ko`/`ja`/`es`/`de`) |
| **HTML escape** | `escapeHtml()` |

---

## 📜 Glossary 갱신 규칙

- 새 도메인 추가 시 이 파일에 entity / value objects / services / events 추가
- 코드 식별자가 비즈니스 용어와 어긋나면 **코드를 비즈니스에 맞춰 변경** (반대 X)
- 한국 비즈니스 용어 (사업자등록번호 등)는 한글 식별자 그대로 사용 가능
- DECISIONS.md D-XXX 출처 명시

## 출처

- 영상 `youtu.be/7GjRM2uv-6E` (Ubiquitous Language 원칙)
- DDD: Eric Evans, "Domain-Driven Design" (2003)
- DECISIONS.md D-001 ~ D-015
