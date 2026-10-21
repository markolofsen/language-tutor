import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

import { TUTOR_INSTRUCTIONS } from "./instructions";
import { registerPracticeTools } from "./practice-tools";
import { registerProfileTools } from "./profile-tools";
import { registerReviewTools } from "./review-tools";
import { registerStoryTools } from "./story-tools";
import { registerWordTools } from "./words-tools";

/** A fresh server per request: the transport is stateless, the database is the only state. */
export function createMcpServer(): McpServer {
  const server = new McpServer({ name: "english", version: "0.1.0" }, { instructions: TUTOR_INSTRUCTIONS });
  registerProfileTools(server);
  registerWordTools(server);
  registerStoryTools(server);
  registerPracticeTools(server);
  registerReviewTools(server);

  server.registerPrompt(
    "session",
    {
      title: "Start a tutoring session",
      description: "Run one English session of N minutes with the saved words and the error profile.",
      argsSchema: { minutes: z.string().optional() },
    },
    ({ minutes }) => ({
      messages: [
        {
          role: "user",
          content: {
            type: "text",
            text: `Start my English session (${minutes ?? "45"} minutes). Call get_learner_context, then follow your method: due cards, judge any pending answers, translation exercises, a new story when none is open.`,
          },
        },
      ],
    }),
  );

  return server;
}
