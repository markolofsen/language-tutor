import { describe, expect, it } from "vitest";

import { diffWords } from "./word-diff";

describe("diffWords", () => {
  it("is clean when the typed text matches, ignoring case and punctuation", () => {
    const diff = diffWords("The deal closes today.", "the deal closes today");
    expect(diff.missed).toEqual([]);
    expect(diff.ok).toBe(4);
  });

  it("names the words that were not heard", () => {
    const diff = diffWords("She is treating them well", "she is them well");
    expect(diff.missed).toEqual(["treating"]);
  });

  it("does not let a wrong word hide a missed one", () => {
    const diff = diffWords("I would rather stay", "I would rater stay");
    expect(diff.missed).toEqual(["rather"]);
  });
});
