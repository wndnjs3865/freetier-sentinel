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
  title: string;
  description: string;
  nav_features: string;
  nav_how: string;
  nav_pricing: string;
  nav_faq: string;
  nav_signin: string;
  switcher_label: string;
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
  strip_label: string;
  features_eyebrow: string;
  features_h2_line1: string;
  features_h2_line2: string;
  features_sub: string;
  features: Feature[];
  how_eyebrow: string;
  how_h2: string;
  how_sub: string;
  steps: Step[];
  pricing_eyebrow: string;
  pricing_h2: string;
  pricing_sub: string;
  tier_per: string;
  tier_free_label: string;
  tier_free_sub: string;
  tier_free_features: string[];
  tier_free_cta: string;
  tier_pro_label: string;
  tier_pro_badge: string;
  tier_pro_sub: string;
  tier_pro_features: string[];
  tier_pro_cta: string;
  code_eyebrow: string;
  code_h2: string;
  code_p1: string;
  code_p2: string;
  faq_eyebrow: string;
  faq_h2: string;
  faq_sub: string;
  faqs: FAQItem[];
  cta_h2: string;
  cta_p: string;
  cta_button: string;
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
  description: "Datadog과 같지만, 무료 티어 한도를 위한 서비스입니다. 한도에 도달하기 전, 80% 시점에 이메일로 알려 드립니다. Cloudflare, GitHub Actions, Vercel, Supabase, Resend 등 8개 서비스를 하나의 대시보드로 통합 모니터링합니다.",
  nav_features: "기능",
  nav_how: "작동 방식",
  nav_pricing: "요금제",
  nav_faq: "FAQ",
  nav_signin: "로그인 →",
  switcher_label: "언어",
  hero_eyebrow: "현재 8개 서비스 모니터링 중. 매주 추가됩니다.",
  hero_h1_line1: "모든 무료 한도를 한눈에",
  hero_h1_line2: "안심하고 잠드세요",
  hero_sub_line1: "무료 플랜 한도를 위한 Datadog급 모니터링.",
  hero_sub_line2: "한도에 도달하기 전, 사용량 80%에서 이메일로 미리 알려 드립니다.",
  hero_email_placeholder: "you@example.com",
  hero_cta: "무료로 시작하세요 →",
  hero_micro_1: "3개 서비스까지 무료",
  hero_micro_2: "신용카드 불필요",
  hero_micro_3: "60초 만에 설정 완료",
  strip_label: "지원 중인 서비스",
  features_eyebrow: "Sentinel을 선택해야 하는 이유",
  features_h2_line1: "무료 플랜으로 실서비스를 운영하는",
  features_h2_line2: "1인 개발자를 위해 만들었습니다",
  features_sub: "모든 클라우드에 사용량 페이지는 있지만, 한도 도달 전에 알려주는 곳은 없습니다. Sentinel은 다릅니다.",
  features: [
    { title: "한도 도달 전 미리 알림", desc: "기본 임곗값은 80%, 이메일은 즉시 발송됩니다. Pro 플랜에서는 Discord와 Telegram도 지원됩니다. 새벽 11시에 사이트가 죽었다는 알림은 이제 그만." },
    { title: "설계 단계부터 읽기 전용", desc: "사용량 조회 권한 토큰만 요구합니다. 저장 데이터는 AES-256-GCM으로 암호화되며, 마스터 키는 Workers Secrets에 보관해 데이터베이스에는 절대 저장되지 않습니다." },
    { title: "1시간 단위 폴링", desc: "무료 12시간, Pro 1시간 주기. 대부분의 클라우드가 웹훅을 제공하지 않는 상황에서, 폴링은 가장 빠르게 알 수 있는 방법입니다." },
    { title: "멀티 클라우드 통합", desc: "8개 서비스를 하나의 대시보드에서 관리하며, 지원 범위는 계속 확장 중입니다. 어댑터는 보통 하루면 추가됩니다. 지원되지 않는 서비스가 있다면 이슈를 등록해 주세요." },
    { title: "사용량 히스토리", desc: "무료 플랜은 7일, Pro 플랜은 30일치 사용량을 누적해 보여드립니다. 청구서로 돌아오기 전에, 서서히 늘어나는 사용량을 미리 발견할 수 있습니다." },
    { title: "오픈 소스 코어", desc: "Worker 소스 코드는 GitHub에 공개되어 있습니다. 직접 셀프호스트하거나, 월 $5의 호스팅 버전으로 1시간 단위 폴링을 이용해 보세요." },
  ],
  how_eyebrow: "작동 방식",
  how_h2: "단 3단계로 새벽 장애 알림과 작별하세요",
  how_sub: "가입부터 첫 알림까지 60초면 충분합니다.",
  steps: [
    { title: "서비스 연결", desc: "Cloudflare, GitHub Actions, Vercel 등 지원되는 8개 SaaS 중 한 곳에서 발급한 읽기 전용 API 토큰을 붙여 넣으세요. 토큰은 저장 시 암호화됩니다." },
    { title: "임곗값 설정", desc: "기본값은 무료 한도의 80%입니다. 알림 채널은 이메일(무료) 또는 Discord·Telegram(Pro) 중에서 선택할 수 있으며, 계정당 여러 채널을 등록할 수 있습니다." },
    { title: "안심하고 잠들기", desc: "Pro 플랜은 1시간마다 사용량을 확인해, 임곗값을 넘기는 즉시 알려드립니다. 한도를 초과한 뒤가 아니라, 도달하기 전에." },
  ],
  pricing_eyebrow: "요금제",
  pricing_h2: "정말로 쓸 수 있는 무료 플랜",
  pricing_sub: "Pro는 월 $5의 합리적인 가격으로 1시간 단위 폴링과 멀티 채널 알림을 제공합니다.",
  tier_per: "/ 월",
  tier_free_label: "Free",
  tier_free_sub: "사이드 프로젝트를 검증하는 솔로 개발자를 위한 플랜.",
  tier_free_features: [
    "최대 3개 서비스 연결",
    "12시간마다 폴링",
    "이메일 알림",
    "7일 사용량 히스토리",
    "매직 링크 인증, 비밀번호 없음",
  ],
  tier_free_cta: "무료로 시작하기",
  tier_pro_label: "Pro",
  tier_pro_badge: "가장 인기 있는 플랜",
  tier_pro_sub: "무료 플랜 위에서 실서비스를 운영하는 분들을 위한 플랜.",
  tier_pro_features: [
    "무제한 서비스 연결",
    "1시간마다 폴링",
    "이메일·Discord·Telegram 알림",
    "30일 사용량 히스토리",
    "버그 우선 대응",
    "오픈 소스 버전 셀프호스트",
  ],
  tier_pro_cta: "무료로 시작하고 나중에 업그레이드",
  code_eyebrow: "Cloudflare 기반 구축",
  code_h2: "모니터링 대상과 동일한 무료 플랜 위에서 동작합니다",
  code_p1: "Workers + D1 + KV + Cron Triggers. 제품 이름의 그 클라우드, 그 무료 티어 위에서 제품 전체가 동작합니다. 도그푸딩이 기본 내장되어 있습니다.",
  code_p2: "오픈소스 버전을 직접 셀프 호스팅하시거나, 월 $5 호스티드 플랜으로 시간 단위 폴링과 멀티 채널 알림을 이용하실 수 있습니다.",
  faq_eyebrow: "FAQ",
  faq_h2: "자주 묻는 질문",
  faq_sub: "원하는 답이 없다면 언제든 문의해 주세요.",
  faqs: [
    { q: "API 토큰은 어떻게 저장됩니까?", a: "Cloudflare D1에 AES-256-GCM으로 암호화되어 저장됩니다. 마스터 키는 데이터베이스와 분리되어 Workers Secrets에 보관됩니다. 읽기 전용/사용량 스코프 토큰만 요구하며, 프로비저닝 권한이나 쓰기 권한이 있는 토큰은 절대 요구하지 않습니다. 의심스러우시다면 직접 코드를 확인하실 수 있도록 소스를 공개해 두었습니다." },
    { q: "FreeTier Sentinel은 자기 자신의 무료 티어도 모니터링합니까?", a: "예. Worker가 자기 자신의 사용량을 모니터링합니다. <em>이 서비스 자체</em>가 Cloudflare 한도에 도달하여 저를 깨운다면, 그것은 서비스가 정상 동작 중이며 사용자가 많다는 뜻이 됩니다." },
    { q: "왜 평생 무료가 아니라 월 $5입니까?", a: "무제한 서비스 시간 단위 폴링과 Discord·Telegram 알림에는 실제 Worker 컴퓨트와 Resend 이메일 비용이 듭니다. 월 $5는 서비스를 지속 가능하게 운영할 수 있는 최저가이며, 무료 플랜은 체험판이 아니라 그 자체로 충분히 유용한 플랜입니다." },
    { q: "언제든지 해지할 수 있습니까?", a: "Stripe 고객 포털에서 클릭 한 번으로 해지하실 수 있습니다. '해지하려면 문의 주세요' 같은 번거로움이 없습니다. 7일 이내 환불 가능하며, 사유는 묻지 않습니다." },
    { q: "100%에 도달하면 어떻게 됩니까? 요청을 대신 차단해 줍니까?", a: "아닙니다. 저희에게는 고객님의 서비스를 제어할 권한이 없으며, 이는 의도된 설계입니다. 80% 시점(기본값, 변경 가능)에 알림을 보내 드리므로, 플랜을 업그레이드하시거나 트래픽을 최적화하시거나 서비스 중단을 감수하시는 등 직접 판단하여 대응하실 수 있습니다." },
    { q: "다음에 추가될 SaaS는 무엇입니까?", a: "현재 출시: Cloudflare Workers, GitHub Actions. 향후 2주 내 추가 예정: Vercel, Supabase, Render, Resend, Neon, Cloudflare R2. 원하시는 서비스가 목록에 없습니까? <a href=\"https://github.com/wndnjs3865/freetier-sentinel/issues\">이슈를 등록해 주십시오</a>." },
    { q: "API나 웹훅을 제공합니까?", a: "아직 제공하지 않습니다. Pro 플랜은 시간 단위 폴링에 집중하고 있습니다. 사용량 이벤트 웹훅이 필요하시다면 이슈로 알려 주십시오. 수요가 있다면 추가하겠습니다." },
  ],
  cta_h2: "한 화면에서 모두 확인하고, 새벽 한도 초과와 작별하세요",
  cta_p: "솔로 개발자는 매달 사용량 초과로 적지 않은 시간을 잃습니다. 더는 그러지 않으셔도 됩니다.",
  cta_button: "매직 링크 받기 →",
  footer_tagline: "<strong>FreeTier Sentinel</strong> — 신경 쓰시는 모든 무료 티어 SaaS 한도를 하나의 대시보드에 모았습니다. Cloudflare Workers 기반으로 1인 개발한 완전한 오픈소스 프로젝트입니다.",
  footer_product: "제품",
  footer_oss: "오픈소스",
  footer_built: "Cloudflare Workers · D1 · KV로 구축",
  footer_signin: "로그인",
};

