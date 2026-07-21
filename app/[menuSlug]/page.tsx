import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import {
  EditorialFeatureCard,
  EditorialListCard,
  RequestBoardCard,
} from "@/components/marketplace/BoardContentCards";
import { BoardSectionHeading } from "@/components/marketplace/BoardSectionHeading";
import { CollectionLeadCard } from "@/components/marketplace/CollectionLeadCard";
import {
  EventCard,
  EventSpotlightCard,
} from "@/components/marketplace/EventCard";
import { EventCalendar } from "@/components/marketplace/EventCalendar";
import { FaqExperience } from "@/components/marketplace/FaqExperience";
import { ProductCard } from "@/components/marketplace/ProductCard";
import { RecentlyViewedSection } from "@/components/marketplace/RecentlyViewed";
import { Carousel } from "@/components/ui/Carousel";
import { EmptyState } from "@/components/ui/EmptyState";
import { Pagination } from "@/components/ui/Pagination";
import { Reveal } from "@/components/ui/Reveal";
import {
  BOARD_TYPES,
  SETTING_KEYS,
  type Locale,
} from "@/lib/constants";
import { getMenuBySlug, menuTitle } from "@/lib/data/menus";
import {
  listPostHighlights,
  listPostsForMenu,
  type BoardSort,
} from "@/lib/data/posts";
import { getPublicSettings, settingBool } from "@/lib/data/settings";
import {
  eventStatus,
  type EventStatus,
} from "@/lib/events";
import { getT } from "@/lib/i18n/server";
import { sanitizeRichText, stripRichText } from "@/lib/richtext";
import { createClient } from "@/lib/supabase/server";
import type { Menu, PostTeaser } from "@/lib/types";

const RECOMMENDED_COLLECTION_IMAGES: Record<string, string> = {
  commercial: "/landing-v2/market-rail-commercial.jpg",
  industrial: "/landing-v2/market-rail-industrial.jpg",
  epc: "/landing-v2/market-rail-epc.jpg",
};

function Arrow() {
  return (
    <svg
      width="17"
      height="17"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  );
}

function TextLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link
      href={href}
      className="inline-flex min-h-11 items-center gap-2 rounded-full px-1 text-sm font-semibold text-primary transition-colors hover:text-primary-strong"
    >
      {children}
      <Arrow />
    </Link>
  );
}

function recommendationScore(post: PostTeaser) {
  return (
    post.author_badges.length * 5 +
    (post.rep_image_path || post.rep_video_url ? 3 : 0) +
    (post.body_truncated ? 1 : 0)
  );
}

function CategoryNav({
  menu,
  categories,
  activeCategory,
  locale,
  allLabel,
}: {
  menu: Menu;
  categories: { id: string; name_en: string; name_ko: string }[];
  activeCategory: string;
  locale: Locale;
  allLabel: string;
}) {
  if (categories.length === 0) return null;
  return (
    <nav className="scrollbar-none -mx-4 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:px-0">
      <Link
        href={`/${menu.slug}`}
        className={`inline-flex min-h-10 items-center whitespace-nowrap rounded-full px-4 text-sm font-semibold transition-colors ${
          !activeCategory
            ? "bg-ink text-white"
            : "bg-white text-ink-soft shadow-sm hover:text-primary"
        }`}
      >
        {allLabel}
      </Link>
      {categories.map((category) => (
        <Link
          key={category.id}
          href={`/${menu.slug}?category=${category.id}`}
          className={`inline-flex min-h-10 items-center whitespace-nowrap rounded-full px-4 text-sm font-semibold transition-colors ${
            activeCategory === category.id
              ? "bg-ink text-white"
              : "bg-white text-ink-soft shadow-sm hover:text-primary"
          }`}
        >
          {locale === "ko" ? category.name_ko : category.name_en}
        </Link>
      ))}
    </nav>
  );
}

