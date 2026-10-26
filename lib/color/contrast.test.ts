import { describe, expect, it } from "vitest";
import { AA_TEXT, contrastRatio, parseHex, readableTextOn } from "./contrast";

describe("contrast", () => {
  it("parses short and long hex", () => {
    expect(parseHex("#fff")).toEqual({ r: 255, g: 255, b: 255 });
    expect(parseHex("1D2150")).toEqual({ r: 29, g: 33, b: 80 });
  });

  it("rejects non-hex input", () => {
    expect(() => parseHex("red")).toThrow();
  });

  it("matches known WCAG ratios", () => {
    expect(contrastRatio("#000000", "#FFFFFF")).toBeCloseTo(21, 5);
    expect(contrastRatio("#777777", "#FFFFFF")).toBeCloseTo(4.48, 2);
    expect(contrastRatio("#FFFFFF", "#FFFFFF")).toBe(1);
  });
});

describe("readableTextOn", () => {
  it("keeps the preferred colour when it reaches AA", () => {
    expect(readableTextOn("#ffa23a", "#1D2150")).toBe("#1d2150");
  });

  it("falls back to white on dark fills", () => {
    expect(readableTextOn("#2f6fdb", "#1d2150")).toBe("#ffffff");
  });

  it("always reaches AA across the colour space", () => {
    const steps = [0, 51, 102, 153, 204, 255];
    for (const r of steps)
      for (const g of steps)
        for (const b of steps) {
          const fill = `#${[r, g, b].map((c) => c.toString(16).padStart(2, "0")).join("")}`;
          expect(contrastRatio(readableTextOn(fill, "#1d2150"), fill)).toBeGreaterThanOrEqual(AA_TEXT);
        }
  });
});
