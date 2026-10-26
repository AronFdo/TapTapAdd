import type { ReactNode } from "react";
import type { z } from "zod";
import type { Profile } from "@/lib/schemas/profile";
import type { Vibe } from "@/lib/schemas/tokens";

/** What the page around the portfolio provides, beyond the site document. */
export type RenderContext = {
  /** Turns a storage path (photo, project thumbnail) into a URL, or null when unavailable. */
  assetUrl: (path: string) => string | null;
  /** The vCard download for "Save contact", or null to hide that action. */
  vcardHref: string | null;
};

export type SiteComponentProps<P> = {
  props: P;
  /** Visible fields only. Contact details always come from here, never from props. */
  profile: Profile;
  context: RenderContext;
};

export type SiteComponentDefinition<S extends z.ZodType> = {
  /** Stable, never renamed once shipped: stored layouts refer to it. */
  id: string;
  props: S;
  /** One or two sentences the AI reads when choosing layouts. */
  description: string;
  vibes: readonly Vibe[];
  Component: (args: SiteComponentProps<z.output<S>>) => ReactNode;
  /** False hides the section, so empty sections never render. */
  hasContent: (props: z.output<S>, profile: Profile) => boolean;
  /** Props for the gallery preview and the fixture tests. */
  example: z.input<S>;
};
