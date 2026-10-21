import { and, gte, isNotNull } from "drizzle-orm";

import { getDb } from "@/db/client";
import { errors, patternHolds } from "@/db/schema";
import type { ErrorCategory } from "@/domain/categories";

const DAY_MS = 86_400_000;
const WINDOW_DAYS = 120;
const RESOLVED_HOLDS = 4;
const RESOLVED_QUIET_DAYS = 14;
const IMPROVING_HOLDS = 2;

export type PatternStatus = "watch" | "active" | "improving" | "resolved";

export type PatternMiss = { rule: string; category: ErrorCategory; at: Date };
export type PatternHold = { rule: string; at: Date };

export type PatternState = {
  rule: string;
  category: ErrorCategory;
  misses: number;
  /** Times the rule was needed and right since the last miss. */
  holdsSince: number;
  lastMiss: Date;
  status: PatternStatus;
};

/**
 * A single slip is only watched; a rule missed twice is a habit (active). Correct uses after the last miss
 * make it improving, and enough of them over enough quiet days retire it. A new miss reopens it.
 */
export function patternStates(misses: PatternMiss[], holds: PatternHold[], now: Date): PatternState[] {
  const byRule = new Map<string, PatternMiss[]>();
  for (const miss of misses) byRule.set(miss.rule, [...(byRule.get(miss.rule) ?? []), miss]);
  const states: PatternState[] = [];
  for (const [rule, list] of byRule) {
    const last = list.reduce((a, b) => (a.at >= b.at ? a : b));
    const holdsSince = holds.filter((h) => h.rule === rule && h.at > last.at).length;
    const quietDays = (now.getTime() - last.at.getTime()) / DAY_MS;
    let status: PatternStatus;
    if (holdsSince >= RESOLVED_HOLDS && quietDays >= RESOLVED_QUIET_DAYS) status = "resolved";
    else if (holdsSince >= IMPROVING_HOLDS) status = "improving";
    else if (list.length >= 2) status = "active";
    else status = "watch";
    states.push({ rule, category: last.category, misses: list.length, holdsSince, lastMiss: last.at, status });
  }
  const order: Record<PatternStatus, number> = { active: 0, improving: 1, watch: 2, resolved: 3 };
  return states.sort((a, b) => order[a.status] - order[b.status] || b.lastMiss.getTime() - a.lastMiss.getTime());
}

export async function loadPatternStates(now: Date): Promise<PatternState[]> {
  const db = await getDb();
  const since = new Date(now.getTime() - WINDOW_DAYS * DAY_MS);
  const rows = await db
    .select({ rule: errors.pattern, category: errors.category, at: errors.createdAt })
    .from(errors)
    .where(and(isNotNull(errors.pattern), gte(errors.createdAt, since)))
    .all();
  const misses = rows.flatMap((e) => (e.rule ? [{ rule: e.rule, category: e.category, at: e.at }] : []));
  const holds = await db
    .select({ rule: patternHolds.rule, at: patternHolds.createdAt })
    .from(patternHolds)
    .where(gte(patternHolds.createdAt, since))
    .all();
  return patternStates(misses, holds, now);
}
