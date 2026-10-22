import { describe, expect, it } from "vitest";

import { responseFormat, systemPrompt, translate, TranslateError } from "./translate";

const answer = {
  detected: "native",
  translation: "He refused to disclose the details.",
  alternatives: [],
  words: [{ word: "disclose", translation: "раскрывать", association: "dis- + close: open what was closed" }],
  note: "",
};

const ok = (body: unknown) => (async () => Response.json({ choices: [{ message: { content: JSON.stringify(body) } }] })) as typeof fetch;

describe("translate", () => {
  it("sends a strict json_schema request to an OpenAI-compatible endpoint and parses the answer", async () => {
    let sent: { url: string; init: RequestInit } | undefined;
    const fetcher = (async (url: string, init: RequestInit) => {
      sent = { url, init };
      return Response.json({ choices: [{ message: { content: JSON.stringify(answer) } }] });
    }) as unknown as typeof fetch;
    const result = await translate({ text: "Он отказался раскрыть детали.", native: "ru", target: "en", model: "openai/gpt-5-mini", apiKey: "k", fetcher });
    expect(result.translation).toBe("He refused to disclose the details.");
    expect(sent?.url).toBe("https://openrouter.ai/api/v1/chat/completions");
    const body = JSON.parse(String(sent?.init.body));
    expect(body.response_format.json_schema.strict).toBe(true);
    expect(body.response_format.json_schema.schema.required).toEqual(["detected", "translation", "alternatives", "words", "note"]);
    expect(body.reasoning).toEqual({ effort: "minimal" });
    expect((sent?.init.headers as Record<string, string>).Authorization).toBe("Bearer k");
  });

  it("does not ask a non-reasoning model for reasoning", async () => {
    let body: Record<string, unknown> = {};
    const fetcher = (async (_url: string, init: RequestInit) => {
      body = JSON.parse(String(init.body));
      return Response.json({ choices: [{ message: { content: JSON.stringify(answer) } }] });
    }) as unknown as typeof fetch;
    await translate({ text: "hi", native: "ru", target: "en", model: "openai/gpt-4.1-mini", apiKey: "k", fetcher });
    expect(body.reasoning).toBeUndefined();
  });

  it("refuses without a key, with empty or oversized text", async () => {
    const base = { native: "ru", target: "en", model: "m", fetcher: ok(answer) } as const;
    await expect(translate({ ...base, text: "hi", apiKey: undefined })).rejects.toMatchObject({ code: "no_key" });
    await expect(translate({ ...base, text: "  ", apiKey: "k" })).rejects.toMatchObject({ code: "empty" });
    await expect(translate({ ...base, text: "x".repeat(2001), apiKey: "k" })).rejects.toMatchObject({ code: "too_long" });
  });

  it("reports an unreadable model answer and an upstream refusal", async () => {
    const base = { text: "hi", native: "ru", target: "en", model: "m", apiKey: "k" } as const;
    await expect(translate({ ...base, fetcher: ok({ nonsense: true }) })).rejects.toBeInstanceOf(TranslateError);
    await expect(translate({ ...base, fetcher: ok({ nonsense: true }) })).rejects.toMatchObject({ code: "bad_output" });
    const refused = (async () => new Response("no credit", { status: 402 })) as unknown as typeof fetch;
    await expect(translate({ ...base, fetcher: refused })).rejects.toMatchObject({ code: "upstream" });
  });

  it("names both languages in the prompt", () => {
    expect(systemPrompt("ru", "en")).toContain("native language is Russian");
    expect(systemPrompt("ru", "en")).toContain("being learned is English");
    expect(responseFormat().json_schema.name).toBe("translation");
  });
});
