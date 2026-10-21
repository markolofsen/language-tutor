import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

import { evaluationSchema } from "@/domain/evaluation";
import { listPending } from "@/practice/attempts";
import { EvaluationRejected, recordEvaluation, type EvaluationTarget } from "@/practice/record-evaluation";
import { getExercise } from "@/practice/exercises";
import { recordChatSentence } from "@/practice/record-chat";

import { fail, ok } from "./result";

const recordInput = z.object({
  attempt_id: z.number().int().optional().describe("A pending attempt from list_pending_attempts."),
  exercise_id: z.number().int().optional().describe("For an answer given in conversation: the exercise it answers."),
  answer_text: z.string().optional().describe("The learner's answer, verbatim, when exercise_id is used."),
  evaluation: evaluationSchema,
});

async function resolveTarget(input: z.infer<typeof recordInput>): Promise<EvaluationTarget | string> {
  if (input.attempt_id !== undefined) return { kind: "pending", attemptId: input.attempt_id };
  if (input.exercise_id !== undefined && input.answer_text) {
    if (!(await getExercise(input.exercise_id))) return `exercise ${input.exercise_id} does not exist`;
    return { kind: "spoken", exerciseId: input.exercise_id, answerText: input.answer_text };
  }
  return "give attempt_id, or exercise_id together with answer_text";
}

export function registerPracticeTools(server: McpServer): void {
  server.registerTool(
    "list_pending_attempts",
    {
      title: "Answers waiting for judgement",
      description: "Translations the learner typed in the phone app that no one has judged yet, with the reference text.",
      inputSchema: z.object({ limit: z.number().int().min(1).max(20).default(5) }),
    },
    async ({ limit }) => ok(await listPending(limit)),
  );

  server.registerTool(
    "record_evaluation",
    {
      title: "Record a judgement",
      description:
        "Store your judgement of a translation: score, errors by category, a better version. Each error becomes a drill card scheduled by spaced repetition. Use attempt_id for an answer typed in the app, or exercise_id plus answer_text for one given in conversation.",
      inputSchema: recordInput,
    },
    async (input) => {
      const target = await resolveTarget(input);
      if (typeof target === "string") return fail(target);
      try {
        return ok(await recordEvaluation(target, input.evaluation));
      } catch (error) {
        if (error instanceof EvaluationRejected) return fail(error.message);
        throw error;
      }
    },
  );

  server.registerTool(
    "record_chat_sentence",
    {
      title: "Record a sentence translated in conversation",
      description:
        "Use for a sentence you set in conversation (not from next_exercise): store the task, the learner's answer verbatim and your judgement. Its errors become drill cards and feed the error profile; without this call a chat session leaves no trace. Use record_evaluation for app exercises.",
      inputSchema: z.object({
        direction: z.enum(["ru_en", "en_ru"]),
        source_text: z.string().min(1).describe("The sentence the learner was given."),
        reference_text: z.string().min(1).describe("The natural translation."),
        answer_text: z.string().min(1).describe("The learner's answer, verbatim."),
        evaluation: evaluationSchema,
      }),
    },
    async (input) => {
      try {
        return ok(
          await recordChatSentence(
            {
              direction: input.direction,
              sourceText: input.source_text,
              referenceText: input.reference_text,
              answerText: input.answer_text,
            },
            input.evaluation,
          ),
        );
      } catch (error) {
        if (error instanceof EvaluationRejected) return fail(error.message);
        throw error;
      }
    },
  );
}
