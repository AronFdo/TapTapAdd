import { describe, expect, it } from "vitest";
import { janeProfile } from "@/tests/fixtures/profiles/jane";
import { OnboardingAnswersSchema } from "./answers";
import { CardCodeSchema } from "./card";
import { SiteDocumentSchema } from "./site";
import { SlugSchema, suggestSlug } from "./slug";

describe("OnboardingAnswersSchema", () => {
  it("lets every question be skipped", () => {
    expect(OnboardingAnswersSchema.parse({})).toEqual({ proudestWork: "", contactReasons: [], funFact: "" });
  });

  it.each([
    ["a long fun fact", { funFact: "x".repeat(281) }],
    ["an empty contact reason", { contactReasons: [""] }],
    ["too many contact reasons", { contactReasons: Array.from({ length: 7 }, (_, i) => `Reason ${i}`) }],
  ])("rejects %s", (_, input) => {
    expect(OnboardingAnswersSchema.safeParse(input).success).toBe(false);
  });
});

describe("SlugSchema", () => {
  it.each(["jane", "jane-perera", "j4ne", "abc"])("accepts %s", (slug) => {
    expect(SlugSchema.safeParse(slug).success).toBe(true);
  });

  it("normalises case and whitespace", () => {
    expect(SlugSchema.parse("  Jane-Perera ")).toBe("jane-perera");
  });

  it.each(["ab", "x".repeat(41), "-jane", "jane-", "jane--perera", "jane_perera", "jané", "www", "api", "c"])(
    "rejects %j",
    (slug) => {
      expect(SlugSchema.safeParse(slug).success).toBe(false);
    },
  );
});

describe("suggestSlug", () => {
  it.each([
    ["Jane Perera", "jane-perera"],
    ["  Dr. A. B. Silva ", "dr-a-b-silva"],
    ["Zoë D'Souza", "zoe-d-souza"],
  ])("%s → %s", (name, slug) => {
    expect(suggestSlug(name)).toBe(slug);
  });
});

describe("CardCodeSchema", () => {
  it("accepts a code and normalises case", () => {
    expect(CardCodeSchema.parse("7K2M9QXH4B")).toBe("7k2m9qxh4b");
  });

  it.each(["7k2m9qxh4", "7k2m9qxh4bb", "7k2m9qxh4i", "7k2m9qxh4l", "7k2m9qxh4o", "7k2m9qxh4u", "7k2m9qxh4-"])(
    "rejects %j",
    (code) => {
      expect(CardCodeSchema.safeParse(code).success).toBe(false);
    },
  );
});

describe("SiteDocumentSchema", () => {
  it("accepts a full document", () => {
    const result = SiteDocumentSchema.safeParse({
      profile: janeProfile,
      layout: { sections: [{ component: "hero" }] },
      tokens: { vibe: "orbit", theme: "dark", accent: "#ffa23a", jobType: "design" },
    });
    expect(result.success).toBe(true);
  });

  it("rejects a document missing its tokens", () => {
    const result = SiteDocumentSchema.safeParse({ profile: janeProfile, layout: { sections: [] } });
    expect(result.success).toBe(false);
  });
});
