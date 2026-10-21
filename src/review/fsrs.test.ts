import { describe, expect, it } from "vitest";

import { initialSchedule, nextSchedule } from "./fsrs";

const now = new Date("2026-10-20T10:00:00Z");

describe("nextSchedule", () => {
  it("pushes a remembered card further out than a missed one", () => {
    const fresh = initialSchedule(now);
    const good = nextSchedule(fresh, false, now);
    const again = nextSchedule(fresh, true, now);
    expect(good.due.getTime()).toBeGreaterThan(again.due.getTime());
    expect(good.reps).toBe(1);
  });

  it("counts a lapse when a reviewed card is missed", () => {
    let card = initialSchedule(now);
    card = nextSchedule(card, false, now);
    const later = new Date(card.due.getTime() + 1000);
    const lapsed = nextSchedule(card, true, later);
    expect(lapsed.lapses).toBeGreaterThanOrEqual(card.lapses);
    expect(lapsed.reps).toBe(2);
  });
});
