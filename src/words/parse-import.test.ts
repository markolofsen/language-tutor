import { describe, expect, it } from "vitest";

import { parseWordLines } from "./parse-import";

describe("parseWordLines", () => {
  it("reads tab, semicolon and dash separated pairs in either order", () => {
    const parsed = parseWordLines("treat\tотноситься\nпоселение; settlement\nbook - книга");
    expect(parsed).toEqual([
      { english: "treat", translation: "относиться" },
      { english: "settlement", translation: "поселение" },
      { english: "book", translation: "книга" },
    ]);
  });

  it("splits on a lone comma but keeps commas inside a phrase", () => {
    expect(parseWordLines("hello, привет")).toEqual([{ english: "hello", translation: "привет" }]);
    expect(parseWordLines("well, you know")).toEqual([{ english: "well, you know", translation: "" }]);
  });

  it("keeps English-only lines and drops Russian-only and empty ones", () => {
    expect(parseWordLines("\n  leasehold \nпросто слово\n")).toEqual([{ english: "leasehold", translation: "" }]);
  });

  it("strips quotes from spreadsheet exports", () => {
    expect(parseWordLines('"deed";"акт"')).toEqual([{ english: "deed", translation: "акт" }]);
  });
});
