import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

import { parseWordLines } from "@/words/parse-import";
import { addWords, listWords, removeWords, updateWords } from "@/words/store";

import { ok } from "./result";
import { WORD_RULES } from "./word-rules";

const hookFields = {
  association: z.string().optional().describe("Memory hook: one short line (sound-alike, known English word or meaning image). Omit when none is natural."),
  example: z.string().optional().describe("One sentence that uses the word; it becomes a review card."),
  form: z.string().optional().describe("The word exactly as it appears in `example`, when inflected."),
};

const wordInput = z.object({
  english: z.string().min(1),
  translation: z.string().default(""),
  ...hookFields,
});

export function registerWordTools(server: McpServer): void {
  server.registerTool(
    "add_words",
    {
      title: "Save words",
      description:
        `Save words the learner collected (for example pasted from Google Translate Saved). Give \`text\` with one word per line, optionally with a Russian translation after a tab, semicolon or dash, and/or \`words\`. Duplicates are merged; a missing translation, hook or example is filled in when known. The result reports cards created and examples that did not contain the word. Clean the words first. Rules: ${WORD_RULES}`,
      inputSchema: z.object({
        text: z.string().optional(),
        words: z.array(wordInput).max(500).optional(),
      }),
    },
    async ({ text, words }) => {
      const items = [...(text ? parseWordLines(text) : []), ...(words ?? [])];
      return ok(await addWords(items, "import"));
    },
  );

  server.registerTool(
    "list_words",
    {
      title: "List saved words",
      description:
        "Saved words, newest first, with their hook, example and results (seen, missed). Use it to show the word table. Optional filters: status (new, learning, known); `without_hook` lists words that still need a memory hook, most missed first.",
      inputSchema: z.object({
        status: z.enum(["new", "learning", "known"]).optional(),
        without_hook: z.boolean().optional(),
        limit: z.number().int().min(1).max(200).default(50),
      }),
    },
    async ({ status, without_hook, limit }) =>
      ok(
        (await listWords({ limit, ...(status ? { status } : {}), ...(without_hook ? { withoutHook: true } : {}) })).map((w) => ({
          english: w.english,
          translation: w.translation,
          association: w.association,
          example: w.example,
          status: w.status,
          seen: w.seen,
          missed: w.missed,
        })),
      ),
  );

  server.registerTool(
    "update_words",
    {
      title: "Fix saved words",
      description: `Correct saved words: a misspelled English side (\`new_english\`) and/or the Russian gloss (\`translation\`). A rename onto an existing word is refused (use remove_words for the duplicate). Rules for a clean dictionary: ${WORD_RULES}`,
      inputSchema: z.object({
        words: z
          .array(
            z.object({
              english: z.string().min(1).describe("The word as it is saved now."),
              new_english: z.string().min(1).optional(),
              translation: z.string().optional(),
              ...hookFields,
            }),
          )
          .min(1)
          .max(300),
      }),
    },
    async ({ words }) =>
      ok(
        await updateWords(
          words.map((w) => ({
            english: w.english,
            newEnglish: w.new_english,
            translation: w.translation,
            association: w.association,
            example: w.example,
            form: w.form,
          })),
        ),
      ),
  );

  server.registerTool(
    "remove_words",
    {
      title: "Remove saved words",
      description:
        "Delete saved words that are wrong or duplicated. A word that already has a story or a card is kept and reported as inUse, so no practice history is lost.",
      inputSchema: z.object({ words: z.array(z.string().min(1)).min(1).max(300) }),
    },
    async ({ words }) => ok(await removeWords(words)),
  );
}
