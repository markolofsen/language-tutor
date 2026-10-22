import { z } from "zod";

import { LANGUAGES, type LanguageCode } from "@/domain/languages";

import { proxyAwareFetch } from "./proxy-fetch";

const MAX_TEXT = 2000;
const TIMEOUT_MS = 25_000;

export const wordSchema = z.object({
  word: z.string().describe("The word or phrase in the target language, base form."),
  translation: z.string().describe("A short gloss in the native language."),
  association: z.string().describe("A memory hook in one short line, or an empty string."),
});

export const resultSchema = z.object({
  detected: z.enum(["native", "target", "other"]).describe("Which language the input is in."),
  translation: z.string(),
  alternatives: z
    .array(z.object({ text: z.string(), note: z.string() }))
    .max(2)
    .describe("Other natural phrasings in a different register; empty when the translation is plain."),
  words: z.array(wordSchema).max(5).describe("Words of the target-language side worth learning."),
  note: z.string().describe("One short line about an idiom, a trap or formality; empty otherwise."),
});

export type TranslationResult = z.infer<typeof resultSchema>;

export class TranslateError extends Error {
  constructor(
    readonly code: "no_key" | "empty" | "too_long" | "upstream" | "bad_output",
    message: string,
  ) {
    super(message);
  }
}

export type TranslateInput = {
  text: string;
  native: LanguageCode;
  target: LanguageCode;
  model: string;
  apiKey: string | undefined;
  signal?: AbortSignal;
  fetcher?: typeof fetch;
};

export function systemPrompt(native: LanguageCode, target: LanguageCode): string {
  const n = LANGUAGES[native];
  const t = LANGUAGES[target];
  return [
    `You are the translation engine of a language-learning app. The learner's native language is ${n}; the language being learned is ${t}.`,
    `The input is in ${n} or in ${t}. Detect which (detected: native or target; other if it is neither) and translate it into the other one; for other, translate into ${t}.`,
    "Translate the meaning, not the words: natural, in the same register, keeping names, numbers and line breaks. Output only the translation in `translation`, never an explanation.",
    `alternatives: at most two other natural phrasings that differ in register or nuance (note: at most four words in ${n}); an empty list when the translation is plain.`,
    `words: up to five words or fixed phrases from the ${t} side that a B1 learner may not know (skip basic words), each in its base form, idioms and phrasal verbs as one entry; translation is a short ${n} gloss in the sense used here; association is a one-line memory hook in simple ${t} (a known word it builds on, a contrast with a near word, or an image), empty if none is natural. An empty list for a very simple text.`,
    `note: one short line in ${n} only for an idiom, a false friend or a formality trap; otherwise an empty string.`,
  ].join("\n");
}

/** The json_schema OpenRouter enforces (strict) so the answer always parses. */
export function responseFormat() {
  const { $schema: _unused, ...schema } = z.toJSONSchema(resultSchema) as Record<string, unknown>;
  void _unused;
  return { type: "json_schema", json_schema: { name: "translation", strict: true, schema } };
}

const baseUrl = () => (process.env.OPENROUTER_BASE_URL ?? "https://openrouter.ai/api/v1").replace(/\/$/, "");

/** Asks an OpenAI-compatible chat endpoint (OpenRouter by default) for one structured translation. */
export async function translate(input: TranslateInput): Promise<TranslationResult> {
  const text = input.text.trim();
  if (!text) throw new TranslateError("empty", "Nothing to translate.");
  if (text.length > MAX_TEXT) throw new TranslateError("too_long", `Keep it under ${MAX_TEXT} characters.`);
  if (!input.apiKey) throw new TranslateError("no_key", "Add an OpenRouter key in Profile to translate.");

  const body = {
    model: input.model,
    messages: [
      { role: "system", content: systemPrompt(input.native, input.target) },
      { role: "user", content: text },
    ],
    response_format: responseFormat(),
    // GPT-5 models think before they answer; a translation does not need it, and the wait shows while typing.
    ...(input.model.startsWith("openai/gpt-5") ? { reasoning: { effort: "minimal" } } : {}),
  };
  const timeout = AbortSignal.timeout(TIMEOUT_MS);
  const signal = input.signal ? AbortSignal.any([input.signal, timeout]) : timeout;
  const call = input.fetcher ?? proxyAwareFetch();
  let response: Response;
  try {
    response = await call(`${baseUrl()}/chat/completions`, {
      method: "POST",
      headers: { Authorization: `Bearer ${input.apiKey}`, "Content-Type": "application/json", "X-Title": "Language Tutor" },
      body: JSON.stringify(body),
      signal,
    });
  } catch (error) {
    if (input.signal?.aborted) throw error;
    throw new TranslateError("upstream", "The translation service did not answer.");
  }
  if (!response.ok) {
    const detail = (await response.text().catch(() => "")).slice(0, 200);
    throw new TranslateError("upstream", `The translation service refused the request (${response.status}). ${detail}`.trim());
  }
  const payload = (await response.json()) as { choices?: { message?: { content?: string } }[] };
  const content = payload.choices?.[0]?.message?.content;
  try {
    return resultSchema.parse(JSON.parse(content ?? ""));
  } catch {
    throw new TranslateError("bad_output", "The model returned an answer this app could not read. Try again.");
  }
}
