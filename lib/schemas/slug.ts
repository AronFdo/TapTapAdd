import { z } from "zod";

/**
 * Portfolio slugs become subdomains: `{slug}.{ROOT_DOMAIN}`.
 *
 * Kept in sync with the `profiles_slug_*` check constraints in
 * supabase/migrations; tests/db/schema-sync.test.ts compares the two.
 */

export const SLUG_MIN = 3;
export const SLUG_MAX = 40;

/** Lowercase letters and digits, single inner hyphens. */
export const SLUG_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/;

export const RESERVED_SLUGS = [
  "about",
  "account",
  "admin",
  "api",
  "app",
  "assets",
  "auth",
  "blog",
  "c",
  "card",
  "cards",
  "cdn",
  "dashboard",
  "dev",
  "docs",
  "help",
  "login",
  "mail",
  "onboarding",
  "preview",
  "privacy",
  "settings",
  "signin",
  "signup",
  "sites",
  "static",
  "status",
  "support",
  "taptapadd",
  "terms",
  "www",
] as const;

const reserved = new Set<string>(RESERVED_SLUGS);

export const SlugSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(SLUG_MIN, `Use at least ${SLUG_MIN} characters`)
  .max(SLUG_MAX, `Use at most ${SLUG_MAX} characters`)
  .regex(SLUG_PATTERN, "Use lowercase letters, numbers and single hyphens")
  .refine((slug) => !reserved.has(slug), "That address is reserved. Choose another.");

export type Slug = z.infer<typeof SlugSchema>;

/** A starting suggestion from a name, for example "Jane Perera" → "jane-perera". */
export function suggestSlug(name: string): string {
  const base = name
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, SLUG_MAX)
    .replace(/-+$/, "");
  return base;
}
