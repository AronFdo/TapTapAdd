import { z } from "zod";

/** The three short onboarding questions. Each can be skipped. */

export const CONTACT_REASONS = [
  "Job opportunities",
  "Freelance work",
  "Collaborations",
  "Speaking",
  "Mentoring",
  "Just saying hello",
] as const;

export const OnboardingAnswersSchema = z.object({
  /** "What work are you proudest of?" */
  proudestWork: z.string().trim().max(600).default(""),
  /** "What should people contact you about?" Preset keys or short custom text. */
  contactReasons: z.array(z.string().trim().min(1).max(80)).max(6).default([]),
  /** "Tell us one fun fact about you." */
  funFact: z.string().trim().max(280).default(""),
});

export type OnboardingAnswers = z.infer<typeof OnboardingAnswersSchema>;
