import { readableTextOn } from "@/lib/color/contrast";
import {
  VibeTokensSchema,
  type JobType,
  type SiteTokens,
  type Vibe,
  type VibeTokens,
} from "@/lib/schemas/tokens";
import { orbit } from "./vibes/orbit";
import type { VibePalette } from "./vibes/types";

/**
 * Deterministic rules from the owner's choices (vibe, theme, accent, job
 * type) to vibe tokens and section order. Pure functions, no AI.
 */

// Minimal, Editorial and Technical are designed in Phase 8. Until then they
// render with Orbit so every stored choice still produces a site.
const PALETTES: Record<Vibe, VibePalette> = {
  orbit,
  minimal: orbit,
  editorial: orbit,
  technical: orbit,
};

export function palette(vibe: Vibe): VibePalette {
  return PALETTES[vibe];
}

export function defaultAccent(vibe: Vibe): string {
  return PALETTES[vibe].defaultAccent;
}

/** Text on the accent fill, guaranteed to reach AA (4.5:1). */
export function accentText(vibe: Vibe, accent: string): string {
  return readableTextOn(accent, PALETTES[vibe].inkOnAccent);
}

export function vibeTokens({ vibe, theme, accent }: Pick<SiteTokens, "vibe" | "theme" | "accent">): VibeTokens {
  const p = PALETTES[vibe];
  const colours = p.themes[theme];
  return VibeTokensSchema.parse({
    bg: colours.bg,
    surface: colours.surface,
    text: colours.text,
    muted: colours.muted,
    line: colours.line,
    accent,
    accentText: accentText(vibe, accent),
    radius: p.radius,
    shadow: `0 4px 0 ${colours.keyBase}`,
    // Eight-digit hex: the accent at 50% opacity.
    glow: `0 0 16px ${accent}80`,
    fontDisplay: p.fontDisplay,
    fontBody: p.fontBody,
  });
}

/** Every section a generated layout can contain, in registry ids. */
export const SECTION_IDS = [
  "hero",
  "about",
  "highlights",
  "experience-timeline",
  "projects-grid",
  "skills",
  "education",
  "fun-fact",
  "contact-cta",
  "footer",
] as const;

export type SectionId = (typeof SECTION_IDS)[number];

// The middle of the page, between the hero and contact-cta + footer. Each
// job type leads with the evidence its readers look for first.
type Body = Exclude<SectionId, "hero" | "contact-cta" | "footer">[];

const MAKERS: Body = ["about", "projects-grid", "skills", "highlights", "experience-timeline", "education", "fun-fact"];
const VISUAL: Body = ["highlights", "projects-grid", "about", "experience-timeline", "skills", "education", "fun-fact"];
const STORY: Body = ["about", "highlights", "experience-timeline", "projects-grid", "skills", "education", "fun-fact"];
const TRACK_RECORD: Body = ["about", "experience-timeline", "highlights", "skills", "education", "projects-grid", "fun-fact"];

const BODY_BY_JOB: Record<JobType, Body> = {
  engineering: MAKERS,
  data: MAKERS,
  design: VISUAL,
  product: STORY,
  marketing: STORY,
  sales: TRACK_RECORD,
  finance: TRACK_RECORD,
  operations: TRACK_RECORD,
  people: TRACK_RECORD,
  other: TRACK_RECORD,
};

/** The full section order for a job type: hero first, contact and footer last. */
export function sectionOrder(jobType: JobType): SectionId[] {
  return ["hero", ...BODY_BY_JOB[jobType], "contact-cta", "footer"];
}

/** Engineers and analysts scan grouped stacks; everyone else reads a flat set of chips. */
export function skillsStyle(jobType: JobType): "groups" | "chips" {
  return jobType === "engineering" || jobType === "data" ? "groups" : "chips";
}
