import { createHmac, timingSafeEqual } from "node:crypto";

import { appSecret } from "@/config";

/** Stateless signed tokens: a client id, an authorization code and a refresh token carry their own proof, so nothing is stored. */

type Payload = { typ: string; exp?: number } & Record<string, unknown>;

const mac = (body: string) => createHmac("sha256", appSecret()).update(body).digest("base64url");

export function seal(payload: Payload): string {
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${body}.${mac(body)}`;
}

/** The payload when the signature, the type and the expiry hold; otherwise null. */
export function open<T extends Payload>(token: string | null | undefined, typ: T["typ"], nowS = Date.now() / 1000): T | null {
  if (!token) return null;
  const [body, signature] = token.split(".");
  if (!body || !signature) return null;
  const expected = Buffer.from(mac(body));
  const given = Buffer.from(signature);
  if (given.length !== expected.length || !timingSafeEqual(given, expected)) return null;
  try {
    const payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as T;
    if (payload.typ !== typ) return null;
    if (typeof payload.exp === "number" && payload.exp < nowS) return null;
    return payload;
  } catch {
    return null;
  }
}
