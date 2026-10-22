/** Languages the translator and the tutor can be pointed at: ISO 639-1 code to the English name. */
export const LANGUAGES = {
  en: "English",
  ru: "Russian",
  uk: "Ukrainian",
  es: "Spanish",
  de: "German",
  fr: "French",
  it: "Italian",
  pt: "Portuguese",
  pl: "Polish",
  tr: "Turkish",
  ar: "Arabic",
  hi: "Hindi",
  id: "Indonesian",
  zh: "Chinese",
  ja: "Japanese",
  ko: "Korean",
} as const;

export type LanguageCode = keyof typeof LANGUAGES;

export const LANGUAGE_CODES = Object.keys(LANGUAGES) as LanguageCode[];

export const isLanguage = (code: string): code is LanguageCode => code in LANGUAGES;

/** Defaults of this deployment's learner: Russian speaker learning English. */
export const DEFAULT_NATIVE: LanguageCode = "ru";
export const DEFAULT_TARGET: LanguageCode = "en";
