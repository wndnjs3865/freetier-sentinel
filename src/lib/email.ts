import type { Env } from "../index";

export async function sendSignInEmail(env: Env, to: string, code: string, link: string): Promise<void> {
  const text = `Your FreeTier Sentinel sign-in code:

  ${code}

(valid 15 minutes)

Or open this link to sign in directly:
${link}

If you didn't request this, you can ignore this email.`;

  const html = `<!DOCTYPE html><html><body style="font-family:-apple-system,BlinkMacSystemFont,'Inter',system-ui,sans-serif;max-width:480px;margin:0 auto;padding:24px;color:#0a0e1a;line-height:1.6">
<div style="text-align:center;padding:8px 0 16px">
  <span style="display:inline-flex;align-items:center;gap:8px;font-weight:700;font-size:15px;color:#0a0e1a">
    <span style="display:inline-flex;align-items:center;justify-content:center;width:24px;height:24px;border-radius:6px;background:linear-gradient(135deg,#1e40af,#3b82f6);color:white;font-size:13px;font-weight:800">F</span>
    FreeTier Sentinel
  </span>
</div>
<div style="background:#fff;border:1px solid #e6e8ee;border-radius:14px;padding:32px 28px;text-align:center">
  <h1 style="font-size:20px;font-weight:700;letter-spacing:-0.01em;margin:0 0 6px;color:#0a0e1a">Your sign-in code</h1>
  <p style="margin:0 0 24px;color:#64748b;font-size:14px">Paste this back in the browser tab you came from.</p>
  <div style="background:#f8fafc;border:1px solid #e6e8ee;border-radius:12px;padding:18px;margin:0 0 24px">
    <div style="font-family:'JetBrains Mono',ui-monospace,monospace;font-size:36px;font-weight:700;letter-spacing:0.3em;color:#1e40af">${code}</div>
  </div>
  <p style="margin:0;color:#64748b;font-size:13px">Code expires in 15 minutes.</p>
  <hr style="border:0;border-top:1px solid #e6e8ee;margin:24px 0">
  <p style="margin:0 0 12px;color:#475569;font-size:13.5px">Prefer one click instead?</p>
  <a href="${link}" style="display:inline-block;padding:10px 20px;background:#0a0e1a;color:white;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px">Open sign-in link →</a>
</div>
<p style="text-align:center;color:#94a3b8;font-size:12px;margin:24px 0 0">If you didn't request this, you can safely ignore this email.</p>
</body></html>`;

  const r = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "authorization": `Bearer ${env.RESEND_API_KEY}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      from: env.RESEND_FROM,
      to,
      subject: `Your FreeTier Sentinel code: ${code}`,
      text,
      html,
    }),
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