const ja: Translations = {
  title: "FreeTier Sentinel — 無料枠のための Datadog",
  description: "Datadog のような存在を、無料枠のために。崖に落ちる前、80% の時点でメールでお知らせします。Cloudflare、GitHub Actions、Vercel、Supabase、Resend ほか計 8 サービスを単一のダッシュボードで監視。",
  nav_features: "機能",
  nav_how: "ご利用の流れ",
  nav_pricing: "料金",
  nav_faq: "よくある質問",
  nav_signin: "ログイン →",
  switcher_label: "言語",
  hero_eyebrow: "現在 8 サービスを監視中。対応サービスは毎週追加。",
  hero_h1_line1: "すべての無料枠を、ひとつの画面で",
  hero_h1_line2: "夜はぐっすり眠れます",
  hero_sub_line1: "無料枠の上限管理に、Datadog のアプローチを。",
  hero_sub_line2: "上限に達する前、使用率 80% の時点でメールでお知らせします。",
  hero_email_placeholder: "you@example.com",
  hero_cta: "無料で始める →",
  hero_micro_1: "3 サービスまで無料",
  hero_micro_2: "クレジットカード不要",
  hero_micro_3: "60 秒でセットアップ",
  strip_label: "対応サービス",
  features_eyebrow: "Sentinel を選ぶ理由",
  features_h2_line1: "無料枠で本番サービスを動かす",
  features_h2_line2: "すべての個人開発者のために",
  features_sub: "どのクラウドにも使用量ページはあります。けれど、上限の手前で通知してくれるサービスはありません。Sentinel が、その役目を担います。",
  features: [
    { title: "上限到達前のアラート", desc: "しきい値はデフォルトで 80%。メール通知は即時配信、Pro プランでは Discord と Telegram にも対応します。深夜 11 時の障害対応に追われる日々は、もう終わりです。" },
    { title: "設計段階から読み取り専用", desc: "必要なのは使用量スコープのトークンのみ。保存データは AES-256-GCM で暗号化し、マスターキーは Workers Secrets に格納してデータベースには保持しません。" },
    { title: "1 時間ごとのポーリング", desc: "無料プランは 12 時間ごと、Pro プランは 1 時間ごとに取得します。多くのクラウドが Webhook を公開していない以上、ポーリングが最速の検知手段です。" },
    { title: "マルチクラウドを一元管理", desc: "8 サービスをひとつのダッシュボードに集約し、対応範囲は拡大を続けています。新しいアダプターは通常 1 日で追加可能です。未対応のサービスがあれば、Issue でお知らせください。" },
    { title: "使用量の履歴", desc: "無料プランは過去 7 日間、Pro プランは過去 30 日間の履歴を保持します。請求書で驚かされる前に、ゆるやかな使用量の増加を発見できます。" },
    { title: "オープンソースのコア", desc: "Worker のソースコードは GitHub に公開しています。ご自身でセルフホストするのも無料、ホスティング版で 1 時間ごとのポーリングをご利用いただく場合は月額 $5 です。" },
  ],
  how_eyebrow: "ご利用の流れ",
  how_h2: "たった 3 ステップで、深夜の障害対応から解放されます",
  how_sub: "サインアップから最初のアラートまで、60 秒以内。",
  steps: [
    { title: "サービスを接続", desc: "Cloudflare、GitHub Actions、Vercel など、対応 8 サービスのいずれかで発行した読み取り専用 API トークンを貼り付けます。トークンは保存時に暗号化されます。" },
    { title: "しきい値を設定", desc: "デフォルトは無料枠の 80% です。通知チャネルは、メール(無料)または Discord・Telegram(Pro)からお選びいただけます。1 アカウントで複数のチャネルをご利用いただけます。" },
    { title: "あとは安心しておまかせ", desc: "Pro プランでは 1 時間ごとに使用量を確認し、しきい値を超えた瞬間に通知します。上限に達した後ではなく、到達する前に。" },
  ],
  pricing_eyebrow: "料金",
  pricing_h2: "本当に使える無料プラン",
  pricing_sub: "Pro プランは月額 $5 の手頃な価格で、1 時間ごとのポーリングとマルチチャネル通知に対応します。",
  tier_per: "/ 月",
  tier_free_label: "Free",
  tier_free_sub: "サイドプロジェクトを検証する個人開発者向け。",
  tier_free_features: [
    "最大 3 サービス接続",
    "12 時間ごとにポーリング",
    "メール通知",
    "7 日間の使用履歴",
    "マジックリンク認証、パスワード不要",
  ],
  tier_free_cta: "無料で始める",
  tier_pro_label: "Pro",
  tier_pro_badge: "最も人気のプラン",
  tier_pro_sub: "無料枠の上で本番サービスを運用する方向け。",
  tier_pro_features: [
    "無制限のサービス接続",
    "1 時間ごとにポーリング",
    "メール・Discord・Telegram 通知",
    "30 日間の使用履歴",
    "バグの優先対応",
    "オープンソース版のセルフホスティング可",
  ],
  tier_pro_cta: "まずは無料で、必要になったら Pro へ",
  code_eyebrow: "Cloudflare の上に構築",
  code_h2: "監視対象と同じ無料枠の上で稼働",
  code_p1: "Workers + D1 + KV + Cron Triggers。プロダクト名の由来となったクラウドの、その無料枠の上でプロダクト全体が稼働します。ドッグフーディングは標準装備。",
  code_p2: "オープンソース版をご自身でセルフホストいただくことも、月額 $5 のホスティング版で 1 時間ごとのポーリングとマルチチャネル通知をご利用いただくこともできます。",
  faq_eyebrow: "よくある質問",
  faq_h2: "よくあるご質問",
  faq_sub: "ここに回答がない場合は、お気軽にお問い合わせください。",
  faqs: [
    { q: "API トークンはどのように保管されますか?", a: "Cloudflare D1 上で AES-256-GCM により暗号化して保管されます。マスターキーはデータベースとは分離して Workers Secrets に格納されます。読み取り専用・使用量スコープのトークンのみを要求し、プロビジョニング権限や書き込み権限を持つトークンは一切受け取りません。ご不安な場合は、ソースコードを公開していますので直接ご確認いただけます。" },
    { q: "FreeTier Sentinel は自分自身の無料枠も監視しますか?", a: "はい。Worker が自身の使用量を監視しています。万一<em>このサービス自体</em>が Cloudflare の上限に達して開発者を起こすことがあれば、それはサービスが正常に動作しており、かつ多くの方にご利用いただいている証拠ということになります。" },
    { q: "なぜ永久無料ではなく月額 $5 なのでしょうか?", a: "サービス数無制限の 1 時間ごとのポーリングと Discord・Telegram 通知は、実際の Worker コンピュートと Resend のメール送信コストを発生させます。月額 $5 は持続可能な最低価格です。無料プランは体験版ではなく、それ単体で十分に実用的なプランとして提供しています。" },
    { q: "いつでも解約できますか?", a: "Stripe カスタマーポータルからワンクリックで解約いただけます。「解約はお問い合わせください」といった面倒な手続きは一切ありません。ご利用開始から 7 日以内であれば、理由を問わず全額返金いたします。" },
    { q: "100% に達した場合、リクエストを止めてくれますか?", a: "いいえ。お客様のサービスを制御する権限は当方にはなく、これは意図的な設計です。80% の時点(デフォルト、変更可能)でお知らせしますので、プランのアップグレード、トラフィックの最適化、あるいはサービス停止を受け入れるかなど、お客様ご自身でご判断いただけます。" },
    { q: "次に対応予定の SaaS はどれですか?", a: "リリース済み: Cloudflare Workers、GitHub Actions。今後 2 週間以内に対応予定: Vercel、Supabase、Render、Resend、Neon、Cloudflare R2。リストにないサービスをご希望ですか? <a href=\"https://github.com/wndnjs3865/freetier-sentinel/issues\">Issue を立ててください</a>。" },
    { q: "API や Webhook はありますか?", a: "現時点では提供していません。Pro プランは 1 時間ごとのポーリングに注力しています。使用量イベントの Webhook をご希望でしたら、Issue でお知らせください。需要があれば追加いたします。" },
  ],
  cta_h2: "ダッシュボードはひとつ。深夜の上限超過に、終止符を",
  cta_p: "個人開発者は毎月、超過料金のために多くの時間を失っています。もう、その必要はありません。",
  cta_button: "マジックリンクを受け取る →",
  footer_tagline: "<strong>FreeTier Sentinel</strong> — 気になる無料枠 SaaS の上限を、すべてひとつのダッシュボードに集約。Cloudflare Workers 上で個人開発した、完全オープンソースのプロダクトです。",
  footer_product: "プロダクト",
  footer_oss: "オープンソース",
  footer_built: "Cloudflare Workers · D1 · KV で構築",
  footer_signin: "ログイン",
};

