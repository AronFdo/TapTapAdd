import { z } from "zod";
import { about } from "@/components/site/About";
import { contactCta } from "@/components/site/ContactCta";
import { education } from "@/components/site/Education";
import { experienceTimeline } from "@/components/site/ExperienceTimeline";
import { footer } from "@/components/site/Footer";
import { funFact } from "@/components/site/FunFact";
import { hero } from "@/components/site/Hero";
import { highlights } from "@/components/site/Highlights";
import { projectsGrid } from "@/components/site/ProjectsGrid";
import { skills } from "@/components/site/Skills";
import type { Vibe } from "@/lib/schemas/tokens";
import type { RegistryEntry } from "./define";

/**
 * Every portfolio component the renderer and the AI can use. Adding one means
 * an entry here, a fixture test and a gallery preview (both driven by its
 * `example`). Ids are stored in layouts, so they are never renamed.
 */
export const REGISTRY: readonly RegistryEntry[] = [
  hero,
  about,
  highlights,
  experienceTimeline,
  projectsGrid,
  skills,
  education,
  funFact,
  contactCta,
  footer,
];

const BY_ID = new Map(REGISTRY.map((entry) => [entry.id, entry]));

export function getComponent(id: string): RegistryEntry | undefined {
  return BY_ID.get(id);
}

export type CatalogueEntry = {
  id: string;
  description: string;
  props: unknown;
};

/**
 * The registry as the layout and edit prompts see it: ids, descriptions and
 * prop JSON Schemas for the components available in a vibe. Stable output,
 * so the prompt prefix can be cached.
 */
export function catalogue(vibe: Vibe): CatalogueEntry[] {
  return REGISTRY.filter((entry) => entry.vibes.includes(vibe)).map((entry) => ({
    id: entry.id,
    description: entry.description,
    props: z.toJSONSchema(entry.props, { io: "input" }),
  }));
}
