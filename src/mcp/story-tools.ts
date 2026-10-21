import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

import { storySchema } from "@/domain/story";
import { nextExercise, targetsOf } from "@/practice/exercises";
import { createStory } from "@/stories/create-story";

import { ok } from "./result";
import { z } from "zod";

export function registerStoryTools(server: McpServer): void {
  server.registerTool(
    "create_story",
    {
      title: "Create a story",
      description:
        "Store a paragraph written around saved words. Creates one cloze card per target and two exercises: Russian to English and English to Russian. Every target sentence must be copied verbatim from text_en.",
      inputSchema: storySchema,
    },
    async (story) => ok(await createStory(story)),
  );

  server.registerTool(
    "next_exercise",
    {
      title: "Next exercise",
      description: "The oldest exercise the learner has not answered yet, with the words it was written around.",
      inputSchema: z.object({}),
    },
    async () => {
      const exercise = await nextExercise();
      if (!exercise) return ok({ exercise: null, hint: "No open exercise. Write a story with create_story." });
      return ok({
        exerciseId: exercise.id,
        direction: exercise.direction,
        sourceText: exercise.sourceText,
        referenceText: exercise.referenceText,
        targets: await targetsOf(exercise.storyId),
      });
    },
  );
}
