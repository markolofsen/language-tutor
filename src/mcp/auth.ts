import "server-only";

import { timingSafeEqual } from "node:crypto";

import { mcpToken, mcpUrl } from "@/config";


const bytes = (value: string) => Buffer.from(value, "utf8");

function matches(given: string, expected: string): boolean {
  const a = bytes(given);
  const b = bytes(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

/** Returns a refusal, or null when the bearer token is right. */
export function authorizeMcp(request: Request): Response | null {
  const header = request.headers.get("authorization") ?? "";
  const given = header.startsWith("Bearer ") ? header.slice("Bearer ".length) : "";
  if (matches(given, mcpToken())) return null;
  // The challenge sends an OAuth client to the metadata that explains how to sign in.
  return new Response("Unauthorized", {
    status: 401,
    headers: { "WWW-Authenticate": `Bearer resource_metadata="${mcpUrl().replace("/mcp", "")}/.well-known/oauth-protected-resource/mcp"` },
  });
}
