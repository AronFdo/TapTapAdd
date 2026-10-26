import { Mail, Phone } from "lucide-react";
import { z } from "zod";
import { defineSiteComponent } from "@/lib/render/define";
import type { Profile } from "@/lib/schemas/profile";
import type { SiteComponentProps } from "@/lib/render/types";
import { LinkIcon, Section, SiteKey, linkLabel } from "./parts";

const ContactProps = z.object({
  title: z.string().trim().min(1).max(60).default("Get in touch"),
  /** One or two inviting sentences. Never contact details: those come from the profile. */
  body: z.string().trim().max(400).optional(),
  /** What people should contact the owner about, from the onboarding answer. */
  reasons: z.array(z.string().trim().min(1).max(80)).max(6).default([]),
});

type Props = z.output<typeof ContactProps>;

function hasChannels(profile: Profile) {
  return Boolean(profile.contact.email || profile.contact.phone || profile.links.length > 0);
}

function ContactCta({ props, profile }: SiteComponentProps<Props>) {
  const { email, phone } = profile.contact;
  return (
    <Section title={props.title} className="site-contact">
      {props.body ? <p className="site-contact__body">{props.body}</p> : null}
      {props.reasons.length > 0 ? (
        <>
          <h3 className="site-skills__label">Talk to me about</h3>
          <ul className="site-chips">
            {props.reasons.map((reason) => (
              <li key={reason} className="site-chip" data-tone="accent">
                {reason}
              </li>
            ))}
          </ul>
        </>
      ) : null}
      <div className="site-contact__actions">
        {email ? (
          <SiteKey variant="primary" href={`mailto:${email.value}`} icon={<Mail size={20} />}>
            Send an email
          </SiteKey>
        ) : null}
        {phone ? (
          <SiteKey href={`tel:${phone.value.replace(/[^+\d]/g, "")}`} icon={<Phone size={20} />}>
            Call {phone.value}
          </SiteKey>
        ) : null}
        {profile.links.map((link, i) => (
          <SiteKey key={i} href={link.url} icon={<LinkIcon kind={link.kind} />} target="_blank" rel="me noopener">
            {linkLabel(link.kind, link.label)}
          </SiteKey>
        ))}
      </div>
    </Section>
  );
}

export const contactCta = defineSiteComponent({
  id: "contact-cta",
  props: ContactProps,
  description:
    "A closing invitation to get in touch, with the owner's visible email, phone and links. `body` is one or two warm sentences; `reasons` lists what to contact them about.",
  vibes: ["orbit", "minimal", "editorial", "technical"],
  Component: ContactCta,
  hasContent: (_props, profile) => hasChannels(profile),
  example: {
    body: "I'm always happy to talk about calm, useful products.",
    reasons: ["Job opportunities", "Mentoring"],
  },
});
