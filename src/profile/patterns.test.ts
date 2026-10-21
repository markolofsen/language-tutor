import { describe, expect, it } from "vitest";

import { patternStates, type PatternHold, type PatternMiss } from "./patterns";

const now = new Date("2026-11-30T00:00:00Z");
const daysAgo = (n: number) => new Date(now.getTime() - n * 86_400_000);
const miss = (rule: string, n: number): PatternMiss => ({ rule, category: "article", at: daysAgo(n) });
const hold = (rule: string, n: number): PatternHold => ({ rule, at: daysAgo(n) });
const statusOf = (misses: PatternMiss[], holds: PatternHold[]) => patternStates(misses, holds, now)[0]?.status;

describe("patternStates", () => {
  it("watches a single slip and calls two misses a habit", () => {
    expect(statusOf([miss("a", 3)], [])).toBe("watch");
    expect(statusOf([miss("a", 9), miss("a", 3)], [])).toBe("active");
  });

  it("moves to improving with correct uses after the last miss, not before it", () => {
    expect(statusOf([miss("a", 9), miss("a", 5)], [hold("a", 8), hold("a", 7)])).toBe("active");
    expect(statusOf([miss("a", 9), miss("a", 5)], [hold("a", 4), hold("a", 2)])).toBe("improving");
  });

  it("retires a rule only after enough correct uses over enough quiet days", () => {
    const holds = [hold("a", 12), hold("a", 9), hold("a", 6), hold("a", 3)];
    expect(statusOf([miss("a", 40), miss("a", 13)], holds)).toBe("improving");
    expect(statusOf([miss("a", 40), miss("a", 20)], [hold("a", 17), hold("a", 12), hold("a", 8), hold("a", 3)])).toBe("resolved");
  });

  it("reopens a retired rule on a new miss", () => {
    const holds = [hold("a", 17), hold("a", 12), hold("a", 8), hold("a", 3)];
    expect(statusOf([miss("a", 20), miss("a", 1)], holds)).toBe("active");
  });
});
