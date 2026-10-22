import { Badge, Button } from "@/ui";
import Link from "next/link";

import { CATEGORY_LABELS } from "@/domain/categories";
import { nextAction } from "@/features/today/next-action";
import { learnerContext } from "@/profile/context";
import { routes } from "@/routes";

export const dynamic = "force-dynamic";

export default async function TodayPage() {
  const context = await learnerContext(new Date());
  const action = nextAction(context);
  const focus = context.focusCategories.map((c) => (
    <Badge key={c} variant="secondary">
      {CATEGORY_LABELS[c]}
    </Badge>
  ));
  const cta = action.href ? (
    <Button asChild size="lg">
      <Link href={action.href}>Start</Link>
    </Button>
  ) : null;
  const focusBlock =
    focus.length > 0 ? (
      <section className="flex flex-col gap-2">
        <h2 className="section-title">Working on</h2>
        <div className="flex flex-wrap gap-2">{focus}</div>
      </section>
    ) : null;

  const stats = (
    [
      ["new", context.words.new, "text-info"],
      ["learning", context.words.learning, "text-warning"],
      ["known", context.words.known, "text-success"],
    ] as const
  ).map(([label, value, tone]) => (
    <span key={label} className="flex flex-col">
      <span className={`text-3xl font-bold tabular-nums ${tone}`}>{value}</span>
      <span className="section-title">{label}</span>
    </span>
  ));
  const quick = action.href ? null : (
    <div className="grid grid-cols-2 gap-3">
      <Button asChild variant="outline" size="lg">
        <Link href={routes.translate}>Translate</Link>
      </Button>
      <Button asChild variant="outline" size="lg">
        <Link href={routes.listen}>Dictation</Link>
      </Button>
    </div>
  );

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-1">
        <h1 className="text-3xl">{action.title}</h1>
        <p className="text-base-content/70">{action.detail}</p>
      </header>
      {cta}
      {focusBlock}
      {quick}
      <Link href={routes.words} className="panel grid grid-cols-3 text-center transition-colors hover:border-primary/50" aria-label="Open Words">
        {stats}
      </Link>
    </div>
  );
}
