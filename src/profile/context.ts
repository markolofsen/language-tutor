import { desc, gte } from "drizzle-orm";

import { getDb } from "@/db/client";
import { errors } from "@/db/schema";
import { accentSummaries } from "@/listening/dictation";
import { countPending, recentScores } from "@/practice/attempts";
import { countUnanswered } from "@/practice/exercises";
import { countDue } from "@/review/cards";
import { getTranslatorSettings } from "@/translate/settings";
import { justTaught, practiceWords, wordCounts } from "@/words/store";

import { advisedSentences, accuracy } from "./load";
import { loadPatternStates } from "./patterns";
import { getPlan } from "./plan";
import { categoryWeights, FOCUS_WINDOW_DAYS, type DatedError } from "./weights";

const RECENT_ATTEMPTS = 20;
const DAY_MS = 86_400_000;

export async function recentErrors(now: Date, limit?: number) {
  const db = await getDb();
  const since = new Date(now.getTime() - FOCUS_WINDOW_DAYS * DAY_MS);
  const query = db.select().from(errors).where(gte(errors.createdAt, since)).orderBy(desc(errors.id));
  return limit ? query.limit(limit).all() : query.all();
}

/** Everything the tutor needs to pick the next move, in one read (the queries run side by side). */
export async function learnerContext(now: Date) {
  const [allErrors, scores, plan, patterns, words, taught, due, unanswered, pending, toPractise, accents, languages] =
    await Promise.all([
      recentErrors(now),
      recentScores(RECENT_ATTEMPTS),
      getPlan(),
      loadPatternStates(now),
      wordCounts(),
      justTaught(now),
      countDue(now),
      countUnanswered(),
      countPending(),
      practiceWords(8),
      accentSummaries(),
      getTranslatorSettings(),
    ]);
  const dated: DatedError[] = allErrors.map((e) => ({ category: e.category, at: e.createdAt }));
  const weights = categoryWeights(dated, now);
  const share = accuracy(scores);
  return {
    languages: { native: languages.native, target: languages.target },
    goal: plan.goal,
    method: plan.method,
    patterns: patterns
      .filter((p) => p.status !== "resolved")
      .slice(0, 8)
      .map((p) => ({ rule: p.rule, category: p.category, status: p.status, misses: p.misses, holdsSince: p.holdsSince })),
    resolvedPatterns: patterns.filter((p) => p.status === "resolved").map((p) => p.rule),
    words,
    justTaught: taught,
    dueCards: due,
    unansweredExercises: unanswered,
    pendingAttempts: pending,
    accuracyLast20: share,
    advisedSentences: advisedSentences(share),
    focusCategories: weights.slice(0, 2).map((w) => w.category),
    categoryWeights: weights,
    wordsToPractise: toPractise.map((w) => ({
      english: w.english,
      translation: w.translation,
      association: w.association,
      seen: w.seen,
      missed: w.missed,
    })),
    recentErrors: allErrors.slice(0, 8).map((e) => ({ category: e.category, span: e.span, fix: e.fix })),
    listeningByAccent: accents,
  };
}

export type LearnerContext = Awaited<ReturnType<typeof learnerContext>>;
