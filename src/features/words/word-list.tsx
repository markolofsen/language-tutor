"use client";

import { Search, Trash2 } from "lucide-react";
import { useMemo, useState, useTransition } from "react";

import { Badge, Button, Input } from "@/ui";

import { deleteWordsAction } from "./actions";

export type WordItem = {
  id: number;
  english: string;
  translation: string;
  association: string;
  status: "new" | "learning" | "known";
  seen: number;
  missed: number;
};

const FILTERS = [
  { key: "all", label: "All" },
  { key: "new", label: "New" },
  { key: "learning", label: "Learning" },
  { key: "known", label: "Known" },
] as const;

export function WordList({ items }: { items: WordItem[] }) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<(typeof FILTERS)[number]["key"]>("all");
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [pending, start] = useTransition();
  const [error, setError] = useState("");

  const shown = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return items.filter(
      (word) =>
        (filter === "all" || word.status === filter) &&
        (!needle || `${word.english} ${word.translation} ${word.association}`.toLowerCase().includes(needle)),
    );
  }, [items, query, filter]);

  const toggle = (id: number) =>
    setSelected((current) => {
      const next = new Set(current);
      if (!next.delete(id)) next.add(id);
      return next;
    });

  const remove = () => {
    const ids = [...selected];
    if (ids.length === 0) return;
    if (!window.confirm(`Delete ${ids.length} word${ids.length === 1 ? "" : "s"} with their cards and review history? This cannot be undone.`)) return;
    start(async () => {
      const result = await deleteWordsAction(ids);
      if ("error" in result) return setError(result.error);
      setError("");
      setSelected(new Set());
    });
  };

  const rows = shown.map((word) => (
    <li key={word.id} className="border-t border-base-300">
      <label className="flex cursor-pointer items-start gap-3 py-2">
        <input
          type="checkbox"
          className="checkbox checkbox-sm mt-1"
          checked={selected.has(word.id)}
          onChange={() => toggle(word.id)}
          aria-label={`Select ${word.english}`}
        />
        <span className="min-w-0 flex-1">
          <span className="font-medium">{word.english}</span>
          <span className="ml-2 text-base-content/70">{word.translation}</span>
          {word.association ? <span className="block text-sm">{word.association}</span> : null}
        </span>
        <Badge variant={word.status === "known" ? "secondary" : "outline"}>
          {word.status}
          {word.seen > 0 ? ` ${word.seen - word.missed}/${word.seen}` : ""}
        </Badge>
      </label>
    </li>
  ));

  const chips = FILTERS.map((item) => (
    <button
      key={item.key}
      type="button"
      onClick={() => setFilter(item.key)}
      className={`btn btn-sm ${filter === item.key ? "btn-primary" : "btn-ghost"}`}
    >
      {item.label}
    </button>
  ));

  return (
    <div className="flex flex-col gap-4">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-base-content/50" aria-hidden />
        <Input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search words, meanings, hooks"
          className="pl-9"
        />
      </div>
      <div className="flex flex-wrap gap-1">{chips}</div>
      {error ? <p role="alert" className="text-sm text-error">{error}</p> : null}
      <ul>{rows}</ul>
      {shown.length === 0 ? <p className="py-6 text-center text-sm text-base-content/70">No words match.</p> : null}
      {selected.size > 0 ? (
        <div className="sticky bottom-20 flex items-center justify-between gap-3 rounded-box border border-base-300 bg-base-100 p-3 shadow">
          <span className="text-sm">{selected.size} selected</span>
          <span className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={() => setSelected(new Set())}>
              Clear
            </Button>
            <Button size="sm" loading={pending} onClick={remove}>
              <Trash2 className="size-4" aria-hidden /> Delete
            </Button>
          </span>
        </div>
      ) : null}
    </div>
  );
}
