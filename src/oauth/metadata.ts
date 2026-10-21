import { mcpUrl, origin } from "@/config";

const json = (body: unknown) => Response.json(body, { headers: { "Cache-Control": "public, max-age=300" } });

/** RFC 9728: tells Claude which authorization server protects /mcp. */
export const protectedResource = () =>
  json({ resource: mcpUrl(), authorization_servers: [origin()], bearer_methods_supported: ["header"] });

/** RFC 8414: where to register, authorize and fetch tokens. */
export const authorizationServer = () =>
  json({
    issuer: origin(),
    authorization_endpoint: `${origin()}/oauth/authorize`,
    token_endpoint: `${origin()}/oauth/token`,
    registration_endpoint: `${origin()}/oauth/register`,
    response_types_supported: ["code"],
    grant_types_supported: ["authorization_code", "refresh_token"],
    code_challenge_methods_supported: ["S256"],
    token_endpoint_auth_methods_supported: ["none"],
    // RFC 9207: every authorization response carries `iss`, which gets ChatGPT its stable redirect URI.
    authorization_response_iss_parameter_supported: true,
  });
