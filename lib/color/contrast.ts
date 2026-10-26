/** WCAG 2.x contrast helpers. Also used for portfolio accent colours. */

export type Rgb = { r: number; g: number; b: number };

export function parseHex(hex: string): Rgb {
  const match = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(hex.trim());
  if (!match?.[1]) throw new Error(`Not a hex colour: ${hex}`);
  const digits = match[1].length === 3 ? [...match[1]].map((d) => d + d).join("") : match[1];
  return {
    r: parseInt(digits.slice(0, 2), 16),
    g: parseInt(digits.slice(2, 4), 16),
    b: parseInt(digits.slice(4, 6), 16),
  };
}

function channel(value: number): number {
  const c = value / 255;
  return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

export function relativeLuminance({ r, g, b }: Rgb): number {
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

export function contrastRatio(a: string, b: string): number {
  const la = relativeLuminance(parseHex(a));
  const lb = relativeLuminance(parseHex(b));
  const [hi, lo] = la > lb ? [la, lb] : [lb, la];
  return (hi + 0.05) / (lo + 0.05);
}

/** AA thresholds: 4.5 for body text, 3 for large text and UI shapes. */
export const AA_TEXT = 4.5;
export const AA_NON_TEXT = 3;

/**
 * Text colour for a fill such as a user-chosen accent: `preferred` when it
 * reaches AA, otherwise white or black. One of white and black always reaches
 * AA, because the worst case for both is about 4.58:1.
 */
export function readableTextOn(background: string, preferred: string): string {
  for (const candidate of [preferred, "#ffffff", "#000000"]) {
    if (contrastRatio(candidate, background) >= AA_TEXT) return candidate.toLowerCase();
  }
  return "#000000";
}
