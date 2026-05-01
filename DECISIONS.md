# FreeTier Sentinel — DECISIONS

## TD-001 — 결제는 Stripe Payment Link 단일 구독 ($5/월)
- **결정**: 1개 Pro 플랜만. annual 플랜·티어 구분 없음. (D-006과 일치)
- **사유**: SKU 단순화. 가격 변경/무료 체험 등 실험은 Payment Link 새로 만들어 A/B.
- **재검토**: 유료 100명 도달 시 annual 20% 할인 도입 검토.

## TD-002 — 사용자 API key는 D1에 AES-GCM 암호화
- **결정**: Workers crypto.subtle로 AES-256-GCM. 마스터 키는 Workers Secret.
- **사유**: D1 dump 노출 시 평문 키 누출 방지. 무료 티어 리소스만 사용.

## TD-003 — 1차 어댑터는 Cloudflare + GitHub Actions만
- **결정**: MVP는 2개 SaaS만. W6에 Vercel/Supabase/Render 추가.
- **사유**: 어댑터 인터페이스 검증 → 안정 확인 후 확장. 너무 많은 어댑터 동시 출시 시 디버깅 비용 폭발.

## TD-004 — 알림 1차 채널은 이메일만 (Resend 무료)
- **결정**: Discord/Telegram은 Pro 플랜 + W3 이후 추가.
- **사유**: Resend 무료 100건/일 → 무료 사용자 다수 수용 가능. Discord/Telegram webhook은 코드량 적지만 UX 다듬을 시간 필요.

## TD-005 — 인증은 magic link (비밀번호 없음)
- **결정**: 이메일 입력 → 15분 유효 토큰 → 클릭 → 세션 쿠키.
- **사유**: 비밀번호 저장 회피. KV TTL로 자연 정리. 모바일 친화.

## TD-006 — 매직 링크 GET은 확인 페이지만, POST에서 토큰 소비 (이메일 스캐너 우회)
- **결정**: `/auth/{token}` GET → "Continue to dashboard" 버튼이 있는 HTML 페이지. 사용자가 버튼 누름 → 같은 URL로 POST → 토큰 소비 + 세션 발급 + `/dash` 리다이렉트.
- **사유**: Gmail·Outlook 등 이메일 보안 스캐너가 메일 안의 URL을 미리 GET으로 방문해 phishing 검사. 우리 토큰이 GET 한 번에 소비되는 구조였으면 사용자가 클릭할 때 항상 "Link expired" 발생. 표준 magic-link 구현 패턴: GET=preview, POST=consume.
- **재검토**: 향후 IdP(Google/GitHub OAuth) 연동 시 magic link 자체 deprecate 가능.
