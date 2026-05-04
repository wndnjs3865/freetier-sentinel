export type Locale = "en" | "ko" | "ja" | "es" | "de";

export const SUPPORTED_LOCALES: Locale[] = ["en", "ko", "ja", "es", "de"];

export const LOCALE_META: Record<Locale, { name: string; nativeName: string; htmlLang: string }> = {
  en: { name: "English", nativeName: "English", htmlLang: "en" },
  ko: { name: "Korean", nativeName: "한국어", htmlLang: "ko" },
  ja: { name: "Japanese", nativeName: "日本語", htmlLang: "ja" },
  es: { name: "Spanish", nativeName: "Español", htmlLang: "es" },
  de: { name: "German", nativeName: "Deutsch", htmlLang: "de" },
};

export function getLocaleFromPath(path: string): Locale {
  const seg = path.split("/")[1];
  if (seg === "ko" || seg === "ja" || seg === "es" || seg === "de") return seg;
  return "en";
}

export function localePath(locale: Locale): string {
  return locale === "en" ? "/" : `/${locale}`;
}

export interface FAQItem { q: string; a: string }
export interface Feature { title: string; desc: string }
export interface Step { title: string; desc: string }

export interface Translations {
  // meta
  title: string;
  description: string;
  // nav
  nav_features: string;
  nav_how: string;
  nav_pricing: string;
  nav_faq: string;
  nav_signin: string;
  switcher_label: string;
  // hero
  hero_eyebrow: string;
  hero_h1_line1: string;
  hero_h1_line2: string;
  hero_sub_line1: string;
  hero_sub_line2: string;
  hero_email_placeholder: string;
  hero_cta: string;
  hero_micro_1: string;
  hero_micro_2: string;
  hero_micro_3: string;
  // strip
  strip_label: string;
  // features
  features_eyebrow: string;
  features_h2_line1: string;
  features_h2_line2: string;
  features_sub: string;
  features: Feature[]; // 6 items
  // how
  how_eyebrow: string;
  how_h2: string;
  how_sub: string;
  steps: Step[]; // 3 items
  // pricing
  pricing_eyebrow: string;
  pricing_h2: string;
  pricing_sub: string;
  tier_per: string;
  tier_free_label: string;
  tier_free_sub: string;
  tier_free_features: string[]; // 5 items
  tier_free_cta: string;
  tier_pro_label: string;
  tier_pro_badge: string;
  tier_pro_sub: string;
  tier_pro_features: string[]; // 6 items
  tier_pro_cta: string;
  // code section
  code_eyebrow: string;
  code_h2: string;
  code_p1: string;
  code_p2: string;
  // FAQ
  faq_eyebrow: string;
  faq_h2: string;
  faq_sub: string;
  faqs: FAQItem[]; // 7 items
  // CTA bottom
  cta_h2: string;
  cta_p: string;
  cta_button: string;
  // footer
  footer_tagline: string;
  footer_product: string;
  footer_oss: string;
  footer_built: string;
  footer_signin: string;
}

