import { z } from "zod";
import { defineSiteComponent } from "@/lib/render/define";
import type { SiteComponentProps } from "@/lib/render/types";

const FooterProps = z.object({
  /** A short sign-off line. */
  note: z.string().trim().max(120).optional(),
});

type Props = z.output<typeof FooterProps>;

function Footer({ props, profile }: SiteComponentProps<Props>) {
  return (
    <footer className="site-footer">
      <p>{props.note || profile.name}</p>
      <p className="site-footer__credit">Made with TapTapAdd</p>
    </footer>
  );
}

export const footer = defineSiteComponent({
  id: "footer",
  props: FooterProps,
  description: "The closing line of the page with the owner's name and a TapTapAdd credit. Always last.",
  vibes: ["orbit", "minimal", "editorial", "technical"],
  Component: Footer,
  hasContent: () => true,
  example: {},
});
