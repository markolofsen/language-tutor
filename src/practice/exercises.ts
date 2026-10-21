import { asc, count, eq, isNull } from "drizzle-orm";

import { getDb, type Db } from "@/db/client";
import { attempts, exercises, storyWords, words } from "@/db/schema";

export type ExerciseRow = typeof exercises.$inferSelect;
export type ExerciseTarget = { english: string; translation: string; form: string };

const unanswered = (db: Db) =>
  db
    .select({ exercise: exercises })
    .from(exercises)
    .leftJoin(attempts, eq(attempts.exerciseId, exercises.id))
    .where(isNull(attempts.id))
    .orderBy(asc(exercises.id));

export async function nextExercise(): Promise<ExerciseRow | undefined> {
  const db = await getDb();
  return (await unanswered(db).limit(1).get())?.exercise;
}

export async function countUnanswered(): Promise<number> {
  const db = await getDb();
  const row = await db
    .select({ n: count() })
    .from(exercises)
    .leftJoin(attempts, eq(attempts.exerciseId, exercises.id))
    .where(isNull(attempts.id))
    .get();
  return row?.n ?? 0;
}

export async function getExercise(id: number): Promise<ExerciseRow | undefined> {
  const db = await getDb();
  return db.select().from(exercises).where(eq(exercises.id, id)).get();
}

/** The saved words a story was written around, shown beside the exercise as a nudge. */
export async function targetsOf(storyId: number): Promise<ExerciseTarget[]> {
  const db = await getDb();
  return db
    .select({ english: words.english, translation: words.translation, form: storyWords.form })
    .from(storyWords)
    .innerJoin(words, eq(words.id, storyWords.wordId))
    .where(eq(storyWords.storyId, storyId))
    .all();
}
