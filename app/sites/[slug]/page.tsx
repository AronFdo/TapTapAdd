import { Suspense } from "react";

// Reached through {slug}.{ROOT_DOMAIN} via proxy.ts. Placeholder until Phase 2
// renders the published version from the public_sites view.
export default function SitePage({ params }: PageProps<"/sites/[slug]">) {
  return (
    <main className="mx-auto max-w-xl px-4 py-16">
      <Suspense fallback={null}>
        <SiteHeading params={params} />
      </Suspense>
    </main>
  );
}

async function SiteHeading({ params }: Pick<PageProps<"/sites/[slug]">, "params">) {
  const { slug } = await params;
  return (
    <>
      <h1 className="font-display text-display-m" data-testid="site-slug">
        {slug}
      </h1>
      <p className="mt-4 text-muted">This site isn&apos;t published yet.</p>
    </>
  );
}
