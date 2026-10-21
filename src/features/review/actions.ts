"use server";

import { gradeCard } from "@/review/cards";

export async function gradeCardAction(cardId: number, missed: boolean): Promise<{ ok: boolean }> {
  return { ok: (await gradeCard(cardId, missed, new Date())) !== undefined };
}
