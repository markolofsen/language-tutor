/**
 * Everything a deployment configures, read from the environment when it is used (never at import, so a build
 * needs none of it). See `.env.example`. The three secrets must be set: a missing one stops the request.
 */
function required(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is not set. Add it to the environment (see .env.example).`);
  return value;
}

/** The single sign-in password of the app. */
export const appPassword = () => required("APP_PASSWORD");

/** The key that signs the session cookie and the OAuth codes. Changing it signs everyone out. */
export const appSecret = () => required("APP_SECRET");

/** The bearer token of /mcp. */
export const mcpToken = () => required("MCP_TOKEN");

/** The public origin: APP_URL, else the Vercel production domain, else localhost. */
export function origin(): string {
  const explicit = process.env.APP_URL;
  if (explicit) return explicit.replace(/\/$/, "");
  const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL;
  if (vercel) return `https://${vercel}`;
  return "http://localhost:3000";
}

export const mcpUrl = () => `${origin()}/mcp`;
