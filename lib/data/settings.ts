import { cache } from "react";
import { unstable_cache } from "next/cache";
import { createAnonClient } from "@/lib/supabase/anon";

// Admin-controlled switches (PRD: policy is admin settings, not code).
// Settings are public under RLS, so they are shared across requests for a
// minute instead of queried per request; admin saves bust the tag instantly.
const readPublicSettings = unstable_cache(
  async (): Promise<Record<string, unknown>> => {
    const supabase = createAnonClient();
    const { data, error } = await supabase
      .from("site_settings")
      .select("key, value");
    // Throw rather than cache an empty map, which would silently revert every
    // admin-controlled switch to its code default for the next 60 seconds.
    if (error) throw error;
    const map: Record<string, unknown> = {};
    for (const row of data ?? []) map[row.key] = row.value;
    return map;
  },
  ["public-site-settings"],
  { revalidate: 60, tags: ["site-settings"] },
);

export const getPublicSettings = cache(readPublicSettings);

export function settingBool(
  settings: Record<string, unknown>,
  key: string,
  fallback = false
): boolean {
  const v = settings[key];
  return typeof v === "boolean" ? v : fallback;
}

export function settingNumber(
  settings: Record<string, unknown>,
  key: string,
  fallback: number
): number {
  const v = settings[key];
  return typeof v === "number" ? v : fallback;
}

export function settingString(
  settings: Record<string, unknown>,
  key: string,
  fallback = ""
): string {
  const v = settings[key];
  return typeof v === "string" ? v : fallback;
}
