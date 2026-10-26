import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { AA_NON_TEXT, AA_TEXT, contrastRatio } from "@/lib/color/contrast";

const css = readFileSync(path.join(process.cwd(), "app/tokens.css"), "utf8");

type Theme = "light" | "dark";

/** Resolves a token to its hex value in one theme, following var() aliases. */
function resolve(token: string, theme: Theme): string {
  const declaration = new RegExp(`--${token}:\\s*([^;]+);`).exec(css);
  if (!declaration?.[1]) throw new Error(`Token --${token} is not defined`);
  const value = declaration[1].trim();

  const alias = /^var\(--([\w-]+)\)$/.exec(value);
  if (alias?.[1]) return resolve(alias[1], theme);

  const pair = /^light-dark\((#[0-9a-fA-F]{3,6}),\s*(#[0-9a-fA-F]{3,6})\)$/.exec(value);
  if (!pair?.[1] || !pair[2]) throw new Error(`--${token} is not a light-dark() hex pair: ${value}`);
  return theme === "light" ? pair[1] : pair[2];
}

// Every text-on-surface pairing the app uses. Add a row when you add one.
const textPairs: [foreground: string, background: string][] = [
  ["text", "bg"],
  ["text", "surface"],
  ["text-muted", "bg"],
  ["text-muted", "surface"],
  ["text", "key-secondary"],
  ["key-text", "key-primary"],
  ["key-text", "key-accent"],
  ["key-text", "selected"],
  ["key-danger-text", "key-danger"],
  ["error-text", "bg"],
  ["error-text", "surface"],
  ["link", "bg"],
  ["link", "surface"],
];

// Icons, status lights and focus rings need 3:1 against what they sit on.
const nonTextPairs: [foreground: string, background: string][] = [
  ["focus", "bg"],
  ["focus", "surface"],
  ["live", "surface"],
  ["success", "surface"],
  ["error", "surface"],
];

// A key is visible if its face or its 2px base outline stands out from the page.
// Secondary (hull) keys are left out: in dark mode neither reaches 3:1, which
// WCAG allows because the text label identifies the control.
const keyFaces = ["key-primary", "key-accent", "key-danger"];

describe.each<Theme>(["light", "dark"])("%s theme contrast", (theme) => {
  it.each(keyFaces)("%s key stands out from the page", (face) => {
    const bg = resolve("bg", theme);
    const best = Math.max(
      contrastRatio(resolve(face, theme), bg),
      contrastRatio(resolve("key-base", theme), bg),
    );
    expect(best).toBeGreaterThanOrEqual(AA_NON_TEXT);
  });

  it.each(textPairs)("%s on %s meets AA for text", (fg, bg) => {
    expect(contrastRatio(resolve(fg, theme), resolve(bg, theme))).toBeGreaterThanOrEqual(AA_TEXT);
  });

  it.each(nonTextPairs)("%s on %s meets AA for UI shapes", (fg, bg) => {
    expect(contrastRatio(resolve(fg, theme), resolve(bg, theme))).toBeGreaterThanOrEqual(AA_NON_TEXT);
  });
});
