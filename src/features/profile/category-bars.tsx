import { CATEGORY_LABELS } from "@/domain/categories";
import type { CategoryWeight } from "@/profile/weights";

export function CategoryBars({ weights }: { weights: CategoryWeight[] }) {
  const top = weights[0]?.weight ?? 1;
  const rows = weights.map((w) => (
    <li key={w.category} className="flex flex-col gap-1">
      <div className="flex justify-between text-sm">
        <span>{CATEGORY_LABELS[w.category]}</span>
        <span className="text-base-content/70 tabular-nums">{w.count}</span>
      </div>
      <div className="h-2 rounded-full bg-base-200" role="img" aria-label={`${CATEGORY_LABELS[w.category]}: ${w.count} errors`}>
        <div className="h-2 rounded-full bg-primary" style={{ width: `${Math.max(6, (w.weight / top) * 100)}%` }} />
      </div>
    </li>
  ));
  return <ul className="flex flex-col gap-3">{rows}</ul>;
}
