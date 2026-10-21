import { Badge } from "@/ui";
import { notFound } from "next/navigation";

import { AnswerForm } from "@/features/practice/answer-form";
import { AttemptResult } from "@/features/practice/attempt-result";
import { SpeakButton } from "@/features/voice/speak-button";
import { latestAttempt } from "@/practice/attempts";
import { getExercise, targetsOf } from "@/practice/exercises";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ exerciseId: string }> };

export default async function ExercisePage({ params }: Props) {
  const { exerciseId } = await params;
  const id = Number(exerciseId);
  if (!Number.isInteger(id)) notFound();
  const exercise = await getExercise(id);
  if (!exercise) notFound();

  const toEnglish = exercise.direction === "ru_en";
  const view = await latestAttempt(id);
  const targets = toEnglish ? await targetsOf(exercise.storyId) : [];
  const chips = toEnglish
    ? targets.map((t) => (
        <Badge key={t.english} variant="outline">
          {t.english}
        </Badge>
      ))
    : [];
  const listen = toEnglish ? null : <SpeakButton text={exercise.sourceText} />;
  const action = view ? (
    <AttemptResult view={view} english={toEnglish} />
  ) : (
    <AnswerForm exerciseId={id} language={toEnglish ? "English" : "Russian"} />
  );

  return (
    <div className="flex flex-col gap-6">
      <header className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">{toEnglish ? "Russian → English" : "English → Russian"}</h1>
        {listen}
      </header>
      <p className="whitespace-pre-wrap text-lg leading-relaxed">{exercise.sourceText}</p>
      <div className="flex flex-wrap gap-2" aria-label="Words to use">
        {chips}
      </div>
      {action}
    </div>
  );
}
