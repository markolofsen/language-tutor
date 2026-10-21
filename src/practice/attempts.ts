import { and, asc, count, desc, eq } from "drizzle-orm";

import { getDb } from "@/db/client";
import { attempts, errors, exercises } from "@/db/schema";

import { targetsOf, type ExerciseTarget } from "./exercises";

export type AttemptRow = typeof attempts.$inferSelect;
export type ErrorRow = typeof errors.$inferSelect;

export async function submitAnswer(exerciseId: number, answerText: string): Promise<AttemptRow> {
  const db = await getDb();
  return db.insert(attempts).values({ exerciseId, answerText: answerText.trim() }).returning().get();
}

export type AttemptView = { attempt: AttemptRow; errors: ErrorRow[] };

export async function latestAttempt(exerciseId: number): Promise<AttemptView | undefined> {
  const db = await getDb();
  const attempt = await db
    .select()
    .from(attempts)
    .where(eq(attempts.exerciseId, exerciseId))
    .orderBy(desc(attempts.id))
    .limit(1)
    .get();
  if (!attempt) return undefined;
  return { attempt, errors: await db.select().from(errors).where(eq(errors.attemptId, attempt.id)).all() };
}

export type PendingAttempt = {
  attemptId: number;
  exerciseId: number;
  direction: "ru_en" | "en_ru";
  sourceText: string;
  referenceText: string;
  answerText: string;
  targets: ExerciseTarget[];
};

export async function listPending(limit: number): Promise<PendingAttempt[]> {
  const db = await getDb();
  const rows = await db
    .select({ attempt: attempts, exercise: exercises })
    .from(attempts)
    .innerJoin(exercises, eq(exercises.id, attempts.exerciseId))
    .where(eq(attempts.status, "pending"))
    .orderBy(asc(attempts.id))
    .limit(limit)
    .all();
  return Promise.all(
    rows.map(async ({ attempt, exercise }) => ({
    attemptId: attempt.id,
    exerciseId: exercise.id,
    direction: exercise.direction,
    sourceText: exercise.sourceText,
    referenceText: exercise.referenceText,
    answerText: attempt.answerText,
    targets: await targetsOf(exercise.storyId),
  })),
  );
}

export async function countPending(): Promise<number> {
  const db = await getDb();
  const row = await db.select({ n: count() }).from(attempts).where(and(eq(attempts.status, "pending"))).get();
  return row?.n ?? 0;
}

/** Scores of the most recent evaluated attempts, newest first. */
export async function recentScores(limit: number): Promise<number[]> {
  const db = await getDb();
  const rows = await db
    .select({ score: attempts.score })
    .from(attempts)
    .where(eq(attempts.status, "evaluated"))
    .orderBy(desc(attempts.id))
    .limit(limit)
    .all();
  return rows.flatMap((r) => (r.score === null ? [] : [r.score]));
}
