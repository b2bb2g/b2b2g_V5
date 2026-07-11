import Image from "next/image";
import Link from "next/link";
import { BadgePill } from "@/components/ui/Badge";
import { Reveal } from "@/components/ui/Reveal";
import { StatusLabel } from "@/components/ui/StatusLabel";
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
import type { Dictionary } from "@/lib/i18n";
import type { Menu, PostTeaser } from "@/lib/types";

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

function HeroVisual({ t }: { t: Dictionary }) {
  return (
    <div className="relative mx-auto w-full max-w-2xl lg:mx-0">
      <div className="relative aspect-[4/3] overflow-hidden rounded-[2rem] border border-white/10 bg-white/5 shadow-[0_36px_100px_rgba(0,0,0,.38)]">
        <Image
          src="/brand/trade-network-hero.png"
          alt=""
          fill
          priority
          sizes="(max-width:1024px) 100vw, 50vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#101923]/80 via-transparent to-white/5" />
        <div className="absolute inset-x-4 bottom-4 rounded-2xl border border-white/15 bg-[#172331]/80 p-4 text-white backdrop-blur-xl sm:inset-x-6 sm:bottom-6 sm:flex sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[.15em] text-primary">
              {t.home.proofLabel}
            </p>
            <p className="mt-2 text-base font-extrabold">
              {t.home.mockProduct}
            </p>
            <p className="mt-1 text-xs text-white/55">{t.home.mockCompany}</p>
          </div>
          <span className="mt-4 inline-flex items-center gap-2 rounded-full bg-positive/20 px-3 py-1.5 text-xs font-bold text-[#7ee2b8] sm:mt-0">
            <span className="h-1.5 w-1.5 rounded-full bg-[#7ee2b8]" />
            {t.home.stat1}
          </span>
        </div>
      </div>
      <div className="absolute -right-2 top-8 hidden rounded-2xl border border-white/10 bg-white/10 p-3 text-white shadow-2xl backdrop-blur-xl sm:block">
        <StatusLabel
          status="answer_delivered"
          label={t.inquiry.steps.answer_delivered}
        />
      </div>
    </div>
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
  const { products, requests, events, featured, companies } =
    await getStorefront(
      eventsMenu?.id ?? null,
      settingNumber(settings, SETTING_KEYS.FEATURED_SLOTS, 6),
    );
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

      <section className="relative bg-[#111a24] text-white">
        <div className="absolute inset-0 opacity-80 [background:radial-gradient(circle_at_15%_15%,rgba(49,130,246,.34),transparent_32%),radial-gradient(circle_at_85%_75%,rgba(49,130,246,.13),transparent_28%)]" />
        <div
          className={`${container} relative grid min-h-[720px] items-center gap-14 py-20 lg:grid-cols-[.92fr_1.08fr] lg:gap-20 lg:py-28`}
        >
          <div className="animate-fade-up text-center lg:text-left">
            <p className="text-xs font-bold uppercase tracking-[.22em] text-[#6ea8ff]">
              {t.home.eyebrow}
            </p>
            <h1 className="mx-auto mt-5 max-w-3xl text-[2.7rem] font-extrabold leading-[1.08] tracking-[-.045em] sm:text-6xl lg:mx-0 lg:text-[4.4rem]">
              {t.home.heroTitle}
            </h1>
            <p className="mx-auto mt-6 max-w-xl text-base leading-7 text-white/64 lg:mx-0">
              {t.home.heroSubtitle}
            </p>
            <form
              action="/search"
              className="mx-auto mt-9 flex max-w-xl items-center rounded-2xl border border-white/12 bg-white p-2 shadow-2xl lg:mx-0"
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
            <div className="mt-8 flex flex-wrap justify-center gap-x-6 gap-y-3 lg:justify-start">
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
          <div className="animate-fade-up" style={{ animationDelay: ".12s" }}>
            <HeroVisual t={t} />
          </div>
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
          className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6"
          aria-label={t.home.boardsTitle}
        >
          {menus.slice(0, 6).map((menu, index) => (
            <Reveal key={menu.id} delay={index * 45}>
              <Link
                href={`/${menu.slug}`}
                className="group flex min-h-40 flex-col justify-between rounded-2xl border border-line bg-white p-5 transition hover:-translate-y-1 hover:border-primary/40 hover:shadow-(--shadow-float)"
              >
                <span className="text-xs font-extrabold text-primary">
                  0{index + 1}
                </span>
                <span className="flex items-end justify-between gap-3">
                  <strong className="text-sm leading-snug">
                    {menuTitle(menu, locale)}
                  </strong>
                  <span className="text-ink-faint group-hover:text-primary">
                    <Arrow />
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
            <div className="mt-10 grid grid-cols-2 gap-4 lg:grid-cols-4">
              {products.map((post, index) => (
                <Reveal key={post.id} delay={(index % 4) * 55}>
                  <ProductCard
                    post={post}
                    href={`/${menuSlugById.get(post.menu_id) ?? firstProductBoard}/${post.id}`}
                    locale={locale}
                    priority={index < 4}
                  />
                </Reveal>
              ))}
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

      <section className={`${container} py-24`}>
        <Reveal>
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-xs font-bold uppercase tracking-[.18em] text-primary">
              Trust infrastructure
            </p>
            <h2 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl">
              {t.home.valueTitle}
            </h2>
          </div>
        </Reveal>
        <div className="mt-12 grid gap-4 md:grid-cols-3">
          {values.map((value, i) => (
            <Reveal key={value.title} delay={i * 70}>
              <div className="h-full rounded-2xl border border-line p-7">
                <span className="text-xs font-extrabold text-primary">
                  {value.icon}
                </span>
                <h3 className="mt-10 text-lg font-extrabold">{value.title}</h3>
                <p className="mt-3 text-sm leading-7 text-ink-soft">
                  {value.body}
                </p>
              </div>
            </Reveal>
          ))}
        </div>
        {companies.length > 0 && (
          <div className="mt-16 border-t border-line pt-10">
            <p className="text-center text-xs font-bold uppercase tracking-[.16em] text-ink-faint">
              {t.home.newCompanies}
            </p>
            <div className="mt-7 flex flex-wrap justify-center gap-3">
              {companies.map((company) => {
                const name =
                  company.company_name ??
                  company.display_name ??
                  `UID ${company.uid}`;
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
          <div className="relative overflow-hidden rounded-[2rem] bg-primary px-6 py-12 text-center text-white shadow-[0_28px_70px_rgba(27,100,218,.24)] sm:px-12 lg:flex lg:items-center lg:justify-between lg:px-16 lg:text-left">
            <div className="absolute -right-20 -top-28 h-72 w-72 rounded-full border-[42px] border-white/7" />
            <div className="relative">
              <h2 className="text-2xl font-extrabold tracking-tight sm:text-3xl">
                {session.userId ? t.home.promoTitle : t.home.finalCtaTitle}
              </h2>
              <p className="mt-3 max-w-xl text-sm leading-7 text-white/72">
                {session.userId ? t.home.promoBody : t.home.finalCtaBody}
              </p>
            </div>
            <div className="relative mt-8 flex flex-col justify-center gap-3 sm:flex-row lg:mt-0">
              <Link
                href={session.userId ? "/membership" : "/signup"}
                className="btn btn-lg bg-white text-primary-strong hover:bg-white/90"
              >
                {session.userId ? t.home.promoCta : t.common.signUp}
              </Link>
              {!session.userId && (
                <Link
                  href="/login"
                  className="btn btn-lg border border-white/25 text-white hover:bg-white/10"
                >
                  {t.common.signIn}
                </Link>
              )}
            </div>
          </div>
        </Reveal>
      </section>
    </div>
  );
}
