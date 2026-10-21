import { describe, expect, it } from "vitest";

import { fillCloze, storySchema, toCloze } from "./story";

describe("toCloze", () => {
  it("blanks the form, keeping the original case of the rest", () => {
    expect(toCloze("She is treating them well.", "treating")).toBe("She is ___ them well.");
  });

  it("leaves the sentence alone when the form is absent", () => {
    expect(toCloze("Nothing here.", "treating")).toBe("Nothing here.");
  });
});

describe("storySchema", () => {
  const base = {
    topic: "work",
    text_en: "The agent is treating them well. They sign today.",
    text_ru: "Агент хорошо к ним относится. Сегодня они подписывают.",
  };

  it("accepts targets copied from the text", () => {
    const parsed = storySchema.safeParse({
      ...base,
      targets: [{ word: "treat", form: "treating", sentence: "The agent is treating them well." }],
    });
    expect(parsed.success).toBe(true);
  });

  it("rejects a sentence that is not in the text", () => {
    const parsed = storySchema.safeParse({
      ...base,
      targets: [{ word: "treat", form: "treating", sentence: "He is treating us." }],
    });
    expect(parsed.success).toBe(false);
  });
});

describe("fillCloze", () => {
  it("restores the sentence that toCloze blanked", () => {
    const sentence = "She is treating them well.";
    expect(fillCloze(toCloze(sentence, "treating"), "treating")).toBe(sentence);
  });
});
