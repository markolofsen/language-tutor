const WINDOW_MS = 15 * 60_000;
const MAX_PER_CLIENT = 5;
/** Across all clients, so a rotating address cannot walk past the per-client limit. */
const MAX_TOTAL = 40;
const ALL = "*";

/**
 * Counts failed password attempts in a sliding window. It lives in the process: on a single server it is the
 * limit; on serverless each instance counts alone, so treat it as a brake, not a guarantee.
 */
export class Throttle {
  private failures = new Map<string, number[]>();

  constructor(private now: () => number = Date.now) {}

  private recent(key: string): number[] {
    const since = this.now() - WINDOW_MS;
    const kept = (this.failures.get(key) ?? []).filter((at) => at > since);
    if (kept.length > 0) this.failures.set(key, kept);
    else this.failures.delete(key);
    return kept;
  }

  blocked(key: string): boolean {
    return this.recent(key).length >= MAX_PER_CLIENT || this.recent(ALL).length >= MAX_TOTAL;
  }

  fail(key: string): void {
    const at = this.now();
    for (const k of [key, ALL]) this.failures.set(k, [...this.recent(k), at]);
  }

  clear(key: string): void {
    this.failures.delete(key);
  }
}

export const passwordThrottle = new Throttle();

export const TOO_MANY = "Too many attempts. Try again in a few minutes.";

/** The caller's address as the reverse proxy reports it. */
export function clientKey(headers: Headers): string {
  const forwarded = headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return headers.get("cf-connecting-ip") ?? forwarded ?? headers.get("x-real-ip") ?? "unknown";
}
