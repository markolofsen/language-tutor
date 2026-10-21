/** The rules of a clean dictionary: one source for the tool descriptions and the server instructions. */
export const WORD_RULES = [
  "English side: the base form (verbs without `to`, nouns in the singular), lower case except proper nouns, spelled correctly. Fix the learner's typos before saving (`certajn` becomes `certain`).",
  "An idiom, phrasal verb or collocation is one entry (`feast or famine`, `get laid off`). A whole sentence is not a word: keep only its key word or phrase.",
  "Always store the English side as the word, even when the learner saved it Russian to English.",
  "Translation: Russian, short, in the sense the learner met the word (`elaborate` as a verb is `разрабатывать`, as an adjective `тщательный`). One to three alternatives separated by commas, no slashes. If the sense is unclear, ask the learner instead of guessing.",
  "`translation` holds only the short Russian gloss: never an English explanation or a hint. The memory link goes in `association` (one short line: a sound-alike, a known English word or a meaning image; none is better than a forced one; see the method in get_learner_context); a sentence that uses the word goes in `example`, which also schedules its review.",
  "Drop UI leftovers, other languages and half sentences. One spelling per word: do not keep `off the shelf` and `off-the-shelf` both.",
  "Check `list_words` before a large batch; `update_words` fixes a spelling or gloss, `remove_words` deletes a word nothing refers to.",
].join(" ");
