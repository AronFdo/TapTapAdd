import { ExternalLink } from "lucide-react";
import { z } from "zod";
import { defineSiteComponent } from "@/lib/render/define";
import type { SiteComponentProps } from "@/lib/render/types";
import { Section } from "./parts";

const ProjectsProps = z.object({
  title: z.string().trim().min(1).max(60).default("Projects"),
  limit: z.number().int().min(1).max(24).default(6),
  /** Project names to show first, in this order. Unknown names are ignored. */
  featured: z.array(z.string().trim().min(1).max(120)).max(6).default([]),
});

type Props = z.output<typeof ProjectsProps>;

function ProjectsGrid({ props, profile, context }: SiteComponentProps<Props>) {
  const rank = (name: string) => {
    const i = props.featured.indexOf(name);
    return i === -1 ? props.featured.length : i;
  };
  // A stable sort keeps the profile's own order among unfeatured projects.
  const projects = [...profile.projects].sort((a, b) => rank(a.name) - rank(b.name)).slice(0, props.limit);

  return (
    <Section title={props.title}>
      <ul className="site-projects">
        {projects.map((project, i) => {
          const thumbnail = project.thumbnail ? context.assetUrl(project.thumbnail) : null;
          const meta = [project.role, project.year].filter(Boolean).join(" · ");
          return (
            <li key={i} className="site-project">
              {thumbnail ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img className="site-project__thumb" src={thumbnail} alt="" loading="lazy" />
              ) : null}
              <h3 className="site-project__name">{project.name}</h3>
              {meta ? <p className="site-project__meta">{meta}</p> : null}
              {project.summary ? <p className="site-project__summary">{project.summary}</p> : null}
              {project.tags.length > 0 ? (
                <ul className="site-chips" aria-label="Tags">
                  {project.tags.map((tag) => (
                    <li key={tag} className="site-chip">
                      {tag}
                    </li>
                  ))}
                </ul>
              ) : null}
              {project.url ? (
                <a className="site-project__link" href={project.url} target="_blank" rel="noopener">
                  <ExternalLink size={16} aria-hidden />
                  View project<span className="site-sr-only">: {project.name}</span>
                </a>
              ) : null}
            </li>
          );
        })}
      </ul>
    </Section>
  );
}

export const projectsGrid = defineSiteComponent({
  id: "projects-grid",
  props: ProjectsProps,
  description:
    "Projects from the profile as cards with summary, tags and link. Use `featured` to lead with the strongest projects by name, especially the one the owner is proudest of.",
  vibes: ["orbit", "minimal", "editorial", "technical"],
  Component: ProjectsGrid,
  hasContent: (_props, profile) => profile.projects.length > 0,
  example: { featured: [] },
});
