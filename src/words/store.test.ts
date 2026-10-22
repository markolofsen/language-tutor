import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { beforeAll, describe, expect, it } from "vitest";

import { dueCards } from "@/review/cards";
import { getPlan, setPlan } from "@/profile/plan";
import { DEFAULT_METHOD } from "@/domain/method";

import { recordChatSentence } from "@/practice/record-chat";

import { addWords, deleteWordsById, justTaught, listWords, updateWords } from "./store";

beforeAll(() => {
  process.env.DATABASE_URL = `file:${join(mkdtempSync(join(tmpdir(), "lang-")), "test.db")}`;
});

describe("a word with a hook and an example", () => {
  it("brings the word back as a card and shows the hook after the answer", async () => {
    const added = await addWords(
      [
        { english: "plausible", translation: "правдоподобный", association: "sounds true; possible only could be", example: "The claim sounded plausible." },
        { english: "reconcile", translation: "сверять", example: "We reconciled the data.", form: "reconciled" },
        { english: "claim", translation: "утверждение", example: "Nothing here." },
      ],
      "manual",
    );
    expect(added).toMatchObject({ added: 3, cardsCreated: 2, exampleSkipped: ["claim"] });
    expect(await dueCards(10, new Date())).toEqual([]);
    const due = await dueCards(10, new Date(Date.now() + 24 * 3_600_000));
    expect(due.map((c) => c.prompt).sort()).toEqual(["The claim sounded ___.", "We ___ the data."]);
    expect(due.find((c) => c.answer === "plausible")?.hint).toBe("правдоподобный");
    expect(due.find((c) => c.answer === "plausible")?.association).toBe("sounds true; possible only could be");
  });

  it("fills a hook later without a second card, and lists words that still lack one", async () => {
    const result = await updateWords([{ english: "reconcile", association: "make two lists agree" }]);
    expect(result).toMatchObject({ updated: 1, cardsCreated: 0 });
    expect((await listWords({ withoutHook: true, limit: 10 })).map((w) => w.english)).toEqual(["claim"]);
  });
});

describe("the learning plan", () => {
  it("serves the defaults until the learner changes them", async () => {
    expect((await getPlan()).method).toBe(DEFAULT_METHOD);
    expect((await setPlan({ goal: "Pass a client call in English" })).goal).toBe("Pass a client call in English");
    expect((await getPlan()).method).toBe(DEFAULT_METHOD);
  });
});

describe("a sentence judged in conversation", () => {
  it("leaves errors, drill cards and a closed exercise", async () => {
    const recorded = await recordChatSentence(
      { direction: "ru_en", sourceText: "Он признал ошибку.", referenceText: "He admitted his mistake.", answerText: "He admitted fault." },
      {
        score: 3,
        summary: "Смысл ясен, слово выбрано неточно.",
        errors: [
          { category: "vocab", span: "fault", fix: "his mistake", note: "Ошибка здесь mistake.", drill_sentence: "She made a ___.", drill_answer: "mistake" },
        ],
        better_version: "He admitted his mistake.",
        patterns_held: [],
        words_used: [],
        words_missed: [],
      },
    );
    expect(recorded).toMatchObject({ errorsRecorded: 1, cardsCreated: 1 });
    expect(await justTaught(new Date())).toContain("plausible");
  });
});

describe("deleting words from the app", () => {
  it("removes a word together with its card", async () => {
    await addWords([{ english: "doomed", translation: "обречённый", example: "A doomed plan." }], "manual");
    const [word] = (await listWords({ limit: 500 })).filter((row) => row.english === "doomed");
    expect(await deleteWordsById([word!.id])).toBe(1);
    expect((await listWords({ limit: 500 })).some((row) => row.english === "doomed")).toBe(false);
    expect(await deleteWordsById([])).toBe(0);
  });
});
