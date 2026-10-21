export const ERROR_CATEGORIES = [
  "vocab",
  "tense",
  "agreement",
  "article",
  "preposition",
  "word_order",
  "collocation",
  "register",
  "spelling",
] as const;

export type ErrorCategory = (typeof ERROR_CATEGORIES)[number];

export const CATEGORY_LABELS: Record<ErrorCategory, string> = {
  vocab: "Word choice",
  tense: "Tenses",
  agreement: "Agreement",
  article: "Articles",
  preposition: "Prepositions",
  word_order: "Word order",
  collocation: "Collocations",
  register: "Register",
  spelling: "Spelling",
};

export const CATEGORY_HINTS = {
  vocab: "the wrong word for the meaning",
  tense: "wrong or inconsistent verb tense or form",
  agreement: "subject-verb or number agreement",
  article: "missing, extra or wrong a/an/the",
  preposition: "wrong or missing preposition",
  word_order: "words in an order English does not allow",
  collocation: "words that do not go together naturally",
  register: "too formal or too casual for the situation",
  spelling: "misspelled word",
} as const satisfies Record<ErrorCategory, string>;
