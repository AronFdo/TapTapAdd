import { createElement, type ReactNode } from "react";
import type { z } from "zod";
import type { Profile } from "@/lib/schemas/profile";
import type { RenderContext, SiteComponentDefinition } from "./types";

export type ResolvedSection = {
  /** True when the section has nothing to show and should be hidden. */
  empty: boolean;
  render: (context: RenderContext) => ReactNode;
};

/** A registry entry with its prop types erased, so entries can share one list. */
export type RegistryEntry = Pick<SiteComponentDefinition<z.ZodType>, "id" | "description" | "vibes" | "props"> & {
  Component: SiteComponentDefinition<z.ZodType>["Component"];
  example: unknown;
  /** Validates raw layout props against this component. Null when they don't fit. */
  resolve: (rawProps: unknown, profile: Profile) => ResolvedSection | null;
};

export function defineSiteComponent<S extends z.ZodType>(definition: SiteComponentDefinition<S>): RegistryEntry {
  const { Component, hasContent, ...rest } = definition;
  return {
    ...rest,
    Component: Component as RegistryEntry["Component"],
    resolve(rawProps, profile) {
      const parsed = definition.props.safeParse(rawProps);
      if (!parsed.success) return null;
      const props = parsed.data;
      return {
        empty: !hasContent(props, profile),
        render: (context) => createElement(Component, { props, profile, context }),
      };
    },
  };
}
