import { Panel } from "@/components/ui";
import { visibleProfile } from "@/lib/render/format";
import { REGISTRY } from "@/lib/render/registry";
import { SiteFrame } from "@/lib/render/Renderer";
import type { RenderContext } from "@/lib/render/types";
import { THEMES } from "@/lib/schemas/tokens";
import { FIXTURE_SITES } from "@/tests/fixtures/sites";

const context: RenderContext = { assetUrl: () => null, vcardHref: "#save-contact" };

/** Each portfolio component's registry example, rendered against the Jane fixture in both themes. */
export function SitePreviews() {
  const { profile, tokens } = FIXTURE_SITES.jane;
  const visible = visibleProfile(profile);

  return (
    <Panel title="Portfolio components">
      <p className="mb-6 max-w-[68ch] text-muted">
        Registry examples in the Orbit vibe. Full fixture sites are at /dev/sites/jane, kasun, amaya and ruwan.
      </p>
      <div className="grid gap-8">
        {REGISTRY.map((entry) => {
          const resolved = entry.resolve(entry.example, visible);
          return (
            <section key={entry.id} aria-label={entry.id} className="grid gap-3">
              <h3 className="text-title font-semibold">{entry.id}</h3>
              <p className="max-w-[68ch] text-small text-muted">{entry.description}</p>
              <div className="grid gap-4 md:grid-cols-2">
                {THEMES.map((theme) => (
                  <div key={theme} className="overflow-hidden rounded-card border-2 border-line">
                    <SiteFrame tokens={{ ...tokens, theme }}>
                      <div className="p-4">{resolved?.render(context) ?? <p>Invalid example</p>}</div>
                    </SiteFrame>
                  </div>
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </Panel>
  );
}
