export type ParsedWord = {
  english: string;
  translation: string;
  association?: string | undefined;
  example?: string | undefined;
  /** The exact string of the word inside `example` when it is inflected. */
  form?: string | undefined;
};

const CYRILLIC = /[Ѐ-ӿ]/;
const LATIN = /[A-Za-z]/;
const SEPARATORS = ["\t", ";", " - ", " — ", " – ", ","] as const;

const unquote = (cell: string) => cell.trim().replace(/^["'«“]+|["'»”]+$/g, "").trim();

function splitPair(line: string): ParsedWord | undefined {
  for (const separator of SEPARATORS) {
    const at = line.indexOf(separator);
    if (at < 0) continue;
    if (separator === "," && line.split(",").length !== 2) continue;
    const left = unquote(line.slice(0, at));
    const right = unquote(line.slice(at + separator.length));
    if (CYRILLIC.test(right) && !CYRILLIC.test(left) && LATIN.test(left)) {
      return { english: left, translation: right };
    }
    if (CYRILLIC.test(left) && !CYRILLIC.test(right) && LATIN.test(right)) {
      return { english: right, translation: left };
    }
  }
  return undefined;
}

/** Reads pasted lines or a CSV export: either column order, English-only lines allowed. */
export function parseWordLines(raw: string): ParsedWord[] {
  const out: ParsedWord[] = [];
  for (const rawLine of raw.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line) continue;
    const pair = splitPair(line);
    if (pair) {
      out.push(pair);
      continue;
    }
    const single = unquote(line);
    if (LATIN.test(single) && !CYRILLIC.test(single)) out.push({ english: single, translation: "" });
  }
  return out;
}