export async function generateMetadata(props: {
  params: Promise<{ menuSlug: string }>;
}): Promise<Metadata> {
  const { menuSlug } = await props.params;
  const menu = await getMenuBySlug(menuSlug);
  if (!menu) return {};
  const { locale, t } = await getT();
  const title = menuTitle(menu, locale);
  const description =
    menu.board_type === BOARD_TYPES.REQUEST
      ? t.board.requestHint
      : menu.slug === "events"
        ? t.board.eventsHint
        : menu.slug === "notices"
          ? t.board.noticeHint
          : menu.slug === "faq"
            ? t.board.faqHint
            : menu.slug === "services"
              ? t.board.servicesHint
              : t.board.browseHint;
  return {
    title,
    description,
    alternates: { canonical: `/${menuSlug}` },
    openGraph: { title, description },
  };
}

export default async function BoardPage(props: {
  params: Promise<{ menuSlug: string }>;
  searchParams: Promise<{
    category?: string;
    page?: string;
    uid?: string;
    sort?: string;
    month?: string;
  }>;
}) {
  const [{ menuSlug }, query, { t, locale }, settings] = await Promise.all([
    props.params,
    props.searchParams,
    getT(),
    getPublicSettings(),
  ]);
  const menu = await getMenuBySlug(menuSlug);
  if (!menu || !menu.is_visible) notFound();

  const categoryNavVisible = settingBool(
    settings,
    SETTING_KEYS.CATEGORY_NAV_VISIBLE,
    false,
  );
  const activeCategory = categoryNavVisible ? (query.category ?? "") : "";
  const page = Math.max(1, Number.parseInt(query.page ?? "1", 10) || 1);
  const authorUid = Number.parseInt(query.uid ?? "", 10) || undefined;
  const sort: BoardSort = query.sort === "popular" ? "popular" : "latest";
  const supabase = await createClient();
  const {
    data: { user: viewer },
  } = await supabase.auth.getUser();

  const [{ posts, totalPages }, highlights, { data: categoryRows }] =
    await Promise.all([
      listPostsForMenu(
        menu.id,
        activeCategory || undefined,
        page,
        authorUid,
        sort,
      ),
      listPostHighlights(
        menu.id,
        activeCategory || undefined,
        authorUid,
        12,
      ),
      categoryNavVisible
        ? supabase
            .from("categories")
            .select("id, name_en, name_ko")
            .eq("is_active", true)
            .or(`menu_id.is.null,menu_id.eq.${menu.id}`)
            .order("sort_order")
        : Promise.resolve({ data: [] }),
    ]);

  // Viewer's saved products among the visible grid (heart overlays).
  const savedPostIds = new Set<string>(
    viewer && posts.length
      ? (
          (
            await supabase
              .from("post_bookmarks")
              .select("post_id")
              .eq("profile_id", viewer.id)
              .in(
                "post_id",
                posts.map((post) => post.id),
              )
          ).data ?? []
        ).map((row) => row.post_id)
      : [],
  );

  const categories =
    (categoryRows as
      | { id: string; name_en: string; name_ko: string }[]
      | null) ?? [];
  const title = menuTitle(menu, locale);
  const isProduct = menu.board_type === BOARD_TYPES.PRODUCT;
  const isRequest = menu.board_type === BOARD_TYPES.REQUEST;
  const isEvents = menu.slug === "events";
  const isServices = menu.slug === "services";
  const isFaq = menu.slug === "faq";
  const recommendedProducts = [...highlights]
    .sort((a, b) => {
      const score = recommendationScore(b) - recommendationScore(a);
      if (score !== 0) return score;
      return (b.published_at ?? "").localeCompare(a.published_at ?? "");
    })
    .slice(0, 4);
  const newProducts = highlights.slice(0, 6);
  const cardLabels = {
    ongoing: t.board.eventNowOn,
    upcoming: t.board.eventUpcomingLabel,
    ended: t.board.eventEnded,
    venueTbd: t.board.eventVenueTbd,
  };

  const faqItems = isFaq
    ? (
        (
          await supabase
            .from("public_posts")
            .select(
              "id, title_en, title_ko, body_teaser_en, body_teaser_ko",
            )
            .eq("menu_id", menu.id)
            .order("published_at", { ascending: false })
        ).data ?? []
      ).map((row) => {
        const question =
          locale === "ko" && row.title_ko ? row.title_ko : row.title_en;
        const answerRaw =
          locale === "ko" && row.body_teaser_ko
            ? row.body_teaser_ko
            : row.body_teaser_en;
        return {
          id: row.id as string,
          question: question as string,
          answer: sanitizeRichText(answerRaw ?? ""),
          plain: stripRichText(answerRaw ?? ""),
        };
      })
    : [];

  return (
    <div className="full-bleed overflow-hidden bg-[#f5f5f7]">
      {authorUid && (
        <section className="bg-white py-8">
          <div className="store-shell flex items-center justify-between rounded-2xl border border-primary/15 bg-primary-soft px-5 py-3 text-sm">
            <span className="font-bold text-primary-strong">
              UID:{authorUid}
            </span>
            <Link
              href={`/${menu.slug}`}
              className="font-semibold text-ink-soft hover:text-ink"
            >
              {t.common.clearFilter}
            </Link>
          </div>
        </section>
      )}

      {posts.length === 0 && !isFaq ? (
        <EmptyBoard
          eyebrow={title}
          title={
            isServices
              ? t.board.serviceDirectory
              : isRequest
                ? t.board.activeRequests
                : isEvents
                  ? t.board.eventLiveGroup
                  : isProduct
                    ? t.board.allProducts
                    : t.board.allNotices
          }
          body={
            isServices
              ? t.board.servicesDirectoryHint
              : isRequest
                ? t.board.activeRequestsHint
                : isEvents
                  ? t.board.eventDirectoryHint
                  : isProduct
                    ? t.board.allProductsHint
                    : t.board.noticeHint
          }
          emptyTitle={t.common.emptyList}
          emptyHint={t.common.emptyListHint}
        />
      ) : isProduct ? (
        <>
          <section className="bg-white pb-16 pt-12 sm:pb-20 sm:pt-16 lg:pb-24 lg:pt-20">
            <div className="store-shell">
              <Reveal>
                <BoardSectionHeading
                  eyebrow={title}
                  title={t.board.recommendedProducts}
                  body={t.board.recommendedProductsHint}
                  level="h1"
                  action={
                    <TextLink href="#all-products">
                      {t.board.viewAllProducts}
                    </TextLink>
                  }
                />
              </Reveal>
              <div className="mt-8 sm:mt-10">
                <Carousel
                  prevLabel={t.home.prev}
                  nextLabel={t.home.next}
                  edgeToEdge
                  marquee
                >
                  <div className="store-card-collection-lead">
                    <CollectionLeadCard
                      href="#all-products"
                      image={
                        RECOMMENDED_COLLECTION_IMAGES[menu.slug] ??
                        "/landing-v2/hero-global-collaboration.jpg"
                      }
                      title={title}
                      body={t.board.recommendedProductsHint}
                      actionLabel={t.board.viewAllProducts}
                    />
                  </div>
                  {recommendedProducts.map((post, index) => (
                    <div key={post.id} className="store-card-collection-item">
                      <ProductCard
                        post={post}
                        href={`/${menu.slug}/${post.id}`}
                        locale={locale}
                        priority={index < 3}
                        feature
                        compactFeature
                      />
                    </div>
                  ))}
                </Carousel>
              </div>
            </div>
          </section>

          <section className="bg-[#f5f5f7] py-16 sm:py-20 lg:py-24">
            <div className="store-shell">
              <Reveal>
                <BoardSectionHeading
                  eyebrow={t.board.newCollection}
                  title={t.board.newProducts}
                  body={t.board.newProductsHint}
                />
              </Reveal>
              <div className="mt-8 sm:mt-10">
                <Carousel
                  prevLabel={t.home.prev}
                  nextLabel={t.home.next}
                  edgeToEdge
                  marquee
                >
                  {newProducts.map((post, index) => (
                    <div
                      key={post.id}
                      className="w-40 shrink-0 snap-start sm:w-56"
                    >
                      <ProductCard
                        post={post}
                        href={`/${menu.slug}/${post.id}`}
                        locale={locale}
                        priority={index < 3}
                      />
                    </div>
                  ))}
                </Carousel>
              </div>
            </div>
          </section>

          <section
            id="all-products"
            className="scroll-mt-24 bg-white py-16 sm:py-20 lg:py-24"
          >
            <div className="store-shell">
              <Reveal>
                <BoardSectionHeading
                  eyebrow={t.board.productDirectory}
                  title={t.board.allProducts}
                  body={t.board.allProductsHint}
                />
              </Reveal>
              {categoryNavVisible && (
                <div className="mt-8">
                  <CategoryNav
                    menu={menu}
                    categories={categories}
                    activeCategory={activeCategory}
                    locale={locale}
                    allLabel={t.common.all}
                  />
                </div>
              )}
              <nav
                aria-label={t.board.sortLabel}
                className="mt-8 flex gap-1.5"
              >
                {(
                  [
                    ["latest", t.board.sortLatest],
                    ["popular", t.board.sortPopular],
                  ] as const
                ).map(([value, label]) => {
                  const params = new URLSearchParams({
                    ...(activeCategory ? { category: activeCategory } : {}),
                    ...(authorUid ? { uid: String(authorUid) } : {}),
                    ...(value === "popular" ? { sort: value } : {}),
                  });
                  const search = params.toString();
                  return (
                    <Link
                      key={value}
                      href={`/${menu.slug}${search ? `?${search}` : ""}#all-products`}
                      aria-current={sort === value ? "page" : undefined}
                      className={`inline-flex min-h-9 items-center rounded-full px-3.5 text-[13px] font-bold transition-colors ${
                        sort === value
                          ? "bg-ink text-white"
                          : "bg-[#f5f5f7] text-ink-soft hover:text-primary"
                      }`}
                    >
                      {label}
                    </Link>
                  );
                })}
              </nav>
              {/* Dense shopping grid (Coupang-style): two columns on phones,
                  image tile + title + trust row per card. */}
              <div className="mt-6 grid grid-cols-2 gap-x-3 gap-y-7 sm:grid-cols-3 sm:gap-x-4 lg:grid-cols-4 xl:grid-cols-5">
                {posts.map((post, index) => (
                  <ProductCard
                    key={post.id}
                    post={post}
                    href={`/${menu.slug}/${post.id}`}
                    locale={locale}
                    priority={index < 4}
                    bookmark={
                      viewer
                        ? {
                            saved: savedPostIds.has(post.id),
                            returnTo: `/${menu.slug}`,
                            saveLabel: t.dashboard.saveProduct,
                            savedLabel: t.dashboard.savedProduct,
                          }
                        : undefined
                    }
                  />
                ))}
              </div>
              <Pagination
                page={page}
                totalPages={totalPages}
                basePath={`/${menu.slug}`}
                extraQuery={{
                  ...(activeCategory ? { category: activeCategory } : {}),
                  ...(authorUid ? { uid: String(authorUid) } : {}),
                  ...(sort === "popular" ? { sort } : {}),
                }}
                prevLabel={t.home.prev}
                nextLabel={t.home.next}
              />
            </div>
          </section>

          <RecentlyViewedSection
            heading={t.board.recentlyViewed}
            locale={locale}
          />
        </>
      ) : isRequest ? (
        <section className="bg-white pb-16 pt-12 sm:pb-20 sm:pt-16 lg:pb-24 lg:pt-20">
          <div className="store-shell">
            <Reveal>
              <BoardSectionHeading
                eyebrow={title}
                title={t.board.activeRequests}
                body={t.board.activeRequestsHint}
                level="h1"
              />
            </Reveal>
            {categoryNavVisible && (
              <div className="mt-8">
                <CategoryNav
                  menu={menu}
                  categories={categories}
                  activeCategory={activeCategory}
                  locale={locale}
                  allLabel={t.common.all}
                />
              </div>
            )}
            <div className="mt-8 grid gap-3 sm:mt-10 sm:gap-5 lg:grid-cols-2">
              {posts.map((post) => (
                <RequestBoardCard
                  key={post.id}
                  post={post}
                  href={`/${menu.slug}/${post.id}`}
                  locale={locale}
                  openLabel={t.post.open}
                  closedLabel={t.post.closed}
                  openEndedLabel={t.post.openEnded}
                  deadlineLabel={t.post.deadline}
                />
              ))}
            </div>
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
          </div>
        </section>
      ) : isEvents ? (
        <EventsBoard
          menu={menu}
          posts={posts}
          locale={locale}
          labels={cardLabels}
          t={t}
          page={page}
          totalPages={totalPages}
          month={query.month}
        />
      ) : isFaq ? (
        <section className="bg-white pb-16 pt-12 sm:pb-20 sm:pt-16 lg:pb-24 lg:pt-20">
          <div className="store-shell">
            <Reveal>
              <BoardSectionHeading
                eyebrow={title}
                title={t.board.faqDirectory}
                body={t.board.faqHint}
                level="h1"
              />
            </Reveal>
            <div className="mt-8 sm:mt-10">
              <FaqExperience
                items={faqItems}
                searchPlaceholder={t.board.faqSearch}
                emptyLabel={t.board.faqEmpty}
                clearLabel={t.common.clearFilter}
                answerLabel={t.board.faqAnswer}
                questionsLabel={t.board.faqQuestions}
                questionCountLabel={t.board.faqCount}
                helpTitle={t.board.faqHelpTitle}
                helpBody={t.board.faqHelpBody}
                helpActionLabel={t.board.faqHelpAction}
                helpHref="/services"
              />
            </div>
          </div>
        </section>
      ) : isServices ? (
        <EditorialBoard
          menu={menu}
          posts={posts}
          locale={locale}
          eyebrow={title}
          featureTitle={t.board.featuredService}
          featureBody={t.board.servicesHint}
          directoryTitle={t.board.serviceDirectory}
          directoryBody={t.board.servicesDirectoryHint}
          showDate={false}
          page={page}
          totalPages={totalPages}
          prevLabel={t.home.prev}
          nextLabel={t.home.next}
        />
      ) : (
        <EditorialBoard
          menu={menu}
          posts={posts}
          locale={locale}
          eyebrow={title}
          featureTitle={t.board.latestNotice}
          featureBody={t.board.noticeHint}
          directoryTitle={t.board.allNotices}
          directoryBody={t.board.noticeHint}
          showDate
          page={page}
          totalPages={totalPages}
          prevLabel={t.home.prev}
          nextLabel={t.home.next}
        />
      )}
    </div>
  );
}

