/** Normalised identity of a saved word: case and spacing never make a second word. */
export function wordKey(english: string): string {
  return english.trim().toLowerCase().replace(/\s+/g, " ");
}
