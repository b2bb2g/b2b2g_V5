import Link from "next/link";
import Image from "next/image";
import { getT } from "@/lib/i18n/server";
import { getVisibleMenus } from "@/lib/data/menus";
import { getSession } from "@/lib/data/session";
import { createClient } from "@/lib/supabase/server";
import { getPublicSettings, settingNumber } from "@/lib/data/settings";
import { postMediaUrl, videoThumbnail } from "@/lib/media";
import { Reveal } from "@/components/ui/Reveal";
import { Carousel } from "@/components/ui/Carousel";
import { BadgePill } from "@/components/ui/Badge";
import { StatusLabel } from "@/components/ui/StatusLabel";
import { EmptyState } from "@/components/ui/EmptyState";
import { BOARD_TYPES, SETTING_KEYS } from "@/lib/constants";
import { stripRichText } from "@/lib/richtext";
import type { Dictionary } from "@/lib/i18n";
import type { Menu, PostTeaser } from "@/lib/types";

// Storefront data: new products, latest requests, event posts, featured
// companies (paid exposure, PRD 5.3 -- slot count is an admin setting),
// and recently joined companies.
async function getStorefront(eventsMenuId: string | null, featuredSlots: number) {
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
          .limit(3)
      : Promise.resolve({ data: [] }),
    supabase
      .from("mini_homepages")
      .select("slug, cover_image_path, intro_en, intro_ko, profiles(display_name, company_name)")
      .eq("is_published", true)
      .order("updated_at", { ascending: false })
      .limit(featuredSlots),
    supabase
      .from("profiles")
      .select("uid, display_name, company_name, avatar_url, created_at, member_badges(badge_types(code, name_en, name_ko))")
      .not("company_name", "is", null)
      .order("created_at", { ascending: false })
      .limit(8),
  ]);

  return {
    products: (products.data as PostTeaser[]) ?? [],
    requests: (requests.data as PostTeaser[]) ?? [],
    events: (events.data as PostTeaser[]) ?? [],
    featured: ((featured.data ?? []) as unknown as {
      slug: string;
      cover_image_path: string | null;
      intro_en: string;
      intro_ko: string | null;
      profiles: { display_name: string | null; company_name: string | null } | null;
    }[]),
    companies: ((companies.data ?? []) as unknown as {
      uid: number;
      display_name: string | null;
      company_name: string | null;
      avatar_url: string | null;
      created_at: string;
      member_badges: {
        badge_types: { code: string; name_en: string; name_ko: string } | null;
      }[];
    }[]),
  };
}

function thumbnailOf(post: PostTeaser): string | null {
  if (post.rep_image_path) return postMediaUrl(post.rep_image_path);
  if (post.rep_video_url) return videoThumbnail(post.rep_video_url);
  return null;
}

// Development-only wireframe cards: empty sections stay visible so the
// layout can be previewed before real content exists. Hidden in production.
const SHOW_WIREFRAMES = process.env.NODE_ENV === "development";

function WireframeMedia() {
  return (
    <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-ink-faint/40" aria-hidden="true">
      <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
      <circle cx="9" cy="9" r="2" />
      <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
    </svg>
  );
}

function WireframeCard({ aspect = "aspect-square" }: { aspect?: string }) {
  return (
    <div className="card overflow-hidden border-dashed">
      <div className={`${aspect} flex items-center justify-center bg-surface-sub/70`}>
        <WireframeMedia />
      </div>
      <div className="space-y-2 p-3">
        <div className="h-3.5 w-4/5 rounded bg-surface-sub" />
        <div className="h-3 w-3/5 rounded bg-surface-sub" />
      </div>
    </div>
  );
}

function WireframeRow() {
  return (
    <div className="card space-y-2.5 border-dashed p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="h-3.5 w-1/2 rounded bg-surface-sub" />
        <div className="h-5 w-16 rounded-md bg-surface-sub" />
      </div>
      <div className="h-3 w-4/5 rounded bg-surface-sub" />
      <div className="h-3 w-2/3 rounded bg-surface-sub" />
    </div>
  );
}

