import { Suspense, type ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { Reveal } from "@/components/ui/Reveal";
import { Carousel } from "@/components/ui/Carousel";
import { JsonLd } from "@/components/seo/JsonLd";
import { ProductCard } from "@/components/marketplace/ProductCard";
import { EventCard } from "@/components/marketplace/EventCard";
import { CollectionLeadCard } from "@/components/marketplace/CollectionLeadCard";
import { getT } from "@/lib/i18n/server";
import { getVisibleMenus, menuTitle } from "@/lib/data/menus";
import { getSession } from "@/lib/data/session";
import { createClient } from "@/lib/supabase/server";
import { getPublicSettings, settingNumber } from "@/lib/data/settings";
import { postMediaUrl } from "@/lib/media";
import { BOARD_TYPES, SETTING_KEYS } from "@/lib/constants";
import type { Menu, PostTeaser } from "@/lib/types";
import { listFeed } from "@/lib/data/feed";
import { FeedCard } from "@/components/feed/FeedCard";
import { getFeedCardLabels } from "@/lib/i18n/feed";
import { LandingPageSkeleton } from "@/components/landing/LandingPageSkeleton";
import { OpportunityCard } from "@/components/landing/OpportunityCard";

const MARKET_IMAGES = [
  "/landing-v2/market-rail-commercial.jpg",
  "/landing-v2/market-rail-industrial.jpg",
  "/landing-v2/market-rail-epc.jpg",
];

// Landing card family. Desktop dimensions and the shared 28px content inset
// are intentionally fixed so every rail keeps one predictable visual rhythm.
const LANDING_CARD_FAMILY = {
  featured: "store-card-featured",
  collectionLead: "store-card-collection-lead",
  collectionItem: "store-card-collection-item",
  process: "store-card-process",
  opportunity: "store-card-featured",
  showcase: "store-card-showcase",
  calendar: "store-card-calendar",
  network: "store-card-network",
} as const;

async function getStorefront(
  eventsMenuId: string | null,
  featuredSlots: number,
  marketMenuIds: string[],
) {
  const supabase = await createClient();
  const [products, requests, events, featured, marketRailEntries] =
    await Promise.all([
      supabase
        .from("public_posts")
        .select("*")
        .eq("type", BOARD_TYPES.PRODUCT)
        .order("published_at", { ascending: false })
        .limit(8),
      supabase
        .from("public_posts")
        .select("*")
        .eq("type", BOARD_TYPES.REQUEST)
        .order("published_at", { ascending: false })
        .limit(4),
      eventsMenuId
        ? supabase
            .from("public_posts")
            .select("*")
            .eq("menu_id", eventsMenuId)
            .order("published_at", { ascending: false })
            .limit(2)
        : Promise.resolve({ data: [] }),
      supabase
        .from("mini_homepages")
        .select(
          "slug, cover_image_path, intro_en, intro_ko, profiles(display_name, company_name)",
        )
        .eq("is_published", true)
        .order("updated_at", { ascending: false })
        .limit(featuredSlots),
      Promise.all(
        marketMenuIds.map(async (menuId) => {
          const { data } = await supabase
            .from("public_posts")
            .select("*")
            .eq("menu_id", menuId)
            .order("published_at", { ascending: false })
            .limit(6);
          return [menuId, (data as PostTeaser[]) ?? []] as const;
        }),
      ),
    ]);

  return {
    products: (products.data as PostTeaser[]) ?? [],
    requests: (requests.data as PostTeaser[]) ?? [],
    events: (events.data as PostTeaser[]) ?? [],
    featured: (featured.data ?? []) as unknown as {
      slug: string;
      cover_image_path: string | null;
      intro_en: string;
      intro_ko: string | null;
      profiles: {
        display_name: string | null;
        company_name: string | null;
      } | null;
    }[],
    marketPostsByMenu: Object.fromEntries(marketRailEntries) as Record<
      string,
      PostTeaser[]
    >,
  };
}

function Arrow({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
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

function SectionHeading({
  eyebrow,
  title,
  body,
  action,
}: {
  eyebrow: string;
  title: string;
  body?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex items-end justify-between gap-6">
      <div className="min-w-0 max-w-5xl">
        <p className="text-xs font-bold uppercase tracking-[.16em] text-primary">
          {eyebrow}
        </p>
        <h2 className="mt-3 text-[2rem] font-semibold leading-[1.08] tracking-[-.035em] text-ink sm:text-[2.5rem] lg:text-5xl">
          {title}
        </h2>
        {body && (
          <p className="mt-4 text-pretty text-base leading-7 text-ink-soft sm:text-lg sm:leading-8">
            {body}
          </p>
        )}
      </div>
      {action && <div className="hidden shrink-0 sm:block">{action}</div>}
    </div>
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

async function LandingContent() {
  const [{ t, locale }, menus, session, settings] = await Promise.all([
    getT(),
    getVisibleMenus(),
    getSession(),
    getPublicSettings(),
  ]);
  const eventsMenu =
    menus.find((menu) => menu.board_type === BOARD_TYPES.FLEXIBLE) ?? null;
  const requestsMenu =
    menus.find((menu) => menu.board_type === BOARD_TYPES.REQUEST) ?? null;
  const firstProductBoard =
    menus.find((menu) => menu.board_type === BOARD_TYPES.PRODUCT)?.slug ??
    "industrial";
  const marketRailMenus = ["commercial", "industrial", "epc"]
    .map((slug) => menus.find((menu) => menu.slug === slug))
    .filter((menu): menu is Menu => Boolean(menu));
  const [storefront, feedItems] = await Promise.all([
    getStorefront(
      eventsMenu?.id ?? null,
      settingNumber(settings, SETTING_KEYS.FEATURED_SLOTS, 6),
      marketRailMenus.map((menu) => menu.id),
    ),
    listFeed({ limit: 8 }),
  ]);
  const { products, requests, events, featured, marketPostsByMenu } =
    storefront;
  const menuSlugById = new Map<string, string>(
    menus.map((menu: Menu) => [menu.id, menu.slug]),
  );
  // Products already surfaced in "New arrivals" are dropped from the category
  // rails below so the same listing never appears twice on the landing page.
  const featuredProductIds = new Set(products.map((post) => post.id));
  const container = "store-shell";
  const steps = [
    { n: "01", title: t.home.step1Title, body: t.home.step1Body },
    { n: "02", title: t.home.step2Title, body: t.home.step2Body },
    { n: "03", title: t.home.step3Title, body: t.home.step3Body },
  ];
  const values = [
    { title: t.home.value1Title, body: t.home.value1Body },
    { title: t.home.value2Title, body: t.home.value2Body },
    { title: t.home.value3Title, body: t.home.value3Body },
  ];
  const eventCardLabels = {
    ongoing: t.board.eventNowOn,
    upcoming: t.board.eventUpcomingLabel,
    ended: t.board.eventEnded,
    venueTbd: t.board.eventVenueTbd,
  };
  const marketRailCopy: Record<
    string,
    { tagline: string; title: string; body: string; image: string }
  > = {
    commercial: {
      tagline: t.home.commercialRailTagline,
      title: t.home.commercialRailTitle,
      body: t.home.commercialRailBody,
      image: MARKET_IMAGES[0],
    },
    industrial: {
      tagline: t.home.industrialRailTagline,
      title: t.home.industrialRailTitle,
      body: t.home.industrialRailBody,
      image: MARKET_IMAGES[1],
    },
    epc: {
      tagline: t.home.epcRailTagline,
      title: t.home.epcRailTitle,
      body: t.home.epcRailBody,
      image: MARKET_IMAGES[2],
    },
  };

  return (
    <>
      <div className="full-bleed overflow-hidden bg-white">
        <JsonLd
          data={[
            {
              "@context": "https://schema.org",
              "@type": "Organization",
              name: t.common.siteName,
              url: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
              description: t.home.heroSubtitle,
            },
            {
              "@context": "https://schema.org",
              "@type": "WebSite",
              name: t.common.siteName,
              url: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
              potentialAction: {
                "@type": "SearchAction",
                target: `${process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"}/search?q={search_term_string}`,
                "query-input": "required name=search_term_string",
              },
            },
          ]}
        />

        <section className="border-b-[12px] border-white bg-[#edf6ff]">
          <Reveal className="h-full">
            <div className="relative isolate min-h-[42rem] overflow-hidden bg-[#edf6ff] text-[#1d1d1f] sm:min-h-[48rem] lg:min-h-[min(54rem,calc(100svh-4.5rem))]">
              <Image
                src="/landing-v2/hero-trade-network-v3.jpg"
                alt=""
                fill
                priority
                sizes="100vw"
                className="object-cover object-bottom xl:object-top"
              />
              {/* Small screens crop into the busy globe, so the copy zone gets
                  a stronger wash than the desktop composition needs. */}
              <div
                className="absolute inset-0 bg-[linear-gradient(180deg,rgba(246,251,255,.94)_0%,rgba(242,249,255,.8)_32%,rgba(236,246,255,.34)_56%,rgba(231,243,255,0)_76%)] lg:bg-[linear-gradient(180deg,rgba(246,251,255,.5)_0%,rgba(238,247,255,.1)_36%,rgba(231,243,255,0)_58%)]"
                aria-hidden="true"
              />
              <div className="relative z-10 flex min-h-[42rem] flex-col items-center px-5 pt-14 text-center sm:min-h-[48rem] sm:px-8 sm:pt-16 lg:min-h-[min(54rem,calc(100svh-4.5rem))] lg:pt-16">
                <div className="flex max-w-[62rem] flex-col items-center">
                  <p className="text-xs font-bold uppercase tracking-[.17em] text-[#1769e0]">
                    {t.home.eyebrow}
                  </p>
                  <h1 className="mt-4 max-w-[15ch] text-balance text-[3rem] font-semibold leading-[.98] tracking-[-.052em] text-[#1d1d1f] sm:max-w-[18ch] sm:text-[4rem] lg:max-w-none lg:whitespace-nowrap lg:text-[clamp(4rem,5.2vw,4.75rem)]">
                    {t.home.heroTitle}
                  </h1>
                  <p className="mt-5 max-w-[48rem] text-balance text-base leading-7 text-[#3f4650] sm:text-xl sm:leading-8 lg:max-w-none lg:whitespace-nowrap">
                    {t.home.heroSubtitle}
                  </p>
                  <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
                    <Link
                      href={`/${firstProductBoard}`}
                      className="inline-flex min-h-12 items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-primary-strong"
                    >
                      {t.home.browseBoards}
                      <Arrow />
                    </Link>
                    {requestsMenu && (
                      <Link
                        href={`/${requestsMenu.slug}`}
                        className="inline-flex min-h-12 items-center gap-2 rounded-full border border-[#1769e0] bg-white/72 px-6 py-3 text-sm font-semibold text-[#1769e0] backdrop-blur-md transition-colors hover:bg-white"
                      >
                        {t.home.browseRequests}
                        <Arrow />
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </Reveal>
        </section>

        {products.length > 0 && (
          <section className="bg-[#f5f5f7] py-12 sm:py-20 lg:py-32">
            <div className={container}>
              <Reveal>
                <SectionHeading
                  eyebrow={t.home.eyebrowBrowse}
                  title={t.home.newProducts}
                  body={t.home.newProductsBody}
                  action={
                    <TextLink href={`/${firstProductBoard}`}>
                      {t.dashboard.viewAll}
                    </TextLink>
                  }
                />
              </Reveal>
              <div className="mt-7 lg:mt-12">
                <Carousel
                  prevLabel={t.home.prev}
                  nextLabel={t.home.next}
                  marquee
                  edgeToEdge
                >
                  {products.map((post, index) => (
                    <div key={post.id} className={LANDING_CARD_FAMILY.featured}>
                      <ProductCard
                        post={post}
                        href={`/${menuSlugById.get(post.menu_id) ?? firstProductBoard}/${post.id}`}
                        locale={locale}
                        priority={index < 3}
                        feature
                      />
                    </div>
                  ))}
                </Carousel>
              </div>
              <div className="mt-7 sm:hidden">
                <TextLink href={`/${firstProductBoard}`}>
                  {t.dashboard.viewAll}
                </TextLink>
              </div>

              <div className="mt-14 space-y-14 sm:mt-20 sm:space-y-20">
                {marketRailMenus.map((menu) => {
                  const copy = marketRailCopy[menu.slug];
                  const railPosts = marketPostsByMenu[menu.id] ?? [];
                  // Prefer to drop items already shown in "New arrivals" so a
                  // listing isn't seen twice -- but only when that still leaves
                  // a full rail. On a small catalog (where the newest items ARE
                  // a whole category) fall back to the category's own newest so
                  // the rail is never emptied or reduced to a lonely card.
                  const deduped = railPosts.filter(
                    (post) => !featuredProductIds.has(post.id),
                  );
                  const menuPosts = deduped.length >= 3 ? deduped : railPosts;
                  if (!copy || menuPosts.length === 0) return null;
                  const title = menuTitle(menu, locale);

                  return (
                    <div key={menu.id}>
                      <Reveal>
                        <SectionHeading
                          eyebrow={title}
                          title={copy.title}
                          body={copy.tagline}
                          action={
                            <TextLink href={`/${menu.slug}`}>
                              {t.dashboard.viewAll}
                            </TextLink>
                          }
                        />
                      </Reveal>

                      <div className="mt-6 sm:mt-8">
                        <Carousel
                          prevLabel={t.home.prev}
                          nextLabel={t.home.next}
                          marquee
                          edgeToEdge
                        >
                          <div className={LANDING_CARD_FAMILY.collectionLead}>
                            <CollectionLeadCard
                              href={`/${menu.slug}`}
                              image={copy.image}
                              title={title}
                              body={copy.body}
                              actionLabel={t.home.exploreCollection}
                            />
                          </div>
                          {menuPosts.map((post) => (
                            <div
                              key={post.id}
                              className={LANDING_CARD_FAMILY.collectionItem}
                            >
                              <ProductCard
                                post={post}
                                href={`/${menu.slug}/${post.id}`}
                                locale={locale}
                                feature
                                compactFeature
                              />
                            </div>
                          ))}
                        </Carousel>
                      </div>
                      <div className="mt-5 sm:hidden">
                        <TextLink href={`/${menu.slug}`}>
                          {t.dashboard.viewAll}
                        </TextLink>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>
        )}

        <section className="bg-white py-12 sm:py-20 lg:py-32">
          <div className={container}>
            <Reveal>
              <SectionHeading
                eyebrow={t.home.howItWorksTitle}
                title={t.home.valueTitle}
              />
            </Reveal>
            <div className="mt-7 sm:mt-12">
              <Carousel
                prevLabel={t.home.prev}
                nextLabel={t.home.next}
                edgeToEdge
              >
                {steps.map((step, index) => (
                  <Reveal
                    key={step.title}
                    delay={index * 70}
                    className={LANDING_CARD_FAMILY.process}
                  >
                    <article className="store-card-interactive group relative flex h-full w-full flex-col overflow-hidden rounded-[1.5rem] bg-[#111827] text-white">
                      <Image
                        src={MARKET_IMAGES[index % MARKET_IMAGES.length]}
                        alt=""
                        fill
                        sizes="(max-width: 1024px) 82vw, 30rem"
                        className="object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-b from-black/62 via-black/12 to-black/68" />
                      <div className="relative flex h-full flex-col p-7">
                        <span className="text-xs font-bold tracking-[.14em] text-white/68">
                          {step.n}
                        </span>
                        <h3 className="mt-4 line-clamp-2 max-w-xs text-3xl font-semibold leading-[1.08] tracking-[-.035em]">
                          {step.title}
                        </h3>
                        <p className="mt-3 line-clamp-3 max-w-sm text-sm leading-6 text-white/78 sm:text-base sm:leading-7">
                          {step.body}
                        </p>
                        <div className="mt-auto rounded-2xl border border-white/15 bg-black/22 p-4 backdrop-blur-md">
                          <p className="text-sm font-semibold">
                            {values[index].title}
                          </p>
                          <p className="mt-1.5 text-xs leading-5 text-white/70">
                            {values[index].body}
                          </p>
                        </div>
                      </div>
                    </article>
                  </Reveal>
                ))}
              </Carousel>
            </div>
          </div>
        </section>

        {requestsMenu && requests.length > 0 && (
          <section className="bg-[#f5f5f7] py-12 sm:py-20 lg:py-32">
            <div className={container}>
              <Reveal>
                <SectionHeading
                  eyebrow={t.home.eyebrowRequests}
                  title={t.home.latestRequests}
                  body={t.home.step2Body}
                  action={
                    <TextLink href={`/${requestsMenu.slug}`}>
                      {t.dashboard.viewAll}
                    </TextLink>
                  }
                />
              </Reveal>
              <div className="mt-7 sm:mt-12">
                <Carousel
                  prevLabel={t.home.prev}
                  nextLabel={t.home.next}
                  edgeToEdge
                >
                  <div className={LANDING_CARD_FAMILY.collectionLead}>
                    <CollectionLeadCard
                      href={`/${requestsMenu.slug}`}
                      image="/landing-v2/precision-manufacturing.jpg"
                      title={menuTitle(requestsMenu, locale)}
                      body={t.home.value2Body}
                      actionLabel={t.dashboard.viewAll}
                    />
                  </div>
                  {requests.map((post, index) => (
                    <Reveal
                      key={post.id}
                      delay={index * 55}
                      className={LANDING_CARD_FAMILY.opportunity}
                    >
                      <OpportunityCard
                        post={post}
                        href={`/${requestsMenu.slug}/${post.id}`}
                        locale={locale}
                        labels={{
                          open: t.post.open,
                          closed: t.post.closed,
                          openEnded: t.post.openEnded,
                          deadline: t.post.deadline,
                          sourcingRequest: t.post.sourcingRequest,
                        }}
                      />
                    </Reveal>
                  ))}
                </Carousel>
              </div>
              <div className="mt-7 sm:hidden">
                <TextLink href={`/${requestsMenu.slug}`}>
                  {t.dashboard.viewAll}
                </TextLink>
              </div>
            </div>
          </section>
        )}

        {(featured.length > 0 || (events.length > 0 && eventsMenu)) && (
          <section className="bg-white py-12 sm:py-20 lg:py-32">
            <div className={container}>
              <Reveal>
                <SectionHeading
                  eyebrow={t.home.eyebrowShowcase}
                  title={t.home.featured}
                  body={t.home.promoBody}
                />
              </Reveal>

              {featured.length > 0 && (
                <div className="mt-7 sm:mt-12">
                  <Carousel
                    prevLabel={t.home.prev}
                    nextLabel={t.home.next}
                    marquee
                    edgeToEdge
                  >
                    {featured.slice(0, 6).map((company, index) => {
                      const name =
                        company.profiles?.company_name ??
                        company.profiles?.display_name ??
                        company.slug;
                      const intro =
                        locale === "ko" && company.intro_ko
                          ? company.intro_ko
                          : company.intro_en;
                      return (
                        <Reveal
                          key={company.slug}
                          delay={(index % 3) * 55}
                          className={LANDING_CARD_FAMILY.showcase}
                        >
                          <Link
                            href={`/c/${company.slug}`}
                            className="store-card-interactive group relative flex h-full w-full flex-col overflow-hidden rounded-[1.5rem] bg-[#111827] text-white focus:outline-none"
                          >
                            <Image
                              src={
                                company.cover_image_path
                                  ? postMediaUrl(company.cover_image_path)
                                  : MARKET_IMAGES[index % MARKET_IMAGES.length]
                              }
                              alt={name}
                              fill
                              sizes="(max-width: 734px) 82vw, 400px"
                              className="object-cover"
                            />
                            <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/60 via-black/12 to-black/72" />
                            <div className="relative flex h-full flex-col p-7">
                              <p className="text-xs font-bold uppercase tracking-[.14em] text-white/68">
                                {t.home.eyebrowShowcase}
                              </p>
                              <h3 className="mt-4 line-clamp-2 max-w-xs text-3xl font-semibold leading-[1.08] tracking-[-.035em] text-white">
                                {name}
                              </h3>
                              <div className="mt-auto flex min-h-[4.625rem] items-center rounded-2xl border border-white/20 bg-black/30 p-4 backdrop-blur-md">
                                <p className="line-clamp-2 text-xs leading-5 text-white/80">
                                  {intro}
                                </p>
                              </div>
                            </div>
                          </Link>
                        </Reveal>
                      );
                    })}
                  </Carousel>
                </div>
              )}

              {events.length > 0 && eventsMenu && (
                <div className="mt-20 border-t border-line/80 pt-14 sm:mt-24 sm:pt-16">
                  <Reveal>
                    <SectionHeading
                      eyebrow={t.board.eventsEyebrow}
                      title={t.home.eventsTitle}
                      body={t.board.eventsHint}
                      action={
                        <TextLink href={`/${eventsMenu.slug}`}>
                          {t.dashboard.viewAll}
                        </TextLink>
                      }
                    />
                  </Reveal>
                  <div className="mt-7 sm:mt-10">
                    <Carousel
                      prevLabel={t.home.prev}
                      nextLabel={t.home.next}
                      edgeToEdge
                    >
                      {events.map((post, index) => (
                        <Reveal
                          key={post.id}
                          delay={index * 70}
                          className={LANDING_CARD_FAMILY.calendar}
                        >
                          <EventCard
                            post={post}
                            href={`/${eventsMenu.slug}/${post.id}`}
                            locale={locale}
                            labels={eventCardLabels}
                            priority={index < 2}
                            feature
                          />
                        </Reveal>
                      ))}
                    </Carousel>
                  </div>
                </div>
              )}
            </div>
          </section>
        )}

        {feedItems.length > 0 && (
          <section className="bg-[#f5f5f7] py-12 sm:py-20 lg:py-32">
            <div className={container}>
              <Reveal>
                <SectionHeading
                  eyebrow={t.feed.title}
                  title={t.home.feedTitle}
                  body={t.home.feedBody}
                  action={
                    <TextLink href="/feed">{t.dashboard.viewAll}</TextLink>
                  }
                />
              </Reveal>
              <div className="mt-7 lg:mt-12">
                <Carousel
                  prevLabel={t.home.prev}
                  nextLabel={t.home.next}
                  edgeToEdge
                >
                  {feedItems.map((item) => (
                    <div key={item.id} className={LANDING_CARD_FAMILY.network}>
                      <FeedCard
                        item={item}
                        viewerId={session.userId}
                        returnTo="/"
                        compact
                        className="store-card-interactive flex flex-col"
                        labels={getFeedCardLabels(t, locale)}
                      />
                    </div>
                  ))}
                </Carousel>
              </div>
              <div className="mt-7 sm:hidden">
                <TextLink href="/feed">{t.dashboard.viewAll}</TextLink>
              </div>
            </div>
          </section>
        )}

        {!session.userId && (
          <section className="bg-white py-12 sm:py-20 lg:py-32">
            <div className={container}>
              <Reveal>
                <div className="relative overflow-hidden rounded-[2rem] bg-[#0a58ca] px-6 py-12 text-center text-white shadow-[0_22px_70px_rgba(10,88,202,.24)] sm:px-12 sm:py-20 lg:rounded-[2.5rem] lg:py-24">
                  <div className="absolute -right-24 -top-36 h-96 w-96 rounded-full border-[4rem] border-white/8" />
                  <div className="absolute -bottom-44 -left-20 h-96 w-96 rounded-full border-[4rem] border-white/6" />
                  <div className="relative mx-auto max-w-4xl">
                    <p className="text-sm font-semibold text-white/72">
                      {t.home.eyebrow}
                    </p>
                    <h2 className="mt-4 text-4xl font-semibold leading-[1.04] tracking-[-.045em] sm:text-6xl lg:text-7xl">
                      {t.home.finalCtaTitle}
                    </h2>
                    <p className="mx-auto mt-6 max-w-2xl text-base leading-7 text-white/76 sm:text-lg sm:leading-8">
                      {t.home.finalCtaBody}
                    </p>
                    <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
                      <Link
                        href={`/${firstProductBoard}`}
                        className="inline-flex min-h-12 items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-semibold text-primary transition hover:bg-white/92"
                      >
                        {t.home.browseBoards}
                        <Arrow />
                      </Link>
                      <Link
                        href="/login"
                        className="inline-flex min-h-12 items-center rounded-full border border-white/28 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
                      >
                        {t.common.signIn}
                      </Link>
                    </div>
                  </div>
                </div>
              </Reveal>
            </div>
          </section>
        )}
      </div>
    </>
  );
}

export default function Home() {
  return (
    <Suspense fallback={<LandingPageSkeleton />}>
      <LandingContent />
    </Suspense>
  );
}
