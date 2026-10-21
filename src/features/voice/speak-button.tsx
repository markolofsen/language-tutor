"use client";

import { Button } from "@/ui";
import { Volume2 } from "lucide-react";

import type { AccentTag } from "@/domain/accents";

import { pickVoice } from "./accents";
import { speak } from "./speak";
import { useVoices } from "./use-voices";

type Props = { text: string; label?: string; accent?: AccentTag };

export function SpeakButton({ text, label = "Listen", accent = "en-US" }: Props) {
  const voices = useVoices();
  const onSpeak = () => speak(text, pickVoice(voices, accent));
  return (
    <Button type="button" variant="ghost" size="icon" aria-label={label} onClick={onSpeak}>
      <Volume2 aria-hidden />
    </Button>
  );
}
