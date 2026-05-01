import type { Env } from "../index";

export async function sendMagicLinkEmail(env: Env, to: string, link: string): Promise<void> {
  const body = {
    from: env.RESEND_FROM,
    to,
    subject: "Your FreeTier Sentinel sign-in link",
    text: `Click to sign in (valid 15 minutes): ${link}`,
    html: `<p>Click to sign in (valid 15 minutes):</p><p><a href="${link}">${link}</a></p>`,
  };
  const r = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "authorization": `Bearer ${env.RESEND_API_KEY}`,
      "content-type": "application/json",
    },
    body: JSON.stringify(body),
  });
  if (!r.ok) {
    console.error("[email] resend failed", r.status, await r.text());
  }
}

export async function sendUsageAlert(env: Env, to: string, subject: string, message: string): Promise<void> {
  await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "authorization": `Bearer ${env.RESEND_API_KEY}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      from: env.RESEND_FROM, to, subject,
      text: message,
    }),
  });
}
