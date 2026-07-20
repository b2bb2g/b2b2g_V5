import type { MetadataRoute } from "next";
import { createClient } from "@supabase/supabase-js";

// Sitemap from approved public content (PRD 12.2): menus, published posts,
// published mini homepages. Uses a bare client (no request context).
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const site = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const entries: MetadataRoute.Sitemap = [
    { url: site, changeFrequency: "daily", priority: 1 },
    { url: `${site}/feed`, changeFrequency: "daily", priority: 0.8 },
    { url: `${site}/membership`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${site}/legal/terms`, changeFrequency: "yearly", priority: 0.2 },
    { url: `${site}/legal/privacy`, changeFrequency: "yearly", priority: 0.2 },
    { url: `${site}/legal/cookies`, changeFrequency: "yearly", priority: 0.2 },
  ];

  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    );
    const [
      { data: menus },
      { data: posts },
      { data: homepages },
      { data: profiles },
      { data: feedPosts },
      { data: recentBodies },
    ] =
      await Promise.all([
        supabase.from("menus").select("id, slug").eq("is_visible", true),
        supabase
          .from("public_posts")
          .select("id, menu_id, published_at")
          .order("published_at", { ascending: false })
          .limit(2000),
        supabase
          .from("mini_homepages")
          .select("slug, updated_at")
          .eq("is_published", true),
        supabase
          .from("profiles")
          .select("uid, updated_at")
          .eq("status", "active")
          .order("updated_at", { ascending: false })
          .limit(2000),
        supabase
          .from("member_feed_posts")
          .select("id, updated_at")
          .eq("moderation_status", "visible")
          .order("updated_at", { ascending: false })
          .limit(2000),
        supabase
          .from("member_feed_posts")
          .select("body")
          .eq("moderation_status", "visible")
          .order("created_at", { ascending: false })
          .limit(300),
      ]);

    const menuSlugById = new Map((menus ?? []).map((m) => [m.id, m.slug]));
    for (const menu of menus ?? []) {
      entries.push({
        url: `${site}/${menu.slug}`,
        changeFrequency: "daily",
        priority: 0.8,
      });
    }
    for (const post of posts ?? []) {
      const slug = menuSlugById.get(post.menu_id);
      if (!slug) continue;
      entries.push({
        url: `${site}/${slug}/${post.id}`,
        lastModified: post.published_at ?? undefined,
        changeFrequency: "weekly",
        priority: 0.7,
      });
    }
    for (const homepage of homepages ?? []) {
      entries.push({
        url: `${site}/c/${homepage.slug}`,
        lastModified: homepage.updated_at ?? undefined,
        changeFrequency: "weekly",
        priority: 0.6,
      });
    }
    for (const profile of profiles ?? []) {
      entries.push({
        url: `${site}/u/${profile.uid}`,
        lastModified: profile.updated_at ?? undefined,
        changeFrequency: "weekly",
        priority: 0.5,
      });
    }
    for (const post of feedPosts ?? []) {
      entries.push({
        url: `${site}/feed/${post.id}`,
        lastModified: post.updated_at ?? undefined,
        changeFrequency: "weekly",
        priority: 0.5,
      });
    }
    // Live hashtag hubs: the most-used tags across recent network posts.
    const tagCounts = new Map<string, number>();
    for (const row of recentBodies ?? []) {
      for (const match of (row.body ?? "").matchAll(/#([\p{L}\p{N}_]+)/gu)) {
        const tag = match[1].slice(0, 40);
        tagCounts.set(tag, (tagCounts.get(tag) ?? 0) + 1);
      }
    }
    const topTags = [...tagCounts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 30);
    for (const [tag] of topTags) {
      entries.push({
        url: `${site}/feed?tag=${encodeURIComponent(tag)}`,
        changeFrequency: "daily",
        priority: 0.4,
      });
    }
  } catch {
    // Sitemap degrades to static entries when the DB is unreachable.
  }

  return entries;
}
