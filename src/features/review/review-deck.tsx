"use client";

import { Button } from "@/ui";
import Link from "next/link";
import { useState, useTransition } from "react";

import { fillCloze } from "@/domain/story";
import { routes } from "@/routes";

import { SpeakButton } from "../voice/speak-button";
import { gradeCardAction } from "./actions";

export type DeckCard = { cardId: number; prompt: string; answer: string; hint: string; association: string };

type Phase = "prompt" | "revealed";

export function ReviewDeck({ cards }: { cards: DeckCard[] }) {
  const [index, setIndex] = useState(0);
  const [phase, setPhase] = useState<Phase>("prompt");
  const [pending, startTransition] = useTransition();
  const card = cards[index];

  if (!card) {
    return (
      <div className="flex flex-col gap-4">
        <p className="text-lg">Done — {cards.length} reviewed.</p>
        <Button asChild size="lg">
          <Link href={routes.practice}>Translate next</Link>
        </Button>
      </div>
    );
  }

  const grade = (missed: boolean) =>
    startTransition(async () => {
      await gradeCardAction(card.cardId, missed);
      setIndex((current) => current + 1);
      setPhase("prompt");
    });

  const [before = "", after = ""] = card.prompt.split("___");
  const blank =
    phase === "revealed" ? (
      <strong className="text-primary">{card.answer}</strong>
    ) : (
      <span className="inline-block min-w-16 border-b-2 border-base-content align-baseline" aria-label="blank" />
    );
  const controls =
    phase === "prompt" ? (
      <Button size="lg" onClick={() => setPhase("revealed")}>
        Show answer
      </Button>
    ) : (
      <div className="grid grid-cols-2 gap-3">
        <Button size="lg" variant="outline" loading={pending} onClick={() => grade(true)}>
          Missed
        </Button>
        <Button size="lg" loading={pending} onClick={() => grade(false)}>
          Got it
        </Button>
      </div>
    );
  const listen = phase === "revealed" ? <SpeakButton text={fillCloze(card.prompt, card.answer)} /> : null;

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center gap-3">
        <progress className="progress progress-primary h-1.5 flex-1" value={index} max={cards.length} aria-label="Progress" />
        <span className="text-sm text-base-content/70 tabular-nums">
          {index + 1} / {cards.length}
        </span>
      </div>
      <p className="text-2xl leading-relaxed">
        {before}
        {blank}
        {after}
      </p>
      <p className="flex items-center gap-1 text-lg text-base-content/70">
        {card.hint}
        {listen}
      </p>
      {phase === "revealed" && card.association ? (
        <p className="text-sm">
          <span className="text-base-content/70">Hook: </span>
          {card.association}
        </p>
      ) : null}
      {controls}
    </div>
  );
}
