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

export const getMenuBySlug = cache(async (slug: string): Promise<Menu | null> => {
  const supabase = await createClient();
  const { data } = await supabase
    .from("menus")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();
  return (data as Menu) ?? null;
});
