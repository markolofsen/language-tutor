import { WordList } from "@/features/words/word-list";
import { listWords, wordCounts, type WordStatus } from "@/words/store";

export const dynamic = "force-dynamic";

const STATUSES: WordStatus[] = ["new", "learning", "known"];

export default async function WordsPage() {
  const counts = await wordCounts();
  const items = (await listWords({ limit: 5000 })).map(({ id, english, translation, association, status, seen, missed }) => ({
    id,
    english,
    translation,
    association,
    status,
    seen,
    missed,
  }));
  const summary = STATUSES.map((status) => (
    <span key={status}>
      {counts[status]} {status}
    </span>
  ));

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-semibold">Words</h1>
      <p className="flex gap-4 text-sm text-base-content/60">{summary}</p>
      <WordList items={items} />
    </div>
  );
}
