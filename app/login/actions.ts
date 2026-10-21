"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { appPassword, appSecret } from "@/config";
import { createSessionToken, passwordMatches, SESSION_COOKIE, SESSION_MAX_AGE_S } from "@/auth/session";
import { routes } from "@/routes";

export type LoginState = { error: string | null };

export async function login(_previous: LoginState, formData: FormData): Promise<LoginState> {
  const given = formData.get("password");
  if (typeof given !== "string" || !passwordMatches(given, appPassword())) {
    return { error: "That password is not right." };
  }
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