const en: Translations = {
  title: "FreeTier Sentinel — Datadog for free tiers",
  description: "Like Datadog, but for free-tier limits. We email you at 80% — before the cliff. One dashboard for Cloudflare, GitHub Actions, Vercel, Supabase, Resend, and 4 more.",
  nav_features: "Features",
  nav_how: "How it works",
  nav_pricing: "Pricing",
  nav_faq: "FAQ",
  nav_signin: "Sign in →",
  switcher_label: "Language",
  hero_eyebrow: "Watching 8 services. More coming weekly.",
  hero_h1_line1: "Watch every free tier.",
  hero_h1_line2: "Sleep at night.",
  hero_sub_line1: "Like Datadog, but for free-tier limits.",
  hero_sub_line2: "We email at 80% — before the cliff.",
  hero_email_placeholder: "you@example.com",
  hero_cta: "Get started →",
  hero_micro_1: "Free for 3 services",
  hero_micro_2: "No credit card",
  hero_micro_3: "60-second setup",
  strip_label: "Currently monitoring",
  features_eyebrow: "Why Sentinel",
  features_h2_line1: "Built for indie devs",
  features_h2_line2: "who run real things on free tiers.",
  features_sub: "Every cloud has a usage page. None of them email you before the cliff. We do.",
  features: [
    { title: "Pre-cliff alerts", desc: "Default 80% threshold. Email immediately. Discord + Telegram on Pro. No more 11pm site-down emergencies." },
    { title: "Read-only by design", desc: "We require usage-scope tokens only. AES-256-GCM encryption at rest. Master key in Workers Secrets, never in DB." },
    { title: "Hourly polling", desc: "Free: every 12h. Pro: every 1h. Polling is the fastest you can know without webhooks (which most clouds don't expose)." },
    { title: "Multi-cloud aggregate", desc: "One dashboard for 8 services and growing. Each adapter ships in about a day. Want one we don't have? Open an issue." },
    { title: "Usage history", desc: "7-day rolling history on free, 30-day on Pro. Spot the slow leaks before they become billing surprises." },
    { title: "Open source core", desc: "The Worker source is on GitHub. Self-host it for free, or pay $5/mo for the hosted version with hourly polling." },
  ],
  how_eyebrow: "How it works",
  how_h2: "Three steps. Zero late-night surprises.",
  how_sub: "From sign-up to first alert in under 60 seconds.",
  steps: [
    { title: "Connect a service", desc: "Paste a read-only API token from Cloudflare, GitHub Actions, Vercel, or any of the 8 supported SaaS. Tokens encrypted at rest." },
    { title: "Set your threshold", desc: "Default is 80% of free-tier limit. Pick alert channels: email (free), Discord & Telegram (Pro). Multiple per account." },
    { title: "Sleep at night", desc: "We poll every hour (Pro) and notify you the moment usage trips your threshold. Before the cliff, not after." },
  ],
  pricing_eyebrow: "Pricing",
  pricing_h2: "Free tier you'll actually use.",
  pricing_sub: "Pro is a fair $5/month for 1-hour polling and multi-channel alerts.",
  tier_per: "/ month",
  tier_free_label: "Free",
  tier_free_sub: "For solo devs validating side projects.",
  tier_free_features: [
    "Up to 3 connected services",
    "Polling every 12 hours",
    "Email alerts",
    "7-day usage history",
    "Magic-link auth, no passwords",
  ],
  tier_free_cta: "Start free",
  tier_pro_label: "Pro",
  tier_pro_badge: "Most popular",
  tier_pro_sub: "For people running real things on free tiers.",
  tier_pro_features: [
    "Unlimited connected services",
    "Polling every hour",
    "Email + Discord + Telegram alerts",
    "30-day usage history",
    "Priority response on bugs",
    "Self-host the open-source version",
  ],
  tier_pro_cta: "Start free, upgrade later",
  code_eyebrow: "Built on Cloudflare",
  code_h2: "Runs on the same free tier it monitors.",
  code_p1: "Workers + D1 + KV + Cron Triggers. The whole product runs on the free tier of the cloud it's named for. The dogfood is built in.",
  code_p2: "You can self-host the open-source version yourself, or pay $5/mo for the hosted version with hourly polling and multi-channel alerts.",
  faq_eyebrow: "FAQ",
  faq_h2: "Common questions.",
  faq_sub: "Reach out if yours isn't here.",
  faqs: [
    { q: "How are my API tokens stored?", a: "AES-256-GCM encrypted in Cloudflare D1. The master key lives in Workers Secrets, separately from the database. We require read-only/usage-scope tokens — never tokens with provisioning or write permissions. If you're paranoid, the source is open — read the code yourself." },
    { q: "Will FreeTier Sentinel monitor its own free tier?", a: "Yes. The Worker monitors its own usage. If it ever wakes me up because <em>it</em> hit a Cloudflare limit, that means it's working AND people are using it." },
    { q: "Why $5/month instead of free forever?", a: "Polling every hour for unlimited services + Discord/Telegram alerts costs real Worker compute and Resend email volume at scale. $5/month is the lowest sustainable price. The free tier is genuinely useful, not a trial." },
    { q: "Can I cancel anytime?", a: "One click via the Stripe customer portal. No \"contact us to cancel\" nonsense. Refunds within 7 days, no questions asked." },
    { q: "What happens at 100%? Do you stop the request for me?", a: "No. We don't have permission to control your services — that's by design. We notify you at 80% (default, configurable) so you can act: upgrade the service, optimize traffic, or accept the cliff." },
    { q: "Which SaaS are coming next?", a: "Currently shipped: Cloudflare Workers, GitHub Actions. Coming in next 2 weeks: Vercel, Supabase, Render, Resend, Neon, Cloudflare R2. Want one we don't have? <a href=\"https://github.com/wndnjs3865/freetier-sentinel/issues\">Open an issue</a>." },
    { q: "Is there an API or webhooks?", a: "Not yet — the Pro plan focus is hourly polling. If you'd find a webhook for usage events useful, tell us in an issue. We'll add it if there's demand." },
  ],
  cta_h2: "One dashboard. Zero late-night cliffs.",
  cta_p: "Solo devs lose hours to overages every month. You don't have to.",
  cta_button: "Get magic link →",
  footer_tagline: "<strong>FreeTier Sentinel</strong> — One dashboard for every free-tier SaaS limit you care about. Built solo on Cloudflare Workers, fully open source.",
  footer_product: "Product",
  footer_oss: "Open source",
  footer_built: "Built with Cloudflare Workers · D1 · KV",
  footer_signin: "Sign in",
};

