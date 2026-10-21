import type { WordDiff } from "@/listening/word-diff";

export function DiffView({ diff, accent }: { diff: WordDiff; accent: string }) {
  const words = diff.tokens.map((token, index) => (
    <span
      key={`${token.word}-${index}`}
      className={token.ok ? "" : "rounded bg-error/15 px-0.5 text-error underline decoration-wavy"}
    >
      {token.word}{" "}
    </span>
  ));
  return (
    <section className="flex flex-col gap-2" aria-live="polite">
      <p className="text-sm text-base-content/60">
        {accent} accent · heard {diff.ok} of {diff.tokens.length}
      </p>
      <p className="text-lg leading-relaxed">{words}</p>
    </section>
  );
}
