export const SESSION_COOKIE = "english_session";
export const SESSION_MAX_AGE_S = 60 * 60 * 24 * 30;

const encoder = new TextEncoder();

async function sign(secret: string, message: string): Promise<string> {
  const key = await crypto.subtle.importKey("raw", encoder.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, [
    "sign",
  ]);
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(message));
  return [...new Uint8Array(signature)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

function sameText(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export async function createSessionToken(secret: string, now = Date.now()): Promise<string> {
  const expires = String(now + SESSION_MAX_AGE_S * 1000);
  return `${expires}.${await sign(secret, expires)}`;
}

export async function verifySessionToken(token: string | undefined, secret: string, now = Date.now()): Promise<boolean> {
  if (!token) return false;
  const [expires, signature] = token.split(".");
  if (!expires || !signature || Number(expires) < now) return false;
  return sameText(signature, await sign(secret, expires));
}

export function passwordMatches(given: string, expected: string): boolean {
  return sameText(given, expected);
}
