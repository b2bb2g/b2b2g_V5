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

test("feed photos open an accessible viewer and full-post sheet", async ({
  page,
}) => {
  await page.goto("/feed");

  const firstImage = page
    .getByRole("button", { name: /view post image 1 \/ \d+/i })
    .first();
  await expect(firstImage).toBeVisible();
  await firstImage.click();

  const viewer = page.getByRole("dialog", { name: /view post image 1 \/ \d+/i });
  await expect(viewer).toBeVisible();
  await expect(page.getByRole("button", { name: "Close image" })).toBeFocused();

  const stage = viewer.locator("[data-feed-media-stage]");
  const next = viewer.locator("[data-feed-media-next]");
  await expect(next).toBeVisible();
  const stageBox = await stage.boundingBox();
  const nextBox = await next.boundingBox();
  expect(stageBox).not.toBeNull();
  expect(nextBox).not.toBeNull();
  expect(nextBox!.x + nextBox!.width).toBeLessThanOrEqual(
    stageBox!.x + stageBox!.width,
  );

  await next.click();
  await expect(
    page.getByRole("dialog", { name: /view post image 2 \/ \d+/i }),
  ).toBeVisible();

  await page.mouse.move(
    stageBox!.x + stageBox!.width * 0.7,
    stageBox!.y + stageBox!.height * 0.5,
  );
  await page.mouse.down();
  await page.mouse.move(
    stageBox!.x + stageBox!.width * 0.4,
    stageBox!.y + stageBox!.height * 0.5,
    { steps: 5 },
  );
  await page.mouse.up();
  await expect(
    page.getByRole("dialog", { name: /view post image 3 \/ \d+/i }),
  ).toBeVisible();
  const activeViewer = page.getByRole("dialog", {
    name: /view post image \d+ \/ \d+/i,
  });
  await expect(
    activeViewer.locator("[data-feed-media-thumbnails] button"),
  ).toHaveCount(3);

  const fullPost = activeViewer.getByRole("button", { name: "Full post" });
  await fullPost.click();
  await expect(page.getByRole("dialog", { name: "Full post" })).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Close full post" }),
  ).toBeFocused();

  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog", { name: "Full post" })).toHaveCount(0);
  await expect(activeViewer).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(activeViewer).toHaveCount(0);
  await expect(firstImage).toBeFocused();
});

test("feed text and focused posts keep each surface stable", async ({
  page,
}) => {
  await page.goto("/");

  await expect(page.getByText("…more", { exact: true }).first()).toBeVisible();

  const shortLandingPost = page.locator("article").filter({ hasText: "hello 2" });
  await expect(shortLandingPost).toHaveCount(1);
  await expect(
    shortLandingPost.getByText("…more", { exact: true }),
  ).toHaveCount(0);
  const landingCardBox = await shortLandingPost.boundingBox();
  await shortLandingPost.locator("[data-feed-body-focus]").click();
  const landingFocus = page.getByRole("dialog", { name: "Full post" });
  await expect(landingFocus).toBeVisible();
  await expect(
    landingFocus.getByRole("link", { name: "Like", exact: true }),
  ).toBeVisible();
  await expect(
    landingFocus.getByRole("link", { name: "Comment", exact: true }),
  ).toBeVisible();
  await expect(
    landingFocus.getByRole("link", { name: "Repost", exact: true }),
  ).toBeVisible();
  await expect(
    landingFocus.getByRole("button", { name: "Share", exact: true }),
  ).toBeVisible();
  await expect(
    landingFocus.getByRole("heading", { name: /^Comments/ }),
  ).toBeVisible();
  await expect(
    landingFocus.getByRole("link", {
      name: "Sign in to join the conversation.",
    }),
  ).toBeVisible();
  await expect(
    landingFocus.locator("[data-feed-media-thumbnails] button"),
  ).toHaveCount(3);
  const focusedLandingCardBox = await shortLandingPost.boundingBox();
  expect(focusedLandingCardBox).not.toBeNull();
  expect(focusedLandingCardBox!.height).toBeCloseTo(landingCardBox!.height, 0);
  await landingFocus.getByRole("button", { name: "Close full post" }).click();
  await expect(landingFocus).toHaveCount(0);
  await expect(shortLandingPost.locator("[data-feed-body-focus]")).toBeFocused();
  await expect(page).not.toHaveURL(/#post-/);

  await page.goto("/feed");
  const desktopPostWithHiddenPhotos = page
    .locator("article")
    .filter({ hasText: "+3" });
  await expect(desktopPostWithHiddenPhotos).toHaveCount(1);
  const desktopPostId = await desktopPostWithHiddenPhotos.getAttribute(
    "data-feed-post-id",
  );
  expect(desktopPostId).toBeTruthy();
  const stableDesktopPost = page.locator(
    `[data-feed-post-id="${desktopPostId}"]`,
  );
  await expect(
    stableDesktopPost.getByText("…more", { exact: true }),
  ).toHaveCount(0);
  const desktopPhotos = stableDesktopPost.getByRole("button", {
    name: /view post image/i,
  });
  await expect(desktopPhotos).toHaveCount(4);
  await stableDesktopPost.locator("[data-feed-body-focus]").click();
  const desktopFocus = page.getByRole("dialog", { name: "Full post" });
  await expect(desktopFocus).toBeVisible();
  await expect(
    desktopFocus.locator("[data-feed-media-thumbnails] button"),
  ).toHaveCount(7);
  await desktopFocus.getByRole("button", { name: "Close full post" }).click();
  await expect(desktopFocus).toHaveCount(0);
  await expect(desktopPhotos).toHaveCount(4);
  await expect(
    stableDesktopPost.getByRole("button", { name: "Show less" }),
  ).toHaveCount(0);

  await page.setViewportSize({ width: 390, height: 844 });
  await page.reload();

  const collapsedPost = page.locator("article").filter({ hasText: "+3" });
  await expect(collapsedPost).toHaveCount(1);
  const postId = await collapsedPost.getAttribute("data-feed-post-id");
  expect(postId).toBeTruthy();
  const postWithHiddenPhotos = page.locator(
    `[data-feed-post-id="${postId}"]`,
  );
  const photos = postWithHiddenPhotos.getByRole("button", {
    name: /view post image/i,
  });
  const collapsedCount = await photos.count();
  expect(collapsedCount).toBe(4);

  await postWithHiddenPhotos.locator("[data-feed-text-expand]").click();
  const showLess = postWithHiddenPhotos.getByRole("button", {
    name: "Show less",
  });
  await expect(showLess).toBeVisible();
  await expect(photos).toHaveCount(4);

  await showLess.click();
  await expect(photos).toHaveCount(4);
  await expect(postWithHiddenPhotos.getByText("+3", { exact: true })).toBeVisible();
});
