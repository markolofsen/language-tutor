import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { beforeAll, describe, expect, it } from "vitest";

import { dueCards } from "@/review/cards";
import { getTranslatorSettings, saveTranslatorSettings } from "./settings";
import { listWords } from "@/words/store";

import { saveTranslation } from "./save";

beforeAll(() => {
  process.env.DATABASE_URL = `file:${join(mkdtempSync(join(tmpdir(), "lang-")), "test.db")}`;
});

describe("saveTranslation", () => {
  it("keeps the chosen words with their hooks and brings each back through the sentence it came from", async () => {
    const result = await saveTranslation({
      source: "Он отказался раскрыть детали.",
      translation: "He refused to disclose the details.",
      detected: "native",
      words: [{ word: "disclose", translation: "раскрывать", association: "dis- + close" }],
      phrase: true,
    });
    expect(result).toMatchObject({ added: 2, cardsCreated: 1 });
    const words = await listWords({ limit: 10 });
    expect(words.find((w) => w.english === "disclose")).toMatchObject({ association: "dis- + close", source: "translator" });
    expect(words.find((w) => w.english === "He refused to disclose the details.")?.translation).toBe("Он отказался раскрыть детали.");
    const due = await dueCards(10, new Date(Date.now() + 24 * 3_600_000));
    expect(due.map((c) => c.prompt)).toEqual(["He refused to ___ the details."]);
  });

  it("uses the typed sentence when the text was already in the target language", async () => {
    await saveTranslation({
      source: "It sounded plausible.",
      translation: "Это звучало правдоподобно.",
      detected: "target",
      words: [{ word: "plausible", translation: "правдоподобный", association: "" }],
      phrase: false,
    });
    const due = await dueCards(10, new Date(Date.now() + 24 * 3_600_000));
    expect(due.map((c) => c.answer)).toContain("plausible");
  });
});

describe("translator settings", () => {
  it("defaults to Russian and English and keeps a saved key out of sight", async () => {
    delete process.env.OPENROUTER_API_KEY;
    expect(await getTranslatorSettings()).toMatchObject({ native: "ru", target: "en", keySource: "none" });
    await saveTranslatorSettings({ native: "de", apiKey: "sk-or-abcdef1234" });
    expect(await getTranslatorSettings()).toMatchObject({ native: "de", keySource: "app", keyTail: "1234" });
    await saveTranslatorSettings({ clearKey: true });
    expect((await getTranslatorSettings()).keySource).toBe("none");
  });
});
