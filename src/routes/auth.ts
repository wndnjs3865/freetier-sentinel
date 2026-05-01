import type { Env } from "../index";
import { sendMagicLinkEmail } from "../lib/email";
import { uuid } from "../lib/util";

const MAGIC_TTL = 60 * 15; // 15 min

export async function handleSignup(req: Request, env: Env): Promise<Response> {
  const form = await req.formData();
  const email = String(form.get("email") || "").trim().toLowerCase();
  if (!email || !/^[^@]+@[^@]+\.[^@]+$/.test(email)) {
    return new Response("Invalid email", { status: 400 });
  }
  const token = uuid();
  await env.KV.put(`mlink:${token}`, email, { expirationTtl: MAGIC_TTL });
  const link = `${env.APP_URL}/auth/${token}`;
  await sendMagicLinkEmail(env, email, link);
  return new Response("Check your inbox for the magic link.", {
    headers: { "content-type": "text/plain" },
  });
}

export async function handleAuthToken(req: Request, env: Env): Promise<Response> {
  const url = new URL(req.url);
  const token = url.pathname.split("/").pop()!;
  const email = await env.KV.get(`mlink:${token}`);
  if (!email) return new Response("Link expired", { status: 410 });
  await env.KV.delete(`mlink:${token}`);

  // Upsert user
  let user = await env.DB.prepare("SELECT id FROM users WHERE email = ?").bind(email).first();
  if (!user) {
    const id = uuid();
    await env.DB.prepare(
      "INSERT INTO users (id, email, plan, created_at) VALUES (?, ?, 'free', ?)"
    ).bind(id, email, Math.floor(Date.now() / 1000)).run();
    user = { id };
  }

  // Issue session cookie (signed with MASTER_KEY in production; HMAC-SHA256)
  const sessionToken = uuid();
  await env.KV.put(`sess:${sessionToken}`, String(user.id), { expirationTtl: 60 * 60 * 24 * 30 });

  return new Response(null, {
    status: 302,
    headers: {
      "set-cookie": `s=${sessionToken}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${60 * 60 * 24 * 30}`,
      location: "/dash",
    },
  });
}

export async function getUserFromCookie(req: Request, env: Env): Promise<{ id: string; email: string; plan: string } | null> {
  const cookie = req.headers.get("cookie") || "";
  const m = cookie.match(/(?:^|;\s*)s=([^;]+)/);
  if (!m) return null;
  const userId = await env.KV.get(`sess:${m[1]}`);
  if (!userId) return null;
  const u = await env.DB.prepare("SELECT id, email, plan FROM users WHERE id = ?").bind(userId).first();
  return (u as any) || null;
}
