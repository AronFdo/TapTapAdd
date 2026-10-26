import { describe, expect, it } from "vitest";
import { SiteTokensSchema, VibeTokensSchema, vibeCssVariables } from "./tokens";

const tokens = {
  bg: "#161a40",
  surface: "#22275a",
  text: "#f1eeff",
  muted: "#afaed8",
  accent: "#ffa23a",
  accentText: "#1d2150",
  line: "#3b4185",
  radius: "24px",
  shadow: "0 4px 0 #0a0c26",
  glow: "0 0 16px rgb(255 162 58 / 0.4)",
  fontDisplay: "var(--font-michroma), sans-serif",
  fontBody: "var(--font-jost), sans-serif",
};

describe("SiteTokensSchema", () => {
  it("accepts valid choices and lowercases the accent", () => {
    const parsed = SiteTokensSchema.parse({ vibe: "orbit", theme: "dark", accent: "#FFA23A", jobType: "design" });
    expect(parsed.accent).toBe("#ffa23a");
  });

  it.each([
    ["an unknown vibe", { vibe: "neon", theme: "dark", accent: "#ffa23a", jobType: "design" }],
    ["an unknown theme", { vibe: "orbit", theme: "sepia", accent: "#ffa23a", jobType: "design" }],
    ["an unknown job type", { vibe: "orbit", theme: "dark", accent: "#ffa23a", jobType: "astronaut" }],
    ["a short hex accent", { vibe: "orbit", theme: "dark", accent: "#fa3", jobType: "design" }],
    ["a named accent", { vibe: "orbit", theme: "dark", accent: "orange", jobType: "design" }],
    ["a missing field", { vibe: "orbit", theme: "dark", accent: "#ffa23a" }],
  ])("rejects %s", (_, input) => {
    expect(SiteTokensSchema.safeParse(input).success).toBe(false);
  });
});

describe("VibeTokensSchema", () => {
  it("accepts the full contract", () => {
    expect(VibeTokensSchema.safeParse(tokens).success).toBe(true);
  });

  it.each([
    ["a declaration break", { radius: "4px; background: url(x)" }],
    ["a closing brace", { shadow: "none } body {" }],
    ["markup", { fontBody: "</style><script>" }],
    ["a non-hex colour", { bg: "red" }],
  ])("rejects %s", (_, override) => {
    expect(VibeTokensSchema.safeParse({ ...tokens, ...override }).success).toBe(false);
  });

  it("maps every token to its documented CSS variable", () => {
    expect(Object.keys(vibeCssVariables(VibeTokensSchema.parse(tokens))).sort()).toEqual(
      [
        "--vibe-bg",
        "--vibe-surface",
        "--vibe-text",
        "--vibe-muted",
        "--vibe-accent",
        "--vibe-accent-text",
        "--vibe-line",
        "--vibe-radius",
        "--vibe-shadow",
        "--vibe-glow",
        "--vibe-font-display",
        "--vibe-font-body",
      ].sort(),
    );
  });
});
