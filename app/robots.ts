import type { MetadataRoute } from "next";
import { getPublicSettings, settingBool, settingString } from "@/lib/data/settings";
import { SETTING_KEYS } from "@/lib/constants";

// robots policy is admin data (PRD 17.10): a global index switch plus extra
// disallow paths, layered on the member-area baseline.
const BASE_DISALLOW = [
  "/admin",
  "/dashboard",
  "/inquiries",
  "/notifications",
  "/write",
  "/reset",
  "/api",
];

export default async function robots(): Promise<MetadataRoute.Robots> {
  const site = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const settings = await getPublicSettings();
  const indexEnabled = settingBool(settings, SETTING_KEYS.SEO_INDEX_ENABLED, true);
  const extra = settingString(settings, SETTING_KEYS.ROBOTS_EXTRA_DISALLOW)
    .split(",")
    .map((path) => path.trim())
    .filter((path) => path.startsWith("/"));

  return {
    rules: indexEnabled
      ? { userAgent: "*", allow: "/", disallow: [...BASE_DISALLOW, ...extra] }
      : { userAgent: "*", disallow: "/" },
    sitemap: `${site}/sitemap.xml`,
  };
}
