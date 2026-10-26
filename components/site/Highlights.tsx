import { z } from "zod";
import { defineSiteComponent } from "@/lib/render/define";
import type { SiteComponentProps } from "@/lib/render/types";
import { Section } from "./parts";

const HighlightsProps = z.object({
  title: z.string().trim().min(1).max(60).default("Proudest work"),
  items: z
    .array(
      z.object({
        /** Optional: the default layout has the owner's raw answer and no title. */
        title: z.string().trim().max(80).default(""),
        body: z.string().trim().max(600).default(""),
      }),
    )
    .max(3)
    .default([]),
});

type Props = z.output<typeof HighlightsProps>;

function Highlights({ props }: SiteComponentProps<Props>) {
  return (
    <Section title={props.title}>
      <ul className="site-highlights">
        {props.items.map((item, i) => (
          <li key={i} className="site-highlight">
            {item.title ? <h3 className="site-highlight__title">{item.title}</h3> : null}
            {item.body ? <p className="site-highlight__body">{item.body}</p> : null}
          </li>
        ))}
      </ul>
    </Section>
  );
}

export const highlights = defineSiteComponent({
  id: "highlights",
  props: HighlightsProps,
  description:
    "One to three standout pieces of work, written from the owner's answer about what they're proudest of. Each item is a short title and two or three sentences. Never invent achievements.",
  vibes: ["orbit", "minimal", "editorial", "technical"],
  Component: Highlights,
  hasContent: (props) => props.items.some((item) => item.title || item.body),
  example: {
    items: [
      {
        title: "Onboarding that people finish",
        body: "Rebuilt the Example Pay sign-up around one question per screen. Completion rose from 54% to 81% in a quarter.",
      },
    ],
  },
});
