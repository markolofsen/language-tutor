import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";

import { authorizeMcp } from "@/mcp/auth";
import { createMcpServer } from "@/mcp/server";

export const dynamic = "force-dynamic";

async function handle(request: Request): Promise<Response> {
  const refusal = authorizeMcp(request);
  if (refusal) return refusal;
  const server = createMcpServer();
  const transport = new WebStandardStreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
    enableJsonResponse: true,
  });
  await server.connect(transport);
  return transport.handleRequest(request);
}

export { handle as DELETE, handle as GET, handle as POST };
