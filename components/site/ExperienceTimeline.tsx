import { z } from "zod";
import { defineSiteComponent } from "@/lib/render/define";
import { formatDateRange } from "@/lib/render/format";
import type { SiteComponentProps } from "@/lib/render/types";
import { Section } from "./parts";

const ExperienceProps = z.object({
  title: z.string().trim().min(1).max(60).default("Experience"),
  /** How many roles to show, most recent first as they appear in the profile. */
  limit: z.number().int().min(1).max(30).default(6),
  showHighlights: z.boolean().default(true),
});

type Props = z.output<typeof ExperienceProps>;

function ExperienceTimeline({ props, profile }: SiteComponentProps<Props>) {
  const roles = profile.experience.slice(0, props.limit);
  return (
    <Section title={props.title}>
      <ol className="site-timeline">
        {roles.map((role, i) => {
          const dates = formatDateRange(role.start, role.end, role.current);
          const place = [role.organisation, role.location].filter(Boolean).join(" · ");
          return (
            <li key={i} className="site-timeline__item" data-current={role.current || undefined}>
              <span className="site-timeline__dot" aria-hidden />
              <h3 className="site-timeline__role">{role.role}</h3>
              <p className="site-timeline__meta">
                {place}
                {dates ? (
                  <>
                    <span aria-hidden> · </span>
                    <span className="site-timeline__dates">{dates}</span>
                  </>
                ) : null}
              </p>
              {role.summary ? <p className="site-timeline__summary">{role.summary}</p> : null}
              {props.showHighlights && role.highlights.length > 0 ? (
                <ul className="site-timeline__highlights">
                  {role.highlights.map((highlight, j) => (
                    <li key={j}>{highlight}</li>
                  ))}
                </ul>
              ) : null}
            </li>
          );
        })}
      </ol>
    </Section>
  );
}

export const experienceTimeline = defineSiteComponent({
  id: "experience-timeline",
  props: ExperienceProps,
  description:
    "Roles from the profile as a vertical timeline with dates and highlights. Reads the profile directly; props only set the title, how many roles show and whether highlights show.",
  vibes: ["orbit", "minimal", "editorial", "technical"],
  Component: ExperienceTimeline,
  hasContent: (_props, profile) => profile.experience.length > 0,
  example: { limit: 4 },
});
