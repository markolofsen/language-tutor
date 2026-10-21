"use client";

import { Button, Input } from "@/ui";
import { useActionState } from "react";

import { login, type LoginState } from "./actions";

const INITIAL: LoginState = { error: null };

export function LoginForm() {
  const [state, action, pending] = useActionState(login, INITIAL);
  const error = state.error ? (
    <p role="alert" className="text-sm text-error">
      {state.error}
    </p>
  ) : null;

  return (
    <form action={action} className="flex flex-col gap-3">
      <label htmlFor="password" className="text-sm font-medium">
        Password
      </label>
      <Input id="password" name="password" type="password" autoComplete="current-password" autoFocus required />
      {error}
      <Button type="submit" loading={pending}>
        Sign in
      </Button>
    </form>
  );
}
