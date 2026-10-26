import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { LayoutSpecSchema } from "@/lib/schemas/layout";
import type { SiteDocument } from "@/lib/schemas/site";
import { FIXTURE_SITES } from "@/tests/fixtures/sites";
import { defaultLayout } from "./defaults";
import { visibleProfile } from "./format";
import { Renderer, resolveLayout } from "./Renderer";
import type { RenderContext } from "./types";

const context: RenderContext = { assetUrl: (path) => `https://cdn.example.com/${path}`, vcardHref: "/vcard" };
const jane = FIXTURE_SITES.jane;

function render(document: SiteDocument) {
  return renderToStaticMarkup(<Renderer document={document} context={context} />);
}

function janeDocument(layout = defaultLayout(jane.tokens.jobType, jane.answers)): SiteDocument {
  return { profile: jane.profile, layout, tokens: jane.tokens };
}

describe("resolveLayout", () => {
  const layout = LayoutSpecSchema.parse({
    sections: [
      { component: "hero" },
      { component: "marquee", props: { text: "Hi" } },
      { component: "about", props: { title: 42 } },
      { component: "about", hidden: true },
      { component: "fun-fact", props: { fact: "" } },
      { component: "footer" },
    ],
  });

  it("drops unknown, invalid, hidden and empty sections", () => {
    const outcomes = resolveLayout(layout, visibleProfile(jane.profile), "orbit");
    expect(outcomes.map((o) => o.status)).toEqual(["render", "unknown", "invalid", "hidden", "empty", "render"]);
  });

  it("renders only the sections that survive", () => {
    const html = render(janeDocument(layout));
    expect(html.match(/data-component="[^"]+"/g)).toEqual(['data-component="hero"', 'data-component="footer"']);
  });
});

describe("Renderer", () => {
  it("never renders hidden fields, even from a full profile", () => {
    const html = render(janeDocument());
    expect(html).not.toContain("+94 77 000 0000");
    expect(html).not.toContain("1 Example Lane");
    expect(html).not.toContain("1994-05-12");
    expect(html).not.toContain("photos/jane.jpg");
    expect(html).not.toContain("jane.example.com");
    expect(html).toContain("jane@example.com");
  });

  it("sets the vibe tokens as CSS variables", () => {
    const html = render(janeDocument());
    expect(html).toContain("--vibe-accent:#ffa23a");
    expect(html).toContain("--vibe-accent-text:#1d2150");
    expect(html).toContain('data-theme="dark"');
  });

  it("shows the photo only when it's visible", () => {
    const shown = { ...jane.profile, photo: { value: "photos/jane.jpg", visible: true } };
    expect(render({ ...janeDocument(), profile: shown })).toContain("https://cdn.example.com/photos/jane.jpg");
  });

  it.each(Object.entries(FIXTURE_SITES))("renders the %s fixture with a hero, contact and footer", (_name, site) => {
    const document = { profile: site.profile, layout: defaultLayout(site.tokens.jobType, site.answers), tokens: site.tokens };
    const outcomes = resolveLayout(document.layout, visibleProfile(site.profile), site.tokens.vibe);
    expect(outcomes.filter((o) => o.status === "invalid" || o.status === "unknown")).toEqual([]);
    const html = render(document);
    expect(html.match(/<h1/g)).toHaveLength(1);
    expect(html).toContain('data-component="footer"');
  });

  it("hides sections a sparse profile has nothing for", () => {
    const site = FIXTURE_SITES.ruwan;
    const html = render({ profile: site.profile, layout: defaultLayout("sales"), tokens: site.tokens });
    for (const id of ["about", "projects-grid", "skills", "education", "highlights", "fun-fact"]) {
      expect(html).not.toContain(`data-component="${id}"`);
    }
    // Ruwan's email is hidden, so neither the hero nor contact offers it.
    expect(html).not.toContain("mailto:");
    expect(html).toContain("tel:+94760000000");
  });
});
