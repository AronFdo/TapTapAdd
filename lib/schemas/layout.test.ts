import { describe, expect, it } from "vitest";
import { LayoutSpecSchema } from "./layout";

describe("LayoutSpecSchema", () => {
  it("accepts ordered sections and fills defaults", () => {
    const layout = LayoutSpecSchema.parse({
      sections: [{ component: "hero", props: { tagline: "Hi" } }, { component: "experience-timeline" }],
    });
    expect(layout.sections.map((s) => s.component)).toEqual(["hero", "experience-timeline"]);
    expect(layout.sections[1]).toEqual({ component: "experience-timeline", props: {}, hidden: false });
  });

  it("accepts an empty layout", () => {
    expect(LayoutSpecSchema.safeParse({ sections: [] }).success).toBe(true);
  });

  it.each([
    ["a bare array", [{ component: "hero" }]],
    ["a non-kebab-case id", { sections: [{ component: "ExperienceTimeline" }] }],
    ["markup as an id", { sections: [{ component: "<script>" }] }],
    ["array props", { sections: [{ component: "hero", props: [] }] }],
    ["too many sections", { sections: Array.from({ length: 31 }, () => ({ component: "about" })) }],
  ])("rejects %s", (_, input) => {
    expect(LayoutSpecSchema.safeParse(input).success).toBe(false);
  });
});
