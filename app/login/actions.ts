"use server";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";

import { appPassword, appSecret } from "@/config";
import { createSessionToken, passwordMatches, SESSION_COOKIE, SESSION_MAX_AGE_S } from "@/auth/session";
import { clientKey, passwordThrottle, TOO_MANY } from "@/auth/throttle";
import { routes } from "@/routes";

export type LoginState = { error: string | null };

export async function login(_previous: LoginState, formData: FormData): Promise<LoginState> {
  const who = clientKey(await headers());
  if (passwordThrottle.blocked(who)) return { error: TOO_MANY };
  const given = formData.get("password");
  if (typeof given !== "string" || !passwordMatches(given, appPassword())) {
    passwordThrottle.fail(who);
    return { error: "That password is not right." };
  }
  passwordThrottle.clear(who);
  const jar = await cookies();
  jar.set(SESSION_COOKIE, await createSessionToken(appSecret()), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: SESSION_MAX_AGE_S,
    path: "/",
  });
  redirect(routes.today);
}
