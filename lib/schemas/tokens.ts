import { z } from "zod";

/**
 * Deterministic look-and-feel choices, and the vibe token contract from
 * DESIGN.md that portfolio components are styled with.
 *
 * The AI may read these as context but never decides or changes them unless
 * the user explicitly asks in an edit.
 */

export const VIBES = ["orbit", "minimal", "editorial", "technical"] as const;
export const VibeSchema = z.enum(VIBES);

export const THEMES = ["dark", "light"] as const;
export const ThemeSchema = z.enum(THEMES);

export const JOB_TYPES = [
  "engineering",
  "design",
  "data",
  "product",
  "marketing",
  "sales",
  "finance",
  "operations",
  "people",
  "other",
] as const;
export const JobTypeSchema = z.enum(JOB_TYPES);

/** A six-digit hex colour, stored lowercase so equal accents compare equal. */
export const HexColourSchema = z
  .string()
  .regex(/^#[0-9a-fA-F]{6}$/, "Use a six-digit hex colour")
  .transform((hex) => hex.toLowerCase());

export const AccentSchema = HexColourSchema;

/**
 * Stored on every site version, so undoing to an older version also restores
 * its look. Mirrors the columns on `sites`, which hold the current choices.
 */
export const SiteTokensSchema = z.object({
  vibe: VibeSchema,
  theme: ThemeSchema,
  accent: AccentSchema,
  jobType: JobTypeSchema,
});

// Values become CSS custom properties, so they must not be able to break out
// of a declaration.
const cssValue = z
  .string()
  .min(1)
  .max(200)
  .regex(/^[^;{}<>\\]*$/, "Not a safe CSS value");

/** The vibe token contract from DESIGN.md, computed by lib/render/rules.ts. */
export const VibeTokensSchema = z.object({
  bg: HexColourSchema,
  surface: HexColourSchema,
  text: HexColourSchema,
  muted: HexColourSchema,
  accent: HexColourSchema,
  accentText: HexColourSchema,
  line: HexColourSchema,
  radius: cssValue,
  shadow: cssValue,
  glow: cssValue,
  fontDisplay: cssValue,
  fontBody: cssValue,
});

export type Vibe = z.infer<typeof VibeSchema>;
export type Theme = z.infer<typeof ThemeSchema>;
export type JobType = z.infer<typeof JobTypeSchema>;
export type SiteTokens = z.infer<typeof SiteTokensSchema>;
export type VibeTokens = z.infer<typeof VibeTokensSchema>;

const CSS_VARIABLES = {
  bg: "--vibe-bg",
  surface: "--vibe-surface",
  text: "--vibe-text",
  muted: "--vibe-muted",
  accent: "--vibe-accent",
  accentText: "--vibe-accent-text",
  line: "--vibe-line",
  radius: "--vibe-radius",
  shadow: "--vibe-shadow",
  glow: "--vibe-glow",
  fontDisplay: "--vibe-font-display",
  fontBody: "--vibe-font-body",
} as const satisfies Record<keyof VibeTokens, `--vibe-${string}`>;

/** Turns a token set into the CSS custom properties components read. */
export function vibeCssVariables(tokens: VibeTokens): Record<`--vibe-${string}`, string> {
  return Object.fromEntries(
    Object.entries(CSS_VARIABLES).map(([key, name]) => [name, tokens[key as keyof VibeTokens]]),
  );
}
