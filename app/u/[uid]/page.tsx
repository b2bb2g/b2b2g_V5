import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { getT } from "@/lib/i18n/server";
import { getSession } from "@/lib/data/session";
import { getVisibleMenus } from "@/lib/data/menus";
import { createClient } from "@/lib/supabase/server";
import { BadgePill } from "@/components/ui/Badge";
import { ProductCard } from "@/components/marketplace/ProductCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { BOARD_TYPES } from "@/lib/constants";
import { postMediaUrl } from "@/lib/media";
import { listFeed } from "@/lib/data/feed";
import { FeedCard } from "@/components/feed/FeedCard";
import { getFeedCardLabels } from "@/lib/i18n/feed";
import { DefaultAvatar } from "@/components/profile/DefaultAvatar";
import { BoardSectionHeading } from "@/components/marketplace/BoardSectionHeading";
import { Carousel } from "@/components/ui/Carousel";
import { OpportunityCard } from "@/components/landing/OpportunityCard";
import { EventCard } from "@/components/marketplace/EventCard";
import type { Metadata } from "next";
import type { PostTeaser } from "@/lib/types";

// Public member profile (DESIGN C2): UID, badges, public posts. Never any
// contact details (PRD 9) — the inquiry button is the only contact path.
async function getPublicProfile(uid: number) {
  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("id, uid, bio, bio_en, bio_ko, avatar_url, created_at")
    .eq("uid", uid)
    .maybeSingle();
  if (!profile) return null;

  const [{ data: badges }, { data: homepage }, { data: posts }] =
    await Promise.all([
      supabase
        .from("member_badges")
        .select("badge_types(code, name_en, name_ko)")
        .eq("profile_id", profile.id),
      supabase
        .from("mini_homepages")
        .select("slug")
        .eq("profile_id", profile.id)
        .eq("is_published", true)
        .maybeSingle(),
      supabase
        .from("public_posts")
        .select("*")
        .eq("author_uid", profile.uid)
        .order("published_at", { ascending: false })
        .limit(24),
    ]);

  return {
    profile,
    badges: (badges ?? [])
      .map(
        (b) =>
          (
            b as unknown as {
              badge_types: {
                code: string;
                name_en: string;
                name_ko: string;
              } | null;
            }
          ).badge_types,
      )
      .filter(
        (x): x is { code: string; name_en: string; name_ko: string } => !!x,
      ),
    homepageSlug: homepage?.slug ?? null,
    posts: (posts as PostTeaser[]) ?? [],
  };
}

export async function generateMetadata(props: {
  params: Promise<{ uid: string }>;
}): Promise<Metadata> {
  const { uid } = await props.params;
  const data = await getPublicProfile(Number(uid));
  if (!data) return {};
  const title = `UID:${uid}`;
  return {
    title,
    description: (data.profile.bio_en ?? data.profile.bio)?.slice(0, 160),
    alternates: { canonical: `/u/${uid}` },
  };
}

