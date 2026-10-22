import { z } from "zod";

import { addWords, type AddResult } from "@/words/store";

export const saveSchema = z.object({
  source: z.string().min(1).max(2000),
  translation: z.string().min(1).max(2000),
  detected: z.enum(["native", "target", "other"]),
  words: z.array(z.object({ word: z.string().min(1), translation: z.string(), association: z.string() })).max(10),
  /** Also keep the whole text as one entry (for a short phrase). */
  phrase: z.boolean().default(false),
});

export type SaveInput = z.infer<typeof saveSchema>;

const MAX_EXAMPLE = 240;

/**
 * Puts a translation into the dictionary: the chosen words, each with its hook and the target-language sentence it
 * came from (that sentence becomes its review card), and optionally the whole text as one phrase.
 */
export async function saveTranslation(input: SaveInput): Promise<AddResult> {
  const targetText = input.detected === "native" ? input.translation : input.source;
  const nativeText = input.detected === "native" ? input.source : input.translation;
  const example = targetText.length <= MAX_EXAMPLE ? targetText : "";
  const items = input.words.map((w) => ({
    english: w.word,
    translation: w.translation,
    association: w.association,
    example: example.toLowerCase().includes(w.word.toLowerCase()) ? example : "",
  }));
  if (input.phrase) items.push({ english: targetText, translation: nativeText, association: "", example: "" });
  return addWords(items, "translator");
}
