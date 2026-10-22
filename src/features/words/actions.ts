"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { routes } from "@/routes";
import { deleteWordsById } from "@/words/store";

const idsSchema = z.array(z.number().int().positive()).min(1).max(500);

export async function deleteWordsAction(ids: unknown): Promise<{ removed: number } | { error: string }> {
  const parsed = idsSchema.safeParse(ids);
  if (!parsed.success) return { error: "Nothing selected." };
  const removed = await deleteWordsById(parsed.data);
  for (const path of [routes.words, routes.today, routes.review, routes.practice]) revalidatePath(path);
  return { removed };
}
