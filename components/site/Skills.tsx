import { z } from "zod";
import { defineSiteComponent } from "@/lib/render/define";
import type { SiteComponentProps } from "@/lib/render/types";
import { Section } from "./parts";

const SkillsProps = z.object({
  title: z.string().trim().min(1).max(60).default("Skills"),
  /** `groups` keeps the profile's labelled groups; `chips` shows one flat set. */
  style: z.enum(["groups", "chips"]).default("chips"),
  includeLanguages: z.boolean().default(true),
});

type Props = z.output<typeof SkillsProps>;

type Group = { label?: string; items: string[] };

function groupsFor(props: Props, profile: SiteComponentProps<Props>["profile"]): Group[] {
  const groups: Group[] =
    props.style === "groups"
      ? profile.skills.map((group) => ({ label: group.label, items: group.items }))
      : profile.skills.length > 0
        ? [{ items: [...new Set(profile.skills.flatMap((group) => group.items))] }]
        : [];
  if (props.includeLanguages && profile.languages.length > 0) {
    groups.push({
      label: "Spoken languages",
      items: profile.languages.map((l) => (l.level ? `${l.name} (${l.level.toLowerCase()})` : l.name)),
    });
  }
  return groups;
}

function Chips({ items }: { items: string[] }) {
  return (
    <ul className="site-chips">
      {items.map((item) => (
        <li key={item} className="site-chip">
          {item}
        </li>
      ))}
    </ul>
  );
}

function Skills({ props, profile }: SiteComponentProps<Props>) {
  const groups = groupsFor(props, profile);
  return (
    <Section title={props.title}>
      <div className="site-skills">
        {groups.map((group, i) =>
          group.label ? (
            <div key={i} className="site-skills__group">
              <h3 className="site-skills__label">{group.label}</h3>
              <Chips items={group.items} />
            </div>
          ) : (
            <Chips key={i} items={group.items} />
          ),
        )}
      </div>
    </Section>
  );
}

export const skills = defineSiteComponent({
  id: "skills",
  props: SkillsProps,
  description:
    "Skills from the profile as chips, either grouped under the profile's labels (good for technical stacks) or as one flat set. Can include spoken languages.",
  vibes: ["orbit", "minimal", "editorial", "technical"],
  Component: Skills,
  hasContent: (props, profile) => groupsFor(props, profile).length > 0,
  example: { style: "groups" },
});
