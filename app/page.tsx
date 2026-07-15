import Image from "next/image";
import Link from "next/link";
import { Header } from "@/components/layout/Header";
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

  return (
    <>
      {/* RouteChrome hides the layout header on "/"; render the shared header
          here in its overlay tone. Must stay outside the overflow-hidden page
          root or position:sticky stops working. */}
      <Header variant="overlay" />
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

        {/* ── Hero ─────────────────────────────────────────────── */}
        <section className="relative overflow-hidden bg-[#0b1220] text-white">
          <Image
            src="/landing-v2/hero-global-collaboration.jpg"
            alt=""
            fill
            priority
            sizes="100vw"
            className="object-cover object-center"
          />
          <div className="absolute inset-0 bg-[linear-gradient(104deg,rgba(8,13,20,.97)_0%,rgba(8,13,20,.9)_36%,rgba(8,13,20,.45)_72%,rgba(8,13,20,.6)_100%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_78%_18%,rgba(49,110,246,.28),transparent_46%)]" />
          <div
            className={`${container} relative flex min-h-[42rem] flex-col justify-center pb-24 pt-32 sm:min-h-[46rem] lg:min-h-[48rem]`}
          >
            <div className="animate-fade-up max-w-3xl">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/8 px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-[.16em] text-white/80 backdrop-blur">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#6ea8ff] opacity-70" />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-[#6ea8ff]" />
                </span>
                {t.home.eyebrow}
              </span>
              <h1 className="mt-6 text-[2.7rem] font-extrabold leading-[1.03] tracking-[-.05em] sm:text-6xl lg:text-[4.6rem]">
                {t.home.heroTitle}
              </h1>
              <p className="mt-6 max-w-xl text-base leading-7 text-white/70 sm:text-lg">
                {t.home.heroSubtitle}
              </p>
              <form
                action="/search"
                className="mt-9 flex max-w-xl items-center rounded-2xl border border-white/10 bg-white p-2 shadow-[0_20px_60px_rgba(0,0,0,.35)]"
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
              <div className="mt-5 flex flex-wrap gap-2">
                {menus.slice(0, 6).map((menu) => (
                  <Link
                    key={menu.id}
                    href={`/${menu.slug}`}
                    className="rounded-full border border-white/15 bg-white/6 px-3.5 py-1.5 text-xs font-semibold text-white/75 backdrop-blur transition hover:border-white/40 hover:bg-white/12 hover:text-white"
                  >
                    {menuTitle(menu, locale)}
                  </Link>
                ))}
              </div>
              <div className="mt-9 flex flex-wrap gap-x-7 gap-y-3">
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
        </section>

        {/* ── New arrivals ─────────────────────────────────────── */}
        {products.length > 0 && (
          <section className="bg-[#f6f8fa]">
            <div className={`${container} py-20 sm:py-24`}>
              <Reveal>
                <div className="flex items-end justify-between gap-4">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[.18em] text-primary">
                      {t.footer.marketplace}
                    </p>
                    <h2 className="mt-3 text-3xl font-extrabold tracking-[-.035em] sm:text-4xl">
                      {t.home.newProducts}
                    </h2>
                  </div>
                  <Link
                    href={`/${firstProductBoard}`}
                    className="flex shrink-0 items-center gap-2 text-sm font-bold text-primary"
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

        {/* ── How it works + trust values ──────────────────────── */}
        <section className={`${container} py-20 sm:py-24`}>
          <Reveal>
            <div className="max-w-2xl">
              <p className="text-xs font-bold uppercase tracking-[.18em] text-primary">
                {t.home.howItWorksTitle}
              </p>
              <h2 className="mt-3 text-3xl font-extrabold tracking-[-.04em] sm:text-5xl">
                {t.home.valueTitle}
              </h2>
              <p className="mt-4 text-sm leading-7 text-ink-soft">
                {t.home.heroSubtitle}
              </p>
            </div>
          </Reveal>
          <div className="mt-12 grid gap-4 md:grid-cols-3">
            {steps.map((step, i) => (
              <Reveal key={step.title} delay={i * 70}>
                <div className="group h-full rounded-[1.5rem] border border-line/80 bg-white p-7 shadow-(--shadow-card) transition hover:-translate-y-1 hover:shadow-(--shadow-float)">
                  <div className="flex items-center gap-3">
                    <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary text-sm font-extrabold text-white">
                      {step.n}
                    </span>
                    {i < steps.length - 1 && (
                      <span className="h-px flex-1 bg-gradient-to-r from-primary/40 to-transparent" />
                    )}
                  </div>
                  <h3 className="mt-6 text-lg font-extrabold">{step.title}</h3>
                  <p className="mt-2 text-sm leading-7 text-ink-soft">
                    {step.body}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>
          <div className="mt-4 grid gap-4 rounded-[1.5rem] border border-line/70 bg-surface-sub/50 p-5 sm:grid-cols-3 sm:p-7">
            {values.map((value, i) => (
              <Reveal key={value.title} delay={i * 60}>
                <div className="flex gap-3">
                  <span
                    aria-hidden="true"
                    className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-positive-soft text-[11px] font-black text-positive"
                  >
                    ✓
                  </span>
                  <div>
                    <h3 className="text-sm font-extrabold">{value.title}</h3>
                    <p className="mt-1 text-xs leading-6 text-ink-soft">
                      {value.body}
                    </p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </section>

        {/* ── Featured companies + Events ──────────────────────── */}
        {(featured.length > 0 || events.length > 0) && (
          <section className="bg-[#f6f8fa]">
            <div className={`${container} grid gap-12 py-20 sm:py-24 lg:grid-cols-2`}>
              {featured.length > 0 && (
                <div>
                  <Reveal>
                    <p className="text-xs font-bold uppercase tracking-[.18em] text-primary">
                      {t.home.eyebrowShowcase}
                    </p>
                    <h2 className="mt-3 text-2xl font-extrabold tracking-tight sm:text-3xl">
                      {t.home.featured}
                    </h2>
                  </Reveal>
                  <div className="mt-8 space-y-3">
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
                            className="group flex gap-4 rounded-2xl border border-line/80 bg-white p-3 transition hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-(--shadow-card)"
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
                              <p className="truncate text-base font-extrabold group-hover:text-primary">
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
                    <div className="flex items-end justify-between gap-4">
                      <div>
                        <p className="text-xs font-bold uppercase tracking-[.18em] text-primary">
                          {t.board.eventsEyebrow}
                        </p>
                        <h2 className="mt-3 text-2xl font-extrabold tracking-tight sm:text-3xl">
                          {t.home.eventsTitle}
                        </h2>
                      </div>
                      <Link
                        href={`/${eventsMenu.slug}`}
                        className="flex shrink-0 items-center gap-2 text-sm font-bold text-primary"
                      >
                        {t.dashboard.viewAll}
                        <Arrow />
                      </Link>
                    </div>
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
                              <p className="line-clamp-2 text-sm font-extrabold group-hover:text-primary">
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

        {/* ── B2BB2G Network (kept as-is) ──────────────────────── */}
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

        {/* ── Live sourcing requests ───────────────────────────── */}
        {requestsMenu && requests.length > 0 && (
          <section className="bg-[#0b1220] text-white">
            <div
              className={`${container} grid gap-12 py-20 sm:py-24 lg:grid-cols-[.7fr_1.3fr]`}
            >
              <Reveal>
                <div>
                  <p className="text-xs font-bold uppercase tracking-[.18em] text-[#6ea8ff]">
                    {t.home.eyebrowRequests}
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
                          {t.post.open}
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

        {/* ── Closing: trusted companies + CTA ─────────────────── */}
        <section className={`${container} py-20 sm:py-24`}>
          {companies.length > 0 && (
            <Reveal>
              <div className="mb-12">
                <p className="text-center text-xs font-bold uppercase tracking-[.16em] text-ink-faint">
                  {t.home.newCompanies}
                </p>
                <div className="mt-6 flex flex-wrap justify-center gap-3">
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
                            label={
                              locale === "ko" ? badge.name_ko : badge.name_en
                            }
                          />
                        )}
                      </Link>
                    );
                  })}
                </div>
              </div>
            </Reveal>
          )}
          <Reveal>
            <div className="relative overflow-hidden rounded-[2rem] bg-[#101923] text-white shadow-[0_30px_90px_rgba(16,25,35,.2)]">
              <div className="absolute -right-24 -top-32 h-96 w-96 rounded-full bg-primary/35 blur-3xl" />
              <div className="grid lg:grid-cols-[1.15fr_.85fr]">
                <div className="relative px-7 py-12 sm:px-12 sm:py-16 lg:px-16 lg:py-20">
                  <p className="text-xs font-bold uppercase tracking-[.18em] text-[#79adff]">
                    {t.home.eyebrow}
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
                        {t.home.howItWorksTitle}
                      </span>
                      <span className="h-2 w-2 animate-pulse rounded-full bg-[#72e3b2]" />
                    </div>
                    <div className="space-y-3">
                      {steps.map((step, index) => (
                        <div
                          key={step.title}
                          className="flex items-center gap-3 rounded-xl border border-white/8 bg-white/7 p-3 backdrop-blur"
                        >
                          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/10 text-[10px] font-extrabold text-[#8ab9ff]">
                            {step.n}
                          </span>
                          <span className="text-sm font-bold">{step.title}</span>
                          {index < steps.length - 1 && (
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
      </div>
    </>
  );
}
