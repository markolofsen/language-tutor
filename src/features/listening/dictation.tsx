"use client";

import { Button, Textarea } from "@/ui";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { accentLabel } from "@/domain/accents";
import { chooseAccent } from "@/listening/choose-accent";
import type { AccentSummary } from "@/listening/dictation";
import type { WordDiff } from "@/listening/word-diff";

import { availableAccents, pickVoice } from "../voice/accents";
import { speak } from "../voice/speak";
import { useVoices } from "../voice/use-voices";
import { checkDictationAction } from "./actions";
import { DiffView } from "./diff-view";

const SLOW_RATE = 0.7;

type Props = { text: string; summaries: AccentSummary[] };

export function Dictation({ text, summaries }: Props) {
  const router = useRouter();
  const voices = useVoices();
  const [typed, setTyped] = useState("");
  const [diff, setDiff] = useState<WordDiff | null>(null);
  const [pending, startTransition] = useTransition();

  const accent = chooseAccent(availableAccents(voices), summaries);
  

  if (!accent) {
    return (
      <p className="text-sm text-base-content/60">
        No English voice found. On iPhone add one in Settings → Accessibility → Spoken Content → Voices.
      </p>
    );
  }

  const voice = pickVoice(voices, accent);

  const check = () =>
    startTransition(async () => {
      setDiff(await checkDictationAction(accent, text, typed));
    });
  const next = () => {
    setTyped("");
    setDiff(null);
    router.refresh();
  };

  const body = diff ? (
    <>
      <DiffView diff={diff} accent={accentLabel(accent)} />
      <div className="grid grid-cols-2 gap-3">
        <Button variant="outline" onClick={() => speak(text, voice)}>
          Hear it again
        </Button>
        <Button onClick={next}>Next clip</Button>
      </div>
    </>
  ) : (
    <>
      <Textarea
        value={typed}
        onChange={(event) => setTyped(event.target.value)}
        rows={4}
        spellCheck={false}
        autoCapitalize="none"
        aria-label="What did you hear?"
        placeholder="Type what you hear"
        className="text-base"
      />
      <Button size="lg" loading={pending} disabled={!typed.trim()} onClick={check}>
        Check
      </Button>
    </>
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-2 gap-3">
        <Button size="lg" onClick={() => speak(text, voice)}>
          Play
        </Button>
        <Button size="lg" variant="outline" onClick={() => speak(text, voice, SLOW_RATE)}>
          Slower
        </Button>
      </div>
      {body}
    </div>
  );
}
