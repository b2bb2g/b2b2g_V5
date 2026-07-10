import { cache } from "react";
import { createClient } from "@/lib/supabase/server";

// Admin-controlled switches (PRD: policy is admin settings, not code).
export const getPublicSettings = cache(
  async (): Promise<Record<string, unknown>> => {
    const supabase = await createClient();
    const { data } = await supabase.from("site_settings").select("key, value");
    const map: Record<string, unknown> = {};
    for (const row of data ?? []) map[row.key] = row.value;
    return map;
  }
);

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
