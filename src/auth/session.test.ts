import { describe, expect, it } from "vitest";

import { createSessionToken, verifySessionToken } from "./session";

describe("session token", () => {
  it("verifies its own token and rejects a forged or expired one", async () => {
    const token = await createSessionToken("secret", 1_000);
    expect(await verifySessionToken(token, "secret", 2_000)).toBe(true);
    expect(await verifySessionToken(token, "other", 2_000)).toBe(false);
    expect(await verifySessionToken(token, "secret", 1_000 + 31 * 86_400_000)).toBe(false);
    expect(await verifySessionToken(undefined, "secret")).toBe(false);
  });
});
