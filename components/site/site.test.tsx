// @vitest-environment jsdom
import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { visibleProfile } from "@/lib/render/format";
import { REGISTRY, getComponent } from "@/lib/render/registry";
import type { RenderContext } from "@/lib/render/types";
import { FIXTURE_SITES } from "@/tests/fixtures/sites";

afterEach(cleanup);

const context: RenderContext = { assetUrl: () => null, vcardHref: "/vcard" };
const jane = visibleProfile(FIXTURE_SITES.jane.profile);
const kasun = visibleProfile(FIXTURE_SITES.kasun.profile);
const ruwan = visibleProfile(FIXTURE_SITES.ruwan.profile);

function renderSection(id: string, props: unknown, profile = jane, ctx = context) {
  const resolved = getComponent(id)?.resolve(props, profile);
  if (!resolved) throw new Error(`${id} rejected its props`);
  return { ...render(<>{resolved.render(ctx)}</>), empty: resolved.empty };
}

describe.each(REGISTRY.map((entry) => [entry.id, entry] as const))("%s", (id, entry) => {
  it("renders its registry example against the Jane fixture", () => {
    const { container, empty } = renderSection(id, entry.example);
    expect(empty).toBe(false);
    expect(container.textContent?.trim().length).toBeGreaterThan(0);
  });
});

describe("hero", () => {
  it("shows the name as the only h1 and the three actions", () => {
    renderSection("hero", {});
    expect(screen.getByRole("heading", { level: 1, name: "Jane Perera" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Save contact" })).toHaveAttribute("href", "/vcard");
    expect(screen.getByRole("link", { name: "LinkedIn" })).toHaveAttribute("href", "https://www.linkedin.com/in/jane-example");
    expect(screen.getByRole("link", { name: "Email" })).toHaveAttribute("href", "mailto:jane@example.com");
  });

  it("prefers the rewritten headline", () => {
    renderSection("hero", { headline: "Designer of calm products" });
    expect(screen.getByText("Designer of calm products")).toBeInTheDocument();
  });

  it("shows initials when there's no photo, and leaves out unavailable actions", () => {
    renderSection("hero", {}, ruwan, { ...context, vcardHref: null });
    expect(screen.getByText("RJ")).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Save contact" })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Email" })).not.toBeInTheDocument();
  });
});

describe("about", () => {
  it("falls back to the profile summary", () => {
    renderSection("about", {});
    expect(screen.getByText(/calm, accessible products/)).toBeInTheDocument();
  });

  it("splits a rewritten body into paragraphs", () => {
    const { container } = renderSection("about", { body: "One.\n\nTwo." });
    expect(container.querySelectorAll("p")).toHaveLength(2);
  });

  it("is empty without a summary or body", () => {
    expect(renderSection("about", {}, ruwan).empty).toBe(true);
  });
});

describe("experience-timeline", () => {
  it("lists roles with dates and respects the limit", () => {
    renderSection("experience-timeline", { limit: 2 }, kasun);
    const items = screen.getAllByRole("heading", { level: 3 });
    expect(items.map((h) => h.textContent)).toEqual(["Senior backend engineer", "Software engineer"]);
    expect(screen.getByText("Jan 2022 – Now")).toBeInTheDocument();
  });

  it("can hide highlights", () => {
    renderSection("experience-timeline", { showHighlights: false }, kasun);
    expect(screen.queryByText(/contract tests/)).not.toBeInTheDocument();
  });
});

describe("projects-grid", () => {
  it("puts featured projects first", () => {
    renderSection("projects-grid", { featured: ["Settlement service"] }, kasun);
    const names = screen.getAllByRole("heading", { level: 3 }).map((h) => h.textContent);
    expect(names).toEqual(["Settlement service", "lk-address", "Dispatch queue"]);
  });

  it("names the project in each link for screen readers", () => {
    renderSection("projects-grid", {}, kasun);
    expect(screen.getByRole("link", { name: "View project: lk-address" })).toBeInTheDocument();
  });
});

describe("skills", () => {
  it("keeps labelled groups in groups style", () => {
    renderSection("skills", { style: "groups" }, kasun);
    expect(screen.getByRole("heading", { name: "Infrastructure" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Spoken languages" })).toBeInTheDocument();
  });

  it("flattens groups in chips style", () => {
    renderSection("skills", { style: "chips", includeLanguages: false }, kasun);
    expect(screen.queryByRole("heading", { level: 3 })).not.toBeInTheDocument();
    expect(screen.getByText("Terraform")).toBeInTheDocument();
  });
});

describe("education", () => {
  it("shows qualifications and certifications", () => {
    renderSection("education", {});
    expect(screen.getByText("BSc, Computer science")).toBeInTheDocument();
    expect(screen.getByText("Google UX Design Certificate")).toBeInTheDocument();
  });

  it("is empty for a profile without education", () => {
    expect(renderSection("education", {}, ruwan).empty).toBe(true);
  });
});

describe("highlights", () => {
  it("is empty with no items", () => {
    expect(renderSection("highlights", { items: [] }).empty).toBe(true);
  });

  it("renders an untitled item from the raw answer", () => {
    renderSection("highlights", { items: [{ body: "The onboarding redesign." }] });
    expect(screen.getByText("The onboarding redesign.")).toBeInTheDocument();
  });
});

describe("contact-cta", () => {
  it("offers visible channels only", () => {
    renderSection("contact-cta", { reasons: ["Mentoring"] });
    const section = screen.getByRole("region", { name: "Get in touch" });
    expect(within(section).getByRole("link", { name: "Send an email" })).toBeInTheDocument();
    expect(within(section).queryByText(/\+94/)).not.toBeInTheDocument();
    expect(within(section).getByText("Mentoring")).toBeInTheDocument();
  });

  it("is empty when the owner has no visible way to be reached", () => {
    const unreachable = { ...ruwan, contact: {}, links: [] };
    expect(renderSection("contact-cta", {}, unreachable).empty).toBe(true);
  });
});

describe("fun-fact", () => {
  it("is empty without a fact", () => {
    expect(renderSection("fun-fact", {}).empty).toBe(true);
  });
});
