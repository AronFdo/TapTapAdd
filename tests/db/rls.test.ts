import { beforeAll, describe, expect, it } from "vitest";
import { createTestDatabase, type TestDatabase } from "./harness";
import { insertVersion, seedOwner } from "./seed";

let t: TestDatabase;
let alice: Awaited<ReturnType<typeof seedOwner>>;
let bob: Awaited<ReturnType<typeof seedOwner>>;

const TABLES = ["profiles", "sites", "site_versions", "cards", "events"] as const;

beforeAll(async () => {
  t = await createTestDatabase();
  alice = await seedOwner(t, "alice", { publish: true });
  bob = await seedOwner(t, "bob", { publish: true });
  await t.as("service", async (tx) => {
    await tx.query("insert into events (site_id, type) values ($1, 'view'), ($2, 'view')", [alice.siteId, bob.siteId]);
    await tx.query("insert into cards (user_id, status) values ($1, 'assigned'), ($2, 'assigned')", [
      alice.userId,
      bob.userId,
    ]);
  });
});

function count(rows: unknown[]) {
  return rows.length;
}

describe("anonymous visitors", () => {
  it.each(TABLES)("can't read %s", async (table) => {
    await expect(t.as("anon", (tx) => tx.query(`select * from ${table}`))).rejects.toThrow(/permission denied/);
  });

  it.each(TABLES)("can't write %s", async (table) => {
    await expect(t.as("anon", (tx) => tx.query(`delete from ${table}`))).rejects.toThrow(/permission denied/);
  });

  it("can read published sites", async () => {
    const { rows } = await t.as("anon", (tx) => tx.query<{ slug: string }>("select slug from public_sites order by slug"));
    expect(rows.map((r) => r.slug)).toEqual(["alice", "bob"]);
  });
});

describe("public_sites", () => {
  async function publicProfile(slug: string) {
    const { rows } = await t.as("anon", (tx) =>
      tx.query<{ profile: Record<string, unknown> }>("select profile from public_sites where slug = $1", [slug]),
    );
    return rows[0]?.profile;
  }

  it("exposes no hidden fields", async () => {
    const profile = await publicProfile("alice");
    const json = JSON.stringify(profile);
    for (const hidden of ["+94 77 000 0000", "Example Lane", "1994-05-12", "photos/jane.jpg", "jane.example.com"]) {
      expect(json).not.toContain(hidden);
    }
    expect(profile).not.toHaveProperty("photo");
    expect(profile?.contact).toEqual({ email: { value: "jane@example.com", visible: true } });
    expect(profile?.links).toEqual([
      { kind: "linkedin", url: "https://www.linkedin.com/in/jane-example", visible: true },
    ]);
  });

  it("keeps fields the owner turned on", async () => {
    await seedOwner(t, "open-book", {
      publish: true,
      profile: {
        name: "Open Book",
        photo: { value: "photos/open.jpg", visible: true },
        contact: { phone: { value: "+94 11 000 0000", visible: true } },
      },
    });
    const profile = await publicProfile("open-book");
    expect(profile?.photo).toEqual({ value: "photos/open.jpg", visible: true });
    expect(profile?.contact).toEqual({ phone: { value: "+94 11 000 0000", visible: true } });
  });

  it("treats a missing or malformed visibility flag as hidden", async () => {
    const { rows } = await t.db.query<{ p: Record<string, unknown> }>(
      `select public.public_profile($1) as p`,
      [
        {
          name: "Raw",
          photo: { value: "photos/raw.jpg" },
          contact: { phone: { value: "1" }, email: { value: "a@b.co", visible: "yes" } },
          links: [{ kind: "x", url: "https://x.com/raw" }],
        },
      ],
    );
    expect(rows[0]!.p).toEqual({ name: "Raw", contact: {}, links: [] });
  });

  it("shows the published version, not the draft", async () => {
    const owner = await seedOwner(t, "drafting", { publish: true });
    await t.as({ userId: owner.userId }, async (tx) => {
      const draft = await insertVersion(tx, owner.siteId, {
        profile: { name: "Unpublished name" },
        source: "manual",
        parentId: owner.versionId,
      });
      await tx.query("update sites set draft_version_id = $1 where id = $2", [draft, owner.siteId]);
    });
    const profile = await publicProfile("drafting");
    expect(profile?.name).toBe("Jane Perera");
  });

  it("hides sites that were never published", async () => {
    await seedOwner(t, "unpublished");
    expect(await publicProfile("unpublished")).toBeUndefined();
  });

  it.each(["anon", "authenticated"])("grants %s select only", async (role) => {
    const { rows } = await t.db.query<{ privilege: string; granted: boolean }>(
      `select privilege, has_table_privilege($1, 'public.public_sites', privilege) as granted
       from unnest(array['select', 'insert', 'update', 'delete', 'truncate']) as privilege`,
      [role],
    );
    expect(rows.filter((r) => r.granted).map((r) => r.privilege)).toEqual(["select"]);
  });
});

