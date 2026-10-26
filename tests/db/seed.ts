import type { Transaction } from "@electric-sql/pglite";
import { ProfileSchema, type ProfileInput } from "@/lib/schemas/profile";
import { janeProfile } from "@/tests/fixtures/profiles/jane";
import type { TestDatabase } from "./harness";

const tokens = { vibe: "orbit", theme: "dark", accent: "#ffa23a", jobType: "design" };

export async function insertVersion(
  tx: Transaction,
  siteId: string,
  options: { profile?: ProfileInput; source?: string; parentId?: string } = {},
): Promise<string> {
  const profile = ProfileSchema.parse(options.profile ?? janeProfile);
  const { rows } = await tx.query<{ id: string }>(
    `insert into site_versions (site_id, parent_id, profile, layout, tokens, source)
     values ($1, $2, $3, $4, $5, $6) returning id`,
    [siteId, options.parentId ?? null, profile, { sections: [{ component: "hero" }] }, tokens, options.source ?? "generate"],
  );
  return rows[0]!.id;
}

/** A user with a profile, a site and one version, created through RLS as that user. */
export async function seedOwner(
  t: TestDatabase,
  slug: string,
  options: { publish?: boolean; profile?: ProfileInput } = {},
) {
  const userId = await t.createUser();
  return t.as({ userId }, async (tx) => {
    await tx.query("insert into profiles (user_id, slug, profile) values ($1, $2, $3)", [
      userId,
      slug,
      ProfileSchema.parse(options.profile ?? janeProfile),
    ]);
    const { rows } = await tx.query<{ id: string }>(
      "insert into sites (user_id, accent, job_type) values ($1, '#ffa23a', 'design') returning id",
      [userId],
    );
    const siteId = rows[0]!.id;
    const versionId = await insertVersion(tx, siteId, { profile: options.profile });
    await tx.query(
      `update sites set draft_version_id = $2,
         published_version_id = case when $3 then $2::uuid end,
         published_at = case when $3 then now() end
       where id = $1`,
      [siteId, versionId, options.publish ?? false],
    );
    return { userId, siteId, versionId };
  });
}
