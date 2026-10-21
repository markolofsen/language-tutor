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
        <h2 className="text-sm font-medium text-base-content/60">Working on</h2>
        <div className="flex flex-wrap gap-2">{focus}</div>
      </section>
    ) : null;

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-1">
        <h1 className="text-3xl font-semibold">{action.title}</h1>
        <p className="text-base-content/60">{action.detail}</p>
      </header>
      {cta}
      {focusBlock}
      <p className="text-sm text-base-content/60">
        <Link href={routes.words} className="underline-offset-4 hover:underline">
          {context.words.known} known · {context.words.learning} learning · {context.words.new} new
        </Link>
      </p>
    </div>
  );
}