describe("signed-in users", () => {
  it.each(TABLES)("see only their own %s", async (table) => {
    const { rows } = await t.as({ userId: alice.userId }, (tx) => tx.query(`select * from ${table}`));
    const theirs = await t.db.query(
      table === "profiles" || table === "sites" || table === "cards"
        ? `select * from ${table} where user_id = $1`
        : `select * from ${table} where site_id = (select id from sites where user_id = $1)`,
      [alice.userId],
    );
    expect(count(rows)).toBeGreaterThan(0);
    expect(count(rows)).toBe(count(theirs.rows));
  });

  it("can't change someone else's profile or site", async () => {
    const result = await t.as({ userId: alice.userId }, async (tx) => {
      const a = await tx.query("update profiles set slug = 'stolen' where user_id = $1", [bob.userId]);
      const b = await tx.query("update sites set published_version_id = null where id = $1", [bob.siteId]);
      const c = await tx.query("delete from profiles where user_id = $1", [bob.userId]);
      return [a.affectedRows, b.affectedRows, c.affectedRows];
    });
    expect(result).toEqual([0, 0, 0]);
  });

  it("can't create a profile or site for someone else", async () => {
    const carol = await t.createUser();
    await expect(
      t.as({ userId: alice.userId }, (tx) => tx.query("insert into profiles (user_id) values ($1)", [carol])),
    ).rejects.toThrow(/row-level security/);
    await expect(
      t.as({ userId: alice.userId }, (tx) =>
        tx.query("insert into sites (user_id, accent, job_type) values ($1, '#ffa23a', 'design')", [bob.userId]),
      ),
    ).rejects.toThrow(/row-level security|duplicate key/);
  });

  it("can't add a version to someone else's site", async () => {
    await expect(
      t.as({ userId: alice.userId }, (tx) => insertVersion(tx, bob.siteId, { source: "manual" })),
    ).rejects.toThrow(/row-level security/);
  });

  it("can't change or delete their own versions", async () => {
    await expect(
      t.as({ userId: alice.userId }, (tx) =>
        tx.query("update site_versions set source = 'manual' where id = $1", [alice.versionId]),
      ),
    ).rejects.toThrow(/permission denied/);
    await expect(
      t.as({ userId: alice.userId }, (tx) => tx.query("delete from site_versions where id = $1", [alice.versionId])),
    ).rejects.toThrow(/permission denied/);
  });

  it("can't issue, claim or edit cards directly", async () => {
    await expect(
      t.as({ userId: alice.userId }, (tx) => tx.query("insert into cards default values")),
    ).rejects.toThrow(/permission denied/);
    await expect(
      t.as({ userId: alice.userId }, (tx) => tx.query("update cards set status = 'inactive'")),
    ).rejects.toThrow(/permission denied/);
  });

  it("can't write events", async () => {
    await expect(
      t.as({ userId: alice.userId }, (tx) =>
        tx.query("insert into events (site_id, type) values ($1, 'tap')", [alice.siteId]),
      ),
    ).rejects.toThrow(/permission denied/);
  });
});
