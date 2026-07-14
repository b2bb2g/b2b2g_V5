import Link from "next/link";
import { SafeImage } from "@/components/ui/SafeImage";
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
import { stripRichText, sanitizeRichText } from "@/lib/richtext";
import { FaqExperience } from "@/components/marketplace/FaqExperience";
import type { Metadata } from "next";
import { ProductCard } from "@/components/marketplace/ProductCard";
import { BoardHero } from "@/components/marketplace/BoardHero";
import { repThumbnail } from "@/lib/media";
import { MediaPlaceholder } from "@/components/ui/MediaPlaceholder";
import { AuthorIdentity } from "@/components/marketplace/AuthorIdentity";
import {
  eventStatus,
  eventDateBlock,
  eventCountdown,
  formatEventRange,
  type EventStatus,
} from "@/lib/events";

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
  searchParams: Promise<{ category?: string; page?: string; uid?: string }>;
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
  const authorUid = Number.parseInt(query.uid ?? "", 10) || undefined;

  const supabase = await createClient();
  const [{ t, locale }, { posts, totalPages }, { data: categories }] =
    await Promise.all([
      getT(),
      listPostsForMenu(menu.id, activeCategory || undefined, page, authorUid),
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
  // Keyed on board type, not slug, so any board an admin adds behaves like its
  // type instead of falling back to the wrong layout/copy.
  const isNoticeBoard = menu.board_type === BOARD_TYPES.NOTICE;
  const isEventsBoard = menu.board_type === BOARD_TYPES.FLEXIBLE;
  // FAQ is a purpose-built board: same notice data model, but presented as a
  // searchable accordion rather than a notice list.
  const isFaq = menu.slug === "faq";
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
  const latestNoticeThumb =
    isNoticeBoard && posts[0] ? repThumbnail(posts[0]) : null;

  // Full answers for the accordion (the list query only returns teasers).
  const faqItems = isFaq
    ? (
        (
          await supabase
            .from("posts")
            .select("id, title_en, title_ko, body_en, body_ko")
            .eq("menu_id", menu.id)
            .eq("status", POST_STATUS.APPROVED)
            .order("published_at", { ascending: false })
        ).data ?? []
      ).map((row) => {
        const question =
          locale === "ko" && row.title_ko ? row.title_ko : row.title_en;
        const answerRaw =
          locale === "ko" && row.body_ko ? row.body_ko : row.body_en;
        return {
          id: row.id as string,
          question: question as string,
          answer: sanitizeRichText(answerRaw ?? ""),
          plain: stripRichText(answerRaw ?? ""),
        };
      })
    : [];

  return (
    <div className="wide space-y-4">
      {/* Product/request boards always lead with the hero. Notice/events
          boards use a featured layout instead — but when they're empty (no
          featured post to show) the hero still gives the page its title and
          context. Creation lives on the dashboard only (UX policy). */}
      {(!isNoticeBoard && !isEventsBoard) || isFaq || posts.length === 0 ? (
        <BoardHero
          eyebrow={t.board.eyebrow}
          type={isFaq ? t.board.faqType : typeLabel}
          title={title}
          count={posts.length}
          countLabel={isFaq ? t.board.faqCount : t.board.availableNow}
          description={
            isFaq
              ? t.board.faqHint
              : isNoticeBoard
                ? t.board.noticeHint
                : isEventsBoard
                  ? t.board.eventsHint
                  : isRequestBoard
                    ? t.board.requestHint
                    : t.board.browseHint
          }
          image={boardImage}
        />
      ) : null}

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

      {authorUid && (
        <div className="flex items-center justify-between rounded-2xl border border-primary/15 bg-primary-soft/60 px-4 py-3 text-sm">
          <span className="font-bold text-primary-strong">UID:{authorUid}</span>
          <Link
            href={`/${menu.slug}`}
            className="font-semibold text-ink-soft hover:text-ink"
          >
            {t.common.clearFilter}
          </Link>
        </div>
      )}

      {posts.length === 0 ? (
        <EmptyState title={t.common.emptyList} hint={t.common.emptyListHint} />
      ) : isFaq ? (
        <FaqExperience
          items={faqItems}
          searchPlaceholder={t.board.faqSearch}
          emptyLabel={t.board.faqEmpty}
          clearLabel={t.common.clearFilter}
          answerLabel={t.board.faqAnswer}
        />
      ) : isNoticeBoard ? (
        <section className="space-y-6">
          <Link
            href={`/${menu.slug}/${posts[0].id}`}
            className={`group relative grid min-h-80 overflow-hidden rounded-[2rem] bg-[#101923] text-white shadow-[0_24px_70px_rgba(16,25,35,.2)] ${latestNoticeThumb ? "lg:grid-cols-[.9fr_1.1fr]" : "grid-cols-1"}`}
          >
            <span className="relative z-10 flex min-w-0 flex-col justify-between p-7 sm:p-10 lg:p-12">
              <span>
                <span className="text-xs font-bold uppercase tracking-[.18em] text-[#79b4ff]">
                  {t.board.noticeCenter}
                </span>
                <h1 className="mt-3 block text-3xl font-extrabold tracking-[-.04em] sm:text-5xl">
                  {title}
                </h1>
                <span className="mt-4 block max-w-xl text-sm leading-7 text-white/65">
                  {t.board.noticeHint}
                </span>
              </span>
              <span className="mt-10 border-t border-white/15 pt-6">
                <span className="flex items-center gap-3 text-xs font-bold text-white/50">
                  <span className="uppercase tracking-[.14em] text-[#79b4ff]">
                    {t.board.latestNotice}
                  </span>
                  <span>{posts[0].published_at?.slice(0, 10)}</span>
                </span>
                <span className="mt-3 flex items-end justify-between gap-5">
                  <span className="min-w-0">
                    <span className="block text-xl font-extrabold leading-snug sm:text-2xl">
                      {locale === "ko" && posts[0].title_ko
                        ? posts[0].title_ko
                        : posts[0].title_en}
                    </span>
                    <span className="mt-2 block max-h-12 overflow-hidden text-sm leading-6 text-white/55">
                      {stripRichText(
                        locale === "ko" && posts[0].body_teaser_ko
                          ? posts[0].body_teaser_ko
                          : posts[0].body_teaser_en,
                      )}
                    </span>
                  </span>
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white text-ink transition-transform group-hover:translate-x-1">
                    →
                  </span>
                </span>
              </span>
            </span>
            {latestNoticeThumb && (
              <span className="relative min-h-72 overflow-hidden bg-[#172331] lg:min-h-full">
                <SafeImage
                  src={latestNoticeThumb}
                  alt=""
                  fill
                  priority
                  sizes="(max-width:1024px) 100vw, 55vw"
                  className="object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <span
                  className="absolute inset-0 bg-linear-to-r from-[#101923] via-[#101923]/20 to-transparent max-lg:bg-linear-to-t max-lg:from-[#101923]/25 max-lg:to-transparent"
                  aria-hidden="true"
                />
              </span>
            )}
          </Link>
          <div>
            <div className="mb-5">
              <p className="text-xs font-bold uppercase tracking-[.16em] text-primary">
                {t.board.noticeDirectory}
              </p>
              <h2 className="mt-2 text-2xl font-extrabold tracking-[-.035em]">
                {t.board.allNotices}
              </h2>
            </div>
            <ol className="overflow-hidden rounded-[1.75rem] border border-line/80 bg-white shadow-(--shadow-card)">
              {posts.slice(1).map((post, index) => {
                const noticeThumb = repThumbnail(post);
                return (
                  <li key={post.id}>
                    <Link
                      href={`/${menu.slug}/${post.id}`}
                      className="group flex items-center gap-4 border-b border-line px-4 py-4 transition last:border-b-0 hover:bg-surface-sub sm:px-6"
                    >
                      <span
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-surface-sub text-sm font-extrabold tabular-nums text-ink-faint transition-colors group-hover:bg-primary-soft group-hover:text-primary-strong"
                        aria-hidden="true"
                      >
                        {String(index + 1).padStart(2, "0")}
                      </span>
                      <span className="min-w-0 flex-1">
                        <strong className="block truncate text-sm font-extrabold group-hover:text-primary">
                          {locale === "ko" && post.title_ko
                            ? post.title_ko
                            : post.title_en}
                        </strong>
                        <span className="mt-1 block text-xs text-ink-faint">
                          {post.published_at?.slice(0, 10)}
                        </span>
                      </span>
                      {noticeThumb && (
                        <span className="relative hidden h-12 w-16 shrink-0 overflow-hidden rounded-lg bg-surface-sub sm:block">
                          <SafeImage
                            src={noticeThumb}
                            alt=""
                            fill
                            sizes="64px"
                            className="object-cover transition-transform duration-500 group-hover:scale-105"
                          />
                        </span>
                      )}
                      <span className="shrink-0 text-ink-faint transition-transform group-hover:translate-x-1 group-hover:text-primary">
                        →
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ol>
          </div>
        </section>
      ) : isEventsBoard ? (
        (() => {
          const pin = () => (
            <svg
              width="13"
              height="13"
              viewBox="0 0 24 24"
              fill="currentColor"
              aria-hidden="true"
              className="shrink-0"
            >
              <path d="M12 2c-3.9 0-7 3.1-7 7 0 5.2 7 13 7 13s7-7.8 7-13c0-3.9-3.1-7-7-7zm0 9.5A2.5 2.5 0 1 1 12 6.5a2.5 2.5 0 0 1 0 5z" />
            </svg>
          );
          const cal = () => (
            <svg
              width="13"
              height="13"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              aria-hidden="true"
              className="shrink-0"
            >
              <rect x="3" y="4.5" width="18" height="17" rx="2.5" />
              <path d="M3 9.5h18M8 3v3M16 3v3" />
            </svg>
          );
          const statusText: Record<EventStatus, string> = {
            ongoing: t.board.eventNowOn,
            upcoming: t.board.eventUpcomingLabel,
            ended: t.board.eventEnded,
          };
          const rowPill: Record<EventStatus, string> = {
            ongoing: "bg-positive-soft text-positive",
            upcoming: "bg-primary-soft text-primary-strong",
            ended: "bg-surface-sub text-ink-faint",
          };

          const withMeta = posts.map((post) => ({
            post,
            status: eventStatus(post.event_start, post.event_end),
          }));
          const startKey = (p: (typeof posts)[number]) =>
            p.event_start ?? p.event_end ?? "9999-12-31";
          const endKey = (p: (typeof posts)[number]) =>
            p.event_end ?? p.event_start ?? "0000-01-01";
          const groupRank = (s: EventStatus | null) =>
            s === "ongoing" ? 0 : s === "upcoming" ? 1 : 2;

          // Featured: the live event, else the soonest upcoming, else newest.
          const featuredEntry =
            withMeta.find((e) => e.status === "ongoing") ??
            withMeta
              .filter((e) => e.status === "upcoming")
              .sort((a, b) =>
                startKey(a.post) < startKey(b.post) ? -1 : 1,
              )[0] ??
            withMeta[0];
          const featured = featuredEntry.post;
          const featuredTitle =
            locale === "ko" && featured.title_ko
              ? featured.title_ko
              : featured.title_en;
          const featuredThumb = repThumbnail(featured);
          const featuredStatus = featuredEntry.status;
          const featuredRange = formatEventRange(
            featured.event_start,
            featured.event_end,
            locale,
          );
          const featuredCountdown =
            featuredStatus === "upcoming" && featured.event_start
              ? eventCountdown(featured.event_start)
              : null;

          // Complete schedule: live + upcoming (soonest first), then past.
          const liveUpcoming = withMeta
            .filter((e) => e.status !== "ended")
            .sort((a, b) => {
              const r = groupRank(a.status) - groupRank(b.status);
              if (r !== 0) return r;
              return startKey(a.post) < startKey(b.post) ? -1 : 1;
            });
          const past = withMeta
            .filter((e) => e.status === "ended")
            .sort((a, b) => (endKey(a.post) > endKey(b.post) ? -1 : 1));

          const renderRow = ({
            post,
            status,
          }: {
            post: (typeof posts)[number];
            status: EventStatus | null;
          }) => {
            const block = eventDateBlock(
              post.event_start,
              post.event_end,
              locale,
            );
            const range = formatEventRange(
              post.event_start,
              post.event_end,
              locale,
            );
            const countdown =
              status === "upcoming" && post.event_start
                ? eventCountdown(post.event_start)
                : null;
            const rowTitle =
              locale === "ko" && post.title_ko ? post.title_ko : post.title_en;
            return (
              <li key={post.id}>
                <Link
                  href={`/${menu.slug}/${post.id}`}
                  className="group flex items-center gap-4 border-b border-line px-4 py-4 transition last:border-b-0 hover:bg-surface-sub sm:gap-5 sm:px-5"
                >
                  <span
                    className={`flex h-16 w-16 shrink-0 flex-col items-center justify-center rounded-2xl ${
                      status === "ended"
                        ? "bg-surface-sub text-ink-faint"
                        : "bg-[#101923] text-white"
                    }`}
                    aria-hidden="true"
                  >
                    {block ? (
                      <>
                        <span className="text-[10px] font-bold uppercase tracking-[.08em] opacity-80">
                          {block.month}
                        </span>
                        <span className="text-lg font-extrabold leading-none tabular-nums">
                          {block.day}
                        </span>
                        <span className="mt-0.5 text-[10px] font-semibold opacity-70">
                          {block.year}
                        </span>
                      </>
                    ) : (
                      cal()
                    )}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex flex-wrap items-center gap-2">
                      {status && (
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-bold ${rowPill[status]}`}
                        >
                          {status === "ongoing" && (
                            <span className="relative flex h-1.5 w-1.5">
                              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-positive opacity-70" />
                              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-positive" />
                            </span>
                          )}
                          {statusText[status]}
                        </span>
                      )}
                      {countdown && (
                        <span className="rounded-full bg-caution-soft px-2 py-0.5 text-[11px] font-bold tabular-nums text-caution">
                          {countdown}
                        </span>
                      )}
                    </span>
                    <strong className="mt-1.5 block truncate text-sm font-extrabold group-hover:text-primary sm:text-base">
                      {rowTitle}
                    </strong>
                    <span className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-ink-faint">
                      <span className="inline-flex items-center gap-1 font-semibold text-ink-soft">
                        {pin()}
                        {post.event_venue ?? t.board.eventVenueTbd}
                      </span>
                      {range && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span>{range}</span>
                        </>
                      )}
                    </span>
                  </span>
                  <span
                    className="shrink-0 text-ink-faint transition-transform group-hover:translate-x-1 group-hover:text-primary"
                    aria-hidden="true"
                  >
                    →
                  </span>
                </Link>
              </li>
            );
          };

          return (
            <section className="space-y-8">
              <Link
                href={`/${menu.slug}/${featured.id}`}
                className={`group relative grid min-h-80 overflow-hidden rounded-[2rem] bg-[#101923] text-white shadow-[0_24px_70px_rgba(16,25,35,.2)] ${featuredThumb ? "lg:grid-cols-[.9fr_1.1fr]" : "grid-cols-1"}`}
              >
                <span className="relative z-10 flex min-w-0 flex-col justify-between p-7 sm:p-10 lg:p-12">
                  <span>
                    <span className="text-xs font-bold uppercase tracking-[.18em] text-[#79b4ff]">
                      {t.board.eventsEyebrow}
                    </span>
                    <span className="mt-3 flex flex-wrap items-end gap-3">
                      <h1 className="text-3xl font-extrabold tracking-[-.04em] sm:text-5xl">
                        {title}
                      </h1>
                      <span className="mb-1 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white/65">
                        {posts.length} {t.board.availableNow}
                      </span>
                    </span>
                    <span className="mt-4 block max-w-xl text-sm leading-7 text-white/65">
                      {t.board.eventsHint}
                    </span>
                  </span>
                  <span className="mt-10 border-t border-white/15 pt-6">
                    <span className="flex flex-wrap items-center gap-2.5 text-xs font-bold">
                      <span className="uppercase tracking-[.14em] text-[#79b4ff]">
                        {t.board.featuredEvent}
                      </span>
                      {featuredStatus && (
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] ${
                            featuredStatus === "ongoing"
                              ? "bg-positive/20 text-[#7ee0a8]"
                              : featuredStatus === "upcoming"
                                ? "bg-white/15 text-white"
                                : "bg-white/10 text-white/55"
                          }`}
                        >
                          {featuredStatus === "ongoing" && (
                            <span className="relative flex h-1.5 w-1.5">
                              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#7ee0a8] opacity-70" />
                              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-[#7ee0a8]" />
                            </span>
                          )}
                          {statusText[featuredStatus]}
                        </span>
                      )}
                      {featuredCountdown && (
                        <span className="rounded-full bg-white/15 px-2 py-1 text-[11px] tabular-nums text-white">
                          {featuredCountdown}
                        </span>
                      )}
                    </span>
                    <span className="mt-3 flex items-end justify-between gap-5">
                      <span className="min-w-0">
                        <span className="block text-xl font-extrabold leading-snug sm:text-2xl">
                          {featuredTitle}
                        </span>
                        <span className="mt-3 flex flex-col gap-1.5 text-sm text-white/70">
                          <span className="flex items-center gap-2">
                            {pin()}
                            {featured.event_venue ?? t.board.eventVenueTbd}
                          </span>
                          {featuredRange && (
                            <span className="flex items-center gap-2">
                              {cal()}
                              {featuredRange}
                            </span>
                          )}
                        </span>
                      </span>
                      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white text-ink transition-transform group-hover:translate-x-1">
                        →
                      </span>
                    </span>
                  </span>
                </span>
                {featuredThumb && (
                  <span className="relative min-h-72 overflow-hidden bg-[#172331] lg:min-h-full">
                    <SafeImage
                      src={featuredThumb}
                      alt={featuredTitle}
                      fill
                      priority
                      sizes="(max-width:1024px) 100vw, 55vw"
                      className="object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                    <span
                      className="absolute inset-0 bg-linear-to-r from-[#101923] via-[#101923]/20 to-transparent max-lg:bg-linear-to-t max-lg:from-[#101923]/25 max-lg:to-transparent"
                      aria-hidden="true"
                    />
                  </span>
                )}
              </Link>

              <div className="space-y-6">
                <div>
                  <div className="mb-4 flex items-end justify-between gap-4">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-[.16em] text-primary">
                        {t.board.eventDirectory}
                      </p>
                      <h2 className="mt-1.5 text-2xl font-extrabold tracking-[-.035em]">
                        {t.board.exploreEvents}
                      </h2>
                    </div>
                  </div>
                  {liveUpcoming.length > 0 && (
                    <div>
                      <div className="mb-3 flex items-center gap-2.5">
                        <h3 className="text-sm font-extrabold tracking-[-.01em]">
                          {t.board.eventLiveGroup}
                        </h3>
                        <span className="rounded-full bg-surface-sub px-2 py-0.5 text-xs font-bold tabular-nums text-ink-faint">
                          {liveUpcoming.length}
                        </span>
                      </div>
                      <ol className="overflow-hidden rounded-[1.5rem] border border-line/80 bg-white shadow-(--shadow-card)">
                        {liveUpcoming.map(renderRow)}
                      </ol>
                    </div>
                  )}
                  {past.length > 0 && (
                    <div className="mt-7">
                      <div className="mb-3 flex items-center gap-2.5">
                        <h3 className="text-sm font-extrabold tracking-[-.01em] text-ink-soft">
                          {t.board.eventPastGroup}
                        </h3>
                        <span className="rounded-full bg-surface-sub px-2 py-0.5 text-xs font-bold tabular-nums text-ink-faint">
                          {past.length}
                        </span>
                      </div>
                      <ol className="overflow-hidden rounded-[1.5rem] border border-line/80 bg-white shadow-(--shadow-card)">
                        {past.map(renderRow)}
                      </ol>
                    </div>
                  )}
                </div>
              </div>
            </section>
          );
        })()
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
                      <SafeImage
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
                      <AuthorIdentity
                        uid={post.author_uid}
                        badges={post.author_badges}
                        locale={locale}
                        className="mt-3 text-sm text-white/60"
                      />
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
                    <span className="flex shrink-0 items-center gap-1.5">
                      <StatusLabel
                        status={closed ? "closed" : "approved"}
                        label={
                          closed
                            ? t.post.closed
                            : post.deadline
                              ? t.post.open
                              : t.post.openEnded
                        }
                      />
                      {!closed && post.deadline && (
                        <span className="inline-flex items-center whitespace-nowrap rounded-md bg-caution-soft px-2 py-0.5 text-xs font-semibold text-caution">
                          {t.post.deadline} {post.deadline}
                        </span>
                      )}
                    </span>
                  )}
                </div>
                <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-ink-soft">
                  {stripRichText(
                    locale === "ko" && post.body_teaser_ko
                      ? post.body_teaser_ko
                      : post.body_teaser_en,
                  )}
                </p>
                <AuthorIdentity
                  uid={post.author_uid}
                  badges={post.author_badges}
                  locale={locale}
                  className="mt-2 text-xs text-ink-faint"
                />
              </Link>
            );
          })}
        </div>
      )}

      {!isFaq && (
        <Pagination
          page={page}
          totalPages={totalPages}
          basePath={`/${menu.slug}`}
          extraQuery={{
            ...(activeCategory ? { category: activeCategory } : {}),
            ...(authorUid ? { uid: String(authorUid) } : {}),
          }}
          prevLabel={t.home.prev}
          nextLabel={t.home.next}
        />
      )}

      {!isNoticeBoard &&
        !isEventsBoard &&
        posts.length > 0 &&
        posts.length < 8 && (
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
