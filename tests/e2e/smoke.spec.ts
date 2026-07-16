import { expect, test } from "@playwright/test";

// Anonymous smoke coverage: public surfaces, auth guards, search states.
// (Authenticated flows need seeded credentials; see docs/STATUS.md.)

test("landing renders the storefront sections", async ({ page }) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: /global trade, built on trust/i })
  ).toBeVisible();
  await expect(page.getByRole("heading", { name: "New arrivals" })).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Latest sourcing requests" }),
  ).toBeVisible();
  await expect(
    page.locator(".store-card-featured").filter({ hasText: "Sourcing request" }).first(),
  ).toBeVisible();
  await expect(page.getByRole("link", { name: "Industrial" }).first()).toBeVisible();
  await expect(page.getByText("Events and exhibitions")).toBeVisible();
  await expect(
    page.getByText("Built for credible cross-border business")
  ).toHaveCount(0);
  await expect(
    page.getByPlaceholder("What product or material are you sourcing?")
  ).toHaveCount(0);
});

test("product board separates recommendations, new items and the full directory", async ({
  page,
}) => {
  await page.goto("/industrial");
  await expect(
    page.getByRole("heading", { name: "Recommended products", level: 1 }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "New products", level: 2 }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "All products", level: 2 }),
  ).toBeVisible();
  const directoryCard = page
    .locator("#all-products .store-card-directory")
    .first();
  await expect(directoryCard).toBeVisible();
  const directoryCardBox = await directoryCard.boundingBox();
  expect(Math.round(directoryCardBox?.width ?? 0)).toBe(400);
  expect(Math.round(directoryCardBox?.height ?? 0)).toBe(500);
});

test("request cards support no-image posts without empty dead space", async ({
  page,
}) => {
  await page.goto("/requests");
  await expect(
    page.getByRole("heading", { name: "Active sourcing requests" }),
  ).toBeVisible();
  await expect(page.getByText("RFQ · ITB").first()).toBeVisible();
  await expect(page.getByText(/UID:\d{6}/).first()).toBeVisible();
});

test("request detail uses the compact no-media brief and response flow", async ({
  page,
}) => {
  await page.goto(
    "/requests/684de749-e099-4b2c-9df7-93a60f4b8bf0",
  );

  await expect(
    page.getByRole("heading", {
      name: "RFQ: 10,000 pcs Cotton T-Shirts (GOTS certified)",
    }),
  ).toBeVisible();
  await expect(page.locator("[data-request-no-media]")).toBeVisible();
  await expect(page.locator("[data-request-media]")).toHaveCount(0);
  await expect(
    page.getByText("Open for supplier responses").first(),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Send inquiry" }).first(),
  ).toBeVisible();
});

test("events prioritize schedule and venue without exposing authors", async ({
  page,
}) => {
  await page.goto("/events");
  await expect(page.getByRole("heading", { name: "Featured event" })).toBeVisible();
  await expect(page.getByText(/Upcoming|Ongoing|Ended/).first()).toBeVisible();
  await expect(page.getByText(/UID:\d{6}/)).toHaveCount(0);
  await expect(page.getByText(/Published by/i)).toHaveCount(0);
});

test("notices hide authors and keep the update hierarchy", async ({ page }) => {
  await page.goto("/notices");
  await expect(page.getByRole("heading", { name: "Latest notice" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "All updates" })).toBeVisible();
  await expect(page.getByText(/UID:\d{6}/)).toHaveCount(0);
  await expect(page.getByText(/Published by/i)).toHaveCount(0);
});

test("faq opens with a real question and answer", async ({ page }) => {
  await page.goto("/faq");
  await expect(
    page.getByRole("heading", { name: "Find the answer you need" }),
  ).toBeVisible();
  const firstQuestion = page
    .locator("[data-faq-index] button[aria-expanded]")
    .first();
  await expect(firstQuestion).toBeVisible();
  await expect(firstQuestion).toHaveAttribute("aria-expanded", "true");

  const search = page.getByRole("searchbox", { name: "Search questions" });
  await search.fill("What do the trust badges mean?");
  await expect(
    page.locator("[data-faq-index] button[aria-expanded]"),
  ).toHaveCount(1);
  await expect(
    page.getByRole("heading", { name: "What do the trust badges mean?" }),
  ).toBeVisible();
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

  // Banner visibility is resolved from localStorage after hydration. Poll the
  // final layout instead of sampling the one-frame transition between states.
  await expect
    .poll(async () => {
      const actionBox = await action.boundingBox();
      const bannerBox = await banner.boundingBox();
      if (!actionBox || !bannerBox) return false;
      return actionBox.y + actionBox.height <= bannerBox.y;
    })
    .toBe(true);
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
  test.setTimeout(90_000);
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
    landingFocus.getByTitle("Like"),
  ).toBeVisible();
  await expect(
    landingFocus.getByTitle("Comment"),
  ).toBeVisible();
  await expect(
    landingFocus.getByTitle("Repost"),
  ).toBeVisible();
  await expect(
    landingFocus.getByTitle("Share"),
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
  await page.reload({ waitUntil: "domcontentloaded" });

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
