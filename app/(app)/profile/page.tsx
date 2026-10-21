import { accentLabel } from "@/domain/accents";
import { ConnectAssistants } from "@/features/profile/connect-assistants";
import { HabitList } from "@/features/profile/habit-list";
import { CategoryBars } from "@/features/profile/category-bars";
import { ErrorItem } from "@/features/practice/error-item";
import { learnerContext, recentErrors } from "@/profile/context";

export const dynamic = "force-dynamic";

const ERROR_LIMIT = 10;

export default async function ProfilePage() {
  const now = new Date();
  const context = await learnerContext(now);
  const share = context.accuracyLast20;
  const accuracy = share === null ? "Not enough answers yet" : `${Math.round(share * 100)}% of the last answers scored 4 or 5`;
  const errors = (await recentErrors(now, ERROR_LIMIT)).map((e) => <ErrorItem key={e.id} error={e} />);
  const accents = context.listeningByAccent.map((a) => (
    <li key={a.accent} className="flex justify-between text-sm">
      <span>{accentLabel(a.accent)}</span>
      <span className="text-base-content/60 tabular-nums">
        {Math.round(a.heardShare * 100)}% of words · {a.clips} clips
      </span>
    </li>
  ));
  const listening =
    accents.length > 0 ? (
      <ul className="flex flex-col gap-2">{accents}</ul>
    ) : (
      <p className="text-sm text-base-content/60">No dictations yet.</p>
    );
  const weights =
    context.categoryWeights.length > 0 ? (
      <CategoryBars weights={context.categoryWeights} />
    ) : (
      <p className="text-sm text-base-content/60">No errors recorded in the last four weeks.</p>
    );

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-1">
        <h1 className="text-xl font-semibold">Profile</h1>
        <p className="text-sm text-base-content/60">{accuracy}</p>
      </header>
      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-medium text-base-content/60">Where errors come from</h2>
        {weights}
      </section>
      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-medium text-base-content/60">Habits</h2>
        <HabitList patterns={context.patterns} resolved={context.resolvedPatterns.length} />
      </section>
      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-medium text-base-content/60">Latest errors</h2>
        <ul className="flex flex-col gap-3">{errors}</ul>
      </section>
      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-medium text-base-content/60">Listening by accent</h2>
        {listening}
      </section>
      <ConnectAssistants />
    </div>
  );
}
