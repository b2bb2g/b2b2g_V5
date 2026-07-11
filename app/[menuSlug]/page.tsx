import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { getT } from "@/lib/i18n/server";
import { getMenuBySlug, menuTitle } from "@/lib/data/menus";
import { listPostsForMenu } from "@/lib/data/posts";
import { createClient } from "@/lib/supabase/server";
import { getPublicSettings, settingBool } from "@/lib/data/settings";
import { EmptyState } from "@/components/ui/EmptyState";
import { Pagination } from "@/components/ui/Pagination";
import { StatusLabel } from "@/components/ui/StatusLabel";
import { BOARD_TYPES, POST_STATUS, SETTING_KEYS } from "@/lib/constants";
import { stripRichText } from "@/lib/richtext";
import type { Metadata } from "next";
import { ProductCard } from "@/components/marketplace/ProductCard";
import { BoardHero } from "@/components/marketplace/BoardHero";
import { repThumbnail } from "@/lib/media";
import { MediaPlaceholder } from "@/components/ui/MediaPlaceholder";

export async function generateMetadata(props: {
  params: Promise<{ menuSlug: string }>;
}): Promise<Metadata> {
  const { menuSlug } = await props.params;
  const menu = await getMenuBySlug(menuSlug);
  if (!menu) return {};
  const { locale } = await getT();
  const title = menuTitle(menu, locale);
  return {
    title,
    description: `${title} B2B marketplace products and sourcing opportunities`,
    alternates: { canonical: `/${menuSlug}` },
    openGraph: {
      title,
      description: `${title} B2B marketplace products and sourcing opportunities`,
    },
  };
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
    false,
  );
  const activeCategory = categoryNavVisible ? (query.category ?? "") : "";
  const page = Math.max(1, Number.parseInt(query.page ?? "1", 10) || 1);

  const supabase = await createClient();
  const [{ t, locale }, { posts, totalPages }, { data: categories }] =
    await Promise.all([
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
  const isNoticeBoard = menu.slug === "notices";
  const typeLabel =
    (t.admin.boardTypes as Record<string, string>)[menu.board_type] ??
    menu.board_type;
  const boardImage =
    menu.slug === "commercial"
      ? "/landing-v2/consumer-export-brand.jpg"
      : menu.slug === "industrial"
        ? "/landing-v2/precision-manufacturing.jpg"
        : isGallery
          ? "/landing-v2/hero-global-collaboration.jpg"
          : undefined;

  return (
    <div className="wide space-y-4">
      {/* Creation lives on the dashboard and avatar menu only (UX policy). */}
      <BoardHero
        eyebrow={t.board.eyebrow}
        type={typeLabel}
        title={title}
        count={posts.length}
        countLabel={t.board.availableNow}
        description={
          isNoticeBoard
            ? t.board.noticeHint
            : isRequestBoard
              ? t.board.requestHint
              : t.board.browseHint
        }
        image={boardImage}
      />

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
      ) : isNoticeBoard ? (
        <section className="space-y-8 pt-3">
          <div className="grid gap-4 lg:grid-cols-[1.15fr_.85fr]">
            <Link
              href={`/${menu.slug}/${posts[0].id}`}
              className="group relative min-h-80 overflow-hidden rounded-[2rem] bg-primary p-7 text-white shadow-[0_22px_65px_rgba(27,100,218,.22)] sm:p-10"
            >
              <span className="absolute -right-16 -top-20 h-72 w-72 rounded-full border-[48px] border-white/8 transition-transform duration-700 group-hover:scale-110" />
              <span className="relative flex h-full flex-col justify-between">
                <span>
                  <span className="inline-flex rounded-full bg-white/12 px-3 py-1.5 text-xs font-bold uppercase tracking-[.14em]">
                    {t.board.latestNotice}
                  </span>
                  <strong className="mt-8 block max-w-2xl text-2xl font-extrabold leading-tight tracking-[-.035em] sm:text-4xl">
                    {locale === "ko" && posts[0].title_ko
                      ? posts[0].title_ko
                      : posts[0].title_en}
                  </strong>
                  <span className="mt-4 block max-w-2xl text-sm leading-7 text-white/70">
                    {stripRichText(
                      locale === "ko" && posts[0].body_teaser_ko
                        ? posts[0].body_teaser_ko
                        : posts[0].body_teaser_en,
                    )}
                  </span>
                </span>
                <span className="mt-8 flex items-center justify-between border-t border-white/15 pt-5 text-xs text-white/65">
                  <span>{posts[0].published_at?.slice(0, 10)}</span>
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-primary transition-transform group-hover:translate-x-1">
                    →
                  </span>
                </span>
              </span>
            </Link>
            <div className="rounded-[2rem] border border-line/80 bg-white p-6 shadow-(--shadow-card) sm:p-8">
              <p className="text-xs font-bold uppercase tracking-[.16em] text-primary">
                {t.board.noticeCenter}
              </p>
              <h2 className="mt-4 text-2xl font-extrabold tracking-[-.035em]">
                {t.board.allNotices}
              </h2>
              <p className="mt-3 text-sm leading-7 text-ink-soft">
                {t.board.noticeHint}
              </p>
              <div className="mt-8 grid grid-cols-2 gap-3">
                <div className="rounded-2xl bg-surface-sub p-4">
                  <p className="text-3xl font-extrabold">{posts.length}</p>
                  <p className="mt-1 text-xs font-semibold text-ink-faint">
                    {t.board.availableNow}
                  </p>
                </div>
                <div className="rounded-2xl bg-primary-soft p-4">
                  <p className="text-sm font-extrabold text-primary-strong">
                    B2BB2G
                  </p>
                  <p className="mt-2 text-xs font-semibold text-ink-soft">
                    {t.home.stat1}
                  </p>
                </div>
              </div>
            </div>
          </div>
          <div className="overflow-hidden rounded-[2rem] border border-line/80 bg-white shadow-(--shadow-card)">
            <div className="border-b border-line px-6 py-5">
              <h2 className="text-lg font-extrabold">{t.board.allNotices}</h2>
            </div>
            <div className="divide-y divide-line">
              {posts.slice(1).map((post, index) => (
                <Link
                  key={post.id}
                  href={`/${menu.slug}/${post.id}`}
                  className="group grid gap-3 px-6 py-5 transition hover:bg-surface-sub/70 sm:grid-cols-[3rem_1fr_auto] sm:items-center"
                >
                  <span className="text-xs font-extrabold text-primary">
                    {String(index + 2).padStart(2, "0")}
                  </span>
                  <span className="min-w-0">
                    <strong className="block truncate text-sm font-extrabold">
                      {locale === "ko" && post.title_ko
                        ? post.title_ko
                        : post.title_en}
                    </strong>
                    <span className="mt-1 block line-clamp-1 text-xs text-ink-soft">
                      {stripRichText(
                        locale === "ko" && post.body_teaser_ko
                          ? post.body_teaser_ko
                          : post.body_teaser_en,
                      )}
                    </span>
                  </span>
                  <span className="flex items-center gap-4 text-xs text-ink-faint">
                    <span>{post.published_at?.slice(0, 10)}</span>
                    <span className="transition-transform group-hover:translate-x-1 group-hover:text-primary">
                      →
                    </span>
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </section>
      ) : isGallery ? (
        <section className="pt-4">
          <div className="mb-6 flex items-end justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[.16em] text-primary">
                {t.board.curatedCollection}
              </p>
              <h2 className="mt-2 text-2xl font-extrabold tracking-[-.035em]">
                {t.board.picks}
              </h2>
            </div>
            <span className="rounded-full bg-white px-3 py-1.5 text-xs font-bold text-ink-soft shadow-sm">
              {posts.length} {t.board.availableNow}
            </span>
          </div>
          <div className="grid gap-4 lg:grid-cols-[1.35fr_.65fr]">
            {posts[0] &&
              (() => {
                const post = posts[0];
                const thumb = repThumbnail(post);
                const postTitle =
                  locale === "ko" && post.title_ko
                    ? post.title_ko
                    : post.title_en;
                return (
                  <Link
                    href={`/${menu.slug}/${post.id}`}
                    className="group relative min-h-[30rem] overflow-hidden rounded-[2rem] bg-[#101923] shadow-[0_20px_60px_rgba(25,31,40,.13)]"
                  >
                    {thumb ? (
                      <Image
                        src={thumb}
                        alt={postTitle}
                        fill
                        priority
                        sizes="(max-width:1024px) 100vw, 66vw"
                        className="object-cover transition-transform duration-700 group-hover:scale-105"
                      />
                    ) : (
                      <MediaPlaceholder />
                    )}
                    <span className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/5 to-transparent" />
                    <span className="absolute inset-x-0 bottom-0 p-7 text-white sm:p-9">
                      <span className="text-xs font-bold uppercase tracking-[.16em] text-[#83b6ff]">
                        {t.board.featuredProduct}
                      </span>
                      <strong className="mt-3 block max-w-2xl text-2xl font-extrabold leading-tight sm:text-4xl">
                        {postTitle}
                      </strong>
                      <span className="mt-3 block text-sm text-white/60">
                        {post.author_company ?? post.author_name}
                      </span>
                      <span className="mt-6 inline-flex h-11 w-11 items-center justify-center rounded-full bg-white text-ink transition-transform group-hover:translate-x-1">
                        →
                      </span>
                    </span>
                  </Link>
                );
              })()}
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-1">
              {posts.slice(1, 3).map((post, index) => (
                <ProductCard
                  key={post.id}
                  post={post}
                  href={`/${menu.slug}/${post.id}`}
                  locale={locale}
                  priority={index < 1}
                />
              ))}
            </div>
          </div>
          {posts.length > 3 && (
            <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
              {posts.slice(3).map((post) => (
                <ProductCard
                  key={post.id}
                  post={post}
                  href={`/${menu.slug}/${post.id}`}
                  locale={locale}
                />
              ))}
            </div>
          )}
        </section>
      ) : (
        <div className="space-y-2.5">
          {posts.map((post) => {
            const closed =
              post.status === POST_STATUS.CLOSED ||
              (isRequestBoard &&
                post.deadline &&
                post.deadline < new Date().toISOString().slice(0, 10));
            return (
              <Link
                key={post.id}
                href={`/${menu.slug}/${post.id}`}
                className="card-hover block p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <p className="text-sm font-bold leading-snug">
                    {locale === "ko" && post.title_ko
                      ? post.title_ko
                      : post.title_en}
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
                      : post.body_teaser_en,
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

      {!isNoticeBoard && posts.length > 0 && posts.length < 8 && (
        <section className="mt-8 flex flex-col items-start justify-between gap-5 rounded-[1.5rem] bg-primary-soft px-6 py-7 sm:flex-row sm:items-center">
          <div>
            <h2 className="text-lg font-extrabold">{t.board.nextTitle}</h2>
            <p className="mt-1 max-w-xl text-sm text-ink-soft">
              {t.board.nextBody}
            </p>
          </div>
          <div className="flex shrink-0 gap-2">
            <Link href="/search" className="btn-secondary btn-md">
              {t.common.search}
            </Link>
            <Link href="/signup" className="btn-primary btn-md">
              {t.common.signUp}
            </Link>
          </div>
        </section>
      )}
    </div>
  );
}
