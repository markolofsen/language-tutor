"use server";

import { saveDictation } from "@/listening/dictation";
import type { WordDiff } from "@/listening/word-diff";

const MAX_ACCENT_LENGTH = 8;

export async function checkDictationAction(accent: string, text: string, typed: string): Promise<WordDiff | null> {
  if (!typed.trim() || accent.length > MAX_ACCENT_LENGTH || !text) return null;
  return await saveDictation(accent, text, typed);
}
