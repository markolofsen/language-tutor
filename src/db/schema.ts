import { index, integer, real, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

import { ERROR_CATEGORIES } from "@/domain/categories";

const createdAt = () =>
  integer("created_at", { mode: "timestamp_ms" })
    .notNull()
    .$defaultFn(() => new Date());

export const words = sqliteTable(
  "words",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    key: text("key").notNull(),
    english: text("english").notNull(),
    translation: text("translation").notNull().default(""),
    association: text("association").notNull().default(""),
    example: text("example").notNull().default(""),
    source: text("source", { enum: ["import", "manual", "story"] }).notNull().default("manual"),
    status: text("status", { enum: ["new", "learning", "known"] }).notNull().default("new"),
    seen: integer("seen").notNull().default(0),
    missed: integer("missed").notNull().default(0),
    addedAt: createdAt(),
  },
  (t) => [uniqueIndex("words_key_idx").on(t.key)],
);

/** Small agreed facts the tutor reads every session: the learning goal and the way of working. */
export const settings = sqliteTable("settings", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
});

export const stories = sqliteTable("stories", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  topic: text("topic").notNull(),
  textEn: text("text_en").notNull(),
  textRu: text("text_ru").notNull(),
  createdAt: createdAt(),
});

export const storyWords = sqliteTable("story_words", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  storyId: integer("story_id").notNull().references(() => stories.id, { onDelete: "cascade" }),
  wordId: integer("word_id").notNull().references(() => words.id, { onDelete: "cascade" }),
  form: text("form").notNull(),
  sentence: text("sentence").notNull(),
});

export const exercises = sqliteTable("exercises", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  storyId: integer("story_id").notNull().references(() => stories.id, { onDelete: "cascade" }),
  direction: text("direction", { enum: ["ru_en", "en_ru"] }).notNull(),
  sourceText: text("source_text").notNull(),
  referenceText: text("reference_text").notNull(),
  createdAt: createdAt(),
});

export const attempts = sqliteTable(
  "attempts",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    exerciseId: integer("exercise_id").notNull().references(() => exercises.id, { onDelete: "cascade" }),
    answerText: text("answer_text").notNull(),
    status: text("status", { enum: ["pending", "evaluated"] }).notNull().default("pending"),
    score: integer("score"),
    summary: text("summary"),
    betterVersion: text("better_version"),
    createdAt: createdAt(),
    evaluatedAt: integer("evaluated_at", { mode: "timestamp_ms" }),
  },
  (t) => [index("attempts_exercise_idx").on(t.exerciseId), index("attempts_status_idx").on(t.status)],
);

export const errors = sqliteTable(
  "errors",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    attemptId: integer("attempt_id").notNull().references(() => attempts.id, { onDelete: "cascade" }),
    category: text("category", { enum: ERROR_CATEGORIES }).notNull(),
    span: text("span").notNull(),
    fix: text("fix").notNull(),
    note: text("note").notNull(),
    /** A short stable rule key ("a/an before a singular noun"): errors of one habit share it. */
    pattern: text("pattern"),
    drillSentence: text("drill_sentence").notNull(),
    drillAnswer: text("drill_answer").notNull(),
    createdAt: createdAt(),
  },
  (t) => [index("errors_created_idx").on(t.createdAt)],
);

/** A habit the learner was tested on and got right: the evidence that lets a pattern be retired. */
export const patternHolds = sqliteTable(
  "pattern_holds",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    rule: text("rule").notNull(),
    attemptId: integer("attempt_id").notNull().references(() => attempts.id, { onDelete: "cascade" }),
    createdAt: createdAt(),
  },
  (t) => [index("pattern_holds_rule_idx").on(t.rule)],
);

export const cards = sqliteTable(
  "cards",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    kind: text("kind", { enum: ["word", "error"] }).notNull(),
    prompt: text("prompt").notNull(),
    answer: text("answer").notNull(),
    hint: text("hint").notNull().default(""),
    wordId: integer("word_id").references(() => words.id, { onDelete: "cascade" }),
    errorId: integer("error_id").references(() => errors.id, { onDelete: "cascade" }),
    suspended: integer("suspended", { mode: "boolean" }).notNull().default(false),
    due: integer("due", { mode: "timestamp_ms" }).notNull(),
    stability: real("stability").notNull().default(0),
    difficulty: real("difficulty").notNull().default(0),
    elapsedDays: integer("elapsed_days").notNull().default(0),
    scheduledDays: integer("scheduled_days").notNull().default(0),
    learningSteps: integer("learning_steps").notNull().default(0),
    reps: integer("reps").notNull().default(0),
    lapses: integer("lapses").notNull().default(0),
    state: integer("state").notNull().default(0),
    lastReview: integer("last_review", { mode: "timestamp_ms" }),
    createdAt: createdAt(),
  },
  (t) => [index("cards_due_idx").on(t.due)],
);

export const reviews = sqliteTable("reviews", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  cardId: integer("card_id").notNull().references(() => cards.id, { onDelete: "cascade" }),
  missed: integer("missed", { mode: "boolean" }).notNull(),
  reviewedAt: integer("reviewed_at", { mode: "timestamp_ms" }).notNull(),
});

export const dictations = sqliteTable("dictations", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  accent: text("accent").notNull(),
  text: text("text").notNull(),
  typed: text("typed").notNull(),
  okWords: integer("ok_words").notNull(),
  missedWords: text("missed_words", { mode: "json" }).$type<string[]>().notNull(),
  createdAt: createdAt(),
});