function EditorialBoard({
  menu,
  posts,
  locale,
  eyebrow,
  featureTitle,
  featureBody,
  directoryTitle,
  directoryBody,
  showDate,
  page,
  totalPages,
  prevLabel,
  nextLabel,
}: {
  menu: Menu;
  posts: PostTeaser[];
  locale: Locale;
  eyebrow: string;
  featureTitle: string;
  featureBody: string;
  directoryTitle: string;
  directoryBody: string;
  showDate: boolean;
  page: number;
  totalPages: number;
  prevLabel: string;
  nextLabel: string;
}) {
  return (
    <>
      <section className="bg-white pb-16 pt-12 sm:pb-20 sm:pt-16 lg:pb-24 lg:pt-20">
        <div className="store-shell">
          <Reveal>
            <BoardSectionHeading
              eyebrow={eyebrow}
              title={featureTitle}
              level="h1"
              body={featureBody}
            />
          </Reveal>
          <div className="mt-8 sm:mt-10">
            <EditorialFeatureCard
              post={posts[0]}
              href={`/${menu.slug}/${posts[0].id}`}
              locale={locale}
              eyebrow={eyebrow}
              showDate={showDate}
            />
          </div>
        </div>
      </section>
      <section className="bg-[#f5f5f7] py-16 sm:py-20 lg:py-24">
        <div className="store-shell">
          <Reveal>
            <BoardSectionHeading
              eyebrow={eyebrow}
              title={directoryTitle}
              body={directoryBody}
            />
          </Reveal>
          <div className="mt-8 grid gap-5 sm:mt-10 lg:grid-cols-2">
            {posts.slice(1).map((post) => (
              <EditorialListCard
                key={post.id}
                post={post}
                href={`/${menu.slug}/${post.id}`}
                locale={locale}
                showDate={showDate}
              />
            ))}
          </div>
          <Pagination
            page={page}
            totalPages={totalPages}
            basePath={`/${menu.slug}`}
            prevLabel={prevLabel}
            nextLabel={nextLabel}
          />
        </div>
      </section>
    </>
  );
}

