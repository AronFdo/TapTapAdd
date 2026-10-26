import { describe, expect, it } from "vitest";
import { ComponentIdSchema } from "@/lib/schemas/layout";
import { VIBES } from "@/lib/schemas/tokens";
import { REGISTRY, catalogue, getComponent } from "./registry";

describe("registry", () => {
  it("has unique kebab-case ids", () => {
    const ids = REGISTRY.map((entry) => entry.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const id of ids) expect(ComponentIdSchema.safeParse(id).success).toBe(true);
  });

  it.each(REGISTRY.map((entry) => [entry.id, entry] as const))("%s has a valid example and a description", (_id, entry) => {
    expect(entry.props.safeParse(entry.example).success).toBe(true);
    expect(entry.description.length).toBeGreaterThan(20);
    expect(entry.vibes.length).toBeGreaterThan(0);
  });

  it("looks components up by id", () => {
    expect(getComponent("hero")?.id).toBe("hero");
    expect(getComponent("marquee")).toBeUndefined();
  });

  it("drops props that would carry contact details", () => {
    // Contact data comes from the profile so hidden fields can't leak through layout props.
    const parsed = getComponent("contact-cta")?.props.parse({ email: "x@example.com", phone: "+94 77 000 0000" });
    expect(parsed).not.toHaveProperty("email");
    expect(parsed).not.toHaveProperty("phone");
  });
});

describe("catalogue", () => {
  it.each(VIBES)("lists every %s component with a JSON Schema for its props", (vibe) => {
    const entries = catalogue(vibe);
    expect(entries.map((e) => e.id)).toEqual(REGISTRY.filter((e) => e.vibes.includes(vibe)).map((e) => e.id));
    for (const entry of entries) expect(entry.props).toMatchObject({ type: "object" });
  });

  it("is stable, so the prompt prefix can be cached", () => {
    expect(JSON.stringify(catalogue("orbit"))).toBe(JSON.stringify(catalogue("orbit")));
  });
});
