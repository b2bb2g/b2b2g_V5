import { cache } from "react";
import { unstable_cache } from "next/cache";
import { createAnonClient } from "@/lib/supabase/anon";
import { MENU_SLUGS, POST_STATUS } from "@/lib/constants";

// Timestamp of the newest published notice, shared across requests for a minute
// (notices change rarely). The nav's "new notices" dot compares this against a
// device-local last-seen mark, so this value is not user-specific and is safe
// to cache with the anon client.
export const getLatestNoticeAt = cache(
  unstable_cache(
    async (): Promise<string | null> => {
      const supabase = createAnonClient();
      const { data: menu, error: menuError } = await supabase
        .from("menus")
        .select("id")
        .eq("slug", MENU_SLUGS.NOTICES)
        .maybeSingle();
      if (menuError) throw menuError;
      if (!menu) return null;

      const { data, error } = await supabase
        .from("posts")
        .select("created_at")
        .eq("menu_id", menu.id)
        .eq("status", POST_STATUS.APPROVED)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data?.created_at ?? null;
    },
    ["latest-notice-at"],
    { revalidate: 60, tags: ["posts", "notices"] },
  ),
);
