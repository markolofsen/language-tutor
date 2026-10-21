import type { ErrorCategory } from "@/domain/categories";

export const HALF_LIFE_DAYS = 7;
export const FOCUS_WINDOW_DAYS = 28;
const DAY_MS = 86_400_000;

export type DatedError = { category: ErrorCategory; at: Date };
export type CategoryWeight = { category: ErrorCategory; weight: number; count: number };

/** Recent errors count more: a weight halves every week, and errors older than the window drop out. */
export function categoryWeights(errs: DatedError[], now: Date): CategoryWeight[] {
  const totals = new Map<ErrorCategory, CategoryWeight>();
  for (const err of errs) {
    const ageDays = Math.max(0, (now.getTime() - err.at.getTime()) / DAY_MS);
    if (ageDays > FOCUS_WINDOW_DAYS) continue;
    const entry = totals.get(err.category) ?? { category: err.category, weight: 0, count: 0 };
    entry.weight += 0.5 ** (ageDays / HALF_LIFE_DAYS);
    entry.count += 1;
    totals.set(err.category, entry);
  }
  return [...totals.values()].sort((a, b) => b.weight - a.weight);
}

export function focusCategories(errs: DatedError[], now: Date, limit = 2): ErrorCategory[] {
  return categoryWeights(errs, now)
    .slice(0, limit)
    .map((w) => w.category);
}