export default async function PublicProfilePage(props: {
  params: Promise<{ uid: string }>;
}) {
  const { uid } = await props.params;
  const parsedUid = Number(uid);
  if (!Number.isInteger(parsedUid) || parsedUid <= 0) notFound();

  const [{ t, locale }, session, data, menus, feedItems] = await Promise.all([
    getT(),
    getSession(),
    getPublicProfile(parsedUid),
    getVisibleMenus(),
    listFeed({ authorUid: parsedUid, limit: 6 }),
  ]);
  if (!data) notFound();

  const { profile, badges, homepageSlug, posts } = data;
  const name = `UID:${profile.uid}`;
  const publicBio =
    locale === "ko"
      ? (profile.bio_ko ?? profile.bio_en ?? profile.bio)
      : (profile.bio_en ?? profile.bio);
  const isOwn = session.userId === profile.id;
  const sections = menus
    .filter((menu) => menu.slug !== "notices")
    .map((menu) => ({
      menu,
      posts: posts.filter((post) => post.menu_id === menu.id),
    }))
    .filter((section) => section.posts.length > 0);
  const inquiryHref = session.userId
    ? `/inquiries/new?to=${profile.id}`
    : `/login?next=/inquiries/new?to=${profile.id}`;
  const eventCardLabels = {
    ongoing: t.board.eventNowOn,
    upcoming: t.board.eventUpcomingLabel,
    ended: t.board.eventEnded,
    venueTbd: t.board.eventVenueTbd,
  };
  const opportunityLabels = {
    open: t.post.open,
    closed: t.post.closed,
    openEnded: t.post.openEnded,
    deadline: t.post.deadline,
    sourcingRequest: t.post.sourcingRequest,
  };

  return (
    <article className="full-bleed bg-white">
      <section className="px-4 py-8 sm:px-0 sm:py-12 lg:py-16">
        <div className="store-shell">
          <header className="overflow-hidden rounded-[2rem] bg-white shadow-[0_24px_80px_rgba(25,31,40,.1)] ring-1 ring-black/[.04]">
            <div className="grid lg:grid-cols-[minmax(0,1.35fr)_minmax(20rem,.65fr)]">
              <div className="relative overflow-hidden p-7 sm:p-10 lg:p-12">
                <span
                  className="absolute -left-28 -top-32 h-72 w-72 rounded-full bg-[#ddecff] blur-3xl"
                  aria-hidden="true"
                />
                <span
                  className="absolute -bottom-32 right-12 h-64 w-64 rounded-full bg-[#e7f7ee] blur-3xl"
                  aria-hidden="true"
                />
                <div className="relative">
                  <p className="text-xs font-bold uppercase tracking-[.18em] text-primary">
                    {t.profile.networkEyebrow}
                  </p>
                  <div className="mt-6 flex items-center gap-4 sm:gap-6">
                    {profile.avatar_url ? (
                      <Image
                        src={postMediaUrl(profile.avatar_url)}
                        alt=""
                        width={112}
                        height={112}
                        priority
                        className="h-24 w-24 shrink-0 rounded-full object-cover shadow-[0_12px_30px_rgba(25,31,40,.12)] ring-4 ring-white sm:h-28 sm:w-28"
                      />
                    ) : (
                      <DefaultAvatar className="h-24 w-24 shrink-0 shadow-[0_12px_30px_rgba(25,31,40,.12)] ring-4 ring-white sm:h-28 sm:w-28" />
                    )}
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-ink-faint">
                        {t.profile.profileOverview}
                      </p>
                      <h1 className="mt-1 text-[2rem] font-semibold leading-none tracking-[-.045em] text-ink sm:text-[2.75rem]">
                        {name}
                      </h1>
                      {badges.length > 0 && (
                        <div className="mt-4 flex flex-wrap gap-1.5">
                          {badges.map((badge) => (
                            <BadgePill
                              key={badge.code}
                              code={badge.code}
                              label={
                                locale === "ko"
                                  ? badge.name_ko
                                  : badge.name_en
                              }
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <p className="mt-8 max-w-3xl whitespace-pre-wrap text-base leading-8 text-ink-soft sm:text-lg">
                    {publicBio || t.profile.publicMemberHint}
                  </p>

                  {sections.length > 0 && (
                    <nav
                      aria-label={t.profile.memberActivity}
                      className="scrollbar-none -mx-2 mt-7 flex gap-2 overflow-x-auto px-2"
                    >
                      {sections.map(({ menu }) => (
                        <a
                          key={menu.id}
                          href={`#activity-${menu.slug}`}
                          className="shrink-0 rounded-full border border-line bg-white/80 px-4 py-2 text-xs font-bold text-ink-soft shadow-sm backdrop-blur transition hover:border-primary/35 hover:text-primary"
                        >
                          {locale === "ko" ? menu.title_ko : menu.title_en}
                        </a>
                      ))}
                    </nav>
                  )}
                </div>
              </div>

              <aside className="relative flex min-h-80 flex-col overflow-hidden bg-[#101923] p-7 text-white sm:p-10 lg:p-12">
                <span
                  className="absolute -right-24 -top-28 h-72 w-72 rounded-full border-[48px] border-primary/18"
                  aria-hidden="true"
                />
                <span
                  className="relative flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-white shadow-[0_12px_28px_rgba(34,108,224,.3)]"
                  aria-hidden="true"
                >
                  <svg
                    viewBox="0 0 24 24"
                    className="h-6 w-6"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M7 4h10a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-5l-4 3v-3H7a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z" />
                    <path d="M8.5 8.5h7M8.5 12h4.5" />
                  </svg>
                </span>
                <div className="relative mt-8">
                  <h2 className="max-w-sm text-3xl font-semibold leading-[1.08] tracking-[-.04em]">
                    {t.profile.businessConversation}
                  </h2>
                  <p className="mt-4 max-w-md text-sm leading-7 text-white/62">
                    {t.profile.businessConversationHint}
                  </p>
                  <p className="mt-4 flex items-center gap-2 text-xs font-semibold text-[#8bc0ff]">
                    <span
                      className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/25"
                      aria-hidden="true"
                    >
                      ✓
                    </span>
                    {t.profile.protectedContact}
                  </p>
                </div>
                <div className="relative mt-auto flex flex-col gap-2 pt-9">
                  {!isOwn ? (
                    <Link href={inquiryHref} className="btn-primary btn-lg w-full">
                      {t.post.inquire}
                    </Link>
                  ) : (
                    <Link href="/dashboard" className="btn-primary btn-lg w-full">
                      {t.common.dashboard}
                    </Link>
                  )}
                  {isOwn && (
                    <Link
                      href="/dashboard/profile/edit"
                      className="inline-flex min-h-12 items-center justify-center rounded-xl bg-white/10 px-5 text-sm font-bold text-white transition hover:bg-white/16"
                    >
                      {t.common.edit}
                    </Link>
                  )}
                  {homepageSlug && (
                    <Link
                      href={`/c/${homepageSlug}`}
                      className="inline-flex min-h-12 items-center justify-center rounded-xl bg-white/10 px-5 text-sm font-bold text-white transition hover:bg-white/16"
                    >
                      {t.profile.viewCompanyPage}
                    </Link>
                  )}
                </div>
              </aside>
            </div>
          </header>
        </div>
      </section>

      {(feedItems.length > 0 || isOwn) && (
        <section className="bg-[#f5f5f7] py-20 sm:py-24 lg:py-28">
          <div className="store-shell">
            <BoardSectionHeading
              eyebrow={t.feed.title}
              title={t.profile.latestUpdates}
              body={t.profile.latestUpdatesHint}
              action={
                <Link
                  href="/feed"
                  className="text-sm font-bold text-primary transition hover:text-primary-strong"
                >
                  {isOwn ? t.feed.publish : t.dashboard.viewAll} →
                </Link>
              }
            />
            {feedItems.length > 0 ? (
              <div className="mt-10 lg:mt-12">
                <Carousel
                  prevLabel={t.home.prev}
                  nextLabel={t.home.next}
                  edgeToEdge
                >
                  {feedItems.slice(0, 6).map((item) => (
                    <div key={item.id} className="store-card-network">
                      <FeedCard
                        item={item}
                        viewerId={session.userId}
                        returnTo={`/u/${profile.uid}`}
                        compact
                        className="store-card-interactive flex h-full flex-col"
                        labels={getFeedCardLabels(t, locale)}
                      />
                    </div>
                  ))}
                </Carousel>
              </div>
            ) : (
              <div className="mt-10 rounded-[1.75rem] border border-dashed border-line bg-white p-8 text-center">
                <p className="text-sm font-bold">{t.feed.empty}</p>
                <Link href="/feed" className="btn-primary btn-md mt-4">
                  {t.feed.publish}
                </Link>
              </div>
            )}
            <div className="mt-7 sm:hidden">
              <Link href="/feed" className="text-sm font-bold text-primary">
                {isOwn ? t.feed.publish : t.dashboard.viewAll} →
              </Link>
            </div>
          </div>
        </section>
      )}

      {sections.length > 0 ? (
        sections.map(({ menu, posts: menuPosts }, sectionIndex) => {
          const isEventSection = menu.slug === "events";
          const cardClass =
            menu.board_type === BOARD_TYPES.REQUEST
              ? "store-card-featured"
              : isEventSection
                ? "store-card-calendar"
                : "store-card-collection-item";

          return (
            <section
              key={menu.id}
              id={`activity-${menu.slug}`}
              className={`scroll-mt-24 py-20 sm:py-24 lg:py-28 ${
                sectionIndex % 2 === 0 ? "bg-white" : "bg-[#f5f5f7]"
              }`}
            >
              <div className="store-shell">
                <BoardSectionHeading
                  eyebrow={t.profile.memberActivity}
                  title={locale === "ko" ? menu.title_ko : menu.title_en}
                  body={t.profile.activityHint}
                  action={
                    <Link
                      href={`/${menu.slug}?uid=${profile.uid}`}
                      className="text-sm font-bold text-primary transition hover:text-primary-strong"
                    >
                      {t.dashboard.viewAll} →
                    </Link>
                  }
                />
                <div className="mt-10 lg:mt-12">
                  <Carousel
                    prevLabel={t.home.prev}
                    nextLabel={t.home.next}
                    edgeToEdge
                  >
                    {menuPosts.slice(0, 8).map((post, index) => (
                      <div key={post.id} className={cardClass}>
                        {menu.board_type === BOARD_TYPES.REQUEST ? (
                          <OpportunityCard
                            post={post}
                            href={`/${menu.slug}/${post.id}`}
                            locale={locale}
                            labels={opportunityLabels}
                          />
                        ) : isEventSection ? (
                          <EventCard
                            post={post}
                            href={`/${menu.slug}/${post.id}`}
                            locale={locale}
                            labels={eventCardLabels}
                            priority={index < 2}
                            feature
                          />
                        ) : (
                          <ProductCard
                            post={post}
                            href={`/${menu.slug}/${post.id}`}
                            locale={locale}
                            priority={index < 3}
                            showAuthor={false}
                            feature
                            compactFeature
                          />
                        )}
                      </div>
                    ))}
                  </Carousel>
                </div>
                <div className="mt-7 sm:hidden">
                  <Link
                    href={`/${menu.slug}?uid=${profile.uid}`}
                    className="text-sm font-bold text-primary"
                  >
                    {t.dashboard.viewAll} →
                  </Link>
                </div>
              </div>
            </section>
          );
        })
      ) : (
        <section className="bg-[#f5f5f7] py-20 sm:py-24 lg:py-28">
          <div className="store-shell">
            <BoardSectionHeading
              eyebrow={t.profile.memberActivity}
              title={t.profile.profileOverview}
              body={t.profile.activityHint}
            />
            <div className="mt-10">
              <EmptyState
                title={t.common.emptyList}
                hint={t.common.emptyListHint}
              />
            </div>
          </div>
        </section>
      )}
    </article>
  );
}
