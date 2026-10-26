import { z } from "zod";
import { defineSiteComponent } from "@/lib/render/define";
import { formatDateRange } from "@/lib/render/format";
import type { SiteComponentProps } from "@/lib/render/types";
import { Section } from "./parts";

const EducationProps = z.object({
  title: z.string().trim().min(1).max(60).default("Education"),
  includeCertifications: z.boolean().default(true),
});

type Props = z.output<typeof EducationProps>;

function Education({ props, profile }: SiteComponentProps<Props>) {
  const certifications = props.includeCertifications ? profile.certifications : [];
  return (
    <Section title={props.title}>
      <ul className="site-list">
        {profile.education.map((item, i) => {
          const qualification = [item.qualification, item.field].filter(Boolean).join(", ");
          const dates = formatDateRange(item.start, item.end);
          return (
            <li key={i} className="site-list__item">
              <h3 className="site-list__title">{qualification || item.institution}</h3>
              <p className="site-list__meta">
                {[qualification ? item.institution : null, dates].filter(Boolean).join(" · ")}
              </p>
              {item.notes ? <p className="site-list__notes">{item.notes}</p> : null}
            </li>
          );
        })}
      </ul>
      {certifications.length > 0 ? (
        <>
          <h3 className="site-subtitle">Certifications</h3>
          <ul className="site-list">
            {certifications.map((cert, i) => (
              <li key={i} className="site-list__item">
                <p className="site-list__title">{cert.name}</p>
                <p className="site-list__meta">{[cert.issuer, cert.year].filter(Boolean).join(" · ")}</p>
              </li>
            ))}
          </ul>
        </>
      ) : null}
    </Section>
  );
}

export const education = defineSiteComponent({
  id: "education",
  props: EducationProps,
  description: "Degrees and courses from the profile, optionally followed by certifications.",
  vibes: ["orbit", "minimal", "editorial", "technical"],
  Component: Education,
  hasContent: (props, profile) =>
    profile.education.length > 0 || (props.includeCertifications && profile.certifications.length > 0),
  example: {},
});
