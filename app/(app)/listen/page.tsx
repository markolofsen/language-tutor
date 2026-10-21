import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/ui";

import { Dictation } from "@/features/listening/dictation";
import { accentSummaries, pickClip } from "@/listening/dictation";

export const dynamic = "force-dynamic";

export default async function ListenPage() {
  const clip = await pickClip();

  if (!clip) {
    return (
      <Empty>
        <EmptyHeader>
          <EmptyTitle>No clips yet</EmptyTitle>
          <EmptyDescription>Dictation uses sentences from your stories. Ask Claude for a story first.</EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold">Listen and type</h1>
      <Dictation key={clip} text={clip} summaries={await accentSummaries()} />
    </div>
  );
}
