import { expect, test } from "@playwright/test";

test("landing page renders", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1, name: "TapTapAdd" })).toBeVisible();
});

test("component gallery renders keys in both themes", async ({ page }) => {
  await page.goto("/dev/components");
  await expect(page.getByRole("button", { name: "Upload CV" }).first()).toBeVisible();

  await page.getByRole("button", { name: "Light" }).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  await page.getByRole("button", { name: "Dark" }).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
});

test("a subdomain resolves to its portfolio", async ({ page, baseURL }) => {
  const url = new URL(baseURL ?? "http://localhost:3000");
  url.hostname = `jane.${url.hostname}`;
  await page.goto(url.toString());
  await expect(page.getByTestId("site-slug")).toHaveText("jane");
});

test("portfolio routes aren't reachable on the root domain", async ({ request }) => {
  const response = await request.get("/sites/jane");
  expect(response.status()).toBe(404);
});
