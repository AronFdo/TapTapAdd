import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

// ESLint covers raw colours in TS and TSX. This covers stylesheets.
const ROOTS = ["app", "components"];
const ALLOWED = new Set(["app/tokens.css"]);
const RAW_COLOUR = /#[0-9a-fA-F]{3,8}\b|\b(rgb|rgba|hsl|hsla|oklch)\(/;

function cssFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const full = path.join(dir, name);
    if (statSync(full).isDirectory()) return cssFiles(full);
    return full.endsWith(".css") ? [full] : [];
  });
}

describe("stylesheets", () => {
  const files = ROOTS.flatMap(cssFiles).filter((file) => !ALLOWED.has(file));

  it.each(files)("%s uses tokens, not raw colours", (file) => {
    const offending = readFileSync(file, "utf8")
      .split("\n")
      .map((line, i) => ({ line: i + 1, text: line.trim() }))
      .filter(({ text }) => RAW_COLOUR.test(text));
    expect(offending).toEqual([]);
  });
});
