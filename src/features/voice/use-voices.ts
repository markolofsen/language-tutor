"use client";

import { useEffect, useState } from "react";

/** Installed English voices. iOS fills the list after first paint, hence the event. */
export function useVoices(): SpeechSynthesisVoice[] {
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);

  useEffect(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    const synth = window.speechSynthesis;
    const read = () => setVoices(synth.getVoices().filter((v) => v.lang.toLowerCase().startsWith("en")));
    read();
    synth.addEventListener("voiceschanged", read);
    return () => synth.removeEventListener("voiceschanged", read);
  }, []);

  return voices;
}
