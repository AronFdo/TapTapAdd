import { z } from "zod";

/**
 * The structured profile extracted from a CV and edited by its owner.
 *
 * Privacy (PDPA): there are deliberately no fields for NIC, passport or other
 * ID numbers. Unknown keys are stripped on parse, so an `nic` key in AI output
 * never survives validation. Phone, address, date of birth and photo are
 * wrapped in `{ value, visible }` and default to hidden. The `public_sites`
 * view applies the same flags in SQL and treats a missing flag as hidden.
 */

const text = (max: number) => z.string().trim().max(max);
const requiredText = (max: number) => text(max).min(1);

/** "2021" or "2021-03". CVs rarely give exact days. */
export const PartialDateSchema = z
  .string()
  .regex(/^\d{4}(-(0[1-9]|1[0-2]))?$/, "Use YYYY or YYYY-MM");

function visible<T extends z.ZodType>(value: T, visibleByDefault: boolean) {
  return z.object({ value, visible: z.boolean().default(visibleByDefault) });
}

export const ContactSchema = z.object({
  email: visible(z.email().max(254), true).optional(),
  phone: visible(text(40).regex(/^[+()\d\s.-]{5,}$/, "Not a phone number"), false).optional(),
  address: visible(requiredText(300), false).optional(),
  dateOfBirth: visible(z.iso.date(), false).optional(),
});

export const LinkKindSchema = z.enum(["linkedin", "github", "website", "portfolio", "x", "behance", "dribbble", "other"]);

export const LinkSchema = z.object({
  kind: LinkKindSchema,
  url: z.url({ protocol: /^https?$/ }).max(500),
  label: text(80).optional(),
  visible: z.boolean().default(true),
});

export const ExperienceSchema = z.object({
  role: requiredText(120),
  organisation: requiredText(120),
  location: text(120).optional(),
  start: PartialDateSchema.optional(),
  /** Absent with `current: false` means the end date is unknown. */
  end: PartialDateSchema.optional(),
  current: z.boolean().default(false),
  summary: text(1000).optional(),
  highlights: z.array(requiredText(300)).max(12).default([]),
});

export const EducationSchema = z.object({
  institution: requiredText(160),
  qualification: text(160).optional(),
  field: text(120).optional(),
  start: PartialDateSchema.optional(),
  end: PartialDateSchema.optional(),
  notes: text(500).optional(),
});

export const SkillGroupSchema = z.object({
  /** For example "Languages" or "Tools". Absent for a single flat list. */
  label: text(60).optional(),
  items: z.array(requiredText(60)).min(1).max(40),
});

export const ProjectSchema = z.object({
  name: requiredText(120),
  role: text(120).optional(),
  summary: text(1000).optional(),
  url: z.url({ protocol: /^https?$/ }).max(500).optional(),
  /** Storage path of an uploaded thumbnail, never a remote URL. */
  thumbnail: text(300).optional(),
  year: z.string().regex(/^\d{4}$/).optional(),
  tags: z.array(requiredText(40)).max(12).default([]),
});

export const CertificationSchema = z.object({
  name: requiredText(160),
  issuer: text(120).optional(),
  year: z.string().regex(/^\d{4}$/).optional(),
});

export const LanguageSchema = z.object({
  name: requiredText(60),
  level: text(60).optional(),
});

export const ProfileSchema = z.object({
  name: requiredText(120),
  headline: text(160).default(""),
  summary: text(2000).default(""),
  /** City and country, shown publicly. Street addresses go in `contact.address`. */
  location: text(120).optional(),
  /** Storage path of the profile photo. */
  photo: visible(requiredText(300), false).optional(),
  contact: ContactSchema.default({}),
  links: z.array(LinkSchema).max(12).default([]),
  experience: z.array(ExperienceSchema).max(30).default([]),
  education: z.array(EducationSchema).max(15).default([]),
  skills: z.array(SkillGroupSchema).max(12).default([]),
  projects: z.array(ProjectSchema).max(24).default([]),
  certifications: z.array(CertificationSchema).max(30).default([]),
  languages: z.array(LanguageSchema).max(12).default([]),
});

export type PartialDate = z.infer<typeof PartialDateSchema>;
export type Contact = z.infer<typeof ContactSchema>;
export type Link = z.infer<typeof LinkSchema>;
export type LinkKind = z.infer<typeof LinkKindSchema>;
export type Experience = z.infer<typeof ExperienceSchema>;
export type Education = z.infer<typeof EducationSchema>;
export type SkillGroup = z.infer<typeof SkillGroupSchema>;
export type Project = z.infer<typeof ProjectSchema>;
export type Profile = z.infer<typeof ProfileSchema>;
/** What callers pass in before defaults are applied, for example from the AI. */
export type ProfileInput = z.input<typeof ProfileSchema>;
