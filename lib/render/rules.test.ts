import { describe, expect, it } from "vitest";
import { AA_TEXT, contrastRatio } from "@/lib/color/contrast";
import { JOB_TYPES, THEMES, VIBES, VibeTokensSchema } from "@/lib/schemas/tokens";
import { REGISTRY } from "./registry";
import { SECTION_IDS, accentText, defaultAccent, sectionOrder, skillsStyle, vibeTokens } from "./rules";
import { ACCENT_PRESETS } from "./vibes/accents";

const combos = VIBES.flatMap((vibe) => THEMES.map((theme) => ({ vibe, theme })));

describe("vibeTokens", () => {
  it.each(combos)("$vibe $theme satisfies the token contract", ({ vibe, theme }) => {
    const tokens = vibeTokens({ vibe, theme, accent: defaultAccent(vibe) });
    expect(VibeTokensSchema.safeParse(tokens).success).toBe(true);
  });

  it.each(combos)("$vibe $theme text pairings reach AA", ({ vibe, theme }) => {
    const t = vibeTokens({ vibe, theme, accent: defaultAccent(vibe) });
    for (const [fg, bg] of [
      [t.text, t.bg],
      [t.text, t.surface],
      [t.muted, t.bg],
      [t.muted, t.surface],
    ] as const) {
      expect(contrastRatio(fg, bg)).toBeGreaterThanOrEqual(AA_TEXT);
    }
  });

  it.each(combos)("$vibe $theme lines are visible against the page", ({ vibe, theme }) => {
    // Lines decorate; the controls they outline also carry text. 1.3:1 keeps them from vanishing.
    const t = vibeTokens({ vibe, theme, accent: defaultAccent(vibe) });
    expect(contrastRatio(t.line, t.bg)).toBeGreaterThan(1.3);
  });

  it("uses the owner's accent unchanged", () => {
    expect(vibeTokens({ vibe: "orbit", theme: "dark", accent: "#2f6fdb" }).accent).toBe("#2f6fdb");
  });

  it("is deterministic", () => {
    const choices = { vibe: "orbit", theme: "light", accent: "#ff6f99" } as const;
    expect(vibeTokens(choices)).toEqual(vibeTokens(choices));
  });
});

describe("accentText", () => {
  const accents = [
    ...ACCENT_PRESETS.map((preset) => preset.value),
    "#000000",
    "#ffffff",
    "#777777",
    "#ff0000",
    "#00ff00",
    "#0000ff",
    "#ffff00",
    "#808000",
    "#3b4185",
  ];

  it.each(VIBES.flatMap((vibe) => accents.map((accent) => ({ vibe, accent }))))(
    "$vibe on $accent reaches AA",
    ({ vibe, accent }) => {
      expect(contrastRatio(accentText(vibe, accent), accent)).toBeGreaterThanOrEqual(AA_TEXT);
    },
  );

  it("prefers the vibe's navy ink on Orbit's default accent", () => {
    expect(accentText("orbit", "#ffa23a")).toBe("#1d2150");
  });

  it("switches to white on a dark accent", () => {
    expect(accentText("orbit", "#2f6fdb")).toBe("#ffffff");
  });

  it("keeps preset accents visible as fills on both themes", () => {
    for (const theme of THEMES) {
      const t = vibeTokens({ vibe: "orbit", theme, accent: "#ffa23a" });
      // Accent fills always carry their own text; this only checks they read as shapes.
      expect(contrastRatio(t.accent, t.bg)).toBeGreaterThan(1.5);
    }
  });
});

describe("sectionOrder", () => {
  it.each(JOB_TYPES)("%s lists every section once, hero first and footer last", (jobType) => {
    const order = sectionOrder(jobType);
    expect([...order].sort()).toEqual([...SECTION_IDS].sort());
    expect(order[0]).toBe("hero");
    expect(order.at(-2)).toBe("contact-cta");
    expect(order.at(-1)).toBe("footer");
  });

  it.each([
    ["engineering", "projects-grid"],
    ["data", "projects-grid"],
    ["design", "highlights"],
    ["sales", "experience-timeline"],
  ] as const)("%s leads with %s near the top", (jobType, section) => {
    expect(sectionOrder(jobType).indexOf(section)).toBeLessThanOrEqual(2);
  });

  it("only names registered components", () => {
    const ids = new Set(REGISTRY.map((entry) => entry.id));
    for (const id of SECTION_IDS) expect(ids.has(id)).toBe(true);
  });
});

describe("skillsStyle", () => {
  it.each([
    ["engineering", "groups"],
    ["data", "groups"],
    ["design", "chips"],
    ["sales", "chips"],
  ] as const)("%s → %s", (jobType, style) => {
    expect(skillsStyle(jobType)).toBe(style);
  });
});
