import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { getT } from "@/lib/i18n/server";
import { getMenuBySlug, menuTitle } from "@/lib/data/menus";
import { listPostsForMenu } from "@/lib/data/posts";
import { createClient } from "@/lib/supabase/server";
import { getPublicSettings, settingBool } from "@/lib/data/settings";
import { repThumbnail } from "@/lib/media";
import { EmptyState } from "@/components/ui/EmptyState";
import { Pagination } from "@/components/ui/Pagination";
import { StatusLabel } from "@/components/ui/StatusLabel";
import { BOARD_TYPES, POST_STATUS, SETTING_KEYS } from "@/lib/constants";
import { stripRichText } from "@/lib/richtext";
import type { PostTeaser } from "@/lib/types";
import type { Metadata } from "next";
import { MediaPlaceholder } from "@/components/ui/MediaPlaceholder";

export async function generateMetadata(props: {
  params: Promise<{ menuSlug: string }>;
}): Promise<Metadata> {
  const { menuSlug } = await props.params;
  const menu = await getMenuBySlug(menuSlug);
  if (!menu) return {};
  const { locale } = await getT();
  return { title: menuTitle(menu, locale) };
}

function thumbnail(post: PostTeaser): string | null {
  return repThumbnail(post);
}

export default async function BoardPage(props: {
  params: Promise<{ menuSlug: string }>;
  searchParams: Promise<{ category?: string; page?: string }>;
}) {
  const [{ menuSlug }, query] = await Promise.all([
    props.params,
    props.searchParams,
  ]);
  const menu = await getMenuBySlug(menuSlug);
  if (!menu || !menu.is_visible) notFound();

  // Category navigation is admin-switched (PRD 6.6): hidden until enabled.
  const settings = await getPublicSettings();
  const categoryNavVisible = settingBool(
    settings,
    SETTING_KEYS.CATEGORY_NAV_VISIBLE,
    false
  );
  const activeCategory = categoryNavVisible ? (query.category ?? "") : "";
  const page = Math.max(1, Number.parseInt(query.page ?? "1", 10) || 1);

  const supabase = await createClient();
  const [{ t, locale }, { posts, totalPages }, { data: categories }] = await Promise.all([
    getT(),
    listPostsForMenu(menu.id, activeCategory || undefined, page),
    categoryNavVisible
      ? supabase
          .from("categories")
          .select("id, name_en, name_ko")
          .eq("is_active", true)
          .or(`menu_id.is.null,menu_id.eq.${menu.id}`)
          .order("sort_order")
      : Promise.resolve({ data: [] }),
  ]);

  // Menu names always display in English (user policy).
  const title = menuTitle(menu, locale);
  const isRequestBoard = menu.board_type === BOARD_TYPES.REQUEST;
  const isGallery =
    menu.board_type === BOARD_TYPES.PRODUCT ||
    menu.board_type === BOARD_TYPES.FLEXIBLE;
  const typeLabel =
    (t.admin.boardTypes as Record<string, string>)[menu.board_type] ??
    menu.board_type;

  return (
    <div className="wide space-y-4">
      {/* Creation lives on the dashboard and avatar menu only (UX policy). */}
      <section className="relative overflow-hidden rounded-[1.5rem] bg-ink px-5 py-7 text-white sm:px-8 sm:py-10">
        <span className="absolute -right-16 -top-24 h-64 w-64 rounded-full bg-primary/30 blur-3xl" aria-hidden="true" />
        <div className="relative max-w-2xl">
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-primary">{t.board.eyebrow} · {typeLabel}</p>
          <div className="mt-3 flex flex-wrap items-end gap-3"><h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">{title}</h1><span className="mb-1 rounded-full bg-white/10 px-2.5 py-1 text-xs font-semibold text-white/65">{posts.length} {t.board.availableNow}</span></div>
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-white/60">{isRequestBoard ? t.board.requestHint : t.board.browseHint}</p>
        </div>
      </section>

      {categoryNavVisible && (categories ?? []).length > 0 && (
        <nav className="scrollbar-none -mx-4 flex gap-1.5 overflow-x-auto px-4">
          <Link
            href={`/${menu.slug}`}
            className={`whitespace-nowrap rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors ${
              !activeCategory
                ? "bg-ink text-white"
                : "bg-surface-sub text-ink-soft hover:bg-primary-soft hover:text-primary-strong"
            }`}
          >
            {t.common.all}
          </Link>
          {(categories ?? []).map((category) => (
            <Link
              key={category.id}
              href={`/${menu.slug}?category=${category.id}`}
              className={`whitespace-nowrap rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors ${
                activeCategory === category.id
                  ? "bg-ink text-white"
                  : "bg-surface-sub text-ink-soft hover:bg-primary-soft hover:text-primary-strong"
              }`}
            >
              {locale === "ko" ? category.name_ko : category.name_en}
            </Link>
          ))}
        </nav>
      )}

      {posts.length === 0 ? (
        <EmptyState title={t.common.emptyList} hint={t.common.emptyListHint} />
      ) : isGallery ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
          {posts.map((post) => {
            const thumb = thumbnail(post);
            return (
              <Link
                key={post.id}
                href={`/${menu.slug}/${post.id}`}
                className="card-hover group overflow-hidden"
              >
                <div className="relative aspect-square bg-surface-sub">
                  {thumb ? (
                    <Image
                      src={thumb}
                      alt={post.title_en}
                      fill
                      sizes="(max-width: 640px) 50vw, 33vw"
                      className="object-cover transition-transform group-hover:scale-[1.03]"
                    />
                  ) : <MediaPlaceholder />}
                  <span className="absolute right-3 top-3 flex h-8 w-8 translate-y-1 items-center justify-center rounded-full bg-white/90 text-ink opacity-0 shadow-sm transition-all group-hover:translate-y-0 group-hover:opacity-100">→</span>
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
      ) : (
        <div className="space-y-2.5">
          {posts.map((post) => {
            const closed =
              post.status === POST_STATUS.CLOSED ||
              (isRequestBoard && post.deadline && post.deadline < new Date().toISOString().slice(0, 10));
            return (
              <Link
                key={post.id}
                href={`/${menu.slug}/${post.id}`}
                className="card-hover block p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <p className="text-sm font-bold leading-snug">
                    {locale === "ko" && post.title_ko ? post.title_ko : post.title_en}
                  </p>
                  {isRequestBoard && (
                    <StatusLabel
                      status={closed ? "closed" : "approved"}
                      label={
                        closed
                          ? t.post.closed
                          : post.deadline
                            ? `${t.post.deadline} ${post.deadline}`
                            : t.post.openEnded
                      }
                    />
                  )}
                </div>
                <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-ink-soft">
                  {stripRichText(
                    locale === "ko" && post.body_teaser_ko
                      ? post.body_teaser_ko
                      : post.body_teaser_en
                  )}
                </p>
                <p className="mt-2 text-xs text-ink-faint">
                  {post.author_company ?? post.author_name}
                </p>
              </Link>
            );
          })}
        </div>
      )}

      <Pagination
        page={page}
        totalPages={totalPages}
        basePath={`/${menu.slug}`}
        extraQuery={activeCategory ? { category: activeCategory } : {}}
        prevLabel={t.home.prev}
        nextLabel={t.home.next}
      />

      {posts.length > 0 && posts.length < 8 && (
        <section className="mt-8 flex flex-col items-start justify-between gap-5 rounded-[1.5rem] bg-primary-soft px-6 py-7 sm:flex-row sm:items-center">
          <div><h2 className="text-lg font-extrabold">{t.board.nextTitle}</h2><p className="mt-1 max-w-xl text-sm text-ink-soft">{t.board.nextBody}</p></div>
          <div className="flex shrink-0 gap-2"><Link href="/search" className="btn-secondary btn-md">{t.common.search}</Link><Link href="/signup" className="btn-primary btn-md">{t.common.signUp}</Link></div>
        </section>
      )}
    </div>
  );
}
