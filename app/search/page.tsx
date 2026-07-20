import Image from "next/image";
import Link from "next/link";
import { getT } from "@/lib/i18n/server";
import { getVisibleMenus } from "@/lib/data/menus";
import { createClient } from "@/lib/supabase/server";
import { BoardSectionHeading } from "@/components/marketplace/BoardSectionHeading";
import { Carousel } from "@/components/ui/Carousel";
import { ProductCard } from "@/components/marketplace/ProductCard";
import { SearchExperience } from "@/components/search/SearchExperience";
import {
  normalizeSearchScope,
  normalizeSearchSort,
  sanitizeSearchQuery,
  SEARCH_PAGE_SIZE,
} from "@/lib/search";
import { searchPublicPosts } from "@/lib/data/public-search";
import { getPublicSettings, settingString } from "@/lib/data/settings";
import { BOARD_TYPES, SETTING_KEYS } from "@/lib/constants";
import type { Metadata } from "next";
import type { PostTeaser } from "@/lib/types";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getT();
  return { title: t.search.title, robots: { index: false, follow: true } };
}

async function getSearchDiscovery() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("public_posts")
    .select("*")
    .eq("type", BOARD_TYPES.PRODUCT)
    .order("published_at", { ascending: false })
    .limit(20);
  const products = (data as PostTeaser[]) ?? [];
  const trustScore = (post: PostTeaser) =>
    post.author_badges.reduce(
      (score, badge) =>
        score +
        (badge.code === "certified" ? 2 : badge.code === "manufacturer" ? 1 : 0),
      0,
    );
  const recommended = [...products]
    .sort((a, b) => trustScore(b) - trustScore(a))
    .slice(0, 6);
  const recommendedIds = new Set(recommended.map((post) => post.id));
  const distinctLatest = products
    .filter((post) => !recommendedIds.has(post.id))
    .slice(0, 8);

  return {
    recommended,
    latest: distinctLatest.length > 0 ? distinctLatest : products.slice(0, 8),
  };
}

function Arrow() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  );
}

