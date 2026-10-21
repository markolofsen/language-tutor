"use client";

import { Button, Textarea } from "@/ui";
import { useActionState } from "react";

import { submitAnswerAction, type AnswerState } from "./actions";

const INITIAL: AnswerState = { error: null };

export function AnswerForm({ exerciseId, language }: { exerciseId: number; language: string }) {
  const [state, action, pending] = useActionState(submitAnswerAction.bind(null, exerciseId), INITIAL);
  const error = state.error ? (
    <p role="alert" className="text-sm text-error">
      {state.error}
    </p>
  ) : null;

  return (
    <form action={action} className="flex flex-col gap-3">
      <label htmlFor="answer" className="text-sm font-medium">
        Your translation into {language}
      </label>
      <Textarea
        id="answer"
        name="answer"
        rows={7}
        autoCapitalize="sentences"
        spellCheck={false}
        required
        className="text-base"
      />
      {error}
      <Button type="submit" size="lg" loading={pending}>
        Send
      </Button>
    </form>
  );
}
