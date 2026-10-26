import { z } from "zod";
import { OnboardingAnswersSchema } from "@/lib/schemas/answers";
import { CardStatusSchema } from "@/lib/schemas/card";
import { LayoutSpecSchema } from "@/lib/schemas/layout";
import { ProfileSchema } from "@/lib/schemas/profile";
import { SiteDocumentSchema, VersionSourceSchema } from "@/lib/schemas/site";
import { SiteTokensSchema } from "@/lib/schemas/tokens";
import type { Tables } from "./types";

/**
 * Database rows parsed into domain types. Every JSON column goes through its
 * Zod schema, so code past this point never handles unvalidated JSON.
 */

/**
 * A row that failed validation. It carries field paths only, never values,
 * so it is safe to log.
 */
export class InvalidRowError extends Error {
  readonly paths: string[];

  constructor(table: string, error: z.ZodError) {
    const paths = error.issues.map((issue) => issue.path.join(".") || "(root)");
    super(`Invalid ${table} row at ${paths.join(", ")}`);
    this.name = "InvalidRowError";
    this.paths = paths;
  }
}

function parse<T extends z.ZodType>(table: string, schema: T, value: unknown): z.infer<T> {
  const result = schema.safeParse(value);
  if (!result.success) throw new InvalidRowError(table, result.error);
  return result.data;
}

export function parseProfileRow(row: Tables<"profiles">) {
  return {
    userId: row.user_id,
    slug: row.slug,
    profile: row.profile === null ? null : parse("profiles", ProfileSchema, row.profile),
    answers: parse("profiles", OnboardingAnswersSchema, row.answers),
    editedPaths: row.edited_paths,
    cvPath: row.cv_path,
    updatedAt: row.updated_at,
  };
}

export function parseSiteRow(row: Tables<"sites">) {
  return {
    id: row.id,
    userId: row.user_id,
    tokens: parse("sites", SiteTokensSchema, {
      vibe: row.vibe,
      theme: row.theme,
      accent: row.accent,
      jobType: row.job_type,
    }),
    draftVersionId: row.draft_version_id,
    publishedVersionId: row.published_version_id,
    publishedAt: row.published_at,
  };
}

export function parseSiteVersionRow(row: Tables<"site_versions">) {
  return {
    id: row.id,
    siteId: row.site_id,
    parentId: row.parent_id,
    source: parse("site_versions", VersionSourceSchema, row.source),
    createdAt: row.created_at,
    document: parse("site_versions", SiteDocumentSchema, {
      profile: row.profile,
      layout: row.layout,
      tokens: row.tokens,
    }),
  };
}

export function parseCardRow(row: Tables<"cards">) {
  return {
    code: row.code,
    userId: row.user_id,
    status: parse("cards", CardStatusSchema, row.status),
    printedAt: row.printed_at,
    claimedAt: row.claimed_at,
  };
}

const PublicSiteRowSchema = z.object({
  site_id: z.uuid(),
  slug: z.string(),
  version_id: z.uuid(),
  published_at: z.string().nullable(),
  profile: ProfileSchema,
  layout: LayoutSpecSchema,
  tokens: SiteTokensSchema,
});

/** A published site as anonymous visitors see it, with hidden fields already removed. */
export function parsePublicSiteRow(row: Tables<"public_sites">) {
  const parsed = parse("public_sites", PublicSiteRowSchema, row);
  return {
    siteId: parsed.site_id,
    slug: parsed.slug,
    versionId: parsed.version_id,
    publishedAt: parsed.published_at,
    document: { profile: parsed.profile, layout: parsed.layout, tokens: parsed.tokens },
  };
}

export type ProfileRecord = ReturnType<typeof parseProfileRow>;
export type SiteRecord = ReturnType<typeof parseSiteRow>;
export type SiteVersionRecord = ReturnType<typeof parseSiteVersionRow>;
export type CardRecord = ReturnType<typeof parseCardRow>;
export type PublicSite = ReturnType<typeof parsePublicSiteRow>;
