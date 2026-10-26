import { Mail, MapPin, UserRoundPlus } from "lucide-react";
import { z } from "zod";
import { initials } from "@/lib/render/format";
import { defineSiteComponent } from "@/lib/render/define";
import type { SiteComponentProps } from "@/lib/render/types";
import { LinkedInIcon, SiteKey } from "./parts";

const HeroProps = z.object({
  /** Rewritten headline. Falls back to the profile headline. */
  headline: z.string().trim().max(160).optional(),
  /** One short line under the headline. */
  intro: z.string().trim().max(280).optional(),
});

function Hero({ props, profile, context }: SiteComponentProps<z.output<typeof HeroProps>>) {
  const headline = props.headline || profile.headline;
  const photoUrl = profile.photo ? context.assetUrl(profile.photo.value) : null;
  const linkedin = profile.links.find((link) => link.kind === "linkedin");
  const email = profile.contact.email?.value;

  return (
    <header className="site-hero">
      <div className="site-hero__portrait">
        <span className="site-hero__orbit" aria-hidden />
        {photoUrl ? (
          // Storage URLs vary by environment, so this stays a plain img until
          // Phase 5 serves photos through next/image.
          // eslint-disable-next-line @next/next/no-img-element
          <img className="site-hero__photo" src={photoUrl} alt="" width={136} height={136} />
        ) : (
          <span className="site-hero__photo site-hero__monogram" aria-hidden>
            {initials(profile.name)}
          </span>
        )}
      </div>

      <h1 className="site-hero__name">{profile.name}</h1>
      {headline ? <p className="site-hero__headline">{headline}</p> : null}
      {profile.location ? (
        <p className="site-hero__location">
          <MapPin size={16} aria-hidden />
          {profile.location}
        </p>
      ) : null}
      {props.intro ? <p className="site-hero__intro">{props.intro}</p> : null}

      <div className="site-hero__actions">
        {context.vcardHref ? (
          <SiteKey variant="primary" href={context.vcardHref} icon={<UserRoundPlus size={20} />} className="site-hero__save">
            Save contact
          </SiteKey>
        ) : null}
        {linkedin ? (
          <SiteKey href={linkedin.url} icon={<LinkedInIcon />} rel="me noopener" target="_blank">
            LinkedIn
          </SiteKey>
        ) : null}
        {email ? (
          <SiteKey href={`mailto:${email}`} icon={<Mail size={20} />}>
            Email
          </SiteKey>
        ) : null}
      </div>
    </header>
  );
}

export const hero = defineSiteComponent({
  id: "hero",
  props: HeroProps,
  description:
    "The first screen: photo, name, headline and the save contact, LinkedIn and email actions. Always first. `headline` may tighten the profile headline; `intro` is one optional sentence.",
  vibes: ["orbit", "minimal", "editorial", "technical"],
  Component: Hero,
  hasContent: () => true,
  example: { intro: "Currently helping small shops get paid faster." },
});
