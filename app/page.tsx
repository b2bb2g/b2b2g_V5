import Image from "next/image";
import Link from "next/link";
import { BadgePill } from "@/components/ui/Badge";
import { Reveal } from "@/components/ui/Reveal";
import { Carousel } from "@/components/ui/Carousel";
import { JsonLd } from "@/components/seo/JsonLd";
import { ProductCard } from "@/components/marketplace/ProductCard";
import { getT } from "@/lib/i18n/server";
import { getVisibleMenus, menuTitle } from "@/lib/data/menus";
import { getSession } from "@/lib/data/session";
import { createClient } from "@/lib/supabase/server";
import { getPublicSettings, settingNumber } from "@/lib/data/settings";
import { postMediaUrl, repThumbnail } from "@/lib/media";
import { stripRichText } from "@/lib/richtext";
import { BOARD_TYPES, SETTING_KEYS } from "@/lib/constants";
import type { Menu, PostTeaser } from "@/lib/types";
import { listFeed } from "@/lib/data/feed";
import { FeedCard } from "@/components/feed/FeedCard";
import { getFeedCardLabels } from "@/lib/i18n/feed";

async function getStorefront(
  eventsMenuId: string | null,
  featuredSlots: number,
) {
  const supabase = await createClient();
  const [products, requests, events, featured, companies] = await Promise.all([
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
    supabase
      .from("profiles")
      .select(
        "uid, display_name, company_name, avatar_url, created_at, member_badges(badge_types(code, name_en, name_ko))",
      )
      .not("company_name", "is", null)
      .order("created_at", { ascending: false })
      .limit(6),
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
    companies: (companies.data ?? []) as unknown as {
      uid: number;
      display_name: string | null;
      company_name: string | null;
      avatar_url: string | null;
      created_at: string;
      member_badges: {
        badge_types: { code: string; name_en: string; name_ko: string } | null;
      }[];
    }[],
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
    >
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  );
}

export default async function Home() {
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
  const [storefront, feedItems] = await Promise.all([
    getStorefront(
      eventsMenu?.id ?? null,
      settingNumber(settings, SETTING_KEYS.FEATURED_SLOTS, 6),
    ),
    listFeed({ limit: 3 }),
  ]);
  const { products, requests, events, featured, companies } = storefront;
  const menuSlugById = new Map<string, string>(
    menus.map((menu: Menu) => [menu.id, menu.slug]),
  );
  const container = "mx-auto w-full max-w-7xl px-5 sm:px-8";
  const values = [
    { title: t.home.value1Title, body: t.home.value1Body, icon: "01" },
    { title: t.home.value2Title, body: t.home.value2Body, icon: "02" },
    { title: t.home.value3Title, body: t.home.value3Body, icon: "03" },
  ];

  return (
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

      <section className="relative min-h-[760px] overflow-hidden bg-[#0d151e] text-white">
        <Image
          src="/landing-v2/hero-global-collaboration.jpg"
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover object-center"
        />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(9,15,22,.98)_0%,rgba(9,15,22,.84)_35%,rgba(9,15,22,.2)_76%,rgba(9,15,22,.25)_100%)]" />
        <div className="absolute inset-x-0 top-0 z-20 border-b border-white/10 bg-[#0d151e]/45 backdrop-blur-xl">
          <div className={`${container} flex h-20 items-center gap-8`}>
            <Link href="/" className="flex items-center gap-2.5">
              <span className="text-base font-extrabold">
                {t.common.siteName}
              </span>
            </Link>
            <nav
              className="hidden flex-1 items-center justify-center gap-1 lg:flex"
              aria-label={t.home.boardsTitle}
            >
              {menus.slice(0, 5).map((menu) => (
                <Link
                  key={menu.id}
                  href={`/${menu.slug}`}
                  className="rounded-full px-4 py-2 text-sm font-semibold text-white/65 transition hover:bg-white/10 hover:text-white"
                >
                  {menuTitle(menu, locale)}
                </Link>
              ))}
            </nav>
            <div className="ml-auto flex items-center gap-2">
              <Link
                href="/search"
                aria-label={t.common.search}
                className="rounded-full p-2.5 text-white/70 transition hover:bg-white/10 hover:text-white"
              >
                <svg
                  className="h-5 w-5"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <circle cx="11" cy="11" r="8" />
                  <path d="m21 21-4.3-4.3" />
                </svg>
              </Link>
              {session.userId ? (
                <Link
                  href="/dashboard"
                  className="rounded-full bg-white px-5 py-2.5 text-sm font-bold text-ink"
                >
                  {t.common.dashboard}
                </Link>
              ) : (
                <>
                  <Link
                    href="/login"
                    className="hidden px-3 py-2 text-sm font-semibold text-white/70 sm:block"
                  >
                    {t.common.signIn}
                  </Link>
                  <Link
                    href="/signup"
                    className="rounded-full bg-white px-5 py-2.5 text-sm font-bold text-ink"
                  >
                    {t.common.signUp}
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
        <div
          className={`${container} relative flex min-h-[760px] items-center pb-20 pt-32`}
        >
          <div className="animate-fade-up max-w-2xl">
            <p className="text-xs font-bold uppercase tracking-[.22em] text-[#6ea8ff]">
              {t.home.eyebrow}
            </p>
            <h1 className="mt-5 text-[2.9rem] font-extrabold leading-[1.04] tracking-[-.05em] sm:text-6xl lg:text-[4.8rem]">
              {t.home.heroTitle}
            </h1>
            <p className="mt-6 max-w-xl text-base leading-7 text-white/68 sm:text-lg">
              {t.home.heroSubtitle}
            </p>
            <form
              action="/search"
              className="mt-9 flex max-w-xl items-center rounded-2xl border border-white/12 bg-white p-2 shadow-2xl"
            >
              <svg
                className="ml-3 h-5 w-5 shrink-0 text-ink-faint"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.3-4.3" />
              </svg>
              <input
                name="q"
                type="search"
                aria-label={t.home.searchPlaceholder}
                placeholder={t.home.searchPlaceholder}
                className="min-w-0 flex-1 bg-transparent px-3 py-2.5 text-sm text-ink outline-none placeholder:text-ink-faint"
              />
              <button className="btn-primary btn-md shrink-0" type="submit">
                {t.home.searchAction}
              </button>
            </form>
            <div className="mt-8 flex flex-wrap gap-x-6 gap-y-3">
              {[t.home.stat1, t.home.stat2, t.home.stat3].map((item) => (
                <span
                  key={item}
                  className="flex items-center gap-2 text-xs font-semibold text-white/58"
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-[#6ea8ff]" />
                  {item}
                </span>
              ))}
            </div>
          </div>
        </div>
        <div className="absolute bottom-7 left-1/2 hidden -translate-x-1/2 items-center gap-2 text-[10px] font-bold uppercase tracking-[.18em] text-white/40 sm:flex">
          <span className="h-8 w-px animate-pulse bg-white/30" />
          Scroll to explore
        </div>
      </section>

      <section className="relative z-10 -mt-10">
        <div className={`${container} grid gap-3 md:grid-cols-2`}>
          <Link
            href={`/${firstProductBoard}`}
            className="group flex items-center gap-4 rounded-2xl border border-line bg-white p-5 shadow-[0_18px_55px_rgba(25,31,40,.11)] transition hover:-translate-y-1 hover:border-primary/35"
          >
            <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-soft text-primary">
              <svg
                className="h-6 w-6"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M3 7h18M5 7l1 13h12l1-13M9 11v5M15 11v5M8 7l1-3h6l1 3" />
              </svg>
            </span>
            <span className="min-w-0 flex-1">
              <strong className="block text-base">{t.home.buyerPath}</strong>
              <span className="mt-1 block text-sm text-ink-soft">
                {t.home.buyerPathBody}
              </span>
            </span>
            <span className="text-primary transition-transform group-hover:translate-x-1">
              <Arrow />
            </span>
          </Link>
          <Link
            href={session.userId ? "/write/select" : "/signup"}
            className="group flex items-center gap-4 rounded-2xl border border-line bg-white p-5 shadow-[0_18px_55px_rgba(25,31,40,.11)] transition hover:-translate-y-1 hover:border-primary/35"
          >
            <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-navy-soft text-navy">
              <svg
                className="h-6 w-6"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M4 20V10l8-6 8 6v10M9 20v-6h6v6" />
              </svg>
            </span>
            <span className="min-w-0 flex-1">
              <strong className="block text-base">{t.home.supplierPath}</strong>
              <span className="mt-1 block text-sm text-ink-soft">
                {t.home.supplierPathBody}
              </span>
            </span>
            <span className="text-primary transition-transform group-hover:translate-x-1">
              <Arrow />
            </span>
          </Link>
        </div>
      </section>

      <section className={`${container} py-24`}>
        <Reveal>
          <div className="max-w-2xl">
            <p className="text-xs font-bold uppercase tracking-[.18em] text-primary">
              Curated for global growth
            </p>
            <h2 className="mt-3 text-3xl font-extrabold tracking-[-.04em] sm:text-5xl">
              {t.home.valueTitle}
            </h2>
            <p className="mt-4 text-sm leading-7 text-ink-soft">
              {t.home.heroSubtitle}
            </p>
          </div>
        </Reveal>
        <div className="mt-10">
          <Carousel prevLabel={t.home.prev} nextLabel={t.home.next}>
            <Link
              href={`/${firstProductBoard}`}
              className="group relative h-[28rem] w-[86vw] max-w-3xl shrink-0 snap-start overflow-hidden rounded-[2rem] bg-ink sm:h-[32rem] sm:w-[68vw]"
            >
              <Image
                src="/landing-v2/precision-manufacturing.jpg"
                alt=""
                fill
                sizes="(max-width:640px) 86vw, 68vw"
                className="object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/5 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-7 text-white sm:p-10">
                <span className="text-xs font-bold uppercase tracking-[.18em] text-[#82b5ff]">
                  Precision & industrial
                </span>
                <h3 className="mt-3 text-2xl font-extrabold sm:text-4xl">
                  {t.home.buyerPath}
                </h3>
                <p className="mt-2 max-w-lg text-sm leading-6 text-white/65">
                  {t.home.buyerPathBody}
                </p>
                <span className="mt-6 inline-flex h-11 w-11 items-center justify-center rounded-full bg-white text-ink transition-transform group-hover:translate-x-1">
                  <Arrow />
                </span>
              </div>
            </Link>
            <Link
              href={session.userId ? "/write/select" : "/signup"}
              className="group relative h-[28rem] w-[86vw] max-w-3xl shrink-0 snap-start overflow-hidden rounded-[2rem] bg-ink sm:h-[32rem] sm:w-[68vw]"
            >
              <Image
                src="/landing-v2/consumer-export-brand.jpg"
                alt=""
                fill
                sizes="(max-width:640px) 86vw, 68vw"
                className="object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/5 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-7 text-white sm:p-10">
                <span className="text-xs font-bold uppercase tracking-[.18em] text-[#82b5ff]">
                  Consumer & lifestyle
                </span>
                <h3 className="mt-3 text-2xl font-extrabold sm:text-4xl">
                  {t.home.supplierPath}
                </h3>
                <p className="mt-2 max-w-lg text-sm leading-6 text-white/65">
                  {t.home.supplierPathBody}
                </p>
                <span className="mt-6 inline-flex h-11 w-11 items-center justify-center rounded-full bg-white text-ink transition-transform group-hover:translate-x-1">
                  <Arrow />
                </span>
              </div>
            </Link>
          </Carousel>
        </div>
      </section>

      <section className={`${container} py-24`}>
        <Reveal>
          <div className="grid gap-6 lg:grid-cols-[.7fr_1.3fr] lg:items-end">
            <div>
              <p className="text-xs font-bold uppercase tracking-[.18em] text-primary">
                {t.home.proofLabel}
              </p>
              <h2 className="mt-3 text-3xl font-extrabold tracking-[-.035em] sm:text-4xl">
                {t.home.boardsTitle}
              </h2>
            </div>
            <p className="max-w-xl text-sm leading-7 text-ink-soft lg:justify-self-end">
              {t.home.step1Body}
            </p>
          </div>
        </Reveal>
        <nav
          className="mt-10 grid auto-rows-[9rem] grid-cols-2 gap-3 lg:auto-rows-[10rem] lg:grid-cols-4"
          aria-label={t.home.boardsTitle}
        >
          {menus.slice(0, 6).map((menu, index) => (
            <Reveal
              key={menu.id}
              delay={index * 45}
              className={
                index === 0
                  ? "lg:col-span-2 lg:row-span-2"
                  : index === 1
                    ? "lg:col-span-2"
                    : ""
              }
            >
              <Link
                href={`/${menu.slug}`}
                className={`group relative flex h-full overflow-hidden rounded-[1.5rem] p-5 transition duration-300 hover:-translate-y-1 hover:shadow-(--shadow-float) ${index === 0 ? "bg-[#111a24] text-white" : index === 1 ? "bg-primary text-white" : "border border-line bg-surface-sub/70"}`}
              >
                <span
                  className={`absolute -right-8 -top-10 h-32 w-32 rounded-full border-[24px] transition-transform duration-500 group-hover:scale-125 ${index < 2 ? "border-white/8" : "border-primary/5"}`}
                />
                <span className="relative flex w-full flex-col justify-between">
                  <span
                    className={`text-xs font-extrabold ${index < 2 ? "text-white/55" : "text-primary"}`}
                  >
                    0{index + 1}
                  </span>
                  <span className="flex items-end justify-between gap-3">
                    <strong
                      className={`${index === 0 ? "max-w-xs text-2xl sm:text-3xl" : "text-sm"} leading-tight`}
                    >
                      {menuTitle(menu, locale)}
                    </strong>
                    <span
                      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-transform group-hover:translate-x-1 ${index < 2 ? "bg-white/12 text-white" : "bg-white text-primary shadow-sm"}`}
                    >
                      <Arrow />
                    </span>
                  </span>
                </span>
              </Link>
            </Reveal>
          ))}
        </nav>
      </section>

      {products.length > 0 && (
        <section className="bg-[#f6f8fa]">
          <div className={`${container} py-24`}>
            <Reveal>
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[.18em] text-primary">
                    Marketplace
                  </p>
                  <h2 className="mt-3 text-3xl font-extrabold tracking-tight">
                    {t.home.newProducts}
                  </h2>
                </div>
                <Link
                  href={`/${firstProductBoard}`}
                  className="flex items-center gap-2 text-sm font-bold text-primary"
                >
                  {t.dashboard.viewAll}
                  <Arrow />
                </Link>
              </div>
            </Reveal>
            <div className="mt-10">
              <Carousel prevLabel={t.home.prev} nextLabel={t.home.next}>
                {products.map((post, index) => (
                  <div
                    key={post.id}
                    className="w-[72vw] max-w-72 shrink-0 snap-start sm:w-64 lg:w-72"
                  >
                    <ProductCard
                      post={post}
                      href={`/${menuSlugById.get(post.menu_id) ?? firstProductBoard}/${post.id}`}
                      locale={locale}
                      priority={index < 3}
                    />
                  </div>
                ))}
              </Carousel>
            </div>
          </div>
        </section>
      )}

      {(featured.length > 0 || events.length > 0) && (
        <section className={`${container} py-24`}>
          <div className="grid gap-12 lg:grid-cols-2">
            {featured.length > 0 && (
              <div>
                <Reveal>
                  <p className="text-xs font-bold uppercase tracking-[.18em] text-primary">
                    Company showcase
                  </p>
                  <h2 className="mt-3 text-3xl font-extrabold tracking-tight">
                    {t.home.featured}
                  </h2>
                </Reveal>
                <div className="mt-8 space-y-4">
                  {featured.slice(0, 3).map((company, i) => {
                    const name =
                      company.profiles?.company_name ??
                      company.profiles?.display_name ??
                      company.slug;
                    const intro =
                      locale === "ko" && company.intro_ko
                        ? company.intro_ko
                        : company.intro_en;
                    return (
                      <Reveal key={company.slug} delay={i * 60}>
                        <Link
                          href={`/c/${company.slug}`}
                          className="group flex gap-4 rounded-2xl border border-line p-3 transition hover:border-primary/40 hover:shadow-(--shadow-card)"
                        >
                          <div className="relative h-24 w-28 shrink-0 overflow-hidden rounded-xl bg-surface-sub">
                            {company.cover_image_path && (
                              <Image
                                src={postMediaUrl(company.cover_image_path)}
                                alt={name}
                                fill
                                sizes="112px"
                                className="object-cover transition-transform group-hover:scale-105"
                              />
                            )}
                          </div>
                          <div className="min-w-0 py-2">
                            <p className="truncate text-base font-extrabold">
                              {name}
                            </p>
                            <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-ink-soft">
                              {intro}
                            </p>
                          </div>
                        </Link>
                      </Reveal>
                    );
                  })}
                </div>
              </div>
            )}
            {events.length > 0 && eventsMenu && (
              <div>
                <Reveal>
                  <p className="text-xs font-bold uppercase tracking-[.18em] text-primary">
                    Business calendar
                  </p>
                  <h2 className="mt-3 text-3xl font-extrabold tracking-tight">
                    {t.home.eventsTitle}
                  </h2>
                </Reveal>
                <div className="mt-8 grid gap-4 sm:grid-cols-2">
                  {events.map((post, i) => {
                    const title =
                      locale === "ko" && post.title_ko
                        ? post.title_ko
                        : post.title_en;
                    const thumb = repThumbnail(post);
                    return (
                      <Reveal key={post.id} delay={i * 70}>
                        <Link
                          href={`/${eventsMenu.slug}/${post.id}`}
                          className="card-hover group block overflow-hidden"
                        >
                          <div className="relative aspect-[4/3] bg-surface-sub">
                            {thumb && (
                              <Image
                                src={thumb}
                                alt={title}
                                fill
                                sizes="(max-width:640px) 100vw, 25vw"
                                className="object-cover transition-transform duration-500 group-hover:scale-105"
                              />
                            )}
                          </div>
                          <div className="p-4">
                            <p className="line-clamp-2 text-sm font-extrabold">
                              {title}
                            </p>
                            <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-ink-soft">
                              {stripRichText(
                                locale === "ko" && post.body_teaser_ko
                                  ? post.body_teaser_ko
                                  : post.body_teaser_en,
                              )}
                            </p>
                          </div>
                        </Link>
                      </Reveal>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      {feedItems.length > 0 && (
        <section className="bg-[#f4f7fb] py-24">
          <div className={container}>
            <div className="flex items-end justify-between gap-5">
              <Reveal>
                <p className="text-xs font-bold uppercase tracking-[.18em] text-primary">
                  {t.feed.title}
                </p>
                <h2 className="mt-3 text-3xl font-extrabold tracking-tight">
                  {t.home.feedTitle}
                </h2>
                <p className="mt-3 max-w-xl text-sm leading-7 text-ink-soft">
                  {t.home.feedBody}
                </p>
              </Reveal>
              <Link href="/feed" className="btn-secondary btn-md shrink-0">
                {t.dashboard.viewAll} →
              </Link>
            </div>
            <div className="mt-8 grid gap-4 lg:grid-cols-3">
              {feedItems.map((item) => (
                <FeedCard
                  key={item.id}
                  item={item}
                  viewerId={session.userId}
                  returnTo="/"
                  compact
                  labels={getFeedCardLabels(t, locale)}
                />
              ))}
            </div>
          </div>
        </section>
      )}

      {requestsMenu && requests.length > 0 && (
        <section className="bg-[#111a24] text-white">
          <div
            className={`${container} grid gap-12 py-24 lg:grid-cols-[.7fr_1.3fr]`}
          >
            <Reveal>
              <div>
                <p className="text-xs font-bold uppercase tracking-[.18em] text-[#6ea8ff]">
                  Live opportunities
                </p>
                <h2 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl">
                  {t.home.latestRequests}
                </h2>
                <p className="mt-4 max-w-sm text-sm leading-7 text-white/55">
                  {t.home.step2Body}
                </p>
                <Link
                  href={`/${requestsMenu.slug}`}
                  className="mt-7 inline-flex items-center gap-2 text-sm font-bold text-[#79adff]"
                >
                  {t.dashboard.viewAll}
                  <Arrow />
                </Link>
              </div>
            </Reveal>
            <div className="grid gap-3 sm:grid-cols-2">
              {requests.map((post, i) => (
                <Reveal key={post.id} delay={(i % 2) * 60}>
                  <Link
                    href={`/${requestsMenu.slug}/${post.id}`}
                    className="block h-full rounded-2xl border border-white/10 bg-white/6 p-5 transition hover:-translate-y-1 hover:bg-white/10"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <p className="line-clamp-2 text-sm font-extrabold">
                        {locale === "ko" && post.title_ko
                          ? post.title_ko
                          : post.title_en}
                      </p>
                      <span className="shrink-0 rounded-full bg-[#1b64da]/25 px-2.5 py-1 text-[10px] font-bold text-[#86b5ff]">
                        OPEN
                      </span>
                    </div>
                    <p className="mt-3 line-clamp-2 text-xs leading-relaxed text-white/52">
                      {stripRichText(
                        locale === "ko" && post.body_teaser_ko
                          ? post.body_teaser_ko
                          : post.body_teaser_en,
                      )}
                    </p>
                  </Link>
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="bg-[#f3f6fa]">
        <div
          className={`${container} grid gap-14 py-24 lg:grid-cols-[.8fr_1.2fr] lg:items-start`}
        >
          <Reveal>
            <div className="lg:sticky lg:top-28">
              <p className="text-xs font-bold uppercase tracking-[.18em] text-primary">
                Trust infrastructure
              </p>
              <h2 className="mt-3 max-w-md text-3xl font-extrabold tracking-[-.04em] sm:text-5xl">
                {t.home.valueTitle}
              </h2>
              <p className="mt-5 max-w-md text-sm leading-7 text-ink-soft">
                {t.home.step3Body}
              </p>
              <Link
                href="/membership"
                className="mt-7 inline-flex items-center gap-2 text-sm font-bold text-primary"
              >
                {t.home.promoCta}
                <Arrow />
              </Link>
            </div>
          </Reveal>
          <div className="relative space-y-3 before:absolute before:bottom-10 before:left-[1.65rem] before:top-10 before:w-px before:bg-primary/15">
            {values.map((value, i) => (
              <Reveal key={value.title} delay={i * 70}>
                <div className="group relative flex gap-5 rounded-[1.5rem] border border-white bg-white p-5 shadow-[0_8px_30px_rgba(25,31,40,.04)] transition hover:-translate-y-1 hover:shadow-(--shadow-float) sm:p-7">
                  <span className="relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-extrabold text-white ring-8 ring-[#f3f6fa]">
                    {value.icon}
                  </span>
                  <div>
                    <h3 className="text-lg font-extrabold">{value.title}</h3>
                    <p className="mt-2 text-sm leading-7 text-ink-soft">
                      {value.body}
                    </p>
                    <div className="mt-5 h-1 w-10 rounded-full bg-primary/20 transition-all group-hover:w-20 group-hover:bg-primary" />
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
        {companies.length > 0 && (
          <div className={`${container} border-t border-line pb-24 pt-10`}>
            <p className="text-center text-xs font-bold uppercase tracking-[.16em] text-ink-faint">
              {t.home.newCompanies}
            </p>
            <div className="mt-7 flex flex-wrap justify-center gap-3">
              {companies.map((company) => {
                const name = `UID:${company.uid}`;
                const badge = company.member_badges
                  .map((item) => item.badge_types)
                  .find(Boolean);
                return (
                  <Link
                    key={company.uid}
                    href={`/u/${company.uid}`}
                    className="flex items-center gap-3 rounded-full border border-line bg-white py-2 pl-2 pr-4 transition hover:border-primary/40 hover:shadow-(--shadow-card)"
                  >
                    {company.avatar_url ? (
                      <Image
                        src={postMediaUrl(company.avatar_url)}
                        alt={name}
                        width={36}
                        height={36}
                        className="h-9 w-9 rounded-full object-cover"
                      />
                    ) : (
                      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-soft text-sm font-extrabold text-primary">
                        {name.slice(0, 1)}
                      </span>
                    )}
                    <span className="max-w-40 truncate text-sm font-bold">
                      {name}
                    </span>
                    {badge && (
                      <BadgePill
                        code={badge.code}
                        label={locale === "ko" ? badge.name_ko : badge.name_en}
                      />
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </section>

      <section className={`${container} pb-24`}>
        <Reveal>
          <div className="relative overflow-hidden rounded-[2rem] bg-[#101923] text-white shadow-[0_30px_90px_rgba(16,25,35,.2)]">
            <div className="absolute -right-24 -top-32 h-96 w-96 rounded-full bg-primary/35 blur-3xl" />
            <div className="grid lg:grid-cols-[1.15fr_.85fr]">
              <div className="relative px-7 py-12 sm:px-12 sm:py-16 lg:px-16 lg:py-20">
                <p className="text-xs font-bold uppercase tracking-[.18em] text-[#79adff]">
                  Your next opportunity
                </p>
                <h2 className="mt-4 max-w-xl text-3xl font-extrabold leading-tight tracking-[-.04em] sm:text-5xl">
                  {session.userId ? t.home.promoTitle : t.home.finalCtaTitle}
                </h2>
                <p className="mt-5 max-w-xl text-sm leading-7 text-white/65">
                  {session.userId ? t.home.promoBody : t.home.finalCtaBody}
                </p>
                <div className="relative mt-8 flex flex-col gap-3 sm:flex-row">
                  <Link
                    href={session.userId ? "/membership" : "/signup"}
                    className="btn btn-lg rounded-full bg-white px-7 text-ink hover:bg-white/90"
                  >
                    {session.userId ? t.home.promoCta : t.common.signUp}
                    <Arrow />
                  </Link>
                  {!session.userId && (
                    <Link
                      href="/login"
                      className="btn btn-lg rounded-full border border-white/20 px-7 text-white hover:bg-white/10"
                    >
                      {t.common.signIn}
                    </Link>
                  )}
                </div>
              </div>
              <div className="relative m-4 min-h-72 overflow-hidden rounded-[1.5rem] border border-white/10 bg-white/6 p-6 lg:m-5 lg:p-8">
                <div className="absolute inset-0 [background:radial-gradient(circle_at_80%_15%,rgba(49,130,246,.35),transparent_35%)]" />
                <div className="relative flex h-full flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-[.16em] text-white/45">
                      B2B opportunity flow
                    </span>
                    <span className="h-2 w-2 animate-pulse rounded-full bg-[#72e3b2]" />
                  </div>
                  <div className="space-y-3">
                    {[
                      t.home.step1Title,
                      t.home.step2Title,
                      t.home.step3Title,
                    ].map((step, index) => (
                      <div
                        key={step}
                        className="flex items-center gap-3 rounded-xl border border-white/8 bg-white/7 p-3 backdrop-blur"
                      >
                        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/10 text-[10px] font-extrabold text-[#8ab9ff]">
                          0{index + 1}
                        </span>
                        <span className="text-sm font-bold">{step}</span>
                        {index < 2 && (
                          <span className="ml-auto text-white/25">↓</span>
                        )}
                      </div>
                    ))}
                  </div>
                  <p className="text-xs leading-5 text-white/40">
                    {t.home.proofLabel}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </Reveal>
      </section>

      <footer className="bg-[#0d151e] text-white">
        <div className={`${container} py-14 sm:py-20`}>
          <div className="grid gap-12 border-b border-white/10 pb-14 lg:grid-cols-[1.5fr_1fr_1fr]">
            <div>
              <Link href="/" className="flex items-center gap-3">
                <span className="text-lg font-extrabold">
                  {t.common.siteName}
                </span>
              </Link>
              <p className="mt-5 max-w-sm text-sm leading-7 text-white/60">
                {t.footer.tagline}
              </p>
              <Link
                href={session.userId ? "/dashboard" : "/signup"}
                className="mt-7 inline-flex items-center gap-2 text-sm font-bold text-[#76abff]"
              >
                {session.userId ? t.common.dashboard : t.home.startNow}
                <Arrow />
              </Link>
            </div>
            <nav aria-label={t.footer.marketplace}>
              <p className="text-xs font-bold uppercase tracking-[.16em] text-white/60">
                {t.footer.marketplace}
              </p>
              <ul className="mt-5 space-y-3">
                {menus.slice(0, 5).map((menu) => (
                  <li key={menu.id}>
                    <Link
                      href={`/${menu.slug}`}
                      className="text-sm text-white/62 transition hover:text-white"
                    >
                      {menuTitle(menu, locale)}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
            <nav aria-label={t.footer.legal}>
              <p className="text-xs font-bold uppercase tracking-[.16em] text-white/60">
                {t.footer.legal}
              </p>
              <ul className="mt-5 space-y-3">
                <li>
                  <Link
                    href="/membership"
                    className="text-sm text-white/62 hover:text-white"
                  >
                    {t.home.promoCta}
                  </Link>
                </li>
                <li>
                  <Link
                    href="/legal/terms"
                    className="text-sm text-white/62 hover:text-white"
                  >
                    {t.footer.terms}
                  </Link>
                </li>
                <li>
                  <Link
                    href="/legal/privacy"
                    className="text-sm text-white/62 hover:text-white"
                  >
                    {t.footer.privacy}
                  </Link>
                </li>
                <li>
                  <Link
                    href="/legal/cookies"
                    className="text-sm text-white/62 hover:text-white"
                  >
                    {t.footer.cookies}
                  </Link>
                </li>
              </ul>
            </nav>
          </div>
          <div className="flex flex-col gap-3 pt-7 text-xs text-white/55 sm:flex-row sm:items-center sm:justify-between">
            <p>{t.footer.copyright}</p>
            <p>Built for trusted global business</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
