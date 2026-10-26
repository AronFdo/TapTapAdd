import { describe, expect, it } from "vitest";
import { janeProfile } from "@/tests/fixtures/profiles/jane";
import { ProfileSchema } from "./profile";

describe("ProfileSchema", () => {
  it("accepts a full profile", () => {
    expect(ProfileSchema.safeParse(janeProfile).success).toBe(true);
  });

  it("fills defaults for a minimal profile", () => {
    const profile = ProfileSchema.parse({ name: "Jane Perera" });
    expect(profile).toMatchObject({
      headline: "",
      summary: "",
      contact: {},
      links: [],
      experience: [],
      education: [],
      skills: [],
      projects: [],
    });
  });

  it("hides phone, address, date of birth and photo unless turned on", () => {
    const profile = ProfileSchema.parse({
      name: "Jane Perera",
      photo: { value: "photos/jane.jpg" },
      contact: {
        email: { value: "jane@example.com" },
        phone: { value: "+94 77 000 0000" },
        address: { value: "1 Example Lane" },
        dateOfBirth: { value: "1994-05-12" },
      },
      links: [{ kind: "linkedin", url: "https://linkedin.com/in/jane" }],
    });
    expect(profile.photo?.visible).toBe(false);
    expect(profile.contact.phone?.visible).toBe(false);
    expect(profile.contact.address?.visible).toBe(false);
    expect(profile.contact.dateOfBirth?.visible).toBe(false);
    expect(profile.contact.email?.visible).toBe(true);
    expect(profile.links[0]?.visible).toBe(true);
  });

  it("drops ID numbers and other unknown fields", () => {
    const profile = ProfileSchema.parse({
      name: "Jane Perera",
      nic: "199412345678",
      passport: "N1234567",
      contact: { email: { value: "jane@example.com" }, nicNumber: { value: "941234567V" } },
    });
    const json = JSON.stringify(profile);
    expect(json).not.toContain("199412345678");
    expect(json).not.toContain("N1234567");
    expect(json).not.toContain("941234567V");
  });

  it("trims text", () => {
    expect(ProfileSchema.parse({ name: "  Jane Perera  " }).name).toBe("Jane Perera");
  });

  it.each([
    ["a missing name", {}],
    ["an empty name", { name: "   " }],
    ["a name that is too long", { name: "x".repeat(121) }],
    ["an invalid email", { name: "J", contact: { email: { value: "not-an-email" } } }],
    ["letters in a phone number", { name: "J", contact: { phone: { value: "call me" } } }],
    ["an invalid date of birth", { name: "J", contact: { dateOfBirth: { value: "12/05/1994" } } }],
    ["a javascript: link", { name: "J", links: [{ kind: "website", url: "javascript:alert(1)" }] }],
    ["an unknown link kind", { name: "J", links: [{ kind: "myspace", url: "https://example.com" }] }],
    ["a day in a partial date", { name: "J", experience: [{ role: "R", organisation: "O", start: "2021-03-01" }] }],
    ["month 13", { name: "J", experience: [{ role: "R", organisation: "O", start: "2021-13" }] }],
    ["an empty skill group", { name: "J", skills: [{ label: "Tools", items: [] }] }],
    ["too many projects", { name: "J", projects: Array.from({ length: 25 }, () => ({ name: "P" })) }],
  ])("rejects %s", (_, input) => {
    expect(ProfileSchema.safeParse(input).success).toBe(false);
  });
});
