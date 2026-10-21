import { describe, expect, it } from "vitest";

import { nextAction } from "./next-action";

describe("nextAction", () => {
  it("puts due cards first, then a translation", () => {
    expect(nextAction({ dueCards: 3, unansweredExercises: 2, pendingAttempts: 0 }).href).toBe("/review");
    expect(nextAction({ dueCards: 0, unansweredExercises: 2, pendingAttempts: 0 }).href).toBe("/practice");
  });

  it("points at Claude when nothing is queued", () => {
    const action = nextAction({ dueCards: 0, unansweredExercises: 0, pendingAttempts: 2 });
    expect(action.href).toBeNull();
    expect(action.detail).toContain("2 answers wait for Claude");
  });
});
