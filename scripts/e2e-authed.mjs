// Authed smoke test without touching hCaptcha: the service role mints a
// magic-link token for a seed member, the browser signs in through
// /auth/confirm, then the member surfaces are exercised.
//
// Usage: node scripts/e2e-authed.mjs [baseUrl] [memberUid]
//   baseUrl default http://dev.b2bb2g.com:3000, memberUid default 100027.
import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";
import { chromium } from "playwright";

const base = process.argv[2] ?? "http://dev.b2bb2g.com:3000";
const memberUid = Number(process.argv[3] ?? 100027);

const env = Object.fromEntries(
  readFileSync(".env.local", "utf8")
    .split("\n")
    .filter((line) => line.includes("="))
    .map((line) => [line.slice(0, line.indexOf("=")), line.slice(line.indexOf("=") + 1).trim()]),
);
const url = env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !serviceKey) {
  console.log("SKIP: SUPABASE_SERVICE_ROLE_KEY not in .env.local");
  process.exit(0);
}

const admin = createClient(url, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});
// Seeded members created by SQL can have incomplete auth rows ("Database
// error finding user"), so fall back through real signed-up accounts until
// a link mints.
async function mintToken() {
  const candidates = [];
  const { data: profile } = await admin
    .from("profiles")
    .select("id")
    .eq("uid", memberUid)
    .maybeSingle();
  if (profile) {
    const { data: contact } = await admin
      .from("profile_contacts")
      .select("email")
      .eq("profile_id", profile.id)
      .maybeSingle();
    if (contact?.email) candidates.push(contact.email);
  }
  // One corrupted seed row 500s bulk listing, so walk one user per page and
  // tolerate broken pages.
  for (let pageIndex = 1; pageIndex <= 10; pageIndex += 1) {
    const { data: userList } = await admin.auth.admin.listUsers({
      page: pageIndex,
      perPage: 1,
    });
    const user = userList?.users?.[0];
    if (!user) continue;
    if (user.email && user.email_confirmed_at) candidates.push(user.email);
  }
  for (const candidate of [...new Set(candidates)]) {
    const { data: link, error } = await admin.auth.admin.generateLink({
      type: "magiclink",
      email: candidate,
    });
    if (!error && link?.properties?.hashed_token) {
      console.log(`signing in as ${candidate.replace(/(.{2}).*(@.*)/, "$1***$2")}`);
      return link.properties.hashed_token;
    }
    console.log(
      `mint failed for ${candidate.replace(/(.{2}).*(@.*)/, "$1***$2")}: ${error?.message ?? "unknown"}`,
    );
  }
  throw new Error("No account could mint a magic link");
}
const tokenHash = await mintToken();

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
const failures = [];
const check = (name, ok) => {
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}`);
  if (!ok) failures.push(name);
};

// Suppress the one-time security-lock nudge so its modal never intercepts
// clicks during the interaction checks below (it is a real member-facing
// prompt, verified separately).
await page.addInitScript(() => {
  try {
    window.localStorage.setItem("b2bb2g:security-nudge-off", "1");
  } catch {
    // ignore
  }
});

// 1. Sign in via the app's own confirm route.
await page.goto(
  `${base}/auth/confirm?token_hash=${tokenHash}&type=magiclink&next=/dashboard`,
  { waitUntil: "load", timeout: 120000 },
);
await page.waitForTimeout(2500);
check("magic-link sign-in reaches dashboard", page.url().includes("/dashboard"));

// 2. Signed-in surfaces respond with member content.
for (const [path, marker] of [
  ["/notifications", "notifications"],
  ["/dashboard/bookmarks", "bookmarks"],
  ["/dashboard/profile", "profile"],
  ["/inquiries", "inquiries"],
]) {
  const response = await page.goto(`${base}${path}`, {
    waitUntil: "load",
    timeout: 120000,
  });
  await page.waitForTimeout(800);
  check(
    `${marker} page loads signed-in`,
    response?.status() === 200 && page.url().includes(path),
  );
}

// 3. Drawer shows the account section for members.
await page.goto(`${base}/`, { waitUntil: "load", timeout: 120000 });
await page.waitForTimeout(1500);
await page.evaluate(() => {
  [...document.querySelectorAll("button")]
    .find((b) => /Accept all|모두 허용/.test(b.textContent ?? ""))
    ?.click();
});
await page.click('button[aria-controls="mobile-drawer"]');
await page.waitForTimeout(500);
const drawer = await page.evaluate(() => ({
  profileCard: !!document.querySelector('#mobile-drawer a[href="/dashboard"]'),
  signOut: [...document.querySelectorAll("#mobile-drawer button")].some((b) =>
    /sign out|로그아웃/i.test(b.textContent ?? ""),
  ),
}));
check("drawer has profile card", drawer.profileCard);
check("drawer has sign out", drawer.signOut);

// 4. Reversible interaction: like toggle twice on the first feed post.
await page.goto(`${base}/feed`, { waitUntil: "load", timeout: 120000 });
await page.waitForTimeout(2000);
const likeButton = page
  .locator('article[data-feed-post-id] footer button[aria-pressed]')
  .first();
const pressedBefore = await likeButton.getAttribute("aria-pressed");
await likeButton.click();
const flipped = await page
  .waitForFunction(
    (expected) =>
      document
        .querySelector("article[data-feed-post-id] footer button[aria-pressed]")
        ?.getAttribute("aria-pressed") !== expected,
    pressedBefore,
    { timeout: 15000 },
  )
  .then(() => true)
  .catch(() => false);
check("like toggles state", flipped);
if (flipped) {
  await page
    .locator('article[data-feed-post-id] footer button[aria-pressed]')
    .first()
    .click();
  await page.waitForTimeout(2500);
}

await browser.close();
console.log(
  failures.length
    ? `\n${failures.length} FAILURE(S): ${failures.join(", ")}`
    : "\nALL AUTHED CHECKS PASSED",
);
process.exit(failures.length ? 1 : 0);