const es: Translations = {
  title: "FreeTier Sentinel — Datadog para los planes gratuitos",
  description: "Como Datadog, pero para los límites del plan gratuito. Te avisamos por correo al 80 %, antes de llegar al precipicio. Un único panel para Cloudflare, GitHub Actions, Vercel, Supabase, Resend y 4 servicios más.",
  nav_features: "Funciones",
  nav_how: "Cómo funciona",
  nav_pricing: "Precios",
  nav_faq: "Preguntas frecuentes",
  nav_signin: "Iniciar sesión →",
  switcher_label: "Idioma",
  hero_eyebrow: "Vigilando 8 servicios. Se añaden más cada semana.",
  hero_h1_line1: "Vigila todos tus planes gratuitos.",
  hero_h1_line2: "Y duerme tranquilo.",
  hero_sub_line1: "Datadog, pero para los límites de los planes gratuitos.",
  hero_sub_line2: "Te avisamos por correo cuando llegues al 80 % de consumo, antes de tocar el tope.",
  hero_email_placeholder: "tu@ejemplo.com",
  hero_cta: "Empieza ahora →",
  hero_micro_1: "Gratis para 3 servicios",
  hero_micro_2: "Sin tarjeta de crédito",
  hero_micro_3: "Configuración en 60 segundos",
  strip_label: "Servicios compatibles",
  features_eyebrow: "Por qué Sentinel",
  features_h2_line1: "Hecho para los desarrolladores independientes",
  features_h2_line2: "que llevan proyectos reales sobre planes gratuitos.",
  features_sub: "Todas las nubes tienen una página de consumo. Ninguna te avisa antes de llegar al tope. Sentinel sí lo hace.",
  features: [
    { title: "Alertas antes del tope", desc: "Umbral por defecto del 80 %. Aviso por correo al instante. Discord y Telegram en Pro. Se acabaron las urgencias a las 11 de la noche." },
    { title: "De solo lectura por diseño", desc: "Solo pedimos tokens con permiso de consumo. Cifrado AES-256-GCM en reposo. La clave maestra vive en Workers Secrets, nunca en la base de datos." },
    { title: "Sondeo cada hora", desc: "Gratis: cada 12 horas. Pro: cada hora. El sondeo es lo más rápido sin webhooks, que la mayoría de las nubes ni siquiera ofrecen." },
    { title: "Vista multinube unificada", desc: "Un solo panel para 8 servicios y subiendo. Cada nuevo adaptador se añade en aproximadamente un día. ¿Falta alguno? Abre una incidencia en GitHub." },
    { title: "Histórico de consumo", desc: "Histórico móvil de 7 días en el plan gratuito y de 30 días en Pro. Detecta las fugas lentas antes de que se conviertan en sorpresas en la factura." },
    { title: "Núcleo de código abierto", desc: "El código del Worker está en GitHub. Aloja el servicio tú mismo gratis, o paga 5 USD al mes por la versión gestionada con sondeo cada hora." },
  ],
  how_eyebrow: "Cómo funciona",
  how_h2: "Tres pasos para acabar con los sustos a medianoche.",
  how_sub: "Del registro a la primera alerta en menos de 60 segundos.",
  steps: [
    { title: "Conecta un servicio", desc: "Pega un token de API de solo lectura desde Cloudflare, GitHub Actions, Vercel o cualquiera de los 8 servicios SaaS compatibles. Los tokens se almacenan cifrados." },
    { title: "Define tu umbral", desc: "Por defecto se sitúa en el 80 % del límite gratuito. Elige los canales de aviso: correo (gratis), Discord y Telegram (Pro). Puedes configurar varios por cuenta." },
    { title: "Duerme tranquilo", desc: "Sondeamos cada hora (Pro) y te avisamos en cuanto el consumo supera tu umbral. Antes de llegar al tope, no después." },
  ],
  pricing_eyebrow: "Precios",
  pricing_h2: "Un plan gratuito que sí vas a usar.",
  pricing_sub: "Pro cuesta solo 5 USD al mes e incluye sondeo cada hora y alertas en varios canales.",
  tier_per: "/ mes",
  tier_free_label: "Free",
  tier_free_sub: "Para desarrolladores en solitario que validan proyectos paralelos.",
  tier_free_features: [
    "Hasta 3 servicios conectados",
    "Sondeo cada 12 horas",
    "Alertas por correo",
    "Histórico de 7 días",
    "Autenticación con enlace mágico, sin contraseñas",
  ],
  tier_free_cta: "Empezar gratis",
  tier_pro_label: "Pro",
  tier_pro_badge: "El más popular",
  tier_pro_sub: "Para quienes ponen proyectos reales sobre planes gratuitos.",
  tier_pro_features: [
    "Servicios ilimitados",
    "Sondeo cada hora",
    "Correo + Discord + Telegram",
    "Histórico de 30 días",
    "Respuesta prioritaria a errores",
    "Aloja tú mismo la versión de código abierto",
  ],
  tier_pro_cta: "Empieza gratis y pasa a Pro cuando lo necesites",
  code_eyebrow: "Construido sobre Cloudflare",
  code_h2: "Funciona sobre el mismo plan gratuito que monitoriza.",
  code_p1: "Workers + D1 + KV + Cron Triggers. Todo el producto se ejecuta sobre el plan gratuito de la nube que le da nombre. El dogfooding viene de serie.",
  code_p2: "Puedes autoalojar tú mismo la versión de código abierto, o pagar 5 USD al mes por la versión gestionada con sondeo cada hora y alertas multicanal.",
  faq_eyebrow: "Preguntas frecuentes",
  faq_h2: "Preguntas comunes.",
  faq_sub: "Si la tuya no aparece, escríbenos sin problema.",
  faqs: [
    { q: "¿Cómo se almacenan mis tokens de API?", a: "Cifrados con AES-256-GCM en Cloudflare D1. La clave maestra reside en Workers Secrets, separada de la base de datos. Solo aceptamos tokens de solo lectura o limitados al consumo, nunca tokens con permisos de aprovisionamiento o escritura. Si desconfías, el código es abierto: échale un vistazo tú mismo." },
    { q: "¿Monitorizará FreeTier Sentinel su propio plan gratuito?", a: "Sí. El propio Worker monitoriza su uso. Si algún día me despierta porque <em>él mismo</em> ha alcanzado un límite de Cloudflare, significará que funciona Y que tiene usuarios." },
    { q: "¿Por qué 5 USD al mes en lugar de ser gratis para siempre?", a: "Sondear cada hora un número ilimitado de servicios y enviar alertas a Discord o Telegram supone un coste real de cómputo de Workers y un volumen de correo de Resend que crece con la escala. 5 USD/mes es el precio más bajo que resulta sostenible. El plan gratuito es genuinamente útil, no una prueba." },
    { q: "¿Puedo cancelar cuando quiera?", a: "Con un solo clic desde el portal de cliente de Stripe. Nada de \"contáctanos para cancelar\". Reembolsos durante los primeros 7 días, sin preguntas." },
    { q: "¿Qué pasa al llegar al 100 %? ¿Bloquean las peticiones por mí?", a: "No. No tenemos permisos para controlar tus servicios, y es algo deliberado. Te avisamos al 80 % (valor por defecto, configurable) para que puedas decidir: ampliar el plan, optimizar el tráfico o asumir el corte de servicio." },
    { q: "¿Qué SaaS llegarán a continuación?", a: "Ya disponibles: Cloudflare Workers, GitHub Actions. Próximas 2 semanas: Vercel, Supabase, Render, Resend, Neon y Cloudflare R2. ¿Te falta alguno? <a href=\"https://github.com/wndnjs3865/freetier-sentinel/issues\">Abre una incidencia</a>." },
    { q: "¿Hay API o webhooks?", a: "Aún no: el plan Pro está centrado en el sondeo cada hora. Si te resultaría útil un webhook para los eventos de uso, dínoslo en una incidencia. Lo añadiremos si hay demanda." },
  ],
  cta_h2: "Un único panel y se acabaron los sustos a medianoche.",
  cta_p: "Los desarrolladores en solitario pierden horas cada mes por consumos imprevistos. No tiene por qué ser así.",
  cta_button: "Recibir enlace mágico →",
  footer_tagline: "<strong>FreeTier Sentinel</strong> — Un único panel para cada límite de SaaS gratuito que te importe. Construido en solitario sobre Cloudflare Workers, totalmente de código abierto.",
  footer_product: "Producto",
  footer_oss: "Código abierto",
  footer_built: "Construido con Cloudflare Workers · D1 · KV",
  footer_signin: "Iniciar sesión",
};

