import { z } from "zod";
import { defineSiteComponent } from "@/lib/render/define";
import { paragraphs } from "@/lib/render/format";
import type { SiteComponentProps } from "@/lib/render/types";
import { Section } from "./parts";

const AboutProps = z.object({
  title: z.string().trim().min(1).max(60).default("About"),
  /** Rewritten bio. Blank lines split paragraphs. Falls back to the profile summary. */
  body: z.string().trim().max(1500).optional(),
});

type Props = z.output<typeof AboutProps>;

function bodyText(props: Props, summary: string) {
  return props.body || summary;
}

function About({ props, profile }: SiteComponentProps<Props>) {
  return (
    <Section title={props.title}>
      <div className="site-prose">
        {paragraphs(bodyText(props, profile.summary)).map((p, i) => (
          <p key={i}>{p}</p>
        ))}
      </div>
    </Section>
  );
}

export const about = defineSiteComponent({
  id: "about",
  props: AboutProps,
  description:
    "A short bio in one to three paragraphs. Write `body` in the first person from the profile summary and answers; it falls back to the summary.",
  vibes: ["orbit", "minimal", "editorial", "technical"],
  Component: About,
  hasContent: (props, profile) => paragraphs(bodyText(props, profile.summary)).length > 0,
  example: {
    body: "I design calm, accessible products for people who are short on time.\n\nMost of my work is in payments and health, where a confusing screen costs real money or real worry.",
  },
});
