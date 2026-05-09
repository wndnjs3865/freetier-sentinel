/**
 * Telegram notification helper. Reads bot token + chat ID from env secrets.
 * No-op if either is missing.
 */
import type { Env } from "../index";

export async function sendTelegram(env: Env, text: string): Promise<void> {
  const token = env.TELEGRAM_BOT_TOKEN;
  const chatId = env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) return;

  try {
    await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text: text.slice(0, 4000), // Telegram message limit
        disable_web_page_preview: true,
      }),
    });
  } catch (e) {
    console.error("[telegram] send failed", e);
  }
}
