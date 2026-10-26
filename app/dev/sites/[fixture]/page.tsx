import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { defaultLayout } from "@/lib/render/defaults";
import { Renderer } from "@/lib/render/Renderer";
import { ACCENT_PRESETS } from "@/lib/render/vibes/accents";
import { AccentSchema, ThemeSchema, type SiteTokens } from "@/lib/schemas/tokens";
import { FIXTURE_SITES, isFixtureName } from "@/tests/fixtures/sites";

export const metadata: Metadata = {
  title: "Fixture site",
  robots: { index: false },
};

// Design review of hand-written profiles on the default layout, with no AI
// involved. Available locally and on Vercel previews, never in production.
// ?theme=light|dark and ?accent=%23rrggbb override the fixture's choices.
export default function FixtureSitePage({ params, searchParams }: PageProps<"/dev/sites/[fixture]">) {
  if (process.env.VERCEL_ENV === "production") notFound();
  return (
    <Suspense fallback={null}>
      <FixturePreview params={params} searchParams={searchParams} />
    </Suspense>
  );
}

async function FixturePreview({ params, searchParams }: Pick<PageProps<"/dev/sites/[fixture]">, "params" | "searchParams">) {
  const { fixture } = await params;
  if (!isFixtureName(fixture)) notFound();
  const query = await searchParams;
  const site = FIXTURE_SITES[fixture];

  const theme = ThemeSchema.safeParse(query.theme);
  const accent = AccentSchema.safeParse(query.accent);
  const tokens: SiteTokens = {
    ...site.tokens,
    theme: theme.success ? theme.data : site.tokens.theme,
    accent: accent.success ? accent.data : site.tokens.accent,
  };
  const href = (overrides: Partial<Pick<SiteTokens, "theme" | "accent">>) => ({
    pathname: `/dev/sites/${fixture}`,
    query: { theme: overrides.theme ?? tokens.theme, accent: overrides.accent ?? tokens.accent },
  });

  return (
    <>
      <nav className="flex flex-wrap items-center gap-x-4 gap-y-2 border-b-2 border-line bg-surface px-4 py-3 text-label" aria-label="Fixture controls">
        {Object.keys(FIXTURE_SITES).map((name) => (
          <Link key={name} href={`/dev/sites/${name}`} aria-current={name === fixture ? "page" : undefined}>
            {name}
          </Link>
        ))}
        <span className="text-muted">·</span>
        <Link href={href({ theme: tokens.theme === "dark" ? "light" : "dark" })}>
          {tokens.theme === "dark" ? "Light" : "Dark"} theme
        </Link>
        <span className="text-muted">·</span>
        {ACCENT_PRESETS.map(({ name, value }) => (
          <Link key={value} href={href({ accent: value })} aria-current={value === tokens.accent ? "true" : undefined}>
            {name}
          </Link>
        ))}
      </nav>
      <Renderer
        document={{ profile: site.profile, layout: defaultLayout(tokens.jobType, site.answers), tokens }}
        context={{ assetUrl: () => null, vcardHref: "#save-contact" }}
      />
    </>
  );
}
