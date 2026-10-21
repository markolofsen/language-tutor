import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

import { learnerContext, recentErrors } from "@/profile/context";
import { setPlan } from "@/profile/plan";

import { ok } from "./result";

export function registerProfileTools(server: McpServer): void {
  server.registerTool(
    "get_learner_context",
    {
      title: "Learner context",
      description:
        "Call first in every session. The learning goal and the agreed method (follow them; do not invent another format). Counts of words, due cards and open exercises; the two focus error categories; accuracy over the last 20 judged attempts; advised paragraph length; saved words to practise; recent errors; listening record per accent.",
      inputSchema: z.object({}),
    },
    async () => ok(await learnerContext(new Date())),
  );

  server.registerTool(
    "get_profile",
    {
      title: "Error profile",
      description: "Weighted error categories (recent errors count more) and the latest errors with their fixes.",
      inputSchema: z.object({ limit: z.number().int().min(1).max(100).default(25) }),
    },
    async ({ limit }) => {
      const now = new Date();
      const [context, errs] = await Promise.all([learnerContext(now), recentErrors(now, limit)]);
      return ok({
        categoryWeights: context.categoryWeights,
        accuracyLast20: context.accuracyLast20,
        listeningByAccent: context.listeningByAccent,
        recentErrors: errs.map((e) => ({
          category: e.category,
          span: e.span,
          fix: e.fix,
          note: e.note,
          at: e.createdAt,
        })),
      });
    },
  );

  server.registerTool(
    "set_learning_plan",
    {
      title: "Set goal or method",
      description:
        "Change the learning goal and/or the agreed method. Only after the learner agrees to the change in this conversation; send the full new text, it replaces the old one. Both come back in get_learner_context.",
      inputSchema: z.object({ goal: z.string().optional(), method: z.string().optional() }),
    },
    async ({ goal, method }) => ok(await setPlan({ ...(goal ? { goal } : {}), ...(method ? { method } : {}) })),
  );
}
