import { Badge } from "@/ui";

import { CATEGORY_LABELS } from "@/domain/categories";
import type { ErrorRow } from "@/practice/attempts";

export function ErrorItem({ error }: { error: ErrorRow }) {
  return (
    <li className="flex flex-col gap-1 border-t border-base-300 pt-3 first:border-t-0 first:pt-0">
      <Badge variant="secondary" className="w-fit">
        {CATEGORY_LABELS[error.category]}
      </Badge>
      <p className="text-base">
        <span className="text-base-content/60 line-through">{error.span}</span>
        <span aria-hidden> → </span>
        <span className="sr-only"> corrected to </span>
        <span className="font-medium">{error.fix}</span>
      </p>
      <p className="text-sm text-base-content/60">{error.note}</p>
    </li>
  );
}