function EmptyBoard({
  eyebrow,
  title,
  body,
  emptyTitle,
  emptyHint,
}: {
  eyebrow: string;
  title: string;
  body: string;
  emptyTitle: string;
  emptyHint: string;
}) {
  return (
    <section className="bg-white pb-16 pt-12 sm:pb-20 sm:pt-16 lg:pb-24 lg:pt-20">
      <div className="store-shell">
        <Reveal>
          <BoardSectionHeading
            eyebrow={eyebrow}
            title={title}
            body={body}
            level="h1"
          />
        </Reveal>
        <div className="mt-8 rounded-[1.75rem] border border-line/70 bg-[#f5f5f7] px-6 py-14 shadow-[0_16px_50px_rgba(25,31,40,.05)] sm:mt-10 sm:px-10 sm:py-20">
          <EmptyState title={emptyTitle} hint={emptyHint} />
        </div>
      </div>
    </section>
  );
}

function EventsBoard({
  menu,
  posts,
  locale,
  labels,
  t,
  page,
  totalPages,
  month,
}: {
  menu: Menu;
  posts: PostTeaser[];
  locale: Locale;
  labels: {
    ongoing: string;
    upcoming: string;
    ended: string;
    venueTbd: string;
  };
  t: Awaited<ReturnType<typeof getT>>["t"];
  page: number;
  totalPages: number;
  month?: string;
}) {
  // Calendar month: ?month=YYYY-MM, defaulting to the current month.
  const todayIso = new Date().toISOString().slice(0, 10);
  const activeMonth = /^\d{4}-(0[1-9]|1[0-2])$/.test(month ?? "")
    ? (month as string)
    : todayIso.slice(0, 7);
  const [calYear, calMonth] = activeMonth.split("-").map(Number);
  const monthHref = (offset: number) => {
    const date = new Date(Date.UTC(calYear, calMonth - 1 + offset, 1));
    const value = date.toISOString().slice(0, 7);
    return `/${menu.slug}?month=${value}#event-calendar`;
  };
  const monthLabel = new Intl.DateTimeFormat(
    locale === "ko" ? "ko-KR" : "en-US",
    { year: "numeric", month: "long", timeZone: "UTC" },
  ).format(new Date(Date.UTC(calYear, calMonth - 1, 1)));
  const calendarEvents = posts
    .filter((post) => post.event_start)
    .map((post) => ({
      id: post.id,
      title:
        locale === "ko" && post.title_ko ? post.title_ko : post.title_en,
      href: `/${menu.slug}/${post.id}`,
      start: post.event_start as string,
      end: post.event_end ?? null,
    }));
  const rank = (status: EventStatus | null) =>
    status === "ongoing" ? 0 : status === "upcoming" ? 1 : 2;
  const entries = posts
    .map((post) => ({
      post,
      status: eventStatus(post.event_start, post.event_end),
    }))
    .sort((a, b) => {
      const statusRank = rank(a.status) - rank(b.status);
      if (statusRank !== 0) return statusRank;
      return (a.post.event_start ?? "").localeCompare(
        b.post.event_start ?? "",
      );
    });
  const featured = entries[0];
  const upcoming = entries.filter(
    (entry) =>
      entry.post.id !== featured.post.id && entry.status !== "ended",
  );
  const past = entries.filter((entry) => entry.status === "ended");

  return (
    <>
      <section className="bg-white pb-16 pt-12 sm:pb-20 sm:pt-16 lg:pb-24 lg:pt-20">
        <div className="store-shell">
          <Reveal>
            <BoardSectionHeading
              eyebrow={menuTitle(menu, locale)}
              title={t.board.featuredEvent}
              body={t.board.eventsHint}
              level="h1"
              action={
                <TextLink href={`/${menu.slug}/${featured.post.id}`}>
                  {t.common.seeMore}
                </TextLink>
              }
            />
          </Reveal>
          <div className="mt-8 sm:mt-10">
            <EventSpotlightCard
              post={featured.post}
              href={`/${menu.slug}/${featured.post.id}`}
              locale={locale}
              labels={labels}
              priority
            />
          </div>
        </div>
      </section>

      <section
        id="event-calendar"
        className="scroll-mt-24 bg-[#f5f5f7] py-16 sm:py-20 lg:py-24"
      >
        <div className="store-shell">
          <Reveal>
            <BoardSectionHeading
              eyebrow={t.board.eventDirectory}
              title={t.board.calendarTitle}
              body={t.board.calendarHint}
            />
          </Reveal>
          <div className="mt-8 sm:mt-10">
            <EventCalendar
              events={calendarEvents}
              month={activeMonth}
              monthLabel={monthLabel}
              prevHref={monthHref(-1)}
              nextHref={monthHref(1)}
              prevLabel={t.home.prev}
              nextLabel={t.home.next}
              weekdays={t.common.weekdaysShort}
              todayIso={todayIso}
            />
          </div>
        </div>
      </section>

      {upcoming.length > 0 && (
        <section className="bg-white py-16 sm:py-20 lg:py-24">
          <div className="store-shell">
            <Reveal>
              <BoardSectionHeading
                eyebrow={t.board.eventDirectory}
                title={t.board.eventLiveGroup}
                body={t.board.eventDirectoryHint}
              />
            </Reveal>
            <div className="mt-8 grid gap-5 sm:mt-10 sm:grid-cols-2 lg:grid-cols-3">
              {upcoming.map(({ post }, index) => (
                <EventCard
                  key={post.id}
                  post={post}
                  href={`/${menu.slug}/${post.id}`}
                  locale={locale}
                  labels={labels}
                  priority={index < 3}
                />
              ))}
            </div>
          </div>
        </section>
      )}

      {past.length > 0 && (
        <section className="bg-[#f5f5f7] py-16 sm:py-20 lg:py-24">
          <div className="store-shell">
            <Reveal>
              <BoardSectionHeading
                eyebrow={t.board.eventDirectory}
                title={t.board.eventPastGroup}
                body={t.board.pastEventsHint}
              />
            </Reveal>
            <div className="mt-8 grid gap-5 sm:mt-10 sm:grid-cols-2 lg:grid-cols-3">
              {past.map(({ post }) => (
                <EventCard
                  key={post.id}
                  post={post}
                  href={`/${menu.slug}/${post.id}`}
                  locale={locale}
                  labels={labels}
                />
              ))}
            </div>
            <Pagination
              page={page}
              totalPages={totalPages}
              basePath={`/${menu.slug}`}
              prevLabel={t.home.prev}
              nextLabel={t.home.next}
            />
          </div>
        </section>
      )}
    </>
  );
}
