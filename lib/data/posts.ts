import { createClient } from "@/lib/supabase/server";
import type { Post, PostSpec, PostTeaser } from "@/lib/types";

// Lists always read the anon-safe view: it only contains approved/closed
// posts with teaser columns, which is exactly what a list needs.
export const BOARD_PAGE_SIZE = 24;

export async function listPostsForMenu(
  menuId: string,
  categoryId?: string,
  page = 1
): Promise<{ posts: PostTeaser[]; totalPages: number }> {
  const supabase = await createClient();
  const from = (page - 1) * BOARD_PAGE_SIZE;
  let query = supabase
    .from("public_posts")
    .select("*", { count: "exact" })
    .eq("menu_id", menuId)
    .order("published_at", { ascending: false })
    .range(from, from + BOARD_PAGE_SIZE - 1);
  if (categoryId) query = query.eq("category_id", categoryId);
  const { data, count } = await query;
  return {
    posts: (data as PostTeaser[]) ?? [],
    totalPages: Math.max(1, Math.ceil((count ?? 0) / BOARD_PAGE_SIZE)),
  };
}

export async function getPostTeaser(postId: string): Promise<PostTeaser | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("public_posts")
    .select("*")
    .eq("id", postId)
    .maybeSingle();
  return (data as PostTeaser) ?? null;
}

export type FullPost = {
  post: Post;
  specs: PostSpec[];
  media: { id: string; path: string }[];
  attachments: { id: string; path: string; filename: string }[];
  author: {
    id: string;
    uid: number;
    display_name: string | null;
    company_name: string | null;
    badges: { code: string; name_en: string; name_ko: string }[];
  } | null;
};

// Member path: RLS lets authenticated users read approved posts in full,
// plus their own posts in any status.
export async function getFullPost(postId: string): Promise<FullPost | null> {
  const supabase = await createClient();
  const { data: post } = await supabase
    .from("posts")
    .select("*")
    .eq("id", postId)
    .maybeSingle();
  if (!post) return null;

  const [{ data: specs }, { data: media }, { data: attachments }, { data: author }, { data: badges }] =
    await Promise.all([
      supabase.from("post_specs").select("*").eq("post_id", postId).order("sort_order"),
      supabase.from("post_media").select("id, path").eq("post_id", postId).order("sort_order"),
      supabase.from("post_attachments").select("id, path, filename").eq("post_id", postId),
      supabase
        .from("profiles")
        .select("id, uid, display_name, company_name")
        .eq("id", post.author_id)
        .maybeSingle(),
      supabase
        .from("member_badges")
        .select("badge_types(code, name_en, name_ko)")
        .eq("profile_id", post.author_id),
    ]);

  return {
    post: post as Post,
    specs: (specs as PostSpec[]) ?? [],
    media: media ?? [],
    attachments: attachments ?? [],
    author: author
      ? {
          ...author,
          badges: ((badges ?? []) as unknown as {
            badge_types: { code: string; name_en: string; name_ko: string } | null;
          }[])
            .map((b) => b.badge_types)
            .filter((x): x is { code: string; name_en: string; name_ko: string } => !!x),
        }
      : null,
  };
}
