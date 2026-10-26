import type { CSSProperties, ReactNode } from "react";
import type { LayoutSpec } from "@/lib/schemas/layout";
import type { Profile } from "@/lib/schemas/profile";
import type { SiteDocument } from "@/lib/schemas/site";
import { vibeCssVariables, type SiteTokens, type Vibe } from "@/lib/schemas/tokens";
import type { ResolvedSection } from "./define";
import { visibleProfile } from "./format";
import { getComponent } from "./registry";
import { vibeTokens } from "./rules";
import type { RenderContext } from "./types";

export type SectionOutcome =
  | { index: number; component: string; status: "render"; section: ResolvedSection }
  | { index: number; component: string; status: "hidden" | "empty" | "unknown" | "unsupported" | "invalid" };

/**
 * Decides what happens to each layout section. Only `render` outcomes reach
 * the page: hidden, empty, unknown, unsupported-in-this-vibe and invalid
 * sections are dropped. Outcomes carry ids and indexes only, so they are safe
 * to log.
 */
export function resolveLayout(layout: LayoutSpec, profile: Profile, vibe: Vibe): SectionOutcome[] {
  return layout.sections.map((section, index) => {
    const base = { index, component: section.component };
    if (section.hidden) return { ...base, status: "hidden" };

    const entry = getComponent(section.component);
    if (!entry) return { ...base, status: "unknown" };
    if (!entry.vibes.includes(vibe)) return { ...base, status: "unsupported" };

    const resolved = entry.resolve(section.props, profile);
    if (!resolved) return { ...base, status: "invalid" };
    if (resolved.empty) return { ...base, status: "empty" };
    return { ...base, status: "render", section: resolved };
  });
}

/** The themed wrapper that sets the vibe tokens for everything inside it. */
export function SiteFrame({ tokens, children }: { tokens: SiteTokens; children: ReactNode }) {
  const style = {
    ...vibeCssVariables(vibeTokens(tokens)),
    colorScheme: tokens.theme,
  } as CSSProperties;
  return (
    <div className="site" data-vibe={tokens.vibe} data-theme={tokens.theme} style={style}>
      {children}
    </div>
  );
}

type RendererProps = {
  document: SiteDocument;
  context: RenderContext;
};

/** Renders a site document as a portfolio, styled by its vibe tokens. */
export function Renderer({ document, context }: RendererProps) {
  const profile = visibleProfile(document.profile);
  return (
    <SiteFrame tokens={document.tokens}>
      <main className="site__page">
        {resolveLayout(document.layout, profile, document.tokens.vibe).map((outcome) =>
          outcome.status === "render" ? (
            <div key={outcome.index} className="site__slot" data-component={outcome.component}>
              {outcome.section.render(context)}
            </div>
          ) : null,
        )}
      </main>
    </SiteFrame>
  );
}
