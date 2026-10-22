"use client";

import { Languages, X } from "lucide-react";
import Link from "next/link";
import { useRef, useState, useTransition } from "react";

import { LANGUAGES, type LanguageCode } from "@/domain/languages";
import { routes } from "@/routes";
import { Badge, Button, Textarea } from "@/ui";

import { SpeakButton } from "../voice/speak-button";
import { saveTranslationAction } from "./actions";

type Word = { word: string; translation: string; association: string; saved: boolean };
type Result = {
  detected: "native" | "target" | "other";
  translation: string;
  alternatives: { text: string; note: string }[];
  words: Word[];
  note: string;
};
type Problem = { code: string; message: string };

const DEBOUNCE_MS = 500;
const PHRASE_MAX_WORDS = 8;

type Props = { native: LanguageCode; target: LanguageCode; hasKey: boolean };

export function Translator({ native, target, hasKey }: Props) {
  const [text, setText] = useState("");
  const [source, setSource] = useState("");
  const [result, setResult] = useState<Result | null>(null);
  const [problem, setProblem] = useState<Problem | null>(null);
  const [busy, setBusy] = useState(false);
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const [phrase, setPhrase] = useState(false);
  const [summary, setSummary] = useState<string | null>(null);
  const [saving, startSaving] = useTransition();
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const controller = useRef<AbortController | undefined>(undefined);

  const run = async (value: string) => {
    controller.current?.abort();
    const abort = new AbortController();
    controller.current = abort;
    setBusy(true);
    setProblem(null);
    try {
      const response = await fetch("/api/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: value }),
        signal: abort.signal,
      });
      const body = await response.json();
      if (!response.ok) {
        setProblem({ code: body.error ?? "upstream", message: body.message ?? "Translation failed." });
        setResult(null);
        return;
      }
      const data = body as Result;
      setResult(data);
      setSource(value);
      setPicked(new Set(data.words.filter((w) => !w.saved).map((w) => w.word)));
      setPhrase(false);
      setSummary(null);
    } catch (error) {
      if ((error as Error).name !== "AbortError") setProblem({ code: "network", message: "No connection." });
    } finally {
      if (controller.current === abort) setBusy(false);
    }
  };

  const onChange = (value: string) => {
    setText(value);
    clearTimeout(timer.current);
    if (!value.trim()) {
      controller.current?.abort();
      setResult(null);
      setProblem(null);
      setBusy(false);
      return;
    }
    timer.current = setTimeout(() => void run(value.trim()), DEBOUNCE_MS);
  };

  const clear = () => onChange("");

  const toggle = (word: string) =>
    setPicked((current) => {
      const next = new Set(current);
      if (next.has(word)) next.delete(word);
      else next.add(word);
      return next;
    });

  const chosen = result?.words.filter((w) => picked.has(w.word)) ?? [];
  const canSave = result !== null && (chosen.length > 0 || phrase);
  const short = source.split(/\s+/).filter(Boolean).length <= PHRASE_MAX_WORDS;

  const save = () => {
    if (!result) return;
    startSaving(async () => {
      const outcome = await saveTranslationAction({
        source,
        translation: result.translation,
        detected: result.detected,
        words: chosen.map(({ word, translation, association }) => ({ word, translation, association })),
        phrase,
      });
      if ("error" in outcome) {
        setSummary(outcome.error);
        return;
      }
      const parts = [`${outcome.added} saved`];
      if (outcome.existing > 0) parts.push(`${outcome.existing} already there`);
      if (outcome.cardsCreated > 0) parts.push(`${outcome.cardsCreated} to review tomorrow`);
      setSummary(parts.join(" · "));
      setResult({ ...result, words: result.words.map((w) => (picked.has(w.word) ? { ...w, saved: true } : w)) });
      setPicked(new Set());
      setPhrase(false);
    });
  };

  const direction =
    result === null
      ? null
      : result.detected === "native"
        ? `${native} → ${target}`
        : result.detected === "target"
          ? `${target} → ${native}`
          : `→ ${target}`;
  const english = target === "en" && result !== null ? (result.detected === "target" ? source : result.translation) : null;

  const noKey =
    !hasKey || problem?.code === "no_key" ? (
      <p className="text-sm text-base-content/60">
        Add an OpenRouter key in <Link href={routes.profile} className="underline">Profile</Link> to translate.
      </p>
    ) : null;

  const wordRows = result?.words.map((w) => (
    <li key={w.word} className="flex items-start gap-3 border-t border-base-300 py-2">
      <input
        type="checkbox"
        className="checkbox checkbox-sm mt-1"
        checked={w.saved || picked.has(w.word)}
        disabled={w.saved}
        onChange={() => toggle(w.word)}
        aria-label={`Save ${w.word}`}
      />
      <span className="flex-1">
        <span className="font-medium">{w.word}</span>
        <span className="ml-2 text-sm text-base-content/60">{w.translation}</span>
        {w.association ? <span className="block text-sm">{w.association}</span> : null}
      </span>
      {w.saved ? <Badge variant="outline">saved</Badge> : null}
    </li>
  ));

  const output = result ? (
    <section className="flex flex-col gap-4" aria-live="polite">
      <div className="flex items-start justify-between gap-2">
        <p className="whitespace-pre-wrap text-2xl leading-relaxed">{result.translation}</p>
        {english ? <SpeakButton text={english} /> : null}
      </div>
      {result.note ? <p className="text-sm text-base-content/60">{result.note}</p> : null}
      {result.alternatives.length > 0 ? (
        <ul className="flex flex-col gap-1 text-sm">
          {result.alternatives.map((a) => (
            <li key={a.text}>
              {a.text}
              {a.note ? <span className="ml-2 text-base-content/60">{a.note}</span> : null}
            </li>
          ))}
        </ul>
      ) : null}
      {wordRows && wordRows.length > 0 ? <ul className="flex flex-col">{wordRows}</ul> : null}
      {short ? (
        <label className="flex items-center gap-3 text-sm">
          <input type="checkbox" className="checkbox checkbox-sm" checked={phrase} onChange={(e) => setPhrase(e.target.checked)} />
          Also save the whole phrase
        </label>
      ) : null}
      <div className="flex items-center gap-3">
        <Button size="lg" disabled={!canSave} loading={saving} onClick={save}>
          {chosen.length + (phrase ? 1 : 0) > 0 ? `Save ${chosen.length + (phrase ? 1 : 0)}` : "Save"}
        </Button>
        {summary ? <span className="text-sm text-base-content/60">{summary}</span> : null}
      </div>
    </section>
  ) : null;

  return (
    <div className="flex flex-col gap-5">
      <header className="flex items-center justify-between">
        <h1 className="flex items-center gap-2 text-xl font-semibold">
          <Languages className="size-5" aria-hidden /> Translate
        </h1>
        <span className="flex items-center gap-2 text-sm text-base-content/60">
          {busy ? <span className="loading loading-dots loading-sm" aria-label="Translating" /> : null}
          {direction ?? `${LANGUAGES[native]} · ${LANGUAGES[target]}`}
        </span>
      </header>
      <div className="relative">
        <Textarea
          value={text}
          onChange={(event) => onChange(event.target.value)}
          rows={4}
          maxLength={2000}
          className="pr-10"
          autoFocus
          placeholder={`Type in ${LANGUAGES[native]} or ${LANGUAGES[target]}`}
          aria-label="Text to translate"
        />
        {text ? (
          <Button type="button" variant="ghost" size="sm" className="absolute right-1 top-1" aria-label="Clear" onClick={clear}>
            <X aria-hidden className="size-4" />
          </Button>
        ) : null}
      </div>
      {noKey}
      {problem && problem.code !== "no_key" ? (
        <p role="alert" className="text-sm text-error">
          {problem.message}
        </p>
      ) : null}
      {output}
    </div>
  );
}
