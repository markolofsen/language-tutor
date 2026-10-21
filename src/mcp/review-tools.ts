import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

import { dueCards, gradeCard } from "@/review/cards";

import { fail, ok } from "./result";

export function registerReviewTools(server: McpServer): void {
  server.registerTool(
    "get_due_cards",
    {
      title: "Cards due now",
      description:
        "Cards whose review time has come. `prompt` has ___ for the missing word; `answer` is what fills it; `hint` is a translation or the rule; `association` is the word's memory hook. Ask the learner first, then reveal answer and hook.",
      inputSchema: z.object({ limit: z.number().int().min(1).max(30).default(10) }),
    },
    async ({ limit }) =>
      ok(
        (await dueCards(limit, new Date())).map((c) => ({
          cardId: c.id,
          kind: c.kind,
          prompt: c.prompt,
          answer: c.answer,
          hint: c.hint,
          association: c.association,
        })),
      ),
  );

  server.registerTool(
    "grade_card",
    {
      title: "Grade a card",
      description: "Report the outcome of a review: missed=true if the learner could not produce the answer.",
      inputSchema: z.object({ card_id: z.number().int(), missed: z.boolean() }),
    },
    async ({ card_id, missed }) => {
      const result = await gradeCard(card_id, missed, new Date());
      return result ? ok(result) : fail(`card ${card_id} does not exist`);
    },
  );
}
