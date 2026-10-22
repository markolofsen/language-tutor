import { DEFAULT_NATIVE, DEFAULT_TARGET, isLanguage, type LanguageCode } from "@/domain/languages";
import { getSetting, setSetting } from "@/settings/store";

export const DEFAULT_MODEL = "openai/gpt-5-mini";

export type TranslatorSettings = {
  native: LanguageCode;
  target: LanguageCode;
  model: string;
  /** Where the API key comes from: the environment wins, then the key saved in the app. */
  keySource: "env" | "app" | "none";
  /** The last four characters, enough to recognise a key; the key itself never leaves the server. */
  keyTail: string;
};

const asLanguage = (value: string | undefined, fallback: LanguageCode): LanguageCode =>
  value && isLanguage(value) ? value : fallback;

export async function resolveApiKey(): Promise<{ key: string; source: "env" | "app" } | undefined> {
  const fromEnv = process.env.OPENROUTER_API_KEY?.trim();
  if (fromEnv) return { key: fromEnv, source: "env" };
  const saved = await getSetting("openrouter_key");
  return saved ? { key: saved, source: "app" } : undefined;
}

export async function getTranslatorSettings(): Promise<TranslatorSettings> {
  const [native, target, model, key] = await Promise.all([
    getSetting("native"),
    getSetting("target"),
    getSetting("translate_model"),
    resolveApiKey(),
  ]);
  return {
    native: asLanguage(native, DEFAULT_NATIVE),
    target: asLanguage(target, DEFAULT_TARGET),
    model: model ?? process.env.TRANSLATE_MODEL?.trim() ?? DEFAULT_MODEL,
    keySource: key?.source ?? "none",
    keyTail: key ? key.key.slice(-4) : "",
  };
}

export type TranslatorChange = { native?: string; target?: string; model?: string; apiKey?: string; clearKey?: boolean };

/** Saves what the learner changed; a blank field leaves its setting as it is. */
export async function saveTranslatorSettings(change: TranslatorChange): Promise<void> {
  if (change.native && isLanguage(change.native)) await setSetting("native", change.native);
  if (change.target && isLanguage(change.target)) await setSetting("target", change.target);
  if (change.model?.trim()) await setSetting("translate_model", change.model);
  if (change.clearKey) await setSetting("openrouter_key", "");
  else if (change.apiKey?.trim()) await setSetting("openrouter_key", change.apiKey);
}
