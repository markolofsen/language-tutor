import { eq } from "drizzle-orm";

import { getDb } from "@/db/client";
import { attempts, cards, errors, patternHolds } from "@/db/schema";
import type { Evaluation } from "@/domain/evaluation";
import { patternKey } from "@/domain/pattern";
import { wordKey } from "@/domain/words";
import { initialSchedule } from "@/review/fsrs";
import { findWordsByKeys } from "@/words/store";
import { touchWord } from "@/words/stats";

export type EvaluationTarget =
  | { kind: "pending"; attemptId: number }
  | { kind: "spoken"; exerciseId: number; answerText: string };

export type Recorded = { attemptId: number; errorsRecorded: number; cardsCreated: number };

export class EvaluationRejected extends Error {}

/** Commits the judgement, its errors, their drill cards and the word statistics together. */
export async function recordEvaluation(target: EvaluationTarget, evaluation: Evaluation, now = new Date()): Promise<Recorded> {
  const db = await getDb();
  return db.transaction(async (tx) => {
    let attemptId: number;
    if (target.kind === "pending") {
      const row = await tx.select().from(attempts).where(eq(attempts.id, target.attemptId)).get();
      if (!row) throw new EvaluationRejected(`attempt ${target.attemptId} does not exist`);
      if (row.status === "evaluated") throw new EvaluationRejected(`attempt ${target.attemptId} is already evaluated`);
      attemptId = row.id;
    } else {
      attemptId = (await tx
        .insert(attempts)
        .values({ exerciseId: target.exerciseId, answerText: target.answerText.trim() })
        .returning({ id: attempts.id })
        .get()).id;
    }

    await tx
      .update(attempts)
      .set({
        status: "evaluated",
        score: evaluation.score,
        summary: evaluation.summary,
        betterVersion: evaluation.better_version,
        evaluatedAt: now,
      })
      .where(eq(attempts.id, attemptId))
      .run();

    for (const item of evaluation.errors) {
      const saved = await tx
        .insert(errors)
        .values({
          attemptId,
          category: item.category,
          span: item.span,
          fix: item.fix,
          note: item.note,
          pattern: item.pattern ? patternKey(item.pattern) : null,
          drillSentence: item.drill_sentence,
          drillAnswer: item.drill_answer,
          createdAt: now,
        })
        .returning({ id: errors.id })
        .get();
      await tx
        .insert(cards)
        .values({
          kind: "error",
          prompt: item.drill_sentence,
          answer: item.drill_answer,
          hint: item.note,
          errorId: saved.id,
          ...initialSchedule(now),
        })
        .run();
    }

    for (const rule of new Set(evaluation.patterns_held.map(patternKey))) {
      if (rule) await tx.insert(patternHolds).values({ rule, attemptId, createdAt: now }).run();
    }

    const used = await findWordsByKeys(tx, evaluation.words_used.map(wordKey));
    const missed = await findWordsByKeys(tx, evaluation.words_missed.map(wordKey));
    for (const word of used) await touchWord(tx, word.id, false);
    for (const word of missed) await touchWord(tx, word.id, true);

    return { attemptId, errorsRecorded: evaluation.errors.length, cardsCreated: evaluation.errors.length };
  });
}
