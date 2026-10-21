import { ACCENTS, type AccentTag } from "@/domain/accents";

const normalise = (lang: string) => lang.replace("_", "-");

function quality(voice: SpeechSynthesisVoice): number {
  if (/premium/i.test(voice.name)) return 2;
  if (/enhanced/i.test(voice.name)) return 1;
  return 0;
}

/** The best installed voice for an accent, or undefined when the device has none. */
export function pickVoice(voices: SpeechSynthesisVoice[], tag: AccentTag): SpeechSynthesisVoice | undefined {
  return voices
    .filter((v) => normalise(v.lang) === tag)
    .sort((a, b) => quality(b) - quality(a))[0];
}

export function availableAccents(voices: SpeechSynthesisVoice[]): AccentTag[] {
  return ACCENTS.filter((a) => pickVoice(voices, a.tag)).map((a) => a.tag);
}
