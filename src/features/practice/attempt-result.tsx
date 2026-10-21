import { Button } from "@/ui";
import Link from "next/link";

import type { AttemptView } from "@/practice/attempts";
import { routes } from "@/routes";

import { SpeakButton } from "../voice/speak-button";
import { ErrorItem } from "./error-item";

const DETAILED_ERRORS = 2;

type Props = { view: AttemptView; english: boolean };

export function AttemptResult({ view, english }: Props) {
  const { attempt, errors } = view;
  const own = (
    <section className="flex flex-col gap-1">
      <h2 className="text-sm font-medium text-base-content/60">Your answer</h2>
      <p className="whitespace-pre-wrap text-base">{attempt.answerText}</p>
    </section>
  );

  if (attempt.status === "pending") {
    return (
      <div className="flex flex-col gap-6">
        {own}
        <p className="rounded-[var(--radius)] bg-base-200 p-4 text-sm">
          Sent. Claude judges it in your next session — ask Claude to check your answers.
        </p>
        <Button asChild size="lg">
          <Link href={routes.practice}>Next exercise</Link>
        </Button>
      </div>
    );
  }

  const detailed = errors.slice(0, DETAILED_ERRORS).map((e) => <ErrorItem key={e.id} error={e} />);
  const rest = errors.slice(DETAILED_ERRORS).map((e) => <ErrorItem key={e.id} error={e} />);
  const more =
    rest.length > 0 ? (
      <details className="text-sm">
        <summary className="cursor-pointer text-base-content/60">{rest.length} more</summary>
        <ul className="mt-3 flex flex-col gap-3">{rest}</ul>
      </details>
    ) : null;
  const listen = english && attempt.betterVersion ? <SpeakButton text={attempt.betterVersion} /> : null;

  return (
    <div className="flex flex-col gap-6">
      <section className="flex items-baseline gap-3">
        <span className="flex shrink-0 items-baseline gap-1 whitespace-nowrap">
          <span className="text-4xl font-semibold tabular-nums">{attempt.score}</span>
          <span className="text-base-content/60">/ 5</span>
        </span>
        <p className="text-sm">{attempt.summary}</p>
      </section>
      {own}
      <section className="flex flex-col gap-1">
        <h2 className="flex items-center gap-1 text-sm font-medium text-base-content/60">
          More natural {listen}
        </h2>
        <p className="text-base">{attempt.betterVersion}</p>
      </section>
      <ul className="flex flex-col gap-3">{detailed}</ul>
      {more}
      <Button asChild size="lg">
        <Link href={routes.practice}>Next exercise</Link>
      </Button>
    </div>
  );
}
