import { findWordsByKeys } from "@/words/store";
import { getDb } from "@/db/client";
import { wordKey } from "@/domain/words";
import { resolveApiKey, getTranslatorSettings } from "@/translate/settings";
import { translate, TranslateError, type TranslationResult } from "@/translate/translate";

export const dynamic = "force-dynamic";

/** The same text, languages and model give the same answer: do not pay for it twice. */
const cache = new Map<string, TranslationResult>();
const CACHE_LIMIT = 200;

/** A runaway client (a stuck loop) must not run up the bill: one minute holds at most this many calls. */
const MAX_PER_MINUTE = 120;
let windowStart = 0;
let calls = 0;

function overLimit(): boolean {
  const now = Date.now();
  if (now - windowStart > 60_000) {
    windowStart = now;
    calls = 0;
  }
  calls += 1;
  return calls > MAX_PER_MINUTE;
}

const json = (body: unknown, status = 200) => Response.json(body, { status, headers: { "Cache-Control": "no-store" } });

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as { text?: unknown } | null;
  const text = typeof body?.text === "string" ? body.text.trim() : "";
  if (!text) return json({ error: "empty", message: "Nothing to translate." }, 400);
  if (overLimit()) return json({ error: "rate", message: "Too many requests. Wait a moment." }, 429);

  const settings = await getTranslatorSettings();
  const key = settings.keySource === "none" ? undefined : (await resolveApiKey())?.key;
  const cacheKey = [settings.model, settings.native, settings.target, text].join("\u0000");
  try {
    let result = cache.get(cacheKey);
    if (!result) {
      result = await translate({
        text,
        native: settings.native,
        target: settings.target,
        model: settings.model,
        apiKey: key,
        signal: request.signal,
      });
      if (cache.size >= CACHE_LIMIT) cache.delete(cache.keys().next().value as string);
      cache.set(cacheKey, result);
    }
    const db = await getDb();
    const known = new Set((await findWordsByKeys(db, result.words.map((w) => wordKey(w.word)))).map((w) => w.key));
    return json({ ...result, words: result.words.map((w) => ({ ...w, saved: known.has(wordKey(w.word)) })) });
  } catch (error) {
    if (error instanceof TranslateError) {
      return json({ error: error.code, message: error.message }, error.code === "no_key" ? 409 : 502);
    }
    if (request.signal.aborted) return new Response(null, { status: 499 });
    throw error;
  }
}
