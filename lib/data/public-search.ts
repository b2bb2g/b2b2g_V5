import "server-only";
import { BOARD_TYPES } from "@/lib/constants";
import { createClient } from "@/lib/supabase/server";
import {
  sanitizeSearchQuery,
  SEARCH_MIN_QUERY_LENGTH,
  SEARCH_PAGE_SIZE,
  type SearchScope,
} from "@/lib/search";
import type { PostTeaser } from "@/lib/types";

export async function searchPublicPosts({
  query,
  page = 1,
  pageSize = SEARCH_PAGE_SIZE,
  scope = "all",
}: {
  query: string;
  page?: number;
  pageSize?: number;
  scope?: SearchScope;
}) {
  const q = sanitizeSearchQuery(query);
  const safePage = Math.max(1, page);
  const safePageSize = Math.min(24, Math.max(1, pageSize));

  if (q.length < SEARCH_MIN_QUERY_LENGTH) {
    return { query: q, items: [] as PostTeaser[], total: 0, page: 1, totalPages: 1 };
  }

  const supabase = await createClient();
  const from = (safePage - 1) * safePageSize;
  let request = supabase
    .from("public_posts")
    .select("*", { count: "exact" });

  if (scope === "product") {
    request = request.eq("type", BOARD_TYPES.PRODUCT);
  } else if (scope === "request") {
    request = request.eq("type", BOARD_TYPES.REQUEST);
  }

  // Separate `or` filters are combined with AND by PostgREST. Each word must
  // therefore appear in at least one public title/teaser field, while users
  // can enter words in any order instead of matching one exact phrase.
  for (const term of q.split(" ").filter(Boolean).slice(0, 6)) {
    const pattern = `%${term}%`;
    request = request.or(
      `title_en.ilike.${pattern},title_ko.ilike.${pattern},body_teaser_en.ilike.${pattern},body_teaser_ko.ilike.${pattern}`,
    );
  }

  const { data, count, error } = await request
    .order("published_at", { ascending: false })
    .range(from, from + safePageSize - 1);

  if (error) throw error;

  const total = count ?? 0;
  return {
    query: q,
    items: (data as PostTeaser[]) ?? [],
    total,
    page: safePage,
    totalPages: Math.max(1, Math.ceil(total / safePageSize)),
  };
}