const ko: Translations = {
  title: "FreeTier Sentinel — 무료 티어를 위한 Datadog",
  description: "Datadog 같은 건데, 무료 티어 한도용. 80%에서 메일로 알려줘 — 절벽 떨어지기 전에. Cloudflare, GitHub Actions, Vercel, Supabase, Resend 외 4개 한 대시보드.",
  nav_features: "기능",
  nav_how: "작동 방식",
  nav_pricing: "가격",
  nav_faq: "FAQ",
  nav_signin: "로그인 →",
  switcher_label: "언어",
  hero_eyebrow: "8개 서비스 감시 중. 매주 추가.",
  hero_h1_line1: "모든 무료 티어를 지켜본다.",
  hero_h1_line2: "이제 잠 좀 자자.",
  hero_sub_line1: "Datadog 같은 건데, 무료 티어 한도 전용.",
  hero_sub_line2: "80%에서 메일 — 절벽 떨어지기 전에.",
  hero_email_placeholder: "you@example.com",
  hero_cta: "시작하기 →",
  hero_micro_1: "3개 서비스까지 무료",
  hero_micro_2: "카드 등록 X",
  hero_micro_3: "60초 셋업",
  strip_label: "현재 모니터링 중",
  features_eyebrow: "왜 Sentinel?",
  features_h2_line1: "무료 티어에서 진짜를 돌리는",
  features_h2_line2: "인디 개발자를 위해.",
  features_sub: "어느 클라우드든 사용량 페이지는 있어. 근데 절벽 직전에 메일 보내주는 곳은 없어. 우리는 보내.",
  features: [
    { title: "절벽 직전 알림", desc: "기본 80% 임계값. 즉시 이메일. Pro에서 Discord + 텔레그램. 한밤중 사이트 다운 비상사태는 끝." },
    { title: "읽기 전용 설계", desc: "사용량 권한 토큰만 받음. AES-256-GCM 저장 암호화. 마스터 키는 Workers Secrets에, DB에는 절대 없음." },
    { title: "1시간 폴링", desc: "Free: 12시간마다. Pro: 1시간마다. 웹훅 없이 알 수 있는 가장 빠른 방법 (어차피 대부분 클라우드는 웹훅 안 내줌)." },
    { title: "멀티 클라우드 통합", desc: "1 대시보드, 8개 서비스 + 계속 추가 중. 어댑터 하나 추가는 하루면 끝. 없는 거 있으면 issue 열어줘." },
    { title: "사용량 이력", desc: "Free 7일, Pro 30일 롤링 이력. 청구서 깜짝쇼 되기 전에 누수 잡기." },
    { title: "오픈소스 코어", desc: "Worker 소스 GitHub에 공개. 직접 호스팅 무료, 아니면 1시간 폴링 호스팅 버전 월 $5." },
  ],
  how_eyebrow: "작동 방식",
  how_h2: "3단계. 한밤중 깜짝쇼 0건.",
  how_sub: "가입부터 첫 알림까지 60초 이내.",
  steps: [
    { title: "서비스 연결", desc: "Cloudflare, GitHub Actions, Vercel, 또는 지원되는 8개 SaaS 중 아무거나 읽기 전용 API 토큰 붙여넣기. 저장 시 암호화." },
    { title: "임계값 설정", desc: "기본 무료 한도의 80%. 알림 채널 선택: 이메일 (무료), Discord & 텔레그램 (Pro). 계정당 여러 개 가능." },
    { title: "잠 잘 자기", desc: "1시간마다 폴링 (Pro), 사용량이 임계값 넘는 순간 알림. 절벽 떨어지기 전에, 떨어진 후가 아니라." },
  ],
  pricing_eyebrow: "가격",
  pricing_h2: "진짜 쓸만한 무료 티어.",
  pricing_sub: "Pro는 1시간 폴링 + 멀티 채널 알림이 월 $5. 양심적.",
  tier_per: "/ 월",
  tier_free_label: "Free",
  tier_free_sub: "사이드 프로젝트 검증하는 솔로 개발자용.",
  tier_free_features: [
    "최대 3개 서비스 연결",
    "12시간마다 폴링",
    "이메일 알림",
    "7일 사용량 이력",
    "매직 링크 인증, 비밀번호 X",
  ],
  tier_free_cta: "무료로 시작",
  tier_pro_label: "Pro",
  tier_pro_badge: "가장 인기",
  tier_pro_sub: "무료 티어에서 진짜를 돌리는 사람용.",
  tier_pro_features: [
    "무제한 서비스 연결",
    "1시간마다 폴링",
    "이메일 + Discord + 텔레그램 알림",
    "30일 사용량 이력",
    "버그 우선 대응",
    "오픈소스 버전 셀프 호스팅 가능",
  ],
  tier_pro_cta: "무료로 시작, 나중에 업그레이드",
  code_eyebrow: "Cloudflare 기반",
  code_h2: "감시하는 그 무료 티어에서 직접 돌아감.",
  code_p1: "Workers + D1 + KV + Cron Triggers. 제품 전체가 자기 이름과 같은 클라우드의 무료 티어에서 돌아감. 도그푸딩이 기본 설계.",
  code_p2: "오픈소스 버전 직접 호스팅 가능, 아니면 1시간 폴링 + 멀티 채널 알림 호스팅 버전 월 $5.",
  faq_eyebrow: "FAQ",
  faq_h2: "자주 묻는 질문.",
  faq_sub: "원하는 답이 없으면 연락 줘.",
  faqs: [
    { q: "API 토큰은 어떻게 저장돼?", a: "Cloudflare D1에 AES-256-GCM 암호화. 마스터 키는 DB와 별도로 Workers Secrets에 보관. 읽기 전용/사용량 권한 토큰만 받음 — 프로비저닝/쓰기 권한 토큰은 절대 X. 의심스러우면 소스 공개돼 있으니 직접 봐." },
    { q: "FreeTier Sentinel이 자기 무료 티어도 감시해?", a: "응. Worker가 자기 사용량 감시함. 만약 <em>이게</em> Cloudflare 한도 쳐서 나를 깨우면, 작동하고 있다는 뜻이고 사람들이 쓰고 있다는 뜻이야." },
    { q: "왜 평생 무료 안 하고 월 $5야?", a: "1시간마다 무제한 서비스 폴링 + Discord/텔레그램 알림은 Worker compute랑 Resend 이메일 비용이 실제로 들어. $5는 지속 가능한 최저가. 무료 티어는 trial이 아니라 진짜 쓸 수 있게 만들었어." },
    { q: "언제든지 해지 가능해?", a: "Stripe 고객 포털에서 클릭 한 번. \"해지하려면 문의해주세요\" 같은 거 없음. 7일 내 환불, 사유 안 물어봄." },
    { q: "100% 찍으면 어떻게 돼? 너네가 요청 멈춰줘?", a: "아니. 우리는 네 서비스 통제 권한 없어 — 그게 설계 의도야. 80%에 알림 (기본값, 변경 가능) 보내니까 네가 행동해: 서비스 업그레이드, 트래픽 최적화, 또는 절벽 받아들이기." },
    { q: "다음에 추가될 SaaS는?", a: "현재: Cloudflare Workers, GitHub Actions. 향후 2주 내: Vercel, Supabase, Render, Resend, Neon, Cloudflare R2. 없는 거 있으면 <a href=\"https://github.com/wndnjs3865/freetier-sentinel/issues\">issue 열어줘</a>." },
    { q: "API나 웹훅 있어?", a: "아직 없어 — Pro는 1시간 폴링 중심. 사용량 이벤트 웹훅 필요하면 issue로 알려줘. 수요 있으면 추가." },
  ],
  cta_h2: "1 대시보드. 한밤중 절벽 0건.",
  cta_p: "솔로 개발자들이 매달 초과 사용으로 시간을 날려. 너는 안 그래도 돼.",
  cta_button: "매직 링크 받기 →",
  footer_tagline: "<strong>FreeTier Sentinel</strong> — 신경 쓰는 무료 티어 SaaS 한도 전부 한 대시보드에. 솔로로 Cloudflare Workers 위에 만듦, 완전 오픈소스.",
  footer_product: "제품",
  footer_oss: "오픈소스",
  footer_built: "Cloudflare Workers · D1 · KV로 구축",
  footer_signin: "로그인",
};

