import { OnboardingAnswersSchema, type OnboardingAnswers } from "@/lib/schemas/answers";
import { ProfileSchema, type Profile } from "@/lib/schemas/profile";
import { SiteTokensSchema, type SiteTokens } from "@/lib/schemas/tokens";
import { amayaProfile } from "./profiles/amaya";
import { janeProfile } from "./profiles/jane";
import { kasunProfile } from "./profiles/kasun";
import { ruwanProfile } from "./profiles/ruwan";

/**
 * Hand-written sites for design review at /dev/sites/[fixture] and for
 * renderer tests: a profile, the owner's choices and their answers. All
 * people and organisations are fictional.
 */
export type FixtureSite = {
  profile: Profile;
  tokens: SiteTokens;
  answers: OnboardingAnswers;
};

function fixture(profile: unknown, tokens: unknown, answers: unknown): FixtureSite {
  return {
    profile: ProfileSchema.parse(profile),
    tokens: SiteTokensSchema.parse(tokens),
    answers: OnboardingAnswersSchema.parse(answers),
  };
}

export const FIXTURE_SITES = {
  jane: fixture(
    janeProfile,
    { vibe: "orbit", theme: "dark", accent: "#ffa23a", jobType: "design" },
    {
      proudestWork:
        "Redesigning Example Pay's onboarding. We went to one question per screen and completion went from 54% to 81%.",
      contactReasons: ["Job opportunities", "Mentoring"],
      funFact: "I've cycled the full length of Sri Lanka, twice.",
    },
  ),
  kasun: fixture(
    kasunProfile,
    { vibe: "orbit", theme: "dark", accent: "#74e4e0", jobType: "engineering" },
    {
      proudestWork: "Rebuilding dispatch on a queue so drivers get routes in under a second, even on Poya weekends.",
      contactReasons: ["Freelance work", "Collaborations"],
      funFact: "I keep a bonsai that is older than me.",
    },
  ),
  amaya: fixture(
    amayaProfile,
    { vibe: "orbit", theme: "light", accent: "#ff6f99", jobType: "data" },
    {
      proudestWork: "",
      contactReasons: ["Job opportunities", "Just saying hello"],
      funFact: "",
    },
  ),
  ruwan: fixture(ruwanProfile, { vibe: "orbit", theme: "light", accent: "#2f6fdb", jobType: "sales" }, {}),
} satisfies Record<string, FixtureSite>;

export type FixtureName = keyof typeof FIXTURE_SITES;

export function isFixtureName(name: string): name is FixtureName {
  return Object.hasOwn(FIXTURE_SITES, name);
}
