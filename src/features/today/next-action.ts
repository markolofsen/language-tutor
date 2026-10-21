import { routes } from "@/routes";

export type NextAction = { title: string; detail: string; href: string | null };

type Counts = { dueCards: number; unansweredExercises: number; pendingAttempts: number };

/** One primary move: cards due first, then a translation, otherwise a prompt to open Claude. */
export function nextAction(counts: Counts): NextAction {
  if (counts.dueCards > 0) {
    return { title: `Review ${counts.dueCards} ${counts.dueCards === 1 ? "card" : "cards"}`, detail: "A few minutes.", href: routes.review };
  }
  if (counts.unansweredExercises > 0) {
    return { title: "Translate", detail: `${counts.unansweredExercises} waiting.`, href: routes.practice };
  }
  const waiting = counts.pendingAttempts > 0 ? `${counts.pendingAttempts} answers wait for Claude. ` : "";
  return { title: "All done for now", detail: `${waiting}Tell Claude: “start my English session”.`, href: null };
}
