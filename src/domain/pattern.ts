/** One spelling per rule: case and spacing never make a second pattern. */
export function patternKey(rule: string): string {
  return rule.trim().toLowerCase().replace(/\s+/g, " ");
}
