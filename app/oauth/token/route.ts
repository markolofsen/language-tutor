import { ACCESS_TTL_S, REFRESH_TTL_S } from "@/oauth/config";
import { clientRedirects } from "@/oauth/client";
import { challengeFor } from "@/oauth/pkce";
import { open, seal } from "@/oauth/seal";
import { mcpToken } from "@/config";

type Code = { typ: "code"; cid: string; uri: string; ch: string; exp: number };
type Refresh = { typ: "refresh"; cid: string; exp: number };

const noStore = { "Cache-Control": "no-store" };
const fail = (error: string, description: string) =>
  Response.json({ error, error_description: description }, { status: 400, headers: noStore });

function issue(clientId: string) {
  const refresh = seal({ typ: "refresh", cid: clientId, exp: Date.now() / 1000 + REFRESH_TTL_S });
  // The access token is the same bearer /mcp already accepts as a header.
  return Response.json(
    { access_token: mcpToken(), token_type: "Bearer", expires_in: ACCESS_TTL_S, refresh_token: refresh },
    { headers: noStore },
  );
}

export async function POST(request: Request) {
  const type = request.headers.get("content-type") ?? "";
  const raw: Record<string, unknown> = type.includes("json")
    ? ((await request.json().catch(() => ({}))) as Record<string, unknown>)
    : Object.fromEntries((await request.formData()).entries());
  const get = (key: string) => (typeof raw[key] === "string" ? (raw[key] as string) : "");

  if (get("grant_type") === "authorization_code") {
    const code = open<Code>(get("code"), "code");
    if (!code || code.cid !== get("client_id")) return fail("invalid_grant", "The code is not valid or has expired.");
    if (code.uri !== get("redirect_uri") && get("redirect_uri")) return fail("invalid_grant", "redirect_uri does not match.");
    if (challengeFor(get("code_verifier")) !== code.ch) return fail("invalid_grant", "PKCE verification failed.");
    return issue(code.cid);
  }

  if (get("grant_type") === "refresh_token") {
    const refresh = open<Refresh>(get("refresh_token"), "refresh");
    if (!refresh || !clientRedirects(refresh.cid)) return fail("invalid_grant", "The refresh token is not valid.");
    return issue(refresh.cid);
  }

  return fail("unsupported_grant_type", "Use authorization_code or refresh_token.");
}
