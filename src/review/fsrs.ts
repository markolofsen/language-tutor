import { createEmptyCard, fixState, fsrs, generatorParameters, Rating, type Card } from "ts-fsrs";

import type { cards } from "@/db/schema";

export type CardRow = typeof cards.$inferSelect;

/** The scheduling columns of a card row. */
export type Schedule = Pick<
  CardRow,
  | "due"
  | "stability"
  | "difficulty"
  | "elapsedDays"
  | "scheduledDays"
  | "learningSteps"
  | "reps"
  | "lapses"
  | "state"
  | "lastReview"
>;

const scheduler = fsrs(generatorParameters({ enable_fuzz: true }));

function toColumns(card: Card): Schedule {
  return {
    due: card.due,
    stability: card.stability,
    difficulty: card.difficulty,
    elapsedDays: card.elapsed_days,
    scheduledDays: card.scheduled_days,
    learningSteps: card.learning_steps,
    reps: card.reps,
    lapses: card.lapses,
    state: card.state,
    lastReview: card.last_review ?? null,
  };
}

function toCard(row: Schedule): Card {
  return {
    due: row.due,
    stability: row.stability,
    difficulty: row.difficulty,
    elapsed_days: row.elapsedDays,
    scheduled_days: row.scheduledDays,
    learning_steps: row.learningSteps,
    reps: row.reps,
    lapses: row.lapses,
    state: fixState(row.state),
    ...(row.lastReview ? { last_review: row.lastReview } : {}),
  };
}

export function initialSchedule(now: Date): Schedule {
  return toColumns(createEmptyCard(now));
}

/** Two buttons only: a miss is Again, anything else Good. */
export function nextSchedule(row: Schedule, missed: boolean, now: Date): Schedule {
  const rating = missed ? Rating.Again : Rating.Good;
  return toColumns(scheduler.next(toCard(row), now, rating).card);
}
