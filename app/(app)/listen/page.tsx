import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/ui";

import { PracticeModes } from "@/features/practice/modes";
import { Dictation } from "@/features/listening/dictation";
import { accentSummaries, pickClip } from "@/listening/dictation";

export const dynamic = "force-dynamic";

export default async function ListenPage() {
  const clip = await pickClip();

  if (!clip) {
    return (
      <div className="flex flex-col gap-6">
        <PracticeModes active="Dictation" />
        <Empty>
          <EmptyHeader>
            <EmptyTitle>No clips yet</EmptyTitle>
            <EmptyDescription>Dictation uses sentences from your stories. Ask Claude for a story first.</EmptyDescription>
          </EmptyHeader>
        </Empty>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <PracticeModes active="Dictation" />
      <Dictation key={clip} text={clip} summaries={await accentSummaries()} />
    </div>
  );
}
