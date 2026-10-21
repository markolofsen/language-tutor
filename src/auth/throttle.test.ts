import { describe, expect, it } from "vitest";

import { clientKey, Throttle } from "./throttle";

describe("Throttle", () => {
  it("blocks a client after five failures and frees it after the window", () => {
    let now = 0;
    const throttle = new Throttle(() => now);
    for (let i = 0; i < 4; i += 1) throttle.fail("a");
    expect(throttle.blocked("a")).toBe(false);
    throttle.fail("a");
    expect(throttle.blocked("a")).toBe(true);
    expect(throttle.blocked("b")).toBe(false);
    now = 16 * 60_000;
    expect(throttle.blocked("a")).toBe(false);
  });

  it("blocks everyone once the total is reached, whatever the address", () => {
    const throttle = new Throttle(() => 0);
    for (let i = 0; i < 40; i += 1) throttle.fail(`ip-${i}`);
    expect(throttle.blocked("fresh")).toBe(true);
  });

  it("clears a client after a right password", () => {
    const throttle = new Throttle(() => 0);
    for (let i = 0; i < 5; i += 1) throttle.fail("a");
    throttle.clear("a");
    expect(throttle.blocked("a")).toBe(false);
  });
});

describe("clientKey", () => {
  it("prefers the Cloudflare address, then the first forwarded one", () => {
    expect(clientKey(new Headers({ "cf-connecting-ip": "1.1.1.1", "x-forwarded-for": "2.2.2.2" }))).toBe("1.1.1.1");
    expect(clientKey(new Headers({ "x-forwarded-for": "2.2.2.2, 3.3.3.3" }))).toBe("2.2.2.2");
    expect(clientKey(new Headers())).toBe("unknown");
  });
});
