import { and, asc, desc, eq, gte, inArray, sql } from "drizzle-orm";

import { getDb, type Executor } from "@/db/client";
import { cards, storyWords, words } from "@/db/schema";
import { toCloze } from "@/domain/story";
import { wordKey } from "@/domain/words";
import { initialSchedule } from "@/review/fsrs";

import type { ParsedWord } from "./parse-import";

export type WordRow = typeof words.$inferSelect;
export type WordStatus = WordRow["status"];

export type AddResult = {
  added: number;
  existing: number;
  translationsFilled: number;
  hooksFilled: number;
  cardsCreated: number;
  /** Words whose example does not contain the word: saved without a card. */
  exampleSkipped: string[];
};

const RETURN_AFTER_MS = 20 * 3_600_000;

/** A word just taught must not come back at once: its first review waits until tomorrow. */
function laterSchedule() {
  const now = new Date();
  return { ...initialSchedule(now), due: new Date(now.getTime() + RETURN_AFTER_MS) };
}

/**
 * A saved example sentence is what brings a word back: it becomes a cloze card.
 * Returns "created", "skipped" (the word is not in its example) or "none" (no example, or a card exists already).
 */
async function ensureWordCard(
  tx: Executor,
  word: WordRow,
  form: string | undefined,
): Promise<"created" | "skipped" | "none"> {
  if (!word.example) return "none";
  const has = await tx
    .select({ n: sql<number>`count(*)` })
    .from(cards)
    .where(and(eq(cards.wordId, word.id), eq(cards.kind, "word")))
    .get();
  if ((has?.n ?? 0) > 0) return "none";
  const blank = (form ?? word.english).trim();
  if (!word.example.toLowerCase().includes(blank.toLowerCase())) return "skipped";
  await tx
    .insert(cards)
    .values({
      kind: "word",
      prompt: toCloze(word.example, blank),
      answer: blank,
      hint: word.translation,
      wordId: word.id,
      ...laterSchedule(),
    })
    .run();
  return "created";
}

export async function addWords(items: ParsedWord[], source: WordRow["source"]): Promise<AddResult> {
  const db = await getDb();
  return db.transaction(async (tx) => {
    const result: AddResult = {
      added: 0,
      existing: 0,
      translationsFilled: 0,
      hooksFilled: 0,
      cardsCreated: 0,
      exampleSkipped: [],
    };
    for (const item of items) {
      const key = wordKey(item.english);
      if (!key) continue;
      const association = item.association?.trim() ?? "";
      const example = item.example?.trim() ?? "";
      let row = await tx.select().from(words).where(eq(words.key, key)).get();
      if (!row) {
        row = await tx
          .insert(words)
          .values({ key, english: item.english.trim(), translation: item.translation, association, example, source })
          .returning()
          .get();
        result.added += 1;
      } else {
        result.existing += 1;
        const patch: Partial<typeof words.$inferInsert> = {};
        if (item.translation && !row.translation) patch.translation = item.translation;
        if (association && !row.association) patch.association = association;
        if (example && !row.example) patch.example = example;
        if (Object.keys(patch).length > 0) {
          row = await tx.update(words).set(patch).where(eq(words.id, row.id)).returning().get();
          if (patch.translation) result.translationsFilled += 1;
          if (patch.association) result.hooksFilled += 1;
        }
      }
      const card = await ensureWordCard(tx, row, item.form);
      if (card === "created") result.cardsCreated += 1;
      if (card === "skipped") result.exampleSkipped.push(row.english);
    }
    return result;
  });
}

export async function findOrCreateWord(tx: Executor, english: string, translation = ""): Promise<WordRow> {
  const key = wordKey(english);
  const found = await tx.select().from(words).where(eq(words.key, key)).get();
  if (found) return found;
  return tx.insert(words).values({ key, english: english.trim(), translation, source: "story" }).returning().get();
}

export async function listWords(options: { status?: WordStatus; withoutHook?: boolean; limit: number }): Promise<WordRow[]> {
  const db = await getDb();
  const conditions = [
    ...(options.status ? [eq(words.status, options.status)] : []),
    ...(options.withoutHook ? [eq(words.association, "")] : []),
  ];
  return db
    .select()
    .from(words)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(options.withoutHook ? words.missed : words.id), desc(words.id))
    .limit(options.limit)
    .all();
}

/** Words to build the next story from: the ones missed most, then the least seen. */
export async function practiceWords(limit: number): Promise<WordRow[]> {
  const db = await getDb();
  return db
    .select()
    .from(words)
    .where(inArray(words.status, ["new", "learning"]))
    .orderBy(desc(words.missed), asc(words.seen), asc(words.id))
    .limit(limit)
    .all();
}

