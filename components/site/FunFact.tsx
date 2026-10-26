import { Sparkles } from "lucide-react";
import { z } from "zod";
import { defineSiteComponent } from "@/lib/render/define";
import type { SiteComponentProps } from "@/lib/render/types";
import { Section } from "./parts";

const FunFactProps = z.object({
  title: z.string().trim().min(1).max(60).default("Fun fact"),
  fact: z.string().trim().max(280).default(""),
});

type Props = z.output<typeof FunFactProps>;

function FunFact({ props }: SiteComponentProps<Props>) {
  return (
    <Section as="aside" title={props.title} className="site-funfact">
      <span className="site-funfact__icon" aria-hidden>
        <Sparkles size={24} />
      </span>
      <p className="site-funfact__fact">{props.fact}</p>
    </Section>
  );
}

export const funFact = defineSiteComponent({
  id: "fun-fact",
  props: FunFactProps,
  description:
    "One light personal fact from the owner's answer, in a single sentence. Keep their meaning; only tidy the wording.",
  vibes: ["orbit", "minimal", "editorial", "technical"],
  Component: FunFact,
  hasContent: (props) => props.fact.length > 0,
  example: { fact: "I've cycled the full length of Sri Lanka, twice." },
});
