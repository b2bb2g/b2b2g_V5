import type { MetadataRoute } from "next";
import { createClient } from "@supabase/supabase-js";

// Web app manifest for PWA install (PRD 18.1). Title/description come from
// admin-managed site settings.
export default async function manifest(): Promise<MetadataRoute.Manifest> {
  let title = "B2BB2G";
  let description = "";
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
    );
    const { data } = await supabase
      .from("site_settings")
      .select("key, value")
      .in("key", ["site_title", "site_description"]);
    for (const row of data ?? []) {
      if (row.key === "site_title" && typeof row.value === "string") title = row.value;
      if (row.key === "site_description" && typeof row.value === "string")
        description = row.value;
    }
  } catch {
    // Fall back to defaults when settings are unreachable at build time.
  }

  return {
    name: title,
    short_name: title,
    description,
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#3182f6",
    icons: [
      { src: "/api/icon/192", sizes: "192x192", type: "image/png" },
      { src: "/api/icon/512", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
