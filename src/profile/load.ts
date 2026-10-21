export const GOOD_SCORE = 4;
const LOW_ACCURACY = 0.6;
const HIGH_ACCURACY = 0.85;

/** Share of attempts scoring at least 4, or null before there is anything to measure. */
export function accuracy(scores: number[]): number | null {
  if (scores.length === 0) return null;
  return scores.filter((s) => s >= GOOD_SCORE).length / scores.length;
}

export type Length = { min: number; max: number };

/** Paragraph length that keeps the learner near the edge: shorter when slipping, longer when comfortable. */
export function advisedSentences(share: number | null): Length {
  if (share === null) return { min: 3, max: 4 };
  if (share < LOW_ACCURACY) return { min: 2, max: 3 };
  if (share <= HIGH_ACCURACY) return { min: 4, max: 4 };
  return { min: 5, max: 6 };
}
