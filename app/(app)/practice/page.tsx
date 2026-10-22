import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/ui";
import { redirect } from "next/navigation";

import { PracticeModes } from "@/features/practice/modes";
import { nextExercise } from "@/practice/exercises";
import { routes } from "@/routes";

export const dynamic = "force-dynamic";

export default async function PracticePage() {
  const next = await nextExercise();
  if (next) redirect(routes.exercise(next.id));

  return (
    <div className="flex flex-col gap-6">
      <PracticeModes active="Paragraphs" />
      <Empty>
      <EmptyHeader>
        <EmptyTitle>No translation waiting</EmptyTitle>
        <EmptyDescription>
          Open Claude and say “start my English session” — it writes a story from your words and queues the exercises.
        </EmptyDescription>
      </EmptyHeader>
      </Empty>
    </div>
  );
}
