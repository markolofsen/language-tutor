"use server";

import { revalidatePath } from "next/cache";

import { getExercise } from "@/practice/exercises";
import { submitAnswer } from "@/practice/attempts";
import { routes } from "@/routes";

export type AnswerState = { error: string | null };

export async function submitAnswerAction(
  exerciseId: number,
  _previous: AnswerState,
  formData: FormData,
): Promise<AnswerState> {
  const answer = formData.get("answer");
  if (typeof answer !== "string" || !answer.trim()) return { error: "Write your translation first." };
  if (!(await getExercise(exerciseId))) return { error: "This exercise no longer exists." };
  await submitAnswer(exerciseId, answer);
  revalidatePath(routes.exercise(exerciseId));
  return { error: null };
}
