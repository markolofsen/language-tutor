"use client";

import { Button } from "@/ui";
import { useState } from "react";

type Props = { text: string; label: string };

export function CopyButton({ text, label }: Props) {
  const [done, setDone] = useState(false);
  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setDone(true);
      setTimeout(() => setDone(false), 2000);
    } catch {
      setDone(false);
    }
  };
  return (
    <Button type="button" variant="outline" size="sm" onClick={onCopy}>
      {done ? "Copied" : label}
    </Button>
  );
}
