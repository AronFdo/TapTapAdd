import { beforeAll, describe, expect, it } from "vitest";
import { CARD_CODE_ALPHABET, CARD_STATUSES, CardCodeSchema } from "@/lib/schemas/card";
import { EVENT_TYPES, VERSION_SOURCES } from "@/lib/schemas/site";
import { RESERVED_SLUGS, SlugSchema } from "@/lib/schemas/slug";
import { JOB_TYPES, THEMES, VIBES } from "@/lib/schemas/tokens";
import type { Transaction } from "@electric-sql/pglite";
import { createTestDatabase, type TestDatabase } from "./harness";
import { insertVersion, seedOwner } from "./seed";

let t: TestDatabase;

beforeAll(async () => {
  t = await createTestDatabase();
});

class Accepted extends Error {}

/** Runs `fn` as the service role, always rolls it back, and reports whether the database accepted it. */
async function acceptsWith(fn: (tx: Transaction) => Promise<unknown>): Promise<boolean> {
  return t
    .as("service", async (tx) => {
      await fn(tx);
      throw new Accepted();
    })
    .catch((error: unknown) => error instanceof Accepted);
}

function accepts(sql: string, params: unknown[] = []): Promise<boolean> {
  return acceptsWith((tx) => tx.query(sql, params));
}

describe("migrations", () => {
  it("enable RLS on every table in the public schema", async () => {
    const { rows } = await t.db.query<{ relname: string; relrowsecurity: boolean }>(
      `select c.relname, c.relrowsecurity from pg_class c
       join pg_namespace n on n.oid = c.relnamespace
       where n.nspname = 'public' and c.relkind = 'r'`,
    );
    expect(rows.map((r) => r.relname).sort()).toEqual(["cards", "events", "profiles", "site_versions", "sites"]);
    expect(rows.every((r) => r.relrowsecurity)).toBe(true);
  });

  it("give events no columns that could identify a visitor", async () => {
    const { rows } = await t.db.query<{ column_name: string }>(
      "select column_name from information_schema.columns where table_schema = 'public' and table_name = 'events'",
    );
    expect(rows.map((r) => r.column_name).sort()).toEqual(["created_at", "id", "site_id", "type"]);
  });
});

describe("check constraints match lib/schemas", () => {
  let siteId: string;
  beforeAll(async () => {
    ({ siteId } = await seedOwner(t, "constraints"));
  });

  async function siteAccepts(column: string, value: string) {
    return accepts(`update sites set ${column} = $1 where id = $2`, [value, siteId]);
  }

  it.each(VIBES)("sites.vibe accepts %s", async (v) => expect(await siteAccepts("vibe", v)).toBe(true));
  it.each(THEMES)("sites.theme accepts %s", async (v) => expect(await siteAccepts("theme", v)).toBe(true));
  it.each(JOB_TYPES)("sites.job_type accepts %s", async (v) => expect(await siteAccepts("job_type", v)).toBe(true));

  it("sites rejects values outside the enums", async () => {
    expect(await siteAccepts("vibe", "neon")).toBe(false);
    expect(await siteAccepts("theme", "sepia")).toBe(false);
    expect(await siteAccepts("job_type", "astronaut")).toBe(false);
    expect(await siteAccepts("accent", "#FFA23A")).toBe(false);
    expect(await siteAccepts("accent", "orange")).toBe(false);
  });

  it.each(VERSION_SOURCES)("site_versions.source accepts %s", async (source) => {
    expect(await acceptsWith((tx) => insertVersion(tx, siteId, { source }))).toBe(true);
  });

  it.each(EVENT_TYPES)("events.type accepts %s", async (type) => {
    expect(await accepts("insert into events (site_id, type) values ($1, $2)", [siteId, type])).toBe(true);
  });

  it("events.type rejects unknown types", async () => {
    expect(await accepts("insert into events (site_id, type) values ($1, 'hover')", [siteId])).toBe(false);
  });

  it.each(CARD_STATUSES.filter((s) => s !== "assigned"))("cards.status accepts %s without an owner", async (status) => {
    expect(await accepts("insert into cards (status) values ($1)", [status])).toBe(true);
  });

  it("cards must have an owner exactly when assigned", async () => {
    expect(await accepts("insert into cards (status) values ('assigned')")).toBe(false);
  });

  const SLUG_SAMPLES = [
    "jane",
    "jane-perera",
    "j4ne",
    "abc",
    "x".repeat(40),
    "ab",
    "x".repeat(41),
    "-jane",
    "jane-",
    "jane--perera",
    "jane_perera",
    "Jane",
    "jané",
    ...RESERVED_SLUGS,
  ];

  it.each(SLUG_SAMPLES)("profiles.slug agrees with SlugSchema on %j", async (slug) => {
    const userId = await t.createUser();
    const inDb = await accepts("insert into profiles (user_id, slug) values ($1, $2)", [userId, slug]);
    // SlugSchema normalises case first; the database expects normalised input.
    const inSchema = slug === slug.toLowerCase() && SlugSchema.safeParse(slug).success;
    expect(inDb).toBe(inSchema);
  });
});

