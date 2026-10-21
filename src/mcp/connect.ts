import "server-only";

import { mcpToken, mcpUrl } from "@/config";

const CONNECTOR_NAME = "English";

/** What the learner needs to add this server to Claude as a custom connector. */
export function connectInfo() {
  const MCP_URL = mcpUrl();
  const MCP_TOKEN = mcpToken();
  const query = new URLSearchParams({
    modal: "add-custom-connector",
    connectorName: CONNECTOR_NAME,
    connectorUrl: MCP_URL,
  });
  return {
    url: MCP_URL,
    // The link only prefills name and URL; the header is pasted by hand.
    installLink: `https://claude.ai/customize/connectors?${query.toString()}`,
    header: `Authorization: Bearer ${MCP_TOKEN}`,
    claudeCodeCommand: `claude mcp add --transport http english ${MCP_URL} --header "Authorization: Bearer ${MCP_TOKEN}"`,
    chatgptLink: "https://chatgpt.com/plugins",
    chatgptName: CONNECTOR_NAME,
    // Codex signs in through our OAuth (loopback callback); no token is pasted.
    codexCommand: `codex mcp add english --url ${MCP_URL} && codex mcp login english`,
  };
}
