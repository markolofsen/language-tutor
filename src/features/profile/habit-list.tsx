import { Badge } from "@/ui";

import { CATEGORY_LABELS } from "@/domain/categories";
import type { LearnerContext } from "@/profile/context";

const STATUS_LABEL = { watch: "Watching", active: "Active", improving: "Improving" } as const;

export function HabitList({ patterns, resolved }: { patterns: LearnerContext["patterns"]; resolved: number }) {
  if (patterns.length === 0 && resolved === 0) {
    return <p className="text-sm text-base-content/60">No habits found yet. They show after a rule is missed again.</p>;
  }
  const rows = patterns.map((p) => (
    <li key={p.rule} className="flex items-baseline justify-between gap-3 text-sm">
      <span>
        {p.rule}
        <span className="ml-2 text-base-content/60">{CATEGORY_LABELS[p.category]}</span>
      </span>
      <Badge variant={p.status === "active" ? "default" : "outline"}>
        {STATUS_LABEL[p.status as keyof typeof STATUS_LABEL]} {p.misses}×{p.holdsSince > 0 ? ` · ${p.holdsSince} right` : ""}
      </Badge>
    </li>
  ));
  return (
    <div className="flex flex-col gap-2">
      <ul className="flex flex-col gap-2">{rows}</ul>
      {resolved > 0 ? <p className="text-sm text-base-content/60">{resolved} resolved</p> : null}
    </div>
  );
}
