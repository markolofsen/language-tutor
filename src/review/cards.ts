import { and, asc, count, eq, lte } from "drizzle-orm";

import { getDb } from "@/db/client";
import { cards, reviews, words } from "@/db/schema";
import { touchWord } from "@/words/stats";

import { nextSchedule, type CardRow } from "./fsrs";

export type { CardRow };

export type DueCard = CardRow & { association: string };

// A word card shows the word's current gloss, so fixing the gloss fixes every card: no stale copy of it.

/** Due cards with the memory hook of their word, shown after the answer. */
export async function dueCards(limit: number, now: Date): Promise<DueCard[]> {
  const db = await getDb();
  const rows = await db
    .select({ card: cards, association: words.association, gloss: words.translation })
    .from(cards)
    .leftJoin(words, eq(cards.wordId, words.id))
    .where(and(eq(cards.suspended, false), lte(cards.due, now)))
    .orderBy(asc(cards.due))
    .limit(limit)
    .all();
  return rows.map((row) => ({
    ...row.card,
    hint: row.card.kind === "word" && row.gloss ? row.gloss : row.card.hint,
    association: row.association ?? "",
  }));
}

export async function countDue(now: Date): Promise<number> {
  const db = await getDb();
  const row = await db
    .select({ n: count() })
    .from(cards)
    .where(and(eq(cards.suspended, false), lte(cards.due, now)))
    .get();
  return row?.n ?? 0;
}

export type GradeResult = { cardId: number; nextDue: Date };

export async function gradeCard(cardId: number, missed: boolean, now: Date): Promise<GradeResult | undefined> {
  const db = await getDb();
  return db.transaction(async (tx) => {
    const row = await tx.select().from(cards).where(eq(cards.id, cardId)).get();
    if (!row) return undefined;
    const next = nextSchedule(row, missed, now);
    await tx.update(cards).set(next).where(eq(cards.id, cardId)).run();
    await tx.insert(reviews).values({ cardId, missed, reviewedAt: now }).run();
    if (row.wordId !== null) await touchWord(tx, row.wordId, missed);
    return { cardId, nextDue: next.due };
  });
}
