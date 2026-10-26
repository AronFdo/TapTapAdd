import { describe, expect, it } from "vitest";
import { ProfileSchema } from "@/lib/schemas/profile";
import { janeProfile } from "@/tests/fixtures/profiles/jane";
import { formatDateRange, formatPartialDate, initials, paragraphs, visibleProfile } from "./format";

describe("formatPartialDate", () => {
  it.each([
    ["2021-03", "Mar 2021"],
    ["2021-12", "Dec 2021"],
    ["2021", "2021"],
  ])("%s → %s", (input, output) => {
    expect(formatPartialDate(input)).toBe(output);
  });
});

describe("formatDateRange", () => {
  it.each([
    [["2021-03", undefined, true], "Mar 2021 – Now"],
    [["2018", "2021-02", false], "2018 – Feb 2021"],
    [[undefined, "2017", false], "2017"],
    [["2019", undefined, false], "2019"],
    [["2019", "2019", false], "2019"],
    [[undefined, undefined, false], ""],
  ] as const)("%j → %s", ([start, end, current], output) => {
    expect(formatDateRange(start, end, current)).toBe(output);
  });
});

describe("initials", () => {
  it.each([
    ["Jane Perera", "JP"],
    ["Kasun Saman Wickramasinghe", "KW"],
    ["Madonna", "M"],
    ["  amaya   fernando ", "AF"],
  ])("%s → %s", (name, output) => {
    expect(initials(name)).toBe(output);
  });
});

describe("paragraphs", () => {
  it("splits on blank lines and drops empty ones", () => {
    expect(paragraphs("One.\n\n  \n\nTwo\nstill two.\n\n")).toEqual(["One.", "Two\nstill two."]);
  });
});

describe("visibleProfile", () => {
  const profile = visibleProfile(ProfileSchema.parse(janeProfile));

  it("removes hidden contact fields and the hidden photo", () => {
    expect(profile.contact.phone).toBeUndefined();
    expect(profile.contact.address).toBeUndefined();
    expect(profile.contact.dateOfBirth).toBeUndefined();
    expect(profile.photo).toBeUndefined();
  });

  it("keeps visible ones", () => {
    expect(profile.contact.email?.value).toBe("jane@example.com");
  });

  it("removes hidden links", () => {
    expect(profile.links.map((link) => link.kind)).toEqual(["linkedin"]);
  });
});
