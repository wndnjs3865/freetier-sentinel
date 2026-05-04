import type { Env } from "../index";

export async function handleNotify(req: Request, env: Env): Promise<Response> {
  const apiKey = req.headers.get("x-api-key");
  if (!apiKey || apiKey !== env.NOTIFY_API_KEY) {
    return new Response("unauthorized", { status: 401 });
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    return new Response("invalid json", { status: 400 });
  }

  const { channel, message, chat_id } = body ?? {};
  if (!channel || !message) {
    return new Response("missing channel or message", { status: 400 });
  }

  if (channel === "telegram") {
    return dispatchTelegram(env, String(message), chat_id);
  }

  return new Response(`unsupported channel: ${channel}`, { status: 400 });
}

async function dispatchTelegram(
  env: Env,
  message: string,
  chatIdOverride?: number | string,
): Promise<Response> {
  const token = env.TELEGRAM_BOT_TOKEN;
  const chatId = chatIdOverride ?? env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) {
    return new Response("telegram not configured", { status: 500 });
  }
  const tg = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text: message,
      parse_mode: "Markdown",
      disable_web_page_preview: true,
    }),
  });
  if (!tg.ok) {
    const errText = await tg.text();
    return new Response(`telegram error: ${errText}`, { status: 502 });
  }
  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { "content-type": "application/json" },
  });
}