const de: Translations = {
  title: "FreeTier Sentinel — Datadog für kostenlose Kontingente",
  description: "Wie Datadog, jedoch für die Grenzen kostenloser Kontingente. Wir benachrichtigen Sie per E-Mail bei 80% – bevor es zu spät ist. Ein Dashboard für Cloudflare, GitHub Actions, Vercel, Supabase, Resend und vier weitere Dienste.",
  nav_features: "Funktionen",
  nav_how: "So funktioniert es",
  nav_pricing: "Preise",
  nav_faq: "FAQ",
  nav_signin: "Anmelden →",
  switcher_label: "Sprache",
  hero_eyebrow: "8 Dienste werden überwacht. Wöchentlich kommen weitere hinzu.",
  hero_h1_line1: "Alle kostenlosen Kontingente auf einen Blick.",
  hero_h1_line2: "Und schlafen Sie ruhig.",
  hero_sub_line1: "Wie Datadog – nur für die Limits kostenloser Kontingente.",
  hero_sub_line2: "Wir benachrichtigen Sie per E-Mail bei 80% der Auslastung – bevor das Limit erreicht ist.",
  hero_email_placeholder: "du@beispiel.de",
  hero_cta: "Jetzt starten →",
  hero_micro_1: "Kostenlos für 3 Dienste",
  hero_micro_2: "Keine Kreditkarte erforderlich",
  hero_micro_3: "In 60 Sekunden eingerichtet",
  strip_label: "Unterstützte Dienste",
  features_eyebrow: "Warum Sentinel",
  features_h2_line1: "Entwickelt für Indie-Developer,",
  features_h2_line2: "die echte Projekte auf Free Tiers betreiben.",
  features_sub: "Jede Cloud zeigt den Verbrauch an. Aber keine meldet sich, bevor das Limit erreicht ist. Wir schon.",
  features: [
    { title: "Benachrichtigung vor dem Limit", desc: "Standardschwellenwert: 80%. Sofortige E-Mail-Benachrichtigung, Discord und Telegram im Pro-Tarif. Schluss mit Notfall-Einsätzen um 23 Uhr." },
    { title: "Schreibgeschützt – ab Werk", desc: "Wir verlangen ausschließlich Tokens mit Verbrauchs-Scope. AES-256-GCM-Verschlüsselung im Ruhezustand. Der Master-Key liegt in Workers Secrets und niemals in der Datenbank." },
    { title: "Stündliches Polling", desc: "Kostenlos: alle 12 Stunden. Pro: jede Stunde. Polling ist die schnellste Methode, ohne auf Webhooks angewiesen zu sein – die meisten Clouds bieten ohnehin keine an." },
    { title: "Multi-Cloud im Überblick", desc: "Ein Dashboard für 8 Dienste, Tendenz steigend. Jeder Adapter ist in rund einem Tag bereit. Sie vermissen einen Dienst? Eröffnen Sie ein Issue auf GitHub." },
    { title: "Verbrauchsverlauf", desc: "Rollierender Verlauf über 7 Tage im kostenlosen Tarif, 30 Tage im Pro-Tarif. Erkennen Sie schleichende Mehrverbräuche, bevor sie zur Überraschung auf der Rechnung werden." },
    { title: "Open-Source-Kern", desc: "Der Quellcode des Workers ist auf GitHub verfügbar. Hosten Sie ihn selbst kostenlos – oder nutzen Sie die gehostete Version mit stündlichem Polling für 5 $ pro Monat." },
  ],
  how_eyebrow: "So funktioniert es",
  how_h2: "In drei Schritten zum ruhigen Schlaf – ganz ohne nächtliche Überraschungen.",
  how_sub: "Vom Registrieren bis zur ersten Benachrichtigung in unter 60 Sekunden.",
  steps: [
    { title: "Dienst verbinden", desc: "Fügen Sie ein schreibgeschütztes API-Token von Cloudflare, GitHub Actions, Vercel oder einem der 8 unterstützten SaaS-Dienste ein. Tokens werden im Ruhezustand verschlüsselt." },
    { title: "Schwellenwert festlegen", desc: "Standardmäßig liegt der Wert bei 80% des Free-Tier-Limits. Wählen Sie Ihre Benachrichtigungskanäle: E-Mail (kostenlos), Discord und Telegram (Pro). Mehrere Kanäle pro Konto möglich." },
    { title: "Ruhig schlafen", desc: "Wir prüfen den Verbrauch stündlich (Pro) und melden uns, sobald Ihr Schwellenwert erreicht ist – vor dem Limit, nicht danach." },
  ],
  pricing_eyebrow: "Preise",
  pricing_h2: "Ein kostenloser Tarif, den Sie wirklich nutzen werden.",
  pricing_sub: "Pro ist mit fairen 5 $ pro Monat erhältlich und umfasst stündliches Polling sowie Mehrkanal-Benachrichtigungen.",
  tier_per: "/ Monat",
  tier_free_label: "Free",
  tier_free_sub: "Für Einzelentwickler/innen, die Nebenprojekte validieren.",
  tier_free_features: [
    "Bis zu 3 verbundene Dienste",
    "Polling alle 12 Stunden",
    "E-Mail-Benachrichtigungen",
    "Verbrauchsverlauf über 7 Tage",
    "Anmeldung per Magic Link – ohne Passwort",
  ],
  tier_free_cta: "Kostenlos starten",
  tier_pro_label: "Pro",
  tier_pro_badge: "Am beliebtesten",
  tier_pro_sub: "Für alle, die echte Projekte auf Free Tiers betreiben.",
  tier_pro_features: [
    "Unbegrenzt verbundene Dienste",
    "Polling jede Stunde",
    "E-Mail + Discord + Telegram",
    "Verbrauchsverlauf über 30 Tage",
    "Bevorzugte Bearbeitung von Bugs",
    "Open-Source-Version selbst hosten",
  ],
  tier_pro_cta: "Kostenlos starten, später upgraden",
  code_eyebrow: "Auf Cloudflare aufgebaut",
  code_h2: "Läuft auf demselben Free Tier, das er überwacht.",
  code_p1: "Workers + D1 + KV + Cron Triggers. Das gesamte Produkt läuft auf dem kostenlosen Kontingent der Cloud, von der es seinen Namen hat. Dogfooding ist serienmäßig.",
  code_p2: "Sie können die Open-Source-Variante selbst betreiben oder für 5 $/Monat die gehostete Version mit stündlicher Abfrage und mehrkanaligen Benachrichtigungen nutzen.",
  faq_eyebrow: "FAQ",
  faq_h2: "Häufig gestellte Fragen.",
  faq_sub: "Sollte Ihre Frage nicht dabei sein, melden Sie sich gerne bei uns.",
  faqs: [
    { q: "Wie werden meine API-Token gespeichert?", a: "Mit AES-256-GCM verschlüsselt in Cloudflare D1. Der Hauptschlüssel liegt in Workers Secrets, getrennt von der Datenbank. Wir verlangen ausschließlich Token mit Lese- bzw. Nutzungs-Scope – niemals Token mit Bereitstellungs- oder Schreibrechten. Falls Sie misstrauisch sind: Der Quellcode ist offen, lesen Sie ihn gerne selbst nach." },
    { q: "Überwacht FreeTier Sentinel das eigene kostenlose Kontingent?", a: "Ja. Der Worker überwacht seinen eigenen Verbrauch. Sollte er mich jemals wecken, weil <em>er selbst</em> ein Cloudflare-Limit erreicht hat, dann bedeutet das: Er funktioniert UND er wird genutzt." },
    { q: "Warum 5 $ pro Monat und nicht dauerhaft kostenlos?", a: "Stündliches Abfragen unbegrenzt vieler Dienste sowie Benachrichtigungen über Discord und Telegram verursachen reale Worker-Rechenzeit und ein mit der Nutzerzahl wachsendes Resend-E-Mail-Volumen. 5 $/Monat ist der niedrigste tragfähige Preis. Das kostenlose Kontingent ist ein vollwertig nutzbares Angebot, keine Testphase." },
    { q: "Kann ich jederzeit kündigen?", a: "Mit einem Klick über das Stripe-Kundenportal. Kein „Schreiben Sie uns zwecks Kündigung\"-Theater. Rückerstattung innerhalb von sieben Tagen, ohne Begründung." },
    { q: "Was geschieht bei 100%? Halten Sie die Anfrage für mich an?", a: "Nein. Wir verfügen nicht über die Berechtigung, Ihre Dienste zu steuern – und das ist beabsichtigt. Wir benachrichtigen Sie bei 80% (Standardwert, einstellbar), damit Sie selbst entscheiden können: Tarif aufstocken, Traffic optimieren oder den Service-Stopp in Kauf nehmen." },
    { q: "Welche SaaS-Dienste folgen als Nächstes?", a: "Bereits ausgeliefert: Cloudflare Workers, GitHub Actions. In den nächsten zwei Wochen: Vercel, Supabase, Render, Resend, Neon, Cloudflare R2. Sie vermissen einen Dienst? <a href=\"https://github.com/wndnjs3865/freetier-sentinel/issues\">Eröffnen Sie ein Issue</a>." },
    { q: "Gibt es eine API oder Webhooks?", a: "Noch nicht – der Schwerpunkt des Pro-Tarifs liegt auf der stündlichen Abfrage. Wäre ein Webhook für Nutzungsereignisse für Sie hilfreich? Lassen Sie es uns über ein Issue wissen. Bei entsprechender Nachfrage ergänzen wir das." },
  ],
  cta_h2: "Ein Dashboard. Keine bösen Überraschungen mehr.",
  cta_p: "Einzelentwickler/innen verlieren jeden Monat Stunden durch überschrittene Limits. Das muss nicht sein.",
  cta_button: "Magic Link anfordern →",
  footer_tagline: "<strong>FreeTier Sentinel</strong> — Ein Dashboard für alle Limits kostenloser SaaS-Dienste, die Ihnen wichtig sind. Im Alleingang auf Cloudflare Workers entwickelt, vollständig quelloffen.",
  footer_product: "Produkt",
  footer_oss: "Open Source",
  footer_built: "Aufgebaut auf Cloudflare Workers · D1 · KV",
  footer_signin: "Anmelden",
};

export const T: Record<Locale, Translations> = { en, ko, ja, es, de };
