import { z } from "zod";

const includesFold = (haystack: string, needle: string) =>
  haystack.toLowerCase().includes(needle.toLowerCase());

export const targetSchema = z
  .object({
    word: z.string().min(1).describe("The saved word in its base form."),
    form: z.string().min(1).describe("The exact string as it appears in `sentence` (inflected if needed)."),
    sentence: z.string().min(1).describe("The one sentence of the story that contains the word."),
    translation: z.string().default("").describe("Russian gloss of the word; used when the saved word has none."),
  })
  .refine((t) => includesFold(t.sentence, t.form), "form must appear in sentence");

export const storySchema = z
  .object({
    topic: z.string().min(1).describe("Three words at most: work, real estate, daily life, ..."),
    text_en: z.string().min(1).describe("The paragraph in English."),
    text_ru: z.string().min(1).describe("A natural Russian rendering of the paragraph."),
    targets: z.array(targetSchema).min(1).max(12),
  })
  .refine(
    (s) => s.targets.every((t) => includesFold(s.text_en, t.sentence)),
    "every target sentence must be copied verbatim from text_en",
  );

export type Story = z.infer<typeof storySchema>;
export type StoryTarget = z.infer<typeof targetSchema>;

/** Replaces the first occurrence of `form` in `sentence` with a blank. */
export function toCloze(sentence: string, form: string): string {
  const at = sentence.toLowerCase().indexOf(form.toLowerCase());
  if (at < 0) return sentence;
  return `${sentence.slice(0, at)}___${sentence.slice(at + form.length)}`;
}

/** The reverse of `toCloze`: puts the answer back into the blank. */
export function fillCloze(prompt: string, answer: string): string {
  return prompt.replace("___", answer);
}
