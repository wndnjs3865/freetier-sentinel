/**
 * AES-GCM encryption for stored API keys.
 * MASTER_KEY is base64-encoded 32 bytes (set via wrangler secret).
 */

function b64decode(s: string): Uint8Array {
  return Uint8Array.from(atob(s), c => c.charCodeAt(0));
}
function b64encode(u: Uint8Array): string {
  let s = "";
  for (let i = 0; i < u.length; i++) s += String.fromCharCode(u[i]);
  return btoa(s);
}

async function importKey(masterB64: string): Promise<CryptoKey> {
  const raw = b64decode(masterB64);
  return crypto.subtle.importKey("raw", raw, { name: "AES-GCM" }, false, ["encrypt", "decrypt"]);
}

export async function encrypt(plaintext: string, masterKeyB64: string): Promise<string> {
  const key = await importKey(masterKeyB64);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ct = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv }, key, new TextEncoder().encode(plaintext)
  );
  const out = new Uint8Array(iv.length + (ct as ArrayBuffer).byteLength);
  out.set(iv, 0);
  out.set(new Uint8Array(ct as ArrayBuffer), iv.length);
  return b64encode(out);
}

export async function decrypt(blob: string, masterKeyB64: string): Promise<string> {
  const key = await importKey(masterKeyB64);
  const data = b64decode(blob);
  const iv = data.slice(0, 12);
  const ct = data.slice(12);
  const pt = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, ct);
  return new TextDecoder().decode(pt);
}