const ja: Translations = {
  title: "FreeTier Sentinel — 無料枠のためのDatadog",
  description: "Datadogのようなもの、ただし無料枠の上限専用。80%でメール通知 — 崖から落ちる前に。Cloudflare、GitHub Actions、Vercel、Supabase、Resendを含む8サービスを1つのダッシュボードで。",
  nav_features: "機能",
  nav_how: "仕組み",
  nav_pricing: "料金",
  nav_faq: "FAQ",
  nav_signin: "ログイン →",
  switcher_label: "言語",
  hero_eyebrow: "8サービス監視中。毎週追加。",
  hero_h1_line1: "すべての無料枠を監視。",
  hero_h1_line2: "夜は安心して眠ろう。",
  hero_sub_line1: "Datadogみたいなもの、ただし無料枠の上限専用。",
  hero_sub_line2: "80%でメール — 崖から落ちる前に。",
  hero_email_placeholder: "you@example.com",
  hero_cta: "始める →",
  hero_micro_1: "3サービスまで無料",
  hero_micro_2: "カード不要",
  hero_micro_3: "60秒で設定",
  strip_label: "現在監視中",
  features_eyebrow: "なぜSentinel?",
  features_h2_line1: "無料枠で本気のものを動かす",
  features_h2_line2: "インディー開発者のために。",
  features_sub: "どのクラウドにも使用量ページはあります。でも崖の手前でメールしてくれるところはありません。私たちはします。",
  features: [
    { title: "崖の手前で通知", desc: "デフォルト80%しきい値。即メール。ProでDiscord + Telegram。深夜のサイトダウン緊急事態は終わり。" },
    { title: "読み取り専用設計", desc: "使用量スコープのトークンのみ。AES-256-GCMで保存時暗号化。マスターキーはWorkers Secrets、DBには絶対入れません。" },
    { title: "1時間ごとのポーリング", desc: "Free: 12時間ごと。Pro: 1時間ごと。Webhookなしで知れる最速の方法です(そもそも多くのクラウドはWebhookを公開していません)。" },
    { title: "マルチクラウド統合", desc: "1つのダッシュボードで8サービス、まだ増え続けます。アダプター1つ追加に約1日。欲しいのがなければissueを立ててください。" },
    { title: "使用履歴", desc: "Freeで7日、Proで30日のローリング履歴。請求の驚きになる前にリークを見つけます。" },
    { title: "オープンソースコア", desc: "WorkerソースはGitHub公開。セルフホストは無料、もしくは月$5でホスティング版(1時間ポーリング付き)。" },
  ],
  how_eyebrow: "仕組み",
  how_h2: "3ステップ。深夜の驚きはゼロ。",
  how_sub: "登録から最初の通知まで60秒以内。",
  steps: [
    { title: "サービスを接続", desc: "Cloudflare、GitHub Actions、Vercel、対応する8 SaaSのいずれかから読み取り専用APIトークンを貼り付け。保存時に暗号化。" },
    { title: "しきい値を設定", desc: "デフォルトは無料枠の80%。通知チャンネル: メール(無料)、Discord & Telegram(Pro)。1アカウントで複数可。" },
    { title: "夜はぐっすり", desc: "1時間ごとにポーリング(Pro)、使用量がしきい値を超えた瞬間に通知。崖から落ちる前、落ちた後ではなく。" },
  ],
  pricing_eyebrow: "料金",
  pricing_h2: "本当に使える無料枠。",
  pricing_sub: "Proは1時間ポーリング + マルチチャンネル通知で月$5、フェアな価格。",
  tier_per: "/ 月",
  tier_free_label: "Free",
  tier_free_sub: "サイドプロジェクトを試すソロ開発者向け。",
  tier_free_features: [
    "最大3サービス接続",
    "12時間ごとにポーリング",
    "メール通知",
    "7日間の使用履歴",
    "マジックリンク認証、パスワード不要",
  ],
  tier_free_cta: "無料で始める",
  tier_pro_label: "Pro",
  tier_pro_badge: "人気No.1",
  tier_pro_sub: "無料枠で本気のものを動かす人向け。",
  tier_pro_features: [
    "無制限のサービス接続",
    "1時間ごとにポーリング",
    "メール + Discord + Telegram通知",
    "30日間の使用履歴",
    "バグの優先対応",
    "オープンソース版のセルフホスティング可",
  ],
  tier_pro_cta: "無料で始めて、後でアップグレード",
  code_eyebrow: "Cloudflareで構築",
  code_h2: "監視している無料枠で動いてます。",
  code_p1: "Workers + D1 + KV + Cron Triggers。プロダクト全体が、名前の由来となったクラウドの無料枠で動いています。ドッグフーディングが標準装備。",
  code_p2: "オープンソース版をセルフホストするか、1時間ポーリング + マルチチャンネル通知付きのホスティング版を月$5で利用できます。",
  faq_eyebrow: "FAQ",
  faq_h2: "よくある質問。",
  faq_sub: "答えがなければご連絡ください。",
  faqs: [
    { q: "APIトークンはどう保存されますか?", a: "Cloudflare D1にAES-256-GCMで暗号化。マスターキーはDBとは別にWorkers Secretsに保管。読み取り専用/使用量スコープのトークンのみ受け付け、プロビジョニング/書き込み権限のトークンは絶対に受け付けません。気になる方はソースが公開されているのでご自身で確認してください。" },
    { q: "FreeTier Sentinelは自分の無料枠も監視しますか?", a: "はい。Worker自身の使用量を監視しています。もし<em>これ</em>がCloudflareの上限に達して私を起こすことがあれば、それは動作している証拠であり、誰かが使っている証拠です。" },
    { q: "なぜ永久無料じゃなくて月$5?", a: "無制限のサービスを1時間ごとにポーリング + Discord/Telegram通知は、Workerのコンピュートと大量のResendメールに実費がかかります。$5は持続可能な最低価格です。無料枠はトライアルではなく、本当に使えるよう設計しています。" },
    { q: "いつでも解約できますか?", a: "Stripeカスタマーポータルでワンクリック。「解約はお問い合わせください」みたいな茶番はなし。7日以内なら理由を聞かず返金します。" },
    { q: "100%になったらどうなる? あなた達がリクエストを止めてくれる?", a: "いいえ。私たちはあなたのサービスを制御する権限を持ちません — 設計上の意図です。80%(デフォルト、変更可)で通知するので、あなたが対応してください: サービスアップグレード、トラフィック最適化、または崖を受け入れる。" },
    { q: "次に追加されるSaaSは?", a: "現在: Cloudflare Workers, GitHub Actions。今後2週間: Vercel, Supabase, Render, Resend, Neon, Cloudflare R2。欲しいものがない場合は<a href=\"https://github.com/wndnjs3865/freetier-sentinel/issues\">issueを開いてください</a>。" },
    { q: "APIやWebhookはありますか?", a: "まだありません — Proプランは1時間ポーリングが中心。使用量イベント用のWebhookが欲しければissueでお知らせください。需要があれば追加します。" },
  ],
  cta_h2: "1つのダッシュボード。深夜の崖はゼロ。",
  cta_p: "ソロ開発者は毎月、超過分で時間を失っています。あなたはそうである必要はありません。",
  cta_button: "マジックリンクを取得 →",
  footer_tagline: "<strong>FreeTier Sentinel</strong> — 気になる無料枠SaaSの上限を1つのダッシュボードに。Cloudflare Workers上でソロ開発、完全オープンソース。",
  footer_product: "プロダクト",
  footer_oss: "オープンソース",
  footer_built: "Cloudflare Workers · D1 · KVで構築",
  footer_signin: "ログイン",
};

