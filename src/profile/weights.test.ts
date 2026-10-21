import { describe, expect, it } from "vitest";

import { categoryWeights, focusCategories } from "./weights";

const now = new Date("2026-10-20T00:00:00Z");
const daysAgo = (n: number) => new Date(now.getTime() - n * 86_400_000);

describe("categoryWeights", () => {
  it("halves an error's weight every seven days", () => {
    const [w] = categoryWeights([{ category: "article", at: daysAgo(7) }], now);
    expect(w?.weight).toBeCloseTo(0.5, 5);
  });

  it("ranks several fresh errors above one older error", () => {
    const errs = [
      { category: "tense" as const, at: daysAgo(14) },
      { category: "article" as const, at: daysAgo(1) },
      { category: "article" as const, at: daysAgo(2) },
    ];
    expect(focusCategories(errs, now, 1)).toEqual(["article"]);
  });

  it("drops errors older than the window", () => {
    expect(categoryWeights([{ category: "spelling", at: daysAgo(40) }], now)).toEqual([]);
  });
});
