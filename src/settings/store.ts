import { eq } from "drizzle-orm";

import { getDb } from "@/db/client";
import { settings } from "@/db/schema";

export async function getSetting(key: string): Promise<string | undefined> {
  const db = await getDb();
  return (await db.select().from(settings).where(eq(settings.key, key)).get())?.value;
}

/** An empty value removes the setting, so the default or the environment applies again. */
export async function setSetting(key: string, value: string): Promise<void> {
  const db = await getDb();
  const trimmed = value.trim();
  if (!trimmed) {
    await db.delete(settings).where(eq(settings.key, key)).run();
    return;
  }
  await db.insert(settings).values({ key, value: trimmed }).onConflictDoUpdate({ target: settings.key, set: { value: trimmed } }).run();
}
