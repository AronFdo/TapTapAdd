import type { OnboardingAnswers } from "@/lib/schemas/answers";
import { LayoutSpecSchema, type LayoutSpec } from "@/lib/schemas/layout";
import type { JobType } from "@/lib/schemas/tokens";
import { sectionOrder, skillsStyle, type SectionId } from "./rules";

/**
 * The layout used when the AI's spec is unusable, and the baseline the AI
 * improves on. Copy comes straight from the profile and the owner's answers,
 * unrewritten. Sections with nothing to show are hidden by the renderer.
 */
export function defaultLayout(jobType: JobType, answers?: OnboardingAnswers): LayoutSpec {
  const props: Partial<Record<SectionId, Record<string, unknown>>> = {
    skills: { style: skillsStyle(jobType) },
    highlights: { items: answers?.proudestWork ? [{ body: answers.proudestWork }] : [] },
    "fun-fact": { fact: answers?.funFact ?? "" },
    "contact-cta": { reasons: answers?.contactReasons ?? [] },
  };

  return LayoutSpecSchema.parse({
    sections: sectionOrder(jobType).map((component) => ({ component, props: props[component] ?? {} })),
  });
}
