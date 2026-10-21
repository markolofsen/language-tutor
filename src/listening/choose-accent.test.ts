import { describe, expect, it } from "vitest";

import { chooseAccent } from "./choose-accent";

describe("chooseAccent", () => {
  it("trains an accent not heard yet before repeating one", () => {
    const pick = chooseAccent(["en-US", "en-GB", "en-AU"], [{ accent: "en-US", clips: 3, heardShare: 0.9 }]);
    expect(pick).toBe("en-GB");
  });

  it("repeats the weakest accent once all were heard", () => {
    const pick = chooseAccent(
      ["en-US", "en-GB"],
      [
        { accent: "en-US", clips: 3, heardShare: 0.9 },
        { accent: "en-GB", clips: 3, heardShare: 0.5 },
      ],
    );
    expect(pick).toBe("en-GB");
  });

  it("has no answer when the device has no English voice", () => {
    expect(chooseAccent([], [])).toBeUndefined();
  });
});
