import { Badge } from "@/ui";

import { listWords, wordCounts, type WordStatus } from "@/words/store";

export const dynamic = "force-dynamic";

const LIST_LIMIT = 300;
const STATUS_LABEL: Record<WordStatus, string> = { new: "New", learning: "Learning", known: "Known" };

export default async function WordsPage() {
  const counts = await wordCounts();
  const rows = (await listWords({ limit: LIST_LIMIT })).map((word) => (
    <li key={word.id} className="flex items-baseline justify-between gap-3 border-t border-base-300 py-2">
      <span>
        <span className="font-medium">{word.english}</span>
        <span className="ml-2 text-sm text-base-content/60">{word.translation}</span>
        {word.association ? <span className="block text-sm">{word.association}</span> : null}
      </span>
      <Badge variant={word.status === "known" ? "secondary" : "outline"}>
        {STATUS_LABEL[word.status]}
        {word.seen > 0 ? ` ${word.seen - word.missed}/${word.seen}` : ""}
      </Badge>
    </li>
  ));
  const summary = (Object.keys(STATUS_LABEL) as WordStatus[]).map((status) => (
    <span key={status}>
      {counts[status]} {STATUS_LABEL[status].toLowerCase()}
    </span>
  ));

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold">Words</h1>
      <p className="text-sm text-base-content/60">Read-only. Ask Claude to add or change words.</p>
      <p className="flex gap-4 text-sm text-base-content/60">{summary}</p>
      <ul>{rows}</ul>
    </div>
  );
}