describe("card codes", () => {
  it("are generated from the alphabet, unique and well spread", async () => {
    const { rows } = await t.db.query<{ code: string }>(
      "select public.gen_card_code() as code from generate_series(1, 2000)",
    );
    const codes = rows.map((r) => r.code);
    expect(codes.every((code) => CardCodeSchema.safeParse(code).success)).toBe(true);
    expect(new Set(codes).size).toBe(codes.length);
    const used = new Set(codes.join(""));
    expect([...CARD_CODE_ALPHABET].every((char) => used.has(char))).toBe(true);
  });

  it("are assigned by default when a card is issued", async () => {
    const { rows } = await t.as("service", (tx) =>
      tx.query<{ code: string; status: string }>("insert into cards default values returning code, status"),
    );
    expect(CardCodeSchema.safeParse(rows[0]!.code).success).toBe(true);
    expect(rows[0]!.status).toBe("unassigned");
  });
});

describe("site versions", () => {
  it("can't be updated by any role, including the service role", async () => {
    const { versionId } = await seedOwner(t, "immutable");
    await expect(
      t.as("service", (tx) => tx.query("update site_versions set source = 'manual' where id = $1", [versionId])),
    ).rejects.toThrow(/immutable/);
  });

  it("can only be pointed at by their own site", async () => {
    const a = await seedOwner(t, "pointer-a");
    const b = await seedOwner(t, "pointer-b");
    await expect(
      t.as("service", (tx) =>
        tx.query("update sites set published_version_id = $1 where id = $2", [b.versionId, a.siteId]),
      ),
    ).rejects.toThrow(/sites_published_version_same_site/);
  });

  it("can only have a parent from the same site", async () => {
    const a = await seedOwner(t, "parent-a");
    const b = await seedOwner(t, "parent-b");
    await expect(
      t.as("service", (tx) => insertVersion(tx, a.siteId, { parentId: b.versionId, source: "ai_edit" })),
    ).rejects.toThrow(/site_versions_parent_same_site/);
  });
});

describe("deleting an account", () => {
  it("removes all of its data and makes its card inactive, keeping the code", async () => {
    const { userId, siteId } = await seedOwner(t, "leaving", { publish: true });
    const code = await t.as("service", async (tx) => {
      await tx.query("insert into events (site_id, type) values ($1, 'tap')", [siteId]);
      const { rows } = await tx.query<{ code: string }>(
        "insert into cards (user_id, status) values ($1, 'assigned') returning code",
        [userId],
      );
      return rows[0]!.code;
    });

    await t.db.query("delete from auth.users where id = $1", [userId]);

    const remaining = await t.db.query<{ n: number }>(
      `select (select count(*) from profiles where user_id = $1)
            + (select count(*) from sites where id = $2)
            + (select count(*) from site_versions where site_id = $2)
            + (select count(*) from events where site_id = $2) as n`,
      [userId, siteId],
    );
    expect(Number(remaining.rows[0]!.n)).toBe(0);

    const card = await t.db.query<{ user_id: string | null; status: string }>(
      "select user_id, status from cards where code = $1",
      [code],
    );
    expect(card.rows).toEqual([{ user_id: null, status: "inactive" }]);
  });
});
