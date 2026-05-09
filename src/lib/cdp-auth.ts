/**
 * Coinbase Developer Platform (CDP) JWT authentication.
 *
 * Spec: https://docs.cdp.coinbase.com/api-reference/v2/authentication
 *
 * - Algorithm: EdDSA (Ed25519)
 * - JWT payload: { sub, iss: "cdp", aud: ["cdp_service"], nbf, exp, uri }
 * - JWT header:  { alg: "EdDSA", typ: "JWT", kid, nonce }
 * - URI field:   "<METHOD> <host><path>"  (no scheme)
 * - Validity:    120 seconds
 *
 * The CDP secret from portal.cdp.coinbase.com is base64-encoded 64 bytes
 * (Ed25519 keypair = 32-byte seed + 32-byte public key). We import the
 * 32-byte seed for signing.
 */

const NONCE_BYTES = 16;

function base64UrlEncode(input: string | Uint8Array | ArrayBuffer): string {
  let bytes: Uint8Array;
  if (typeof input === "string") {
    bytes = new TextEncoder().encode(input);
  } else if (input instanceof ArrayBuffer) {
    bytes = new Uint8Array(input);
  } else {
    bytes = input;
  }
  let binary = "";
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
}

function base64UrlEncodeJson(obj: unknown): string {
  return base64UrlEncode(JSON.stringify(obj));
}

function decodeBase64(b64: string): Uint8Array {
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

function randomNonceHex(byteLen: number = NONCE_BYTES): string {
  const buf = new Uint8Array(byteLen);
  crypto.getRandomValues(buf);
  return Array.from(buf, (b) => b.toString(16).padStart(2, "0")).join("");
}

let cachedKey: CryptoKey | null = null;
let cachedKeySource: string | null = null;

function bytesToBase64Url(bytes: Uint8Array): string {
  let bin = "";
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
}

async function importEd25519PrivateKey(secretB64: string): Promise<CryptoKey> {
  if (cachedKey && cachedKeySource === secretB64) return cachedKey;
  const fullKey = decodeBase64(secretB64);
  // CDP returns 64-byte Ed25519 keypair = seed[32] + public[32].
  // CF Workers Web Crypto: raw import is for PUBLIC keys only — use JWK
  // for private (Ed25519 = OKP curve, x = public, d = private seed).
  let seed: Uint8Array;
  let pub: Uint8Array;
  if (fullKey.length === 64) {
    seed = fullKey.slice(0, 32);
    pub = fullKey.slice(32, 64);
  } else if (fullKey.length === 32) {
    // 32-byte seed only — derive public key by signing-then-extracting is
    // expensive; modern Web Crypto can't import seed-only via JWK either.
    // Fall back to PKCS8 wrapping.
    seed = fullKey;
    pub = new Uint8Array(0); // placeholder; PKCS8 path below ignores it
  } else {
    throw new Error(`unexpected CDP secret length: ${fullKey.length}`);
  }

  if (pub.length === 32) {
    // JWK path (preferred — has both halves)
    const jwk: JsonWebKey = {
      kty: "OKP",
      crv: "Ed25519",
      d: bytesToBase64Url(seed),
      x: bytesToBase64Url(pub),
    };
    const key = await crypto.subtle.importKey(
      "jwk",
      jwk,
      { name: "Ed25519" },
      false,
      ["sign"],
    );
    cachedKey = key;
    cachedKeySource = secretB64;
    return key;
  }

  // PKCS8 fallback (32-byte seed only): wrap with Ed25519 OID prefix.
  // RFC 8410 PKCS8 form for Ed25519 private key:
  //   SEQUENCE { INT 0, SEQUENCE { OID 1.3.101.112 }, OCTET STRING { OCTET STRING(32) seed } }
  const PKCS8_PREFIX = new Uint8Array([
    0x30, 0x2e, 0x02, 0x01, 0x00, 0x30, 0x05, 0x06,
    0x03, 0x2b, 0x65, 0x70, 0x04, 0x22, 0x04, 0x20,
  ]);
  const pkcs8 = new Uint8Array(PKCS8_PREFIX.length + 32);
  pkcs8.set(PKCS8_PREFIX, 0);
  pkcs8.set(seed, PKCS8_PREFIX.length);
  const key = await crypto.subtle.importKey(
    "pkcs8",
    pkcs8,
    { name: "Ed25519" },
    false,
    ["sign"],
  );
  cachedKey = key;
  cachedKeySource = secretB64;
  return key;
}

export interface CDPJwtRequest {
  method: "GET" | "POST" | "PUT" | "DELETE";
  host: string;   // e.g. "api.cdp.coinbase.com"
  path: string;   // e.g. "/platform/v2/x402/verify"
}

/**
 * Generate a CDP-compliant JWT for one specific (method, host, path) call.
 * The JWT is single-use and valid for 120s. Generate per-request.
 */
export async function generateCDPJWT(
  apiKeyId: string,
  apiKeySecretB64: string,
  req: CDPJwtRequest,
): Promise<string> {
  const key = await importEd25519PrivateKey(apiKeySecretB64);
  const now = Math.floor(Date.now() / 1000);

  const header = {
    alg: "EdDSA",
    typ: "JWT",
    kid: apiKeyId,
    nonce: randomNonceHex(),
  };

  const payload = {
    sub: apiKeyId,
    iss: "cdp",
    aud: ["cdp_service"],
    nbf: now,
    exp: now + 120,
    uri: `${req.method} ${req.host}${req.path}`,
  };

  const headerB64 = base64UrlEncodeJson(header);
  const payloadB64 = base64UrlEncodeJson(payload);
  const signingInput = `${headerB64}.${payloadB64}`;

  const sigBuf = await crypto.subtle.sign(
    "Ed25519",
    key,
    new TextEncoder().encode(signingInput),
  );
  const sigB64 = base64UrlEncode(sigBuf);
  return `${signingInput}.${sigB64}`;
}

/**
 * Helper: make an authenticated CDP request and return parsed JSON.
 * Throws on non-2xx with the response body as error message.
 */
export async function cdpFetch<T = unknown>(
  apiKeyId: string,
  apiKeySecretB64: string,
  url: string,                          // full URL with scheme
  init: RequestInit = {},
): Promise<T> {
  const u = new URL(url);
  const method = (init.method || "GET").toUpperCase() as CDPJwtRequest["method"];
  const jwt = await generateCDPJWT(apiKeyId, apiKeySecretB64, {
    method,
    host: u.host,
    path: u.pathname + u.search,
  });
  const headers = new Headers(init.headers);
  headers.set("Authorization", `Bearer ${jwt}`);
  if (!headers.has("Content-Type") && init.body) {
    headers.set("Content-Type", "application/json");
  }
  const r = await fetch(url, { ...init, headers });
  if (!r.ok) {
    const text = await r.text().catch(() => "");
    throw new Error(`cdp ${r.status}: ${text}`);
  }
  return (await r.json()) as T;
}
