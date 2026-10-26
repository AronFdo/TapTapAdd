import { describe, expect, it } from "vitest";
import { OnboardingAnswersSchema } from "@/lib/schemas/answers";
import { ProfileSchema } from "@/lib/schemas/profile";
import { JOB_TYPES } from "@/lib/schemas/tokens";
import { janeProfile } from "@/tests/fixtures/profiles/jane";
import { defaultLayout } from "./defaults";
import { resolveLayout } from "./Renderer";
import { sectionOrder } from "./rules";

const profile = ProfileSchema.parse(janeProfile);
const answers = OnboardingAnswersSchema.parse({
  proudestWork: "The onboarding redesign.",
  contactReasons: ["Mentoring"],
  funFact: "I cycle.",
});

describe("defaultLayout", () => {
  it.each(JOB_TYPES)("%s follows the job type's section order", (jobType) => {
    expect(defaultLayout(jobType).sections.map((s) => s.component)).toEqual(sectionOrder(jobType));
  });

  it.each(JOB_TYPES)("%s has valid props for every section", (jobType) => {
    const outcomes = resolveLayout(defaultLayout(jobType, answers), profile, "orbit");
    expect(outcomes.filter((o) => o.status === "invalid" || o.status === "unknown")).toEqual([]);
  });

  it("carries the answers into highlights, fun fact and contact", () => {
    const sections = defaultLayout("design", answers).sections;
    const props = (id: string) => sections.find((s) => s.component === id)?.props;
    expect(props("highlights")).toEqual({ items: [{ body: "The onboarding redesign." }] });
    expect(props("fun-fact")).toEqual({ fact: "I cycle." });
    expect(props("contact-cta")).toEqual({ reasons: ["Mentoring"] });
  });

  it("leaves answer-driven sections empty without answers, so they hide", () => {
    const outcomes = resolveLayout(defaultLayout("design"), profile, "orbit");
    const status = (id: string) => outcomes.find((o) => o.component === id)?.status;
    expect(status("highlights")).toBe("empty");
    expect(status("fun-fact")).toBe("empty");
    expect(status("contact-cta")).toBe("render");
  });
});
