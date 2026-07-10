import Link from "next/link";
import Image from "next/image";
import { getT } from "@/lib/i18n/server";
import { getVisibleMenus } from "@/lib/data/menus";
import { createClient } from "@/lib/supabase/server";
import { postMediaUrl, videoThumbnail } from "@/lib/media";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { ClearableInput } from "@/components/ui/TextField";
import type { Metadata } from "next";
import type { PostTeaser } from "@/lib/types";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getT();
  return { title: t.search.title };
}

// Unified search (A11): public posts only, so results match exactly what a
// visitor is allowed to see (teaser view; no locked data leaks).
export default async function SearchPage(props: {
  searchParams: Promise<{ q?: string }>;
}) {
  const [{ t, locale }, params, menus] = await Promise.all([
    getT(),
    props.searchParams,
    getVisibleMenus(),
  ]);

  const raw = (params.q ?? "").trim().slice(0, 80);
  // Strip characters that would break the PostgREST or() filter grammar.
  const q = raw.replace(/[,()%\\]/g, " ").replace(/\s+/g, " ").trim();

  let results: PostTeaser[] = [];
  if (q) {
    const supabase = await createClient();
    const pattern = `%${q}%`;
    const { data } = await supabase
      .from("public_posts")
      .select("*")
      .or(
        `title_en.ilike.${pattern},title_ko.ilike.${pattern},body_teaser_en.ilike.${pattern},body_teaser_ko.ilike.${pattern}`
      )
      .order("published_at", { ascending: false })
      .limit(40);
    results = (data as PostTeaser[]) ?? [];
  }

  const menuSlugById = new Map(menus.map((menu) => [menu.id, menu.slug]));

  return (
    <div className="wide space-y-5">
      <PageHeader title={t.search.title} subtitle={t.search.hint} />

      <form action="/search" method="get" className="flex gap-2">
        <div className="min-w-0 flex-1">
          <ClearableInput
            type="search"
            name="q"
            defaultValue={raw}
            placeholder={t.search.placeholder}
            clearLabel={t.common.clearInput}
          />
        </div>
        <button type="submit" className="btn-primary btn-md shrink-0">
          {t.common.search}
        </button>
      </form>

      {q &&
        (results.length === 0 ? (
          <EmptyState title={t.search.noResults} hint={t.search.noResultsHint} />
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
            {results.map((post) => {
              const thumb = post.rep_image_path
                ? postMediaUrl(post.rep_image_path)
                : post.rep_video_url
                  ? videoThumbnail(post.rep_video_url)
                  : null;
              return (
                <Link
                  key={post.id}
                  href={`/${menuSlugById.get(post.menu_id) ?? "industrial"}/${post.id}`}
                  className="card-hover group block overflow-hidden"
                >
                  <div className="relative aspect-square bg-surface-sub">
                    {thumb && (
                      <Image
                        src={thumb}
                        alt={post.title_en}
                        fill
                        sizes="(max-width: 640px) 50vw, 33vw"
                        className="object-cover transition-transform group-hover:scale-[1.03]"
                      />
                    )}
                  </div>
                  <div className="space-y-1 p-3">
                    <p className="line-clamp-2 text-sm font-bold leading-snug">
                      {locale === "ko" && post.title_ko ? post.title_ko : post.title_en}
                    </p>
                    <p className="truncate text-xs text-ink-faint">
                      {post.author_company ?? post.author_name}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        ))}
    </div>
  );
}
