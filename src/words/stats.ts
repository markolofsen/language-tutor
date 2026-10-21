import { eq } from "drizzle-orm";

import type { Executor } from "@/db/client";
import { words } from "@/db/schema";

const KNOWN_MIN_SEEN = 4;
const KNOWN_MAX_MISS_RATE = 0.25;

/** Counts one meeting with a word and re-derives its status from the record. */
export async function touchWord(tx: Executor, wordId: number, missed: boolean): Promise<void> {
  const row = await tx.select().from(words).where(eq(words.id, wordId)).get();
  if (!row) return;
  const seen = row.seen + 1;
  const missedCount = row.missed + (missed ? 1 : 0);
  const known = !missed && seen >= KNOWN_MIN_SEEN && missedCount / seen <= KNOWN_MAX_MISS_RATE;
  await tx
    .update(words)
    .set({ seen, missed: missedCount, status: known ? "known" : "learning" })
    .where(eq(words.id, wordId))
    .run();
}
