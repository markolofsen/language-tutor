import { describe, expect, it } from "vitest";

import { accuracy, advisedSentences } from "./load";

describe("advisedSentences", () => {
  it("starts with a calibration length", () => {
    expect(advisedSentences(accuracy([]))).toEqual({ min: 3, max: 4 });
  });

  it("shortens when the learner is slipping and lengthens when comfortable", () => {
    expect(advisedSentences(accuracy([1, 2, 3, 4]))).toEqual({ min: 2, max: 3 });
    expect(advisedSentences(accuracy([4, 5, 4, 5, 5, 4]))).toEqual({ min: 5, max: 6 });
  });
});
