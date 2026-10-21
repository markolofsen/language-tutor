import { describe, expect, it } from "vitest";

import { POST as authorize } from "../../app/oauth/authorize/route";
import { POST as register } from "../../app/oauth/register/route";
import { POST as token } from "../../app/oauth/token/route";
import { createSessionToken, SESSION_COOKIE } from "@/auth/session";

import { challengeFor } from "./pkce";

const APP_PASSWORD = process.env.APP_PASSWORD ?? "";
const APP_SECRET = process.env.APP_SECRET ?? "";
const MCP_TOKEN = process.env.MCP_TOKEN ?? "";

const CALLBACK = "https://claude.ai/api/mcp/auth_callback";
const VERIFIER = "v".repeat(64);

const json = (url: string, body: unknown) =>
  new Request(url, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
const formPost = (url: string, fields: Record<string, string>) =>
  new Request(url, { method: "POST", body: new URLSearchParams(fields) });

async function signIn(password: string) {
  const reg = await register(json("https://x/oauth/register", { redirect_uris: [CALLBACK], client_name: "Claude" }));
  const clientId = ((await reg.json()) as { client_id: string }).client_id;
  const res = await authorize(
    formPost("https://x/oauth/authorize", {
      client_id: clientId,
      redirect_uri: CALLBACK,
      response_type: "code",
      code_challenge: challengeFor(VERIFIER),
      code_challenge_method: "S256",
      state: "s1",
      password,
    }),
  );
  return { clientId, res };
}

describe("OAuth flow", () => {
  it("skips the password when the app session cookie is valid", async () => {
    const reg = await register(json("https://x/oauth/register", { redirect_uris: [CALLBACK] }));
    const clientId = ((await reg.json()) as { client_id: string }).client_id;
    const request = new Request("https://x/oauth/authorize", {
      method: "POST",
      headers: { cookie: `${SESSION_COOKIE}=${await createSessionToken(APP_SECRET)}` },
      body: new URLSearchParams({
        client_id: clientId,
        redirect_uri: CALLBACK,
        response_type: "code",
        code_challenge: challengeFor(VERIFIER),
        code_challenge_method: "S256",
      }),
    });
    expect((await authorize(request)).status).toBe(303);
  });

  it("registers, signs in with the password, and exchanges the code for the MCP bearer", async () => {
    const { clientId, res } = await signIn(APP_PASSWORD);
    expect(res.status).toBe(303);
    const target = new URL(res.headers.get("location") ?? "");
    expect(`${target.origin}${target.pathname}`).toBe(CALLBACK);
    expect(target.searchParams.get("state")).toBe("s1");
    expect(target.searchParams.get("iss")).toBe("https://tutor.example");

    const exchange = await token(
      formPost("https://x/oauth/token", {
        grant_type: "authorization_code",
        code: target.searchParams.get("code") ?? "",
        client_id: clientId,
        redirect_uri: CALLBACK,
        code_verifier: VERIFIER,
      }),
    );
    const issued = (await exchange.json()) as { access_token: string; refresh_token: string };
    expect(issued.access_token).toBe(MCP_TOKEN);

    const refreshed = await token(formPost("https://x/oauth/token", { grant_type: "refresh_token", refresh_token: issued.refresh_token }));
    expect(((await refreshed.json()) as { access_token: string }).access_token).toBe(MCP_TOKEN);
  });

  it("refuses a wrong password, a wrong verifier and a foreign redirect", async () => {
    expect((await signIn("wrong")).res.status).toBe(401);

    const { clientId, res } = await signIn(APP_PASSWORD);
    const code = new URL(res.headers.get("location") ?? "").searchParams.get("code") ?? "";
    const wrong = await token(
      formPost("https://x/oauth/token", {
        grant_type: "authorization_code",
        code,
        client_id: clientId,
        redirect_uri: CALLBACK,
        code_verifier: "x".repeat(64),
      }),
    );
    expect(wrong.status).toBe(400);

    const foreign = await register(json("https://x/oauth/register", { redirect_uris: ["https://evil.example/cb"] }));
    expect(foreign.status).toBe(400);
  });
});
