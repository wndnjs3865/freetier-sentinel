# Billing 도메인

> **첫 도메인 — 다른 도메인의 패턴 source.** 영상 원칙 (`youtu.be/7GjRM2uv-6E`) 적용:
> "첫 도메인 하나는 직접 짜고 AI한테 이 패턴으로 다른 도메인도 만들어줘 하면 훨씬 정확하게 동작해요."

## 책임 (Bounded Context)

- 사용자 **구독 (Subscription)** lifecycle 관리
- **Polar.sh** webhook 처리 (D-009)
- **Plan 한도 enforcement** (Free 3 services / Pro 무제한)
- **Churn 신호** 감지 + **Retention 제안** (Monetization)
- **Upsell 결정 로직** (Free → Pro / Pro → Team)

## 4 파일 패턴 (영상 + DDD 표준)

| 파일 | 책임 | 영상 인용 |
|---|---|---|
| `entity.ts` | 도메인 객체 정의 (타입 + Ubiquitous Language 라벨 + 비즈니스 상수) | "이 개념이 어떻게 생겼냐를 정의하는 파일" |
| `repository.ts` | D1 query + Polar API 호출 (외부 데이터 접근) | "데이터베이스에서 꺼내오고 저장하는 발" |
| `service.ts` | 비즈니스 규칙 (lifecycle / 한도 / churn / retention / upsell) | "실제 비즈니스 규칙을 처리하는 발" |
| `webhooks.ts` | Polar webhook HTTP handler (thin — service.ts에 위임) | — (HTTP layer) |
| `routes.ts` | Billing portal HTTP handler | — |

## 의존성 흐름

```
Polar webhook → webhooks.ts (signature verify)
                   ↓
                service.ts (processSubscriptionEvent)
                   ↓
                repository.ts (D1 update + log)
                   ↓
                lib/notify.ts (Telegram alert)
```

```
사용자 /api/billing/portal → routes.ts (handleBillingPortal)
                                ↓
                            repository.ts (Polar API call)
```

## Ubiquitous Language (이 도메인 용어)

`/root/biz/tool/src/domains/_GLOSSARY.md` 참조 — 비즈니스 용어 ↔ 코드 이름 1:1 매핑.

핵심 용어 (entity.ts에 모두 정의):
- **Subscription** — Polar에서 관리되는 결제 사이클
- **Plan** — `free` | `pro` (사용자 권한 등급)
- **PlanQuota** — Free vs Pro 한도 (services / channels / polling / history)
- **ChurnSignal** — 이탈 위험 데이터 (cancel_clicked / low_usage_30d / etc)
- **RetentionOffer** — Cancel 직전 표시할 제안 (할인/pause/annual)
- **사업자등록번호** — 한국 사업자번호 (607-20-94796 — D-008)

## Monetization 후크 (Churn → Retention)

`service.ts`의 `suggestRetentionOffer()`가 핵심:
- 6개월 미만 → 30% 할인 3개월
- 6-12개월 → annual 전환 시 2개월 무료
- 12개월+ → pause 1개월 옵션

5/13+ 데이터 기반 personalization 예정 (현재 hardcoded).

## 다음 도메인 패턴 복제 가이드

이 4 파일 구조를 다음 도메인에 그대로 복제:

1. **agent-economy** (x402 paid API) — 5/13+ 우선 1순위
2. **monitoring** (services 사용량 점검) — 핵심 비즈니스
3. **identity** (auth + account)
4. **inbox** (Gmail triage)
5. **admin** (Mission Control + chapters)
6. **marketing** (PH launch + ICT cross-link)

각 도메인은 entity.ts + repository.ts + service.ts + routes.ts 동일 패턴.

## 관련 결정 (DECISIONS.md)

- **D-006 SUPERSEDED-BY D-009** — Stripe → LS → Polar
- **D-008** — 일반과세자 사업자등록 + 한국 세금계산서
- **D-009** — Polar.sh MoR 채택 (5/8 webhook LIVE)
- **D-015** — Mr. Notion + grok-imagine admin 디자인 (참고)

## 향후 작업 (5/13+)

- [ ] `routes/account.ts`의 `handleAccountPage` + `handleBillingPortal`을 `domains/billing/routes.ts`로 이전
- [ ] `routes/api.ts`의 plan 한도 검사 (line 58, 93)를 `service.ts`의 `canAddService` / `canAddChannel`로 교체
- [ ] Cancel UI 추가 — `/account#cancel` 클릭 시 `suggestRetentionOffer()` 응답 표시
- [ ] `/dash`에 `shouldShowUpgradePrompt()` 결과 반영 (현재 hardcoded link)
- [ ] Team tier ($25/mo) — TEAM_QUOTA 활성화
