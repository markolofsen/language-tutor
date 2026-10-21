import { ACCENTS, type AccentTag } from "@/domain/accents";

import type { AccentSummary } from "./dictation";

/** The accent to train next: one never heard first, otherwise the one the learner catches least. */
export function chooseAccent(available: AccentTag[], summaries: AccentSummary[]): AccentTag | undefined {
  const heard = new Map(summaries.map((s) => [s.accent, s.heardShare]));
  const candidates = ACCENTS.map((a) => a.tag).filter((tag) => available.includes(tag));
  const unheard = candidates.find((tag) => !heard.has(tag));
  if (unheard) return unheard;
  return [...candidates].sort((a, b) => (heard.get(a) ?? 1) - (heard.get(b) ?? 1))[0];
}
