import { z } from "zod";

/**
 * A portfolio layout: an ordered list of registry components with their props.
 *
 * This schema only checks the shape. Each section's props are validated
 * against its component's schema in the registry, and the renderer drops
 * unknown or invalid sections (Phase 2).
 */

/** Registry ids are stable kebab-case strings such as `experience-timeline`. */
export const ComponentIdSchema = z
  .string()
  .regex(/^[a-z][a-z0-9]*(-[a-z0-9]+)*$/, "Component ids are kebab-case")
  .max(48);

export const LayoutSectionSchema = z.object({
  component: ComponentIdSchema,
  props: z.record(z.string(), z.unknown()).default({}),
  /** Hidden sections stay in the layout so they can be switched back on. */
  hidden: z.boolean().default(false),
});

export const LayoutSpecSchema = z.object({
  sections: z.array(LayoutSectionSchema).max(30),
});

export type ComponentId = z.infer<typeof ComponentIdSchema>;
export type LayoutSection = z.infer<typeof LayoutSectionSchema>;
export type LayoutSpec = z.infer<typeof LayoutSpecSchema>;
