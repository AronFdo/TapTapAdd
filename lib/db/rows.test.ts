import { describe, expect, it } from "vitest";
import { janeProfile } from "@/tests/fixtures/profiles/jane";
import { InvalidRowError, parseProfileRow, parsePublicSiteRow, parseSiteRow, parseSiteVersionRow } from "./rows";
import type { Tables } from "./types";

const SITE_ID = "6f1c2a4e-8b1d-4c7e-9a52-3d0e5f7a9b10";
const VERSION_ID = "0b8e7d6c-5a4f-4e3d-8c2b-1a0f9e8d7c6b";
const tokens = { vibe: "orbit", theme: "dark", accent: "#ffa23a", jobType: "design" };
const layout = { sections: [{ component: "hero" }] };

describe("parseSiteVersionRow", () => {
  const row: Tables<"site_versions"> = {
    id: VERSION_ID,
    site_id: SITE_ID,
    parent_id: null,
    profile: janeProfile,
    layout,
    tokens,
    source: "generate",
    created_at: "2026-10-26T10:00:00Z",
  };

  it("parses JSON columns into a document with defaults applied", () => {
    const version = parseSiteVersionRow(row);
    expect(version.document.profile.name).toBe("Jane Perera");
    expect(version.document.layout.sections[0]).toEqual({ component: "hero", props: {}, hidden: false });
    expect(version.source).toBe("generate");
  });

  it("throws an error that names paths but never values", () => {
    const bad = { ...row, profile: { ...janeProfile, contact: { phone: { value: "secret phone" } }, name: "" } };
    try {
      parseSiteVersionRow(bad);
      expect.unreachable();
    } catch (error) {
      expect(error).toBeInstanceOf(InvalidRowError);
      const e = error as InvalidRowError;
      expect(e.paths).toEqual(["profile.name", "profile.contact.phone.value"]);
      expect(JSON.stringify({ message: e.message, paths: e.paths })).not.toMatch(/secret phone|Jane/);
    }
  });
});

describe("parsePublicSiteRow", () => {
  it("accepts a profile with hidden fields already removed", () => {
    const site = parsePublicSiteRow({
      site_id: SITE_ID,
      slug: "jane",
      version_id: VERSION_ID,
      published_at: "2026-10-26T10:00:00Z",
      profile: { name: "Jane Perera", contact: { email: { value: "jane@example.com", visible: true } }, links: [] },
      layout,
      tokens,
    });
    expect(site.document.profile.contact.phone).toBeUndefined();
    expect(site.slug).toBe("jane");
  });

  it("rejects a row with nulls from a broken join", () => {
    expect(() =>
      parsePublicSiteRow({
        site_id: null,
        slug: null,
        version_id: null,
        published_at: null,
        profile: null,
        layout: null,
        tokens: null,
      }),
    ).toThrow(InvalidRowError);
  });
});

describe("parseSiteRow", () => {
  it("gathers the look columns into tokens", () => {
    const site = parseSiteRow({
      id: SITE_ID,
      user_id: SITE_ID,
      vibe: "orbit",
      theme: "light",
      accent: "#ffa23a",
      job_type: "engineering",
      draft_version_id: VERSION_ID,
      published_version_id: null,
      published_at: null,
      created_at: "2026-10-26T10:00:00Z",
      updated_at: "2026-10-26T10:00:00Z",
    });
    expect(site.tokens).toEqual({ vibe: "orbit", theme: "light", accent: "#ffa23a", jobType: "engineering" });
  });
});

describe("parseProfileRow", () => {
  it("allows a profile that hasn't been extracted yet", () => {
    const record = parseProfileRow({
      user_id: SITE_ID,
      slug: null,
      profile: null,
      answers: {},
      edited_paths: [],
      cv_path: null,
      created_at: "2026-10-26T10:00:00Z",
      updated_at: "2026-10-26T10:00:00Z",
    });
    expect(record.profile).toBeNull();
    expect(record.answers).toEqual({ proudestWork: "", contactReasons: [], funFact: "" });
  });
});
