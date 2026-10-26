import type { Theme } from "@/lib/schemas/tokens";

/** The fixed colours of one vibe in one theme. The accent comes from the user. */
export type VibeThemeColours = {
  bg: string;
  surface: string;
  text: string;
  muted: string;
  line: string;
  /** The solid base under keys, drawn by `--vibe-shadow`. */
  keyBase: string;
};

export type VibePalette = {
  /** Used until the owner picks an accent. */
  defaultAccent: string;
  /** Preferred text on accent fills, used whenever it reaches AA. */
  inkOnAccent: string;
  radius: string;
  fontDisplay: string;
  fontBody: string;
  themes: Record<Theme, VibeThemeColours>;
};