export async function wordCounts(): Promise<Record<WordStatus, number>> {
  const db = await getDb();
  const rows = await db
    .select({ status: words.status, n: sql<number>`count(*)` })
    .from(words)
    .groupBy(words.status)
    .all();
  const counts: Record<WordStatus, number> = { new: 0, learning: 0, known: 0 };
  for (const row of rows) counts[row.status] = row.n;
  return counts;
}

export async function findWordsByKeys(tx: Executor, keys: string[]): Promise<WordRow[]> {
  if (keys.length === 0) return [];
  return tx
    .select()
    .from(words)
    .where(and(inArray(words.key, keys)))
    .all();
}

export type WordUpdate = {
  english: string;
  newEnglish?: string | undefined;
  translation?: string | undefined;
  association?: string | undefined;
  example?: string | undefined;
  form?: string | undefined;
};
export type UpdateResult = {
  updated: number;
  notFound: string[];
  conflicts: string[];
  cardsCreated: number;
  exampleSkipped: string[];
};

/** Fixes a saved word: its spelling (English), Russian gloss, hook and example. A rename onto an existing word is refused, not merged. */
export async function updateWords(items: WordUpdate[]): Promise<UpdateResult> {
  const db = await getDb();
  return db.transaction(async (tx) => {
    const result: UpdateResult = { updated: 0, notFound: [], conflicts: [], cardsCreated: 0, exampleSkipped: [] };
    for (const item of items) {
      const found = await tx.select().from(words).where(eq(words.key, wordKey(item.english))).get();
      if (!found) {
        result.notFound.push(item.english);
        continue;
      }
      const patch: Partial<typeof words.$inferInsert> = {};
      if (item.translation !== undefined) patch.translation = item.translation.trim();
      if (item.association !== undefined) patch.association = item.association.trim();
      if (item.example !== undefined) patch.example = item.example.trim();
      if (item.newEnglish !== undefined && wordKey(item.newEnglish) !== found.key) {
        const key = wordKey(item.newEnglish);
        if (await tx.select().from(words).where(eq(words.key, key)).get()) {
          result.conflicts.push(`${item.english} -> ${item.newEnglish}`);
          continue;
        }
        patch.key = key;
        patch.english = item.newEnglish.trim();
      } else if (item.newEnglish !== undefined) {
        patch.english = item.newEnglish.trim();
      }
      if (Object.keys(patch).length === 0) continue;
      const row = await tx.update(words).set(patch).where(eq(words.id, found.id)).returning().get();
      result.updated += 1;
      const card = await ensureWordCard(tx, row, item.form);
      if (card === "created") result.cardsCreated += 1;
      if (card === "skipped") result.exampleSkipped.push(row.english);
    }
    return result;
  });
}

export type RemoveResult = { removed: number; notFound: string[]; inUse: string[] };

/** Removes saved words nothing refers to; a word with a story or a card is kept so no history is lost. */
export async function removeWords(list: string[]): Promise<RemoveResult> {
  const db = await getDb();
  return db.transaction(async (tx) => {
    const result: RemoveResult = { removed: 0, notFound: [], inUse: [] };
    for (const english of list) {
      const found = await tx.select().from(words).where(eq(words.key, wordKey(english))).get();
      if (!found) {
        result.notFound.push(english);
        continue;
      }
      const used =
        (await tx.select({ n: sql<number>`count(*)` }).from(storyWords).where(eq(storyWords.wordId, found.id)).get())
          ?.n ?? 0;
      const carded =
        (await tx.select({ n: sql<number>`count(*)` }).from(cards).where(eq(cards.wordId, found.id)).get())?.n ?? 0;
      if (used > 0 || carded > 0) {
        result.inUse.push(english);
        continue;
      }
      await tx.delete(words).where(eq(words.id, found.id)).run();
      result.removed += 1;
    }
    return result;
  });
}

/** Deletes chosen words for good, with their cards, review history and story links (they cascade). For the learner's own cleanup in the app; the MCP `remove_words` keeps words that have history. */
export async function deleteWordsById(ids: number[]): Promise<number> {
  if (ids.length === 0) return 0;
  const db = await getDb();
  const removed = await db.delete(words).where(inArray(words.id, ids)).returning({ id: words.id }).all();
  return removed.length;
}

/** Words saved in the last hours: the learner has just met them, so they are not tested yet. */
export async function justTaught(now: Date, hours = 12): Promise<string[]> {
  const since = new Date(now.getTime() - hours * 3_600_000);
  const db = await getDb();
  const rows = await db
    .select({ english: words.english })
    .from(words)
    .where(gte(words.addedAt, since))
    .orderBy(desc(words.id))
    .limit(20)
    .all();
  return rows.map((w) => w.english);
}
