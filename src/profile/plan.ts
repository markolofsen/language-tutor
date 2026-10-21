import { eq } from "drizzle-orm";

import { getDb } from "@/db/client";
import { settings } from "@/db/schema";
import { DEFAULT_GOAL, DEFAULT_METHOD } from "@/domain/method";

export type Plan = { goal: string; method: string };

const KEYS = { goal: DEFAULT_GOAL, method: DEFAULT_METHOD } as const;

/** The stored goal and method, or the defaults while the learner has not changed them. */
export async function getPlan(): Promise<Plan> {
  const db = await getDb();
  const read = async (key: keyof Plan) =>
    (await db.select().from(settings).where(eq(settings.key, key)).get())?.value ?? KEYS[key];
  return { goal: await read("goal"), method: await read("method") };
}

export async function setPlan(change: Partial<Plan>): Promise<Plan> {
  const db = await getDb();
  await db.transaction(async (tx) => {
    for (const key of ["goal", "method"] as const) {
      const value = change[key]?.trim();
      if (!value) continue;
      await tx.insert(settings).values({ key, value }).onConflictDoUpdate({ target: settings.key, set: { value } }).run();
    }
  });
  return getPlan();
}
