import { expect, test } from "@playwright/test";

test("sign-in and reset surfaces remain usable without submitting captcha", async ({
  page,
}) => {
  await page.goto("/login");
  await expect(page.getByRole("heading", { name: "Sign in" })).toBeVisible();
  await expect(page.locator('input[name="email"]')).toBeEditable();
  await expect(page.locator('input[name="password"]')).toBeEditable();
  await page.goto("/reset");
  await expect(page.getByRole("button", { name: "Send reset link" })).toBeVisible();
});

test("public signup is closed unless a valid invitation is present", async ({ page }) => {
  await page.goto("/signup");
  await expect(
    page.getByRole("heading", {
      name: "Account creation is available by invitation only.",
    }),
  ).toBeVisible();
  await expect(page.locator('input[name="email"]')).toHaveCount(0);
  await expect(page.getByRole("link", { name: "Sign in" })).toBeVisible();
});

test.describe("authenticated member regression", () => {
  const authState = process.env.E2E_AUTH_STATE;
  test.skip(!authState, "set E2E_AUTH_STATE to a human-verified storage state");
  test.use({ storageState: authState });

  test("member dashboard, profile and board chooser", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/dashboard/);
    await expect(page.getByText(/UID:\d+/).first()).toBeVisible();
    await expect(page.getByRole("link", { name: "My posts" }).first()).toBeVisible();

    await page.goto("/dashboard/profile");
    await expect(page.getByRole("link", { name: "Edit" })).toBeVisible();

    await page.goto("/write/select");
    await expect(
      page.getByRole("link", { name: "Industrial Product board" }),
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: "Notices Notice board" }),
    ).toHaveCount(0);
  });
});
