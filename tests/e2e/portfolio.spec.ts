import { expect, test } from "@playwright/test";

test("a fixture portfolio shows name, headline and the three actions on the first screen", async ({ page }) => {
  await page.goto("/dev/sites/jane");
  const viewport = page.viewportSize();
  for (const target of [
    page.getByRole("heading", { level: 1, name: "Jane Perera" }),
    page.getByText("Product designer for fintech and health apps"),
    page.getByRole("link", { name: "Save contact" }),
    page.getByRole("link", { name: "LinkedIn" }).first(),
    page.getByRole("link", { name: "Email", exact: true }),
  ]) {
    await expect(target).toBeInViewport();
    const box = await target.boundingBox();
    expect(box && viewport && box.y + box.height).toBeLessThanOrEqual(viewport?.height ?? 0);
  }
});

test("portfolios never scroll sideways", async ({ page }) => {
  for (const fixture of ["jane", "kasun", "amaya", "ruwan"]) {
    await page.goto(`/dev/sites/${fixture}`);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(overflow, fixture).toBeLessThanOrEqual(0);
  }
});

test("the theme switch re-themes the fixture", async ({ page }) => {
  await page.goto("/dev/sites/jane");
  await page.getByRole("link", { name: "Light theme" }).click();
  await expect(page.locator(".site")).toHaveAttribute("data-theme", "light");
});
