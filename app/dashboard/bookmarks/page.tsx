import { redirect } from "next/navigation";
import { WorkspacePageHeader } from "@/components/dashboard/WorkspacePageHeader";
import { ProductCard } from "@/components/marketplace/ProductCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { getT } from "@/lib/i18n/server";
import { getSession } from "@/lib/data/session";
import { getVisibleMenus } from "@/lib/data/menus";
import { createClient } from "@/lib/supabase/server";
import type { PostTeaser } from "@/lib/types";

export default async function BookmarksPage() {
  const session = await getSession();
  if (!session.userId) redirect("/login?next=/dashboard/bookmarks");

  const [{ t, locale }, menus, supabase] = await Promise.all([
    getT(),
    getVisibleMenus(),
    createClient(),
  ]);
  const { data: bookmarks } = await supabase
    .from("post_bookmarks")
    .select("post_id, created_at")
    .eq("profile_id", session.userId)
    .order("created_at", { ascending: false })
    .limit(100);
  const postIds = (bookmarks ?? []).map((row) => row.post_id);
  const { data: posts } = postIds.length
    ? await supabase.from("public_posts").select("*").in("id", postIds)
    : { data: [] as PostTeaser[] };
  const byId = new Map(
    ((posts ?? []) as PostTeaser[]).map((post) => [post.id, post]),
  );
  const ordered = postIds
    .map((id) => byId.get(id))
    .filter((post): post is PostTeaser => Boolean(post));
  const menuSlugById = new Map(menus.map((menu) => [menu.id, menu.slug]));

  return (
    <div className="space-y-5">
      <WorkspacePageHeader title={t.dashboard.savedProducts} />
      {ordered.length === 0 ? (
        <EmptyState title={t.dashboard.noSavedProducts} />
      ) : (
        <div className="grid grid-cols-2 gap-x-3 gap-y-7 sm:grid-cols-3 sm:gap-x-4 lg:grid-cols-4">
          {ordered.map((post, index) => (
            <ProductCard
              key={post.id}
              post={post}
              href={`/${menuSlugById.get(post.menu_id) ?? "commercial"}/${post.id}`}
              locale={locale}
              priority={index < 4}
            />
          ))}
        </div>
      )}
    </div>
  );
}
