# 0002 — Data model and tutor contract

**ACCEPTED 2026-10-20**, amended by 0003. Basis: `../../@docs/research/methods.md`, `../../@docs/research/tech.md`.

## Tables (SQLite, Drizzle; `src/db/schema.ts` is the source)
| Table | Holds |
|---|---|
| `words` | english, translation (Russian gloss only), association (memory hook, simple English), example (a sentence with the word; schedules its card), source (`import`/`manual`/`story`), status (`new`/`learning`/`known`), seen, missed, added_at |
| `stories` | text_en, text_ru, topic, created_at |
| `story_words` | story_id, word_id, form (as it appears), sentence (target word in context) |
| `exercises` | story_id, direction (`ru_en`/`en_ru`), source_text, reference_text, created_at |
| `attempts` | exercise_id, answer_text, status (`pending`/`evaluated`), score 0–5, summary, better_version, created_at, evaluated_at |
| `errors` | attempt_id, category, span, fix, note, drill_sentence, drill_answer, created_at |
| `cards` | kind (`word`/`error`), prompt, answer, hint, word_id?, error_id?, suspended, FSRS state (due, stability, difficulty, elapsed_days, scheduled_days, reps, lapses, state, last_review) |
| `reviews` | card_id, missed, reviewed_at |
| `settings` | key, value: `goal` and `method`, the agreed way of working; defaults in `src/domain/method.ts` until changed |
| `pattern_holds` | rule, attempt_id, created_at: a habit that was tested and was right; `errors.pattern` is the rule key of each error |
| `dictations` | accent, text, typed, ok_words, missed_words, created_at |

## Error categories (closed list)
`vocab`, `tense`, `agreement`, `article`, `preposition`, `word_order`, `collocation`, `register`, `spelling`.
Hearing is not a Claude category: dictation misses go to `dictations`, per accent.

## Evaluation contract (`src/domain/evaluation.ts`, the input of `record_evaluation`)
```ts
{ score: 0..5,
  summary: string,                       // one sentence, Russian
  errors: { category, span, fix, note, drill_sentence, drill_answer }[],  // max 6, note in Russian
  better_version: string,
  words_used: string[],                  // target words used correctly
  words_missed: string[] }               // target words misused or avoided
```
`drill_sentence` is a NEW short English sentence testing the same rule, with `___` for `drill_answer`. It becomes an `error` card.

## Story contract (`src/domain/story.ts`, the input of `create_story`)
`text_en`, `text_ru`, `topic`, `targets[{ word, form, sentence, translation? }]`: `form` is the exact string inside `sentence`, `sentence` is copied verbatim from `text_en`, `translation` is a Russian gloss used when the saved word has none. Creates the story, one `word` card per target (cloze on `sentence`, hint = translation) and two exercises (`ru_en`, `en_ru`).

## MCP surface (`src/mcp`)
| Tool | Does |
|---|---|
| `get_learner_context` | level signals, focus categories, accuracy, counts, due cards, words to practise next, advised paragraph length |
| `add_words`, `list_words` | save a batch with hook and example, read the word table (status, hook, results) |
| `record_chat_sentence` | a sentence judged in conversation: stores a `chat` story, an exercise, the attempt, errors and drill cards |
| `set_learning_plan` | change the goal or the method, only with the learner's agreement |
| `create_story` | story + cards + exercises |
| `next_exercise`, `list_pending_attempts` | what to present; answers waiting for judgement |
| `record_evaluation` | judge a pending attempt, or record a spoken answer to an exercise |
| `get_due_cards`, `grade_card` | review in conversation |
| `get_profile` | weighted error categories, trend, listening misses by accent |
| prompt `session` | the tutor loop for N minutes |

## Adaptation (`src/profile`)
- Weight: each error counts `0.5^(age_days/7)`. The two heaviest categories are the focus; `get_learner_context` names them.
- Load from the last 20 evaluated attempts: accuracy below 60% gives 2–3 sentence paragraphs; 60–85% gives 4; above 85% gives 5–6. Accuracy = share with score ≥ 4.
- An error with no repeat in 28 days leaves the focus.
- FSRS rating: `Again` when missed, `Good` otherwise. Two buttons, no settings.
