import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import type { Menu } from "@/lib/types";

export const getVisibleMenus = cache(async (): Promise<Menu[]> => {
  const supabase = await createClient();
  const { data } = await supabase
    .from("menus")
    .select("*")
    .eq("is_visible", true)
    .order("sort_order");
  return (data as Menu[]) ?? [];
});

// Menu names follow the admin menu settings per locale; typing English
// into the Korean field shows English in the Korean UI too.
export function menuTitle(
  menu: { title_en: string; title_ko: string | null },
  locale: string
): string {
  return locale === "ko" && menu.title_ko ? menu.title_ko : menu.title_en;
}

export const getMenuBySlug = cache(async (slug: string): Promise<Menu | null> => {
  const supabase = await createClient();
  const { data } = await supabase
    .from("menus")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();
  return (data as Menu) ?? null;
});
