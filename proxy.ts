import { NextResponse, type NextRequest } from "next/server";

import { appSecret } from "@/config";
import { SESSION_COOKIE, verifySessionToken } from "@/auth/session";
import { routes } from "@/routes";

export async function proxy(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  if (await verifySessionToken(token, appSecret())) return NextResponse.next();
  return NextResponse.redirect(new URL(routes.login, request.url));
}

// /mcp carries its own bearer token, /oauth and /.well-known are the OAuth flow Claude uses to get it; the login page and static metadata stay public.
export const config = {
  matcher: ["/((?!_next/static|_next/image|login|mcp|oauth|\\.well-known|icon|apple-icon|manifest.webmanifest|favicon.ico).*)"],
};
