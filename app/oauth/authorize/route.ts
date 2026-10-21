import { appPassword, appSecret, origin } from "@/config";
import { passwordMatches, SESSION_COOKIE, verifySessionToken } from "@/auth/session";
import { clientKey, passwordThrottle, TOO_MANY } from "@/auth/throttle";
import { clientRedirects } from "@/oauth/client";
import { CODE_TTL_S } from "@/oauth/config";
import { seal } from "@/oauth/seal";

type Params = { clientId: string; redirectUri: string; challenge: string; state: string };

const html = (body: string, status = 200) =>
  new Response(
    `<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>Connect Claude</title><style>:root{color-scheme:light dark}body{font:16px system-ui;max-width:24rem;margin:3rem auto;padding:0 1rem}input,button{font:inherit;width:100%;padding:.7rem;margin:.4rem 0;box-sizing:border-box}</style>${body}</html>`,
    { status, headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" } },
  );

const escape = (value: string) =>
  value.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c] ?? c);

/** Already signed in to the app in this browser: the password is not asked twice. */
async function signedIn(request: Request): Promise<boolean> {
  const cookie = request.headers.get("cookie") ?? "";
  const match = cookie.split(/;\s*/).find((part) => part.startsWith(`${SESSION_COOKIE}=`));
  return verifySessionToken(match?.slice(SESSION_COOKIE.length + 1), appSecret());
}

/** The request is valid only for a registered client, one of its own redirect URIs, and PKCE S256. */
function read(get: (key: string) => string | null): Params | null {
  const clientId = get("client_id") ?? "";
  const uris = clientRedirects(clientId);
  const redirectUri = get("redirect_uri") ?? uris?.[0] ?? "";
  const challenge = get("code_challenge") ?? "";
  const valid =
    uris?.includes(redirectUri) &&
    get("response_type") === "code" &&
    get("code_challenge_method") === "S256" &&
    challenge.length >= 43;
  return valid ? { clientId, redirectUri, challenge, state: get("state") ?? "" } : null;
}

function form(params: Params, ask: boolean, error = "") {
  const hidden = (name: string, value: string) => `<input type="hidden" name="${name}" value="${escape(value)}">`;
  return html(
    `<h1>Connect Claude</h1><p>Claude asks to use your English tutor.${ask ? " Enter your password to allow it." : ""}</p>${error ? `<p role="alert">${escape(error)}</p>` : ""}<form method="post">${hidden("client_id", params.clientId)}${hidden("redirect_uri", params.redirectUri)}${hidden("code_challenge", params.challenge)}${hidden("state", params.state)}${hidden("response_type", "code")}${hidden("code_challenge_method", "S256")}${ask ? '<input type="password" name="password" autocomplete="current-password" placeholder="Password" autofocus required>' : ""}<button type="submit">Allow</button></form>`,
    error ? 401 : 200,
  );
}

const refuse = () => html("<h1>This link is not valid</h1><p>Start the connection again from Claude.</p>", 400);

export async function GET(request: Request) {
  const params = read((key) => new URL(request.url).searchParams.get(key));
  return params ? form(params, !(await signedIn(request))) : refuse();
}

export async function POST(request: Request) {
  const data = await request.formData();
  const field = (key: string) => (typeof data.get(key) === "string" ? (data.get(key) as string) : null);
  const params = read(field);
  if (!params) return refuse();
  const trusted = await signedIn(request);
  if (!trusted) {
    const who = clientKey(request.headers);
    if (passwordThrottle.blocked(who)) return form(params, true, TOO_MANY);
    if (!passwordMatches(field("password") ?? "", appPassword())) {
      passwordThrottle.fail(who);
      return form(params, true, "That password is not right.");
    }
    passwordThrottle.clear(who);
  }

  const code = seal({
    typ: "code",
    cid: params.clientId,
    uri: params.redirectUri,
    ch: params.challenge,
    exp: Date.now() / 1000 + CODE_TTL_S,
  });
  const target = new URL(params.redirectUri);
  target.searchParams.set("code", code);
  target.searchParams.set("iss", origin());
  if (params.state) target.searchParams.set("state", params.state);
  return new Response(null, { status: 303, headers: { Location: target.toString(), "Cache-Control": "no-store" } });
}
