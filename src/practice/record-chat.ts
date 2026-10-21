import { eq } from "drizzle-orm";

import { getDb } from "@/db/client";
import { exercises, stories } from "@/db/schema";
import type { Evaluation } from "@/domain/evaluation";

import { recordEvaluation, type Recorded } from "./record-evaluation";

export type ChatSentence = {
  direction: "ru_en" | "en_ru";
  sourceText: string;
  referenceText: string;
  answerText: string;
};

/** A sentence translated in conversation joins the same record as an app exercise: its errors become drill cards. */
export async function recordChatSentence(sentence: ChatSentence, evaluation: Evaluation): Promise<Recorded> {
  const db = await getDb();
  const english = sentence.direction === "ru_en" ? sentence.referenceText : sentence.sourceText;
  const russian = sentence.direction === "ru_en" ? sentence.sourceText : sentence.referenceText;
  const story = await db.insert(stories).values({ topic: "chat", textEn: english, textRu: russian }).returning().get();
  const exercise = await db
    .insert(exercises)
    .values({
      storyId: story.id,
      direction: sentence.direction,
      sourceText: sentence.sourceText,
      referenceText: sentence.referenceText,
    })
    .returning()
    .get();
  try {
    return await recordEvaluation({ kind: "spoken", exerciseId: exercise.id, answerText: sentence.answerText }, evaluation);
  } catch (error) {
    await db.delete(stories).where(eq(stories.id, story.id)).run();
    throw error;
  }
}
