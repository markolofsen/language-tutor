import { desc, sql } from "drizzle-orm";

import { getDb } from "@/db/client";
import { dictations, storyWords } from "@/db/schema";
import { wordKey } from "@/domain/words";
import { findWordsByKeys } from "@/words/store";
import { touchWord } from "@/words/stats";

import { diffWords, type WordDiff } from "./word-diff";

/** A random story sentence to dictate, or undefined before any story exists. */
export async function pickClip(): Promise<string | undefined> {
  const db = await getDb();
  const row = await db
    .select({ sentence: storyWords.sentence })
    .from(storyWords)
    .orderBy(sql`random()`)
    .limit(1)
    .get();
  return row?.sentence;
}

export async function saveDictation(accent: string, text: string, typed: string): Promise<WordDiff> {
  const diff = diffWords(text, typed);
  const db = await getDb();
  await db.transaction(async (tx) => {
    await tx
      .insert(dictations)
      .values({ accent, text, typed, okWords: diff.ok, missedWords: diff.missed })
      .run();
    for (const word of await findWordsByKeys(tx, diff.missed.map(wordKey))) await touchWord(tx, word.id, true);
  });
  return diff;
}

export type AccentSummary = { accent: string; clips: number; heardShare: number };

/** Listening record per accent over the latest dictations. */
export async function accentSummaries(limit = 100): Promise<AccentSummary[]> {
  const db = await getDb();
  const rows = await db.select().from(dictations).orderBy(desc(dictations.id)).limit(limit).all();
  const byAccent = new Map<string, { clips: number; ok: number; total: number }>();
  for (const row of rows) {
    const entry = byAccent.get(row.accent) ?? { clips: 0, ok: 0, total: 0 };
    entry.clips += 1;
    entry.ok += row.okWords;
    entry.total += row.okWords + row.missedWords.length;
    byAccent.set(row.accent, entry);
  }
  return [...byAccent.entries()]
    .map(([accent, e]) => ({ accent, clips: e.clips, heardShare: e.total === 0 ? 1 : e.ok / e.total }))
    .sort((a, b) => a.heardShare - b.heardShare);
}
