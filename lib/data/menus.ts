import { cache } from "react";
import { unstable_cache } from "next/cache";
import { createAnonClient } from "@/lib/supabase/anon";
import type { Menu } from "@/lib/types";

// Menus are public under RLS and change rarely, so they are shared across
// requests for a minute; admin menu actions bust the tag instantly.
export const getVisibleMenus = cache(
  unstable_cache(
    async (): Promise<Menu[]> => {
      const supabase = createAnonClient();
      const { data, error } = await supabase
        .from("menus")
        .select("*")
        .eq("is_visible", true)
        .order("sort_order");
      // Throw (rather than cache an empty nav) so a transient DB error surfaces
      // as a retryable error instead of a silently broken, cached-for-60s site.
      if (error) throw error;
      return (data as Menu[]) ?? [];
    },
    ["visible-menus"],
    { revalidate: 60, tags: ["menus"] },
  ),
);

// Menu names follow the admin menu settings per locale; typing English
// into the Korean field shows English in the Korean UI too.
export function menuTitle(
  menu: { title_en: string; title_ko: string | null },
  locale: string
): string {
  return locale === "ko" && menu.title_ko ? menu.title_ko : menu.title_en;
}

export const getMenuBySlug = cache(
  unstable_cache(
    async (slug: string): Promise<Menu | null> => {
      const supabase = createAnonClient();
      const { data, error } = await supabase
        .from("menus")
        .select("*")
        .eq("slug", slug)
        .maybeSingle();
      // A genuine miss returns data:null/error:null (-> notFound upstream); only
      // a real DB error throws, so a transient hiccup never masquerades as a 404.
      if (error) throw error;
      return (data as Menu) ?? null;
    },
    ["menu-by-slug"],
    { revalidate: 60, tags: ["menus"] },
  ),
);
