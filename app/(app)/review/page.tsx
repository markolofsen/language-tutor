import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/ui";

import { ReviewDeck } from "@/features/review/review-deck";
import { dueCards } from "@/review/cards";

export const dynamic = "force-dynamic";

const DECK_SIZE = 10;

export default async function ReviewPage() {
  const cards = (await dueCards(DECK_SIZE, new Date())).map((c) => ({
    cardId: c.id,
    prompt: c.prompt,
    answer: c.answer,
    hint: c.hint,
    association: c.association,
  }));

  if (cards.length === 0) {
    return (
      <Empty>
        <EmptyHeader>
          <EmptyTitle>Nothing due</EmptyTitle>
          <EmptyDescription>Cards come back when their time has come.</EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  return <ReviewDeck cards={cards} />;
}