const es: Translations = {
  title: "FreeTier Sentinel — Datadog para planes gratuitos",
  description: "Como Datadog, pero para los límites del plan gratuito. Te avisamos por email al 80% — antes del precipicio. Un dashboard para Cloudflare, GitHub Actions, Vercel, Supabase, Resend y 4 más.",
  nav_features: "Funciones",
  nav_how: "Cómo funciona",
  nav_pricing: "Precios",
  nav_faq: "FAQ",
  nav_signin: "Entrar →",
  switcher_label: "Idioma",
  hero_eyebrow: "Vigilando 8 servicios. Más cada semana.",
  hero_h1_line1: "Vigila cada plan gratuito.",
  hero_h1_line2: "Duerme tranquilo.",
  hero_sub_line1: "Como Datadog, pero para límites del plan gratuito.",
  hero_sub_line2: "Te avisamos por email al 80% — antes del precipicio.",
  hero_email_placeholder: "tu@ejemplo.com",
  hero_cta: "Empezar →",
  hero_micro_1: "Gratis hasta 3 servicios",
  hero_micro_2: "Sin tarjeta",
  hero_micro_3: "60 segundos para empezar",
  strip_label: "Monitoreando ahora",
  features_eyebrow: "Por qué Sentinel",
  features_h2_line1: "Hecho para devs indie",
  features_h2_line2: "que corren cosas reales en planes gratuitos.",
  features_sub: "Toda nube tiene una página de uso. Ninguna te avisa por email antes del precipicio. Nosotros sí.",
  features: [
    { title: "Alertas antes del precipicio", desc: "Umbral por defecto 80%. Email inmediato. Discord + Telegram en Pro. Adiós a las emergencias de sitio caído a las 11pm." },
    { title: "Solo lectura por diseño", desc: "Solo aceptamos tokens con permiso de uso. Cifrado AES-256-GCM en reposo. Clave maestra en Workers Secrets, nunca en DB." },
    { title: "Polling cada hora", desc: "Gratis: cada 12h. Pro: cada 1h. Polling es lo más rápido sin webhooks (y la mayoría de nubes no los exponen)." },
    { title: "Agregado multi-cloud", desc: "Un dashboard para 8 servicios y creciendo. Cada adaptador sale en un día más o menos. ¿Te falta uno? Abre un issue." },
    { title: "Historial de uso", desc: "Gratis: 7 días. Pro: 30 días rolling. Detecta fugas lentas antes de que sean sorpresas en la factura." },
    { title: "Código abierto", desc: "El código del Worker está en GitHub. Auto-hostea gratis, o paga $5/mes por la versión hospedada con polling cada hora." },
  ],
  how_eyebrow: "Cómo funciona",
  how_h2: "Tres pasos. Cero sorpresas a medianoche.",
  how_sub: "Del registro a la primera alerta en menos de 60 segundos.",
  steps: [
    { title: "Conecta un servicio", desc: "Pega un token API de solo lectura de Cloudflare, GitHub Actions, Vercel, o cualquiera de los 8 SaaS soportados. Tokens cifrados en reposo." },
    { title: "Configura tu umbral", desc: "Por defecto 80% del límite gratuito. Elige canales de alerta: email (gratis), Discord & Telegram (Pro). Varios por cuenta." },
    { title: "Duerme tranquilo", desc: "Hacemos polling cada hora (Pro) y te avisamos en cuanto el uso pase tu umbral. Antes del precipicio, no después." },
  ],
  pricing_eyebrow: "Precios",
  pricing_h2: "Una capa gratis que vas a usar de verdad.",
  pricing_sub: "Pro cuesta $5/mes por polling cada hora y alertas multi-canal. Justo.",
  tier_per: "/ mes",
  tier_free_label: "Free",
  tier_free_sub: "Para devs solo que validan side projects.",
  tier_free_features: [
    "Hasta 3 servicios conectados",
    "Polling cada 12 horas",
    "Alertas por email",
    "Historial de 7 días",
    "Auth con magic link, sin contraseñas",
  ],
  tier_free_cta: "Empezar gratis",
  tier_pro_label: "Pro",
  tier_pro_badge: "Más popular",
  tier_pro_sub: "Para gente que corre cosas reales en planes gratuitos.",
  tier_pro_features: [
    "Servicios ilimitados",
    "Polling cada hora",
    "Email + Discord + Telegram",
    "Historial de 30 días",
    "Respuesta prioritaria en bugs",
    "Self-host de la versión open-source",
  ],
  tier_pro_cta: "Empieza gratis, sube luego",
  code_eyebrow: "Hecho en Cloudflare",
  code_h2: "Corre en la misma capa gratis que monitorea.",
  code_p1: "Workers + D1 + KV + Cron Triggers. El producto entero corre en la capa gratis de la nube por la que lleva el nombre. Dogfood incluido.",
  code_p2: "Puedes self-hostear la versión open-source, o pagar $5/mes por la versión hospedada con polling cada hora y alertas multi-canal.",
  faq_eyebrow: "FAQ",
  faq_h2: "Preguntas comunes.",
  faq_sub: "Escríbenos si la tuya no está aquí.",
  faqs: [
    { q: "¿Cómo guardan mis tokens API?", a: "Cifrados con AES-256-GCM en Cloudflare D1. La clave maestra está en Workers Secrets, separada de la DB. Solo aceptamos tokens de solo lectura / con scope de uso — nunca con permisos de provisioning o escritura. Si dudas, el código es open source — léelo tú mismo." },
    { q: "¿FreeTier Sentinel monitorea su propio free tier?", a: "Sí. El Worker monitorea su propio uso. Si alguna vez me despierta porque <em>él</em> alcanzó un límite de Cloudflare, eso significa que funciona Y que la gente lo usa." },
    { q: "¿Por qué $5/mes en lugar de gratis para siempre?", a: "Polling cada hora para servicios ilimitados + alertas Discord/Telegram cuesta Worker compute real y volumen de email de Resend. $5/mes es el precio más bajo sostenible. La capa gratis es realmente útil, no un trial." },
    { q: "¿Puedo cancelar en cualquier momento?", a: "Un click en el portal de cliente de Stripe. Sin \"contáctanos para cancelar\" absurdo. Reembolsos dentro de 7 días, sin preguntas." },
    { q: "¿Qué pasa al 100%? ¿Paran las peticiones por mí?", a: "No. No tenemos permiso para controlar tus servicios — es por diseño. Avisamos al 80% (por defecto, configurable) para que tú actúes: subir de plan, optimizar tráfico, o aceptar el precipicio." },
    { q: "¿Qué SaaS vienen luego?", a: "Actuales: Cloudflare Workers, GitHub Actions. En las próximas 2 semanas: Vercel, Supabase, Render, Resend, Neon, Cloudflare R2. ¿Te falta uno? <a href=\"https://github.com/wndnjs3865/freetier-sentinel/issues\">Abre un issue</a>." },
    { q: "¿Hay API o webhooks?", a: "Todavía no — Pro se centra en polling cada hora. Si te servirían webhooks para eventos de uso, dilo en un issue. Si hay demanda, lo añadimos." },
  ],
  cta_h2: "Un dashboard. Cero precipicios a medianoche.",
  cta_p: "Los devs solo pierden horas con sobrepasos cada mes. Tú no tienes que.",
  cta_button: "Recibir magic link →",
  footer_tagline: "<strong>FreeTier Sentinel</strong> — Un dashboard para cada límite de SaaS gratis que te importa. Hecho solo en Cloudflare Workers, totalmente open source.",
  footer_product: "Producto",
  footer_oss: "Código abierto",
  footer_built: "Hecho con Cloudflare Workers · D1 · KV",
  footer_signin: "Entrar",
};

