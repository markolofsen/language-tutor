import { eq } from "drizzle-orm";

import { getDb } from "@/db/client";
import { cards, exercises, stories, storyWords, words } from "@/db/schema";
import { toCloze, type Story } from "@/domain/story";
import { wordKey } from "@/domain/words";
import { initialSchedule } from "@/review/fsrs";
import { findOrCreateWord } from "@/words/store";

export type CreatedStory = {
  storyId: number;
  exerciseIds: number[];
  cardsCreated: number;
  newWords: number;
};

/** One story becomes its target cards and both translation directions in one commit. */
export async function createStory(story: Story, now = new Date()): Promise<CreatedStory> {
  const db = await getDb();
  return db.transaction(async (tx) => {
    const created = await tx
      .insert(stories)
      .values({ topic: story.topic, textEn: story.text_en, textRu: story.text_ru })
      .returning()
      .get();
    let newWords = 0;

    for (const target of story.targets) {
      const before = await tx.select().from(words).where(eq(words.key, wordKey(target.word))).get();
      const word = await findOrCreateWord(tx, target.word, target.translation);
      const gloss = word.translation || target.translation;
      if (!word.translation && gloss) await tx.update(words).set({ translation: gloss }).where(eq(words.id, word.id)).run();
      if (!before) newWords += 1;
      await tx
        .insert(storyWords)
        .values({ storyId: created.id, wordId: word.id, form: target.form, sentence: target.sentence })
        .run();
      await tx
        .insert(cards)
        .values({
          kind: "word",
          prompt: toCloze(target.sentence, target.form),
          answer: target.form,
          hint: gloss,
          wordId: word.id,
          ...initialSchedule(now),
        })
        .run();
      if (word.status === "new") await tx.update(words).set({ status: "learning" }).where(eq(words.id, word.id)).run();
    }

    const exerciseIds = [
      (await tx
        .insert(exercises)
        .values({ storyId: created.id, direction: "ru_en", sourceText: story.text_ru, referenceText: story.text_en })
        .returning({ id: exercises.id })
        .get()).id,
      (await tx
        .insert(exercises)
        .values({ storyId: created.id, direction: "en_ru", sourceText: story.text_en, referenceText: story.text_ru })
        .returning({ id: exercises.id })
        .get()).id,
    ];

    return { storyId: created.id, exerciseIds, cardsCreated: story.targets.length, newWords };
  });
}
