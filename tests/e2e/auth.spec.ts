import { expect, test } from "@playwright/test";

// Once Supabase captcha protection is switched on, password sign-in requires
// a human-solved token, so run with E2E_SKIP_AUTH=1 to skip these two specs.
test.skip(
  process.env.E2E_SKIP_AUTH === "1",
  "captcha protection enforced; auth specs skipped"
);

// Authenticated flow against the seeded test account (global setup/teardown).
const EMAIL = "e2e-smoke@example.com";
const PASSWORD = "E2eSmokeTest1234";

test("member signs in, sees the dashboard, and signs out", async ({ page }) => {
  await page.goto("/login");
  await page.fill('input[name="email"]', EMAIL);
  await page.fill('input[name="password"]', PASSWORD);
  await page.getByRole("button", { name: "Sign in" }).click();

  // Dashboard: identity card and member tabs
  await expect(page).toHaveURL(/\/dashboard/);
  await expect(page.getByText(/Member ID \d+/)).toBeVisible();
  await expect(page.getByRole("link", { name: "My posts" }).first()).toBeVisible();

  // Profile view -> edit entry point (view-then-edit convention)
  await page.getByRole("link", { name: "Profile" }).first().click();
  await expect(page).toHaveURL(/\/dashboard\/profile/);
  await expect(page.getByRole("link", { name: "Edit" })).toBeVisible();

  // Board chooser lists writable boards only (cards carry the board type)
  await page.goto("/write/select");
  await expect(
    page.getByRole("link", { name: "Industrial Product board" })
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Notices Notice board" })
  ).toHaveCount(0);

  // Sign out through the avatar menu (opens on hover)
  await page.getByRole("button", { name: /^[A-Z]$/ }).hover();
  await page.getByRole("menuitem", { name: "Sign out" }).click();
  await expect(page).toHaveURL("/");
  await expect(page.getByRole("link", { name: "Sign up" }).first()).toBeVisible();
});

test("wrong password shows the credentials error", async ({ page }) => {
  await page.goto("/login");
  await page.fill('input[name="email"]', EMAIL);
  await page.fill('input[name="password"]', "wrong-password-123");
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page.getByText("Email or password is incorrect.")).toBeVisible();
});