function ProductCard({
  post,
  href,
  locale,
}: {
  post: PostTeaser;
  href: string;
  locale: string;
}) {
  const thumb = thumbnailOf(post);
  return (
    <Link href={href} className="card-hover group block overflow-hidden">
      <div className="relative aspect-square bg-surface-sub">
        {thumb && (
          <Image
            src={thumb}
            alt={post.title_en}
            fill
            sizes="(max-width: 640px) 50vw, 25vw"
            className="object-cover transition-transform duration-300 group-hover:scale-[1.04]"
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
}

function SectionHeader({
  title,
  href,
  viewAll,
}: {
  title: string;
  href: string;
  viewAll: string;
}) {
  return (
    <div className="flex items-end justify-between">
      <h2 className="text-xl font-extrabold tracking-tight sm:text-2xl">{title}</h2>
      <Link
        href={href}
        className="flex items-center gap-0.5 text-sm font-semibold text-primary hover:text-primary-strong"
      >
        {viewAll}
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="m9 18 6-6-6-6" />
        </svg>
      </Link>
    </div>
  );
}

function HeroVisual({ t }: { t: Dictionary }) {
  return (
    <div className="relative mx-auto w-full max-w-md">
      <div className="card overflow-hidden shadow-(--shadow-float)">
        <div className="flex aspect-[4/3] items-center justify-center bg-primary-soft">
          <svg width="72" height="72" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" className="text-primary/50" aria-hidden="true">
            <path d="M2 20a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V8l-7 5V8l-7 5V4a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z" />
            <path d="M17 18h1" />
            <path d="M12 18h1" />
            <path d="M7 18h1" />
          </svg>
        </div>
        <div className="space-y-2 p-4">
          <p className="text-sm font-bold">{t.home.mockProduct}</p>
          <p className="text-xs text-ink-faint">{t.home.mockCompany}</p>
          <div className="flex gap-1.5 pt-1">
            <BadgePill code="manufacturer" label={t.badges.manufacturer} />
            <BadgePill code="certified" label={t.badges.certified} />
          </div>
          <div className="btn-primary btn-md pointer-events-none mt-2 w-full">
            {t.post.inquire}
          </div>
        </div>
      </div>
      <div className="animate-float absolute -right-5 bottom-24 hidden sm:block">
        <div className="card flex items-center gap-2 px-3 py-2 shadow-(--shadow-float)">
          <StatusLabel
            status="answer_delivered"
            label={t.inquiry.steps.answer_delivered}
          />
        </div>
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

  const eventsMenu = menus.find((menu) => menu.board_type === BOARD_TYPES.FLEXIBLE) ?? null;
  const requestsMenu = menus.find((menu) => menu.board_type === BOARD_TYPES.REQUEST) ?? null;
  const { products, requests, events, featured, companies } = await getStorefront(
    eventsMenu?.id ?? null,
    settingNumber(settings, SETTING_KEYS.FEATURED_SLOTS, 6)
  );

  const menuSlugById = new Map<string, string>(menus.map((menu: Menu) => [menu.id, menu.slug]));
  const firstProductBoard =
    menus.find((menu) => menu.board_type === BOARD_TYPES.PRODUCT)?.slug ?? "industrial";
  const stats = [t.home.stat1, t.home.stat2, t.home.stat3];
  const steps = [
    { title: t.home.step1Title, body: t.home.step1Body },
    { title: t.home.step2Title, body: t.home.step2Body },
    { title: t.home.step3Title, body: t.home.step3Body },
  ];
  const values = [
    { title: t.home.value1Title, body: t.home.value1Body },
    { title: t.home.value2Title, body: t.home.value2Body },
    { title: t.home.value3Title, body: t.home.value3Body },
  ];
  const container = "mx-auto w-full max-w-6xl px-4 sm:px-6";

  return (
    <div className="full-bleed">
      {/* ============ Hero ============ */}
      <section className="relative overflow-hidden border-b border-line bg-gradient-to-b from-primary-soft/60 via-surface to-surface">
        <div className={`${container} grid items-center gap-10 py-12 sm:py-16 lg:grid-cols-2 lg:gap-14 lg:py-20`}>
          <div className="animate-fade-up text-center lg:text-left">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">
              {t.home.eyebrow}
            </p>
            <h1 className="mt-4 text-[2rem] font-extrabold leading-[1.2] tracking-tight sm:text-5xl sm:leading-[1.15]">
              {t.home.heroTitle}
            </h1>
            <p className="mx-auto mt-5 max-w-md text-sm leading-relaxed text-ink-soft sm:text-base lg:mx-0">
              {t.home.heroSubtitle}
            </p>
            <div className="mt-8 flex flex-col justify-center gap-2.5 sm:flex-row lg:justify-start">
              <Link href={`/${firstProductBoard}`} className="btn-primary btn-lg">
                {t.home.browseBoards}
              </Link>
              {requestsMenu && (
                <Link href={`/${requestsMenu.slug}`} className="btn-secondary btn-lg">
                  {t.home.browseRequests}
                </Link>
              )}
            </div>
            <ul className="mt-9 flex flex-wrap justify-center gap-x-6 gap-y-2 lg:justify-start">
              {stats.map((stat) => (
                <li key={stat} className="flex items-center gap-1.5 text-xs font-semibold text-ink-soft">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-positive" aria-hidden="true">
                    <path d="M20 6 9 17l-5-5" />
                  </svg>
                  {stat}
                </li>
              ))}
            </ul>
          </div>
          <div className="animate-fade-up" style={{ animationDelay: "0.15s" }}>
            <HeroVisual t={t} />
          </div>
        </div>
      </section>

      {/* ============ New arrivals (storefront) ============ */}
      {(products.length > 0 || SHOW_WIREFRAMES) && (
        <section className={`${container} py-14 sm:py-20`}>
          <Reveal>
            <SectionHeader
              title={t.home.newProducts}
              href={`/${firstProductBoard}`}
              viewAll={t.dashboard.viewAll}
            />
          </Reveal>
          <div className="mt-6 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
            {products.length > 0
              ? products.map((post, i) => (
                  <Reveal key={post.id} delay={(i % 4) * 60}>
                    <ProductCard
                      post={post}
                      href={`/${menuSlugById.get(post.menu_id) ?? firstProductBoard}/${post.id}`}
                      locale={locale}
                    />
                  </Reveal>
                ))
              : Array.from({ length: 8 }).map((_, i) => (
                  <WireframeCard key={i} />
                ))}
          </div>
        </section>
      )}

      {/* ============ New companies ============ */}
      {(companies.length > 0 || SHOW_WIREFRAMES) && (
        <section className="border-y border-line bg-surface-sub/50">
          <div className={`${container} py-14 sm:py-20`}>
            <Reveal>
              <h2 className="text-xl font-extrabold tracking-tight sm:text-2xl">
                {t.home.newCompanies}
              </h2>
            </Reveal>
            <div className="mt-6 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
              {companies.length === 0 &&
                Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="card flex items-center gap-3 border-dashed p-4">
                    <span className="h-11 w-11 shrink-0 rounded-full bg-surface-sub" />
                    <div className="min-w-0 flex-1 space-y-2">
                      <div className="h-3.5 w-3/4 rounded bg-surface-sub" />
                      <div className="h-3 w-1/2 rounded bg-surface-sub" />
                    </div>
                  </div>
                ))}
              {companies.map((company, i) => {
                const name =
                  company.company_name ?? company.display_name ?? `UID ${company.uid}`;
                const badges = company.member_badges
                  .map((b) => b.badge_types)
                  .filter((x): x is { code: string; name_en: string; name_ko: string } => !!x);
                return (
                  <Reveal key={company.uid} delay={(i % 4) * 60}>
                    <Link
                      href={`/u/${company.uid}`}
                      className="card-hover flex items-center gap-3 p-4"
                    >
                      {company.avatar_url ? (
                        <Image
                          src={postMediaUrl(company.avatar_url)}
                          alt={name}
                          width={44}
                          height={44}
                          className="h-11 w-11 shrink-0 rounded-full object-cover"
                        />
                      ) : (
                        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary-soft text-base font-extrabold text-primary-strong">
                          {name.slice(0, 1).toUpperCase()}
                        </span>
                      )}
                      <div className="min-w-0">
                        <p className="truncate text-sm font-bold">{name}</p>
                        <div className="mt-0.5 flex flex-wrap gap-1">
                          {badges.length > 0 ? (
                            badges.slice(0, 2).map((b) => (
                              <BadgePill
                                key={b.code}
                                code={b.code}
                                label={locale === "ko" ? b.name_ko : b.name_en}
                              />
                            ))
                          ) : (
                            <span className="text-xs text-ink-faint">
                              {new Date(company.created_at).toISOString().slice(0, 10)}
                            </span>
                          )}
                        </div>
                      </div>
                    </Link>
                  </Reveal>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* ============ Events ============ */}
      {eventsMenu && (
        <section className={`${container} py-14 sm:py-20`}>
          <Reveal>
            <SectionHeader
              title={t.home.eventsTitle}
              href={`/${eventsMenu.slug}`}
              viewAll={t.dashboard.viewAll}
            />
          </Reveal>
          <div className="mt-6">
            {events.length === 0 && SHOW_WIREFRAMES ? (
              <div className="grid gap-4 sm:grid-cols-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <WireframeCard key={i} aspect="aspect-video" />
                ))}
              </div>
            ) : events.length === 0 ? (
              <EmptyState title={t.common.emptyList} hint={t.common.emptyListHint} />
            ) : (
              <div className="grid gap-4 sm:grid-cols-3">
                {events.map((post, i) => {
                  const thumb = thumbnailOf(post);
                  return (
                    <Reveal key={post.id} delay={i * 80}>
                      <Link
                        href={`/${eventsMenu.slug}/${post.id}`}
                        className="card-hover group block overflow-hidden"
                      >
                        <div className="relative aspect-video bg-surface-sub">
                          {thumb && (
                            <Image
                              src={thumb}
                              alt={post.title_en}
                              fill
                              sizes="(max-width: 640px) 100vw, 33vw"
                              className="object-cover transition-transform duration-300 group-hover:scale-[1.04]"
                            />
                          )}
                        </div>
                        <div className="p-4">
                          <p className="line-clamp-2 text-sm font-bold leading-snug">
                            {locale === "ko" && post.title_ko ? post.title_ko : post.title_en}
                          </p>
                          <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-ink-soft">
                            {stripRichText(
                              locale === "ko" && post.body_teaser_ko
                                ? post.body_teaser_ko
                                : post.body_teaser_en
                            )}
                          </p>
                        </div>
                      </Link>
                    </Reveal>
                  );
                })}
              </div>
            )}
          </div>
        </section>
      )}

      {/* ============ Latest sourcing requests ============ */}
      {requestsMenu && (requests.length > 0 || SHOW_WIREFRAMES) && (
        <section className="border-y border-line bg-surface-sub/50">
          <div className={`${container} py-14 sm:py-20`}>
            <Reveal>
              <SectionHeader
                title={t.home.latestRequests}
                href={`/${requestsMenu.slug}`}
                viewAll={t.dashboard.viewAll}
              />
            </Reveal>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {requests.length === 0 &&
                Array.from({ length: 4 }).map((_, i) => <WireframeRow key={i} />)}
              {requests.map((post, i) => (
                <Reveal key={post.id} delay={(i % 2) * 70}>
                  <Link
                    href={`/${requestsMenu.slug}/${post.id}`}
                    className="card-hover block p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <p className="line-clamp-1 text-sm font-bold leading-snug">
                        {locale === "ko" && post.title_ko ? post.title_ko : post.title_en}
                      </p>
                      <StatusLabel
                        status={post.status === "closed" ? "closed" : "approved"}
                        label={
                          post.status === "closed"
                            ? t.post.closed
                            : post.deadline
                              ? `${t.post.deadline} ${post.deadline}`
                              : t.post.openEnded
                        }
                      />
                    </div>
                    <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-ink-soft">
                      {stripRichText(
                        locale === "ko" && post.body_teaser_ko
                          ? post.body_teaser_ko
                          : post.body_teaser_en
                      )}
                    </p>
                  </Link>
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ============ Featured companies ============ */}
      {(featured.length > 0 || SHOW_WIREFRAMES) && (
        <section className={`${container} py-14 sm:py-20`}>
          <Reveal>
            <h2 className="text-xl font-extrabold tracking-tight sm:text-2xl">
              {t.home.featured}
            </h2>
          </Reveal>
          <div className="mt-8">
            <Carousel prevLabel={t.home.prev} nextLabel={t.home.next}>
              {featured.length === 0 &&
                Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="w-64 shrink-0 snap-start sm:w-72">
                    <WireframeCard aspect="aspect-video" />
                  </div>
                ))}
              {featured.map((company) => {
                const name =
                  company.profiles?.company_name ??
                  company.profiles?.display_name ??
                  company.slug;
                const intro =
                  locale === "ko" && company.intro_ko ? company.intro_ko : company.intro_en;
                return (
                  <Link
                    key={company.slug}
                    href={`/c/${company.slug}`}
                    className="card-hover w-64 shrink-0 snap-start overflow-hidden sm:w-72"
                  >
                    <div className="relative aspect-video bg-surface-sub">
                      {company.cover_image_path && (
                        <Image
                          src={postMediaUrl(company.cover_image_path)}
                          alt={name}
                          fill
                          sizes="288px"
                          className="object-cover"
                        />
                      )}
                    </div>
                    <div className="p-4">
                      <p className="truncate text-sm font-bold">{name}</p>
                      <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-ink-soft">
                        {intro}
                      </p>
                    </div>
                  </Link>
                );
              })}
            </Carousel>
          </div>
        </section>
      )}

      {/* ============ Trust + How it works ============ */}
      <section className={`${container} py-14 sm:py-20`}>
        <Reveal>
          <h2 className="text-center text-xl font-extrabold tracking-tight sm:text-2xl">
            {t.home.valueTitle}
          </h2>
        </Reveal>
        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          {values.map((value, i) => (
            <Reveal key={value.title} delay={i * 80}>
              <div className="card-hover h-full p-6 text-center">
                <p className="text-base font-bold">{value.title}</p>
                <p className="mt-1.5 text-sm leading-relaxed text-ink-soft">
                  {value.body}
                </p>
              </div>
            </Reveal>
          ))}
        </div>

        <div className="relative mt-16 grid gap-8 sm:grid-cols-3 sm:gap-6">
          <span className="absolute left-1/2 top-5 hidden h-px w-2/3 -translate-x-1/2 bg-line sm:block" aria-hidden="true" />
          {steps.map((step, i) => (
            <Reveal key={step.title} delay={i * 100}>
              <div className="relative text-center">
                <span className="relative z-10 mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-primary text-sm font-extrabold text-white shadow-(--shadow-card)">
                  {i + 1}
                </span>
                <p className="mt-4 text-base font-bold">{step.title}</p>
                <p className="mx-auto mt-1.5 max-w-60 text-sm leading-relaxed text-ink-soft">
                  {step.body}
                </p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ============ Membership promo ============ */}
      <section className={`${container} pb-14 sm:pb-20`}>
        <Reveal>
          <div className="overflow-hidden rounded-card bg-primary px-6 py-10 text-center sm:px-12 sm:py-12 lg:flex lg:items-center lg:justify-between lg:text-left">
            <div>
              <h2 className="text-xl font-extrabold tracking-tight text-white sm:text-2xl">
                {t.home.promoTitle}
              </h2>
              <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-white/80 lg:mx-0">
                {t.home.promoBody}
              </p>
            </div>
            <Link
              href="/membership"
              className="btn btn-lg mt-6 shrink-0 bg-white text-primary-strong hover:bg-white/90 lg:mt-0"
            >
              {t.home.promoCta}
            </Link>
          </div>
        </Reveal>
      </section>

      {/* ============ Final CTA ============ */}
      {!session.userId && (
        <section className="border-t border-line bg-ink">
          <div className={`${container} py-14 text-center sm:py-20`}>
            <Reveal>
              <h2 className="text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
                {t.home.finalCtaTitle}
              </h2>
              <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-white/70">
                {t.home.finalCtaBody}
              </p>
              <Link
                href="/signup"
                className="btn btn-lg mt-8 bg-white text-ink hover:bg-white/90"
              >
                {t.common.signUp}
              </Link>
            </Reveal>
          </div>
        </section>
      )}
    </div>
  );
}
