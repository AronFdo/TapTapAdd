import { z } from "zod";
import { LayoutSpecSchema } from "./layout";
import { ProfileSchema } from "./profile";
import { SiteTokensSchema } from "./tokens";

/**
 * What a site version stores, and what an edit patches. Versions are
 * self-contained snapshots, so undo restores copy, layout and look together
 * and the published site never changes until the owner publishes again.
 */
export const SiteDocumentSchema = z.object({
  profile: ProfileSchema,
  layout: LayoutSpecSchema,
  tokens: SiteTokensSchema,
});

export const VERSION_SOURCES = ["generate", "ai_edit", "manual"] as const;
export const VersionSourceSchema = z.enum(VERSION_SOURCES);

/** No IPs, user agents or fingerprints are ever recorded alongside these. */
export const EVENT_TYPES = ["tap", "view", "vcard", "link_click"] as const;
export const EventTypeSchema = z.enum(EVENT_TYPES);

export type SiteDocument = z.infer<typeof SiteDocumentSchema>;
export type VersionSource = z.infer<typeof VersionSourceSchema>;
export type EventType = z.infer<typeof EventTypeSchema>;
