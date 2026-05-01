# FreeTier Sentinel — STATUS

## 다음 자동 액션
- (Workers 배포 후) Cron Trigger 6시간마다 → 등록 사용자 free-tier 사용량 체크 → 임박 시 알림

## 다음 내가 할 액션
1. Cloudflare 계정 생성 (없으면) → Workers + D1 + KV 활성
2. Cloudflare API Token 발급 (Workers Edit 권한) → GitHub Secret `CLOUDFLARE_API_TOKEN`
3. `wrangler login` 후 `npx wrangler d1 create freetier-sentinel-db` → wrangler.toml에 ID 반영
4. `git push` → Actions가 자동 배포
5. Stripe 계정 만들기 + Payment Link 1개 (월 $5 Pro) — 결제 URL을 `src/config.ts`의 `STRIPE_LINK`에 채움

## 컨셉
**FreeTier Sentinel** — 인디 개발자가 사용하는 여러 무료 티어 SaaS의 사용량을 한곳에서 모니터링·임박 알림.
- 모니터링 대상 (1차): Cloudflare (Workers req/일), GitHub Actions (분/월), Vercel (대역폭/월), Supabase (DB 용량), Resend (이메일/일)
- 알림 채널: 이메일(Resend 무료 티어), Discord webhook, Telegram bot
- 무료: 3 services, 12-hour check 주기
- Pro ($5/월): 무제한 services, 1-hour 주기, multi-channel 알림

## 아키텍처 (1차 MVP, 2주 안에 작동)
```
Cloudflare Workers ─┬─ /              ← 마케팅 랜딩 (정적 HTML 임베드)
                    ├─ /signup        ← 이메일 입력 → magic link
                    ├─ /dash          ← 대시보드 (등록 키 + 알림 설정)
                    ├─ /api/check     ← cron trigger 호출
                    └─ /webhooks/stripe ← 결제 완료 → D1 plan 업데이트

D1 (SQLite) tables:
  users    (id, email, plan, created_at, stripe_customer_id)
  services (id, user_id, kind, credentials_encrypted, last_check)
  alerts   (id, user_id, channel, target, threshold_pct)
  events   (id, service_id, usage_pct, status, sent_at)

KV: rate-limit + magic-link tokens (TTL 15min)

Cron Trigger: */360 * * * * (6h) → fetch usage for each service → if >80% → enqueue alert
```

## 가격 모델
- Free: 3 services, 12h 체크, 이메일 알림만
- Pro $5/mo: 무제한 services, 1h 체크, 모든 채널, 7일 히스토리

## 도그푸딩
이 사업의 SEO 사이트와 Tool 자체가 첫 사용자. Cloudflare/GitHub Actions 무료 티어 사용량을 본 도구로 모니터링.

## 현재 상태
- [x] SPEC.md 3 후보 + 선정 1
- [x] wrangler.toml 골격
- [x] src/index.ts 라우터 골격
- [x] src/db/schema.sql
- [x] GitHub Actions deploy.yml
- [ ] Cloudflare 계정 + Token
- [ ] D1 DB 생성
- [ ] Stripe Payment Link
- [ ] 실제 polling 로직 (Cloudflare API → D1 update)
- [ ] 알림 발송 (Resend, Discord, Telegram)
- [ ] 마케팅 랜딩 페이지 카피
