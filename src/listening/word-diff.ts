export type DiffToken = { word: string; ok: boolean };
export type WordDiff = { tokens: DiffToken[]; ok: number; missed: string[] };

const tokenize = (text: string): string[] =>
  text
    .toLowerCase()
    .replace(/[^a-z0-9'\s-]/g, " ")
    .split(/\s+/)
    .filter(Boolean);

/** Marks each reference word heard or missed by aligning the typed words to it (longest common subsequence). */
export function diffWords(reference: string, typed: string): WordDiff {
  const ref = tokenize(reference);
  const got = tokenize(typed);
  const table: number[][] = Array.from({ length: ref.length + 1 }, () => new Array<number>(got.length + 1).fill(0));
  for (let i = 1; i <= ref.length; i += 1) {
    for (let j = 1; j <= got.length; j += 1) {
      const diagonal = (table[i - 1]?.[j - 1] ?? 0) + 1;
      const best = Math.max(table[i - 1]?.[j] ?? 0, table[i]?.[j - 1] ?? 0);
      const row = table[i];
      if (row) row[j] = ref[i - 1] === got[j - 1] ? diagonal : best;
    }
  }
  const heard = new Set<number>();
  let i = ref.length;
  let j = got.length;
  while (i > 0 && j > 0) {
    if (ref[i - 1] === got[j - 1]) {
      heard.add(i - 1);
      i -= 1;
      j -= 1;
    } else if ((table[i - 1]?.[j] ?? 0) >= (table[i]?.[j - 1] ?? 0)) {
      i -= 1;
    } else {
      j -= 1;
    }
  }
  const tokens = ref.map((word, index) => ({ word, ok: heard.has(index) }));
  return { tokens, ok: heard.size, missed: tokens.filter((t) => !t.ok).map((t) => t.word) };
}
