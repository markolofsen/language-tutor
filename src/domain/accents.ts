export const ACCENTS = [
  { tag: "en-US", label: "American" },
  { tag: "en-GB", label: "British" },
  { tag: "en-AU", label: "Australian" },
  { tag: "en-IN", label: "Indian" },
  { tag: "en-IE", label: "Irish" },
  { tag: "en-ZA", label: "South African" },
  { tag: "en-CA", label: "Canadian" },
  { tag: "en-NZ", label: "New Zealand" },
] as const;

export type AccentTag = (typeof ACCENTS)[number]["tag"];

export function accentLabel(tag: string): string {
  return ACCENTS.find((a) => a.tag === tag)?.label ?? tag;
}