const de: Translations = {
  title: "FreeTier Sentinel — Datadog für Free-Tiers",
  description: "Wie Datadog, aber für Free-Tier-Limits. Wir mailen dich bei 80% — bevor's runtergeht. Ein Dashboard für Cloudflare, GitHub Actions, Vercel, Supabase, Resend und 4 mehr.",
  nav_features: "Features",
  nav_how: "So funktioniert's",
  nav_pricing: "Preise",
  nav_faq: "FAQ",
  nav_signin: "Anmelden →",
  switcher_label: "Sprache",
  hero_eyebrow: "8 Services im Auge. Wöchentlich kommt was dazu.",
  hero_h1_line1: "Jeden Free-Tier im Blick.",
  hero_h1_line2: "Und nachts ruhig schlafen.",
  hero_sub_line1: "Wie Datadog, aber für Free-Tier-Limits.",
  hero_sub_line2: "Wir mailen dich bei 80% — bevor's runtergeht.",
  hero_email_placeholder: "du@beispiel.com",
  hero_cta: "Loslegen →",
  hero_micro_1: "Kostenlos für 3 Services",
  hero_micro_2: "Keine Karte nötig",
  hero_micro_3: "In 60 Sekunden eingerichtet",
  strip_label: "Aktuell überwacht",
  features_eyebrow: "Warum Sentinel",
  features_h2_line1: "Gemacht für Indie-Devs,",
  features_h2_line2: "die echte Dinge auf Free-Tiers laufen lassen.",
  features_sub: "Jede Cloud hat eine Usage-Page. Keine schickt dir eine Mail, bevor's runtergeht. Wir schon.",
  features: [
    { title: "Pre-Cliff-Alerts", desc: "Standard-Schwelle 80%. Mail sofort. Discord + Telegram im Pro. Schluss mit Site-Down-Notfällen um 23 Uhr." },
    { title: "Read-only by Design", desc: "Nur Tokens mit Usage-Scope. AES-256-GCM verschlüsselt. Master-Key in Workers Secrets, niemals in der DB." },
    { title: "Stündliches Polling", desc: "Free: alle 12 Std. Pro: alle 1 Std. Polling ist das Schnellste ohne Webhooks (die meisten Clouds bieten eh keine)." },
    { title: "Multi-Cloud-Aggregator", desc: "Ein Dashboard für 8 Services, wächst weiter. Jeder Adapter ist in ca. einem Tag gebaut. Fehlt einer? Mach ein Issue auf." },
    { title: "Usage-Verlauf", desc: "Free: 7 Tage. Pro: 30 Tage rollierend. Schleichende Lecks erkennen, bevor sie auf der Rechnung auftauchen." },
    { title: "Open-Source-Kern", desc: "Der Worker-Code liegt auf GitHub. Selbst hosten kostet nichts, oder $5/Monat für die gehostete Version mit stündlichem Polling." },
  ],
  how_eyebrow: "So funktioniert's",
  how_h2: "Drei Schritte. Null Mitternachts-Überraschungen.",
  how_sub: "Vom Anmelden bis zur ersten Alert in unter 60 Sekunden.",
  steps: [
    { title: "Service verbinden", desc: "Füg einen Read-only-API-Token von Cloudflare, GitHub Actions, Vercel oder einem der 8 unterstützten SaaS ein. Tokens werden verschlüsselt gespeichert." },
    { title: "Schwelle festlegen", desc: "Standardmäßig 80% des Free-Tier-Limits. Wähle Alert-Kanäle: E-Mail (gratis), Discord & Telegram (Pro). Mehrere pro Konto möglich." },
    { title: "Nachts schlafen", desc: "Wir pollen stündlich (Pro) und melden uns, sobald die Schwelle überschritten wird. Vor dem Cliff, nicht danach." },
  ],
  pricing_eyebrow: "Preise",
  pricing_h2: "Ein Free-Tier, den du wirklich nutzt.",
  pricing_sub: "Pro kostet faire $5/Monat für stündliches Polling und Multi-Channel-Alerts.",
  tier_per: "/ Monat",
  tier_free_label: "Free",
  tier_free_sub: "Für Solo-Devs, die Side-Projects validieren.",
  tier_free_features: [
    "Bis zu 3 verbundene Services",
    "Polling alle 12 Stunden",
    "E-Mail-Alerts",
    "7-Tage-Usage-Verlauf",
    "Magic-Link-Auth, keine Passwörter",
  ],
  tier_free_cta: "Kostenlos starten",
  tier_pro_label: "Pro",
  tier_pro_badge: "Am beliebtesten",
  tier_pro_sub: "Für Leute, die echte Dinge auf Free-Tiers laufen lassen.",
  tier_pro_features: [
    "Unbegrenzte Services",
    "Polling jede Stunde",
    "E-Mail + Discord + Telegram",
    "30-Tage-Usage-Verlauf",
    "Priorisierte Bug-Bearbeitung",
    "Open-Source-Version selbst hosten",
  ],
  tier_pro_cta: "Kostenlos starten, später upgraden",
  code_eyebrow: "Auf Cloudflare gebaut",
  code_h2: "Läuft auf demselben Free-Tier, den es überwacht.",
  code_p1: "Workers + D1 + KV + Cron Triggers. Das ganze Produkt läuft auf dem Free-Tier der Cloud, nach der's benannt ist. Dogfood von Haus aus.",
  code_p2: "Du kannst die Open-Source-Version selbst hosten oder $5/Monat für die gehostete Version mit stündlichem Polling und Multi-Channel-Alerts zahlen.",
  faq_eyebrow: "FAQ",
  faq_h2: "Häufige Fragen.",
  faq_sub: "Schreib uns, wenn deine fehlt.",
  faqs: [
    { q: "Wie werden meine API-Tokens gespeichert?", a: "AES-256-GCM-verschlüsselt in Cloudflare D1. Der Master-Key liegt in Workers Secrets, getrennt von der DB. Wir nehmen nur Read-only-/Usage-Scope-Tokens — niemals welche mit Provisioning- oder Write-Rechten. Wer skeptisch ist: Der Code ist offen, lies ihn selbst." },
    { q: "Überwacht FreeTier Sentinel seinen eigenen Free-Tier?", a: "Ja. Der Worker überwacht seine eigene Nutzung. Wenn <em>er</em> mich mal weckt, weil er ein Cloudflare-Limit erreicht hat, heißt das: Er funktioniert UND Leute benutzen ihn." },
    { q: "Warum $5/Monat statt für immer kostenlos?", a: "Stündliches Polling für unbegrenzte Services + Discord/Telegram-Alerts kosten echte Worker-Compute und Resend-E-Mail-Volumen. $5/Monat ist der niedrigste nachhaltige Preis. Der Free-Tier ist ehrlich nutzbar, kein Trial." },
    { q: "Kann ich jederzeit kündigen?", a: "Ein Klick im Stripe Customer Portal. Kein \"Bitte kontaktieren Sie uns zum Kündigen\"-Quatsch. Rückerstattung binnen 7 Tagen, keine Fragen." },
    { q: "Was passiert bei 100%? Stoppt ihr die Requests für mich?", a: "Nein. Wir haben keine Berechtigung, deine Services zu steuern — Absicht. Wir benachrichtigen dich bei 80% (Standard, einstellbar), damit du handelst: Plan upgraden, Traffic optimieren oder den Cliff in Kauf nehmen." },
    { q: "Welche SaaS kommen als Nächstes?", a: "Aktuell: Cloudflare Workers, GitHub Actions. In den nächsten 2 Wochen: Vercel, Supabase, Render, Resend, Neon, Cloudflare R2. Fehlt einer? <a href=\"https://github.com/wndnjs3865/freetier-sentinel/issues\">Issue aufmachen</a>." },
    { q: "Gibt's eine API oder Webhooks?", a: "Noch nicht — Pro fokussiert auf stündliches Polling. Wenn dir ein Webhook für Usage-Events helfen würde, sag's in einem Issue. Wenn's Nachfrage gibt, bauen wir's." },
  ],
  cta_h2: "Ein Dashboard. Null Cliffs in der Nacht.",
  cta_p: "Solo-Devs verlieren jeden Monat Stunden an Überschreitungen. Du musst das nicht.",
  cta_button: "Magic-Link holen →",
  footer_tagline: "<strong>FreeTier Sentinel</strong> — Ein Dashboard für jedes Free-Tier-SaaS-Limit, das dich interessiert. Solo auf Cloudflare Workers gebaut, komplett Open Source.",
  footer_product: "Produkt",
  footer_oss: "Open Source",
  footer_built: "Gebaut mit Cloudflare Workers · D1 · KV",
  footer_signin: "Anmelden",
};

export const T: Record<Locale, Translations> = { en, ko, ja, es, de };
