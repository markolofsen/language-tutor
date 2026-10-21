import { describe, expect, it } from "vitest";

import { allowedRedirect, clientRedirects, registerClient } from "./client";
import { challengeFor } from "./pkce";
import { open, seal } from "./seal";

describe("seal", () => {
  it("opens its own token and rejects a forged, retyped or expired one", () => {
    const token = seal({ typ: "code", exp: 1_000 });
    expect(open(token, "code", 999)).not.toBeNull();
    expect(open(token, "code", 1_001)).toBeNull();
    expect(open(token, "refresh", 999)).toBeNull();
    const [body] = token.split(".");
    expect(open(`${body}.forged`, "code", 999)).toBeNull();
    expect(open(undefined, "code")).toBeNull();
  });
});

describe("client registration", () => {
  it("accepts Claude and loopback callbacks only", () => {
    expect(allowedRedirect("https://claude.ai/api/mcp/auth_callback")).toBe(true);
    expect(allowedRedirect("http://localhost:54321/callback")).toBe(true);
    expect(allowedRedirect("https://evil.example/api/mcp/auth_callback")).toBe(false);
    expect(allowedRedirect("https://claude.ai/other")).toBe(false);
    expect(allowedRedirect("http://localhost/steal")).toBe(false);
    expect(allowedRedirect("https://chatgpt.com/connector_platform_oauth_redirect")).toBe(true);
    expect(allowedRedirect("https://chatgpt.com/connector/oauth/abc_123-x")).toBe(true);
    expect(allowedRedirect("https://chatgpt.com/other")).toBe(false);
    expect(allowedRedirect("https://chatgpt.com.evil.example/connector_platform_oauth_redirect")).toBe(false);
  });

  it("round-trips the redirect list through the client id", () => {
    const id = registerClient(["https://claude.ai/api/mcp/auth_callback"]);
    expect(id).not.toBeNull();
    expect(clientRedirects(id)).toEqual(["https://claude.ai/api/mcp/auth_callback"]);
    expect(registerClient(["https://evil.example/cb"])).toBeNull();
    expect(clientRedirects("nope")).toBeNull();
  });
});

describe("pkce", () => {
  it("matches the RFC 7636 example", () => {
    expect(challengeFor("dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk")).toBe("E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM");
  });
});