export default async function SearchPage(props: {
  searchParams: Promise<{ q?: string; type?: string; sort?: string }>;
}) {
  const [{ t, locale }, params, menus, discovery, settings] = await Promise.all([
    getT(),
    props.searchParams,
    getVisibleMenus(),
    getSearchDiscovery(),
    getPublicSettings(),
  ]);
  // Operator-managed popular chips (comma-separated per locale).
  const popularQueries = settingString(
    settings,
    locale === "ko"
      ? SETTING_KEYS.SEARCH_POPULAR_KO
      : SETTING_KEYS.SEARCH_POPULAR_EN,
    locale === "ko"
      ? "태양광, CNC, 화장품, EPC, 발전기"
      : "Solar, CNC, Beauty, EPC, Generator",
  )
    .split(",")
    .map((term) => term.trim())
    .filter(Boolean)
    .slice(0, 8);
  const initialQuery = sanitizeSearchQuery(params.q ?? "");
  const initialScope = normalizeSearchScope(params.type);
  const initialSort = normalizeSearchSort(params.sort);
  const initialResult = await searchPublicPosts({
    query: initialQuery,
    scope: initialScope,
    sort: initialSort,
    pageSize: SEARCH_PAGE_SIZE,
  });
  const menuSlugs = Object.fromEntries(
    menus.map((menu) => [menu.id, menu.slug]),
  );
  const firstProductBoard =
    menus.find((menu) => menu.board_type === BOARD_TYPES.PRODUCT)?.slug ??
    "commercial";
  const requestsSlug =
    menus.find((menu) => menu.board_type === BOARD_TYPES.REQUEST)?.slug ??
    "requests";
  const servicesSlug =
    menus.find((menu) => menu.slug === "services")?.slug ?? "services";

  const searchLabels = {
    placeholder: t.search.placeholder,
    popular: t.search.popular,
    sortLatest: t.board.sortLatest,
    sortPopular: t.board.sortPopular,
    recent: t.search.recent,
    clearRecent: t.search.clearRecent,
    all: t.search.all,
    products: t.search.products,
    requests: t.search.requests,
    minChars: t.search.minChars,
    searching: t.search.searching,
    results: t.search.results,
    resultsFor: t.search.resultsFor,
    resultCount: t.search.resultCount,
    loadMore: t.search.loadMore,
    error: t.search.error,
    noResults: t.search.noResults,
    noResultsHint: t.search.noResultsHint,
    clear: t.common.clearInput,
    search: t.common.search,
    open: t.post.open,
    closed: t.post.closed,
    openEnded: t.post.openEnded,
    deadline: t.post.deadline,
    sourcingRequest: t.post.sourcingRequest,
    eventNowOn: t.board.eventNowOn,
    eventUpcoming: t.board.eventUpcomingLabel,
    eventEnded: t.board.eventEnded,
    eventVenueTbd: t.board.eventVenueTbd,
  };

  return (
    <article className="full-bleed bg-white">
      <section className="bg-[linear-gradient(180deg,#eef5ff_0%,#f5f5f7_58%,#f5f5f7_100%)] py-16 sm:py-20 lg:py-24">
        <div className="store-shell">
          <BoardSectionHeading
            eyebrow={t.search.eyebrow}
            title={t.search.heroTitle}
            body={t.search.heroBody}
            level="h1"
          />
          <div className="mt-9 sm:mt-11">
            <SearchExperience
              initialQuery={initialQuery}
              initialScope={initialScope}
              initialSort={initialSort}
              initialResult={initialResult}
              menuSlugs={menuSlugs}
              locale={locale}
              labels={searchLabels}
              popularQueries={popularQueries}
            />
          </div>
        </div>
      </section>

      {discovery.recommended.length > 0 && (
        <section className="bg-white py-20 sm:py-24 lg:py-28">
          <div className="store-shell">
            <BoardSectionHeading
              eyebrow={t.search.recommendedEyebrow}
              title={t.search.recommendedTitle}
              body={t.search.recommendedBody}
              action={
                <Link
                  href={`/${firstProductBoard}`}
                  className="inline-flex items-center gap-2 text-sm font-bold text-primary transition hover:text-primary-strong"
                >
                  {t.dashboard.viewAll}
                  <Arrow />
                </Link>
              }
            />
            <div className="mt-10 lg:mt-12">
              <Carousel
                prevLabel={t.home.prev}
                nextLabel={t.home.next}
                edgeToEdge
              >
                {discovery.recommended.map((post, index) => (
                  <div key={post.id} className="store-card-featured">
                    <ProductCard
                      post={post}
                      href={`/${menuSlugs[post.menu_id] ?? firstProductBoard}/${post.id}`}
                      locale={locale}
                      priority={index < 3}
                      feature
                    />
                  </div>
                ))}
              </Carousel>
            </div>
          </div>
        </section>
      )}

      <section className="bg-[#f5f5f7] py-20 sm:py-24 lg:py-28">
        <div className="store-shell">
          <div className="relative overflow-hidden rounded-[2rem] bg-[#101923] px-7 py-14 text-white shadow-[0_24px_70px_rgba(16,25,35,.18)] sm:px-12 sm:py-16 lg:min-h-[25rem] lg:px-16 lg:py-20">
            <Image
              src="/landing-v2/precision-manufacturing.jpg"
              alt=""
              fill
              sizes="85.5vw"
              className="object-cover opacity-[.42]"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-[#07111f] via-[#07111f]/88 to-[#07111f]/28" />
            <div className="relative max-w-2xl">
              <p className="text-xs font-bold uppercase tracking-[.18em] text-[#79b4ff]">
                {t.search.bannerEyebrow}
              </p>
              <h2 className="mt-5 text-[2.25rem] font-semibold leading-[1.04] tracking-[-.045em] sm:text-5xl lg:text-[3.5rem]">
                {t.search.bannerTitle}
              </h2>
              <p className="mt-5 max-w-xl text-base leading-8 text-white/68 sm:text-lg">
                {t.search.bannerBody}
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link
                  href={`/${requestsSlug}`}
                  className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-primary px-6 text-sm font-bold text-white transition hover:bg-primary-strong"
                >
                  {t.search.bannerPrimary}
                  <Arrow />
                </Link>
                <Link
                  href={`/${servicesSlug}`}
                  className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-white/24 bg-white/10 px-6 text-sm font-bold text-white backdrop-blur-md transition hover:bg-white/16"
                >
                  {t.search.bannerSecondary}
                  <Arrow />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {discovery.latest.length > 0 && (
        <section className="bg-white py-20 sm:py-24 lg:py-28">
          <div className="store-shell">
            <BoardSectionHeading
              eyebrow={t.search.latestEyebrow}
              title={t.search.latestTitle}
              body={t.search.latestBody}
              action={
                <Link
                  href={`/${firstProductBoard}`}
                  className="inline-flex items-center gap-2 text-sm font-bold text-primary transition hover:text-primary-strong"
                >
                  {t.dashboard.viewAll}
                  <Arrow />
                </Link>
              }
            />
            <div className="mt-10 lg:mt-12">
              <Carousel
                prevLabel={t.home.prev}
                nextLabel={t.home.next}
                edgeToEdge
              >
                {discovery.latest.map((post, index) => (
                  <div key={post.id} className="store-card-featured">
                    <ProductCard
                      post={post}
                      href={`/${menuSlugs[post.menu_id] ?? firstProductBoard}/${post.id}`}
                      locale={locale}
                      priority={index < 3}
                      feature
                    />
                  </div>
                ))}
              </Carousel>
            </div>
          </div>
        </section>
      )}
    </article>
  );
}
