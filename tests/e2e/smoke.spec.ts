import { expect, test } from "@playwright/test";

// Anonymous smoke coverage: public surfaces, auth guards, search states.
// (Authenticated flows need seeded credentials; see docs/STATUS.md.)

test("landing renders the storefront sections", async ({ page }) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: /trusted bridge/i })
  ).toBeVisible();
  await expect(page.getByRole("link", { name: "Industrial" }).first()).toBeVisible();
  await expect(page.getByText("Events and exhibitions")).toBeVisible();
});

test("board page shows its header and type", async ({ page }) => {
  await page.goto("/industrial");
  await expect(page.getByRole("heading", { name: "Industrial" })).toBeVisible();
  await expect(page.getByText("Product board").first()).toBeVisible();
});

test("protected areas redirect anonymous visitors to login", async ({ page }) => {
  await page.goto("/dashboard");
  await expect(page).toHaveURL(/\/login/);
  await expect(page.getByRole("heading", { name: /sign in/i })).toBeVisible();
});

test("search reports empty results honestly", async ({ page }) => {
  await page.goto("/search?q=zzzzzz-no-such-product");
  await expect(page.getByText("No results found")).toBeVisible();
});

test("membership guide is public", async ({ page }) => {
  await page.goto("/membership");
  await expect(
    page.getByRole("heading", { name: "Certified membership" })
  ).toBeVisible();
});

test("legal terms include the message-access disclosure", async ({ page }) => {
  await page.goto("/legal/terms");
  await expect(page.getByText(/may be accessed and reviewed/)).toBeVisible();
});

test("post detail rejects a mismatched menu slug", async ({ page }) => {
  await page.goto("/commercial/aee4637e-731d-474a-8adc-c794fcbc1745");
  await expect(page.getByText("This page could not be found").first()).toBeVisible();
  await expect(page.getByText(/CNC Machined Aluminum/)).toHaveCount(0);
});

test("mobile inquiry action stays above the global banner", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/commercial/69ea7b85-91b4-4c7d-975f-3a62fe571742");

  const action = page.locator(".mobile-sticky-action");
  const banner = page.locator(".global-banner");
  await expect(action).toBeVisible();
  await expect(action).toHaveCSS("position", "fixed");

  const actionBox = await action.boundingBox();
  const bannerBox = await banner.boundingBox();
  expect(actionBox).not.toBeNull();
  expect(bannerBox).not.toBeNull();
  expect(actionBox!.y + actionBox!.height).toBeLessThanOrEqual(bannerBox!.y);
});
