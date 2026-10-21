import { registerClient } from "@/oauth/client";

const bad = (description: string) => Response.json({ error: "invalid_client_metadata", error_description: description }, { status: 400 });

/** RFC 7591 dynamic registration for public clients; nothing is stored. */
export async function POST(request: Request) {
  const body: unknown = await request.json().catch(() => null);
  const uris = (body as { redirect_uris?: unknown } | null)?.redirect_uris;
  if (!Array.isArray(uris) || !uris.every((u) => typeof u === "string")) return bad("redirect_uris is required");
  const clientId = registerClient(uris);
  if (!clientId) return bad("redirect_uris must be Claude callbacks");
  const name = (body as { client_name?: unknown }).client_name;
  return Response.json(
    {
      client_id: clientId,
      client_name: typeof name === "string" ? name : "Claude",
      redirect_uris: uris,
      grant_types: ["authorization_code", "refresh_token"],
      response_types: ["code"],
      token_endpoint_auth_method: "none",
    },
    { status: 201, headers: { "Cache-Control": "no-store" } },
  );
}
