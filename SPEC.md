# FreeTier Sentinel — SPEC

## 후보 3종 (D-003 검토 기록)

### 후보 A — FreeTier Sentinel ⭐ 채택
**컨셉**: 인디 개발자가 쓰는 여러 무료 티어 SaaS(Cloudflare, GitHub Actions, Vercel, Render, Supabase, Neon, Resend 등)의 사용량을 한곳에서 모니터링·임박 알림.

| 항목 | 평가 |
|---|---|
| 명확한 통증 | ★★★★★ (free tier 갑자기 초과 → 결제 잠김 / 서비스 중단 사고가 흔함) |
| TAM | ★★★★☆ (free tier SaaS 5+ 사용 인디 개발자 = 글로벌 수십만) |
| 0원 충족 | ★★★★★ (Workers/D1/KV/Cron Triggers 무료 티어. LLM API 의존 없음) |
| 자동화 천장 | ★★★★☆ (지원 SaaS 추가 = 단순 어댑터 추가) |
| 출시 속도 | ★★★★☆ (2~3주 MVP 가능) |
| 차별화 | 단일 SaaS만 보는 native dashboard와 달리 multi-cloud aggregate. PMF 검증된 "Cloudwatch Free Tier Alerts"는 AWS-only. |

### 후보 B — PromptTrail (기각)
**컨셉**: LLM 프롬프트 버전관리 + A/B 테스트 + 공유 마켓.
- ❌ 기각 사유: 핵심 가치(A/B 테스트)에 LLM 호출 필요 → 무료 LLM API 한도 빠르게 소진. 0원 원칙 위반 가능성. PromptHub, LangSmith 등 경쟁 다수.

### 후보 C — CommitDigest (기각)
**컨셉**: GitHub repo PR/commit을 주간 AI 요약 → 팀 리드에 이메일.
- ❌ 기각 사유: 핵심에 LLM 의존. GitHub App 승인 마찰. 무료 SaaS Linear Asks/Polly와 기능 겹침.

---

## FreeTier Sentinel — 상세 스펙

### 페르소나
- **Primary**: 인디 개발자 / 1인 스타트업 / 학생 — 5~15개 무료 SaaS를 곡예하듯 운영
- **Secondary**: 에이전시 / 부트캠프 — 학생용 free tier 모니터링

### Job-To-Be-Done
> "Cloudflare daily limit 초과로 사이트 다운된 적 있어. 사전에 알려주면 좋겠다."
> "Vercel 100GB 대역폭 한 달치를 3주 만에 다 써서 결제 잠겼어."
> "Supabase 500MB 한도 넘기 전에 청소해야 하는데 매번 까먹어."

### 1차 지원 SaaS (8개)
1. Cloudflare Workers (req/일, CPU ms)
2. GitHub Actions (minutes/월)
3. Vercel (bandwidth/월)
4. Render (build hours)
5. Supabase (DB MB)
6. Neon (compute hours)
7. Resend (이메일/일)
8. Cloudflare R2 (storage GB)

### 데이터 모델 (D1)
```sql
CREATE TABLE users (
  id TEXT PRIMARY KEY,            -- uuid
  email TEXT UNIQUE NOT NULL,
  plan TEXT NOT NULL DEFAULT 'free',  -- free | pro
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  created_at INTEGER NOT NULL
);

CREATE TABLE services (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  kind TEXT NOT NULL,             -- cloudflare | github | vercel | ...
  label TEXT NOT NULL,
  credentials_enc TEXT NOT NULL,  -- AES-GCM encrypted via Workers crypto
  threshold_pct INTEGER NOT NULL DEFAULT 80,
  last_check INTEGER,
  last_usage_pct INTEGER,
  created_at INTEGER NOT NULL
);

CREATE TABLE alert_channels (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  kind TEXT NOT NULL,             -- email | discord | telegram
  target TEXT NOT NULL,           -- url or address
  enabled INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  service_id TEXT NOT NULL,
  usage_pct INTEGER NOT NULL,
  status TEXT NOT NULL,           -- ok | warning | critical | error
  notified INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL
);
```

### 라우트
| Path | Method | 동작 |
|---|---|---|
| `/` | GET | 마케팅 랜딩 (HTML embed) |
| `/signup` | POST | 이메일 → magic-link 발송 |
| `/auth/:token` | GET | magic link 인증 → 세션 쿠키 |
| `/dash` | GET | 대시보드 |
| `/api/services` | POST | 서비스 추가 |
| `/api/services/:id` | DELETE | 삭제 |
| `/api/alerts` | POST | 알림 채널 추가 |
| `/webhooks/stripe` | POST | 결제 완료/취소 → plan 업데이트 |
| `/cron/check` | scheduled | Cron Trigger가 호출 → 모든 active service 체크 |

### Cron Trigger 로직
```
6시간(free) 또는 1시간(pro)마다:
  for each user.services where last_check < (now - interval):
    usage = adapter[kind].fetchUsage(decrypt(credentials))
    if usage_pct >= threshold:
      enqueue_alert(user, service, usage)
    update services.last_check, last_usage_pct
    insert events row
```

### 보안
- 사용자 API key는 D1에 AES-GCM(Workers crypto) 암호화 저장. 마스터 키는 Workers Secrets.
- 모든 키는 read-only/usage-scope만 받음 (프로비저닝 권한 거부).
- CSRF 토큰 + secure cookie(SameSite=Strict).

### 결제 (Stripe Payment Link)
- 1개 Payment Link($5/월 Pro) — 가입 시 customer email 자동 매칭.
- Stripe Webhook (`/webhooks/stripe`)에서 `checkout.session.completed` → user.plan = 'pro'.
- `customer.subscription.deleted` → plan = 'free'.

### MVP 일정 (현실적)
- W1: Workers 라우터 + signup/auth/dash
- W2: Cloudflare/GitHub adapter 2개 + cron 체크
- W3: 알림 (이메일 via Resend) + 랜딩 페이지
- W4: HN/Reddit/IH 베타 런칭 (free 한정)
- W5: Stripe 결제 + Pro 플랜
- W6: Vercel/Supabase/Render adapter 추가
- W7~8: 사용자 피드백 반영 + 마케팅 콘텐츠 (SEO 사이트와 연결)

### 마케팅 채널 (0원)
1. ProductHunt 런칭 (1회)
2. Reddit r/indiehackers, r/SaaS, r/webdev
3. HackerNews "Show HN"
4. SEO 사이트(`indie-creator-toolkit`)에서 "Tools we use" 섹션 cross-link
5. Twitter/X build-in-public 스레드 (주 2회)
6. Indie Hackers post (월 1회)

### 성공 지표
- W4: 무료 가입 50+
- W6: 무료 가입 200+, 유료 전환 1+
- M3: 무료 가입 500+, 유료 10~30 → 월 $50~150 ARR
- M6: 유료 50~120 → 월 $250~600 ARR ✓ 손익분기 (₩750k 목표 진입)
- M12: 유료 100~300 → 월 $500~1500 ARR ✓ 안정 도달
