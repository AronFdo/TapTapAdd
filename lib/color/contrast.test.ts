import { describe, expect, it } from "vitest";
import { contrastRatio, parseHex } from "./contrast";

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
