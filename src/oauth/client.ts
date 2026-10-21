import { open, seal } from "./seal";

type ClientPayload = { typ: "client"; uris: string[] };

/** Where a client may be sent back: Claude's and ChatGPT's own callbacks, or a loopback `/callback` for Claude Code and Codex. */
export function allowedRedirect(uri: string): boolean {
  let url: URL;
  try {
    url = new URL(uri);
  } catch {
    return false;
  }
  if (url.username || url.password || url.hash) return false;
  if (url.protocol === "https:" && ["claude.ai", "claude.com"].includes(url.hostname)) {
    return url.pathname === "/api/mcp/auth_callback";
  }
  if (url.protocol === "https:" && url.hostname === "chatgpt.com") {
    return url.pathname === "/connector_platform_oauth_redirect" || /^\/connector\/oauth\/[\w-]+$/.test(url.pathname);
  }
  if (url.protocol === "https:" && url.hostname === "platform.openai.com") return url.pathname === "/apps-manage/oauth";
  const loopback = url.protocol === "http:" && ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname);
  return loopback && url.pathname === "/callback";
}

/** Dynamic registration is stateless: the client id is the signed list of its redirect URIs. */
export function registerClient(uris: string[]): string | null {
  if (uris.length === 0 || uris.length > 5 || !uris.every(allowedRedirect)) return null;
  return seal({ typ: "client", uris });
}

export function clientRedirects(clientId: string | null | undefined): string[] | null {
  return open<ClientPayload>(clientId, "client")?.uris ?? null;
}
