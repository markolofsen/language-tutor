import { z } from "zod";

import { CATEGORY_HINTS, ERROR_CATEGORIES } from "./categories";

const categoryDoc = ERROR_CATEGORIES.map((c) => `${c} (${CATEGORY_HINTS[c]})`).join("; ");

export const errorSchema = z.object({
  category: z.enum(ERROR_CATEGORIES).describe(`One of: ${categoryDoc}.`),
  span: z.string().min(1).describe("The learner's wrong fragment, verbatim."),
  fix: z.string().min(1).describe("The corrected fragment."),
  note: z.string().min(1).describe("One sentence in Russian: the rule, not a lecture."),
  pattern: z
    .string()
    .min(3)
    .max(60)
    .optional()
    .describe("The habit behind the slip, a short stable rule in English. Reuse a rule from `patterns` in get_learner_context when it fits."),
  drill_sentence: z
    .string()
    .refine((s) => s.includes("___"), "must contain ___")
    .describe("A NEW short English sentence testing the same rule, with ___ where the answer goes."),
  drill_answer: z.string().min(1).describe("What fills ___ in drill_sentence."),
});

export const evaluationSchema = z.object({
  score: z.number().int().min(0).max(5).describe("5 flawless, 4 minor slips, 3 meaning clear with errors, 0-2 meaning damaged."),
  summary: z.string().min(1).describe("One sentence in Russian: what went well and the main thing to fix."),
  errors: z.array(errorSchema).max(6).describe("At most 6; the most instructive first."),
  better_version: z.string().min(1).describe("The most natural English rendering."),
  patterns_held: z
    .array(z.string())
    .default([])
    .describe("Rules from `patterns` that this sentence needed and the learner got right."),
  words_used: z.array(z.string()).describe("Target words the learner used correctly."),
  words_missed: z.array(z.string()).describe("Target words the learner misused or avoided."),
});

export type Evaluation = z.infer<typeof evaluationSchema>;
export type EvaluationError = z.infer<typeof errorSchema>;
