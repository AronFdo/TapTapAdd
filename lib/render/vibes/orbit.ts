import type { VibePalette } from "./types";

/**
 * Orbit: the app's own mission-console language applied to a portfolio.
 * Deep-space background, Michroma and Jost, backlit contact keys and a faint
 * orbit ring behind the hero photo. Colours mirror the base palette in
 * DESIGN.md. Like app/tokens.css, vibe palettes are where raw colours live.
 */
export const orbit: VibePalette = {
  defaultAccent: "#ffa23a",
  inkOnAccent: "#1d2150",
  radius: "24px",
  fontDisplay: 'var(--font-michroma), "Arial Black", sans-serif',
  fontBody: 'var(--font-jost), "Century Gothic", system-ui, sans-serif',
  themes: {
    dark: {
      bg: "#161a40",
      surface: "#22275a",
      text: "#f1eeff",
      muted: "#afaed8",
      line: "#3b4185",
      keyBase: "#0a0c26",
    },
    light: {
      bg: "#e8e6f4",
      surface: "#f7f6fc",
      text: "#1d2150",
      muted: "#545887",
      line: "#c9c6e3",
      keyBase: "#1d2150",
    },
  },
};
