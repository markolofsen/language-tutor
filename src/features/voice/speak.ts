export function speak(text: string, voice: SpeechSynthesisVoice | undefined, rate = 1): void {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  const synth = window.speechSynthesis;
  synth.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = voice?.lang ?? "en-US";
  if (voice) utterance.voice = voice;
  utterance.rate = rate;
  synth.speak(utterance);
}
